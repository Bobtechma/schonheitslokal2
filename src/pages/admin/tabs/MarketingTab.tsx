import React from 'react'
import { 
  Tag, 
  Save, 
  Gift, 
  Trophy, 
  Play, 
  Trash2, 
  Plus, 
  ImageIcon, 
  Upload, 
  Instagram, 
  X 
} from 'lucide-react'
import { Service } from '@/lib/supabase'
import { RouletteSettings, CarouselItem, InstagramPost } from '@/types/admin'

interface MarketingTabProps {
  // Promotions
  promoStorePct: number
  setPromoStorePct: (pct: number) => void
  savePromotions: () => void
  services: Service[]
  promoPerService: Record<string, number>
  setPromoPerService: (update: (prev: Record<string, number>) => Record<string, number>) => void
  
  // Birthday Voucher
  birthdayVoucherEnabled: boolean
  setBirthdayVoucherEnabled: (enabled: boolean) => void
  birthdayVoucherType: string
  setBirthdayVoucherType: (type: string) => void
  birthdayVoucherValue: string
  setBirthdayVoucherValue: (val: string) => void
  birthdayVoucherServiceId: string
  setBirthdayVoucherServiceId: (id: string) => void
  birthdayVoucherValidity: string
  setBirthdayVoucherValidity: (val: string) => void
  birthdayMessageTemplateDe: string
  setBirthdayMessageTemplateDe: (msg: string) => void
  birthdayMessageTemplatePt: string
  setBirthdayMessageTemplatePt: (msg: string) => void
  saveSettings: () => void

  // Roulette
  rouletteEnabled: boolean
  setRouletteEnabled: (enabled: boolean) => void
  rouletteSettings: RouletteSettings
  setRouletteSettings: (update: (prev: RouletteSettings) => RouletteSettings) => void
  setRoulettePreviewOpen: (open: boolean) => void
  saveRouletteSettings: () => void

  // Carousel
  carouselItems: CarouselItem[]
  newCarouselItem: { title: string, image_url: string }
  setNewCarouselItem: (item: any) => void
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  addCarouselItem: () => void
  deleteCarouselItem: (id: string) => void
  uploadingImage: boolean

  // Instagram
  instagramUsername: string
  setInstagramUsername: (val: string) => void
  instagramEmbedId: string
  setInstagramEmbedId: (val: string) => void
  instagramPosts: InstagramPost[]
  setInstagramPosts: (posts: InstagramPost[]) => void
  saveInstagramPosts: () => void

  t: (key: any) => string
}

