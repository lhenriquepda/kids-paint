import { useEffect, useMemo, useState } from 'react'
import { X, Moon, Sun, Upload, Eye, EyeOff, Trash2, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { listarProjetos, excluirProjeto, listarTemplates, uploadTemplate, setTemplateVisivel, hasSupabase } from '../lib/supabase.js'

export default function AdminPanel({ aberto, onFechar, dark, onToggleTema, onTemplatesChange }) {
  const [autorizado, setAutorizado] = useState(false)
  const [aba, setAba] = useState('aparencia')

  useEffect(() => { if (!aberto) setAutorizado(false) }, [aberto])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onFechar}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-neutral-900 rounded-3xl shadow-soft ring-1 ring-black/5 dark:ring-white/10 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-bold">Configurações</h2>
          <button onClick={onFechar} className="w-9 h-9 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center" aria-label="Fechar"><X size={18}/></button>
        </div>

        {!autorizado
          ? <Gate onOk={() => setAutorizado(true)}/>
          : (
            <>
              <div className="flex gap-1 p-2 border-b border-neutral-200 dark:border-neutral-800">
                <AbaBtn ativa={aba==='aparencia'} onClick={() => setAba('aparencia')}>Aparência</AbaBtn>
                <AbaBtn ativa={aba==='templates'} onClick={() => setAba('templates')}>Templates</AbaBtn>
                <AbaBtn ativa={aba==='galeria'}   onClick={() => setAba('galeria')}>Galeria</AbaBtn>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {aba === 'aparencia' && <Aparencia dark={dark} onToggleTema={onToggleTema}/>}
                {aba === 'templates' && <Templates onTemplatesChange={onTemplatesChange}/>}
                {aba === 'galeria'   && <Galeria/>}
              </div>
            </>
          )
        }
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Gate: controle parental com pergunta matemática
// ---------------------------------------------------------------------------
function Gate({ onOk }) {
  const desafio = useMemo(() => {
    const a = 4 + Math.floor(Math.random() * 6)
    const b = 4 + Math.floor(Math.random() * 6)
    return { a, b, r: a * b }
  }, [])
  const [v, setV] = useState('')
  const [erro, setErro] = useState(false)
  const tentar = () => {
    if (Number(v) === desafio.r) onOk()
    else { setErro(true); setV('') }
  }
  return (
    <div className="p-8 text-center">
      <p className="text-sm text-neutral-500 mb-2">Controle parental</p>
      <p className="text-lg mb-6">Quanto é <b>{desafio.a} × {desafio.b}</b>?</p>
      <div className="flex gap-2 justify-center">
        <input
          type="number" inputMode="numeric"
          value={v}
          onChange={e => { setV(e.target.value); setErro(false) }}
          onKeyDown={e => e.key === 'Enter' && tentar()}
          className={[
            'w-28 text-center text-xl font-bold rounded-xl px-4 py-3 bg-neutral-100 dark:bg-neutral-800 outline-none ring-1',
            erro ? 'ring-red-500' : 'ring-transparent focus:ring-brand-500'
          ].join(' ')}
          autoFocus
        />
        <button onClick={tentar} className="px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold">Entrar</button>
      </div>
      {erro && <p className="text-red-500 text-sm mt-3">Resposta incorreta</p>}
    </div>
  )
}

function AbaBtn({ ativa, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex-1 px-4 py-2 rounded-xl font-semibold text-sm transition',
        ativa ? 'bg-brand-500 text-white' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
      ].join(' ')}
    >{children}</button>
  )
}

