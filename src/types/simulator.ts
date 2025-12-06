
export interface Asset {
    id: string;
    type: 'client-photo' | 'style-reference';
    name: string;
    data: string; // Base64
    mimeType: string;
}

export interface PlacedLayer {
    uid: string; // unique instance id
    assetId: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    scale: number; // 1 = 100%
    rotation: number;
}

export interface GeneratedMockup {
    id: string;
    imageUrl: string;
    prompt: string;
    createdAt: number;
    layers?: PlacedLayer[]; // Store layout used
    productId?: string;
}

export type AppView = 'dashboard' | 'assets' | 'studio' | 'gallery' | 'try-on';

export interface LoadingState {
    isGenerating: boolean;
    message: string;
}
