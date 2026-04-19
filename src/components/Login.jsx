import { useState } from 'react'
import { Sparkles, Mail, Lock, Loader2 } from 'lucide-react'
import { signIn, signUp } from '../lib/supabase.js'

export default function Login() {
  const [modo, setModo] = useState('entrar') // 'entrar' | 'criar'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const [msg, setMsg]   = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setErro(null); setMsg(null); setCarregando(true)
    try {
      if (modo === 'entrar') {
        await signIn(email.trim(), senha)
        // onAuthChange no App cuida do redirecionamento
      } else {
        const r = await signUp(email.trim(), senha)
        if (r?.user && !r.session) {
          setMsg('Conta criada! Verifique seu e-mail se a confirmação estiver ativada, ou tente entrar.')
        }
      }
    } catch (err) {
      setErro(err.message || 'Erro ao autenticar')
    }
    setCarregando(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gradient-to-br from-brand-100 via-white to-pink-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl p-7 shadow-soft ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-pink-400 flex items-center justify-center shadow-soft rotate-[-4deg] mb-3">
            <Sparkles className="text-white" size={30}/>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {modo === 'entrar' ? 'Acesse para pintar e salvar suas obras' : 'Vamos começar sua conta'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Campo icon={<Mail size={16}/>} type="email" value={email} onChange={setEmail} placeholder="seu@email.com" required/>
          <Campo icon={<Lock size={16}/>} type="password" value={senha} onChange={setSenha} placeholder="senha (mínimo 6 caracteres)" minLength={6} required/>

          {erro && <p className="text-sm text-red-500">{erro}</p>}
          {msg  && <p className="text-sm text-green-600 dark:text-green-400">{msg}</p>}

          <button
            type="submit" disabled={carregando}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {carregando && <Loader2 size={16} className="animate-spin"/>}
            {modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setModo(m => m === 'entrar' ? 'criar' : 'entrar'); setErro(null); setMsg(null) }}
          className="mt-4 w-full text-sm text-neutral-500 hover:text-brand-600"
        >
          {modo === 'entrar' ? 'Não tem conta? Criar uma agora' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}

function Campo({ icon, type, value, onChange, placeholder, ...rest }) {
  return (
    <label className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-brand-500 transition">
      <span className="text-neutral-400">{icon}</span>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm font-semibold placeholder:text-neutral-400"
        {...rest}
      />
    </label>
  )
}
