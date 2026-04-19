import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useZoom } from '../hooks/useZoom.js'
import { floodFill, hexToRgba } from '../hooks/useFloodFill.js'

// Tamanho padrão inicial (substituído pelo tamanho real do container no primeiro render)
const DEFAULT_W = 1200
const DEFAULT_H = 900

// Desenha a imagem do contorno centralizada com letterboxing,
// mantendo a proporção original da imagem.
function drawContornoFitted(ctx, img, cW, cH) {
  ctx.clearRect(0, 0, cW, cH)
  if (!img) return
  const imgR = img.naturalWidth / img.naturalHeight
  const cvR  = cW / cH
  let dx = 0, dy = 0, dw = cW, dh = cH
  if (imgR > cvR) {
    // Imagem mais larga: encaixa na largura, barras cima/baixo
    dh = cW / imgR
    dy = (cH - dh) / 2
  } else {
    // Imagem mais alta: encaixa na altura, barras esq/dir
    dw = cH * imgR
    dx = (cW - dw) / 2
  }
  ctx.drawImage(img, dx, dy, dw, dh)
}

const Canvas = forwardRef(function Canvas({
  ferramenta, cor, tamanho, corFundo, contornoSrc, onAlterado
}, ref) {
  const containerRef = useRef(null)
  const pinturaRef   = useRef(null)
  const contornoRef  = useRef(null)
  const pinturaCtx   = useRef(null)
  const contornoImg  = useRef(null)

  // Tamanho lógico atual do canvas (atualizado pelo ResizeObserver na 1ª vez)
  const cvSize = useRef({ w: DEFAULT_W, h: DEFAULT_H })
  // Garante que o canvas interno é inicializado apenas 1x (no 1º callback do ResizeObserver)
  const cvReady = useRef(false)

  const [displayW, setDisplayW] = useState(0)
  const [displayH, setDisplayH] = useState(0)

  const zoom = useZoom({ min: 1, max: 5 })
  const { setNaturalSize } = zoom

  // Snapshot do canvas antes do 1º toque para cancelar ponto ao pinçar
  const pinturaSnapshot = useRef(null)

  // --- Estado de desenho em refs ----------------------------------------
  const draw = useRef({
    desenhando: false, ultimo: null, controle: null,
    moveu: false, tapStart: 0, fillTimer: null,
    pointers: new Map()
  })

  // -- Helpers imperativos -----------------------------------------------
  useImperativeHandle(ref, () => ({
    exportar: () => ({ pintura: pinturaRef.current, contorno: contornoImg.current }),

    limpar: () => {
      const ctx = pinturaCtx.current
      if (!ctx) return
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, pinturaRef.current.width, pinturaRef.current.height)
      ctx.restore()
      onAlterado?.()
    },

    getPinturaDataUrl: () => pinturaRef.current?.toDataURL('image/png'),

    setPinturaDataUrl: async (dataUrl) => {
      if (!dataUrl) return
      const img = new Image()
      img.src = dataUrl
      await img.decode().catch(() => {})
      const ctx = pinturaCtx.current
      const { w, h } = cvSize.current
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, pinturaRef.current.width, pinturaRef.current.height)
      ctx.restore()
      ctx.drawImage(img, 0, 0, w, h)
    }
  }))

  // -- Inicializa o canvas interno com um tamanho específico -------------
  const initCanvases = useCallback((w, h) => {
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    cvSize.current = { w, h }

    // Pintura
    const pv = pinturaRef.current
    if (pv) {
      pv.width  = Math.floor(w * dpr)
      pv.height = Math.floor(h * dpr)
      const ctx = pv.getContext('2d', { willReadFrequently: true })
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      pinturaCtx.current = ctx
    }

    // Contorno
    const cv = contornoRef.current
    if (cv) {
      cv.width  = Math.floor(w * dpr)
      cv.height = Math.floor(h * dpr)
      const ctx = cv.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      // Redesenha contorno se já existir
      if (contornoImg.current) {
        drawContornoFitted(ctx, contornoImg.current, w, h)
      }
    }
  }, [])

  // -- ResizeObserver: CSS preenche container; canvas interno inicializado 1x
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect()
      if (rect.width < 4 || rect.height < 4) return
      const newW = Math.round(rect.width)
      const newH = Math.round(rect.height)

      if (!cvReady.current) {
        // Primeira vez: ajusta o canvas interno ao tamanho real do container
        cvReady.current = true
        initCanvases(newW, newH)
      }

      // CSS sempre preenche o container — zero desperdício de espaço
      setDisplayW(newW)
      setDisplayH(newH)
      setNaturalSize(newW, newH)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [initCanvases, setNaturalSize])

  // -- Canvas de pintura (fallback antes do ResizeObserver) --------------
  useEffect(() => {
    if (cvReady.current) return  // já inicializado pelo ResizeObserver
    const cv = pinturaRef.current
    if (!cv) return
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    cv.width  = Math.floor(DEFAULT_W * dpr)
    cv.height = Math.floor(DEFAULT_H * dpr)
    const ctx = cv.getContext('2d', { willReadFrequently: true })
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    pinturaCtx.current = ctx
  }, []) // eslint-disable-line

  // -- Contorno overlay --------------------------------------------------
  useEffect(() => {
    const cv = contornoRef.current
    if (!cv) return
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const { w, h } = cvSize.current

    if (!contornoSrc) {
      contornoImg.current = null
      cv.width  = Math.floor(w * dpr)
      cv.height = Math.floor(h * dpr)
      const ctx = cv.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      return
    }

    const img = new Image()
    img.onload = () => {
      contornoImg.current = img
      const { w: cW, h: cH } = cvSize.current  // usa tamanho atual (pode ter mudado)
      cv.width  = Math.floor(cW * dpr)
      cv.height = Math.floor(cH * dpr)
      const ctx = cv.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Desenha centralizado mantendo proporção do template (letterbox/pillarbox)
      drawContornoFitted(ctx, img, cW, cH)
    }
    img.src = contornoSrc
  }, [contornoSrc])

  // -- Conversão de coordenadas (via getBoundingClientRect — correto mesmo com zoom) --
  const toCanvas = useCallback((clientX, clientY) => {
    const rect = pinturaRef.current.getBoundingClientRect()
    const { w, h } = cvSize.current
    const x = ((clientX - rect.left) / rect.width)  * w
    const y = ((clientY - rect.top)  / rect.height) * h
    return { x, y }
  }, [])

  // -- Desenho -----------------------------------------------------------
  const aplicarModo = (ctx) => {
    ctx.globalCompositeOperation = ferramenta === 'borracha' ? 'destination-out' : 'source-over'
  }

  const desenharPonto = (ctx, x, y, pressao) => {
    const raio = (tamanho / 2) * (0.7 + pressao * 0.6)
    aplicarModo(ctx)
    ctx.fillStyle = cor
    ctx.beginPath()
    ctx.arc(x, y, raio, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  const desenharLinha = (ctx, p0, p1, p2, pressao) => {
    aplicarModo(ctx)
    ctx.strokeStyle = cor
    ctx.lineWidth = tamanho * (0.7 + pressao * 0.6)
    ctx.beginPath()
    ctx.moveTo(p0.x, p0.y)
    ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y)
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
  }

  const maskContorno = () => {
    const cv = contornoRef.current
    if (!cv || !contornoImg.current) return null
    return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height)
  }

  const baldeEm = (x, y) => {
    const ctx = pinturaCtx.current
    if (!ctx) return false
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const px = Math.floor(x * dpr)
    const py = Math.floor(y * dpr)
    if (px < 0 || py < 0 || px >= ctx.canvas.width || py >= ctx.canvas.height) return false
    const mask = maskContorno()
    if (mask) {
      const mi = (py * ctx.canvas.width + px) * 4 + 3
      if (mask.data[mi] > 128) return false
    }
    const cur  = ctx.getImageData(px, py, 1, 1).data
    const alvo = hexToRgba(cor)
    const mesmoCor =
      Math.abs(cur[0]-alvo[0]) + Math.abs(cur[1]-alvo[1]) + Math.abs(cur[2]-alvo[2]) < 12
      && cur[3] > 200
    if (mesmoCor) return false
    floodFill(ctx, px, py, cor, 30, mask)
    return true
  }

  // -- Pointer events ----------------------------------------------------
  const onPointerDown = (e) => {
    const el = e.currentTarget
    el.setPointerCapture?.(e.pointerId)
    if (e.pointerType === 'touch' && (e.width > 40 || e.height > 40)) return
    draw.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (draw.current.pointers.size >= 2) {
      draw.current.desenhando = false
      if (pinturaSnapshot.current && pinturaCtx.current) {
        pinturaCtx.current.putImageData(pinturaSnapshot.current, 0, 0)
        pinturaSnapshot.current = null
      }
      zoom.onPointersChange(draw.current.pointers, 'down')
      return
    }

    if (e.pointerType === 'touch' && pinturaCtx.current) {
      const cv = pinturaRef.current
      pinturaSnapshot.current = pinturaCtx.current.getImageData(0, 0, cv.width, cv.height)
    }

    const p = toCanvas(e.clientX, e.clientY)
    draw.current.ultimo   = p
    draw.current.controle = p
    draw.current.moveu    = false
    draw.current.tapStart = performance.now()
    draw.current.desenhando = true
    draw.current.tapPoint = p

    if (ferramenta === 'balde') {
      if (baldeEm(p.x, p.y)) onAlterado?.()
    } else {
      desenharPonto(pinturaCtx.current, p.x, p.y, e.pressure || 0.5)
      onAlterado?.()
    }
  }

  const onPointerMove = (e) => {
    if (!draw.current.pointers.has(e.pointerId)) return
    draw.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (draw.current.pointers.size >= 2) {
      zoom.onPointersChange(draw.current.pointers, 'move')
      return
    }

    if (!draw.current.desenhando) return
    const p = toCanvas(e.clientX, e.clientY)
    const dx = p.x - draw.current.ultimo.x
    const dy = p.y - draw.current.ultimo.y
    if (Math.hypot(dx, dy) < 0.5) return

    if (draw.current.tapPoint) {
      const ddx = p.x - draw.current.tapPoint.x
      const ddy = p.y - draw.current.tapPoint.y
      if (Math.hypot(ddx, ddy) > 5) draw.current.moveu = true
    }

    if (ferramenta === 'balde') {
      if (baldeEm(p.x, p.y)) onAlterado?.()
      draw.current.ultimo = p
      return
    }

    const ctx = pinturaCtx.current
    const anterior = draw.current.ultimo
    const controle = draw.current.controle || anterior
    const meio = { x: (controle.x + p.x) / 2, y: (controle.y + p.y) / 2 }
    desenharLinha(ctx, anterior, controle, meio, e.pressure || 0.5)
    draw.current.ultimo   = meio
    draw.current.controle = p
    onAlterado?.()
  }

  const onPointerUp = (e) => {
    draw.current.pointers.delete(e.pointerId)
    zoom.onPointersChange(draw.current.pointers, 'up')
    if (!draw.current.desenhando) return
    draw.current.desenhando = false
    draw.current.ultimo = draw.current.controle = draw.current.tapPoint = null
    draw.current.moveu  = false
    pinturaSnapshot.current = null
  }

  const onPointerCancel = onPointerUp

  useEffect(() => { zoom.setContainer(containerRef.current) }, [zoom.setContainer])

  const transform = `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})`

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none select-none"
      style={{ background: corFundo }}
    >
      <div
        className="relative overflow-hidden bg-white dark:bg-neutral-900
                   md:shadow-soft md:rounded-2xl
                   md:ring-1 md:ring-black/5 md:dark:ring-white/10"
        style={{
          width:  displayW || '100%',
          height: displayH || '100%',
          transform,
          transformOrigin: 'center center',
          transition: draw.current.pointers.size === 0 ? 'transform 120ms ease-out' : 'none'
        }}
      >
        <canvas
          ref={pinturaRef}
          className="absolute inset-0 w-full h-full block"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOut={onPointerCancel}
          onPointerCancel={onPointerCancel}
        />
        <canvas
          ref={contornoRef}
          className="absolute inset-0 w-full h-full block pointer-events-none"
        />
      </div>

      {zoom.scale > 1.001 && (
        <button
          onClick={zoom.reset}
          className="absolute top-3 right-3 rounded-full bg-white/90 dark:bg-neutral-800/90
                     backdrop-blur px-3 py-1.5 shadow-soft ring-1 ring-black/5 dark:ring-white/10
                     flex items-center gap-1.5 text-xs font-semibold"
          aria-label="Resetar zoom"
        >
          <RotateCcw size={14}/> Resetar zoom
        </button>
      )}
    </div>
  )
})

export default Canvas
