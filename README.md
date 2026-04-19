# Pintar — App de pintura infantil

App touch-first para crianças pintarem desenhos, com canvas em camadas, balde de tinta, zoom por pinça, galeria na nuvem e painel administrativo com controle parental.

## Stack

- React + Vite
- Tailwind CSS (dark mode via classe)
- Supabase (Storage + Database, sem Auth — apenas chave anon)
- Deploy na Vercel

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com as chaves do seu projeto Supabase
npm run dev
```

Variáveis:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

> O app funciona **sem** Supabase (modo offline): você pode pintar, exportar JPEG e usar todas as ferramentas. Apenas o salvamento na nuvem, a galeria e o upload de templates ficam desativados.

## Setup do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor, rode o arquivo [`supabase/schema.sql`](supabase/schema.sql). Ele cria:
   - Tabela `projetos` (obras salvas, versionadas)
   - Tabela `templates` (catálogo de desenhos para colorir)
   - Buckets públicos `obras` e `templates`
   - Políticas RLS permissivas (acesso via anon)
3. Copie `Project URL` e `anon public key` em `Settings → API` para o `.env`.

## Deploy na Vercel

```bash
npm i -g vercel
vercel deploy
```

Nas variáveis de ambiente do projeto Vercel, defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## Estrutura

```
src/
  components/
    Canvas.jsx            canvas de 2 camadas, pointer events, zoom/pan
    Toolbar.jsx           ferramentas (pincel/balde/borracha), tamanhos, ações
    ColorPicker.jsx       32 cores + input de cor personalizada
    TemplateSelector.jsx  carrossel horizontal de templates
    AdminPanel.jsx        config (com controle parental matemático)
    WelcomeScreen.jsx     tela de entrada com fullscreen
  hooks/
    useCanvas.js          setup de canvas (DPR-aware)
    useZoom.js            pinch-to-zoom + pan constrito
    useFloodFill.js       balde iterativo com tolerância
  lib/
    supabase.js           cliente + helpers de obras e templates
    imageProcessing.js    extração de contorno + composição final
  App.jsx                 orquestra tudo
  main.jsx
supabase/
  schema.sql
```

## Funcionalidades

- **Pincel** — traço livre suavizado com curvas Bézier quadráticas, 3 tamanhos, suporte a pressão de stylus.
- **Balde** — flood fill iterativo 4-conectividade, tolerância ~30, delay de 80 ms anti-acidente.
- **Borracha** — pinta com a cor de fundo do tema.
- **Zoom** — pinça de 1x a 5x, pan constrito aos limites. Botão de reset aparece com zoom > 1.
- **Rejeição de palma** — toques com largura > 20 px são ignorados.
- **Templates** — carrossel; contorno processado no cliente (pixels claros removidos, escuros mantidos; invertido para branco no dark mode).
- **Salvar** — JPEG 50%, *append-only* por projeto (versionamento).
- **Baixar** — JPEG 90% com fundo + pintura + contorno compostos.
- **Galeria** — grid com navegação de versões por obra.
- **Admin** — protegido por pergunta matemática (ex.: 7 × 8). Seções: aparência, templates, galeria.

## Notas

- O estado de desenho vive em `refs` para evitar re-renders durante o traço.
- O canvas interno é 1200×900 e renderizado escalado pela resolução do dispositivo (`devicePixelRatio`).
- Cada template tem sua pintura cacheada em memória durante a sessão.
- Session id (`kp_sessao_id`) persiste em `sessionStorage`.
