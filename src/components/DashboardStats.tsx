import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Loader2, TrendingUp, Users, ShoppingBag, Calendar, DollarSign, Eye, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { generateDashboardPDF } from '@/lib/pdfGenerator'

type Period = 'today' | 'month' | 'year' | 'all'

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

export default function DashboardStats() {
    const [period, setPeriod] = useState<Period>('month')
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({ start: startOfMonth(new Date()), end: endOfDay(new Date()) })
    const { t } = useLanguageStore()

    useEffect(() => {
        fetchStats()
    }, [period])

    const getDateRange = (p: Period) => {
        const now = new Date()
        switch (p) {
            case 'today':
                return { start: startOfDay(now), end: endOfDay(now) }
            case 'month':
                return { start: startOfMonth(now), end: endOfMonth(now) }
            case 'year':
                return { start: startOfYear(now), end: endOfYear(now) }
            case 'all':
                return { start: new Date('2020-01-01'), end: endOfDay(now) }
            default:
                return { start: startOfMonth(now), end: endOfMonth(now) }
        }
    }

    const fetchStats = async () => {
        setLoading(true)
        const range = getDateRange(period)
        setDateRange(range)

        try {
            const { data, error } = await supabase.rpc('get_dashboard_stats', {
                p_start_date: range.start.toISOString(),
                p_end_date: range.end.toISOString()
            })

            if (error) throw error

            setStats(data as Stats)
        } catch (error: any) {
            console.error('Error fetching stats:', error)
            if (error.code === 'PGRST303') {
                const { checkSession } = useAuthStore.getState()
                await checkSession()
            }
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm">
                <div className="flex space-x-2">
                    {(['today', 'month', 'year', 'all'] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${period === p
                                ? 'bg-pink-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {p === 'today' ? t('today') || 'Today' :
                                p === 'month' ? t('thisMonth') || 'Month' :
                                    p === 'year' ? t('thisYear') || 'Year' :
                                        t('allTime') || 'All Time'}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => stats && generateDashboardPDF(stats, period)}
                    disabled={!stats}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    <Download className="w-4 h-4 mr-2" />
                    {t('exportPDF') || 'Export PDF'}
                </button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            {formatCurrency(stats.total_revenue)}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">{t('totalRevenue') || 'Total Revenue'}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(stats.total_revenue)}</h3>
                    <div className="mt-2 text-xs text-gray-400">
                        {t('services') || 'Services'}: {formatCurrency(stats.services_revenue)} • {t('products') || 'Products'}: {formatCurrency(stats.products_revenue)}
                    </div>
                </div>

                {/* Total Appointments */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            {stats.total_appointments}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">{t('appointments') || 'Appointments'}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.total_appointments}</h3>
                </div>

                {/* Products Sold */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                            {stats.total_products_sold}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">{t('productsSold') || 'Products Sold'}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.total_products_sold}</h3>
                </div>

                {/* Page Views */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <Eye className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            {stats.total_page_views}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">{t('pageViews') || 'Page Views'}</p>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.total_page_views}</h3>
                </div>
            </div>

            {/* Popular Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Most Viewed Services */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-pink-500" />
                        {t('popularServices') || 'Popular Services'} (Views)
                    </h3>
                    <div className="space-y-4">
                        {stats.most_viewed_services && stats.most_viewed_services.length > 0 ? (
                            stats.most_viewed_services.map((svc, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700 flex items-center">
                                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs mr-2">
                                            {i + 1}
                                        </span>
                                        {svc.name}
                                    </span>
                                    <span className="font-medium text-gray-900">{svc.views}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic">No data available</p>
                        )}
                    </div>
                </div>

                {/* Most Viewed Products */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <ShoppingBag className="w-4 h-4 mr-2 text-pink-500" />
                        {t('popularProducts') || 'Popular Products'} (Views)
                    </h3>
                    <div className="space-y-4">
                        {stats.most_viewed_products && stats.most_viewed_products.length > 0 ? (
                            stats.most_viewed_products.map((prod, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700 flex items-center">
                                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs mr-2">
                                            {i + 1}
                                        </span>
                                        {prod.name}
                                    </span>
                                    <span className="font-medium text-gray-900">{prod.views}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic">No data available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
