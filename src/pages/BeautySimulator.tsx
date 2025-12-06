
import React, { useState, useEffect } from 'react';
import { Layout, Image as ImageIcon, Wand2, Trash2, Download, Sparkles, User, Check, Menu, X, Camera, Scissors, ArrowRight, Plus, Maximize, Upload } from 'lucide-react';
import { Button } from '@/components/Button';
import { FileUploader } from '@/components/FileUploader';
import { generateMockup, generateAsset } from '@/services/geminiService';
import { Asset, GeneratedMockup, LoadingState, PlacedLayer } from '@/types/simulator';
import { useApiKey } from '@/hooks/useApiKey';
import ApiKeyDialog from '@/components/ApiKeyDialog';

// --- Custom Cursor Component (Pink Hairdryer) ---
const HairdryerCursor = () => {
    const [pos, setPos] = useState({ x: -100, y: -100 });
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            setPos({ x: e.clientX, y: e.clientY });
            if (!isVisible) setIsVisible(true);

            const target = e.target as HTMLElement;
            const computed = window.getComputedStyle(target);
            const isClickable =
                ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
                target.closest('[role="button"]') !== null ||
                target.closest('.clickable') !== null ||
                computed.cursor === 'pointer';

            setIsHovering(isClickable);
        };

        window.addEventListener('mousemove', onMouseMove);
        return () => window.removeEventListener('mousemove', onMouseMove);
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <>
            <style>{`html, body, * { cursor: none !important; }`}</style>
            <div
                className="fixed top-0 left-0 pointer-events-none z-[10000] will-change-transform"
                style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
            >
                <div className={`relative transition-transform duration-200 ease-out origin-top-left ${isHovering ? 'scale-110 -rotate-12' : 'scale-100 rotate-0'}`}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ overflow: 'visible' }}>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="2" dy="4" stdDeviation="2" floodColor="#000" floodOpacity="0.2" />
                        </filter>
                        <g filter="url(#shadow)">
                            <g transform="rotate(-30 0 0)">
                                <rect x="0" y="-4" width="8" height="8" rx="1" fill="#18181b" />
                                <path d="M8 -6 L32 -6 C36 -6 38 -4 38 0 C38 4 36 6 32 6 L8 6 Z" fill="#c55b9f" stroke="#be4b94" strokeWidth="0.5" />
                                <path d="M10 -3 L30 -3" stroke="white" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
                                <path d="M22 4 L20 20 Q20 24 23 24 L25 24 Q28 24 28 20 L26 4" fill="#18181b" />
                            </g>
                        </g>
                    </svg>
                </div>
            </div>
        </>
    );
};

// --- Intro Animation Component ---
const IntroSequence = ({ onComplete }: { onComplete: () => void }) => {
    // TODO: Replace with your actual video URL (local file in public/ or external URL)
    const VIDEO_URL = "video.mp4"; // Placeholder beauty video

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
            <video
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                onEnded={onComplete}
            >
                <source src={VIDEO_URL} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            <button
                onClick={onComplete}
                className="absolute bottom-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full hover:bg-white/20 transition-all text-sm font-medium tracking-wide uppercase z-50"
            >
                Überspringen
            </button>

            <div className="absolute top-8 left-8 z-50">
                <h1 className="font-black tracking-tighter text-white/50 leading-none uppercase font-sans text-xl" style={{ fontFamily: 'Impact, sans-serif' }}>
                    VISUEL <span className="">IA</span>
                </h1>
            </div>
        </div>
    );
};

