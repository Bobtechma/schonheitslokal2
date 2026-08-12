
const appointments = [
    { appointment_time: '10:00:00', total_duration_minutes: 60 },
    { appointment_time: '14:00', total_duration_minutes: 30 }
]

function check(slotTime, newDuration) {
    const slotStart = new Date(`2000-01-01T${slotTime}`)
    const slotEnd = new Date(slotStart)
    slotEnd.setMinutes(slotEnd.getMinutes() + newDuration)

    console.log(`Checking Slot: ${slotTime}, formatted: ${slotStart.toISOString()}`)

    const hasConflict = appointments.some(apt => {
        let t = apt.appointment_time
        // mimic simple usage
        const aptStart = new Date(`2000-01-01T${t}`)
        const aptEnd = new Date(aptStart)
        aptEnd.setMinutes(aptEnd.getMinutes() + apt.total_duration_minutes)

        console.log(`  Vs Apt: ${t} (${apt.total_duration_minutes}m) -> ${aptStart.toISOString()} to ${aptEnd.toISOString()}`)

        const conflict = (slotStart < aptEnd && slotEnd > aptStart)
        console.log(`    Conflict? ${conflict}`)
        return conflict
    })
    return hasConflict
}

console.log("Result 10:30 (30m):", check('10:30', 30)) // Should be TRUE (overlap 10:30-11:00 vs 10:00-11:00)
console.log("Result 11:00 (30m):", check('11:00', 30)) // Should be FALSE
