import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)}.-`
}

export function formatDate(date: string | Date): string {
  let d: Date;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    d = new Date(year, month - 1, day);
  } else {
    d = new Date(date);
  }

  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d)
}

export function formatTime(time: string): string {
  return new Intl.DateTimeFormat('de-CH', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(`2000-01-01T${time}`))
}

export function formatDateTime(date: string | Date, time?: string): string {
  if (date instanceof Date) {
    const d = date
    const dateStr = new Intl.DateTimeFormat('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d)
    const timeStr = new Intl.DateTimeFormat('de-CH', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(d)
    return `${dateStr} um ${timeStr} Uhr`
  }
  return `${formatDate(date)} um ${formatTime(time!)} Uhr`
}

export function getDurationText(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}min`
}

export function isTimeAvailable(
  date: string,
  time: string,
  duration: number,
  appointments: Array<{ appointment_date: string; appointment_time: string; total_duration_minutes: number }>
): boolean {
  const appointmentStart = new Date(`${date}T${time}`)
  const appointmentEnd = new Date(appointmentStart.getTime() + duration * 60000)

  return !appointments.some(apt => {
    if (apt.appointment_date !== date) return false

    const aptStart = new Date(`${apt.appointment_date}T${apt.appointment_time}`)
    const aptEnd = new Date(aptStart.getTime() + apt.total_duration_minutes * 60000)

    return (
      (appointmentStart >= aptStart && appointmentStart < aptEnd) ||
      (appointmentEnd > aptStart && appointmentEnd <= aptEnd) ||
      (appointmentStart <= aptStart && appointmentEnd >= aptEnd)
    )
  })
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  interval: number = 30
): string[] {
  const slots: string[] = []
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)

  while (start < end) {
    slots.push(start.toTimeString().slice(0, 5))
    start.setMinutes(start.getMinutes() + interval)
  }

  return slots
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/
  return phoneRegex.test(phone)
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export function sanitizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export function validateCpf(cpf: string): boolean {
  const cleaned = sanitizeCpf(cpf)
  if (cleaned.length !== 11) return false

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false

  // Validar dígitos verificadores
  let sum = 0
  let remainder

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false

  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false

  return true
}

export function formatCpf(cpf: string): string {
  const cleaned = sanitizeCpf(cpf)
  if (cleaned.length !== 11) return cpf
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
}

export function getInitials(name: string): string {
  const words = name.trim().split(' ')
  if (words.length === 0) return ''
  if (words.length === 1) return words[0].charAt(0).toUpperCase()
  return `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase()
}