// ---------------------------------------------------------------------------
// Aba: Aparência
// ---------------------------------------------------------------------------
function Aparencia({ dark, onToggleTema }) {
  return (
    <div>
      <h3 className="font-bold mb-4">Tema</h3>
      <button
        onClick={onToggleTema}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
      >
        <span className="flex items-center gap-3 font-semibold">
          {dark ? <Moon size={18}/> : <Sun size={18}/>} {dark ? 'Modo escuro' : 'Modo claro'}
        </span>
        <span className="text-sm text-neutral-500">Trocar</span>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Aba: Templates
// ---------------------------------------------------------------------------
function Templates({ onTemplatesChange }) {
  const [lista, setLista] = useState([])
  const [carregando, setCarregando] = useState(false)

  const recarregar = async () => {
    if (!hasSupabase) return
    try { setLista(await listarTemplates()) } catch (e) { console.error(e) }
  }
  useEffect(() => { recarregar() }, [])

  const onUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCarregando(true)
    try {
      await uploadTemplate({ file, nome: file.name.replace(/\.[^.]+$/, '') })
      await recarregar()
      onTemplatesChange?.()
    } catch (err) { alert('Erro ao enviar: ' + err.message) }
    setCarregando(false)
    e.target.value = ''
  }

  const alternar = async (t) => {
    await setTemplateVisivel(t.id, !t.visivel)
    await recarregar()
    onTemplatesChange?.()
  }

  if (!hasSupabase) return <p className="text-neutral-500">Configure o Supabase para gerenciar templates.</p>

  return (
    <div>
      <label className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold cursor-pointer transition w-fit">
        <Upload size={18}/>
        {carregando ? 'Enviando...' : 'Enviar template'}
        <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onUpload}/>
      </label>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        {lista.map(t => (
          <div key={t.id} className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden bg-white dark:bg-neutral-800">
            <div className="aspect-square bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
              <img src={t.url} alt={t.nome} className="w-full h-full object-contain"/>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-semibold truncate">{t.nome}</span>
              <button onClick={() => alternar(t)} className="w-8 h-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center justify-center">
                {t.visivel ? <Eye size={16}/> : <EyeOff size={16} className="text-neutral-400"/>}
              </button>
            </div>
          </div>
        ))}
      </div>
      {lista.length === 0 && <p className="text-neutral-500 text-sm mt-6">Nenhum template enviado ainda.</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Aba: Galeria
// ---------------------------------------------------------------------------
function Galeria() {
  const [projetos, setProjetos] = useState([])
  const [idx, setIdx] = useState({})   // {projetoId: versao_idx}

  const recarregar = async () => {
    if (!hasSupabase) return
    try {
      const ps = await listarProjetos()
      setProjetos(ps)
      const ini = {}
      ps.forEach(p => { ini[p.id] = (p.versoes?.length ?? 1) - 1 })
      setIdx(ini)
    } catch (e) { console.error(e) }
  }
  useEffect(() => { recarregar() }, [])

  const excluir = async (p) => {
    if (!confirm('Excluir esta obra?')) return
    await excluirProjeto(p.id)
    await recarregar()
  }

  const baixar = (url) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `obra_${Date.now()}.jpg`
    a.target = '_blank'
    document.body.appendChild(a); a.click(); a.remove()
  }

  if (!hasSupabase) return <p className="text-neutral-500">Configure o Supabase para ver a galeria.</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projetos.map(p => {
        const i = idx[p.id] ?? 0
        const url = p.versoes?.[i]
        const total = p.versoes?.length ?? 0
        return (
          <div key={p.id} className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden bg-white dark:bg-neutral-800">
            <div className="relative aspect-video bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
              {url ? <img src={url} className="w-full h-full object-contain" alt=""/> : <span className="text-neutral-400">Sem versões</span>}
              {total > 1 && (
                <>
                  <button onClick={() => setIdx(s => ({ ...s, [p.id]: Math.max(0, (s[p.id] ?? 0) - 1) }))} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-neutral-900/90 flex items-center justify-center shadow"><ChevronLeft size={18}/></button>
                  <button onClick={() => setIdx(s => ({ ...s, [p.id]: Math.min(total - 1, (s[p.id] ?? 0) + 1) }))} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-neutral-900/90 flex items-center justify-center shadow"><ChevronRight size={18}/></button>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs bg-black/60 text-white">{i + 1}/{total}</span>
                </>
              )}
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-neutral-500 truncate">{new Date(p.criado_em).toLocaleString('pt-BR')}</span>
              <div className="flex gap-1">
                <button onClick={() => baixar(url)} className="w-9 h-9 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center justify-center"><Download size={16}/></button>
                <button onClick={() => excluir(p)} className="w-9 h-9 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center justify-center"><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        )
      })}
      {projetos.length === 0 && <p className="text-neutral-500 text-sm col-span-full">Nenhuma obra salva ainda.</p>}
    </div>
  )
}
