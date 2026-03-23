import { create } from "zustand";

export const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: localStorage.getItem("auth_token") ? true : false,

    login: (user, token) => {
        localStorage.setItem("auth_token", token);
        localStorage.setItem("user", JSON.stringify(user));
        set({ user, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        set({ user: null, isAuthenticated: false });
    },

    restoreSession: () => {
        const token = localStorage.getItem("auth_token");
        const user = localStorage.getItem("user");
        if (token && user) {
            set({ user: JSON.parse(user), isAuthenticated: true });
        }
    },
}));
