const { createClient } = require('@supabase/supabase-js')

// Hardcoded from src/lib/supabase.ts (fallback value which seems correct)
const supabaseUrl = 'https://hbgahtifffwpvyhwxguq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZ2FodGlmZmZ3cHZ5aHd4Z3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODY0MDUsImV4cCI6MjA3OTA2MjQwNX0.gW3nLznq5POw3fJT3uISNOFVOWqvsdP5QZpTMHr88Mo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugSales() {
    console.log('--- Debugging Sales from Yesterday ---')

    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 7)

    console.log(`Searching from: ${yesterday.toISOString()} to ${now.toISOString()}`)

    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      payment_status,
      total_price,
      created_at,
      client:client_id (full_name, email),
      services:appointment_services (
        service_id,
        price_at_time,
        services (name, category)
      )
    `)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching appointments:', error)
        return
    }

    console.log(`Found ${appointments.length} appointments created in last 48h.`)

    appointments.forEach(apt => {
        const isProduct = apt.services.every((s) => s.services?.category === 'product')
        const servicesList = apt.services.map((s) => `${s.services?.name} (${s.services?.category})`).join(', ')

        console.log(`
    ID: ${apt.id}
    Created: ${apt.created_at}
    Date: ${apt.appointment_date} Time: ${apt.appointment_time}
    Status: ${apt.status}
    Payment: ${apt.payment_status}
    Total: ${apt.total_price}
    Client: ${apt.client?.full_name} (${apt.client?.email})
    Items: ${servicesList}
    Is Product Order: ${isProduct}
    `)
    })
}

debugSales()
