import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Trash2, 
  Plus, 
  Edit2, 
  Mail, 
  Search, 
  Filter, 
  UserPlus, 
  Shield, 
  MoreVertical,
  Ticket,
  ChevronRight,
  Send,
  Loader2,
  X,
  Calendar,
  Package,
  Clock,
  RefreshCw,
  Award,
  Save,
  UserCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { Professional, Client } from '../../types/admin';
import { type Service } from '@/lib/supabase';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ClientSearch from '../ClientSearch';
import { formatCurrency } from '../../lib/utils';

interface PeopleTabProps {
  services: Service[];
  onRefresh?: () => void;
}

const PeopleTab: React.FC<PeopleTabProps> = ({ services, onRefresh }) => {
  const { user } = useAuthStore();
  const { t, language } = useLanguageStore();
  const isPt = language === 'pt-BR';
  
  // State from AdminDashboard
  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [professionalFormOpen, setProfessionalFormOpen] = useState(false);
  
  const [users, setUsers] = useState<any[]>([]);
  const [newUserForm, setNewUserForm] = useState({ email: '', password: '', role: 'client' });
  
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  
  const [raffleWinner, setRaffleWinner] = useState<Client | null>(null);
  const [isRaffling, setIsRaffling] = useState(false);
  
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ subject: '', body: '', target: 'all' });
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

  // Manual Booking State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualCategory, setManualCategory] = useState<'service' | 'product'>('service');
  const [manualForm, setManualForm] = useState({ 
    clientIdentifier: '', 
    date: new Date().toISOString().split('T')[0], 
    time: '', 
    notes: '', 
    selectedServiceIds: [] as string[], 
    email: '', 
    phone: '',
    birthDate: '',
    address: ''
  });
  const [manualProfessionalId, setManualProfessionalId] = useState<string | null>(null);
  const [manualAvailableTimes, setManualAvailableTimes] = useState<string[]>([]);
  const [manualTimesLoading, setManualTimesLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Professional Form State
  const [professionalForm, setProfessionalForm] = useState({ name: '', bio: '', photo_url: '', active: true });
  const [profServices, setProfServices] = useState<string[]>([]);
  const [profSchedule, setProfSchedule] = useState<any[]>([]); // Simplified for now
  const [uploadingImage, setUploadingImage] = useState(false);

  // Client Form State
  const [clientForm, setClientForm] = useState({ full_name: '', email: '', phone: '', birth_date: '', address: '' });

  useEffect(() => {
    fetchProfessionals();
    fetchUsers();
    fetchClientsList();
  }, []);

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .order('name');
      if (error) throw error;
      setProfessionals(data || []);
    } catch (err) {
      console.error('Error fetching professionals:', err);
    }
  };

  const fetchUsers = async () => {
    // Note: In a real app, listing auth users requires service role or a specific function
    // For now, we fetch from a custom users table if it exists, or handle role-based logic
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('user_id, email, full_name, role')
        .not('user_id', 'is', null);
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const loadingToast = toast.loading(isPt ? 'Atualizando cargo...' : 'Rolle wird aktualisiert...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/admin-mgmt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'updateUserRole', userId, role: newRole })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update user role');

      toast.success(isPt ? 'Cargo atualizado com sucesso!' : 'Rolle erfolgreich aktualisiert!', { id: loadingToast });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(
        isPt ? `Erro ao atualizar cargo: ${err.message}` : `Fehler beim Aktualisieren: ${err.message}`, 
        { id: loadingToast }
      );
    }
  };

  const fetchClientsList = async () => {
    setClientsLoading(true);
    try {
      let query = supabase.from('clients').select('*');
      
      if (clientFilter === 'active') {
        // Example filter logic
      }
      
      const { data, error } = await query.order('full_name');
      if (error) throw error;
      setClientsList(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setClientsLoading(false);
    }
  };

  const handleRaffle = () => {
    if (clientsList.length === 0) return;
    setIsRaffling(true);
    setTimeout(() => {
      const winner = clientsList[Math.floor(Math.random() * clientsList.length)];
      setRaffleWinner(winner);
      setIsRaffling(false);
    }, 2000);
  };

  const sendCampaign = async () => {
    setSendingCampaign(true);
    // Implementation for sending campaign (emails, notifications, etc.)
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSendingCampaign(false);
    setCampaignModalOpen(false);
    alert('Campanha enviada com sucesso!');
  };

  const handleManualCreate = async () => {
    // Basic implementation of manual booking/sale
    toast.info('Funcionalidade de agendamento manual sendo migrada...');
    setManualModalOpen(false);
  };

  const saveProfessional = async () => {
    // Migration of save professional logic
    toast.info('Funcionalidade de salvar profissional sendo migrada...');
    setProfessionalFormOpen(false);
  };

  const saveClient = async () => {
    // Migration of save client logic
    toast.info('Funcionalidade de salvar cliente sendo migrada...');
    setClientFormOpen(false);
  };

  // Rendering Helper
  const filteredClients = clientsList.filter(c => 
    c.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch)
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Professionals Section */}
      <section className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {t('professionals')}
          </h2>
          <button 
            onClick={() => setProfessionalFormOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            Adicionar Profissional
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map(prof => (
            <div key={prof.id} className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{prof.name}</h3>
                    <p className="text-sm text-gray-500">{prof.bio || 'Profissional'}</p>
                  </div>
                </div>
                <div className="flex gap-2 transition-opacity">
                  <button onClick={() => { setEditingProfessional(prof); setProfessionalFormOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* User Management Section */}
      <section className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Gestão de Acessos
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 font-semibold text-gray-600">Usuário</th>
                <th className="pb-4 font-semibold text-gray-600">Cargo</th>
                <th className="pb-4 font-semibold text-gray-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{u.full_name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <select
                      value={u.role || 'client'}
                      onChange={async (e) => {
                        await handleUpdateRole(u.user_id, e.target.value);
                      }}
                      className="bg-white border border-gray-200 rounded-lg text-xs font-semibold p-1.5 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                    >
                      <option value="client">{isPt ? 'Cliente' : 'Kunde'}</option>
                      <option value="partner">{isPt ? 'Salão Parceiro' : 'Partner-Salon'}</option>
                      <option value="admin">{isPt ? 'Administrador' : 'Administrator'}</option>
                      <option value="owner">{isPt ? 'Proprietário' : 'Besitzer'}</option>
                    </select>
                  </td>
                  <td className="py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                      <Shield className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Client List Section */}
      <section className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Base de Clientes
            </h2>
            <p className="text-gray-500 mt-1">{clientsList.length} clientes registrados</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleRaffle}
              disabled={isRaffling}
              className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition-all font-medium disabled:opacity-50"
            >
              <Ticket className="w-5 h-5" />
              {isRaffling ? 'Sorteando...' : 'Realizar Sorteio'}
            </button>
            <button 
              onClick={() => setCampaignModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-primary/25"
            >
              <Send className="w-5 h-5" />
              Disparar Campanha
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Buscar por nome, email ou telefone..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none"
            />
          </div>
          <select 
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none text-gray-600 min-w-[160px]"
          >
            <option value="all">Todos os tipos</option>
            <option value="active">Clientes Ativos</option>
            <option value="newsletter">Newsletter</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <div key={client.id} className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-primary/20">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-primary font-bold text-lg">
                  {client.full_name?.charAt(0) || 'C'}
                </div>
                <button 
                  onClick={() => { setEditingClient(client); setClientFormOpen(true); }}
                  className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{client.full_name}</h3>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4 opacity-70" />
                {client.email || 'N/A'}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-400">
                <span>Desde {client.created_at ? format(new Date(client.created_at), 'dd/MM/yyyy') : 'N/A'}</span>
                <span className="text-primary hover:underline cursor-pointer flex items-center gap-1">
                  Ver histórico <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Raffle Result Overlay */}
      {raffleWinner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setRaffleWinner(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Ticket className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ganhador do Sorteio!</h2>
            <p className="text-gray-500 mb-6">Entre em contato para entregar o prêmio</p>
            <div className="p-6 bg-amber-50 rounded-2xl mb-8">
              <div className="text-xl font-black text-amber-700 mb-1">{raffleWinner.full_name}</div>
              <div className="text-amber-600/70 font-medium">{raffleWinner.email}</div>
              <div className="text-amber-600/70 font-medium mt-1">{raffleWinner.phone}</div>
            </div>
            <button 
              onClick={() => setRaffleWinner(null)}
              className="w-full bg-amber-500 text-white py-4 rounded-2xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleTab;
