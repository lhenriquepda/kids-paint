import { Brush, Eraser, PaintBucket, Palette, Save, Download, Trash2, Moon, Sun, Settings, Maximize2 } from 'lucide-react'

const TAMANHOS = [
  { key: 'p', label: 'P', px: 6 },
  { key: 'm', label: 'M', px: 18 },
  { key: 'g', label: 'G', px: 35 }
]

export default function Toolbar({
  ferramenta, setFerramenta,
  tamanho, setTamanho,
  cor, onAbrirPaleta,
  onSalvar, salvando, podeSalvar,
  onExportar,
  onLimpar,
  dark, onToggleTema,
  onAbrirAdmin,
  onImersivo
}) {
  return (
    <div className="w-full">
      <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-t border-neutral-200 dark:border-neutral-800 md:border-t-0 md:border-l md:rounded-2xl md:shadow-soft md:ring-1 md:ring-black/5 md:dark:ring-white/10 px-3 py-3 md:px-4 md:py-4">
        <div className="flex md:flex-col items-center justify-between md:justify-start gap-3 md:gap-4">

          {/* Ferramentas */}
          <div className="flex md:flex-col gap-2">
            <FerramentaBtn ativa={ferramenta==='pincel'}   onClick={() => setFerramenta('pincel')}   icon={<Brush size={22}/>}       label="Pincel"/>
            <FerramentaBtn ativa={ferramenta==='balde'}    onClick={() => setFerramenta('balde')}    icon={<PaintBucket size={22}/>} label="Balde"/>
            <FerramentaBtn ativa={ferramenta==='borracha'} onClick={() => setFerramenta('borracha')} icon={<Eraser size={22}/>}      label="Borracha"/>
          </div>

          {/* Tamanhos */}
          <div className="flex md:flex-col gap-2">
            {TAMANHOS.map(t => (
              <button
                key={t.key}
                onClick={() => setTamanho(t.px)}
                className={[
                  'w-11 h-11 rounded-xl flex items-center justify-center transition',
                  tamanho===t.px
                    ? 'bg-brand-500 text-white shadow-soft'
                    : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                ].join(' ')}
                aria-label={`Tamanho ${t.label}`}
              >
                <span className="rounded-full bg-current block"
                      style={{ width: Math.min(22, 4 + t.px/2), height: Math.min(22, 4 + t.px/2), opacity: tamanho===t.px ? 1 : 0.7 }}/>
              </button>
            ))}
          </div>

          {/* Cor atual */}
          <button
            onClick={onAbrirPaleta}
            className="relative w-11 h-11 rounded-xl ring-1 ring-black/10 dark:ring-white/15 flex items-center justify-center hover:scale-105 transition"
            style={{ background: cor }}
            aria-label="Escolher cor"
          >
            <Palette size={16} className="text-white mix-blend-difference"/>
          </button>

          <div className="h-px w-8 md:w-8 md:h-px bg-neutral-200 dark:bg-neutral-700 hidden md:block"/>

          {/* Ações */}
          <div className="flex md:flex-col gap-2 ml-auto md:ml-0">
            <AcaoBtn onClick={onSalvar} disabled={!podeSalvar || salvando} icon={<Save size={20}/>}  label={salvando ? 'Salvando...' : 'Salvar'} primary />
            <AcaoBtn onClick={onExportar} icon={<Download size={20}/>} label="Baixar"/>
            <AcaoBtn onClick={onLimpar}   icon={<Trash2 size={20}/>}   label="Limpar"/>
            <AcaoBtn onClick={onImersivo} icon={<Maximize2 size={18}/>} label="Tela cheia"/>
            <AcaoBtn onClick={onToggleTema} icon={dark ? <Sun size={20}/> : <Moon size={20}/>} label={dark ? 'Claro' : 'Escuro'}/>
            <AcaoBtn onClick={onAbrirAdmin} icon={<Settings size={18}/>} label=""/>
          </div>
        </div>
      </div>
    </div>
  )
}

function FerramentaBtn({ ativa, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition',
        ativa
          ? 'bg-brand-500 text-white shadow-soft'
          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
      ].join(' ')}
      aria-label={label}
      title={label}
    >{icon}</button>
  )
}

function AcaoBtn({ onClick, disabled, icon, label, primary }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'h-11 md:h-10 px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition',
        primary
          ? 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:text-neutral-500'
          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50'
      ].join(' ')}
      title={label}
    >
      {icon}
      {label && <span className="hidden md:inline">{label}</span>}
    </button>
  )
}
