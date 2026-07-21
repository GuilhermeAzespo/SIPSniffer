import pyshark
import os
import asyncio

def analyze_pcap(filepath: str):
    """
    Analyzes a PCAP file for SIP issues, specifically focusing on missing ACKs
    due to NAT misconfigurations.
    """
    try:
        # Create a new event loop for this thread to make pyshark happy
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Load PCAP and filter for SIP
        cap = pyshark.FileCapture(filepath, display_filter="sip")
        
        invites = {}
        ok_200s = {}
        acks = {}
        
        for pkt in cap:
            if not hasattr(pkt, 'sip'):
                continue
                
            # Extract basic SIP info
            sip = pkt.sip
            # Some packets have Method in Request-Line, responses have Status-Code and CSeq.method
            method = getattr(sip, 'Method', None)
            if not method:
                # Fallback to CSeq method for responses
                cseq_str = sip.get_field_value('CSeq')
                if cseq_str:
                    parts = cseq_str.split()
                    if len(parts) > 1:
                        method = parts[1]
                        
            status_code = getattr(sip, 'Status-Code', None)
            call_id = getattr(sip, 'Call-ID', None)
            
            if not call_id:
                continue
                
            if getattr(sip, 'Method', None) == 'INVITE' and not status_code:
                if call_id not in invites:
                    invites[call_id] = {
                        "src_ip": getattr(pkt.ip, 'src', 'Unknown'),
                        "dst_ip": getattr(pkt.ip, 'dst', 'Unknown'),
                        "request_uri": sip.get_field_value('Request-Line')
                    }
            elif status_code == '200' and method == 'INVITE':
                if call_id not in ok_200s:
                    ok_200s[call_id] = {
                        "contact": sip.get_field_value('Contact'),
                        "count": 1
                    }
                else:
                    ok_200s[call_id]["count"] += 1
            elif getattr(sip, 'Method', None) == 'ACK':
                acks[call_id] = True
                
        cap.close()
        
        issues = []
        for call_id, ok_info in ok_200s.items():
            # If 200 OK was sent multiple times and NO ACK was received, it's a NAT/Routing issue
            if call_id not in acks and ok_info["count"] > 1:
                invite_info = invites.get(call_id, {})
                issues.append({
                    "call_id": call_id,
                    "issue": "Falta de ACK (Possível Erro de NAT)",
                    "details": "O PABX enviou o 200 OK múltiplas vezes, mas não recebeu o ACK. A chamada provavelmente caiu em ~30s.",
                    "contact_header": ok_info.get("contact", "Desconhecido"),
                    "invite_uri": invite_info.get("request_uri", "Desconhecido"),
                    "provider_ip": invite_info.get("src_ip", "Desconhecido"),
                    "retransmissions": ok_info["count"]
                })
        
        return {"status": "success", "issues": issues, "total_calls_analyzed": len(invites)}
    except Exception as e:
        return {"status": "error", "message": str(e)}
