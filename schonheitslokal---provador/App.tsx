
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Layout, Image as ImageIcon, Wand2, Plus, Trash2, Download, Sparkles, User, Maximize, Check, Menu, X, Camera, Scissors, ArrowRight, Palette, Upload } from 'lucide-react';
import { Button } from './components/Button';
import { FileUploader } from './components/FileUploader';
import { generateMockup, generateAsset } from './services/geminiService';
import { Asset, GeneratedMockup, AppView, LoadingState, PlacedLayer } from './types';
import { useApiKey } from './hooks/useApiKey';
import ApiKeyDialog from './components/ApiKeyDialog';

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
      // Robust check for clickable elements to trigger hover animation
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

  // Hide cursor until mouse moves to prevent initial jump
  if (!isVisible) return null;

  return (
    <>
      <style>{`
        html, body, * {
          cursor: none !important;
        }
      `}</style>
      <div 
        className="fixed top-0 left-0 pointer-events-none z-[10000] will-change-transform"
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`
        }}
      >
        {/* 
           Container for animation.
           Nozzle tip corresponds to (0,0) for accurate clicking.
        */}
        <div className={`
           relative transition-transform duration-200 ease-out origin-top-left
           ${isHovering ? 'scale-110 -rotate-12' : 'scale-100 rotate-0'}
        `}>
           {/* SVG Hairdryer */}
           <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ overflow: 'visible' }}>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                 <feDropShadow dx="2" dy="4" stdDeviation="2" floodColor="#000" floodOpacity="0.2" />
              </filter>
              <g filter="url(#shadow)">
                 {/* 
                    Group rotated -30 deg around (0,0) so the nozzle aligns with pointer direction.
                    (0,0) is the hot spot.
                 */}
                 <g transform="rotate(-30 0 0)">
                    {/* Nozzle (Tip at 0,0) */}
                    <rect x="0" y="-4" width="8" height="8" rx="1" fill="#18181b" />
                    
                    {/* Body */}
                    <path d="M8 -6 L32 -6 C36 -6 38 -4 38 0 C38 4 36 6 32 6 L8 6 Z" fill="#c55b9f" stroke="#be4b94" strokeWidth="0.5"/>
                    
                    {/* Shine */}
                    <path d="M10 -3 L30 -3" stroke="white" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round"/>

                    {/* Handle */}
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
  const [phase, setPhase] = useState<'init' | 'logo' | 'text' | 'finish'>('init');

  useEffect(() => {
    const schedule = [
      { t: 100, fn: () => setPhase('logo') },
      { t: 1500, fn: () => setPhase('text') },
      { t: 4000, fn: () => onComplete() }
    ];

    const timers = schedule.map(s => setTimeout(s.fn, s.t));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center overflow-hidden font-sans select-none">
      {/* Light Elegant Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-zinc-100"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Title Animation */}
        <div className={`transition-all duration-1000 ease-out transform
           ${phase === 'init' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}
        `}>
           <div className="text-center">
                <h1 className="font-black tracking-tighter text-[#7080a5] leading-none uppercase font-sans text-4xl md:text-5xl" style={{ fontFamily: 'Impact, sans-serif' }}>
                    SCHÖNHEITS <span className="">LOKAL</span>
                </h1>
                <p className={`text-[#7080a5] font-serif italic text-3xl mt-1 transition-opacity duration-1000 ${phase === 'text' || phase === 'finish' ? 'opacity-100' : 'opacity-0'}`}>Silvia Paz</p>
           </div>
        </div>

        {/* Loading Text */}
        <div className={`mt-12 text-center transition-all duration-1000 ${phase === 'text' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
           <p className="text-[#7080a5] text-sm tracking-[0.3em] uppercase font-medium animate-pulse">Virtuelle Anprobe KI</p>
        </div>
      </div>
    </div>
  );
};

// --- UI Components ---

const NavButton = ({ icon, label, active, onClick, number }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, number?: number }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group
      ${active ? 'bg-[#c55b9f]/10 text-[#c55b9f] border-l-2 border-[#c55b9f]' : 'text-zinc-500 hover:bg-[#c55b9f]/5 hover:text-[#c55b9f]'}`}
  >
    <span className={`${active ? 'text-[#c55b9f]' : 'text-zinc-400 group-hover:text-[#c55b9f]'} transition-colors`}>
      {icon}
    </span>
    <span className="font-medium text-sm tracking-wide flex-1 text-left">{label}</span>
    {number && (
      <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded min-w-[1.5rem] text-center transition-colors ${active ? 'bg-[#c55b9f] text-white' : 'bg-zinc-200 text-zinc-500'}`}>
        {number}
      </span>
    )}
  </button>
);

const WorkflowStepper = ({ currentView, onViewChange }: { currentView: AppView, onViewChange: (view: AppView) => void }) => {
  const steps = [
    { id: 'assets', label: 'Foto hochladen', number: 1 },
    { id: 'studio', label: 'Stil wählen', number: 2 },
    { id: 'gallery', label: 'Ergebnis ansehen', number: 3 },
  ];

  const viewOrder = ['assets', 'studio', 'gallery'];
  const currentIndex = viewOrder.indexOf(currentView);
  const progress = Math.max(0, (currentIndex / (steps.length - 1)) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto mb-12 hidden md:block animate-fade-in px-4">
      <div className="relative">
         {/* Background Track */}
         <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-200 -translate-y-1/2 rounded-full"></div>
         
         {/* Active Progress Bar */}
         <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-[#7c72b0] to-[#c55b9f] -translate-y-1/2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
         ></div>

         <div className="relative flex justify-between w-full">
            {steps.map((step, index) => {
               const isCompleted = currentIndex > index;
               const isCurrent = currentIndex === index;
               
               return (
                  <button 
                    key={step.id}
                    onClick={() => onViewChange(step.id as AppView)}
                    className={`group flex flex-col items-center focus:outline-none relative z-10 cursor-pointer clickable`}
                  >
                     <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 bg-white
                        ${isCurrent 
                           ? 'border-[#c55b9f] text-[#c55b9f] shadow-[0_0_20px_rgba(197,91,159,0.3)] scale-110' 
                           : isCompleted 
                              ? 'border-[#c55b9f] bg-[#c55b9f] text-white' 
                              : 'border-zinc-200 text-zinc-400 group-hover:border-zinc-300 group-hover:text-zinc-500'}
                     `}>
                        {isCompleted ? (
                           <Check size={18} strokeWidth={3} />
                        ) : (
                           <span className="text-sm font-bold font-mono">{step.number}</span>
                        )}
                     </div>
                     <span className={`
                        absolute top-14 text-xs font-medium tracking-wider transition-all duration-300 whitespace-nowrap
                        ${isCurrent ? 'text-[#c55b9f] opacity-100 transform translate-y-0' : isCompleted ? 'text-zinc-400 opacity-80' : 'text-zinc-400 opacity-60 group-hover:opacity-100'}
                     `}>
                        {step.label}
                     </span>
                  </button>
               )
            })}
         </div>
      </div>
    </div>
  )
};

