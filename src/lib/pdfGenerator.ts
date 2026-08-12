import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface Stats {
    total_page_views: number
    total_appointments: number
    total_products_sold: number
    services_revenue: number
    products_revenue: number
    total_revenue: number
    most_viewed_services: Array<{ name: string, views: number }>
    most_viewed_products: Array<{ name: string, views: number }>
    most_booked_services: Array<{ name: string, count: number }>
    most_sold_products: Array<{ name: string, count: number }>
}

export const generateDashboardPDF = (stats: Stats, period: string) => {
    const doc = new jsPDF()
    const today = new Date()

    // --- Header ---
    doc.setFontSize(22)
    doc.setTextColor(236, 72, 153) // Pink-500
    doc.text('Schönheitslokal', 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Relatório Gerado em: ${format(today, 'dd/MM/yyyy HH:mm')}`, 14, 28)
    doc.text(`Período: ${period.toUpperCase()}`, 14, 33)

    doc.line(14, 38, 196, 38)

    // --- Summary Cards ---
    let yPos = 50
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text('Resumo Financeiro e Operacional', 14, yPos)
    yPos += 10

    const summaryData = [
        ['Receita Total', `CHF ${stats.total_revenue.toFixed(2)}`],
        ['Receita de Serviços', `CHF ${stats.services_revenue.toFixed(2)}`],
        ['Receita de Produtos', `CHF ${stats.products_revenue.toFixed(2)}`],
        ['Agendamentos', stats.total_appointments.toString()],
        ['Produtos Vendidos', stats.total_products_sold.toString()],
        ['Visualizações de Página', stats.total_page_views.toString()],
    ]

    autoTable(doc, {
        startY: yPos,
        head: [['Métrica', 'Valor']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [236, 72, 153] },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 }
    })

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15

    // --- Popular Services (Views) ---
    doc.setFontSize(12)
    doc.text('Serviços Mais Visualizados', 14, yPos)
    yPos += 5

    const popularServicesData = stats.most_viewed_services.map(s => [s.name, s.views.toString()])

    autoTable(doc, {
        startY: yPos,
        head: [['Serviço', 'Visualizações']],
        body: popularServicesData.length ? popularServicesData : [['Sem dados', '-']],
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
    })

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15

    // --- Popular Products (Views) ---
    doc.setFontSize(12)
    doc.text('Produtos Mais Visualizados', 14, yPos)
    yPos += 5

    const popularProductsData = stats.most_viewed_products.map(p => [p.name, p.views.toString()])

    autoTable(doc, {
        startY: yPos,
        head: [['Produto', 'Visualizações']],
        body: popularProductsData.length ? popularProductsData : [['Sem dados', '-']],
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
    })

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15

    // --- Most Booked Services ---
    doc.setFontSize(12)
    doc.text('Serviços Mais Agendados', 14, yPos)
    yPos += 5

    const bookedServicesData = stats.most_booked_services.map(s => [s.name, s.count.toString()])

    autoTable(doc, {
        startY: yPos,
        head: [['Serviço', 'Agendamentos']],
        body: bookedServicesData.length ? bookedServicesData : [['Sem dados', '-']],
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
    })

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15

    // --- Most Sold Products ---
    doc.setFontSize(12)
    doc.text('Produtos Mais Vendidos', 14, yPos)
    yPos += 5

    const soldProductsData = stats.most_sold_products.map(p => [p.name, p.count.toString()])

    autoTable(doc, {
        startY: yPos,
        head: [['Produto', 'Quantidade Vendida']],
        body: soldProductsData.length ? soldProductsData : [['Sem dados', '-']],
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
    })

    // Save
    doc.save(`dashboard-report-${format(today, 'yyyy-MM-dd')}.pdf`)
}
