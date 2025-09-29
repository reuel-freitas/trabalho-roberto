# Realtime Traffic Dashboard - Relatório Técnico

## Arquitetura Geral

O sistema é composto por dois serviços principais:

- **Backend (FastAPI + PyShark):** expõe endpoints de saúde, resumo agregado e drill-down de protocolos. Controla captura e agregação de pacotes, mantendo estado em memória com janelas temporais configuráveis. A captura roda em thread dedicada utilizando `pyshark.LiveCapture` com filtro BPF para tráfego IP. As rotas consomem estruturas em memória sem I/O bloqueante para responder rapidamente.
- **Frontend (Vite + React + Zustand + Recharts):** implementa dashboard responsivo com gráfico de barras empilhadas e painel lateral de protocolos. O Zustand centraliza estado de janelas, resumo e drill-down. A UI faz polling periódico (2s) do backend para manter dados atualizados.

Os serviços são containerizados separadamente e orquestrados com `docker-compose`. O backend usa `tshark` no contêiner (`cap_add` NET_ADMIN/NET_RAW) para permitir captura. O frontend é servido via `pnpm preview`.

## Lógica de Janelas

A agregação é responsabilidade de `TrafficAggregator`:

- Cada pacote é atribuído a um bin temporal com base no timestamp (`floor(ts / WINDOW_SECONDS) * WINDOW_SECONDS`).
- Estrutura: `data[ts_bin][client_ip]` guarda totais de entrada/saída e um mapa `proto` com contadores por protocolo (`in`/`out`).
- Direcionamento: pacotes com `dst == SERVER_IP` contam como entrada, `src == SERVER_IP` como saída. Outros são ignorados.
- Coleta seletiva: apenas tráfego envolvendo o servidor alvo é considerado.
- Coleta de lixo: bins com timestamp anterior a `now - RETENTION_SECONDS` são descartados durante inserção e leitura.

Essa estratégia garante memória limitada e dados atualizados para janelas tumbling. O drill-down busca estrutura já consolidada e retorna lista ordenada de protocolos por bin e cliente.

## Tratamento de Erros

- A captura roda em loop permanente; exceções durante `sniff` ou parsing são registradas com `logging.exception` sem encerrar a thread.
- Erros de parsing de pacotes individuais são ignorados (log nível debug), preservando fluxo contínuo.
- Falhas ao inserir no agregador também são tratadas com logs e não interrompem captura.
- No frontend, requisições API são envolvidas em try/catch e exibem logs no console; a aplicação continua funcional mesmo com falhas temporárias.

## Decisões de UI

- **Barras empilhadas por cliente:** visualização rápida de tráfego relativo em cada janela. Cada cliente é uma cor consistente que muda levemente por bin para diferenciar.
- **Tooltip detalhado:** mostra bytes de entrada/saída por cliente para um timestamp específico.
- **Drill-down lateral:** destaca protocolo por cliente e horário selecionado, aproximando-se de flows tradicionais de NOC.
- **Header:** inclui estado de captura, seletores rápidos de intervalo e espaço reservado para badge de anomalia futura.
- **Responsividade:** layout flex colapsa para coluna em telas menores; painéis mantêm legibilidade.

## Dificuldades e Soluções

- **Captura dentro do contêiner:** necessário instalar `tshark` e conceder capacidades `NET_ADMIN/NET_RAW`. Documentado no README o requisito e alternativa em plataformas sem suporte a `network_mode: host`.
- **Detecção de protocolo:** PyShark oferece diversas camadas; foi usada lista de protocolos conhecidos com fallback `OTHER` para garantir cobertura.
- **Sincronização de estado:** agregador utiliza lock para garantir consistência durante leituras/escritas em multithread.
- **Polling contínuo com Zustand:** implementado `loadSummary` agnóstico de falhas; em caso de erro apenas registra log sem quebrar UI.
- **Testes sem captura real:** testes do backend focam na classe de agregação, simulando pacotes. No frontend, testes utilizam mocks e `data-testid` para validar interação.

O resultado é um sistema pronto para monitorar tráfego em tempo real, resiliente a erros de captura e com experiência de drill-down intuitiva.
