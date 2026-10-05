import { create } from 'zustand';

export const useScannerStore = create((set) => ({
  isOpen: false,
  onScanCallback: null,
  allowContinuous: false,
  
  openScanner: (callback, allowContinuous = false) => set({ isOpen: true, onScanCallback: callback, allowContinuous }),
  closeScanner: () => set({ isOpen: false, onScanCallback: null, allowContinuous: false }),
}));
