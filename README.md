# SIPSniffer 📞
**Diagnóstico Automático de Anomalias SIP**

O SIPSniffer é uma aplicação web moderna projetada para analisar arquivos de captura de rede (`.pcap` ou `.pcapng`) e diagnosticar automaticamente problemas em fluxos de telefonia SIP. Ele cruza informações profundas do pacote (como IPs de origem/destino e cabeçalhos Contact) com o IP público da sua operadora para identificar configurações incorretas de NAT e falhas de comunicação bidirecional.

---

## 📂 Estrutura do Projeto

O projeto foi dividido em duas camadas principais que rodam de forma fluida no mesmo servidor:

- `backend/`: O "motor" da aplicação. Feito em **Python** utilizando o framework **FastAPI**. Ele usa a biblioteca `pyshark` (um *wrapper* do tshark/Wireshark) para destrinchar os pacotes SIP. Também utiliza SQLite para salvar os usuários locais com senhas protegidas por criptografia forte (`bcrypt`).
- `frontend/`: A interface do usuário. Construída com HTML puro, CSS e JavaScript sem dependências pesadas, adotando uma estética visual premium (Dark Mode e Glassmorphism) que impressiona no primeiro uso.
- `Dockerfile`: Arquivo de orquestração que configura o ambiente Linux (Ubuntu/Debian) instalando o Python e a ferramenta de rede `tshark` em um container isolado.

---

## 🚀 Como instalar (Easypanel)

O SIPSniffer foi desenhado para ser implantado ("Deploy") de forma quase 100% automatizada no **Easypanel** ou qualquer outro sistema de Docker, já que todo o código está neste repositório.

### Passo a Passo no Easypanel:
1. Acesse o painel do seu Easypanel.
2. Crie um novo **Project** (Projeto) e dentro dele adicione um **Service** (Serviço) do tipo **App**.
3. Na aba **Source** (Fonte), conecte a sua conta do GitHub e selecione este repositório: `GuilhermeAzespo/SIPSniffer`.
4. O Easypanel lerá automaticamente o arquivo `Dockerfile` na raiz do projeto.
5. Clique no botão **Deploy** (Implantar).
6. Aguarde a bolinha ficar **Verde** (Running) indicando que a compilação terminou. 
7. Vá na aba **Domains** para configurar a sua URL (ex: `sipsnifer.azespo.com.br`) e acessar a ferramenta.

### 🔑 Acesso Inicial (Administrador)
Para facilitar o primeiro acesso, o servidor do SIPSniffer injeta automaticamente o usuário administrador padrão no banco de dados na primeira vez que liga. 

Basta acessar o site implantado e usar:
- **Usuário:** `Usuario`
- **Senha:** `Senha`

*(Lembre-se de não utilizar aspas ao digitar a senha na interface visual).*

---

## 🛠️ Como usar a ferramenta

1. Após fazer o Login na plataforma, você verá o Dashboard de Análise.
2. No seu firewall (ex: Fortigate) ou PBX, exporte a captura de tráfego que está apresentando problemas de áudio mudo ou queda de ligação em formato `.pcap`.
3. Arraste o arquivo para dentro da área tracejada na tela do SIPSniffer.
4. O sistema irá vasculhar todas as sessões SIP contidas no pacote, lendo os metadados do `INVITE`, o cabeçalho `Contact` e medindo o número de `200 OK` retransmitidos.
5. Se o sistema detectar que o IP exposto no PBX está mascarado pelo IP local da rede ou divergente da operadora, ele emitirá um alerta visual indicando exatamente onde a regra de NAT precisa ser ajustada no Fortigate!
