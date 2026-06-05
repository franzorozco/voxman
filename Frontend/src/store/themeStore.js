import { create } from "zustand";

export const useThemeStore = create((set) => ({
  isDark: localStorage.getItem("dashboardTheme") === "dark" || true, 
  
  toggleTheme: () => set((state) => {
    const newIsDark = !state.isDark;
    localStorage.setItem("dashboardTheme", newIsDark ? "dark" : "light");
    return { isDark: newIsDark };
  }),
}));
