import { supabase } from './supabase'

export interface ImageUploadOptions {
    maxSizeMB?: number
    allowedTypes?: string[]
    bucket?: string
}

const DEFAULT_OPTIONS: ImageUploadOptions = {
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    bucket: 'carousel-images'
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

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (opts.maxSizeMB && fileSizeMB > opts.maxSizeMB) {
        throw new Error(`Arquivo muito grande. Tamanho máximo: ${opts.maxSizeMB}MB`)
    }

    try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(opts.bucket!)
            .upload(filePath, file, {
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
