import { useState, useRef, useEffect } from 'react'
import { Brush, Eraser, PaintBucket, Palette, Star, Download, Trash2, Moon, Sun, Settings, MoreHorizontal } from 'lucide-react'

const TAMANHOS = [
  { key: 'p', label: 'P', px: 6 },
  { key: 'm', label: 'M', px: 18 },
  { key: 'g', label: 'G', px: 35 }
]
const FERRAMENTAS = [
  { key: 'pincel',   Icon: Brush,        label: 'Pincel'   },
  { key: 'balde',    Icon: PaintBucket,  label: 'Balde'    },
  { key: 'borracha', Icon: Eraser,       label: 'Borracha' }
]

// ---------- Popup flutuante (abre acima do botão) ----------
function Popup({ open, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    // Pequeno delay para a abertura não ser capturada como fechamento
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
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                 bg-white dark:bg-neutral-900 rounded-2xl
                 shadow-[0_8px_32px_rgba(0,0,0,0.22)]
                 ring-1 ring-black/10 dark:ring-white/10 p-2"
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
  corPerfil
}) {
  const accent = corPerfil || '#5d6bf0'
  const [popup, setPopup] = useState(null) // null | 'ferr' | 'mais'
  const toggle = (name) => setPopup(p => p === name ? null : name)

  const ferrAtual = FERRAMENTAS.find(f => f.key === ferramenta) || FERRAMENTAS[0]
  const { Icon: FerrIcon } = ferrAtual

  return (
    <div className="w-full">

      {/* ══════════════════════════════════════════════════════
          MOBILE  —  barra horizontal fixada na base
         ══════════════════════════════════════════════════════ */}
      <div className="md:hidden bg-white/95 dark:bg-neutral-900/95 backdrop-blur
                      border-t border-neutral-200 dark:border-neutral-800
                      px-4 py-2">
        <div className="flex items-center justify-between gap-2">

          {/* ── FERRAMENTA + TAMANHO (popup acima) ── */}
          <div className="relative">
            <button
              onClick={() => toggle('ferr')}
              className="w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center transition"
              style={{ background: popup === 'ferr' ? accent : '#f0f0f0' }}
              aria-label={ferrAtual.label}
              title={ferrAtual.label}
            >
              <FerrIcon size={24} color={popup === 'ferr' ? '#fff' : undefined} />
            </button>

            <Popup open={popup === 'ferr'} onClose={() => setPopup(null)}>
              <div className="flex gap-2 items-center">
                {/* Ferramentas */}
                {FERRAMENTAS.map(({ key, Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => { setFerramenta(key); setPopup(null) }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition"
                    style={ferramenta === key
                      ? { background: accent, color: '#fff' }
                      : { background: '#f0f0f0' }}
                    title={label}
                  >
                    <Icon size={22} />
                  </button>
                ))}

                {/* Divisor */}
                <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-700 mx-1" />

                {/* Tamanhos */}
                {TAMANHOS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => { setTamanho(t.px); setPopup(null) }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition"
                    style={tamanho === t.px
                      ? { background: accent }
                      : { background: '#f0f0f0' }}
                    aria-label={`Tamanho ${t.label}`}
                  >
                    <span
                      className="rounded-full block"
                      style={{
                        width:  Math.min(22, 4 + t.px / 2),
                        height: Math.min(22, 4 + t.px / 2),
                        background: tamanho === t.px ? '#fff' : '#555'
                      }}
                    />
                  </button>
                ))}
              </div>
            </Popup>
          </div>

          {/* ── COR ── */}
          <button
            onClick={onAbrirPaleta}
            className="w-12 h-12 rounded-2xl flex items-center justify-center
                       ring-2 ring-black/10 dark:ring-white/15
                       hover:scale-105 transition shrink-0"
            style={{ background: cor }}
            aria-label="Escolher cor"
          >
            <Palette size={16} className="text-white mix-blend-difference" />
          </button>

          {/* ── SALVAR ⭐ ── */}
          <button
            onClick={onSalvar}
            disabled={!podeSalvar || salvando}
            className="h-12 px-3 rounded-2xl flex items-center gap-1.5
                       font-bold text-xs text-white
                       disabled:opacity-40 transition shrink-0"
            style={{ background: accent }}
            title={salvando ? 'Salvando...' : 'Salvar'}
          >
            <Star size={20} fill="#FACC15" stroke="#CA8A04" strokeWidth={1.5} />
            <span>{salvando ? '...' : 'Salvar'}</span>
          </button>

          {/* ── MAIS (...) ── */}
          <div className="relative">
            <button
              onClick={() => toggle('mais')}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition"
              style={{ background: popup === 'mais' ? accent : '#f0f0f0' }}
              aria-label="Mais opções"
            >
              <MoreHorizontal size={22} color={popup === 'mais' ? '#fff' : undefined} />
            </button>

            <Popup open={popup === 'mais'} onClose={() => setPopup(null)}>
              <div className="flex gap-2">
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

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP  —  barra vertical na lateral
         ══════════════════════════════════════════════════════ */}
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
            <AcaoBtn onClick={onAbrirAdmin} icon={<Settings size={18}/>} label=""/>
          </div>

        </div>
      </div>
    </div>
  )
}

function MiniAcao({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800
                 hover:bg-neutral-200 dark:hover:bg-neutral-700
                 flex flex-col items-center justify-center gap-1 transition"
    >
      {icon}
      <span className="text-xs font-semibold leading-none">{label}</span>
    </button>
  )
}

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
