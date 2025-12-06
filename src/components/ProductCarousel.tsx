import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CarouselItem {
    id: string
    title: string
    description: string | null
    image_url: string | null
    link_url: string | null
    display_order: number
}

interface ProductCarouselProps {
    autoPlayInterval?: number
    showIndicators?: boolean
}

export default function ProductCarousel({ autoPlayInterval = 5000, showIndicators = true }: ProductCarouselProps) {
    const [items, setItems] = useState<CarouselItem[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCarouselItems()
    }, [])

    useEffect(() => {
        if (items.length === 0 || !autoPlayInterval) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length)
        }, autoPlayInterval)

        return () => clearInterval(interval)
    }, [items.length, autoPlayInterval])

    const fetchCarouselItems = async () => {
        try {
            const { data, error } = await supabase
                .from('carousel_items')
                .select('*')
                .eq('active', true)
                .order('display_order', { ascending: true })

            if (error) throw error
            setItems(data || [])
        } catch (error) {
            console.error('Error fetching carousel items:', error)
        } finally {
            setLoading(false)
        }
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % items.length)
    }

    const goToIndex = (index: number) => {
        setCurrentIndex(index)
    }

    if (loading) {
        return (
            <div className="w-full h-96 bg-gray-100 animate-pulse rounded-lg"></div>
        )
    }

    if (items.length === 0) {
        return null
    }



    return (
        <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-lg overflow-hidden shadow-2xl group">
            {/* Carousel Track */}
            <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {items.map((item) => (
                    <div key={item.id} className="relative w-full h-full flex-shrink-0">
                        {item.image_url ? (
                            <>
                                {/* Blurred Background Layer */}
                                <div className="absolute inset-0">
                                    <img
                                        src={item.image_url}
                                        alt=""
                                        className="w-full h-full object-cover blur-xl opacity-50 scale-110"
                                    />
                                </div>
                                {/* Main Image Layer */}
                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    className="relative w-full h-full object-contain z-10"
                                />
                            </>
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-600"></div>
                        )}

                        {/* Overlay & Content - Only show if there is content */}
                        {(item.title || item.description || item.link_url) && (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-20"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white z-30">
                                    {item.title && (
                                        <h2 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                                            {item.title}
                                        </h2>
                                    )}
                                    {item.description && (
                                        <p className="text-lg md:text-xl mb-6 max-w-2xl drop-shadow-md">
                                            {item.description}
                                        </p>
                                    )}
                                    {item.link_url && (
                                        <a
                                            href={item.link_url}
                                            className="inline-block px-8 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                                        >
                                            Saiba Mais
                                        </a>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {items.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                    </button>
                </>
            )}

            {/* Indicators */}
            {showIndicators && items.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToIndex(index)}
                            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${index === currentIndex
                                ? 'bg-white w-8 md:w-12'
                                : 'bg-white/50 hover:bg-white/75'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
