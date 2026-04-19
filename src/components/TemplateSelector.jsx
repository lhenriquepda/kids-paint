import { FileX2 } from 'lucide-react'

export default function TemplateSelector({ templates, ativo, onEscolher, corPerfil }) {
  const cor = corPerfil || '#5d6bf0'
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="flex items-stretch gap-3 px-3 py-2 min-w-max">
        <ItemTpl
          ativo={ativo === 'blank'}
          onClick={() => onEscolher('blank')}
          label="Tela em branco"
          cor={cor}
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
            cor={cor}
          >
            <img src={t.url} alt={t.nome} className="w-full h-full object-contain" draggable={false}/>
          </ItemTpl>
        ))}
      </div>
    </div>
  )
}

function ItemTpl({ ativo, onClick, children, label, cor }) {
  return (
    <button
      onClick={onClick}
      className={[
        'relative shrink-0 w-24 h-20 md:w-28 md:h-24 rounded-2xl bg-white dark:bg-neutral-800 p-2 transition',
        ativo
          ? 'shadow-soft scale-[1.03]'
          : 'ring-1 ring-black/5 dark:ring-white/10'
      ].join(' ')}
      style={ativo ? { boxShadow: `0 0 0 3px ${cor}` } : undefined}
      title={label}
    >
      {children}
    </button>
  )
}
