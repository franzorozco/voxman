import { create } from "zustand";

export const useThemeStore = create((set) => {
  const savedTheme = localStorage.getItem("dashboardTheme");
  // Default to light mode (false for isDark) if nothing is saved
  const initialIsDark = savedTheme === "dark";

  return {
    isDark: initialIsDark,
    toggleTheme: () => set((state) => {
      const newIsDark = !state.isDark;
      localStorage.setItem("dashboardTheme", newIsDark ? "dark" : "light");
      return { isDark: newIsDark };
    }),
  };
});
