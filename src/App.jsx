import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Canvas from './components/Canvas.jsx'
import Toolbar from './components/Toolbar.jsx'
import ColorPicker from './components/ColorPicker.jsx'
import TemplateSelector from './components/TemplateSelector.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import WelcomeScreen from './components/WelcomeScreen.jsx'
import { hasSupabase, listarTemplates, salvarObra, getSessaoId } from './lib/supabase.js'
import { processarContorno, comporObra, canvasParaBlob } from './lib/imageProcessing.js'
import { BUILTIN_TEMPLATES } from './lib/builtinTemplates.js'

const DARK_KEY  = 'kp_dark'
const BOAS_KEY  = 'kp_boas_vindas_sessao'

export default function App() {
  // Tema
  const [dark, setDark] = useState(() => localStorage.getItem(DARK_KEY) === '1')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(DARK_KEY, dark ? '1' : '0')
  }, [dark])

  const corFundo = dark ? '#0a0a0a' : '#ffffff'

  // Boas-vindas — a flag fica em sessionStorage pra aparecer a cada nova
  // sessão (nova aba/relaunch do PWA), garantindo o passo pelo botão que
  // aciona o fullscreen no celular.
  const [bemVindo, setBemVindo] = useState(() => !sessionStorage.getItem(BOAS_KEY))
  const entrar = () => { sessionStorage.setItem(BOAS_KEY, '1'); setBemVindo(false) }

  // Ferramentas
  const [ferramenta, setFerramenta] = useState('pincel')
  const [tamanho, setTamanho]       = useState(18)
  const [cor, setCor]               = useState('#EF4444')
  const [paletaAberta, setPaletaAberta] = useState(false)
  const [adminAberto, setAdminAberto]   = useState(false)

  // Templates
  const [templates, setTemplates] = useState([])
  const [templateId, setTemplateId] = useState('blank')
  const [contornoSrc, setContornoSrc] = useState(null)

  // Salvamento
  const [alterado, setAlterado] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Guarda pintura por template (em memória)
  const cacheRef = useRef({}) // { [tplId]: dataURL }

  // Canvas ref
  const canvasRef = useRef(null)

  // Carrega templates visíveis
  const recarregarTpls = useCallback(async () => {
    if (!hasSupabase) {
      setTemplates(BUILTIN_TEMPLATES)
      return
    }
    try {
      const ts = (await listarTemplates()).filter(t => t.visivel)
      setTemplates([...BUILTIN_TEMPLATES, ...ts])
    } catch (e) {
      console.error(e)
      setTemplates(BUILTIN_TEMPLATES)
    }
  }, [])
  useEffect(() => { recarregarTpls() }, [recarregarTpls])

  // Processa contorno quando template ou tema mudam
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

  // Troca de template: salva/restaura pintura em memória
  const trocarTemplate = async (novoId) => {
    if (novoId === templateId) return
    // salva atual
    const dataAtual = canvasRef.current?.getPinturaDataUrl?.()
    if (dataAtual) cacheRef.current[templateId] = dataAtual

    setTemplateId(novoId)

    // restaura novo (após o próximo paint)
    setTimeout(async () => {
      const data = cacheRef.current[novoId]
      if (data) {
        await canvasRef.current?.setPinturaDataUrl?.(data)
      } else {
        canvasRef.current?.limpar?.()
      }
      setAlterado(false)
    }, 30)
  }

  // Salvar
  const onSalvar = async () => {
    if (!hasSupabase) { alert('Configure o Supabase para salvar.'); return }
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
        sessaoId: getSessaoId(),
        templateId,
        templateUrl: tpl?.url ?? null,
        contornoDataUrl: null
      })
      setAlterado(false)
    } catch (e) {
      console.error(e)
      alert('Não foi possível salvar: ' + e.message)
    }
    setSalvando(false)
  }

  // Exportar JPEG 90%
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

  const onAlterado = useCallback(() => {
    if (!alterado) setAlterado(true)
  }, [alterado])

  if (bemVindo) return <WelcomeScreen onEntrar={entrar}/>

  return (
    <div className="min-h-screen h-screen flex flex-col md:flex-row">
      {/* Área principal */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header com templates */}
        <header className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur">
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="hidden md:flex items-center gap-2 px-2 py-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-pink-400 flex items-center justify-center text-white font-extrabold">P</div>
              <span className="font-extrabold tracking-tight">Pintar</span>
            </div>
            <div className="flex-1 min-w-0">
              <TemplateSelector templates={templates} ativo={templateId} onEscolher={trocarTemplate}/>
            </div>
          </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 min-h-0 p-2 md:p-4">
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

      {/* Toolbar (direita no desktop / baixo no mobile) */}
      <aside className="shrink-0 md:w-[84px] md:p-3 md:pl-0">
        <Toolbar
          ferramenta={ferramenta} setFerramenta={setFerramenta}
          tamanho={tamanho} setTamanho={setTamanho}
          cor={cor} onAbrirPaleta={() => setPaletaAberta(true)}
          onSalvar={onSalvar} salvando={salvando} podeSalvar={alterado && hasSupabase}
          onExportar={onExportar}
          onLimpar={onLimpar}
          dark={dark} onToggleTema={() => setDark(d => !d)}
          onAbrirAdmin={() => setAdminAberto(true)}
        />
      </aside>

      {paletaAberta && <ColorPicker cor={cor} setCor={setCor} onFechar={() => setPaletaAberta(false)}/>}

      <AdminPanel
        aberto={adminAberto}
        onFechar={() => setAdminAberto(false)}
        dark={dark}
        onToggleTema={() => setDark(d => !d)}
        onTemplatesChange={recarregarTpls}
      />
    </div>
  )
}
