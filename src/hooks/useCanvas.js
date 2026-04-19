import { useCallback, useEffect, useRef } from 'react'

// Configura um canvas respeitando devicePixelRatio. Retorna refs e helpers.
export function useCanvas({ largura, altura, corFundo = '#ffffff' } = {}) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const dprRef = useRef(1)

  const ajustar = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    dprRef.current = dpr
    cv.width  = Math.floor(largura * dpr)
    cv.height = Math.floor(altura * dpr)
    cv.style.width  = largura + 'px'
    cv.style.height = altura + 'px'
    const ctx = cv.getContext('2d', { willReadFrequently: true })
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctxRef.current = ctx
    if (corFundo) {
      ctx.fillStyle = corFundo
      ctx.fillRect(0, 0, largura, altura)
    }
  }, [largura, altura, corFundo])

  useEffect(() => { ajustar() }, [ajustar])

  const limpar = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    ctx.restore()
    if (corFundo) {
      ctx.fillStyle = corFundo
      ctx.fillRect(0, 0, largura, altura)
    }
  }, [largura, altura, corFundo])

  return { canvasRef, ctxRef, dprRef, limpar, ajustar }
}