// Helper component for Asset Sections
const AssetSection = ({ 
  title, 
  icon, 
  type, 
  assets, 
  onAdd, 
  onRemove,
  validateApiKey,
  onApiError
}: { 
  title: string, 
  icon: React.ReactNode, 
  type: 'client-photo' | 'style-reference', 
  assets: Asset[], 
  onAdd: (a: Asset) => void, 
  onRemove: (id: string) => void,
  validateApiKey: () => Promise<boolean>,
  onApiError: (e: any) => void
}) => {
  const [mode, setMode] = useState<'upload' | 'generate'>('upload');
  const [genPrompt, setGenPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!genPrompt) return;
    
    // Validate API key first
    if (!(await validateApiKey())) return;

    setIsGenerating(true);
    try {
      const b64 = await generateAsset(genPrompt, type);
      onAdd({
        id: Math.random().toString(36).substring(7),
        type,
        name: `AI Generated ${type}`,
        data: b64,
        mimeType: 'image/png'
      });
      setGenPrompt('');
    } catch (e: any) {
      console.error(e);
      onApiError(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const placeholderText = type === 'client-photo' 
    ? "Beschreiben Sie eine Person (z.B. 'Frau mit schulterlangem braunem Haar')..." 
    : "Beschreiben Sie einen Stil (z.B. 'Kurzer Pixie-Cut blond', 'Rotes Nail-Art-Design')...";

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col bg-white/50 border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#7080a5]">{icon} {title}</h2>
          <span className="text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-500">{assets.length} Elemente</span>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 overflow-y-auto max-h-[400px] pr-2">
          {assets.map(asset => (
            <div key={asset.id} className="relative group aspect-[3/4] bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
                <img src={asset.data} className="w-full h-full object-cover" alt={asset.name} />
                <button onClick={() => onRemove(asset.id)} className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={12} />
                </button>
            </div>
          ))}
          {assets.length === 0 && (
            <div className="col-span-2 sm:col-span-3 flex flex-col items-center justify-center h-32 text-zinc-400 border border-dashed border-zinc-300 rounded-lg">
              <p className="text-sm">Noch keine Elemente</p>
            </div>
          )}
      </div>

      {/* Creation Area */}
      <div className="mt-auto pt-4 border-t border-zinc-200">
        <div className="flex gap-4 mb-4">
           <button 
             onClick={() => setMode('upload')}
             className={`text-sm font-medium pb-1 border-b-2 transition-colors ${mode === 'upload' ? 'border-[#c55b9f] text-[#c55b9f]' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
           >
             Foto hochladen
           </button>
           <button 
             onClick={() => setMode('generate')}
             className={`text-sm font-medium pb-1 border-b-2 transition-colors ${mode === 'generate' ? 'border-[#c55b9f] text-[#c55b9f]' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
           >
             KI-Stockfoto
           </button>
        </div>

        {mode === 'upload' ? (
           <FileUploader label={`${type === 'client-photo' ? 'Foto' : 'Referenz'} hochladen`} onFileSelect={(f) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                onAdd({
                  id: Math.random().toString(36).substring(7),
                  type,
                  name: f.name,
                  data: e.target?.result as string,
                  mimeType: f.type
                });
              };
              reader.readAsDataURL(f);
           }} />
        ) : (
           <div className="space-y-3">
              <textarea 
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder={placeholderText}
                className="w-full bg-white border border-zinc-300 rounded-lg p-3 text-base text-zinc-800 focus:ring-2 focus:ring-[#c55b9f] resize-none h-24 placeholder:text-zinc-400 outline-none"
              />
              <Button 
                onClick={handleGenerate} 
                isLoading={isGenerating} 
                disabled={!genPrompt}
                className="w-full bg-[#c55b9f] hover:bg-[#a44a83] shadow-lg shadow-[#c55b9f]/10"
                icon={<Sparkles size={16} />}
              >
                {type === 'client-photo' ? 'Modell' : 'Stil'} generieren
              </Button>
           </div>
        )}
      </div>
    </div>
  );
};


// --- App Component ---

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState<AppView>('dashboard');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [generatedMockups, setGeneratedMockups] = useState<GeneratedMockup[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedMockup, setSelectedMockup] = useState<GeneratedMockup | null>(null); // State for lightbox

  // Form states for generation
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [placedLogos, setPlacedLogos] = useState<PlacedLayer[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState<LoadingState>({ isGenerating: false, message: '' });

  // API Key Management
  const { showApiKeyDialog, setShowApiKeyDialog, validateApiKey, handleApiKeyDialogContinue } = useApiKey();

  // API Error Handling Logic
  const handleApiError = (error: any) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    let shouldOpenDialog = false;

    // Check for specific Server-side Error Signatures
    if (errorMessage.includes('Requested entity was not found')) {
      console.warn('Model not found - likely a billing/key issue');
      shouldOpenDialog = true;
    } else if (
      errorMessage.includes('API_KEY_INVALID') ||
      errorMessage.includes('API key not valid') ||
      errorMessage.includes('PERMISSION_DENIED') || 
      errorMessage.includes('403')
    ) {
      console.warn('Invalid API Key or Permissions');
      shouldOpenDialog = true;
    }

    if (shouldOpenDialog) {
      setShowApiKeyDialog(true);
    } else {
      alert(`Operation fehlgeschlagen: ${errorMessage}`);
    }
  };

  // State for Dragging
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedItem, setDraggedItem] = useState<{ uid: string, startX: number, startY: number, initX: number, initY: number } | null>(null);

  // Demo assets on load
  useEffect(() => {
    // Wait for intro
  }, []);

  // -- LOGO PLACEMENT HANDLERS --

  const addLogoToCanvas = (assetId: string) => {
    // Add new instance of logo to canvas at center
    const newLayer: PlacedLayer = {
      uid: Math.random().toString(36).substr(2, 9),
      assetId,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0
    };
    setPlacedLogos(prev => [...prev, newLayer]);
  };

  const removeLogoFromCanvas = (uid: string, e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    setPlacedLogos(prev => prev.filter(l => l.uid !== uid));
  };

  const handleStart = (clientX: number, clientY: number, layer: PlacedLayer) => {
    setDraggedItem({
      uid: layer.uid,
      startX: clientX,
      startY: clientY,
      initX: layer.x,
      initY: layer.y
    });
  };

  const handleMouseDown = (e: React.MouseEvent, layer: PlacedLayer) => {
    e.preventDefault();
    e.stopPropagation();
    handleStart(e.clientX, e.clientY, layer);
  };

  const handleTouchStart = (e: React.TouchEvent, layer: PlacedLayer) => {
    e.stopPropagation(); // Prevent scrolling initiation if possible
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY, layer);
  };

  const handleWheel = (e: React.WheelEvent, layerId: string) => {
     e.stopPropagation();
     // Simple scale on scroll
     const delta = e.deltaY > 0 ? -0.1 : 0.1;
     setPlacedLogos(prev => prev.map(l => {
        if (l.uid !== layerId) return l;
        const newScale = Math.max(0.2, Math.min(3.0, l.scale + delta));
        return { ...l, scale: newScale };
     }));
  };

  // Global mouse/touch move for dragging
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!draggedItem || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = clientX - draggedItem.startX;
      const deltaY = clientY - draggedItem.startY;

      // Convert pixels to percentage
      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;

      setPlacedLogos(prev => prev.map(l => {
        if (l.uid !== draggedItem.uid) return l;
        return {
          ...l,
          x: Math.max(0, Math.min(100, draggedItem.initX + deltaXPercent)),
          y: Math.max(0, Math.min(100, draggedItem.initY + deltaYPercent))
        };
      }));
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      setDraggedItem(null);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (draggedItem) {
         e.preventDefault(); // Prevent scrolling while dragging
         handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      setDraggedItem(null);
    };

    if (draggedItem) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false }); // passive: false needed for preventDefault
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [draggedItem]);


  const handleGenerate = async () => {
    // Check validation
    if (!selectedProductId) {
        alert("Bitte wählen Sie zuerst ein Kundenfoto aus.");
        return;
    }

    // Relaxed validation: if user has text OR logos, it's fine.
    // But if neither, we prompt.
    if (!prompt && placedLogos.length === 0) {
        alert("Bitte beschreiben Sie den gewünschten Look oder fügen Sie eine Stil-Referenz hinzu.");
        return;
    }

    const product = assets.find(a => a.id === selectedProductId);
    if (!product) {
        alert("Bitte wählen Sie zuerst ein Kundenfoto aus.");
        setSelectedProductId(null);
        return;
    }

    // Prepare all layers
    const layers = placedLogos.map(layer => {
        const asset = assets.find(a => a.id === layer.assetId);
        return asset ? { asset, placement: layer } : null;
    }).filter(Boolean) as { asset: Asset, placement: PlacedLayer }[];

    // Check API Key before proceeding
    if (!(await validateApiKey())) {
      return;
    }

    const currentPrompt = prompt;

    setLoading({ isGenerating: true, message: 'Simuliere Prozedur...' });
    try {
      const resultImage = await generateMockup(product, layers, currentPrompt);
      
      const newMockup: GeneratedMockup = {
        id: Math.random().toString(36).substring(7),
        imageUrl: resultImage,
        prompt: currentPrompt,
        createdAt: Date.now(),
        layers: placedLogos, // Save the layout
        productId: selectedProductId
      };
      
      setGeneratedMockups(prev => [newMockup, ...prev]);
      setView('gallery');
    } catch (e: any) {
      console.error(e);
      handleApiError(e);
    } finally {
      setLoading({ isGenerating: false, message: '' });
    }
  };

  if (showIntro) {
    return <IntroSequence onComplete={() => setShowIntro(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-zinc-800 font-sans flex overflow-hidden relative cursor-default">
      
      {/* Hairdryer Custom Cursor */}
      <HairdryerCursor />

      {/* API Key Dialog */}
      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />
      )}

      {/* Sidebar Navigation (Desktop) */}
      <aside className="w-72 border-r border-zinc-200 bg-white hidden md:flex flex-col">
        <div className="h-24 border-b border-zinc-100 flex items-center justify-center px-6 py-4">
           {/* Sidebar Title (No Logo) */}
           <div className="text-center">
                <h1 className="font-black tracking-tighter text-[#7080a5] leading-none uppercase font-sans text-xl" style={{ fontFamily: 'Impact, sans-serif' }}>
                    SCHÖNHEITS <span className="">LOKAL</span>
                </h1>
                <p className="text-[#7080a5] font-serif italic text-xs">Silvia Paz</p>
           </div>
        </div>

        <div className="p-4 space-y-2 flex-1 mt-4">
          <NavButton 
            icon={<Layout size={18} />} 
            label="Startseite" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <NavButton 
            icon={<User size={18} />} 
            label="Kunden & Styles" 
            active={view === 'assets'} 
            number={1}
            onClick={() => setView('assets')} 
          />
          <NavButton 
            icon={<Wand2 size={18} />} 
            label="Virtueller Spiegel" 
            active={view === 'studio'} 
            number={2}
            onClick={() => setView('studio')} 
          />
          <NavButton 
            icon={<ImageIcon size={18} />} 
            label="Galerie" 
            active={view === 'gallery'} 
            number={3}
            onClick={() => setView('gallery')} 
          />
        </div>

        <div className="p-4 border-t border-zinc-100">
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100 text-center">
             <Button size="sm" variant="outline" className="w-full text-xs border-zinc-300 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 hover:border-[#c55b9f]">Nur für Personal</Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex items-center">
           <div className="text-left">
                <h1 className="font-black tracking-tighter text-[#7080a5] leading-none uppercase font-sans text-lg" style={{ fontFamily: 'Impact, sans-serif' }}>
                    SCHÖNHEITS <span className="">LOKAL</span>
                </h1>
           </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-600 hover:text-zinc-900 clickable">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-white/95 backdrop-blur-xl p-4 animate-fade-in flex flex-col">
          <div className="space-y-2">
            <NavButton 
              icon={<Layout size={18} />} 
              label="Startseite" 
              active={view === 'dashboard'} 
              onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }} 
            />
            <NavButton 
              icon={<User size={18} />} 
              label="Kunden & Styles" 
              active={view === 'assets'} 
              number={1}
              onClick={() => { setView('assets'); setIsMobileMenuOpen(false); }} 
            />
            <NavButton 
              icon={<Wand2 size={18} />} 
              label="Virtueller Spiegel" 
              active={view === 'studio'} 
              number={2}
              onClick={() => { setView('studio'); setIsMobileMenuOpen(false); }} 
            />
            <NavButton 
              icon={<ImageIcon size={18} />} 
              label="Galerie" 
              active={view === 'gallery'} 
              number={3}
              onClick={() => { setView('gallery'); setIsMobileMenuOpen(false); }} 
            />
          </div>
          
          <div className="mt-auto pb-8 border-t border-zinc-100 pt-6">
              <p className="text-xs text-zinc-400 text-center mb-4">Schönheitslokal Provador v1.0</p>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedMockup && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in clickable" 
          onClick={() => setSelectedMockup(null)}
        >
          <div className="relative max-w-6xl w-full h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button 
              onClick={() => setSelectedMockup(null)}
              className="absolute top-4 right-4 md:top-0 md:-right-12 p-2 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 transition-colors z-50 border border-zinc-700 clickable"
            >
              <X size={24} />
            </button>

            {/* Image Container */}
            <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden rounded-lg">
              <img 
                src={selectedMockup.imageUrl} 
                alt="Full size preview" 
                className="max-w-full max-h-[85vh] object-contain shadow-2xl" 
              />
            </div>

            {/* Caption / Actions */}
            <div className="mt-4 bg-white border border-zinc-200 px-6 py-3 rounded-full flex items-center gap-4 shadow-lg">
               <p className="text-sm text-zinc-600 max-w-[200px] md:max-w-md truncate">
                 {selectedMockup.prompt || "Generierter Look"}
               </p>
               <div className="h-4 w-px bg-zinc-300"></div>
               <a 
                 href={selectedMockup.imageUrl} 
                 download={`look-${selectedMockup.id}.png`}
                 className="text-[#c55b9f] hover:text-[#a44a83] text-sm font-medium flex items-center gap-2 clickable"
               >
                 <Download size={16} />
                 Herunterladen
               </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pt-16 md:pt-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-8">
           <div className="text-sm text-zinc-500 breadcrumbs">
              <span className="opacity-50">Salon</span> 
              <span className="mx-2">/</span> 
              <span className="text-[#7080a5] font-medium capitalize">{view === 'assets' ? 'Kunden' : view === 'studio' ? 'Spiegel' : view === 'dashboard' ? 'Startseite' : view}</span>
           </div>
           <div className="flex items-center gap-4">
              <Button size="sm" variant="ghost" className="text-[#c55b9f] bg-[#c55b9f]/10 hover:bg-[#c55b9f]/20 clickable" icon={<Sparkles size={16}/>}>KI-Stylist Aktiv</Button>
           </div>
        </div>

        <div className="max-w-6xl mx-auto p-6 md:p-12">
           
           {/* --- DASHBOARD VIEW --- */}
           {view === 'dashboard' && (
              <div className="animate-fade-in space-y-8">
                 <div className="text-center py-12">
                    <h1 className="text-4xl md:text-6xl font-serif mb-6 text-[#7080a5] leading-tight">
                       Visualisieren Sie Ihren <br/>
                       <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c72b0] to-[#c55b9f]">Perfekten Look</span>
                    </h1>
                    <p className="text-zinc-500 text-lg max-w-2xl mx-auto mb-10">
                       Laden Sie Ihr Foto hoch und sehen Sie, wie verschiedene Frisuren, Farben und Make-up an Ihnen aussehen werden, bevor die Behandlung beginnt.
                    </p>
                    <Button size="lg" onClick={() => setView('assets')} className="bg-[#c55b9f] hover:bg-[#a44a83] shadow-xl shadow-[#c55b9f]/10 text-white clickable" icon={<ArrowRight size={20} />}>
                       Transformation starten
                    </Button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                       { icon: <Camera className="text-[#c55b9f]" />, title: 'Foto hochladen', desc: 'Selfie oder Kundenfoto aufnehmen.' },
                       { icon: <Scissors className="text-[#c55b9f]" />, title: 'Behandlung wählen', desc: 'Stile auswählen oder Wunsch-Look beschreiben.' },
                       { icon: <Sparkles className="text-[#7080a5]" />, title: 'KI-Vorschau', desc: 'Realistisches Ergebnis sofort sehen.' }
                    ].map((feat, i) => (
                       <div key={i} className="p-6 rounded-2xl bg-white border border-zinc-200 hover:border-[#c55b9f]/30 transition-colors shadow-sm">
                          <div className="mb-4 p-3 bg-zinc-50 w-fit rounded-lg">{feat.icon}</div>
                          <h3 className="text-xl font-bold mb-2 text-zinc-700">{feat.title}</h3>
                          <p className="text-zinc-500">{feat.desc}</p>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* --- ASSETS VIEW --- */}
           {view === 'assets' && (
              <div className="animate-fade-in">
                <WorkflowStepper currentView="assets" onViewChange={setView} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Products Section */}
                  <AssetSection 
                    title="Kundenfotos" 
                    icon={<User size={20} />}
                    type="client-photo"
                    assets={assets.filter(a => a.type === 'client-photo')}
                    onAdd={(a) => setAssets(prev => [...prev, a])}
                    onRemove={(id) => setAssets(prev => prev.filter(a => a.id !== id))}
                    validateApiKey={validateApiKey}
                    onApiError={handleApiError}
                  />

                  {/* Logos Section */}
                  <AssetSection 
                    title="Stil-Referenzen" 
                    icon={<Palette size={20} />}
                    type="style-reference"
                    assets={assets.filter(a => a.type === 'style-reference')}
                    onAdd={(a) => setAssets(prev => [...prev, a])}
                    onRemove={(id) => setAssets(prev => prev.filter(a => a.id !== id))}
                    validateApiKey={validateApiKey}
                    onApiError={handleApiError}
                  />
                </div>

                <div className="mt-8 flex justify-end">
                   <Button onClick={() => setView('studio')} disabled={assets.filter(a => a.type === 'client-photo').length === 0} icon={<ArrowRight size={16} />} className="bg-[#c55b9f] hover:bg-[#a44a83] clickable">
                      Zum Spiegel
                   </Button>
                </div>
              </div>
           )}

           {/* --- STUDIO VIEW --- */}
           {view === 'studio' && (
             <div className="animate-fade-in h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)] flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
                {/* Left Controls (Bottom on Mobile) */}
                <div className="w-full lg:w-80 flex flex-col gap-6 glass-panel p-6 rounded-2xl overflow-y-auto flex-1 lg:flex-none bg-white border-zinc-200 shadow-sm">
                   <div>
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">1. Kunde wählen</h3>
                      <div className="grid grid-cols-3 gap-2">
                         {assets.filter(a => a.type === 'client-photo').map(a => (
                            <div 
                               key={a.id} 
                               onClick={() => setSelectedProductId(selectedProductId === a.id ? null : a.id)}
                               className={`aspect-square rounded-lg border-2 cursor-pointer clickable p-1 transition-all object-cover overflow-hidden ${selectedProductId === a.id ? 'border-[#c55b9f] bg-[#c55b9f]/10' : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'}`}
                            >
                               <img src={a.data} className="w-full h-full object-cover rounded" alt={a.name} />
                            </div>
                         ))}
                         {assets.filter(a => a.type === 'client-photo').length === 0 && <p className="text-xs text-zinc-400 col-span-3">Keine Fotos hochgeladen</p>}
                      </div>
                   </div>

                   <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">2. Stil-Ref hinzufügen</h3>
                        {placedLogos.length > 0 && (
                            <span className="text-xs text-[#c55b9f] font-medium">{placedLogos.length} aktiv</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mb-2">Klicken Sie auf Referenzen, um sie hinzuzufügen.</p>
                      <div className="grid grid-cols-3 gap-2">
                         {assets.filter(a => a.type === 'style-reference').map(a => (
                            <div 
                               key={a.id} 
                               onClick={() => addLogoToCanvas(a.id)}
                               className={`relative aspect-square rounded-lg border-2 cursor-pointer clickable p-1 transition-all border-zinc-200 hover:border-zinc-300 bg-zinc-50 overflow-hidden`}
                            >
                               <img src={a.data} className="w-full h-full object-cover rounded" alt={a.name} />
                               {/* Count badge */}
                               {placedLogos.filter(l => l.assetId === a.id).length > 0 && (
                                   <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#c55b9f] rounded-full flex items-center justify-center text-[10px] text-white font-bold border border-white shadow-sm">
                                       {placedLogos.filter(l => l.assetId === a.id).length}
                                   </div>
                               )}
                            </div>
                         ))}
                         {assets.filter(a => a.type === 'style-reference').length === 0 && <p className="text-xs text-zinc-400 col-span-3">Keine Stile hochgeladen</p>}
                      </div>
                   </div>

                   <div>
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">3. Behandlung</h3>
                      <textarea 
                         className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-base text-zinc-800 focus:ring-2 focus:ring-[#c55b9f] focus:outline-none resize-none h-24 clickable"
                         placeholder="Beschreiben Sie die Prozedur (z.B. 'Kurzer blonder Bob', 'Roter Lippenstift und Smokey Eyes')..."
                         value={prompt}
                         onChange={(e) => setPrompt(e.target.value)}
                      />
                   </div>

                   <Button 
                      onClick={handleGenerate} 
                      isLoading={loading.isGenerating} 
                      disabled={loading.isGenerating} 
                      size="lg" 
                      className="mt-auto bg-[#c55b9f] hover:bg-[#a44a83] text-white shadow-lg shadow-[#c55b9f]/20 clickable"
                      icon={<Wand2 size={18} />}
                   >
                      Look simulieren
                   </Button>
                </div>

                {/* Right Preview - Canvas (Top on Mobile) */}
                <div className="h-[45vh] lg:h-auto lg:flex-1 glass-panel rounded-2xl flex items-center justify-center bg-zinc-100 relative overflow-hidden select-none flex-shrink-0 border border-zinc-200">
                   {loading.isGenerating && (
                      <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                         <div className="w-16 h-16 border-4 border-[#c55b9f] border-t-transparent rounded-full animate-spin mb-4"></div>
                         <p className="text-[#c55b9f] font-mono animate-pulse">{loading.message}</p>
                      </div>
                   )}
                   
                   {selectedProductId ? (
                      <div 
                         ref={canvasRef}
                         className="relative w-full h-full max-h-[600px] p-4 flex items-center justify-center"
                      >
                         {/* Product Base */}
                         <img 
                            src={assets.find(a => a.id === selectedProductId)?.data} 
                            className="w-full h-full object-contain drop-shadow-xl pointer-events-none select-none" 
                            alt="Preview" 
                            draggable={false}
                         />

                         {/* Overlay Layers */}
                         {placedLogos.map((layer) => {
                            const logoAsset = assets.find(a => a.id === layer.assetId);
                            if (!logoAsset) return null;
                            const isDraggingThis = draggedItem?.uid === layer.uid;

                            return (
                               <div
                                  key={layer.uid}
                                  className={`absolute cursor-move group clickable ${isDraggingThis ? 'z-50 opacity-80' : 'z-10'}`}
                                  style={{
                                     left: `${layer.x}%`,
                                     top: `${layer.y}%`,
                                     transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                                     // For beauty refs, keep them small like "stickers" or reference chips
                                     width: '20%', 
                                     aspectRatio: '1/1'
                                  }}
                                  onMouseDown={(e) => handleMouseDown(e, layer)}
                                  onTouchStart={(e) => handleTouchStart(e, layer)}
                                  onWheel={(e) => handleWheel(e, layer.uid)}
                               >
                                  {/* Selection Border */}
                                  <div className="absolute -inset-2 border-2 border-[#c55b9f]/0 group-hover:border-[#c55b9f]/50 rounded-lg transition-all pointer-events-none"></div>
                                  
                                  {/* Remove Button */}
                                  <button 
                                    onClick={(e) => removeLogoFromCanvas(layer.uid, e)}
                                    onTouchEnd={(e) => removeLogoFromCanvas(layer.uid, e)}
                                    className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg z-50 clickable"
                                    title="Entfernen"
                                  >
                                    <X size={12} />
                                  </button>
                                  
                                  <div className="w-full h-full rounded-lg overflow-hidden border-2 border-white shadow-xl bg-white">
                                    <img 
                                        src={logoAsset.data} 
                                        className="w-full h-full object-cover pointer-events-none"
                                        draggable={false}
                                        alt="layer"
                                    />
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   ) : (
                      <div className="text-center text-zinc-400">
                         <User size={64} className="mx-auto mb-4 opacity-20" />
                         <p>Wähle ein Kundenfoto um zu beginnen</p>
                      </div>
                   )}
                </div>
             </div>
           )}

           {/* --- GALLERY VIEW --- */}
           {view === 'gallery' && (
              <div className="animate-fade-in">
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-[#7080a5]">Generierte Looks</h2>
                    <Button variant="outline" onClick={() => setView('studio')} icon={<Plus size={16}/>} className="clickable">Neue Simulation</Button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generatedMockups.map(mockup => (
                       <div key={mockup.id} className="group glass-panel rounded-xl overflow-hidden bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="aspect-square bg-zinc-100 relative overflow-hidden">
                             <img src={mockup.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Mockup" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="secondary" 
                                  icon={<Maximize size={16}/>}
                                  onClick={() => setSelectedMockup(mockup)}
                                  className="clickable"
                                >
                                  Ansehen
                                </Button>
                                <a href={mockup.imageUrl} download={`look-${mockup.id}.png`} className="clickable">
                                  <Button size="sm" variant="primary" className="bg-[#c55b9f] hover:bg-[#a44a83]" icon={<Download size={16}/>}>Speichern</Button>
                                </a>
                             </div>
                          </div>
                          <div className="p-4">
                             <p className="text-xs text-zinc-400 mb-1">{new Date(mockup.createdAt).toLocaleDateString()}</p>
                             <p className="text-sm text-zinc-700 line-clamp-2 font-medium">{mockup.prompt || "Automatisch generierter Stil"}</p>
                             {mockup.layers && mockup.layers.length > 0 && (
                                 <div className="mt-2 flex gap-1">
                                     <span className="text-xs px-1.5 py-0.5 bg-[#c55b9f]/10 text-[#c55b9f] font-medium rounded">{mockup.layers.length} styles</span>
                                 </div>
                             )}
                          </div>
                       </div>
                    ))}
                    {generatedMockups.length === 0 && (
                       <div className="col-span-full py-20 text-center glass-panel rounded-xl bg-white/50 border-dashed border-zinc-300">
                          <ImageIcon size={48} className="mx-auto mb-4 text-zinc-300" />
                          <h3 className="text-lg font-medium text-zinc-500">Noch keine Looks</h3>
                          <p className="text-zinc-400 mb-6">Erstelle deine erste Simulation im Spiegel</p>
                          <Button onClick={() => setView('studio')} className="bg-[#c55b9f] hover:bg-[#a44a83] clickable">Zum Spiegel</Button>
                       </div>
                    )}
                 </div>
              </div>
           )}
        </div>
      </main>
    </div>
  );
}
