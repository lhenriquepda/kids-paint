import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useZoom } from '../hooks/useZoom.js'
import { floodFill, hexToRgba } from '../hooks/useFloodFill.js'

const CANVAS_W = 1200
const CANVAS_H = 900

const Canvas = forwardRef(function Canvas({
  ferramenta, cor, tamanho, corFundo, contornoSrc, onAlterado
}, ref) {
  // corFundo só afeta o container (tema) — a pintura fica transparente e é
  // composta sobre o fundo apenas na exportação.
  const containerRef = useRef(null)
  const pinturaRef   = useRef(null)
  const contornoRef  = useRef(null)
  const pinturaCtx   = useRef(null)
  const contornoImg  = useRef(null)

  const [displayW, setDisplayW] = useState(0)
  const [displayH, setDisplayH] = useState(0)

  const zoom = useZoom({ min: 1, max: 5 })
  const { setNaturalSize } = zoom

  // --- Estado de desenho em refs (evita re-render a cada ponto) --------
  const draw = useRef({
    desenhando: false,
    ultimo: null,
    controle: null,
    moveu: false,
    tapStart: 0,
    fillTimer: null,
    pointers: new Map()
  })
  // Snapshot do canvas antes do primeiro toque — restaurado se pinça for detectada
  const pinturaSnapshot = useRef(null)

  // -- Helpers imperativos ---------------------------------------------
  useImperativeHandle(ref, () => ({
    exportar: () => ({
      pintura: pinturaRef.current,
      contorno: contornoImg.current
    }),
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
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, pinturaRef.current.width, pinturaRef.current.height)
      ctx.restore()
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H)
    }
  }))

  // -- Canvas preenche o container inteiro (sem barras laterais) ------
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect()
      if (rect.width < 4 || rect.height < 4) return
      setDisplayW(rect.width)
      setDisplayH(rect.height)
      setNaturalSize(rect.width, rect.height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [setNaturalSize])

  // -- Prepara canvas de pintura ---------------------------------------
  useEffect(() => {
    const cv = pinturaRef.current
    if (!cv) return
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    cv.width  = Math.floor(CANVAS_W * dpr)
    cv.height = Math.floor(CANVAS_H * dpr)
    const ctx = cv.getContext('2d', { willReadFrequently: true })
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    pinturaCtx.current = ctx
  }, []) // eslint-disable-line

  // Quando muda o tema, repinta o fundo onde for "tinta de fundo" (limitado).
  // Aqui só atualizamos corFundo em borracha.
  // O fundo do canvas em si permanece; o tema muda apenas o contorno.

  // -- Contorno overlay -------------------------------------------------
  useEffect(() => {
    if (!contornoSrc) {
      contornoImg.current = null
      const cv = contornoRef.current
      if (cv) {
        const ctx = cv.getContext('2d')
        const dpr = Math.max(1, window.devicePixelRatio || 1)
        cv.width = Math.floor(CANVAS_W * dpr); cv.height = Math.floor(CANVAS_H * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
      }
      return
    }
    const img = new Image()
    img.onload = () => {
      contornoImg.current = img
      const cv = contornoRef.current
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      cv.width  = Math.floor(CANVAS_W * dpr)
      cv.height = Math.floor(CANVAS_H * dpr)
      const ctx = cv.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
      ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H)
    }
    img.src = contornoSrc
  }, [contornoSrc])

  // -- Conversão de coordenadas --------------------------------------
  const toCanvas = useCallback((clientX, clientY) => {
    const rect = pinturaRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width)  * CANVAS_W
    const y = ((clientY - rect.top)  / rect.height) * CANVAS_H
    return { x, y }
  }, [])

  // -- Desenho ---------------------------------------------------------
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
    const ctx = cv.getContext('2d')
    return ctx.getImageData(0, 0, cv.width, cv.height)
  }

  // Dispara flood fill em (x,y) se o pixel alvo ainda não tem a cor atual.
  // Também bloqueia se o ponto cai sobre o contorno (a máscara detecta isso).
  const baldeEm = (x, y) => {
    const ctx = pinturaCtx.current
    if (!ctx) return false
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const px = Math.floor(x * dpr)
    const py = Math.floor(y * dpr)
    if (px < 0 || py < 0 || px >= ctx.canvas.width || py >= ctx.canvas.height) return false

    // Checa contorno (barrier) — não dispara em cima dele
    const mask = maskContorno()
    if (mask) {
      const mi = (py * ctx.canvas.width + px) * 4 + 3
      if (mask.data[mi] > 128) return false
    }

    // Checa se o pixel atual já está com a cor alvo (evita reprocessar)
    const cur  = ctx.getImageData(px, py, 1, 1).data
    const alvo = hexToRgba(cor)
    const dr = cur[0] - alvo[0]
    const dg = cur[1] - alvo[1]
    const db = cur[2] - alvo[2]
    const mesmoCor = (Math.abs(dr) + Math.abs(dg) + Math.abs(db) < 12) && cur[3] > 200
    if (mesmoCor) return false

    floodFill(ctx, px, py, cor, 30, mask)
    return true
  }

  // -- Pointer events --------------------------------------------------
  const onPointerDown = (e) => {
    const el = e.currentTarget
    el.setPointerCapture?.(e.pointerId)

    // Rejeição de palma (apenas para toques muito largos — limiar relaxado)
    if (e.pointerType === 'touch' && (e.width > 40 || e.height > 40)) return

    draw.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (draw.current.pointers.size >= 2) {
      // Segundo dedo detectado: cancela qualquer pintura do primeiro toque.
      // Restaura o snapshot para remover o ponto que eventualmente foi pintado.
      draw.current.desenhando = false
      if (pinturaSnapshot.current && pinturaCtx.current) {
        pinturaCtx.current.putImageData(pinturaSnapshot.current, 0, 0)
        pinturaSnapshot.current = null
      }
      zoom.onPointersChange(draw.current.pointers, 'down')
      return
    }

    // Primeiro toque: salva snapshot antes de pintar (para desfazer se vier pinça)
    if (e.pointerType === 'touch' && pinturaCtx.current) {
      const cv = pinturaRef.current
      pinturaSnapshot.current = pinturaCtx.current.getImageData(0, 0, cv.width, cv.height)
    }

    // Toque único => desenho
    const p = toCanvas(e.clientX, e.clientY)
    draw.current.ultimo = p
    draw.current.controle = p
    draw.current.moveu = false
    draw.current.tapStart = performance.now()
    draw.current.desenhando = true
    draw.current.tapPoint = p

    if (ferramenta === 'balde') {
      if (baldeEm(p.x, p.y)) onAlterado?.()
    } else {
      const ctx = pinturaCtx.current
      desenharPonto(ctx, p.x, p.y, e.pressure || 0.5)
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

    // Marca "moveu" apenas após deslocamento significativo a partir do
    // ponto de toque inicial. Isso evita falsos arrastos por tremor em
    // clique único — crítico para o balde.
    if (draw.current.tapPoint) {
      const ddx = p.x - draw.current.tapPoint.x
      const ddy = p.y - draw.current.tapPoint.y
      if (Math.hypot(ddx, ddy) > 5) draw.current.moveu = true
    }

    if (ferramenta === 'balde') {
      // Arrasto contínuo: preenche cada região nova sob o ponteiro.
      if (baldeEm(p.x, p.y)) onAlterado?.()
      draw.current.ultimo = p
      return
    }

    const ctx = pinturaCtx.current
    const anterior = draw.current.ultimo
    const controle = draw.current.controle || anterior
    const meio = { x: (controle.x + p.x) / 2, y: (controle.y + p.y) / 2 }
    desenharLinha(ctx, anterior, controle, meio, e.pressure || 0.5)
    draw.current.ultimo = meio
    draw.current.controle = p
    onAlterado?.()
  }

  const onPointerUp = (e) => {
    draw.current.pointers.delete(e.pointerId)

    if (draw.current.pointers.size >= 1) {
      zoom.onPointersChange(draw.current.pointers, 'up')
    } else {
      zoom.onPointersChange(draw.current.pointers, 'up')
    }

    if (!draw.current.desenhando) return

    draw.current.desenhando = false
    draw.current.ultimo = null
    draw.current.controle = null
    draw.current.tapPoint = null
    draw.current.moveu = false
    // Pintura confirmada: descarta snapshot (não há mais o que desfazer)
    pinturaSnapshot.current = null
  }

  const onPointerCancel = onPointerUp

  // -- Container ref para zoom ----------------------------------------
  useEffect(() => { zoom.setContainer(containerRef.current) }, [zoom.setContainer])

  const transform = `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})`

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none select-none"
    >
      <div
        className="relative shadow-soft rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 ring-1 ring-black/5 dark:ring-white/10"
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
          className="absolute top-4 right-4 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur px-3 py-2 shadow-soft ring-1 ring-black/5 dark:ring-white/10 flex items-center gap-2 text-sm font-semibold"
          aria-label="Resetar zoom"
        >
          <RotateCcw size={16} /> Resetar zoom
        </button>
      )}
    </div>
  )
})

export default Canvas
