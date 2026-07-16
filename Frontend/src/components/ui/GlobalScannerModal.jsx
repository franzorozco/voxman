import React, { useState, useRef } from 'react';
import { X, Camera, ArrowRightToLine, Infinity } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useScannerStore } from '../../store/useScannerStore';

export default function GlobalScannerModal() {
  const { isOpen, onScanCallback, closeScanner, allowContinuous } = useScannerStore();
  const [error, setError] = useState(null);
  const [isContinuous, setIsContinuous] = useState(false);
  const continuousModeRef = useRef(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsContinuous(false);
      continuousModeRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); 
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.1); 
    } catch (e) {
      console.error("Audio beep failed", e);
    }
  };

  const handleDecode = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const text = detectedCodes[0].rawValue || detectedCodes[0].text || detectedCodes[0];
      if (text) {
        playBeep();
        
        if (onScanCallback) onScanCallback(text);
        
        if (!continuousModeRef.current) {
          closeScanner();
        }
      }
    }
  };

  const handleError = (error) => {
    console.error("Scanner Error:", error);
    if (error.name === "NotAllowedError" || error.message?.includes("Permission")) {
      setError("Permiso de cámara denegado. Por favor permite el acceso a la cámara en tu navegador.");
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-main)', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', color: 'var(--text-main)' }}>
            <Camera size={20} color="var(--color-primary)" /> Escanear Código
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {allowContinuous && (
              <button
                onClick={() => {
                  const newMode = !isContinuous;
                  setIsContinuous(newMode);
                  continuousModeRef.current = newMode;
                }}
                title={isContinuous ? "Modo Continuo Activado" : "Modo Uno por Uno"}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isContinuous ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-input)', border: `1px solid ${isContinuous ? 'var(--color-success)' : 'var(--border-color)'}`, color: isContinuous ? 'var(--color-success)' : 'var(--text-main)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
              >
                {isContinuous ? <Infinity size={14} /> : <ArrowRightToLine size={14} />}
                {isContinuous ? "En lista" : "Uno por uno"}
              </button>
            )}
            
            <button 
              onClick={closeScanner}
              style={{ background: 'var(--bg-input)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {error ? (
            <div style={{ color: '#fff', textAlign: 'center', padding: '20px' }}>
              <Camera size={48} style={{ opacity: 0.3, margin: '0 auto 10px auto' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
            </div>
          ) : (
            <Scanner 
              onScan={handleDecode}
              onError={handleError}
              formats={['qr_code', 'code_128', 'ean_13', 'upc_a']}
              allowMultiple={true}
              scanDelay={isContinuous ? 3000 : 500}
              components={{
                audio: false,
                finder: true,
              }}
              styles={{
                container: { width: '100%', height: '100%' },
                video: { objectFit: 'cover' }
              }}
            />
          )}
        </div>

        <div style={{ padding: '20px', background: 'var(--bg-card)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            Apunta la cámara de tu dispositivo hacia el código QR o barras.
          </p>
        </div>
      </div>
    </div>
  );
}
