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
import Bundles from "../pages/dashboard/pages/Bundles/Bundles";
import Promotions from "../pages/dashboard/pages/Promotions/Promotions";
import DeletedPromotions from "../pages/dashboard/pages/Promotions/DeletedPromotions";
import Settings from "../pages/dashboard/pages/catalog-settings/Settings.jsx";
import Branches from "../pages/dashboard/pages/Branches/Branches.jsx";
import DeletedBranches from "../pages/dashboard/pages/Branches/DeletedBranches.jsx";
import Inventory from "../pages/dashboard/pages/inventory/Inventory.jsx";
import InventoryMovements from "../pages/dashboard/pages/inventory/InventoryMovements.jsx";
import Giftcards from "../pages/dashboard/pages/Giftcards/Giftcards.jsx";
import DeletedGiftcards from "../pages/dashboard/pages/Giftcards/DeletedGiftcards.jsx";
import Suppliers from "../pages/dashboard/pages/Suppliers/Suppliers.jsx";
import DeletedSuppliers from "../pages/dashboard/pages/Suppliers/DeletedSuppliers.jsx";
import SupplierReturns from "../pages/dashboard/pages/Suppliers/SupplierReturns.jsx";
import PurchasesList from "../pages/dashboard/pages/Purchases/PurchasesList.jsx";
import CreatePurchase from "../pages/dashboard/pages/Purchases/CreatePurchase.jsx";
import ReceivePurchase from "../pages/dashboard/pages/Purchases/ReceivePurchase.jsx";
import QuarantineList from "../pages/dashboard/pages/inventory/QuarantineList";
import Customers from "../pages/dashboard/pages/Customers/Customers.jsx";
import DeletedCustomers from "../pages/dashboard/pages/Customers/DeletedCustomers.jsx";
import Employees from "../pages/dashboard/pages/Employees/Employees.jsx";
import DeletedEmployees from "../pages/dashboard/pages/Employees/DeletedEmployees.jsx";
import Payroll from "../pages/dashboard/pages/Payroll/Payroll.jsx";
import Attendances from "../pages/dashboard/pages/Attendances/Attendances.jsx";
import Sales from "../pages/dashboard/pages/Sales/Sales.jsx";

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
            <Route path="bundles" element={<ProtectedRoute permissions={["view_products"]}><Bundles /></ProtectedRoute>} />
            <Route path="promotions" element={<ProtectedRoute permissions={["view_promotions"]}><Promotions /></ProtectedRoute>} />
            <Route path="promotions/deleted" element={<ProtectedRoute permissions={["view_promotions"]}><DeletedPromotions /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute permissions={["manage_settings"]}><Settings /></ProtectedRoute>} />
            <Route path="branches" element={<ProtectedRoute permissions={["view_branches"]}><Branches /></ProtectedRoute>} />
            <Route path="branches/deleted" element={<ProtectedRoute permissions={["view_branches"]}><DeletedBranches /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute permissions={["view_users"]}><Users /></ProtectedRoute>} />
            <Route path="users/deleted" element={<ProtectedRoute permissions={["view_users"]}><DeletedUsers /></ProtectedRoute>} />
            <Route path="roles" element={<ProtectedRoute permissions={["manage_roles"]}><Roles /></ProtectedRoute>} />
            <Route path="permissions" element={<ProtectedRoute permissions={["manage_roles"]}><Permissions /></ProtectedRoute>} />
            <Route path="inventory" element={<ProtectedRoute permissions={["view_inventory"]}><Inventory /></ProtectedRoute>} />
            <Route path="inventory/movements" element={<ProtectedRoute permissions={["view_inventory"]}><InventoryMovements /></ProtectedRoute>} />
            <Route path="giftcards" element={<ProtectedRoute permissions={["view_giftcards"]}><Giftcards /></ProtectedRoute>} />
            <Route path="giftcards/deleted" element={<ProtectedRoute permissions={["view_giftcards"]}><DeletedGiftcards /></ProtectedRoute>} />
            <Route path="suppliers" element={<ProtectedRoute permissions={["view_suppliers"]}><Suppliers /></ProtectedRoute>} />
            <Route path="suppliers/returns" element={<ProtectedRoute permissions={["view_suppliers"]}><SupplierReturns /></ProtectedRoute>} />
            <Route path="suppliers/deleted" element={<ProtectedRoute permissions={["view_suppliers"]}><DeletedSuppliers /></ProtectedRoute>} />
            <Route path="purchases" element={<ProtectedRoute permissions={["view_purchases"]}><PurchasesList /></ProtectedRoute>} />
            <Route path="purchases/create" element={<ProtectedRoute permissions={["create_purchases"]}><CreatePurchase /></ProtectedRoute>} />
            <Route path="purchases/receive/:id" element={<ProtectedRoute permissions={["receive_inventory"]}><ReceivePurchase /></ProtectedRoute>} />
            <Route path="inventory/quarantine" element={<ProtectedRoute permissions={["manage_inventory"]}><QuarantineList /></ProtectedRoute>} />
            <Route path="clients" element={<ProtectedRoute permissions={["view_customers"]}><Customers /></ProtectedRoute>} />
            <Route path="clients/deleted" element={<ProtectedRoute permissions={["view_customers"]}><DeletedCustomers /></ProtectedRoute>} />
            <Route path="employees" element={<Employees />} />
            <Route path="employees/deleted" element={<DeletedEmployees />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="attendances" element={<Attendances />} />
            <Route path="sales" element={<Sales />} />

          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
