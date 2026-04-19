import { useCallback, useRef, useState } from 'react'

// Hook de zoom+pan via pinch (2 dedos). Zoom entre 1x e 5x.
// Aplica translate/scale via ref para evitar re-renders quando possível.

export function useZoom({ min = 1, max = 5 } = {}) {
  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)

  const refs = useRef({
    pinchStart: null, // { d, cx, cy, scale, tx, ty }
    container: null
  })

  const setContainer = useCallback(el => { refs.current.container = el }, [])

  const onPointersChange = useCallback((pointers, action) => {
    // pointers: Map<pointerId, {x,y}>
    const pts = [...pointers.values()]

    if (action === 'down' && pts.length === 2) {
      const [a, b] = pts
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      const cx = (a.x + b.x) / 2
      const cy = (a.y + b.y) / 2
      refs.current.pinchStart = { d, cx, cy, scale, tx, ty }
    }

    if (action === 'move' && pts.length === 2 && refs.current.pinchStart) {
      const [a, b] = pts
      const d  = Math.hypot(a.x - b.x, a.y - b.y)
      const cx = (a.x + b.x) / 2
      const cy = (a.y + b.y) / 2
      const start = refs.current.pinchStart
      let novoScale = clamp((d / start.d) * start.scale, min, max)

      const dx = cx - start.cx
      const dy = cy - start.cy
      let novoTx = start.tx + dx + (start.cx * (start.scale - novoScale))
      let novoTy = start.ty + dy + (start.cy * (start.scale - novoScale))

      const cont = refs.current.container
      if (cont && novoScale > 1) {
        const rect = cont.getBoundingClientRect()
        const maxDx = (rect.width  * (novoScale - 1)) / 2
        const maxDy = (rect.height * (novoScale - 1)) / 2
        novoTx = clamp(novoTx, -maxDx, maxDx)
        novoTy = clamp(novoTy, -maxDy, maxDy)
      }

      if (novoScale <= 1.001) {
        novoScale = 1
        novoTx = 0
        novoTy = 0
      }

      setScale(novoScale)
      setTx(novoTx)
      setTy(novoTy)
    }

    if (action === 'up' && pts.length < 2) {
      refs.current.pinchStart = null
      if (scale <= 1.001) {
        setScale(1); setTx(0); setTy(0)
      }
    }
  }, [scale, tx, ty, min, max])

  const reset = useCallback(() => {
    setScale(1); setTx(0); setTy(0)
    refs.current.pinchStart = null
  }, [])

  return { scale, tx, ty, setContainer, onPointersChange, reset }
}

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)) }
