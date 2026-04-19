import { useEffect, useState } from 'react'
import { Plus, LogOut, User } from 'lucide-react'
import { listarPerfis, criarPerfil, signOut } from '../lib/supabase.js'

const CORES = ['#5d6bf0', '#ef4444', '#f97316', '#eab308', '#16a34a', '#06b6d4', '#db2777', '#7c3aed']

export default function ProfilePicker({ onEscolher }) {
  const [perfis, setPerfis] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')
  const [cor, setCor]   = useState(CORES[0])

  const recarregar = async () => {
    setCarregando(true)
    try { setPerfis(await listarPerfis()) } catch (e) { console.error(e) }
    setCarregando(false)
  }
  useEffect(() => { recarregar() }, [])

  const criar = async (e) => {
    e.preventDefault()
    if (!nome.trim()) return
    try {
      const p = await criarPerfil({ nome: nome.trim(), cor })
      setCriando(false); setNome(''); setCor(CORES[0])
      onEscolher(p)
    } catch (err) { alert('Erro: ' + err.message) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gradient-to-br from-brand-100 via-white to-pink-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Quem vai pintar?</h1>
          <button onClick={() => signOut()} className="text-sm text-neutral-500 hover:text-brand-600 flex items-center gap-1" title="Sair">
            <LogOut size={14}/> Sair
          </button>
        </div>

        {carregando ? (
          <p className="text-neutral-500 text-sm">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {perfis.map(p => (
              <button
                key={p.id}
                onClick={() => onEscolher(p)}
                className="group relative aspect-square rounded-3xl bg-white dark:bg-neutral-900 shadow-soft ring-1 ring-black/5 dark:ring-white/10 flex flex-col items-center justify-center gap-2 transition hover:scale-[1.03]"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-extrabold text-2xl" style={{ background: p.cor }}>
                  {p.nome.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold truncate max-w-[80%]">{p.nome}</span>
              </button>
            ))}

            <button
              onClick={() => setCriando(true)}
              className="aspect-square rounded-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-brand-500 hover:text-brand-500 text-neutral-400 flex flex-col items-center justify-center gap-2 transition"
            >
              <Plus size={28}/>
              <span className="font-bold text-sm">Novo perfil</span>
            </button>
          </div>
        )}

        {criando && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCriando(false)}>
            <form onSubmit={criar} className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-soft ring-1 ring-black/5 dark:ring-white/10" onClick={e => e.stopPropagation()}>
              <h2 className="font-extrabold text-xl mb-4 flex items-center gap-2"><User size={18}/> Novo perfil</h2>
              <input
                autoFocus value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Nome do perfil" maxLength={24}
                className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {CORES.map(c => (
                  <button key={c} type="button" onClick={() => setCor(c)}
                    className={['w-9 h-9 rounded-full transition', cor===c ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'ring-1 ring-black/10 dark:ring-white/15'].join(' ')}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="mt-5 flex gap-2 justify-end">
                <button type="button" onClick={() => setCriando(false)} className="px-4 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm">Criar</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
