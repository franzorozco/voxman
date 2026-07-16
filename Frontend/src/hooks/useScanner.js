import { useEffect, useRef } from 'react';

/**
 * Hook to listen for barcode/QR scanners globally.
 * Scanners act like keyboards but type extremely fast and end with an "Enter" key.
 * 
 * @param {function} onScan - Callback when a valid scan is detected. Receives the scanned text.
 * @param {boolean} active - Whether the listener should be active.
 */
export default function useScanner(onScan, active = true) {
  const buffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      const timeElapsed = currentTime - lastKeyTime.current;
      
      // If it took too long between strokes (e.g. human typing > 100ms), reset the buffer
      if (timeElapsed > 100) {
        buffer.current = '';
      }
      
      lastKeyTime.current = currentTime;

      // When "Enter" is pressed, check if we have a valid buffer string
      if (e.key === 'Enter') {
        if (buffer.current.length > 3) { 
          const scannedText = buffer.current;
          buffer.current = '';
          
          if (timeElapsed < 100) {
            e.preventDefault(); 
            onScan(scannedText);
          }
        }
        return;
      }

      // Append printable characters to the buffer
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, active]);
}
