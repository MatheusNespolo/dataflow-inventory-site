# Data Flow Inventory — Site de apresentação

Página de apresentação do **[Data Flow Inventory](https://github.com/MatheusNespolo/DataFlowInventory)**, protótipo IoT de um centro de distribuição automatizado em escala reduzida (Arduino, ESP32, MQTT e dashboard em tempo real), do SENAI São Caetano do Sul.

**Site publicado:** https://matheusnespolo.github.io/dataflow-inventory-site/

Este repositório guarda **só a página**. O código do projeto, a documentação e os roteiros de teste ficam no [repositório oficial](https://github.com/MatheusNespolo/DataFlowInventory).

## O que tem na página

- **Hero com a bancada em 3D:** modelo procedural da bancada real (4 esteiras, 6 sensores TCRT5000, Arduino Uno, ESP32, LCD, drivers IRF520 e fiação), com materiais PBR, reflexos de ambiente, vapor no motor, partículas e luzes dinâmicas.
- **História guiada pela rolagem:** seis capítulos ("o caminho de um pedido") em que a câmera percorre a bancada e a peça B anda de verdade pela esteira.
- **Números, arquitetura, destaques técnicos e chamada final** para o repositório, com contadores, linha desenhada pela rolagem, cartões com holofote e botões magnéticos.

O modelo 3D é **ilustrativo**: gerado em código a partir do layout da bancada, sem arquivos de malha externos.

## Tecnologias

| Camada | Uso |
|---|---|
| [Next.js](https://nextjs.org) 16 (App Router) | Exportação estática (`output: "export"`) para o GitHub Pages |
| [Tailwind CSS](https://tailwindcss.com) 4 | Tokens de cor e tipografia em `src/app/globals.css` |
| [React Three Fiber](https://r3f.docs.pmnd.rs) + drei + postprocessing | Cena 3D (`src/components/scene/`) |
| [GSAP](https://gsap.com) ScrollTrigger + [Lenis](https://lenis.darkroom.engineering) | Rolagem suave e animações ligadas à rolagem |
| [Framer Motion](https://motion.dev) | Revelação de texto, transições dos capítulos e microinterações |

## Rodar localmente

Requer Node.js 22 ou superior.

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

Para gerar o site estático em `out/`:

```bash
npm run build
```

## Estrutura

```
src/
├── app/                  # layout (fontes, metadados), página e estilos globais
├── components/
│   ├── scene/            # cena 3D: bancada, peças, efeitos, câmera e estado compartilhado
│   ├── ui/               # botão magnético, revelação de texto, ícones e logo
│   ├── ScrollDirector.tsx# Lenis + ScrollTrigger → estado da cena (câmera, capítulo, visibilidade)
│   └── *.tsx             # seções da página
└── lib/content.ts        # textos e números (espelham o README e a documentação oficial)
```

Os números e textos de `src/lib/content.ts` vêm do repositório oficial. Se o projeto mudar (estados da FSM, tempos da supervisão, métricas), atualize-os aqui também.

## Acessibilidade e desempenho

- `prefers-reduced-motion` congela o giro, o vapor, as esteiras, o grão e a rolagem suave.
- A cena 3D é carregada só no navegador, depois da primeira pintura, e para de renderizar quando sai da tela; a resolução cai automaticamente em máquinas mais lentas.
- No celular, o piso espelhado é trocado por um material simples e há menos partículas.

## Publicação

O workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) roda lint e build a cada push na `main` e publica `out/` no GitHub Pages, com `BASE_PATH` igual ao nome do repositório.

## Equipe

Henrique Moni de Souza, Matheus Nespolo Silva, Murilo Tolardo da Silva e Vitor Marcolongo Silva.
Orientação: Profa. Tatiani de Paula Pinotti Sabaris Meglhioratti e Prof. Jorge Antonio Giles Ferrer.

## Licença

[MIT](LICENSE), a mesma do projeto.
