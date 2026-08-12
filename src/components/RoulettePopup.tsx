import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguageStore } from '../stores/languageStore';
import { useBookingStore } from '../stores/bookingStore';
import { supabase } from '../lib/supabase';
import { X, Trophy, Sparkles, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RouletteOption {
  label: string;
  value: number;
  color: string;
  probability: number;
}

interface RouletteSettings {
  options: RouletteOption[];
  cooldown_days?: number;
}

export const RoulettePopup: React.FC = () => {
  const { t } = useLanguageStore();
  const { setRoulettePrize } = useBookingStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<RouletteOption | null>(null);
  const [settings, setSettings] = useState<RouletteSettings | null>(null);
  const [bulbState, setBulbState] = useState(0); // 0 or 1 for alternating bulbs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const animationIdRef = useRef<number>();

  const handleClaimAndBook = () => {
    if (!winner) return;
    // Store the prize in the booking store so the form can apply the discount
    setRoulettePrize(winner.label, winner.value);
    setIsOpen(false);
    window.location.href = '/agendar';
  };

  useEffect(() => {
    const fetchSettings = async () => {
      console.log('RoulettePopup: Fetching settings...');
      const { data, error: settingsError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'roulette_settings')
        .maybeSingle();

      const { data: enabledData, error: enabledError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'roulette_enabled')
        .maybeSingle();

      if (settingsError || enabledError) {
        console.error('RoulettePopup: Database error', { settingsError, enabledError });
        
        // Handle JWT expiration
        if (settingsError?.code === 'PGRST303' || enabledError?.code === 'PGRST303') {
           // Proactively refresh session via auth store
           const { checkSession } = (await import('../stores/authStore')).useAuthStore.getState();
           await checkSession();
        }
      }

      console.log('RoulettePopup: Loaded state', { 
        enabled: enabledData?.value, 
        hasSettings: !!data?.value 
      });

      const urlParams = new URLSearchParams(window.location.search);
      const isTestMode = urlParams.get('testRoulette') === 'true';

      if ((enabledData?.value === 'true' || isTestMode) && data?.value) {
        try {
          const parsed = JSON.parse(data.value) as RouletteSettings;
          setSettings(parsed);

          const cooldownDays = parsed.cooldown_days ?? 1;
          const lastShownStr = localStorage.getItem('roulette_shown_at');
          let alreadyShown = false;
          if (lastShownStr) {
            const lastShownDate = new Date(lastShownStr);
            const diffMs = Date.now() - lastShownDate.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            alreadyShown = diffDays < cooldownDays;
          }

          console.log('RoulettePopup: Show logic', {
            isTestMode,
            lastShownStr,
            alreadyShown,
            cooldownDays
          });

          if (isTestMode || !alreadyShown) {
            console.log('RoulettePopup: Opening in ' + (isTestMode ? '0.5s' : '2s') + '...');
            setTimeout(() => setIsOpen(true), isTestMode ? 500 : 2000);
          } else {
            console.log('RoulettePopup: Still within cooldown, skipping.');
          }
        } catch (e) {
          console.error('RoulettePopup: Error parsing roulette settings', e);
        }
      } else {
        console.log('RoulettePopup: Disabled and not in test mode, or missing settings');
      }
    };

    fetchSettings();
  }, []);

  // Alternating bulbs effect
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setBulbState(prev => (prev === 0 ? 1 : 0));
    }, isSpinning ? 100 : 500);
    return () => clearInterval(interval);
  }, [isOpen, isSpinning]);

  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !settings) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use internal dimensions for logic, CSS handles display
    const width = 320;
    const height = 320;
    const centerX = width / 2;
    const centerY = height / 2;
    const options = settings.options;
    const sliceAngle = (2 * Math.PI) / options.length;
    
    // Dimensions
    const outerBorderRadius = 155;
    const ringRadius = 145;
    const wheelRadius = 130;
    const innerHubRadius = 25;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Outer Golden Ring (3D border)
    const ringGradient = ctx.createRadialGradient(centerX, centerY, ringRadius, centerX, centerY, outerBorderRadius);
    ringGradient.addColorStop(0, '#B8860B'); // Dark goldenrod
    ringGradient.addColorStop(0.5, '#FFD700'); // Gold
    ringGradient.addColorStop(1, '#8B4513'); // SaddleBrown for depth
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerBorderRadius, 0, 2 * Math.PI);
    ctx.fillStyle = ringGradient;
    ctx.fill();
    ctx.strokeStyle = '#4A3728';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Draw Bulbs
    const bulbCount = 24;
    for (let i = 0; i < bulbCount; i++) {
      const angle = (i * (2 * Math.PI)) / bulbCount;
      const bulbX = centerX + (outerBorderRadius - 10) * Math.cos(angle);
      const bulbY = centerY + (outerBorderRadius - 10) * Math.sin(angle);
      
      const isOn = (i % 2 === bulbState);
      
      if (isOn) {
        // Draw a soft glowing aura around the active bulb using a semi-transparent yellow overlay
        // This achieves a beautiful glow effect without expensive GPU canvas shadow blur filters,
        // preventing crashes on older/specific graphics cards like AMD RX 580.
        ctx.save();
        ctx.beginPath();
        ctx.arc(bulbX, bulbY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#FFFACD'; // LemonChiffon
      } else {
        ctx.fillStyle = '#DAA520'; // GoldenRod dim
      }
      ctx.beginPath();
      ctx.arc(bulbX, bulbY, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 3. Draw Main Wheel Slices
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    options.forEach((option, i) => {
      const angle = i * sliceAngle;
      
      // Slice with Gradient for 3D depth
      const sliceGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, wheelRadius);
      sliceGrad.addColorStop(0, option.color);
      sliceGrad.addColorStop(1, adjustColor(option.color, -30));

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, wheelRadius, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = sliceGrad;
      ctx.fill();
      
      // Subtle slice separator
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text with high-contrast outline instead of expensive shadowBlur
      // This solves hardware acceleration TDR GPU locks on specific cards like AMD RX 580/590
      ctx.save();
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.font = 'bold 14px Inter';
      
      // Draw subtle dark stroke border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.strokeText(option.label, wheelRadius - 15, 5);
      
      // Fill text color
      ctx.fillStyle = '#fff';
      ctx.fillText(option.label, wheelRadius - 15, 5);
      ctx.restore();
    });

    // 4. Center Hub (3D Look)
    const hubGrad = ctx.createLinearGradient(-innerHubRadius, -innerHubRadius, innerHubRadius, innerHubRadius);
    hubGrad.addColorStop(0, '#FFD700');
    hubGrad.addColorStop(0.5, '#FFFDE7');
    hubGrad.addColorStop(1, '#B8860B');

    ctx.beginPath();
    ctx.arc(0, 0, innerHubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hub decoration (inner circle)
    ctx.beginPath();
    ctx.arc(0, 0, innerHubRadius - 8, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // 5. Glossy Reflection Overlay
    const glossGrad = ctx.createRadialGradient(centerX - 40, centerY - 40, 20, centerX, centerY, outerBorderRadius);
    glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    glossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerBorderRadius, 0, 2 * Math.PI);
    ctx.fillStyle = glossGrad;
    ctx.fill();
  };

  // Helper to darken/lighten colors
  const adjustColor = (hex: string, amt: number) => {
    let usePound = false;
    if (hex[0] === "#") {
        hex = hex.slice(1);
        usePound = true;
    }
    const num = parseInt(hex, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  }

  // Handle High DPI Scaling once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (isOpen && settings && canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 320 * dpr;
      canvas.height = 320 * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      drawWheel(rotationRef.current);
    }
  }, [isOpen, settings]);

  useEffect(() => {
    if (isOpen && settings && canvasRef.current) {
      drawWheel(rotationRef.current);
    }
    // Re-draw on bulb state change for animation
    if (isOpen && !isSpinning) {
        drawWheel(rotationRef.current);
    }
  }, [bulbState]);

  const spin = () => {
    if (isSpinning || !settings) return;

    setIsSpinning(true);
    setWinner(null);

    const options = settings.options;
    const totalProb = options.reduce((acc, opt) => acc + opt.probability, 0);
    let randomProb = Math.random() * totalProb;
    let winningIndex = 0;

    for (let i = 0; i < options.length; i++) {
        randomProb -= options[i].probability;
        if (randomProb <= 0) {
            winningIndex = i;
            break;
        }
    }

    const sliceAngle = (2 * Math.PI) / options.length;
    // Aim for the center of the winning slice
    const targetRotation = rotationRef.current + (Math.PI * 2 * 8) + (Math.PI * 2 - (winningIndex * sliceAngle + sliceAngle / 2));
    
    const startTime = performance.now();
    const duration = 6000; // Longer spin for drama

    const animateSpin = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Custom physics-like easing (Quintic Out for smooth end)
        const t = progress;
        const easedProgress = 1 - Math.pow(1 - t, 5);
        
        const currentRotation = rotationRef.current + (targetRotation - rotationRef.current) * easedProgress;
        drawWheel(currentRotation);

        if (progress < 1) {
            animationIdRef.current = requestAnimationFrame(animateSpin);
        } else {
            rotationRef.current = currentRotation % (Math.PI * 2);
            setIsSpinning(false);
            setWinner(options[winningIndex]);
            localStorage.setItem('roulette_shown_at', new Date().toISOString());
            
            // Premium Confetti
            const duration = 3 * 1000;
            const end = Date.now() + duration;

            (function frame() {
              confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#FFD700', '#B8860B', '#10B981']
              });
              confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#FFD700', '#B8860B', '#10B981']
              });

              if (Date.now() < end) {
                requestAnimationFrame(frame);
              }
            }());
        }
    };

    animationIdRef.current = requestAnimationFrame(animateSpin);
  };

  if (!settings) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-2 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="relative overflow-visible max-w-[95vw] sm:max-w-lg w-full"
          >
            {/* Pedestal / Base */}
            <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-32 sm:w-48 h-8 sm:h-12 bg-neutral-900 rounded-[40%] blur-sm opacity-50" />
            <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-28 sm:w-40 h-6 sm:h-8 bg-gradient-to-b from-neutral-800 to-neutral-950 rounded-lg shadow-xl border-t border-white/10" />

            <div className="relative bg-[#0a1a1a] rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-8 text-center border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 text-emerald-400 hover:bg-white/20 transition-colors z-20"
              >
                <X size={18} />
              </button>

              {!winner ? (
                <>
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-4 sm:mb-8"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-bold mb-2 sm:mb-4">
                        <Sparkles size={12} />
                        LUCKY SPIN
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white mb-1 sm:mb-2 tracking-tight leading-tight">
                        {t('rouletteTitle')}
                    </h2>
                    <p className="text-emerald-400/80 text-sm sm:text-base font-medium">
                        {t('rouletteDesc')}
                    </p>
                  </motion.div>

                  <div className="relative mb-6 sm:mb-10 flex justify-center">
                    {/* Premium Pointer */}
                    <div className="absolute top-[-10px] sm:top-[-15px] left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[4px] sm:border-l-[6px] border-l-transparent border-r-[4px] sm:border-r-[6px] border-r-transparent border-t-[8px] sm:border-t-[10px] border-t-white mt-1" />
                        </div>
                    </div>
                    
                    <canvas
                      ref={canvasRef}
                      style={{ width: 'min(280px, 70vw)', height: 'min(280px, 70vw)' }}
                      className="drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={spin}
                    disabled={isSpinning}
                    className={`
                      w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl tracking-widest shadow-[0_10px_20px_rgba(0,0,0,0.3)] 
                      transition-all duration-300 relative overflow-hidden group
                      ${isSpinning 
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50' 
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-emerald-500/25'}
                    `}
                  >
                    {!isSpinning && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    )}
                    {isSpinning ? t('loading').toUpperCase() : t('rouletteSpin').toUpperCase()}
                  </motion.button>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-4 sm:py-8"
                >
                  <motion.div 
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-[0_0_30px_rgba(251,191,36,0.4)]"
                  >
                    <Trophy size={40} className="text-white sm:text-white drop-shadow-md sm:w-14 sm:h-14" />
                  </motion.div>
                  
                  <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white mb-2 sm:mb-4">
                    {t('rouletteWin')}
                  </h2>
                  <p className="text-emerald-400 text-lg sm:text-2xl mb-8 sm:mb-12 leading-tight">
                    {t('rouletteWonLabel')} <br/>
                    <span className="text-2xl sm:text-4xl font-black text-white mt-1 sm:mt-2 block tracking-wider uppercase">
                        {winner.label}
                    </span>
                  </p>
                  
                  {winner && winner.value > 0 ? (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleClaimAndBook}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:opacity-90 transition-opacity shadow-xl flex items-center justify-center gap-2"
                      >
                        <Calendar size={18} />
                        Usar Prêmio & Agendar
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="w-full py-3 bg-white/10 text-white/70 rounded-xl sm:rounded-2xl font-medium text-sm hover:bg-white/20 transition-colors"
                      >
                        {t('rouletteClose')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-full py-4 bg-white text-[#0a1a1a] rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:bg-emerald-50 transition-colors shadow-xl"
                    >
                      {t('rouletteClose')}
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
