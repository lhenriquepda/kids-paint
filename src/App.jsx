import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Canvas from './components/Canvas.jsx'
import Toolbar from './components/Toolbar.jsx'
import ColorPicker from './components/ColorPicker.jsx'
import TemplateSelector from './components/TemplateSelector.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import WelcomeScreen from './components/WelcomeScreen.jsx'
import Login from './components/Login.jsx'
import ProfilePicker from './components/ProfilePicker.jsx'
import {
  hasSupabase, listarTemplates, salvarObra,
  getUser, onAuthChange,
  listarPerfis, getPerfilAtivoId, setPerfilAtivoId
} from './lib/supabase.js'
// listarPerfis usado dentro de recarregarTpls para ler builtins_ocultos atualizado
import { processarContorno, comporObra, canvasParaBlob } from './lib/imageProcessing.js'
import { BUILTIN_TEMPLATES } from './lib/builtinTemplates.js'
import { Expand, Shrink } from 'lucide-react'

const DARK_KEY = 'kp_dark'
const BOAS_KEY = 'kp_boas_vindas_sessao'

export default function App() {
  // ---------- Tema ----------
  const [dark, setDark] = useState(() => localStorage.getItem(DARK_KEY) === '1')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(DARK_KEY, dark ? '1' : '0')
  }, [dark])
  const corFundo = dark ? '#0a0a0a' : '#ffffff'

  // ---------- Boas-vindas por sessão (fullscreen) ----------
  const [bemVindo, setBemVindo] = useState(() => !sessionStorage.getItem(BOAS_KEY))
  const entrar = () => { sessionStorage.setItem(BOAS_KEY, '1'); setBemVindo(false) }

  // ---------- Auth ----------
  const [authCarregando, setAuthCarregando] = useState(true)
  const [user, setUser] = useState(null)
  useEffect(() => {
    let vivo = true
    ;(async () => {
      const u = await getUser()
      if (vivo) { setUser(u); setAuthCarregando(false) }
    })()
    const off = onAuthChange((u) => { setUser(u) })
    return () => { vivo = false; off() }
  }, [])

  // ---------- Perfil ativo (por dispositivo, localStorage) ----------
  const [perfilAtivo, setPerfilAtivoState] = useState(null)
  const [perfilCarregando, setPerfilCarregando] = useState(false)

  const setPerfilAtivo = useCallback((p) => {
    setPerfilAtivoState(p)
    setPerfilAtivoId(p?.id ?? null)
  }, [])

  // Quando muda de usuário, tenta resolver o perfil ativo desse device
  useEffect(() => {
    if (!user) { setPerfilAtivoState(null); return }
    let vivo = true
    ;(async () => {
      setPerfilCarregando(true)
      const id = getPerfilAtivoId()
      try {
        const perfis = await listarPerfis()
        const escolhido = perfis.find(p => p.id === id) || null
        if (vivo) setPerfilAtivoState(escolhido)
      } catch (e) { console.error(e) }
      if (vivo) setPerfilCarregando(false)
    })()
    return () => { vivo = false }
  }, [user?.id])

  // ---------- Ferramentas ----------
  const [ferramenta, setFerramenta] = useState('pincel')
  const [tamanho, setTamanho]       = useState(18)
  const [cor, setCor]               = useState('#EF4444')
  const [paletaAberta, setPaletaAberta] = useState(false)
  const [adminAberto, setAdminAberto]   = useState(false)
  const [imersivo, setImersivo]         = useState(false)

  // ---------- Templates ----------
  const [templates, setTemplates] = useState(BUILTIN_TEMPLATES)
  const [templateId, setTemplateId] = useState('blank')
  const [contornoSrc, setContornoSrc] = useState(null)

  // ---------- Salvamento ----------
  const [alterado, setAlterado] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Guarda pintura por template (memória local da sessão)
  const cacheRef = useRef({})
  const canvasRef = useRef(null)

  // Carrega templates do perfil ativo. Embutidos são filtrados pelos
  // ocultos que o perfil escolheu no Admin.
  const recarregarTpls = useCallback(async () => {
    if (!hasSupabase || !perfilAtivo) {
      setTemplates(BUILTIN_TEMPLATES)
      return
    }
    // Re-lê o perfil para obter builtins_ocultos atualizado
    let ocultos = perfilAtivo.builtins_ocultos || []
    try {
      const perfis = await listarPerfis()
      const atualizado = perfis.find(p => p.id === perfilAtivo.id)
      if (atualizado?.builtins_ocultos) ocultos = atualizado.builtins_ocultos
    } catch (e) { /* mantém o que temos */ }

    const embutidosVisiveis = BUILTIN_TEMPLATES.filter(t => !ocultos.includes(t.id))
    try {
      const ts = (await listarTemplates(perfilAtivo.id)).filter(t => t.visivel)
      setTemplates([...embutidosVisiveis, ...ts])
    } catch (e) {
      console.error(e)
      setTemplates(embutidosVisiveis)
    }
  }, [perfilAtivo?.id])
  useEffect(() => { recarregarTpls() }, [recarregarTpls])

  // Ao trocar de perfil: limpa canvas e cache, volta pra tela em branco
  useEffect(() => {
    cacheRef.current = {}
    setTemplateId('blank')
    setContornoSrc(null)
    setAlterado(false)
    setTimeout(() => canvasRef.current?.limpar?.(), 10)
  }, [perfilAtivo?.id])

  // Processa contorno (template + tema)
  useEffect(() => {
    let ativo = true
    ;(async () => {
      if (templateId === 'blank') { setContornoSrc(null); return }
      const tpl = templates.find(t => t.id === templateId)
      if (!tpl) { setContornoSrc(null); return }
      try {
        const url = await processarContorno(tpl.url, { dark })
        if (ativo) setContornoSrc(url)
      } catch (err) {
        console.error('Erro ao processar contorno', err)
        if (ativo) setContornoSrc(tpl.url)
      }
    })()
    return () => { ativo = false }
  }, [templateId, templates, dark])

  const trocarTemplate = async (novoId) => {
    if (novoId === templateId) return
    const dataAtual = canvasRef.current?.getPinturaDataUrl?.()
    if (dataAtual) cacheRef.current[templateId] = dataAtual

    setTemplateId(novoId)

    setTimeout(async () => {
      const data = cacheRef.current[novoId]
      if (data) await canvasRef.current?.setPinturaDataUrl?.(data)
      else canvasRef.current?.limpar?.()
      setAlterado(false)
    }, 30)
  }

  const onSalvar = async () => {
    if (!hasSupabase) { alert('Configure o Supabase para salvar.'); return }
    if (!perfilAtivo) { alert('Selecione um perfil antes de salvar.'); return }
    if (!canvasRef.current) return
    setSalvando(true)
    try {
      const { pintura, contorno } = canvasRef.current.exportar()
      const cv = comporObra({
        pintura, contorno,
        largura: pintura.width, altura: pintura.height,
        corFundo
      })
      const blob = await canvasParaBlob(cv, 0.5)
      const tpl = templates.find(t => t.id === templateId)
      await salvarObra({
        blob,
        perfilId: perfilAtivo.id,
        templateId,
        templateUrl: tpl?.url ?? null
      })
      setAlterado(false)
    } catch (e) {
      console.error(e)
      alert('Não foi possível salvar: ' + e.message)
    }
    setSalvando(false)
  }

  const onExportar = async () => {
    if (!canvasRef.current) return
    const { pintura, contorno } = canvasRef.current.exportar()
    const cv = comporObra({
      pintura, contorno,
      largura: pintura.width, altura: pintura.height,
      corFundo
    })
    const blob = await canvasParaBlob(cv, 0.9)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Arte_${Date.now()}.jpg`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const onLimpar = () => {
    if (!confirm('Limpar toda a pintura?')) return
    canvasRef.current?.limpar?.()
    cacheRef.current[templateId] = null
    setAlterado(false)
  }

  const onAlterado = useCallback(() => { if (!alterado) setAlterado(true) }, [alterado])

  // ---------- Render: fluxos bloqueantes ----------
  if (bemVindo) return <WelcomeScreen onEntrar={entrar}/>

  if (hasSupabase) {
    if (authCarregando) return <TelaEspera mensagem="Carregando..."/>
    if (!user)        return <Login/>
    if (perfilCarregando) return <TelaEspera mensagem="Carregando perfil..."/>
    if (!perfilAtivo) return <ProfilePicker onEscolher={setPerfilAtivo}/>
  }

  return (
    <div className="min-h-screen h-screen flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col min-h-0">
        {!imersivo && (
        <header className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur">
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="hidden md:flex items-center gap-2 px-2 py-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-pink-400 flex items-center justify-center text-white font-extrabold">P</div>
              <span className="font-extrabold tracking-tight">Pintar</span>
            </div>

            {perfilAtivo && (
              <button
                onClick={() => setAdminAberto(true)}
                className="shrink-0 flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                title="Abrir configurações (protegido por senha)"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: perfilAtivo.cor }}>
                  {perfilAtivo.nome.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-sm hidden sm:inline">{perfilAtivo.nome}</span>
              </button>
            )}

            <div className="flex-1 min-w-0">
              <TemplateSelector templates={templates} ativo={templateId} onEscolher={trocarTemplate} corPerfil={perfilAtivo?.cor}/>
            </div>
          </div>
        </header>
        )}

        <main className="flex-1 min-h-0 p-2 md:p-4 relative">
          <Canvas
            ref={canvasRef}
            ferramenta={ferramenta}
            cor={cor}
            tamanho={tamanho}
            corFundo={corFundo}
            contornoSrc={contornoSrc}
            onAlterado={onAlterado}
          />
        </main>
      </div>

      {!imersivo && (
      <aside className="shrink-0 md:w-[84px] md:p-3 md:pl-0">
        <Toolbar
          ferramenta={ferramenta} setFerramenta={setFerramenta}
          tamanho={tamanho} setTamanho={setTamanho}
          cor={cor} onAbrirPaleta={() => setPaletaAberta(true)}
          onSalvar={onSalvar} salvando={salvando} podeSalvar={alterado && hasSupabase && !!perfilAtivo}
          onExportar={onExportar}
          onLimpar={onLimpar}
          dark={dark} onToggleTema={() => setDark(d => !d)}
          onAbrirAdmin={() => setAdminAberto(true)}
          corPerfil={perfilAtivo?.cor}
        />
      </aside>
      )}

      {/* Botão flutuante de tela cheia — sempre visível */}
      <button
        onClick={() => setImersivo(v => !v)}
        className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full text-white shadow-xl ring-2 ring-white/40 dark:ring-black/30 flex items-center justify-center hover:scale-110 active:scale-95 transition"
        style={{ background: perfilAtivo?.cor || '#5d6bf0' }}
        title={imersivo ? 'Sair da tela cheia' : 'Tela cheia'}
        aria-label={imersivo ? 'Sair da tela cheia' : 'Tela cheia'}
      >
        {imersivo ? <Shrink size={26}/> : <Expand size={26}/>}
      </button>

      {paletaAberta && <ColorPicker cor={cor} setCor={setCor} onFechar={() => setPaletaAberta(false)}/>}

      <AdminPanel
        aberto={adminAberto}
        onFechar={() => setAdminAberto(false)}
        dark={dark}
        onToggleTema={() => setDark(d => !d)}
        perfilAtivo={perfilAtivo}
        setPerfilAtivo={setPerfilAtivo}
        userEmail={user?.email}
        onTemplatesChange={recarregarTpls}
      />
    </div>
  )
}

function TelaEspera({ mensagem }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-brand-100 via-white to-pink-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
      <p className="text-neutral-500 font-semibold">{mensagem}</p>
    </div>
  )
}
