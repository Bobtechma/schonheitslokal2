import React from 'react'
import { 
  Phone, 
  Save, 
  UserCircle, 
  RefreshCw, 
  Trash2, 
  Ban,
  Plus
} from 'lucide-react'

interface SystemTabProps {
  // WhatsApp
  whatsappStatus: string
  whatsappNumber: string
  setWhatsappNumber: (val: string) => void
  saveWhatsappNumber: () => void
  disconnectWhatsapp: () => void
  generateWhatsappQRCode: () => void
  generateWhatsappPairingCode: () => void
  isGeneratingCode: boolean
  whatsappQrCode: string | null
  whatsappPairingCode: string | null
  fetchWhatsAppData: () => void

  // User Management
  users: any[]
  user: any // current logged in user
  fetchUsers: () => void
  loading: boolean
  revokeAdmin: (id: string) => void
  makeAdmin: (id: string) => void
  newUserForm: any
  setNewUserForm: (form: any) => void
  createUser: () => void

  // System Pause
  bookingPaused: boolean
  toggleBookingPaused: () => void

  t: (key: any) => string
}

export const SystemTab: React.FC<SystemTabProps> = ({
  whatsappStatus,
  whatsappNumber,
  setWhatsappNumber,
  saveWhatsappNumber,
  disconnectWhatsapp,
  generateWhatsappQRCode,
  generateWhatsappPairingCode,
  isGeneratingCode,
  whatsappQrCode,
  whatsappPairingCode,
  fetchWhatsAppData,
  users,
  user,
  fetchUsers,
  loading,
  revokeAdmin,
  makeAdmin,
  newUserForm,
  setNewUserForm,
  createUser,
  bookingPaused,
  toggleBookingPaused,
  t
}) => {
  return (
    <div className="space-y-6">
      {/* WhatsApp Config Section */}
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

      {/* User Management Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
               <UserCircle className="w-5 h-5 text-emerald-500" />
               {t('userManagement')}
            </h2>
            <p className="text-sm text-gray-500">{t('manageAdminAccess') || 'Controle o acesso administrativo do sistema'}</p>
          </div>
          <button onClick={fetchUsers} className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="overflow-x-auto">
           <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-50">
                   <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('user')}</th>
                   <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('role')}</th>
                   <th className="text-right py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                             {(u.raw_user_meta_data?.full_name || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                             <div className="text-sm font-bold text-gray-800">{u.raw_user_meta_data?.full_name || 'Sem Nome'}</div>
                             <div className="text-[10px] text-gray-400">{u.email}</div>
                          </div>
                       </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-bold uppercase tracking-widest">
                       <span className={`px-2 py-1 rounded-full ${u.role === 'owner' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                          {u.role || 'user'}
                        </span>
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex justify-end items-center gap-2">
                        {u.role === 'admin' && user?.role === 'owner' && (
                          <button onClick={() => revokeAdmin(u.id)} className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors text-xs font-medium">
                            {t('revokeAdmin')}
                          </button>
                        )}
                        {u.role === 'client' && (user?.role === 'owner' || user?.role === 'admin') && (
                          <button onClick={() => makeAdmin(u.id)} className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition-colors text-xs font-medium">
                            {t('makeAdmin')}
                          </button>
                        )}
                        <button onClick={() => {}} className="p-2 text-gray-300 hover:text-pink-500 transition-colors">
                           <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>

        {/* Create User Mini-Form */}
        <div className="border border-gray-200 rounded-lg p-4 mt-6 bg-gray-50/30">
          <h3 className="font-medium text-gray-800 mb-2">{t('createUserTitle')}</h3>
          <p className="text-sm text-gray-600 mb-4">{t('createUserDesc')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name</label>
              <input
                value={newUserForm.fullName}
                onChange={e => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">E-Mail</label>
              <input
                type="email"
                value={newUserForm.email}
                onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Password</label>
              <input
                type="password"
                value={newUserForm.password}
                onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="******"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Role</label>
              <select
                value={newUserForm.role}
                onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="client">Client</option>
                <option value="admin">Administrator</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={createUser} className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 font-bold transition-all shadow-sm flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              {t('createUserBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* Emergency / Safety Section */}
      <div className="bg-orange-50 rounded-xl border border-orange-200 p-6 flex items-center justify-between">
        <div>
           <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
              <Ban className="w-5 h-5" />
              {t('pauseBookings')}
           </h3>
           <p className="text-sm text-orange-700">{t('pauseBookingsDesc') || 'Interromper agendamentos no site imediatamente'}</p>
        </div>
        <button
          onClick={toggleBookingPaused}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-inner ${bookingPaused ? 'bg-orange-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${bookingPaused ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
  )
}
