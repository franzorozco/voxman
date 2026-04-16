import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/home/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import DashboardLayout from "../pages/dashboard/Dashboard";

import DashboardHome from "../pages/dashboard/pages/home/Home";
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

          {/* 👇 CORRECTO */}
          <Route path="products" element={<Products />} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}