import { useEffect } from 'react'
import Header from '@/components/Header'
import { ArrowLeft, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguageStore } from '@/stores/languageStore'
import { updateMetaTags } from '@/lib/seo'

export default function NotFoundPage() {
  const { language } = useLanguageStore()

  useEffect(() => {
    const title = language === 'pt-BR' 
      ? 'Página não encontrada | Schönheits Lokal' 
      : 'Seite nicht gefunden | Schönheits Lokal'
    const description = language === 'pt-BR'
      ? 'A página solicitada não foi encontrada.'
      : 'Die angeforderte Seite wurde nicht gefunden.'
    
    updateMetaTags(title, description, '/404', language)

    // Add noindex meta tag dynamically to inform search engines not to index unhandled 404 URLs
    let robotsMeta = document.querySelector('meta[name="robots"]')
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta')
      robotsMeta.setAttribute('name', 'robots')
      document.head.appendChild(robotsMeta)
    }
    robotsMeta.setAttribute('content', 'noindex, follow')

    return () => {
      // Reset robots meta tag when navigating to valid pages
      if (robotsMeta && document.head.contains(robotsMeta)) {
        robotsMeta.setAttribute('content', 'index, follow')
      }
    }
  }, [language])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-24 max-w-2xl flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-pink-200">
          <Search className="w-10 h-10" />
        </div>

        <h1 className="text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">404</h1>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          {language === 'pt-BR' ? 'Página Não Encontrada' : 'Seite nicht gefunden'}
        </h2>

        <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
          {language === 'pt-BR'
            ? 'Desculpe, a página que você está procurando não existe ou foi movida.'
            : 'Entschuldigung, die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'pt-BR' ? 'Voltar para o Início' : 'Zurück zur Startseite'}
          </Link>
          <Link
            to="/agendar"
            className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-gray-100 text-zinc-700 border border-zinc-200 font-bold rounded-xl transition-all shadow-sm active:scale-95"
          >
            {language === 'pt-BR' ? 'Ver Tratamentos e Agendar' : 'Behandlungen & Termin buchen'}
          </Link>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Schönheits Lokal. Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  )
}
