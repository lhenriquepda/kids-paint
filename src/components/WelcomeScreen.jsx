import { Sparkles, Expand } from 'lucide-react'

export default function WelcomeScreen({ onEntrar }) {
  const entrar = async () => {
    const el = document.documentElement
    try {
      if (el.requestFullscreen)       await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
    } catch {}
    onEntrar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gradient-to-br from-brand-100 via-white to-pink-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
      <div className="text-center max-w-md">
        <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-400 to-pink-400 flex items-center justify-center shadow-soft mb-6 rotate-[-4deg]">
          <Sparkles className="text-white" size={44}/>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
          Hora de pintar!
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-lg">
          Escolha um desenho, pegue suas cores favoritas e solte a imaginação.
        </p>
        <button
          onClick={entrar}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-lg shadow-soft transition hover:scale-[1.02]"
        >
          <Expand size={20}/>
          Começar
        </button>
      </div>
    </div>
  )
}
