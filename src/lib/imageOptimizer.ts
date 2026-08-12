/**
 * Image Optimization Utility
 * 
 * Uses HTML Canvas to resize and compress images before upload.
 */

interface ImageOptimizationOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0.0 to 1.0
    type?: 'image/jpeg' | 'image/webp' | 'image/png';
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    type: 'image/jpeg'
};

/**
 * Compresses an image file.
 * 
 * @param file The original File object
 * @param options Optimization options (maxWidth, maxHeight, quality, type)
 * @returns Promise resolving to a new, optimized File object
 */
export async function compressImage(
    file: File,
    options: ImageOptimizationOptions = {}
): Promise<File> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Skip optimization if not an image
    if (!file.type.startsWith('image/')) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        reader.onerror = (e) => reject(e);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > opts.maxWidth! || height > opts.maxHeight!) {
                const ratio = Math.min(
                    opts.maxWidth! / width,
                    opts.maxHeight! / height
                );
                width *= ratio;
                height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Draw image to canvas
            ctx.drawImage(img, 0, 0, width, height);

            // Convert canvas to Blob/File
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Image compression failed'));
                        return;
                    }

                    // Create new File object
                    const newFile = new File([blob], file.name, {
                        type: opts.type,
                        lastModified: Date.now()
                    });

                    // Only return optimized file if it's smaller than original
                    if (newFile.size < file.size) {
                        resolve(newFile);
                    } else {
                        resolve(file);
                    }
                },
                opts.type,
                opts.quality
            );
        };

        reader.readAsDataURL(file);
    });
}