// --- Main Component ---
export default function BeautySimulator() {
    const [showIntro, setShowIntro] = useState(true);

    // State for Simplified Flow
    const [clientAsset, setClientAsset] = useState<Asset | null>(null);
    const [styleAssets, setStyleAssets] = useState<Asset[]>([]);
    const [generatedMockups, setGeneratedMockups] = useState<GeneratedMockup[]>([]);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState<LoadingState>({ isGenerating: false, message: '' });
    const [selectedMockup, setSelectedMockup] = useState<GeneratedMockup | null>(null);

    const { showApiKeyDialog, setShowApiKeyDialog, validateApiKey, handleApiKeyDialogContinue } = useApiKey();

    const handleApiError = (error: any) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('403')) {
            setShowApiKeyDialog(true);
        } else {
            alert(`Fehler: ${errorMessage}`);
        }
    };

    const handleGenerate = async () => {
        if (!clientAsset) {
            alert("Bitte laden Sie zuerst ein Kundenfoto hoch.");
            return;
        }
        if (styleAssets.length === 0 && !prompt) {
            alert("Bitte fügen Sie mindestens eine Stil-Referenz oder eine Beschreibung hinzu.");
            return;
        }
        if (!(await validateApiKey())) return;

        setLoading({ isGenerating: true, message: 'KI-Stylist arbeitet...' });
        try {
            // Create dummy layers for the API structure (since we removed canvas)
            // We just pass the assets, placement is ignored by the new multimodal prompt logic
            const layers = styleAssets.map(asset => ({
                asset,
                placement: { uid: asset.id, assetId: asset.id, x: 50, y: 50, scale: 1, rotation: 0 } as PlacedLayer
            }));

            const resultImage = await generateMockup(clientAsset, layers, prompt);

            const newMockup: GeneratedMockup = {
                id: Math.random().toString(36).substring(7),
                imageUrl: resultImage,
                prompt: prompt || "KI Transformation",
                createdAt: Date.now(),
                layers: [],
                productId: clientAsset.id
            };

            setGeneratedMockups(prev => [newMockup, ...prev]);
            setSelectedMockup(newMockup); // Auto-open result
        } catch (e: any) {
            console.error(e);
            handleApiError(e);
        } finally {
            setLoading({ isGenerating: false, message: '' });
        }
    };

    const handleFileUpload = (file: File, type: 'client' | 'style') => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const newAsset: Asset = {
                id: Math.random().toString(36).substring(7),
                type: type === 'client' ? 'client-photo' : 'style-reference',
                name: file.name,
                data: e.target?.result as string,
                mimeType: file.type
            };

            if (type === 'client') {
                setClientAsset(newAsset);
            } else {
                setStyleAssets(prev => [...prev, newAsset]);
            }
        };
        reader.readAsDataURL(file);
    };

    if (showIntro) return <IntroSequence onComplete={() => setShowIntro(false)} />;

    return (
        <div className="min-h-screen bg-[#fdfdfd] text-zinc-800 font-sans flex flex-col relative cursor-default">
            <HairdryerCursor />
            {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}

            {/* Header */}
            <header className="h-20 bg-white border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="text-left">
                        <h1 className="font-black tracking-tighter text-[#7080a5] leading-none uppercase font-sans text-2xl" style={{ fontFamily: 'Impact, sans-serif' }}>
                            SCHÖNHEITS <span className="">LOKAL</span>
                        </h1>
                        <p className="text-[#7080a5] font-serif italic text-xs">Silvia Paz</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button size="sm" variant="ghost" className="text-[#c55b9f] bg-[#c55b9f]/10" icon={<Sparkles size={16} />}>
                        Visuel IA Aktiv
                    </Button>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: INPUTS (4 cols) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* 1. Client Photo */}
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <h2 className="text-lg font-bold text-[#7080a5] mb-4 flex items-center gap-2">
                            <User size={20} /> 1. Kunde
                        </h2>
                        {clientAsset ? (
                            <div className="relative group rounded-xl overflow-hidden border-2 border-[#c55b9f]/20 aspect-[3/4]">
                                <img src={clientAsset.data} alt="Client" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setClientAsset(null)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 text-center">
                                    Hauptbild für Bearbeitung
                                </div>
                            </div>
                        ) : (
                            <FileUploader
                                label="Kundenfoto hochladen"
                                onFileSelect={(f) => handleFileUpload(f, 'client')}
                            />
                        )}
                    </div>

                    {/* 2. Style References */}
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <h2 className="text-lg font-bold text-[#7080a5] mb-4 flex items-center gap-2">
                            <Scissors size={20} /> 2. Stil-Referenzen
                        </h2>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {styleAssets.map(asset => (
                                <div key={asset.id} className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-200">
                                    <img src={asset.data} alt="Style" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setStyleAssets(prev => prev.filter(a => a.id !== asset.id))}
                                        className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <div className="aspect-square">
                                <FileUploader
                                    label="+"
                                    onFileSelect={(f) => handleFileUpload(f, 'style')}
                                    mini
                                />
                            </div>
                        </div>
                        <p className="text-xs text-zinc-400">Laden Sie Fotos von Frisuren, Make-up oder Farben hoch, die Sie übertragen möchten.</p>
                    </div>

                </div>

                {/* MIDDLE/RIGHT COLUMN: CONTROLS & RESULT (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* 3. Prompt & Generate */}
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <h2 className="text-lg font-bold text-[#7080a5] mb-4 flex items-center gap-2">
                            <Wand2 size={20} /> 3. Anweisungen & Generieren
                        </h2>
                        <div className="flex gap-4 items-start">
                            <div className="flex-1">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Beschreiben Sie den gewünschten Look (z.B. 'Übertrage die blonde Haarfarbe und den Schnitt aus den Referenzen auf die Kundin')..."
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 focus:ring-2 focus:ring-[#c55b9f] outline-none resize-none h-32"
                                />
                            </div>
                            <Button
                                onClick={handleGenerate}
                                isLoading={loading.isGenerating}
                                disabled={!clientAsset || loading.isGenerating}
                                className="h-32 w-48 bg-[#c55b9f] hover:bg-[#a44a83] shadow-xl shadow-[#c55b9f]/20 text-lg flex-col gap-2"
                            >
                                <Sparkles size={32} />
                                {loading.isGenerating ? 'Arbeitet...' : 'Generieren'}
                            </Button>
                        </div>
                    </div>

                    {/* Results Gallery */}
                    <div className="flex-1 bg-zinc-100 rounded-2xl border border-zinc-200 p-6 min-h-[500px]">
                        <h2 className="text-lg font-bold text-zinc-500 mb-4">Ergebnisse</h2>

                        {generatedMockups.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {generatedMockups.map(mockup => (
                                    <div key={mockup.id} className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedMockup(mockup)}>
                                        <img src={mockup.imageUrl} alt="Result" className="w-full aspect-[3/4] object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <Maximize className="text-white opacity-0 group-hover:opacity-100 drop-shadow-lg" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-300 rounded-xl">
                                <ImageIcon size={64} className="mb-4 opacity-20" />
                                <p>Noch keine Ergebnisse generiert.</p>
                                <p className="text-sm opacity-60">Laden Sie Fotos hoch und klicken Sie auf Generieren.</p>
                            </div>
                        )}
                    </div>
                </div>

            </main>

            {/* Full Screen Preview Modal */}
            {selectedMockup && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedMockup(null)}>
                    <button className="absolute top-4 right-4 text-white/50 hover:text-white p-2"><X size={32} /></button>
                    <div className="max-w-5xl w-full max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <img src={selectedMockup.imageUrl} alt="Full Result" className="max-h-[80vh] object-contain rounded-lg shadow-2xl mb-6" />
                        <div className="flex gap-4">
                            <a href={selectedMockup.imageUrl} download={`look-${selectedMockup.id}.png`} className="bg-[#c55b9f] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#a44a83] transition-colors">
                                <Download size={20} /> Herunterladen
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
