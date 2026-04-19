import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabase = Boolean(url && anon)

export const supabase = hasSupabase
  ? createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'kp_auth' }
    })
  : null

// --------------------------------------------------------------------------
// Perfil ativo — por dispositivo (localStorage), nunca sincroniza entre
// celular/PC. Cada device escolhe qual perfil mostrar localmente.
// --------------------------------------------------------------------------
const PERFIL_ATIVO_KEY = 'kp_perfil_ativo'
export const getPerfilAtivoId = () => localStorage.getItem(PERFIL_ATIVO_KEY)
export const setPerfilAtivoId = (id) => {
  if (id) localStorage.setItem(PERFIL_ATIVO_KEY, id)
  else localStorage.removeItem(PERFIL_ATIVO_KEY)
}

// --------------------------------------------------------------------------
// Auth
// --------------------------------------------------------------------------
export async function signUp(email, password) {
  if (!supabase) throw new Error('Supabase não configurado')
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}
export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase não configurado')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}
export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
  setPerfilAtivoId(null)
}
export async function getUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}
export function onAuthChange(cb) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_ev, session) => cb(session?.user ?? null))
  return () => data.subscription.unsubscribe()
}

// Verifica senha do usuário logado (usado no gate do admin)
export async function verificarSenha(password) {
  if (!supabase) return false
  const user = await getUser()
  if (!user?.email) return false
  const { error } = await supabase.auth.signInWithPassword({ email: user.email, password })
  return !error
}

// --------------------------------------------------------------------------
// Perfis
// --------------------------------------------------------------------------
export async function listarPerfis() {
  if (!supabase) return []
  const { data, error } = await supabase.from('perfis')
    .select('*').order('criado_em', { ascending: true })
  if (error) throw error
  return data ?? []
}
export async function criarPerfil({ nome, cor }) {
  if (!supabase) throw new Error('Supabase não configurado')
  const user = await getUser()
  if (!user) throw new Error('Não autenticado')
  const { data, error } = await supabase.from('perfis')
    .insert({ user_id: user.id, nome, cor: cor || '#5d6bf0' })
    .select().single()
  if (error) throw error
  return data
}
export async function atualizarPerfil(id, campos) {
  if (!supabase) return
  const { error } = await supabase.from('perfis').update(campos).eq('id', id)
  if (error) throw error
}
export async function excluirPerfil(id) {
  if (!supabase) return
  const { error } = await supabase.from('perfis').delete().eq('id', id)
  if (error) throw error
}

// --------------------------------------------------------------------------
// Obras (projetos) — filtradas por perfil
// --------------------------------------------------------------------------
export async function salvarObra({ blob, perfilId, templateId, templateUrl, contornoDataUrl }) {
  if (!supabase) throw new Error('Supabase não configurado')
  const user = await getUser()
  if (!user) throw new Error('Não autenticado')
  if (!perfilId) throw new Error('Perfil não selecionado')

  const ts   = Date.now()
  const path = `${user.id}/${perfilId}/${templateId}/${ts}.jpg`

  const up = await supabase.storage.from('obras').upload(path, blob, {
    contentType: 'image/jpeg', upsert: false
  })
  if (up.error) throw up.error

  const { data: pub } = supabase.storage.from('obras').getPublicUrl(path)
  const url = pub.publicUrl

  // id por perfil+template — append-only por combinação
  const id = `proj_${perfilId}_${templateId}`

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
      id,
      sessao_id: perfilId,       // mantido pra compatibilidade da coluna legada
      template_id: templateId,
      template_url: templateUrl ?? null,
      contorno_dataurl: contornoDataUrl ?? null,
      versoes, preview_idx: 0,
      user_id: user.id,
      perfil_id: perfilId
    })
    if (error) throw error
    return { id, url, versoes }
  }
}

export async function listarProjetos(perfilId) {
  if (!supabase || !perfilId) return []
  const { data, error } = await supabase
    .from('projetos').select('*')
    .eq('perfil_id', perfilId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}
export async function excluirProjeto(id) {
  if (!supabase) return
  await supabase.from('projetos').delete().eq('id', id)
}

// --------------------------------------------------------------------------
// Templates — escopados ao perfil ativo
// --------------------------------------------------------------------------
export async function listarTemplates(perfilId) {
  if (!supabase || !perfilId) return []
  const { data, error } = await supabase
    .from('templates').select('*')
    .eq('perfil_id', perfilId)
    .order('criado_em', { ascending: true })
  if (error) throw error
  return data ?? []
}
export async function uploadTemplate({ file, nome, perfilId }) {
  if (!supabase) throw new Error('Supabase não configurado')
  const user = await getUser()
  if (!user) throw new Error('Não autenticado')
  if (!perfilId) throw new Error('Perfil não selecionado')

  const ext  = (file.name.split('.').pop() || 'png').toLowerCase()
  const id   = `tpl_${Date.now()}`
  const path = `${user.id}/${perfilId}/${id}.${ext}`

  const up = await supabase.storage.from('templates').upload(path, file, {
    contentType: file.type, upsert: false
  })
  if (up.error) throw up.error

  const { data: pub } = supabase.storage.from('templates').getPublicUrl(path)
  const url = pub.publicUrl

  const { error } = await supabase.from('templates').insert({
    id, nome: nome || file.name, url, visivel: true,
    user_id: user.id, perfil_id: perfilId
  })
  if (error) throw error
  return { id, nome, url, visivel: true }
}
export async function setTemplateVisivel(id, visivel) {
  if (!supabase) return
  await supabase.from('templates').update({ visivel }).eq('id', id)
}
export async function excluirTemplate(id) {
  if (!supabase) return
  await supabase.from('templates').delete().eq('id', id)
}
