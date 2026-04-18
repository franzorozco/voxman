import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/home/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import DashboardLayout from "../pages/dashboard/Dashboard";

import DashboardHome from "../pages/dashboard/pages/home/Home";
import Users from "../pages/dashboard/pages/users/Users";
import Roles from "../pages/dashboard/pages/roles/Roles";
import Products from "../pages/shop/Products";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* TIENDA */}
        <Route path="/" element={<Home />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* DASHBOARD */}
        <Route path="/dashboard" element={<DashboardLayout />}>

          <Route index element={<DashboardHome />} />
          <Route path="products" element={<Products />} />
          <Route path="users" element={<Users />} />
          <Route path="roles" element={<Roles />} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}