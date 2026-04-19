// Templates embutidos — line art em SVG, renderizados como data URI.
// Aparecem sempre, mesmo sem Supabase.

const svg = (inner) => `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
    <rect width="1200" height="900" fill="#ffffff"/>
    <g fill="none" stroke="#111" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">${inner}</g>
  </svg>`
)}`

const estrela = svg(`
  <polygon points="600,120 696,420 1020,420 760,600 860,900 600,720 340,900 440,600 180,420 504,420"/>
`)

const coracao = svg(`
  <path d="M600 800 C 300 620, 180 420, 360 300 C 480 220, 600 320, 600 420 C 600 320, 720 220, 840 300 C 1020 420, 900 620, 600 800 Z"/>
`)

const flor = svg(`
  <circle cx="600" cy="450" r="90"/>
  <ellipse cx="600" cy="240" rx="90" ry="160"/>
  <ellipse cx="600" cy="660" rx="90" ry="160"/>
  <ellipse cx="390" cy="450" rx="160" ry="90"/>
  <ellipse cx="810" cy="450" rx="160" ry="90"/>
  <ellipse cx="450" cy="300" rx="130" ry="75" transform="rotate(-45 450 300)"/>
  <ellipse cx="750" cy="300" rx="130" ry="75" transform="rotate(45 750 300)"/>
  <ellipse cx="450" cy="600" rx="130" ry="75" transform="rotate(45 450 600)"/>
  <ellipse cx="750" cy="600" rx="130" ry="75" transform="rotate(-45 750 600)"/>
`)

const casa = svg(`
  <polygon points="300,450 600,180 900,450"/>
  <rect x="330" y="450" width="540" height="330"/>
  <rect x="480" y="540" width="110" height="160"/>
  <rect x="660" y="540" width="150" height="120"/>
  <line x1="735" y1="540" x2="735" y2="660"/>
  <line x1="660" y1="600" x2="810" y2="600"/>
  <polygon points="720,270 780,270 780,360 720,360"/>
`)

const sol = svg(`
  <circle cx="600" cy="450" r="180"/>
  <circle cx="540" cy="420" r="14"/>
  <circle cx="660" cy="420" r="14"/>
  <path d="M520 510 Q 600 580 680 510"/>
  <line x1="600" y1="150" x2="600" y2="240"/>
  <line x1="600" y1="660" x2="600" y2="750"/>
  <line x1="300" y1="450" x2="390" y2="450"/>
  <line x1="810" y1="450" x2="900" y2="450"/>
  <line x1="390" y1="240" x2="455" y2="305"/>
  <line x1="810" y1="240" x2="745" y2="305"/>
  <line x1="390" y1="660" x2="455" y2="595"/>
  <line x1="810" y1="660" x2="745" y2="595"/>
`)

const peixe = svg(`
  <path d="M200 450 Q 400 240, 780 300 Q 1000 330, 1000 450 Q 1000 570, 780 600 Q 400 660, 200 450 Z"/>
  <path d="M200 450 L 60 330 L 140 450 L 60 570 Z"/>
  <circle cx="850" cy="430" r="22"/>
  <circle cx="850" cy="430" r="8" fill="#111"/>
  <path d="M540 390 Q 600 360, 660 390"/>
  <path d="M500 510 Q 600 540, 700 510"/>
`)

const borboleta = svg(`
  <line x1="600" y1="240" x2="600" y2="690"/>
  <circle cx="600" cy="225" r="18"/>
  <line x1="585" y1="210" x2="540" y2="170"/>
  <line x1="615" y1="210" x2="660" y2="170"/>
  <path d="M600 360 Q 360 180, 240 330 Q 180 450, 300 510 Q 450 540, 600 480 Z"/>
  <path d="M600 360 Q 840 180, 960 330 Q 1020 450, 900 510 Q 750 540, 600 480 Z"/>
  <path d="M600 500 Q 360 600, 300 780 Q 450 810, 600 660 Z"/>
  <path d="M600 500 Q 840 600, 900 780 Q 750 810, 600 660 Z"/>
`)

const carro = svg(`
  <path d="M180 600 L 220 450 Q 260 360, 400 360 L 800 360 Q 900 360, 960 450 L 1020 600 Z"/>
  <rect x="140" y="600" width="920" height="120" rx="20"/>
  <path d="M300 440 L 330 360 L 540 360 L 540 440 Z"/>
  <path d="M560 440 L 560 360 L 770 360 L 810 440 Z"/>
  <circle cx="340" cy="720" r="80"/>
  <circle cx="340" cy="720" r="35"/>
  <circle cx="860" cy="720" r="80"/>
  <circle cx="860" cy="720" r="35"/>
`)

export const BUILTIN_TEMPLATES = [
  { id: 'b_estrela',   nome: 'Estrela',   url: estrela,   builtin: true },
  { id: 'b_coracao',   nome: 'Coração',   url: coracao,   builtin: true },
  { id: 'b_flor',      nome: 'Flor',      url: flor,      builtin: true },
  { id: 'b_sol',       nome: 'Sol',       url: sol,       builtin: true },
  { id: 'b_borboleta', nome: 'Borboleta', url: borboleta, builtin: true },
  { id: 'b_peixe',     nome: 'Peixe',     url: peixe,     builtin: true },
  { id: 'b_casa',      nome: 'Casa',      url: casa,      builtin: true },
  { id: 'b_carro',     nome: 'Carro',     url: carro,     builtin: true }
]
