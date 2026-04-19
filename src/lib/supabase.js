import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabase = Boolean(url && anon)

export const supabase = hasSupabase
  ? createClient(url, anon, { auth: { persistSession: false } })
  : null

// --------------------------------------------------------------------------
// Sessão anônima — persiste no sessionStorage
// --------------------------------------------------------------------------
const SESSION_KEY = 'kp_sessao_id'
export function getSessaoId() {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = (crypto.randomUUID?.() ?? String(Date.now()))
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

// --------------------------------------------------------------------------
// Upload de obra (JPEG) e registro no banco
// --------------------------------------------------------------------------
export async function salvarObra({ blob, sessaoId, templateId, templateUrl, contornoDataUrl }) {
  if (!supabase) throw new Error('Supabase não configurado')

  const ts   = Date.now()
  const path = `${sessaoId}/${templateId}/${ts}.jpg`

  const up = await supabase.storage.from('obras').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false
  })
  if (up.error) throw up.error

  const { data: pub } = supabase.storage.from('obras').getPublicUrl(path)
  const url = pub.publicUrl

  const id = `proj_${sessaoId}_${templateId}`

  // Busca projeto existente (se houver) para fazer append
  const { data: existente } = await supabase
    .from('projetos').select('*').eq('id', id).maybeSingle()

  if (existente) {
    const versoes = Array.isArray(existente.versoes) ? existente.versoes : []
    const novoArr = [...versoes, url]
    const { error } = await supabase.from('projetos').update({
      versoes: novoArr,
      preview_idx: novoArr.length - 1,
      template_url: templateUrl ?? existente.template_url,
      contorno_dataurl: contornoDataUrl ?? existente.contorno_dataurl
    }).eq('id', id)
    if (error) throw error
    return { id, url, versoes: novoArr }
  } else {
    const versoes = [url]
    const { error } = await supabase.from('projetos').insert({
      id, sessao_id: sessaoId, template_id: templateId,
      template_url: templateUrl ?? null,
      contorno_dataurl: contornoDataUrl ?? null,
      versoes, preview_idx: 0
    })
    if (error) throw error
    return { id, url, versoes }
  }
}

export async function listarProjetos() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('projetos').select('*').order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function excluirProjeto(id) {
  if (!supabase) return
  await supabase.from('projetos').delete().eq('id', id)
}

// --------------------------------------------------------------------------
// Templates
// --------------------------------------------------------------------------
export async function listarTemplates() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('templates').select('*').order('criado_em', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function uploadTemplate({ file, nome }) {
  if (!supabase) throw new Error('Supabase não configurado')
  const ext  = (file.name.split('.').pop() || 'png').toLowerCase()
  const id   = `tpl_${Date.now()}`
  const path = `${id}.${ext}`

  const up = await supabase.storage.from('templates').upload(path, file, {
    contentType: file.type, upsert: false
  })
  if (up.error) throw up.error

  const { data: pub } = supabase.storage.from('templates').getPublicUrl(path)
  const url = pub.publicUrl

  const { error } = await supabase.from('templates').insert({
    id, nome: nome || file.name, url, visivel: true
  })
  if (error) throw error
  return { id, nome, url, visivel: true }
}

export async function setTemplateVisivel(id, visivel) {
  if (!supabase) return
  await supabase.from('templates').update({ visivel }).eq('id', id)
}
