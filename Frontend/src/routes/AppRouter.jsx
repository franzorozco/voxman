import { BrowserRouter, Routes, Route } from "react-router-dom";

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

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/nosotros" element={<Nosotros />} />

        {/* ================= AUTH ================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================= DASHBOARD ================= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["Owner", "Administrador"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="products" element={<Products />} />
          <Route path="users" element={<Users />} />
          <Route path="roles" element={<Roles />} />
          <Route path="permissions" element={<Permissions />} />
        </Route>

        {/* fallback opcional */}
        <Route path="*" element={<Home />} />

      </Routes>
    </BrowserRouter>
  );
}