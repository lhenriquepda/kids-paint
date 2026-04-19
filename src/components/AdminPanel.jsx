import { useEffect, useMemo, useState } from 'react'
import { X, Moon, Sun, Upload, Eye, EyeOff, Trash2, ChevronLeft, ChevronRight, Download, Lock, LogOut, UserCog, Check, Link as LinkIcon, ImagePlus } from 'lucide-react'
import {
  listarProjetos, excluirProjeto,
  listarTemplates, uploadTemplate, setTemplateVisivel, excluirTemplate,
  listarPerfis, criarPerfil, atualizarPerfil, excluirPerfil,
  verificarSenha, signOut, hasSupabase,
  setBuiltinVisivel
} from '../lib/supabase.js'
import { BUILTIN_TEMPLATES } from '../lib/builtinTemplates.js'

const CORES_PERFIL = ['#5d6bf0', '#ef4444', '#f97316', '#eab308', '#16a34a', '#06b6d4', '#db2777', '#7c3aed']

export default function AdminPanel({
  aberto, onFechar,
  dark, onToggleTema,
  perfilAtivo, setPerfilAtivo,
  userEmail,
  onTemplatesChange
}) {
  const [autorizado, setAutorizado] = useState(false)
  const [aba, setAba] = useState('perfis')

  useEffect(() => { if (!aberto) setAutorizado(false) }, [aberto])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onFechar}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-neutral-900 rounded-3xl shadow-soft ring-1 ring-black/5 dark:ring-white/10 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-bold">Configurações</h2>
            {userEmail && <p className="text-xs text-neutral-500 mt-0.5">{userEmail}</p>}
          </div>
          <button onClick={onFechar} className="w-9 h-9 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center" aria-label="Fechar"><X size={18}/></button>
        </div>

        {!autorizado
          ? <Gate onOk={() => setAutorizado(true)}/>
          : (
            <>
              <div className="flex gap-1 p-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                <AbaBtn ativa={aba==='perfis'}     onClick={() => setAba('perfis')}>Perfis</AbaBtn>
                <AbaBtn ativa={aba==='templates'}  onClick={() => setAba('templates')}>Templates</AbaBtn>
                <AbaBtn ativa={aba==='galeria'}    onClick={() => setAba('galeria')}>Galeria</AbaBtn>
                <AbaBtn ativa={aba==='aparencia'}  onClick={() => setAba('aparencia')}>Aparência</AbaBtn>
                <AbaBtn ativa={aba==='conta'}      onClick={() => setAba('conta')}>Conta</AbaBtn>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {aba === 'perfis'    && <Perfis perfilAtivo={perfilAtivo} setPerfilAtivo={setPerfilAtivo}/>}
                {aba === 'templates' && <Templates perfilAtivo={perfilAtivo} onTemplatesChange={onTemplatesChange}/>}
                {aba === 'galeria'   && <Galeria perfilAtivo={perfilAtivo}/>}
                {aba === 'aparencia' && <Aparencia dark={dark} onToggleTema={onToggleTema}/>}
                {aba === 'conta'     && <Conta/>}
              </div>
            </>
          )
        }
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Gate: pede a senha do login todas as vezes
// ---------------------------------------------------------------------------
function Gate({ onOk }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro]   = useState(false)
  const [carregando, setCarregando] = useState(false)

  const tentar = async (e) => {
    e?.preventDefault?.()
    if (!senha) return
    setCarregando(true); setErro(false)
    const ok = await verificarSenha(senha)
    setCarregando(false)
    if (ok) onOk()
    else { setErro(true); setSenha('') }
  }

  return (
    <form onSubmit={tentar} className="p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
        <Lock size={20}/>
      </div>
      <p className="text-sm text-neutral-500 mb-2">Controle parental</p>
      <p className="text-base mb-5">Digite a senha da sua conta para continuar</p>
      <div className="flex gap-2 justify-center">
        <input
          type="password" autoFocus
          value={senha} onChange={e => { setSenha(e.target.value); setErro(false) }}
          className={['w-64 text-center rounded-xl px-4 py-3 bg-neutral-100 dark:bg-neutral-800 outline-none ring-1 font-semibold',
            erro ? 'ring-red-500' : 'ring-transparent focus:ring-brand-500'
          ].join(' ')}
          placeholder="••••••••"
        />
        <button disabled={carregando} type="submit" className="px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold disabled:opacity-60">
          {carregando ? '...' : 'Entrar'}
        </button>
      </div>
      {erro && <p className="text-red-500 text-sm mt-3">Senha incorreta</p>}
    </form>
  )
}

function AbaBtn({ ativa, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2 rounded-xl font-semibold text-sm transition whitespace-nowrap',
        ativa ? 'bg-brand-500 text-white' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
      ].join(' ')}
    >{children}</button>
  )
}

