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
import DeletedUsers from "../pages/dashboard/pages/users/DeletedUsers";
import Roles from "../pages/dashboard/pages/roles/Roles";
import Permissions from "../pages/dashboard/pages/permissions/Permissions";
import Products from "../pages/dashboard/pages/Products/Products";
import DeletedProducts from "../pages/dashboard/pages/Products/DeletedProducts";
import Settings from "../pages/dashboard/pages/catalog-settings/Settings.jsx";
import Branches from "../pages/dashboard/pages/Branches/Branches.jsx";
import DeletedBranches from "../pages/dashboard/pages/Branches/DeletedBranches.jsx";
import Inventory from "../pages/dashboard/pages/inventory/Inventory.jsx";
import InventoryMovements from "../pages/dashboard/pages/inventory/InventoryMovements.jsx";

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
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >

            <Route index element={<DashboardHome />} />
            <Route path="products" element={<ProtectedRoute permissions={["view_products"]}><Products /></ProtectedRoute>} />
            <Route path="products/deleted" element={<ProtectedRoute permissions={["view_products"]}><DeletedProducts /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute permissions={["manage_settings"]}><Settings /></ProtectedRoute>} />
            <Route path="branches" element={<ProtectedRoute permissions={["view_branches"]}><Branches /></ProtectedRoute>} />
            <Route path="branches/deleted" element={<ProtectedRoute permissions={["view_branches"]}><DeletedBranches /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute permissions={["view_users"]}><Users /></ProtectedRoute>} />
            <Route path="users/deleted" element={<ProtectedRoute permissions={["view_users"]}><DeletedUsers /></ProtectedRoute>} />
            <Route path="roles" element={<ProtectedRoute permissions={["manage_roles"]}><Roles /></ProtectedRoute>} />
            <Route path="permissions" element={<ProtectedRoute permissions={["manage_roles"]}><Permissions /></ProtectedRoute>} />
            <Route path="inventory" element={<ProtectedRoute permissions={["view_inventory"]}><Inventory /></ProtectedRoute>} />
            <Route path="inventory/movements" element={<ProtectedRoute permissions={["view_inventory"]}><InventoryMovements /></ProtectedRoute>} />

          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
