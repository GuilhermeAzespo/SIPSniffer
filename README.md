# SIPSniffer 🚀

O **SIPSniffer** é uma aplicação completa (Frontend + Backend) desenvolvida para diagnosticar problemas complexos de protocolo SIP de forma automática, com foco em falhas de comunicação causadas por configurações erradas de NAT e problemas de envio/recebimento do pacote ACK.

Através de uma interface web "Premium", basta fazer o upload de um arquivo `.pcap` ou `.pcapng` e o sistema analisará toda a árvore de pacotes para encontrar a causa raiz das chamadas mudas ou que caem em ~30 segundos.

---

## 🏗 Estrutura do Projeto

O projeto é monorepo, combinando o backend em Python (com FastAPI) e o frontend em HTML/JS puro para máxima performance e portabilidade, rodando perfeitamente dentro de um único container Docker.

```
SIPSniffer/
│
├── backend/                  # Código Fonte do Backend
│   ├── auth.py               # Lógica de autenticação e tokens JWT
│   ├── database.py           # Configuração do banco de dados SQLite (SQLAlchemy)
│   ├── main.py               # Rotas da API e configuração do FastAPI
│   ├── models.py             # Modelos de banco de dados (Tabela de Usuários)
│   ├── requirements.txt      # Dependências do Python (pyshark, fastapi, etc)
│   └── sip_analyzer.py       # O "Cérebro" que analisa os pacotes PCAP usando pyshark
│
├── frontend/                 # Código Fonte do Frontend (Vanilla JS + CSS Premium)
│   ├── app.js                # Lógica de comunicação com a API (Upload, Login)
│   ├── index.html            # Interface de usuário
│   └── style.css             # Estilos Glassmorphism e Dark Mode
│
├── docker-compose.yml        # Configuração para rodar via Docker Compose
└── Dockerfile                # Receita para criar o ambiente Linux + Tshark + Python
```

---

## 🛠 Instalação Padrão (Docker)

A maneira mais fácil e garantida de rodar o SIPSniffer é via Docker, pois o sistema requer o `tshark` instalado no nível do sistema operacional (Linux). O Dockerfile já cuida de tudo.

1. Clone o repositório:
   ```bash
   git clone https://github.com/GuilhermeAzespo/SIPSniffer.git
   cd SIPSniffer
   ```

2. Suba os containers com Docker Compose:
   ```bash
   docker-compose up -d --build
   ```

3. Acesse no navegador:
   Abra `http://localhost:8000`

*(O banco de dados SQLite será criado automaticamente e salvo no seu host graças aos volumes mapeados no `docker-compose.yml`).*

---

## ☁️ Instalação no Easypanel (Recomendado)

Se você utiliza **Easypanel** em uma VPS (Ubuntu, Alma Linux, etc), o processo é 100% automatizado:

1. Acesse o painel do seu Easypanel.
2. Crie um novo **Project** (ex: `Ferramentas`).
3. Clique em **Create Service** e escolha a opção **App**.
4. Na aba **Source**, conecte sua conta do GitHub e selecione o repositório `GuilhermeAzespo/SIPSniffer`.
5. Vá na aba **Environment** e adicione a seguinte variável de ambiente (obrigatória para os tokens de login):
   - `SECRET_KEY=sua_senha_super_secreta_aqui`
6. Clique em **Deploy**.

O Easypanel detectará automaticamente o `Dockerfile` presente na raiz do projeto, instalará as dependências do Ubuntu (como o `tshark`), configurará o Python e liberará o acesso web automaticamente através do proxy Traefik do Easypanel.

---

## 🔐 Como acessar (Primeiro Login)

Por segurança, a aplicação não vem com usuários padrão. Para criar o seu primeiro usuário:

1. Acesse a tela inicial web do SIPSniffer.
2. Clique em **"Criar conta"** logo abaixo do botão Entrar.
3. Insira o usuário e senha desejados e clique em **Registrar**.
4. O sistema fará o login automaticamente.

*(Em ambientes de produção severos, recomenda-se desativar ou proteger a rota de criação de usuários no arquivo `backend/main.py`).*

---

## 🧩 Como funciona o Motor de Análise

O arquivo `sip_analyzer.py` usa a biblioteca `pyshark` para ler o `.pcap` como se fosse o próprio Wireshark. O fluxo lógico é:

1. Extrai todos os `INVITE`s e `200 OK`s, agrupando-os por `Call-ID`.
2. Procura pelo pacote `ACK` correspondente de cada `Call-ID`.
3. Se o PABX enviou múltiplos `200 OK` seguidos (retransmissão) e o sistema nunca detectou um `ACK`, ele gera um erro de **Falta de ACK (NAT/Routing)**.
4. O sistema exibe o IP presente no cabeçalho `Contact` (do PABX) e o IP do `Request-URI` (da Operadora), ajudando você a identificar imediatamente se as regras de IP Público / Externo (NAT) no PABX ou no Firewall (ex: Fortigate) estão incorretas.

---
Feito com ⚡ para facilitar a vida de engenheiros VoIP!
