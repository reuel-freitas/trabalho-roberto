# 🚦 Realtime Traffic Dashboard

Dashboard de análise de tráfego de servidor em tempo real com **FastAPI**, **PyShark**, **React** e **Recharts**. A solução captura pacotes envolvendo um IP alvo, agrega em janelas de 5 segundos e fornece drill-down por protocolo.

![Dashboard Preview](https://img.shields.io/badge/Status-Funcionando-brightgreen)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![React](https://img.shields.io/badge/React-18+-61dafb)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed)

## 📋 Índice

- [Requisitos](#-requisitos)
- [Configuração Rápida](#-configuração-rápida)
- [Executar com Docker](#-executar-com-docker)
- [Desenvolvimento Local](#-desenvolvimento-local)
- [Testando o Sistema](#-testando-o-sistema)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Testes e Qualidade](#-testes-e-qualidade)
- [Troubleshooting](#-troubleshooting)
- [Critérios de Aceite](#-critérios-de-aceite)

## 🔧 Requisitos

- **Docker 24+** e **Docker Compose**
- **Linux/WSL2** (necessário para `network_mode: host`)
- **Permissões de captura** (`tshark`/`dumpcap`) na interface desejada
- **Python 3.11+** (para desenvolvimento local)
- **Node.js 18+** (para desenvolvimento local)

## ⚡ Configuração Rápida

### 1. Clone e Configure

```bash
git clone <repository-url>
cd realtime-traffic-dashboard
```

### 2. Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite com suas configurações
nano .env
```

**Exemplo de `.env`:**
```env
SERVER_IP=172.22.27.242
IFACE=eth0
WINDOW_SECONDS=5
RETENTION_SECONDS=300
```

### 3. Descubra Seu IP e Interface

```bash
# Descobrir IP
hostname -I

# Descobrir interface de rede
ip addr
```

## 🐳 Executar com Docker

### Execução Completa

```bash
# Subir todo o sistema
docker-compose up --build

# Em modo daemon (background)
docker-compose up -d --build
```

### Acessar o Dashboard

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/api/health

### Parar o Sistema

```bash
docker-compose down
```

> **⚠️ Importante:** `network_mode: host` só funciona em Linux/WSL2. Para Windows/macOS, veja [Desenvolvimento Local](#-desenvolvimento-local).

## 💻 Desenvolvimento Local

### Backend

```bash
cd backend

# Criar ambiente virtual
python3 -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Instalar tshark (Linux)
sudo apt update
sudo apt install tshark

# Dar permissões
sudo usermod -aG wireshark $USER
sudo setcap cap_net_raw,cap_net_admin+eip /usr/bin/tshark

# Executar
SERVER_IP=172.22.27.242 IFACE=eth0 WINDOW_SECONDS=5 RETENTION_SECONDS=300 uvicorn app:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Instalar pnpm
corepack enable

# Instalar dependências
pnpm install

# Executar em desenvolvimento
pnpm dev
```

## 🧪 Testando o Sistema

### 1. Servidores de Teste (Docker)

```bash
# Iniciar servidores HTTP e FTP
docker-compose -f docker-compose.test.yaml up -d

# Verificar se estão funcionando
curl http://localhost:8080/
curl ftp://testuser:testpass@localhost:21/
```

### 2. Gerar Tráfego de Teste

```bash
# Tráfego HTTP
while true; do
  curl -s http://172.22.27.242:8080/ > /dev/null
  sleep 1
done

# Tráfego FTP
while true; do
  curl -s ftp://testuser:testpass@172.22.27.242:21/ > /dev/null
  sleep 2
done

# Tráfego misto (HTTP + FTP)
while true; do
  curl -s http://172.22.27.242:8080/ > /dev/null
  sleep 1
  curl -s ftp://testuser:testpass@172.22.27.242:21/ > /dev/null
  sleep 1
done
```

### 3. Simular Múltiplas Máquinas

```bash
# Cliente 1 - HTTP frequente
docker run --rm curlimages/curl:latest sh -c "while true; do curl -s http://172.22.27.242:8080/; sleep 1; done" &

# Cliente 2 - FTP
docker run --rm curlimages/curl:latest sh -c "while true; do curl -s ftp://testuser:testpass@172.22.27.242:21/; sleep 2; done" &

# Cliente 3 - Mixed
docker run --rm curlimages/curl:latest sh -c "while true; do curl -s http://172.22.27.242:8080/; sleep 1; curl -s ftp://testuser:testpass@172.22.27.242:21/; sleep 2; done" &

# Cliente 4 - Heavy load
docker run --rm curlimages/curl:latest sh -c "while true; do for i in {1..5}; do curl -s http://172.22.27.242:8080/ & done; wait; sleep 1; done" &

# Cliente 5 - FTP upload/download
docker run --rm curlimages/curl:latest sh -c "while true; do curl -s ftp://testuser:testpass@172.22.27.242:21/; sleep 1; done" &
```

### 4. Verificar Captura

```bash
# Testar API do backend
curl "http://localhost:8000/api/summary?from_ts=$(date -d '5 minutes ago' +%s)&to_ts=$(date +%s)"

# Ver logs do backend
docker-compose logs -f backend
```

## 📁 Estrutura do Projeto

```
realtime-traffic-dashboard/
├── 📁 backend/
│   ├── 🐍 app.py              # FastAPI application
│   ├── 🐍 capture.py          # PyShark packet capture
│   ├── 🐍 aggregator.py       # Traffic aggregation logic
│   ├── 🐍 models.py           # Pydantic models
│   ├── 🐍 settings.py         # Environment configuration
│   ├── 📄 requirements.txt    # Python dependencies
│   └── 📁 tests/
│       └── 🧪 test_aggregator.py
├── 📁 frontend/
│   ├── 📄 package.json        # Node.js dependencies
│   ├── ⚙️ vite.config.ts      # Vite configuration
│   ├── 📄 tsconfig.json       # TypeScript config
│   └── 📁 src/
│       ├── 🎨 main.tsx        # React entry point
│       ├── 🎨 App.tsx         # Main component
│       ├── 🔌 api.ts          # API client
│       ├── 🗃️ store.ts         # Zustand state management
│       └── 📁 components/
│           ├── 📊 TrafficChart.tsx
│           ├── 🔍 DrilldownPanel.tsx
│           └── 📋 Header.tsx
├── 🐳 docker-compose.yaml    # Main services
├── 🐳 docker-compose.test.yaml # Test servers
├── 📄 .env.example           # Environment template
├── 📄 README.md              # This file
└── 📄 REPORT.md              # Technical report
```

## 🧪 Testes e Qualidade

### Backend

```bash
cd backend

# Testes unitários
pytest -v

# Formatação de código
black .

# Linting
flake8

# Análise de segurança
bandit -r .
```

### Frontend

```bash
cd frontend

# Testes unitários
pnpm test

# Linting
pnpm lint

# Formatação
pnpm format

# Build de produção
pnpm build
```

## 🔧 Troubleshooting

### Problemas Comuns

| Problema | Solução |
|----------|---------|
| **TShark not found** | `sudo apt install tshark` |
| **Permission denied** | `sudo usermod -aG wireshark $USER` |
| **Interface não existe** | Verificar com `ip addr` e ajustar `IFACE` |
| **Sem dados no dashboard** | Verificar `SERVER_IP` e gerar tráfego |
| **Frontend não carrega** | Verificar se backend está rodando na porta 8000 |
| **Docker network_mode host** | Usar Linux/WSL2 ou desenvolvimento local |

### Comandos de Diagnóstico

```bash
# Verificar interfaces de rede
ip addr

# Verificar permissões tshark
sudo tshark -D

# Verificar se backend está rodando
curl http://localhost:8000/api/health

# Ver logs do Docker
docker-compose logs -f

# Verificar portas em uso
netstat -tlnp | grep -E ':(8000|5173|8080|21)'
```

## ✅ Critérios de Aceite

- ✅ **Captura contínua** com tratamento de erros
- ✅ **Agregação por janelas** (5s configuráveis)
- ✅ **Endpoints RESTful** (`/api/summary`, `/api/drilldown`)
- ✅ **Frontend responsivo** com drill-down funcional
- ✅ **Código formatado** (Black, flake8, ESLint, Prettier, Bandit)
- ✅ **Testes automatizados** (pytest, Vitest/RTL)
- ✅ **Docker Compose** sobe todo o sistema
- ✅ **Documentação completa** (README + REPORT)

## 🎯 Funcionalidades

- **📊 Gráfico de barras** em tempo real
- **🔍 Drill-down por protocolo** (HTTP, FTP, TCP, UDP, ICMP)
- **⏱️ Janelas de tempo** configuráveis (2min, 5min, 10min)
- **🌐 Múltiplos clientes** por IP
- **📈 Agregação automática** de bytes in/out
- **🔄 Atualização automática** a cada 2 segundos
- **📱 Interface responsiva** para desktop e mobile

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs**: `docker-compose logs -f`
2. **Consulte o troubleshooting** acima
3. **Teste os endpoints** manualmente
4. **Verifique as permissões** de rede

---

**🎉 Pronto para usar!** Este dashboard oferece uma experiência realista de monitoramento de tráfego de rede, perfeito para portfólio e aprendizado.