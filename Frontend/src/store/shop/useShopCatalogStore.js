import { create } from 'zustand';

export const useShopCatalogStore = create((set) => ({
  catalogState: null,
  scrollPosition: 0,
  setCatalogState: (state) => set({ catalogState: state }),
  setScrollPosition: (pos) => set({ scrollPosition: pos }),
  clearCatalogState: () => set({ catalogState: null, scrollPosition: 0 }),
}));