// ---------------------------------------------------------------------------
// Perfis
// ---------------------------------------------------------------------------
function Perfis({ perfilAtivo, setPerfilAtivo }) {
  const [perfis, setPerfis] = useState([])
  const [editando, setEditando] = useState(null) // perfil em edição
  const [criando, setCriando] = useState(false)

  const recarregar = async () => {
    try { setPerfis(await listarPerfis()) } catch (e) { console.error(e) }
  }
  useEffect(() => { recarregar() }, [])

  const aoCriar = async ({ nome, cor }) => {
    const p = await criarPerfil({ nome, cor })
    setCriando(false)
    await recarregar()
    setPerfilAtivo(p)
  }
  const aoAtualizar = async (id, campos) => {
    await atualizarPerfil(id, campos)
    setEditando(null)
    await recarregar()
    if (perfilAtivo?.id === id) setPerfilAtivo({ ...perfilAtivo, ...campos })
  }
  const aoExcluir = async (p) => {
    if (!confirm(`Excluir o perfil "${p.nome}" e todos os desenhos/templates dele?`)) return
    await excluirPerfil(p.id)
    if (perfilAtivo?.id === p.id) setPerfilAtivo(null)
    await recarregar()
  }
  const aoAtivar = (p) => setPerfilAtivo(p)

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {perfis.map(p => {
          const ativo = perfilAtivo?.id === p.id
          return (
            <div key={p.id} className={['rounded-2xl p-4 ring-1 transition flex items-center gap-3',
              ativo ? 'ring-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'ring-black/5 dark:ring-white/10 bg-white dark:bg-neutral-800'
            ].join(' ')}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold" style={{ background: p.cor }}>
                {p.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{p.nome}</p>
                {ativo && <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1"><Check size={12}/> Ativo neste dispositivo</p>}
              </div>
              <div className="flex gap-1">
                {!ativo && (
                  <button onClick={() => aoAtivar(p)} className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold">Ativar</button>
                )}
                <button onClick={() => setEditando(p)} className="w-9 h-9 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center justify-center" title="Editar"><UserCog size={16}/></button>
                <button onClick={() => aoExcluir(p)} className="w-9 h-9 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center justify-center" title="Excluir"><Trash2 size={16}/></button>
              </div>
            </div>
          )
        })}
        <button
          onClick={() => setCriando(true)}
          className="rounded-2xl p-4 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-brand-500 hover:text-brand-500 text-neutral-400 font-bold flex items-center justify-center gap-2"
        >
          + Novo perfil
        </button>
      </div>

      {(criando || editando) && (
        <EditorPerfil
          inicial={editando}
          onCancelar={() => { setCriando(false); setEditando(null) }}
          onSalvar={(campos) => editando ? aoAtualizar(editando.id, campos) : aoCriar(campos)}
        />
      )}
    </div>
  )
}

function EditorPerfil({ inicial, onCancelar, onSalvar }) {
  const [nome, setNome] = useState(inicial?.nome || '')
  const [cor, setCor]   = useState(inicial?.cor || CORES_PERFIL[0])

  const submit = (e) => {
    e.preventDefault()
    if (!nome.trim()) return
    onSalvar({ nome: nome.trim(), cor })
  }
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-10" onClick={onCancelar}>
      <form onSubmit={submit} className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-soft ring-1 ring-black/5 dark:ring-white/10" onClick={e => e.stopPropagation()}>
        <h3 className="font-extrabold text-lg mb-4">{inicial ? 'Editar perfil' : 'Novo perfil'}</h3>
        <input autoFocus value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" maxLength={24}
          className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 font-semibold"/>
        <div className="mt-4 flex flex-wrap gap-2">
          {CORES_PERFIL.map(c => (
            <button key={c} type="button" onClick={() => setCor(c)}
              className={['w-9 h-9 rounded-full transition', cor===c ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'ring-1 ring-black/10 dark:ring-white/15'].join(' ')}
              style={{ background: c }}/>
          ))}
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <button type="button" onClick={onCancelar} className="px-4 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold text-sm">Cancelar</button>
          <button type="submit" className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm">Salvar</button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Aparência
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
// Conta
// ---------------------------------------------------------------------------
function Conta() {
  const sair = async () => {
    if (!confirm('Sair da conta?')) return
    await signOut()
    location.reload()
  }
  return (
    <div>
      <h3 className="font-bold mb-4">Conta</h3>
      <button
        onClick={sair}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
      >
        <span className="flex items-center gap-3 font-semibold"><LogOut size={18}/> Sair da conta</span>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Templates (do perfil ativo)
// ---------------------------------------------------------------------------
function Templates({ perfilAtivo, onTemplatesChange }) {
  const [lista, setLista] = useState([])
  const [ocultos, setOcultos] = useState(() => perfilAtivo?.builtins_ocultos || [])
  const [progresso, setProgresso] = useState(null) // { feito, total, falhas }
  const [dragAtivo, setDragAtivo] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [enviandoLink, setEnviandoLink] = useState(false)

  const recarregar = async () => {
    if (!hasSupabase || !perfilAtivo) return
    try { setLista(await listarTemplates(perfilAtivo.id)) } catch (e) { console.error(e) }
  }
  useEffect(() => {
    recarregar()
    setOcultos(perfilAtivo?.builtins_ocultos || [])
  }, [perfilAtivo?.id])

  const alternarBuiltin = async (tplId, visivel) => {
    try {
      const novo = await setBuiltinVisivel(perfilAtivo.id, tplId, visivel)
      setOcultos(novo)
      if (perfilAtivo) perfilAtivo.builtins_ocultos = novo
      onTemplatesChange?.()
    } catch (err) { alert('Erro: ' + err.message) }
  }

  if (!perfilAtivo) return <p className="text-neutral-500">Ative um perfil para gerenciar templates.</p>

  const processarArquivos = async (fileList) => {
    const arr = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (arr.length === 0) { alert('Selecione imagens (PNG, JPG, SVG, etc.)'); return }
    let falhas = 0
    setProgresso({ feito: 0, total: arr.length, falhas: 0 })
    for (let i = 0; i < arr.length; i++) {
      try {
        await uploadTemplate({
          file: arr[i],
          nome: arr[i].name.replace(/\.[^.]+$/, ''),
          perfilId: perfilAtivo.id
        })
      } catch (err) {
        console.error(err)
        falhas++
      }
      setProgresso({ feito: i + 1, total: arr.length, falhas })
    }
    await recarregar()
    onTemplatesChange?.()
    setTimeout(() => setProgresso(null), 1800)
  }

  const onUpload = (e) => {
    if (!e.target.files?.length) return
    processarArquivos(e.target.files)
    e.target.value = ''
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragAtivo(false)
    if (!e.dataTransfer.files?.length) return
    processarArquivos(e.dataTransfer.files)
  }
  const onDragOver = (e) => { e.preventDefault(); setDragAtivo(true) }
  const onDragLeave = (e) => { e.preventDefault(); setDragAtivo(false) }

  const enviarLink = async () => {
    const u = linkUrl.trim()
    if (!u) return
    setEnviandoLink(true)
    try {
      // Tenta fetch direto; se CORS bloquear, tenta via proxy público
      let blob = null
      try {
        const resp = await fetch(u, { mode: 'cors' })
        if (!resp.ok) throw new Error('HTTP ' + resp.status)
        blob = await resp.blob()
      } catch {
        const resp2 = await fetch('https://corsproxy.io/?' + encodeURIComponent(u))
        if (!resp2.ok) throw new Error('HTTP ' + resp2.status)
        blob = await resp2.blob()
      }
      if (!blob || !blob.type.startsWith('image/')) throw new Error('A URL não retornou uma imagem')
      const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg').replace('svg+xml', 'svg')
      const urlClean = u.split('?')[0]
      const baseName = decodeURIComponent(urlClean.split('/').pop() || 'imagem')
        .replace(/\.[^.]+$/, '')
        .slice(0, 60) || 'imagem'
      const file = new File([blob], `${baseName}.${ext}`, { type: blob.type })
      await uploadTemplate({ file, nome: baseName, perfilId: perfilAtivo.id })
      await recarregar()
      onTemplatesChange?.()
      setLinkUrl('')
    } catch (err) {
      alert('Não foi possível baixar a imagem.\n' + err.message + '\n\nSe a origem bloqueia CORS, baixe no dispositivo e envie como arquivo.')
    }
    setEnviandoLink(false)
  }

  const alternar = async (t) => {
    await setTemplateVisivel(t.id, !t.visivel)
    await recarregar()
    onTemplatesChange?.()
  }

  const excluir = async (t) => {
    if (!confirm(`Excluir o template "${t.nome}"?`)) return
    await excluirTemplate(t.id)
    await recarregar()
    onTemplatesChange?.()
  }

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-3">
        Perfil: <b className="text-neutral-900 dark:text-neutral-100">{perfilAtivo.nome}</b>
      </p>

      {/* Zona de upload: clique OU arraste vários arquivos */}
      <label
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={[
          'block w-full rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition mb-3',
          dragAtivo
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-[1.01]'
            : 'border-neutral-300 dark:border-neutral-700 hover:border-brand-400 bg-neutral-50 dark:bg-neutral-800/40'
        ].join(' ')}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onUpload}
          disabled={!!progresso}
        />
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center shadow-soft">
            <ImagePlus size={22} className="text-brand-500"/>
          </div>
          <p className="font-bold text-sm">
            {dragAtivo ? 'Solte para enviar' : 'Arraste imagens aqui ou toque para escolher'}
          </p>
          <p className="text-xs text-neutral-500">
            Pode enviar várias de uma vez (PNG, JPG, SVG…)
          </p>
        </div>
      </label>

      {/* Enviar por link */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3">
          <LinkIcon size={16} className="text-neutral-400 shrink-0"/>
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') enviarLink() }}
            placeholder="Cole um link de imagem (https://…)"
            className="flex-1 bg-transparent py-2 outline-none text-sm"
            disabled={enviandoLink}
          />
        </div>
        <button
          onClick={enviarLink}
          disabled={!linkUrl.trim() || enviandoLink}
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm whitespace-nowrap"
        >
          {enviandoLink ? 'Baixando…' : 'Adicionar link'}
        </button>
      </div>

      {/* Barra de progresso */}
      {progresso && (
        <div className="mb-4 p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-200 dark:ring-brand-800">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span>
              {progresso.feito < progresso.total
                ? `Enviando ${progresso.feito + 1} de ${progresso.total}…`
                : `Concluído: ${progresso.feito - progresso.falhas} enviado(s)${progresso.falhas ? `, ${progresso.falhas} falharam` : ''}`}
            </span>
            <span className="text-brand-600 dark:text-brand-400">{Math.round((progresso.feito / progresso.total) * 100)}%</span>
          </div>
          <div className="h-2 bg-white dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all"
              style={{ width: `${(progresso.feito / progresso.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Embutidos */}
      <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-2">Embutidos</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {BUILTIN_TEMPLATES.map(t => {
          const visivel = !ocultos.includes(t.id)
          return (
            <div key={t.id} className={[
              'rounded-2xl ring-1 overflow-hidden bg-white dark:bg-neutral-800 transition',
              visivel ? 'ring-black/5 dark:ring-white/10' : 'ring-black/5 dark:ring-white/10 opacity-50'
            ].join(' ')}>
              <div className="aspect-square bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                <img src={t.url} alt={t.nome} className="w-full h-full object-contain"/>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-semibold truncate flex-1 mr-2">{t.nome}</span>
                <button
                  onClick={() => alternarBuiltin(t.id, !visivel)}
                  className={[
                    'px-3 py-1 rounded-lg text-xs font-bold transition',
                    visivel
                      ? 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                      : 'bg-brand-500 hover:bg-brand-600 text-white'
                  ].join(' ')}
                  title={visivel ? 'Desativar' : 'Ativar'}
                >
                  {visivel ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Uploads */}
      <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-2">Seus uploads</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {lista.map(t => (
          <div key={t.id} className={[
            'rounded-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden bg-white dark:bg-neutral-800 transition',
            t.visivel ? '' : 'opacity-50'
          ].join(' ')}>
            <div className="aspect-square bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
              <img src={t.url} alt={t.nome} className="w-full h-full object-contain"/>
            </div>
            <div className="flex items-center justify-between px-3 py-2 gap-1">
              <span className="text-sm font-semibold truncate flex-1 mr-1">{t.nome}</span>
              <button
                onClick={() => alternar(t)}
                className={[
                  'px-3 py-1 rounded-lg text-xs font-bold transition',
                  t.visivel
                    ? 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                    : 'bg-brand-500 hover:bg-brand-600 text-white'
                ].join(' ')}
              >
                {t.visivel ? 'Desativar' : 'Ativar'}
              </button>
              <button onClick={() => excluir(t)} className="w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center justify-center" title="Excluir"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
      {lista.length === 0 && <p className="text-neutral-500 text-sm mt-3">Nenhum template enviado neste perfil ainda.</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Galeria (do perfil ativo)
// ---------------------------------------------------------------------------
function Galeria({ perfilAtivo }) {
  const [projetos, setProjetos] = useState([])
  const [idx, setIdx] = useState({})

  const recarregar = async () => {
    if (!hasSupabase || !perfilAtivo) return
    try {
      const ps = await listarProjetos(perfilAtivo.id)
      setProjetos(ps)
      const ini = {}
      ps.forEach(p => { ini[p.id] = (p.versoes?.length ?? 1) - 1 })
      setIdx(ini)
    } catch (e) { console.error(e) }
  }
  useEffect(() => { recarregar() }, [perfilAtivo?.id])

  if (!perfilAtivo) return <p className="text-neutral-500">Ative um perfil para ver a galeria.</p>

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

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-4">Perfil: <b className="text-neutral-900 dark:text-neutral-100">{perfilAtivo.nome}</b></p>
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
        {projetos.length === 0 && <p className="text-neutral-500 text-sm col-span-full">Nenhuma obra salva neste perfil ainda.</p>}
      </div>
    </div>
  )
}
