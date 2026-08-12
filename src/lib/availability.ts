import { supabase } from './supabase'

export interface ProAvailability {
  professionalId: string
  availableSlots: string[]
  slotCount: number
}

interface ServiceLike {
  id: string
  duration_minutes: number
}

export async function getAvailabilityPerProfessional(
  date: string,
  services: ServiceLike[],
  totalDuration: number,
  specificProfessionalId?: string | null
): Promise<Map<string, ProAvailability>> {
  const result = new Map<string, ProAvailability>()

  try {
    const { data: slots, error } = await supabase.rpc('get_available_slots', {
      p_date: date,
      p_service_ids: services.map(s => s.id),
      p_professional_id: (specificProfessionalId && specificProfessionalId !== 'all') ? specificProfessionalId : null
    })

    if (error) {
      console.error('Error fetching availability from RPC:', error)
      return result
    }

    if (!slots || slots.length === 0) return result

    // Processar os resultados da RPC
    // A RPC retorna rows com: slot_time (TIME), available_professionals (UUID[])
    slots.forEach((row: { slot_time: string; available_professionals: string[] }) => {
      const time = row.slot_time.slice(0, 5) // HH:mm
      
      row.available_professionals.forEach(profId => {
        if (!result.has(profId)) {
          result.set(profId, {
            professionalId: profId,
            availableSlots: [],
            slotCount: 0
          })
        }
        
        const proAvail = result.get(profId)!
        proAvail.availableSlots.push(time)
        proAvail.slotCount = proAvail.availableSlots.length
      })
    })
  } catch (err) {
    console.error('Unexpected error in getAvailabilityPerProfessional:', err)
  }

  return result
}
