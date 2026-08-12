import React from 'react'
import { 
  Plus, 
  Scissors, 
  Package, 
  ChevronDown, 
  Edit, 
  Trash2 
} from 'lucide-react'
import { Service } from '@/lib/supabase'

interface ServicesTabProps {
  services: Service[]
  openCreateService: (type: 'service' | 'product') => void
  openEditService: (s: Service) => void
  deleteService: (id: string) => void
  isNewMenuOpen: boolean
  setIsNewMenuOpen: (open: boolean) => void
  t: (key: any) => string
  formatCurrency: (value: number) => string
}

export const ServicesTab: React.FC<ServicesTabProps> = ({
  services,
  openCreateService,
  openEditService,
  deleteService,
  isNewMenuOpen,
  setIsNewMenuOpen,
  t,
  formatCurrency
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gray-700" />
            {t('productsAndServices')}
          </h2>
          <p className="text-sm text-gray-500">{t('manageInventoryDesc') || 'Gerencie seu catálogo de serviços e produtos'}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-sm flex items-center gap-2 font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            {t('new')}
            <ChevronDown className="w-4 h-4" />
          </button>
          {isNewMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
              <button onClick={() => { openCreateService('service'); setIsNewMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-pink-50 text-sm text-gray-700 flex items-center gap-2 transition-colors">
                <Scissors className="w-4 h-4 text-pink-500" />
                {t('newService')}
              </button>
              <button onClick={() => { openCreateService('product'); setIsNewMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-pink-50 text-sm text-gray-700 flex items-center gap-2 transition-colors">
                <Package className="w-4 h-4 text-pink-500" />
                {t('newProduct')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-x-hidden">
        {/* Services Group */}
        <div>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-pink-500 rounded-full"></div>
            {t('services')}
          </h3>
          <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
            {services.filter(s => s.category === 'service').map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white hover:border-pink-200 transition-all shadow-sm group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center overflow-hidden">
                    {s.image_url ? <img src={s.image_url} className="w-full h-full object-cover" /> : <Scissors className="w-5 h-5 text-pink-200" />}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{s.name}</div>
                    <div className="text-xs text-gray-500 font-medium">{formatCurrency(s.price)} • {s.duration_minutes} min</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditService(s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                  <button onClick={() => deleteService(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products Group */}
        <div>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2 text-blue-600">
            <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
            {t('products')}
          </h3>
          <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
            {services.filter(s => s.category === 'product').map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white hover:border-blue-200 transition-all shadow-sm group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center overflow-hidden">
                    {s.image_url ? <img src={s.image_url} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-blue-200" />}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{s.name}</div>
                    <div className="text-xs text-gray-500 font-medium">{formatCurrency(s.price)} {s.stock !== undefined && `• ${t('stock') || 'Estoque'}: ${s.stock}`}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditService(s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                  <button onClick={() => deleteService(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
