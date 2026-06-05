import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

/* PÁGINAS PÚBLICAS */
import Home from "../pages/home/Home";
import Nosotros from "../pages/nosotros/Nosotros";

/* AUTH */
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

/* DASHBOARD LAYOUT */
import DashboardLayout from "../pages/dashboard/Dashboard";

/* DASHBOARD PAGES */
import DashboardHome from "../pages/dashboard/pages/home/Home";
import Users from "../pages/dashboard/pages/users/Users";
import Roles from "../pages/dashboard/pages/roles/Roles";
import Permissions from "../pages/dashboard/pages/permissions/Permissions";
import Products from "../pages/dashboard/pages/Products/Products";
import Settings from "../pages/dashboard/pages/catalog-settings/Settings.jsx";
import Branches from "../pages/dashboard/pages/Branches/Branches.jsx";

import { useThemeStore } from "../store/themeStore";

const ThemeLayout = ({ theme }) => (
  <div className={theme} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
    <Outlet />
  </div>
);

export default function AppRouter() {
  const { isDark } = useThemeStore();
  const adminThemeClass = isDark ? "admin-theme-dark" : "admin-theme";

  return (
    <BrowserRouter>
      <Routes>

        {/* ================= PUBLIC & AUTH (HOME THEME) ================= */}
        <Route element={<ThemeLayout theme="home-theme" />}>
          <Route path="/" element={<Home />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* fallback opcional */}
          <Route path="*" element={<Home />} />
        </Route>

        {/* ================= DASHBOARD (ADMIN THEME) ================= */}
        <Route element={<ThemeLayout theme={adminThemeClass} />}>
          <Route path="/dashboard" element={
              <ProtectedRoute roles={["Owner", "Administrador"]}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >

            <Route index element={<DashboardHome />} />
            <Route path="products" element={<Products />} />
            <Route path="settings" element={<Settings />} />
            <Route path="branches" element={<Branches />} />
            <Route path="users" element={<Users />} />
            <Route path="roles" element={<Roles />} />
            <Route path="permissions" element={<Permissions />} />

          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
