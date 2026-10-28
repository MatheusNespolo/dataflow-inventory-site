// Conteúdo da página. Os números e nomes vêm do repositório oficial do projeto
// (README, docs/ARCHITECTURE.md e docs/CHANGELOG.md) — mantenha-os em sincronia.

export const REPO_URL = "https://github.com/MatheusNespolo/DataFlowInventory";

export const links = {
  repo: REPO_URL,
  quickStart: `${REPO_URL}#-quick-start--simulador`,
  arquitetura: `${REPO_URL}/blob/main/docs/ARCHITECTURE.md`,
  implantacao: `${REPO_URL}/blob/main/docs/DEPLOYMENT.md`,
  observabilidade: `${REPO_URL}/blob/main/observability/README.md`,
  contribuir: `${REPO_URL}/blob/main/CONTRIBUTING.md`,
  licenca: `${REPO_URL}/blob/main/LICENSE`,
};

/** Capítulos da história "o caminho de um pedido" — cada um move a câmera da cena 3D. */
export const capitulos = [
  {
    id: "pedido",
    codigo: "01",
    titulo: "O clique",
    texto:
      "Alguém pede a peça B no dashboard. O navegador envia o comando por Socket.IO ao servidor Node.js, que valida a peça, aplica o limite de frequência e confere se o broker está no ar.",
    tag: "Dashboard · Socket.IO",
  },
  {
    id: "mqtt",
    codigo: "02",
    titulo: "A nuvem",
    texto:
      "O servidor publica em dataflow/comandos/sub. Mosquitto na rede local ou HiveMQ Cloud com TLS na porta 8883 — o mesmo contrato de tópicos nos dois casos.",
    tag: "MQTT · QoS · LWT",
  },
  {
    id: "gateway",
    codigo: "03",
    titulo: "O gateway",
    texto:
      "O ESP32 recebe a mensagem pelo Wi-Fi e a repassa ao Arduino pela serial, em JSON. Se a conexão cair, ele reconecta sem travar e avisa o mundo pelo Last Will.",
    tag: "ESP32 · Serial ↔ Wi-Fi",
  },
  {
    id: "fsm",
    codigo: "04",
    titulo: "A decisão",
    texto:
      "No Arduino Uno, uma máquina de estados confere o estoque e o sensor do topo antes de qualquer movimento. Sem peça, sem motor — o erro aparece no display e no dashboard.",
    tag: "Arduino Uno · FSM de 5 estados",
  },
  {
    id: "esteira",
    codigo: "05",
    titulo: "O movimento",
    texto:
      "A esteira secundária parte com kick-start e segue em PWM de regime. A entrega é supervisionada por marcos: topo livre em 3 s, junção em 12,5 s, saída em 3 s.",
    tag: "IRF520 · TCRT5000 · PWM",
  },
  {
    id: "entrega",
    codigo: "06",
    titulo: "A entrega",
    texto:
      "Só quando o sensor da junção confirma a passagem o estoque é debitado, e a peça cai no compartimento certo da roda separadora. O evento volta pelo mesmo caminho e o dashboard atualiza em tempo real — com métricas no Grafana.",
    tag: "Estoque · Eventos · Métricas",
  },
] as const;

export const numeros = [
  { valor: 4, sufixo: "", rotulo: "esteiras", detalhe: "1 principal + 3 secundárias com driver IRF520" },
  { valor: 6, sufixo: "", rotulo: "sensores IR", detalhe: "TCRT5000 no topo e nas junções" },
  { valor: 5, sufixo: "", rotulo: "estados", detalhe: "máquina de estados finita no Arduino Uno" },
  { valor: 17, sufixo: "", rotulo: "métricas", detalhe: "dfi_* expostas ao Prometheus" },
  { valor: 7, sufixo: "", rotulo: "tópicos MQTT", detalhe: "contrato dataflow/* com retained e LWT" },
  { valor: 12.5, sufixo: " s", rotulo: "timeout", detalhe: "da partida do motor até a junção" },
] as const;

export const destaques = [
  {
    titulo: "Supervisão por marcos",
    texto:
      "Cada entrega passa por checagem prévia, topo livre, passagem na junção e saída. Débito só na confirmação do sensor — nunca no escuro.",
    detalhe: "3 s · 12,5 s · 3 s",
    grande: true,
  },
  {
    titulo: "Firmware que se defende",
    texto:
      "Watchdog de 2 s que desliga os motores, causa do reset reportada no boot, display OLED opcional e interrupções com limitador de rajadas.",
    detalhe: "C++ · ATmega328P",
  },
  {
    titulo: "Testável sem hardware",
    texto:
      "Um simulador reproduz a FSM inteira e emite os mesmos eventos do servidor real. Clone, rode e veja funcionando em 30 segundos.",
    detalhe: "npm start",
  },
  {
    titulo: "Observabilidade de verdade",
    texto:
      "Prometheus e Grafana com três dashboards: visão geral, performance e confiabilidade da bancada.",
    detalhe: "17 métricas dfi_*",
  },
  {
    titulo: "Seguro por padrão",
    texto:
      "Helmet com CSP, CORS restrito, limite de comandos por cliente, validação de entrada e health check que responde 503 quando o broker cai.",
    detalhe: "/api/status",
  },
  {
    titulo: "Qualidade contínua",
    texto:
      "88 testes da lógica do firmware rodando no PC, E2E com Playwright e um CI que compila os sketches e barra o uso de RAM do Uno.",
    detalhe: "GitHub Actions",
    grande: true,
  },
] as const;

export const estadosFsm = [
  "AGUARDANDO_PEDIDO",
  "VERIFICANDO_ESTOQUE",
  "ACIONANDO_ESTEIRA",
  "ENTREGANDO_PECA",
  "ERRO",
] as const;

/** Nós do fluxo de arquitetura, na ordem em que um comando os atravessa. */
export const arquitetura = [
  { nome: "Dashboard", papel: "HTML · CSS · JS · vista 3D" },
  { nome: "Node.js", papel: "Express · Socket.IO · /metrics" },
  { nome: "Broker MQTT", papel: "Mosquitto · HiveMQ Cloud" },
  { nome: "ESP32", papel: "gateway Wi-Fi ↔ serial" },
  { nome: "Arduino Uno", papel: "FSM · sensores · motores" },
  { nome: "Esteiras", papel: "4 esteiras · 6 sensores" },
] as const;

export const equipe = [
  "Henrique Moni de Souza",
  "Matheus Nespolo Silva",
  "Murilo Tolardo da Silva",
  "Vitor Marcolongo Silva",
] as const;

export const orientacao = [
  "Profa. Tatiani de Paula Pinotti Sabaris Meglhioratti",
  "Prof. Jorge Antonio Giles Ferrer",
] as const;

export const quickStart = [
  "git clone https://github.com/MatheusNespolo/DataFlowInventory.git",
  "cd DataFlowInventory/simulator",
  "npm install && npm start",
] as const;
