import React from 'react'
import { 
  Clock, 
  Save, 
  Ban, 
  X, 
  Trash2 
} from 'lucide-react'
import { BusinessHour, BlockedDate, BlockedSlot } from '@/types/admin'

interface SettingsTabProps {
  businessHours: BusinessHour[]
  setBusinessHours: (hours: BusinessHour[]) => void
  saveBusinessHours: () => void
  blockedDates: BlockedDate[]
  newBlockedDate: string
  setNewBlockedDate: (date: string) => void
  addBlockedDate: () => void
  removeBlockedDate: (id: string) => void
  blockedSlots: BlockedSlot[]
  newBlockedSlot: { date: string, start_time: string, end_time: string, reason: string }
  setNewBlockedSlot: (slot: any) => void
  addBlockedSlot: () => void
  deleteBlockedSlot: (id: string) => void
  t: (key: any) => string
  formatDate: (date: any) => string
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  businessHours,
  setBusinessHours,
  saveBusinessHours,
  blockedDates,
  newBlockedDate,
  setNewBlockedDate,
  addBlockedDate,
  removeBlockedDate,
  blockedSlots,
  newBlockedSlot,
  setNewBlockedSlot,
  addBlockedSlot,
  deleteBlockedSlot,
  t,
  formatDate
}) => {
  return (
    <div className="space-y-6">
      {/* Business Hours & Availability */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-pink-500" />
              {t('businessHours')}
            </h2>
            <p className="text-sm text-gray-500">{t('manageAvailability') || 'Configure horários e datas bloqueadas'}</p>
          </div>
          <button onClick={saveBusinessHours} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all shadow-sm flex items-center gap-2 font-bold text-sm">
            <Save className="w-4 h-4" />
            {t('save')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Schedule */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">{t('weeklySchedule') || 'Horários Semanais'}</h3>
            {businessHours.map((day, index) => (
              <div key={day.id || index} className="flex items-center justify-between p-3 border border-gray-50 rounded-xl hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!day.is_closed}
                    onChange={e => {
                      const newHours = [...businessHours]
                      newHours[index].is_closed = !e.target.checked
                      setBusinessHours(newHours)
                    }}
                    className="rounded h-5 w-5 text-pink-500 focus:ring-pink-500 cursor-pointer"
                  />
                  <span className="font-bold text-gray-700 w-24">
                    {t(('weekday' + day.day_of_week) as any)}
                  </span>
                </div>
                {!day.is_closed ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day.open_time || ''}
                      onChange={e => {
                        const newHours = [...businessHours]
                        newHours[index].open_time = e.target.value
                        setBusinessHours(newHours)
                      }}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="time"
                      value={day.close_time || ''}
                      onChange={e => {
                        const newHours = [...businessHours]
                        newHours[index].close_time = e.target.value
                        setBusinessHours(newHours)
                      }}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-medium text-red-400 bg-red-50 px-3 py-1 rounded-full uppercase italic">{t('closed')}</span>
                )}
              </div>
            ))}
          </div>

          {/* Blocked Dates & Slots */}
          <div className="space-y-6">
            {/* Blocked Dates */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-500" />
                {t('blockedDates')}
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="date"
                  value={newBlockedDate}
                  onChange={e => setNewBlockedDate(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 bg-white"
                />
                <button onClick={addBlockedDate} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all font-bold text-sm">
                  {t('block')}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {blockedDates.map(date => (
                  <div key={date.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100 group">
                    <span className="text-sm text-gray-700 font-medium">{formatDate(date.date)}</span>
                    <button onClick={() => removeBlockedDate(date.id)} className="text-red-400 hover:text-red-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {blockedDates.length === 0 && <p className="text-xs text-center text-gray-400 py-4 italic">{t('noBlockedDates')}</p>}
              </div>
            </div>

            {/* Blocked Slots */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                {t('blockedSlots') || 'Horários de Pausa (Intervalos)'}
              </h3>
              <div className="grid grid-cols-1 gap-3 mb-4">
                <div className="flex gap-2">
                  <input type="date" value={newBlockedSlot.date} onChange={e => setNewBlockedSlot({ ...newBlockedSlot, date: e.target.value })} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs" />
                  <input type="time" value={newBlockedSlot.start_time} onChange={e => setNewBlockedSlot({ ...newBlockedSlot, start_time: e.target.value })} className="w-24 border border-gray-200 rounded-lg px-2 py-2 text-xs" />
                  <input type="time" value={newBlockedSlot.end_time} onChange={e => setNewBlockedSlot({ ...newBlockedSlot, end_time: e.target.value })} className="w-24 border border-gray-200 rounded-lg px-2 py-2 text-xs" />
                </div>
                <div className="flex gap-2">
                  <input placeholder={t('reasonPlaceholder') || "Motivo (Ex: Almoço)"} value={newBlockedSlot.reason} onChange={e => setNewBlockedSlot({ ...newBlockedSlot, reason: e.target.value })} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs" />
                  <button onClick={addBlockedSlot} className="px-4 py-2 bg-pink-500 text-white rounded-lg font-bold text-xs hover:bg-pink-600">
                    {t('add')}
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {blockedSlots.map(slot => (
                  <div key={slot.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100 text-[10px] group">
                    <div className="font-bold text-gray-700">{formatDate(new Date(slot.start_time))}</div>
                    <div className="text-gray-500 font-medium">
                      {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="italic text-gray-400 max-w-[80px] truncate">{slot.reason}</div>
                    <button onClick={() => deleteBlockedSlot(slot.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {blockedSlots.length === 0 && <p className="text-xs text-center text-gray-400 py-4 italic">Keine Pausen vorhanden</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
