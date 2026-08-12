const { createClient } = require('@supabase/supabase-js')

// Hardcoded for debug script
const supabaseUrl = 'https://hbgahtifffwpvyhwxguq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZ2FodGlmZmZ3cHZ5aHd4Z3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODY0MDUsImV4cCI6MjA3OTA2MjQwNX0.gW3nLznq5POw3fJT3uISNOFVOWqvsdP5QZpTMHr88Mo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function find45CHFItems() {
    const { data, error } = await supabase
        .from('services')
        .select('id, name, category, price')
        .eq('price', 45)

    if (error) {
        console.error(error)
        return
    }

    console.log('Items costing 45 CHF:')
    data.forEach(item => {
        console.log(`- ${item.name} (${item.category}): ${item.price} [ID: ${item.id}]`)
    })
}

find45CHFItems()
