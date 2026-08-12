interface CarouselItem {
    id: string
    title: string
    description: string | null
    image_url: string | null
    link_url: string | null
    display_order: number
}

import { optimizeImage } from '@/lib/utils'

export const CarouselContent = ({ item, index = 0 }: { item: CarouselItem, index?: number }) => (
    <>
        {item.image_url ? (
            <>
                {/* Blurred Background Layer (For aspect ratio differences) */}
                <div className="absolute inset-0 bg-pink-50">
                    <img
                        src={`${optimizeImage(item.image_url, 100, 20)}`}
                        alt=""
                        className="w-full h-full object-cover blur-2xl opacity-60 scale-110"
                        loading="lazy"
                    />
                </div>
                {/* Main Image Layer */}
                <img
                    srcSet={`${optimizeImage(item.image_url, 400)} 400w, ${optimizeImage(item.image_url, 800)} 800w, ${optimizeImage(item.image_url, 1200)} 1200w`}
                    sizes="(max-width: 768px) 400px, (max-width: 1200px) 800px, 1200px"
                    src={`${optimizeImage(item.image_url, 1200)}`}
                    alt={item.title || ''}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding="async"
                    className="relative w-full h-full object-contain z-10 drop-shadow-2xl"
                />
            </>
        ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-600"></div>
        )}

        {/* Overlay & Content - Only show if there is content */}
        {(item.title || item.description) && (
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
                </div>
            </>
        )}
    </>
)
