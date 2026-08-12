import React, { useState, useEffect } from 'react'
import { ShieldCheck, Settings, X, Check, Cookie } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'

interface ConsentState {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

declare global {
  interface Window {
    hasCookieConsent: (category: 'essential' | 'analytics' | 'marketing') => boolean
  }
}

export const CookieConsent: React.FC = () => {
  const { language } = useLanguageStore()
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [consent, setConsent] = useState<ConsentState>({
    essential: true,
    analytics: false,
    marketing: false
  })

  // Multilingual translations for the Cookie Consent banner
  const t = {
    title: language === 'pt-BR' ? 'Valorizamos sua Privacidade' : 'Wir schätzen Ihre Privatsphäre',
    text: language === 'pt-BR' 
      ? 'Utilizamos cookies para otimizar sua experiência e personalizar conteúdos de acordo com a legislação de proteção de dados (revDSG).' 
      : 'Wir verwenden Cookies, um Ihre Erfahrung zu optimieren und Inhalte gemäss der Datenschutzgesetzgebung (DSG) zu personalisieren.',
    acceptAll: language === 'pt-BR' ? 'Aceitar Todos' : 'Alle akzeptieren',
    rejectAll: language === 'pt-BR' ? 'Apenas Essenciais' : 'Nur essenzielle',
    customize: language === 'pt-BR' ? 'Personalizar' : 'Einstellungen',
    saveSettings: language === 'pt-BR' ? 'Salvar Preferências' : 'Einstellungen speichern',
    privacyPolicy: language === 'pt-BR' ? 'Política de Privacidade' : 'Datenschutzerklärung',
    
    essentialTitle: language === 'pt-BR' ? 'Estritamente Necessários' : 'Notwendige Cookies',
    essentialDesc: language === 'pt-BR' 
      ? 'Essenciais para a navegação, login seguro e funcionamento do sistema.' 
      : 'Erforderlich für die Navigation, sichere Anmeldung und Systemfunktionen.',
      
    analyticsTitle: language === 'pt-BR' ? 'Estatísticas e Performance' : 'Statistiken & Performance',
    analyticsDesc: language === 'pt-BR' 
      ? 'Nos ajudam a entender como o site performa no Google Search Console.' 
      : 'Helfen uns zu verstehen, wie die Website im Google Search Console abschneidet.',
      
    marketingTitle: language === 'pt-BR' ? 'Marketing e Anúncios' : 'Marketing & Werbung',
    marketingDesc: language === 'pt-BR' 
      ? 'Permitem exibir recomendações personalizadas e interações sociais.' 
      : 'Ermöglichen personalisierte Empfehlungen und soziale Interaktionen.'
  }

  const STORAGE_KEY = 'schoenheitslokal-cookie-consent'

  // Expose API and dispatch DOM event for real consent checking
  const applyConsent = (state: ConsentState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    
    // Set global helper for any scripts
    window.hasCookieConsent = (category: 'essential' | 'analytics' | 'marketing') => {
      const consentStr = localStorage.getItem(STORAGE_KEY)
      if (!consentStr) return category === 'essential'
      try {
        const parsed = JSON.parse(consentStr) as ConsentState
        return parsed[category] || false
      } catch {
        return category === 'essential'
      }
    }

    // Dispatch custom DOM event in real-time
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: state }))
  }

  useEffect(() => {
    // 1. Define global checker even if consent is not yet given (essential is true)
    window.hasCookieConsent = (category: 'essential' | 'analytics' | 'marketing') => {
      const consentStr = localStorage.getItem(STORAGE_KEY)
      if (!consentStr) return category === 'essential'
      try {
        const parsed = JSON.parse(consentStr) as ConsentState
        return parsed[category] || false
      } catch {
        return category === 'essential'
      }
    }

    // 2. Check if user already gave consent
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // Show banner with soft delay for better aesthetic entrance
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      try {
        const parsed = JSON.parse(stored) as ConsentState
        setConsent(parsed)
      } catch (e) {
        console.error('Error parsing stored consent:', e)
      }
    }
  }, [])

  const handleAcceptAll = () => {
    const newState = { essential: true, analytics: true, marketing: true }
    setConsent(newState)
    applyConsent(newState)
    setIsVisible(false)
  }

  const handleRejectAll = () => {
    const newState = { essential: true, analytics: false, marketing: false }
    setConsent(newState)
    applyConsent(newState)
    setIsVisible(false)
  }

  const handleSaveCustom = () => {
    applyConsent(consent)
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div translate="no" className="notranslate fixed bottom-6 right-6 z-[9999] w-[calc(100vw-3rem)] max-w-md bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-6 text-zinc-800 animate-in slide-in-from-bottom duration-500 ease-out">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-pink-500/10 text-pink-600 rounded-xl border border-pink-500/20">
            <Cookie className="w-5 h-5 animate-pulse" />
          </div>
          <h4 className="font-bold text-gray-900 text-lg leading-tight"><span>{t.title}</span></h4>
        </div>
        <button 
          onClick={handleRejectAll}
          className="p-1 hover:bg-zinc-200/50 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
          title="Schliessen"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main text or customized toggles */}
      {!showSettings ? (
        <>
          <p className="text-sm leading-relaxed text-zinc-600 mb-5">
            <span>{t.text}</span>{' '}
            <a href="/privacidade" className="text-pink-600 hover:text-pink-700 font-semibold underline underline-offset-2">
              <span>{t.privacyPolicy}</span>
            </a>
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleAcceptAll}
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold py-3 px-4 rounded-xl shadow-lg shadow-pink-100 hover:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> <span>{t.acceptAll}</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 border border-zinc-200"
            >
              <Settings className="w-4 h-4" /> <span>{t.customize}</span>
            </button>
          </div>
        </>
      ) : (
        /* Settings Toggles Pane */
        <div className="space-y-4 my-4">
          <div className="space-y-3.5 max-h-[40vh] overflow-y-auto pr-1">
            {/* Essential Category */}
            <div className="flex items-start justify-between gap-4 p-3 bg-zinc-50 border border-zinc-150 rounded-xl">
              <div>
                <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <span>{t.essentialTitle}</span>
                  <span className="text-[9px] bg-pink-100 text-pink-600 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    <span>{language === 'pt-BR' ? 'Obrigatório' : 'Erforderlich'}</span>
                  </span>
                </span>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed"><span>{t.essentialDesc}</span></p>
              </div>
              <div className="relative inline-flex items-center cursor-not-allowed">
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-pink-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
              </div>
            </div>

            {/* Analytics Category */}
            <label className="flex items-start justify-between gap-4 p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-150 rounded-xl cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-sm text-gray-900"><span>{t.analyticsTitle}</span></span>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed"><span>{t.analyticsDesc}</span></p>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
              </div>
            </label>

            {/* Marketing Category */}
            <label className="flex items-start justify-between gap-4 p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-150 rounded-xl cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-sm text-gray-900"><span>{t.marketingTitle}</span></span>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed"><span>{t.marketingDesc}</span></p>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
              </div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={handleSaveCustom}
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> <span>{t.saveSettings}</span>
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-sm font-bold rounded-xl transition-all active:scale-[0.98] border border-zinc-200"
            >
              <span>{language === 'pt-BR' ? 'Voltar' : 'Zurück'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
