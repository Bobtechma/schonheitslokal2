import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { join } from 'path'

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase URL or Anon Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugSales() {
    console.log('--- Debugging Sales from Yesterday ---')

    // Get yesterday's date range (UTC based on local suggestion)
    // Let's look at a broad range: last 48 hours to now
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 2) // Look back 2 days to be safe

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
        const isProduct = apt.services.every((s: any) => s.services?.category === 'product')
        const servicesList = apt.services.map((s: any) => `${s.services?.name} (${s.services?.category})`).join(', ')

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
