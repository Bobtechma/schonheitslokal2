import React from 'react'
import { 
  Phone, 
  Save 
} from 'lucide-react'

interface WhatsAppTabProps {
  whatsappStatus: string
  whatsappNumber: string
  setWhatsappNumber: (val: string) => void
  whatsappQrCode: string | null
  whatsappPairingCode: string | null
  isGeneratingCode: boolean
  generateWhatsappQRCode: () => void
  generateWhatsappPairingCode: () => void
  disconnectWhatsapp: () => void
  fetchWhatsAppData: () => void
  saveWhatsappNumber: () => void
  t: (key: any) => string
}

export const WhatsAppTab: React.FC<WhatsAppTabProps> = ({
  whatsappStatus,
  whatsappNumber,
  setWhatsappNumber,
  whatsappQrCode,
  whatsappPairingCode,
  isGeneratingCode,
  generateWhatsappQRCode,
  generateWhatsappPairingCode,
  disconnectWhatsapp,
  fetchWhatsAppData,
  saveWhatsappNumber,
  t
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Phone className="w-5 h-5 text-green-500" />
        {t('whatsappConfig')}
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
             <div className="flex items-center gap-3">
               <div className={`w-3 h-3 rounded-full ${whatsappStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
               <span className="font-bold text-gray-700">{whatsappStatus === 'connected' ? t('connected') : t('disconnected')}</span>
             </div>
             {whatsappStatus === 'connected' && (
               <button onClick={disconnectWhatsapp} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 hover:bg-red-100">
                 {t('disconnect')}
               </button>
             )}
          </div>

          <div className="space-y-2">
             <label className="text-sm font-bold text-gray-700">{t('whatsappNumber')}</label>
             <div className="flex gap-2">
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="5511999999999"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                />
                <button onClick={saveWhatsappNumber} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold transition-all text-sm">
                  <Save className="w-4 h-4" />
                </button>
             </div>
          </div>

          {whatsappStatus === 'disconnected' && (
             <div className="grid grid-cols-2 gap-3">
                <button onClick={generateWhatsappQRCode} disabled={isGeneratingCode} className="py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 text-sm shadow-sm">
                  {isGeneratingCode ? t('generating') : t('generateQRCode')}
                </button>
                <button onClick={generateWhatsappPairingCode} disabled={isGeneratingCode || !whatsappNumber} className="py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-50 text-sm shadow-sm">
                  {t('pairWithCode')}
                </button>
             </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
           {whatsappQrCode ? (
             <div className="text-center">
               <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 mb-4 inline-block">
                 <img src={whatsappQrCode} alt="WhatsApp QR" className="w-48 h-48" />
               </div>
               <p className="text-xs text-gray-500 font-medium">{t('scanQRCodeDesc') || 'Aproxime seu telefone para conectar'}</p>
               <button onClick={fetchWhatsAppData} className="text-xs text-green-600 mt-2 font-bold hover:underline">{t('refresh')}</button>
             </div>
           ) : whatsappPairingCode ? (
             <div className="text-center space-y-4">
               <div className="text-sm font-bold text-green-800 bg-green-50 px-4 py-2 rounded-lg">{t('pairingCodeLabel')}</div>
               <div className="text-4xl font-black text-green-700 tracking-widest font-mono bg-white p-6 rounded-2xl shadow-sm border border-green-100">
                 {whatsappPairingCode.slice(0, 4)}-{whatsappPairingCode.slice(4)}
               </div>
             </div>
           ) : (
             <div className="text-center text-gray-400 space-y-2">
               <Phone className="w-12 h-12 mx-auto mb-2 opacity-20" />
               <p className="text-xs uppercase font-bold tracking-widest">{t('waitingConnection')}</p>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
