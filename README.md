# 🌐 Realtime Traffic Dashboard

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.1-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docker.com)

Um sistema completo de monitoramento de tráfego de rede em tempo real que captura, processa e visualiza dados de comunicação entre clientes e servidor, com suporte a múltiplos protocolos (HTTP, FTP, TCP, UDP, ICMP).

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Execução](#-instalação-e-execução)
- [API Endpoints](#-api-endpoints)
- [Configuração](#-configuração)
- [Testes](#-testes)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Troubleshooting](#-troubleshooting)
- [Contribuição](#-contribuição)

## 🎯 Visão Geral

O **Realtime Traffic Dashboard** é uma aplicação web que monitora o tráfego de rede de um servidor específico em tempo real. O sistema captura pacotes de rede usando uma interface espelhada, agrega os dados em janelas de tempo discretas e apresenta visualizações interativas através de um dashboard web.

### Características Principais:
- **Captura em tempo real** de pacotes de rede
- **Agregação inteligente** por cliente e protocolo
- **Visualizações interativas** com drill-down
- **Suporte a múltiplos protocolos** (HTTP, FTP, TCP, UDP, ICMP)
- **Transferência de dados JSON** via FTP
- **Interface responsiva** e intuitiva

## 🚀 Instalação e Execução

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd realtime-traffic-dashboard
```

### 2. Configuração do Ambiente
```bash
# Crie o arquivo .env (opcional)
cat > .env << EOF
SERVER_IP=10.50.0.10
IFACE=any
WINDOW_SECONDS=5
RETENTION_SECONDS=300
EOF
```

### 3. Execução com Docker (Recomendado)
```bash
# Construir e iniciar todos os serviços
sudo docker-compose up --build -d

# Verificar status dos containers
sudo docker-compose ps

# Visualizar logs
sudo docker-compose logs -f backend
```

### 4. Acesso ao Dashboard
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **FTP Server**: localhost:21 (testuser:testpass)

### 5. Parar os Serviços
```bash
sudo docker-compose down --volumes --remove-orphans
```

### 3. Execução com Docker (Recomendado)
```bash
# Construir e iniciar todos os serviços
sudo docker-compose up --build -d

# Verificar status dos containers
sudo docker-compose ps

# Visualizar logs
sudo docker-compose logs -f backend
```

## ✨ Funcionalidades

### 🔍 Monitoramento de Tráfego
- Captura de pacotes em tempo real usando PyShark
- Detecção automática de protocolos por layer e porta
- Agregação em janelas de tempo configuráveis (padrão: 5 segundos)
- Cálculo de bytes de entrada e saída por cliente

### 📊 Visualizações
- **Gráfico principal**: Tráfego total por cliente com cores distintas
- **Drill-down**: Detalhes por protocolo ao clicar nas barras
- **Gráficos individuais**: Timeline de tráfego por cliente
- **Painel JSON**: Monitoramento de transferências de dados

### 🌐 Protocolos Suportados
- **HTTP**: Detecção por layer e porta 80
- **FTP**: Detecção por layer e portas 21, 20, 30000-30009
- **DNS**: Detecção por layer e porta 53
- **TLS/SSL**: Detecção por layer e porta 443
- **TCP/UDP/ICMP**: Detecção por fallback
- **OTHER**: Protocolos não identificados

### 📡 Transferência de Dados
- Upload de arquivos JSON via FTP
- Processamento de dados de sensores
- API REST para recebimento de dados
- Logs detalhados de transferências

## 🏗️ Arquitetura

```mermaid
graph TB
    subgraph "🌐 Docker Environment"
        subgraph "📊 Frontend Layer"
            FE[Frontend Dashboard<br/>10.50.0.20:5173<br/>React + TypeScript<br/>Recharts + Zustand]
        end
        
        subgraph "⚙️ Backend Layer"
            API[FastAPI Server<br/>10.50.0.10:8000<br/>REST API + WebSocket]
            FTP[FTP Server<br/>10.50.0.10:21<br/>vsftpd + Passive Mode]
            CAP[Packet Capture<br/>PyShark + LiveCapture<br/>Protocol Detection]
            AGG[Traffic Aggregator<br/>Tumbling Windows<br/>5s bins + GC]
        end
        
        subgraph "👥 Client Layer"
            C1[Client 1<br/>10.50.0.101<br/>HTTP Health Checks]
            C2[Client 2<br/>10.50.0.102<br/>HTTP Summary API]
            C3[Client 3<br/>10.50.0.103<br/>HTTP + FTP Mixed]
            C4[Client 4<br/>10.50.0.104<br/>JSON Transfer via FTP]
            C5[Client 5<br/>10.50.0.105<br/>HTTP Parallel Requests]
        end
        
        subgraph "🔍 Data Flow"
            NET[Network Interface<br/>Packet Mirroring<br/>Real-time Capture]
        end
    end
    
    %% Connections
    FE -->|HTTP Polling<br/>2s interval| API
    C1 -->|HTTP GET /health| API
    C2 -->|HTTP GET /summary| API
    C3 -->|HTTP + FTP| API
    C3 -->|FTP Upload/Download| FTP
    C4 -->|JSON via FTP| FTP
    C4 -->|POST /json-data| API
    C5 -->|HTTP Parallel| API
    
    NET -->|Raw Packets| CAP
    CAP -->|Parsed Packets| AGG
    AGG -->|Aggregated Data| API
    
    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef client fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef network fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class FE frontend
    class API,FTP,CAP,AGG backend
    class C1,C2,C3,C4,C5 client
    class NET network
```

### Fluxo de Dados

```mermaid
flowchart LR
    subgraph "📡 Data Capture"
        A[Network Interface] --> B[PyShark Capture]
        B --> C[Packet Parsing]
        C --> D[Protocol Detection]
    end
    
    subgraph "🔄 Data Processing"
        D --> E[Direction Analysis]
        E --> F[Client Identification]
        F --> G[Time Window Binning]
        G --> H[Protocol Aggregation]
        H --> I[Memory Storage]
    end
    
    subgraph "🌐 Data Serving"
        I --> J[FastAPI Endpoints]
        J --> K[HTTP Responses]
        K --> L[Frontend Polling]
        L --> M[Recharts Visualization]
    end
    
    subgraph "📄 JSON Transfer Flow"
        N[Client4 JSON Creation] --> O[FTP Upload]
        O --> P[Backend Processing]
        P --> Q[API Response]
        Q --> R[Dashboard Display]
    end
    
    %% Styling
    classDef capture fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef process fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef serve fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef json fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    
    class A,B,C,D capture
    class E,F,G,H,I process
    class J,K,L,M serve
    class N,O,P,Q,R json
```

1. **Backend (Python + FastAPI)**
   - API REST com endpoints para dados de tráfego
   - Servidor FTP integrado (vsftpd)
   - Captura de pacotes usando PyShark
   - Agregação de dados em tempo real

2. **Frontend (React + TypeScript)**
   - Dashboard interativo com Recharts
   - Gerenciamento de estado com Zustand
   - Polling automático de dados
   - Interface responsiva

3. **Clientes de Teste (5 Containers)**
   - Simulação de diferentes tipos de tráfego
   - HTTP, FTP e transferência de JSON
   - Geração de dados de teste

## 🛠️ Tecnologias

### Backend
- **Python 3.11** - Linguagem principal
- **FastAPI 0.110.1** - Framework web moderno
- **PyShark 0.6** - Captura de pacotes de rede
- **Pydantic 2.7.1** - Validação de dados
- **Uvicorn** - Servidor ASGI
- **vsftpd** - Servidor FTP

### Frontend
- **React 18.3.1** - Biblioteca de UI
- **TypeScript 5.4.5** - Tipagem estática
- **Vite 5.2.10** - Build tool moderno
- **Recharts 2.7.2** - Biblioteca de gráficos
- **Zustand 4.5.2** - Gerenciamento de estado

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **Bridge Network** - Rede isolada com IPs fixos

### Qualidade de Código
- **pytest** - Testes unitários
- **ESLint** - Linting JavaScript/TypeScript
- **Prettier** - Formatação de código
- **Vitest** - Testes frontend

## 📋 Pré-requisitos

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Linux/WSL2** (para captura de pacotes)
- **Privilégios de root** (para captura de rede)

## 🚀 Instalação e Execução

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd realtime-traffic-dashboard
```

### 2. Configuração do Ambiente
```bash
# Crie o arquivo .env (opcional)
cat > .env << EOF
SERVER_IP=10.50.0.10
IFACE=any
WINDOW_SECONDS=5
RETENTION_SECONDS=300
EOF
```

### 4. Acesso ao Dashboard
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **FTP Server**: localhost:21 (testuser:testpass)

### 5. Parar os Serviços
```bash
sudo docker-compose down --volumes --remove-orphans
```

## 🔌 API Endpoints

### Health Check
```http
GET /api/health
```
**Resposta:**
```json
{
  "ok": true,
  "now": 1234567890
}
```

### Summary de Tráfego
```http
GET /api/summary?from_ts=1234567890&to_ts=1234567895
```
**Resposta:**
```json
{
  "bins": [
    {
      "ts": 1234567890,
      "client_ip": "10.50.0.101",
      "in_bytes": 1024,
      "out_bytes": 2048
    }
  ]
}
```

### Drill-down por Protocolo
```http
GET /api/drilldown?ts=1234567890&client_ip=10.50.0.101
```
**Resposta:**
```json
{
  "ts": 1234567890,
  "client_ip": "10.50.0.101",
  "items": [
    {
      "protocol": "HTTP",
      "in_bytes": 512,
      "out_bytes": 1024
    },
    {
      "protocol": "TCP",
      "in_bytes": 512,
      "out_bytes": 1024
    }
  ]
}
```

### Recebimento de Dados JSON
```http
POST /api/json-data
Content-Type: application/json

{
  "client_id": "client4",
  "timestamp": 1234567890,
  "data_type": "sensor_data",
  "payload": {
    "temperature": 23.5,
    "humidity": 65.2,
    "pressure": 1013.25,
    "location": "10.50.0.104"
  },
  "file_size": 156
}
```

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `SERVER_IP` | `10.50.0.10` | IP do servidor para captura |
| `IFACE` | `any` | Interface de rede para captura |
| `WINDOW_SECONDS` | `5` | Tamanho da janela de agregação |
| `RETENTION_SECONDS` | `300` | Tempo de retenção dos dados |

### Configuração de Rede Docker

O sistema usa uma rede bridge personalizada com IPs fixos:
- **Subnet**: `10.50.0.0/16`
- **Gateway**: `10.50.0.1`
- **Backend**: `10.50.0.10`
- **Frontend**: `10.50.0.20`
- **Clients**: `10.50.0.101-105`

### Configuração FTP

- **Usuário**: `testuser`
- **Senha**: `testpass`
- **Modo**: Passivo
- **Portas**: 21 (controle), 30000-30009 (dados)

## 🧪 Testes

### Backend
```bash
# Executar testes unitários
cd backend
python -m pytest tests/ -v

# Executar com coverage
python -m pytest tests/ --cov=. --cov-report=html
```

### Frontend
```bash
# Executar testes
cd frontend
npm test

# Executar linting
npm run lint

# Formatar código
npm run format
```

### Testes de Integração
```bash
# Testar API endpoints
curl http://localhost:8000/api/health
curl http://localhost:8000/api/summary

# Testar FTP
curl --ftp-pasv ftp://testuser:testpass@localhost:21/
```

## 📁 Estrutura do Projeto

```
realtime-traffic-dashboard/
├── backend/                    # Servidor Python + FastAPI
│   ├── app.py                 # Aplicação principal
│   ├── capture.py             # Captura de pacotes
│   ├── aggregator.py          # Agregação de dados
│   ├── models.py              # Modelos Pydantic
│   ├── settings.py            # Configurações
│   ├── tests/                 # Testes unitários
│   ├── Dockerfile             # Container backend
│   ├── requirements.txt       # Dependências Python
│   └── start.sh              # Script de inicialização
├── frontend/                   # Cliente React + TypeScript
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   │   ├── TrafficChart.tsx
│   │   │   ├── DrilldownPanel.tsx
│   │   │   ├── ClientChart.tsx
│   │   │   ├── JsonTransferPanel.tsx
│   │   │   └── Header.tsx
│   │   ├── store.ts           # Estado global (Zustand)
│   │   ├── api.ts             # Cliente API
│   │   └── App.tsx            # Componente principal
│   ├── package.json           # Dependências Node.js
│   └── Dockerfile             # Container frontend
├── test-data/                  # Dados de teste
├── docker-compose.yaml         # Orquestração Docker
└── README.md                   # Este arquivo
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Permissão para Captura de Pacotes
```bash
# Solução: Execute com sudo
sudo docker-compose up --build -d
```

#### 2. Rede Docker Conflitante
```bash
# Limpar redes antigas
sudo docker network prune
sudo docker-compose down --volumes --remove-orphans
```

#### 3. FTP Não Funcionando
```bash
# Verificar logs do FTP
sudo docker logs realtime-traffic-dashboard_backend_1 | grep ftp

# Testar conexão FTP manualmente
curl -v --ftp-pasv ftp://testuser:testpass@localhost:21/
```

#### 4. Frontend Não Carrega
```bash
# Verificar logs do frontend
sudo docker logs realtime-traffic-dashboard_frontend_1

# Verificar se o backend está respondendo
curl http://localhost:8000/api/health
```

### Logs Úteis

```bash
# Logs do backend (captura de pacotes)
sudo docker logs realtime-traffic-dashboard_backend_1 | grep -E "🐟|FTP|HTTP"

# Logs dos clientes
sudo docker logs realtime-traffic-dashboard_client4_1

# Logs de todos os serviços
sudo docker-compose logs -f
```

### Performance

- **Captura de pacotes**: Pode consumir CPU em redes com muito tráfego
- **Memória**: ~100MB por container
- **Rede**: ~1-10 Mbps dependendo do tráfego capturado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- **Python**: PEP 8 + Black
- **TypeScript**: ESLint + Prettier
- **Commits**: Conventional Commits
- **Testes**: Cobertura mínima de 80%

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma [issue](../../issues) no GitHub
- Consulte a documentação da API
- Verifique os logs de debug

---

**Desenvolvido com ❤️ para monitoramento de tráfego de rede em tempo real**
