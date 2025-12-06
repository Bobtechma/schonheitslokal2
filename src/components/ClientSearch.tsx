import { useState, useEffect, useRef } from 'react'
import { Search, User, Phone, Mail, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguageStore } from '@/stores/languageStore'

interface Client {
    id: string
    full_name: string
    email: string | null
    phone: string
    birth_date?: string | null
    gender?: string | null
    allergies?: string | null
    preferences?: string | null
}

interface ClientSearchProps {
    onSelect: (client: Client) => void
    onQueryChange?: (query: string) => void
    label?: string
    placeholder?: string
}

export default function ClientSearch({ onSelect, onQueryChange, label, placeholder }: ClientSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Client[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const { t } = useLanguageStore()

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const searchClients = async () => {
            if (query.length < 2) {
                setResults([])
                return
            }

            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('clients')
                    .select('*')
                    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
                    .limit(5)

                if (error) throw error
                setResults(data || [])
                setIsOpen(true)
            } catch (error) {
                console.error('Error searching clients:', error)
            } finally {
                setLoading(false)
            }
        }

        const debounce = setTimeout(searchClients, 300)
        return () => clearTimeout(debounce)
    }, [query])

    const handleSelect = (client: Client) => {
        onSelect(client)
        setQuery('')
        onQueryChange?.('')
        setResults([])
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={wrapperRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        const val = e.target.value
                        setQuery(val)
                        onQueryChange?.(val)
                        if (val.length === 0) setIsOpen(false)
                    }}
                    placeholder={placeholder || t('searchClientPlaceholder') || "Kunden suchen..."}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('')
                            onQueryChange?.('')
                            setResults([])
                            setIsOpen(false)
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {results.map((client) => (
                        <button
                            key={client.id}
                            onClick={() => handleSelect(client)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors flex items-start space-x-3"
                        >
                            <div className="bg-pink-100 p-2 rounded-full">
                                <User className="w-4 h-4 text-pink-600" />
                            </div>
                            <div>
                                <div className="font-medium text-gray-800">{client.full_name}</div>
                                <div className="text-sm text-gray-500 flex flex-col space-y-1 mt-1">
                                    <span className="flex items-center">
                                        <Phone className="w-3 h-3 mr-1" />
                                        {client.phone}
                                    </span>
                                    {client.email && (
                                        <span className="flex items-center">
                                            <Mail className="w-3 h-3 mr-1" />
                                            {client.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && query.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    Keine Kunden gefunden
                </div>
            )}
        </div>
    )
}
