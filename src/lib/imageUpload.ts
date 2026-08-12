import { supabase } from './supabase'
import { compressImage } from './imageOptimizer'

export interface ImageUploadOptions {
    maxSizeMB?: number
    allowedTypes?: string[]
    bucket?: string
    optimize?: boolean // New option to enable/disable optimization
}

const DEFAULT_OPTIONS: ImageUploadOptions = {
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    bucket: 'carousel-images',
    optimize: true // Enable optimization by default
}

export async function uploadImage(
    file: File,
    options: ImageUploadOptions = {}
): Promise<{ url: string; path: string } | null> {
    const opts = { ...DEFAULT_OPTIONS, ...options }

    // Validate file type
    if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de arquivo não permitido. Use: ${opts.allowedTypes.join(', ')}`)
    }

    // Validate file size (check original size first)
    const fileSizeMB = file.size / (1024 * 1024)
    if (opts.maxSizeMB && fileSizeMB > opts.maxSizeMB) {
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${opts.maxSizeMB}MB`)
    }

    try {
        let fileToUpload = file;

        // Optimize image if enabled
        if (opts.optimize) {
            try {
                const compressedFile = await compressImage(file, {
                    maxWidth: 1920,
                    maxHeight: 1080,
                    quality: 0.8,
                    type: 'image/jpeg' // Convert to JPEG for better compression
                });
                fileToUpload = compressedFile;
            } catch (optError) {
                console.warn('Image optimization failed, uploading original file:', optError);
                // Fallback to original file
            }
        }

        // Generate unique filename
        const fileExt = fileToUpload.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(opts.bucket!)
            .upload(filePath, fileToUpload, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('Upload error:', error)
            throw new Error('Erro ao fazer upload da imagem')
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(opts.bucket!)
            .getPublicUrl(data.path)

        return {
            url: publicUrl,
            path: data.path
        }
    } catch (error) {
        console.error('Image upload failed:', error)
        throw error
    }
}

export async function deleteImage(path: string, bucket: string = 'carousel-images'): Promise<boolean> {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path])

        if (error) {
            console.error('Delete error:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Image deletion failed:', error)
        return false
    }
}

export function getImageUrl(path: string, bucket: string = 'carousel-images'): string {
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

    return publicUrl
}
