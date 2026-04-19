import { useCallback, useRef, useState } from 'react'

// Hook de zoom+pan via pinch (2 dedos).
// Zoom entre min e max. Pan livre enquanto zoomed.
// Zoom centrado no ponto médio da pinça (não no centro do canvas).

export function useZoom({ min = 1, max = 5 } = {}) {
  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)

  const refs = useRef({
    pinchStart: null, // { d, cx, cy, scale, tx, ty }
    container: null,
    naturalW: 0,
    naturalH: 0
  })

  const setContainer = useCallback(el => { refs.current.container = el }, [])

  // Dimensão natural (CSS) do canvas interno — para calcular limites de pan
  const setNaturalSize = useCallback((w, h) => {
    refs.current.naturalW = w
    refs.current.naturalH = h
  }, [])

  const onPointersChange = useCallback((pointers, action) => {
    const pts = [...pointers.values()]

    if (action === 'down' && pts.length === 2) {
      const [a, b] = pts
      const d  = Math.hypot(a.x - b.x, a.y - b.y)
      const cx = (a.x + b.x) / 2
      const cy = (a.y + b.y) / 2
      // Captura estado no início da pinça
      refs.current.pinchStart = { d, cx, cy, scale, tx, ty }
    }

    if (action === 'move' && pts.length === 2 && refs.current.pinchStart) {
      const [a, b] = pts
      const d  = Math.hypot(a.x - b.x, a.y - b.y)
      const cx = (a.x + b.x) / 2
      const cy = (a.y + b.y) / 2
      const start = refs.current.pinchStart
      const cont  = refs.current.container

      let novoScale = clamp((d / start.d) * start.scale, min, max)
      let novoTx = tx, novoTy = ty

      if (cont) {
        const rect = cont.getBoundingClientRect()

        // Ponto médio da pinça em coordenadas relativas ao centro do container
        const contCx = rect.left + rect.width  / 2
        const contCy = rect.top  + rect.height / 2
        const initMx = start.cx - contCx
        const initMy = start.cy - contCy
        const curMx  = cx - contCx
        const curMy  = cy - contCy

        // Mantém o ponto do mundo sob o início da pinça fixo, mais pan pelo
        // deslocamento do ponto médio (pan + zoom simultâneos).
        novoTx = curMx - (initMx - start.tx) * (novoScale / start.scale)
        novoTy = curMy - (initMy - start.ty) * (novoScale / start.scale)

        // Limita pan para não ultrapassar as bordas do canvas
        const nw = refs.current.naturalW || rect.width
        const nh = refs.current.naturalH || rect.height
        const maxPanX = Math.max(0, (nw * novoScale - rect.width)  / 2)
        const maxPanY = Math.max(0, (nh * novoScale - rect.height) / 2)
        novoTx = clamp(novoTx, -maxPanX, maxPanX)
        novoTy = clamp(novoTy, -maxPanY, maxPanY)
      }

      setScale(novoScale)
      setTx(novoTx)
      setTy(novoTy)
    }

    if (action === 'up' && pts.length < 2) {
      refs.current.pinchStart = null
      // Mantém zoom/pan após soltar — não reseta automaticamente
    }
  }, [scale, tx, ty, min, max])

  const reset = useCallback(() => {
    setScale(1); setTx(0); setTy(0)
    refs.current.pinchStart = null
  }, [])

  return { scale, tx, ty, setContainer, setNaturalSize, onPointersChange, reset }
}

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)) }
