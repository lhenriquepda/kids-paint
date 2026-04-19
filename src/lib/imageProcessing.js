// -----------------------------------------------------------------------------
// Processamento de contorno
// -----------------------------------------------------------------------------
// Gera um PNG com APENAS o outline (pixels escuros), com bordas suavizadas
// (antialiasing) — aparência limpa tipo vetor — mesmo partindo de uma imagem
// pixelada/serrilhada. No dark mode, a cor do traço é invertida para branco.
//
// Pipeline:
//  1. Supersample: renderiza a imagem em resolução 2× em um canvas offscreen.
//  2. Pré-binariza (alpha-aware): todo pixel claro/transparente vira branco,
//     todo pixel escuro vira preto — isso elimina cor de fundo e ruído.
//  3. Filtro de suavização: `blur + contrast` faz um "gooey"/metaball effect,
//     arredondando os serrilhados e devolvendo bordas duras porém lisas.
//  4. Downsample com interpolação: a diminuição de escala converte as bordas
//     já lisas em um antialiasing genuíno, produzindo um outline vetorizado
//     visualmente.
//  5. Limiar final com alpha-preserving: mantém o gradiente de alpha nas
//     bordas (isso é o que dá o look de vetor).
//  6. Opcional: inverte para branco no dark mode.
// -----------------------------------------------------------------------------

const TARGET_W = 1200
const TARGET_H = 900

export async function processarContorno(src, { dark = false, limiar = 170 } = {}) {
  const img = await carregarImagem(src)

  // Dimensões-alvo preservando proporção dentro do frame TARGET_W × TARGET_H
  const razao = Math.min(TARGET_W / img.naturalWidth, TARGET_H / img.naturalHeight)
  const destW = Math.max(2, Math.round(img.naturalWidth  * razao))
  const destH = Math.max(2, Math.round(img.naturalHeight * razao))

  // Offsets para centralizar
  const offX = Math.round((TARGET_W - destW) / 2)
  const offY = Math.round((TARGET_H - destH) / 2)

  // ------------------------------------------------------------------
  // 1 + 2. Supersample 2× e pré-binarização
  // ------------------------------------------------------------------
  const SCALE = 2
  const hi = document.createElement('canvas')
  hi.width  = destW * SCALE
  hi.height = destH * SCALE
  const hctx = hi.getContext('2d', { willReadFrequently: true })
  hctx.imageSmoothingEnabled = true
  hctx.imageSmoothingQuality = 'high'
  // Preenche fundo branco (caso a imagem tenha alpha)
  hctx.fillStyle = '#ffffff'
  hctx.fillRect(0, 0, hi.width, hi.height)
  hctx.drawImage(img, 0, 0, hi.width, hi.height)

  // Pré-binariza
  const hd = hctx.getImageData(0, 0, hi.width, hi.height)
  const hpx = hd.data
  for (let i = 0; i < hpx.length; i += 4) {
    const a = hpx[i + 3]
    const brilho = (hpx[i] + hpx[i + 1] + hpx[i + 2]) / 3
    const escuro = a > 128 && brilho < limiar
    if (escuro) { hpx[i] = 0; hpx[i + 1] = 0; hpx[i + 2] = 0 }
    else        { hpx[i] = 255; hpx[i + 1] = 255; hpx[i + 2] = 255 }
    hpx[i + 3] = 255
  }
  hctx.putImageData(hd, 0, 0)

  // ------------------------------------------------------------------
  // 3. Suavização por filtro CSS (gooey: blur + contrast)
  // ------------------------------------------------------------------
  const smooth = document.createElement('canvas')
  smooth.width  = hi.width
  smooth.height = hi.height
  const sctx = smooth.getContext('2d', { willReadFrequently: true })
  if (supportsCanvasFilter(sctx)) {
    sctx.filter = 'blur(1.6px) contrast(40)'
    sctx.drawImage(hi, 0, 0)
    sctx.filter = 'none'
  } else {
    // Fallback sem filter: desenha direto
    sctx.drawImage(hi, 0, 0)
  }

  // ------------------------------------------------------------------
  // 4. Downsample com antialiasing para resolução final
  // ------------------------------------------------------------------
  const out = document.createElement('canvas')
  out.width  = TARGET_W
  out.height = TARGET_H
  const octx = out.getContext('2d', { willReadFrequently: true })
  octx.imageSmoothingEnabled = true
  octx.imageSmoothingQuality = 'high'
  octx.clearRect(0, 0, TARGET_W, TARGET_H)
  octx.drawImage(smooth, offX, offY, destW, destH)

  // ------------------------------------------------------------------
  // 5. Alpha-preserving final: mantém o gradiente dos pixels escuros,
  //    transparenta os claros. Resultado: outline preto/branco com AA.
  // ------------------------------------------------------------------
  const fin = octx.getImageData(0, 0, TARGET_W, TARGET_H)
  const fp = fin.data
  const corR = dark ? 255 : 0
  for (let i = 0; i < fp.length; i += 4) {
    const brilho = (fp[i] + fp[i + 1] + fp[i + 2]) / 3
    if (brilho >= 240) {
      fp[i + 3] = 0
    } else {
      fp[i]     = corR
      fp[i + 1] = corR
      fp[i + 2] = corR
      // Traduz brilho (0 = muito escuro) em alpha (255 = totalmente opaco)
      fp[i + 3] = Math.round(255 * (1 - brilho / 240))
    }
  }
  octx.putImageData(fin, 0, 0)

  return out.toDataURL('image/png')
}

function supportsCanvasFilter(ctx) {
  return typeof ctx.filter !== 'undefined'
}

export function carregarImagem(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// -----------------------------------------------------------------------------
// Canvas → Blob JPEG
// -----------------------------------------------------------------------------
export function canvasParaBlob(cv, quality = 0.5) {
  return new Promise(resolve => cv.toBlob(b => resolve(b), 'image/jpeg', quality))
}

// -----------------------------------------------------------------------------
// Composição final (fundo + pintura + contorno)
// -----------------------------------------------------------------------------
export function comporObra({ pintura, contorno, largura, altura, corFundo = '#ffffff' }) {
  const cv  = document.createElement('canvas')
  cv.width  = largura
  cv.height = altura
  const ctx = cv.getContext('2d')
  ctx.fillStyle = corFundo
  ctx.fillRect(0, 0, largura, altura)
  if (pintura)  ctx.drawImage(pintura,  0, 0, largura, altura)
  if (contorno) ctx.drawImage(contorno, 0, 0, largura, altura)
  return cv
}
