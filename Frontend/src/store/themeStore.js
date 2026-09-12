import { create } from "zustand";

export const useThemeStore = create((set) => {
  const savedTheme = localStorage.getItem("dashboardTheme");
  const initialIsDark = savedTheme === "dark";

  const savedProfileTheme = localStorage.getItem("profileTheme");
  const initialProfileIsDark = savedProfileTheme === "dark";

  return {
    isDark: initialIsDark,
    toggleTheme: () => set((state) => {
      const newIsDark = !state.isDark;
      localStorage.setItem("dashboardTheme", newIsDark ? "dark" : "light");
      return { isDark: newIsDark };
    }),

    profileIsDark: initialProfileIsDark,
    toggleProfileTheme: () => set((state) => {
      const newProfileIsDark = !state.profileIsDark;
      localStorage.setItem("profileTheme", newProfileIsDark ? "dark" : "light");
      return { profileIsDark: newProfileIsDark };
    }),
    setProfileTheme: (isDark) => set(() => {
      localStorage.setItem("profileTheme", isDark ? "dark" : "light");
      return { profileIsDark: isDark };
    }),
  };
});