export const MarketingTab: React.FC<MarketingTabProps> = ({
  promoStorePct,
  setPromoStorePct,
  savePromotions,
  services,
  promoPerService,
  setPromoPerService,
  birthdayVoucherEnabled,
  setBirthdayVoucherEnabled,
  birthdayVoucherType,
  setBirthdayVoucherType,
  birthdayVoucherValue,
  setBirthdayVoucherValue,
  birthdayVoucherServiceId,
  setBirthdayVoucherServiceId,
  birthdayVoucherValidity,
  setBirthdayVoucherValidity,
  birthdayMessageTemplateDe,
  setBirthdayMessageTemplateDe,
  birthdayMessageTemplatePt,
  setBirthdayMessageTemplatePt,
  saveSettings,
  rouletteEnabled,
  setRouletteEnabled,
  rouletteSettings,
  setRouletteSettings,
  setRoulettePreviewOpen,
  saveRouletteSettings,
  carouselItems,
  newCarouselItem,
  setNewCarouselItem,
  handleImageUpload,
  addCarouselItem,
  deleteCarouselItem,
  uploadingImage,
  instagramUsername,
  setInstagramUsername,
  instagramEmbedId,
  setInstagramEmbedId,
  instagramPosts,
  setInstagramPosts,
  saveInstagramPosts,
  t
}) => {
  return (
    <div className="space-y-6">
      {/* Promotions & Discounts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Tag className="w-5 h-5 text-pink-500" />
              {t('promotionsAndDiscounts')}
            </h2>
            <p className="text-sm text-gray-500">{t('storeDiscountDesc') || 'Configure descontos gerais para toda a loja'}</p>
          </div>
          <button onClick={savePromotions} className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-md font-bold flex items-center gap-2">
            <Save className="w-4 h-4" />
            {t('save')}
          </button>
        </div>
        <div className="max-w-xs mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-2">{t('globalDiscount')} (%)</label>
          <input
            type="number"
            value={promoStorePct}
            onChange={(e) => setPromoStorePct(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
            min="0"
            max="100"
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">{t('specificPromotions') || 'Promoções Específicas'}</h3>
          <p className="text-sm text-gray-500 mb-4">{t('promoConfigDesc') || 'Configure promoções para serviços específicos'}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(svc => (
              <div key={svc.id} className="p-4 border border-gray-50 rounded-xl bg-gray-50/30">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 truncate">{svc.name}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={promoPerService[svc.id] || 0}
                    onChange={(e) => setPromoPerService(prev => ({ ...prev, [svc.id]: Number(e.target.value) }))}
                    className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm"
                    min="0"
                    max="100"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Birthday Voucher Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-500" />
              {t('birthdayVoucherTitle')}
            </h2>
            <p className="text-sm text-gray-500">{t('birthdayVoucherDesc')}</p>
          </div>
          <button onClick={saveSettings} className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-md font-bold flex items-center gap-2">
            <Save className="w-4 h-4" />
            {t('save')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="font-bold text-gray-700">{t('birthdayVoucherEnabled')}</span>
              <button 
                onClick={() => setBirthdayVoucherEnabled(!birthdayVoucherEnabled)} 
                className={`w-12 h-6 rounded-full transition-colors relative ${birthdayVoucherEnabled ? 'bg-pink-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${birthdayVoucherEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('voucherType')}</label>
                <select value={birthdayVoucherType} onChange={e => setBirthdayVoucherType(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                  <option value="discount_percentage">{t('discountPercentage')}</option>
                  <option value="discount_amount">{t('discountAmount')}</option>
                  <option value="free_service">{t('freeService')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  {birthdayVoucherType === 'free_service' ? t('specificService') : t('voucherValue')}
                </label>
                {birthdayVoucherType === 'free_service' ? (
                  <select value={birthdayVoucherServiceId} onChange={e => setBirthdayVoucherServiceId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="">{t('selectServiceVoucher')}</option>
                    {services.filter(s => s.category === 'service').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input type="number" value={birthdayVoucherValue} onChange={e => setBirthdayVoucherValue(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('validityDays')}</label>
              <input type="number" value={birthdayVoucherValidity} onChange={e => setBirthdayVoucherValidity(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('messageTemplateDe')}</label>
              <textarea value={birthdayMessageTemplateDe} onChange={e => setBirthdayMessageTemplateDe(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm h-24" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('messageTemplatePt')}</label>
              <textarea value={birthdayMessageTemplatePt} onChange={e => setBirthdayMessageTemplatePt(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm h-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Lucky Roulette Config */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              {t('luckyRoulette')}
            </h2>
            <p className="text-sm text-gray-500">{t('rouletteConfigDesc') || 'Configure os prêmios da roleta da sorte'}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setRoulettePreviewOpen(true)} className="px-4 py-2 border border-pink-200 text-pink-600 rounded-lg hover:bg-pink-50 transition-all font-bold flex items-center gap-2">
              <Play className="w-4 h-4" />
              {t('test')}
            </button>
            <button onClick={saveRouletteSettings} className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-md font-bold flex items-center gap-2">
              <Save className="w-4 h-4" />
              {t('save')}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="font-bold text-gray-700">{t('enabled')}</span>
              <button onClick={() => setRouletteEnabled(!rouletteEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${rouletteEnabled ? 'bg-pink-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${rouletteEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <label className="block text-sm font-bold text-gray-700">{t('cooldownDays')}</label>
              <input 
                type="number" 
                value={rouletteSettings.cooldown_days} 
                onChange={(e) => setRouletteSettings(prev => ({ ...prev, cooldown_days: Number(e.target.value) }))} 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" 
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-800">{t('prizes')}</h3>
              <div className="text-xs text-pink-500 font-bold uppercase tracking-widest">{t('editOptions')}</div>
            </div>
            <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
              {rouletteSettings.options.map((prize, idx) => (
                <div key={idx} className="flex gap-2 items-center p-3 border border-gray-100 rounded-lg bg-white group">
                  <input 
                    type="text" 
                    value={prize.label} 
                    onChange={(e) => {
                      const newOptions = [...rouletteSettings.options];
                      newOptions[idx] = { ...newOptions[idx], label: e.target.value };
                      setRouletteSettings(prev => ({ ...prev, options: newOptions }));
                    }} 
                    className="flex-1 text-sm border-none focus:ring-0 p-0 font-medium" 
                  />
                  <input 
                    type="number" 
                    value={prize.probability} 
                    onChange={(e) => {
                      const newOptions = [...rouletteSettings.options];
                      newOptions[idx] = { ...newOptions[idx], probability: Number(e.target.value) };
                      setRouletteSettings(prev => ({ ...prev, options: newOptions }));
                    }} 
                    className="w-12 text-sm border-none focus:ring-0 p-0 text-right text-gray-400" 
                  />
                  <input 
                    type="color" 
                    value={prize.color} 
                    onChange={(e) => {
                      const newOptions = [...rouletteSettings.options];
                      newOptions[idx] = { ...newOptions[idx], color: e.target.value };
                      setRouletteSettings(prev => ({ ...prev, options: newOptions }));
                    }} 
                    className="w-6 h-6 rounded border-none cursor-pointer p-0 bg-transparent" 
                  />
                  <span className="text-[10px] text-gray-300">%</span>
                  <button onClick={() => {
                    const newOptions = rouletteSettings.options.filter((_, i) => i !== idx);
                    setRouletteSettings(prev => ({ ...prev, options: newOptions }));
                  }} className="p-1 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => {
                  const newPrize = { 
                    id: Math.random().toString(36).substring(7), 
                    label: 'Novo Prêmio', 
                    probability: 0, 
                    color: '#FF69B4' 
                  };
                  setRouletteSettings(prev => ({
                    ...prev,
                    options: [...prev.options, newPrize]
                  }));
                }}
                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs font-bold hover:border-pink-300 hover:text-pink-500 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('add')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Carousel & Instagram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carousel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-400" />
                {t('homeCarousel')}
              </h2>
              <p className="text-sm text-gray-500">{t('manageHeroCarousel') || 'Imagens principais da página inicial'}</p>
            </div>
            <label className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all shadow-sm flex items-center gap-2 font-bold cursor-pointer">
              <Upload className="w-4 h-4" />
              {t('upload')}
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
          
          <div className="space-y-4">
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white relative">
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                  ) : newCarouselItem.image_url ? (
                    <>
                      <img src={newCarouselItem.image_url} alt="Preview" className="h-24 object-contain rounded" />
                      <button onClick={() => setNewCarouselItem({...newCarouselItem, image_url: ''})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3"/></button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer">
                      <Upload className="w-6 h-6 text-gray-400 mb-2"/>
                      <span className="text-[10px] text-gray-500">{t('clickToUpload')}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
                <input placeholder={t('title')} value={newCarouselItem.title} onChange={e => setNewCarouselItem({...newCarouselItem, title: e.target.value})} className="border rounded-lg px-3 py-1.5 text-sm" />
                <button onClick={addCarouselItem} className="w-full py-2 bg-pink-500 text-white rounded-lg font-bold text-sm hover:bg-pink-600">
                  {t('add')}
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
              {carouselItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg group hover:border-pink-200 transition-colors bg-white">
                  <img src={item.image_url} alt="" className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{item.title}</div>
                  </div>
                  <button onClick={() => deleteCarouselItem(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                </div>
              ))}
              {carouselItems.length === 0 && <p className="text-xs text-center text-gray-400 py-4 italic">{t('noCarouselItems')}</p>}
            </div>
          </div>
        </div>

        {/* Instagram */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Instagram className="w-5 h-5 text-pink-600" />
                Instagram Feed
              </h2>
              <p className="text-sm text-gray-500">{t('instagramFeedDesc') || 'Configure seu feed do Instagram na página inicial'}</p>
            </div>
            <button onClick={saveInstagramPosts} className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-md font-bold flex items-center gap-2">
              <Save className="w-4 h-4" />
              {t('save')}
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('title')} (Username)</label>
                <input type="text" value={instagramUsername} onChange={(e) => setInstagramUsername(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" placeholder="@username" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Embed Code / ID</label>
                <input type="text" value={instagramEmbedId} onChange={(e) => setInstagramEmbedId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" placeholder="https://instagram.com/p/..." />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-4">{t('individualPosts') || 'Postagens Individuais'}</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {instagramPosts.map((post, idx) => (
                  <div key={idx} className="relative group/post border rounded-xl overflow-hidden aspect-square bg-gray-50 hover:shadow-lg transition-all p-3 space-y-2">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Post #{idx + 1}</label>
                    <input 
                      type="text" 
                      placeholder="Image URL" 
                      value={post.image_url} 
                      onChange={e => {
                        const newPosts = [...instagramPosts];
                        newPosts[idx].image_url = e.target.value;
                        setInstagramPosts(newPosts);
                      }} 
                      className="w-full text-[10px] border-none bg-transparent focus:ring-0 p-0"
                    />
                    <input 
                      type="text" 
                      placeholder="Link Instagram" 
                      value={post.link} 
                      onChange={e => {
                        const newPosts = [...instagramPosts];
                        newPosts[idx].link = e.target.value;
                        setInstagramPosts(newPosts);
                      }} 
                      className="w-full text-[10px] text-pink-600 font-medium border-none bg-transparent focus:ring-0 p-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
