import { X } from 'lucide-react'

const PALETA = [
  // Vermelhos
  '#8A1C1C', '#C81E1E', '#EF4444', '#FCA5A5',
  // Laranjas
  '#9A3412', '#EA580C', '#F97316', '#FDBA74',
  // Amarelos
  '#A16207', '#EAB308', '#FACC15', '#FEF08A',
  // Verdes
  '#166534', '#16A34A', '#4ADE80', '#86EFAC',
  // Cianos
  '#155E75', '#0891B2', '#06B6D4', '#67E8F9',
  // Azuis
  '#1E3A8A', '#2563EB', '#60A5FA', '#93C5FD',
  // Roxos + Rosas
  '#5B21B6', '#7C3AED', '#DB2777', '#F472B6',
  // Marrons + Neutros
  '#713F12', '#000000', '#6B7280', '#FFFFFF'
]

export default function ColorPicker({ cor, setCor, onFechar }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={onFechar}>
      <div
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-soft ring-1 ring-black/5 dark:ring-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Escolha uma cor</h2>
          <button onClick={onFechar} className="w-9 h-9 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center" aria-label="Fechar"><X size={18}/></button>
        </div>

        <div className="grid grid-cols-8 gap-2">
          {PALETA.map(c => (
            <button
              key={c}
              onClick={() => { setCor(c); onFechar?.() }}
              className={[
                'aspect-square rounded-lg ring-2 transition hover:scale-110',
                cor.toLowerCase() === c.toLowerCase()
                  ? 'ring-brand-500'
                  : 'ring-black/5 dark:ring-white/10'
              ].join(' ')}
              style={{ background: c }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <label className="text-sm font-semibold">Cor personalizada</label>
          <input
            type="color"
            value={cor}
            onChange={e => setCor(e.target.value)}
            className="w-12 h-10 rounded-lg cursor-pointer"
          />
          <span className="text-xs text-neutral-500 font-mono">{cor.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}
