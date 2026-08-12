import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { CarouselContent } from './CarouselContent'

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

            // Preload the first image for LCP optimization
            if (data && data.length > 0 && data[0].image_url) {
                const firstImageUrl = `${data[0].image_url}?width=1200&quality=80`.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
                let preloadLink = document.getElementById('lcp-preload') as HTMLLinkElement;
                if (!preloadLink) {
                    preloadLink = document.createElement('link');
                    preloadLink.id = 'lcp-preload';
                    preloadLink.rel = 'preload';
                    preloadLink.as = 'image';
                    document.head.appendChild(preloadLink);
                }
                preloadLink.href = firstImageUrl;
                preloadLink.fetchPriority = 'high';
            }
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
            <div className="w-full aspect-[4/3] md:aspect-video lg:aspect-[2/1] bg-gray-100 animate-pulse rounded-lg shadow-inner flex items-center justify-center border border-pink-100 bg-pink-50/50">
                <div className="text-gray-300 font-medium">Lade Angebote...</div>
            </div>
        )
    }

    if (items.length === 0) {
        return null
    }



    return (
        <div className="relative w-full aspect-[4/3] md:aspect-video lg:aspect-[2/1] rounded-lg overflow-hidden shadow-2xl group border border-pink-100 bg-pink-50/50">
            {/* Carousel Track */}
            <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {items.map((item, index) => (
                    <div key={item.id} className="relative w-full h-full flex-shrink-0">
                        {item.link_url ? (
                            <a href={item.link_url} aria-label={item.title || "Go to link"} className="block w-full h-full relative group cursor-pointer">
                                <CarouselContent item={item} index={index} />
                            </a>
                        ) : (
                            <div className="w-full h-full relative">
                                <CarouselContent item={item} index={index} />
                            </div>
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
                            className="p-2"
                            aria-label={`Go to slide ${index + 1}`}
                        >
                            <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${index === currentIndex
                                ? 'bg-white w-8 md:w-12'
                                : 'bg-white/50 hover:bg-white/75'
                                }`}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
