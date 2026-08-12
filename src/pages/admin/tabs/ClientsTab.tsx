import React from 'react'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  UserCircle, 
  RefreshCw, 
  Search, 
  Award, 
  Send, 
  Phone, 
  Mail 
} from 'lucide-react'
import { Professional, Client } from '@/types/admin'
import { toast } from 'sonner'

interface ClientsTabProps {
  professionals: Professional[]
  openCreateProfessional: () => void
  openEditProfessional: (p: Professional) => void
  deleteProfessional: (id: string) => void
  clientsList: Client[]
  clientsLoading: boolean
  fetchClientsList: () => void
  clientSearch: string
  setClientSearch: (s: string) => void
  clientFilter: 'all' | 'website' | 'manual'
  setClientFilter: (f: 'all' | 'website' | 'manual') => void
  handleRaffle: () => void
  isRaffling: boolean
  raffleWinner: Client | null
  selectedClientIds: string[]
  setSelectedClientIds: (ids: string[]) => void
  setCampaignModalOpen: (open: boolean) => void
  openEditClient: (c: Client) => void
  handleDeleteClient: (id: string) => void
  user: any
  t: (key: string) => string
  loading: boolean
}

export const ClientsTab: React.FC<ClientsTabProps> = ({
  professionals,
  openCreateProfessional,
  openEditProfessional,
  deleteProfessional,
  clientsList,
  clientsLoading,
  fetchClientsList,
  clientSearch,
  setClientSearch,
  clientFilter,
  setClientFilter,
  handleRaffle,
  isRaffling,
  raffleWinner,
  selectedClientIds,
  setSelectedClientIds,
  setCampaignModalOpen,
  openEditClient,
  handleDeleteClient,
  user,
  t,
  loading
}) => {
  return (
    <div className="space-y-6">
      {/* Professionals Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-500" />
              {t('professionals')}
            </h2>
            <p className="text-sm text-gray-500">{t('manageProfessionals')}</p>
          </div>
          <button onClick={openCreateProfessional} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-sm flex items-center gap-2 font-bold">
            <Plus className="w-4 h-4" />
            {t('new')}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {professionals.map(p => (
            <div key={p.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors bg-white shadow-sm">
              <div className="flex items-center gap-3">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-12 h-12 rounded-full object-cover border-2 border-pink-100" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-300">
                    <Users size={24} />
                  </div>
                )}
                <div>
                  <div className="font-bold text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-500 line-clamp-1">{p.bio}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEditProfessional(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                <button onClick={() => deleteProfessional(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {professionals.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('noProfessionals')}</p>
            </div>
          )}
        </div>
      </div>



      {/* Advanced Clients List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-serif text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            {t('clients') || 'Lista de Clientes'}
          </h2>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchClients')}
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm w-full sm:w-64 text-gray-800"
              />
            </div>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value as any)}
              className="flex-1 sm:flex-none border-gray-200 rounded-lg shadow-sm focus:border-pink-500 focus:ring-pink-500 text-sm py-2 text-gray-800"
            >
              <option value="all">{t('all')}</option>
              <option value="website">{t('website')}</option>
              <option value="manual">{t('manual')}</option>
            </select>
            <button
              onClick={fetchClientsList}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-100"
              title={t('refresh')}
            >
              <RefreshCw className={`w-5 h-5 ${clientsLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleRaffle}
                disabled={isRaffling || clientsList.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50 text-sm shadow-md shadow-blue-100"
              >
                <Award className="w-4 h-4" />
                {t('raffle')}
              </button>
              <button
                onClick={() => {
                  if (selectedClientIds.length === 0) {
                    toast.error(t('selectClientsFirst'))
                  } else {
                    setCampaignModalOpen(true)
                  }
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-bold transition-all text-sm shadow-md shadow-pink-100"
              >
                <Send className="w-4 h-4" />
                {t('campaign')}
              </button>
            </div>
          </div>
        </div>

        {/* Raffle Display Area */}
        {(isRaffling || raffleWinner) && (
          <div className="mb-8 p-8 bg-gradient-to-r from-pink-50 to-pink-100/50 rounded-2xl border border-pink-100 text-center animate-in fade-in slide-in-from-top-4">
            <h3 className="text-sm font-medium text-pink-600 uppercase tracking-wider mb-2">
              {isRaffling ? t('raffling') : t('raffleWinnerTitle')}
            </h3>
            <div className={`text-4xl font-bold ${isRaffling ? 'text-gray-400 blur-[1px]' : 'text-pink-600'} transition-all min-h-[50px] flex items-center justify-center`}>
              {raffleWinner?.full_name || '...'}
            </div>
            {!isRaffling && raffleWinner && (
              <div className="mt-4 flex items-center justify-center gap-4 text-pink-600">
                <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {raffleWinner.phone || '-'}</span>
                {raffleWinner.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {raffleWinner.email}</span>}
              </div>
            )}
          </div>
        )}

        {/* Clients Content */}
        {clientsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : clientsList.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100 text-gray-500 italic">
            {t('noClients') || 'Nenhum cliente cadastrado'}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            {/* Desktop Table (Visible on sm+) */}
            <table className="hidden sm:table min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      className="rounded h-5 w-5 text-pink-500 focus:ring-pink-500 cursor-pointer"
                      checked={selectedClientIds.length > 0 && selectedClientIds.length === clientsList.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClientIds(clientsList.map(c => c.id))
                        } else {
                          setSelectedClientIds([])
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('phoneLabel')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('email')}</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clientsList
                  .filter(client => {
                    let isManual = false;
                    if (client.email?.endsWith('@temp.com') || client.phone?.startsWith('walkin_')) {
                      isManual = true;
                    } else if (client.user_id === null) {
                      const hasWebsiteAppts = client.appointments?.some((a: any) =>
                        a.user_id === null || (a.user_id === client.user_id && client.user_id !== null)
                      );
                      if (client.appointments?.length > 0 && !hasWebsiteAppts) {
                        isManual = true;
                      }
                    }

                    if (clientFilter === 'website') return !isManual;
                    if (clientFilter === 'manual') return isManual;
                    return true;
                  })
                  .map((client) => {
                    let isManual = false;
                    if (client.email?.endsWith('@temp.com') || client.phone?.startsWith('walkin_')) {
                      isManual = true;
                    } else if (client.user_id === null) {
                      const hasWebsiteAppts = client.appointments?.some((a: any) =>
                        a.user_id === null || (a.user_id === client.user_id && client.user_id !== null)
                      );
                      if (client.appointments?.length > 0 && !hasWebsiteAppts) {
                        isManual = true;
                      }
                    }

                    return (
                      <tr key={client.id} className={`hover:bg-gray-50 transition-colors ${selectedClientIds.includes(client.id) ? 'bg-pink-50/20' : ''}`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded text-pink-500 focus:ring-pink-500"
                            checked={selectedClientIds.includes(client.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClientIds([...selectedClientIds, client.id])
                              } else {
                                setSelectedClientIds(selectedClientIds.filter(id => id !== client.id))
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-none">
                          <div className="flex items-center gap-2">
                            {client.full_name}
                            {isManual && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">Manual</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone?.startsWith('walkin_') ? '-' : (client.phone || '-')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.email?.endsWith('@temp.com') ? '-' : (client.email || '-')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEditClient(client)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14} /></button>
                            <button onClick={() => handleDeleteClient(client.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>

            {/* Mobile Cards (Visible on <sm) */}
            <div className="sm:hidden space-y-4 px-6 py-2">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border mb-4">
                <span className="text-sm font-medium text-gray-700">Selecionar Todos</span>
                <input
                  type="checkbox"
                  className="rounded h-6 w-6 text-pink-500 focus:ring-pink-500 cursor-pointer"
                  checked={selectedClientIds.length > 0 && selectedClientIds.length === clientsList.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedClientIds(clientsList.map(c => c.id))
                    } else {
                      setSelectedClientIds([])
                    }
                  }}
                />
              </div>
              {clientsList
                .filter(client => {
                  let isManual = false;
                  if (client.email?.endsWith('@temp.com') || client.phone?.startsWith('walkin_')) {
                    isManual = true;
                  } else if (client.user_id === null) {
                    const hasWebsiteAppts = client.appointments?.some((a: any) =>
                      a.user_id === null || (a.user_id === client.user_id && client.user_id !== null)
                    );
                    if (client.appointments?.length > 0 && !hasWebsiteAppts) {
                      isManual = true;
                    }
                  }

                  if (clientFilter === 'website') return !isManual;
                  if (clientFilter === 'manual') return isManual;
                  return true;
                })
                .map((client) => {
                  let isManual = false;
                  if (client.email?.endsWith('@temp.com') || client.phone?.startsWith('walkin_')) {
                    isManual = true;
                  } else if (client.user_id === null) {
                    const hasWebsiteAppts = client.appointments?.some((a: any) =>
                      a.user_id === null || (a.user_id === client.user_id && client.user_id !== null)
                    );
                    if (client.appointments?.length > 0 && !hasWebsiteAppts) {
                      isManual = true;
                    }
                  }

                  return (
                    <div
                      key={client.id}
                      className={`p-4 rounded-xl border-2 transition-all ${selectedClientIds.includes(client.id) ? 'border-pink-300 bg-pink-50/50' : 'border-gray-100 bg-white'}`}
                      onClick={() => {
                        if (selectedClientIds.includes(client.id)) {
                          setSelectedClientIds(selectedClientIds.filter(id => id !== client.id))
                        } else {
                          setSelectedClientIds([...selectedClientIds, client.id])
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            {client.full_name}
                            {isManual && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">Manual</span>
                            )}
                          </h4>
                          <div className="text-sm text-gray-500 mt-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5" />
                              {client.phone?.startsWith('walkin_') ? '-' : (client.phone || '-')}
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5" />
                              {client.email?.endsWith('@temp.com') ? '-' : (client.email || '-')}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                          <input
                            type="checkbox"
                            className="rounded h-6 w-6 text-pink-500 focus:ring-pink-500 cursor-pointer"
                            checked={selectedClientIds.includes(client.id)}
                            readOnly
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditClient(client); }}
                              className="p-2 bg-pink-50 text-pink-600 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                              className="p-2 bg-red-50 text-red-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
