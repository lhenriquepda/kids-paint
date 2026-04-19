// Flood fill iterativo (sem recursão), 4-conectividade, com tolerância de cor.
// Aceita opcionalmente uma máscara (ImageData do contorno) como barreira:
// pixels da máscara com alpha acima do limiar bloqueiam a propagação.

export function floodFill(ctx, startX, startY, fillColor, tolerancia = 30, mask = null) {
  const { width, height } = ctx.canvas
  const img = ctx.getImageData(0, 0, width, height)
  const data = img.data
  const maskData = mask ? mask.data : null

  const sx = Math.floor(startX)
  const sy = Math.floor(startY)
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return

  // Se o ponto inicial estiver sobre o contorno, não faz nada
  if (maskData) {
    const mi = (sy * width + sx) * 4 + 3
    if (maskData[mi] > 128) return
  }

  const idx0 = (sy * width + sx) * 4
  const alvo = [data[idx0], data[idx0 + 1], data[idx0 + 2], data[idx0 + 3]]

  const fill = hexToRgba(fillColor)
  if (corIgual(alvo, fill, 0)) return

  const tol2 = tolerancia * tolerancia * 4
  const visit = new Uint8Array(width * height)
  const pilha = [sx, sy]

  while (pilha.length) {
    const y = pilha.pop()
    const x = pilha.pop()
    if (x < 0 || y < 0 || x >= width || y >= height) continue
    const pxIdx = y * width + x
    if (visit[pxIdx]) continue

    // Barreira do contorno
    if (maskData && maskData[pxIdx * 4 + 3] > 128) { visit[pxIdx] = 1; continue }

    const di = pxIdx * 4
    const dr = data[di] - alvo[0]
    const dg = data[di + 1] - alvo[1]
    const db = data[di + 2] - alvo[2]
    const da = data[di + 3] - alvo[3]
    if (dr * dr + dg * dg + db * db + da * da > tol2) continue

    visit[pxIdx] = 1
    data[di]     = fill[0]
    data[di + 1] = fill[1]
    data[di + 2] = fill[2]
    data[di + 3] = fill[3]

    pilha.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
  }

  ctx.putImageData(img, 0, 0)
}

function corIgual(a, b, tol) {
  return Math.abs(a[0] - b[0]) <= tol
      && Math.abs(a[1] - b[1]) <= tol
      && Math.abs(a[2] - b[2]) <= tol
      && Math.abs(a[3] - b[3]) <= tol
}

export function hexToRgba(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return [r, g, b, 255]
}
