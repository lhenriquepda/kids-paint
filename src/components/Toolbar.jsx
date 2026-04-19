import { useState, useRef, useEffect } from 'react'
import { Brush, Eraser, PaintBucket, Palette, Star, Download, Trash2, Moon, Sun, Settings, MoreHorizontal, Expand } from 'lucide-react'

const TAMANHOS = [
  { key: 'p', label: 'P', px: 6 },
  { key: 'm', label: 'M', px: 18 },
  { key: 'g', label: 'G', px: 35 }
]
const FERRAMENTAS = [
  { key: 'pincel',   Icon: Brush,       label: 'Pincel'   },
  { key: 'balde',    Icon: PaintBucket, label: 'Balde'    },
  { key: 'borracha', Icon: Eraser,      label: 'Borracha' }
]

// ── Popup genérico: abre acima, âncora à esquerda ou direita ──────────
function Popup({ open, onClose, anchorRight = false, children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => {
      const handler = (e) => {
        if (ref.current && !ref.current.contains(e.target)) onClose()
      }
      document.addEventListener('pointerdown', handler, true)
      return () => document.removeEventListener('pointerdown', handler, true)
    }, 30)
    return () => clearTimeout(id)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      ref={ref}
      className={[
        'absolute bottom-full z-50 mb-2',
        'bg-white dark:bg-neutral-900 rounded-2xl',
        'shadow-[0_8px_32px_rgba(0,0,0,0.22)]',
        'ring-1 ring-black/10 dark:ring-white/10 p-2',
        anchorRight ? 'right-0' : 'left-0'
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export default function Toolbar({
  ferramenta, setFerramenta,
  tamanho,    setTamanho,
  cor,        onAbrirPaleta,
  onSalvar,   salvando, podeSalvar,
  onExportar,
  onLimpar,
  dark,       onToggleTema,
  onAbrirAdmin,
  onImersivo,
  corPerfil
}) {
  const accent = corPerfil || '#5d6bf0'
  const [popup, setPopup] = useState(null)
  const toggle = (name) => setPopup(p => p === name ? null : name)

  const ferrAtual = FERRAMENTAS.find(f => f.key === ferramenta) || FERRAMENTAS[0]
  const { Icon: FerrIcon } = ferrAtual

  return (
    <div className="w-full">

      {/* ══════════════════════════════════════════════════════════
          MOBILE — barra horizontal na base, 5 botões equilibrados
         ══════════════════════════════════════════════════════════ */}
      <div className="md:hidden bg-white/95 dark:bg-neutral-900/95 backdrop-blur
                      border-t border-neutral-200 dark:border-neutral-800
                      px-3 py-2">
        <div className="flex items-center justify-between">

          {/* ─── 1. FERRAMENTA + TAMANHO ─────────────────── */}
          <div className="relative">
            <BarBtn
              active={popup === 'ferr'}
              accent={accent}
              onClick={() => toggle('ferr')}
              label={ferrAtual.label}
            >
              <FerrIcon size={22} color={popup === 'ferr' ? '#fff' : undefined} />
            </BarBtn>

            {/* Popup VERTICAL alinhado à esquerda */}
            <Popup open={popup === 'ferr'} onClose={() => setPopup(null)} anchorRight={false}>
              <div className="flex flex-col gap-0.5 min-w-[170px]">
                {FERRAMENTAS.map(({ key, Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => { setFerramenta(key); setPopup(null) }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left"
                    style={ferramenta === key
                      ? { background: accent, color: '#fff' }
                      : { background: 'transparent' }}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-semibold">{label}</span>
                  </button>
                ))}

                <div className="h-px bg-neutral-200 dark:bg-neutral-700 mx-1 my-1" />

                {/* Tamanhos em linha */}
                <div className="flex gap-1 px-1 pb-1">
                  {TAMANHOS.map(t => (
                    <button
                      key={t.key}
                      onClick={() => { setTamanho(t.px); setPopup(null) }}
                      className="flex-1 h-10 rounded-xl flex items-center justify-center transition"
                      style={tamanho === t.px
                        ? { background: accent }
                        : { background: '#f0f0f0' }}
                      aria-label={`Tamanho ${t.label}`}
                    >
                      <span className="rounded-full block" style={{
                        width:  Math.min(20, 4 + t.px / 2),
                        height: Math.min(20, 4 + t.px / 2),
                        background: tamanho === t.px ? '#fff' : '#666'
                      }} />
                    </button>
                  ))}
                </div>
              </div>
            </Popup>
          </div>

          {/* ─── 2. COR ──────────────────────────────────── */}
          <button
            onClick={onAbrirPaleta}
            className="w-12 h-12 rounded-2xl flex items-center justify-center
                       ring-2 ring-black/10 dark:ring-white/15
                       hover:scale-105 transition"
            style={{ background: cor }}
            aria-label="Escolher cor"
          >
            <Palette size={16} className="text-white mix-blend-difference" />
          </button>

          {/* ─── 3. SALVAR ⭐ ─────────────────────────────── */}
          <button
            onClick={onSalvar}
            disabled={!podeSalvar || salvando}
            className="h-12 px-3 rounded-2xl flex items-center gap-1.5
                       font-bold text-xs text-white
                       disabled:opacity-40 transition"
            style={{ background: accent }}
            title={salvando ? 'Salvando...' : 'Salvar'}
          >
            <Star size={20} fill="#FACC15" stroke="#CA8A04" strokeWidth={1.5} />
            <span>{salvando ? '...' : 'Salvar'}</span>
          </button>

          {/* ─── 4. MAIS ··· ─────────────────────────────── */}
          <div className="relative">
            <BarBtn
              active={popup === 'mais'}
              accent={accent}
              onClick={() => toggle('mais')}
              label="Mais"
            >
              <MoreHorizontal size={22} color={popup === 'mais' ? '#fff' : undefined} />
            </BarBtn>

            {/* Popup 2×2 alinhado à direita */}
            <Popup open={popup === 'mais'} onClose={() => setPopup(null)} anchorRight={true}>
              <div className="grid grid-cols-2 gap-1.5">
                <MiniAcao icon={<Download size={20}/>}  label="Baixar"
                  onClick={() => { onExportar(); setPopup(null) }}/>
                <MiniAcao icon={<Trash2 size={20}/>}    label="Limpar"
                  onClick={() => { onLimpar(); setPopup(null) }}/>
                <MiniAcao
                  icon={dark ? <Sun size={20}/> : <Moon size={20}/>}
                  label={dark ? 'Claro' : 'Escuro'}
                  onClick={() => { onToggleTema(); setPopup(null) }}/>
                <MiniAcao icon={<Settings size={18}/>}  label="Admin"
                  onClick={() => { onAbrirAdmin(); setPopup(null) }}/>
              </div>
            </Popup>
          </div>

          {/* ─── 5. TELA CHEIA ───────────────────────────── */}
          <BarBtn
            active={false}
            accent={accent}
            onClick={onImersivo}
            label="Tela cheia"
          >
            <Expand size={20} />
          </BarBtn>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DESKTOP — barra vertical na lateral
         ══════════════════════════════════════════════════════════ */}
      <div className="hidden md:block
                      bg-white/90 dark:bg-neutral-900/90 backdrop-blur
                      border-l border-neutral-200 dark:border-neutral-800
                      rounded-2xl shadow-soft
                      ring-1 ring-black/5 dark:ring-white/10
                      px-4 py-4">
        <div className="flex flex-col items-center gap-4">

          {/* Ferramentas */}
          <div className="flex flex-col gap-2">
            {FERRAMENTAS.map(({ key, Icon, label }) => {
              const ativa = ferramenta === key
              return (
                <button key={key}
                  onClick={() => setFerramenta(key)}
                  className={['w-12 h-12 rounded-xl flex items-center justify-center transition',
                    ativa ? 'text-white shadow-soft'
                           : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  ].join(' ')}
                  style={ativa ? { background: accent } : undefined}
                  aria-label={label} title={label}
                >
                  <Icon size={22} />
                </button>
              )
            })}
          </div>

          {/* Tamanhos */}
          <div className="flex flex-col gap-2">
            {TAMANHOS.map(t => {
              const ativo = tamanho === t.px
              return (
                <button key={t.key}
                  onClick={() => setTamanho(t.px)}
                  className={['w-11 h-11 rounded-xl flex items-center justify-center transition',
                    ativo ? 'text-white shadow-soft'
                           : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  ].join(' ')}
                  style={ativo ? { background: accent } : undefined}
                  aria-label={`Tamanho ${t.label}`}
                >
                  <span className="rounded-full bg-current block"
                    style={{
                      width:   Math.min(22, 4 + t.px / 2),
                      height:  Math.min(22, 4 + t.px / 2),
                      opacity: ativo ? 1 : 0.7
                    }}
                  />
                </button>
              )
            })}
          </div>

          {/* Cor */}
          <button
            onClick={onAbrirPaleta}
            className="relative w-11 h-11 rounded-xl
                       ring-1 ring-black/10 dark:ring-white/15
                       flex items-center justify-center
                       hover:scale-105 transition"
            style={{ background: cor }}
            aria-label="Escolher cor"
          >
            <Palette size={16} className="text-white mix-blend-difference" />
          </button>

          <div className="h-px w-8 bg-neutral-200 dark:bg-neutral-700" />

          {/* Ações */}
          <div className="flex flex-col gap-2">
            <AcaoBtn
              onClick={onSalvar}
              disabled={!podeSalvar || salvando}
              icon={<Star size={22} fill="#FACC15" stroke="#CA8A04" strokeWidth={1.5}/>}
              label={salvando ? 'Salvando...' : 'Salvar'}
              primary cor={accent}
            />
            <AcaoBtn onClick={onExportar} icon={<Download size={20}/>} label="Baixar"/>
            <AcaoBtn onClick={onLimpar}   icon={<Trash2 size={20}/>}   label="Limpar"/>
            <AcaoBtn onClick={onToggleTema}
              icon={dark ? <Sun size={20}/> : <Moon size={20}/>}
              label={dark ? 'Claro' : 'Escuro'}/>
            <AcaoBtn onClick={onImersivo} icon={<Expand size={18}/>} label="Tela cheia"/>
            <AcaoBtn onClick={onAbrirAdmin} icon={<Settings size={18}/>} label=""/>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Botão da barra mobile ──────────────────────────────────────────────
function BarBtn({ active, accent, onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 rounded-2xl flex items-center justify-center transition
                 active:scale-95"
      style={active
        ? { background: accent }
        : { background: 'rgb(243,244,246)' /* gray-100 */ }}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

// ── Item do popup "Mais" (grade 2×2) ──────────────────────────────────
function MiniAcao({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-[76px] h-[76px] rounded-2xl
                 bg-neutral-100 dark:bg-neutral-800
                 hover:bg-neutral-200 dark:hover:bg-neutral-700
                 flex flex-col items-center justify-center gap-1.5 transition"
    >
      {icon}
      <span className="text-xs font-semibold leading-none">{label}</span>
    </button>
  )
}

// ── Botão de ação da barra desktop ────────────────────────────────────
function AcaoBtn({ onClick, disabled, icon, label, primary, cor }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'h-10 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition',
        primary
          ? 'text-white disabled:!bg-neutral-300 dark:disabled:!bg-neutral-700 disabled:text-neutral-500'
          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50'
      ].join(' ')}
      style={primary && !disabled ? { background: cor || '#5d6bf0' } : undefined}
      title={label}
    >
      {icon}
      {label && <span className="hidden md:inline">{label}</span>}
    </button>
  )
}
