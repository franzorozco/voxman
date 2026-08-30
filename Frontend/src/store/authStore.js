import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: ({ user, token }) =>
        set({ user, token }),

      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("shop_auth_token");
        localStorage.removeItem("shop_user");
        set({ user: null, token: null });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);