import { FileX2 } from 'lucide-react'

export default function TemplateSelector({ templates, ativo, onEscolher }) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="flex items-stretch gap-3 px-3 py-2 min-w-max">
        <ItemTpl
          ativo={ativo === 'blank'}
          onClick={() => onEscolher('blank')}
          label="Tela em branco"
        >
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <FileX2 size={26}/>
          </div>
        </ItemTpl>

        {templates.map(t => (
          <ItemTpl
            key={t.id}
            ativo={ativo === t.id}
            onClick={() => onEscolher(t.id)}
            label={t.nome}
          >
            <img src={t.url} alt={t.nome} className="w-full h-full object-contain" draggable={false}/>
          </ItemTpl>
        ))}
      </div>
    </div>
  )
}

function ItemTpl({ ativo, onClick, children, label }) {
  return (
    <button
      onClick={onClick}
      className={[
        'relative shrink-0 w-24 h-20 md:w-28 md:h-24 rounded-2xl bg-white dark:bg-neutral-800 p-2 transition',
        ativo
          ? 'ring-2 ring-brand-500 shadow-soft scale-[1.03]'
          : 'ring-1 ring-black/5 dark:ring-white/10 hover:ring-brand-300'
      ].join(' ')}
      title={label}
    >
      {children}
    </button>
  )
}
