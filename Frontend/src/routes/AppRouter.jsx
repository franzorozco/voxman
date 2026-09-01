import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "../components/ui/PageTransition";

import ProtectedRoute from "./ProtectedRoute";

/* PÁGINAS PÚBLICAS */
import Home from "../pages/home/Home";
import Nosotros from "../pages/nosotros/Nosotros";
import Tracking from "../pages/public/Tracking/Tracking";

/* AUTH */
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

/* DASHBOARD LAYOUT */
import DashboardLayout from "../pages/dashboard/Dashboard";

/* POS */
import PosLayout from "../pages/pos/Pos";
import Terminal from "../pages/pos/pages/terminal/Terminal";

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
import Logs from "../pages/dashboard/pages/Logs/Logs.jsx";
import Branches from "../pages/dashboard/pages/Branches/Branches.jsx";
import DeletedBranches from "../pages/dashboard/pages/Branches/DeletedBranches.jsx";
import Inventory from "../pages/dashboard/pages/inventory/Inventory.jsx";
import InventoryMovements from "../pages/dashboard/pages/inventory/InventoryMovements.jsx";
import Giftcards from "../pages/dashboard/pages/Giftcards/Giftcards.jsx";
import DeletedGiftcards from "../pages/dashboard/pages/Giftcards/DeletedGiftcards.jsx";
import Suppliers from "../pages/dashboard/pages/Suppliers/Suppliers.jsx";
import SupplierProfile from "../pages/dashboard/pages/Suppliers/SupplierProfile.jsx";
import DeletedSuppliers from "../pages/dashboard/pages/Suppliers/DeletedSuppliers.jsx";
import SupplierReturns from "../pages/dashboard/pages/Suppliers/SupplierReturns.jsx";
import PurchasesList from "../pages/dashboard/pages/Purchases/PurchasesList.jsx";
import AccountsPayableList from "../pages/dashboard/pages/Purchases/AccountsPayable/AccountsPayableList.jsx";
import CreatePurchase from "../pages/dashboard/pages/Purchases/CreatePurchase.jsx";
import ReceivePurchase from "../pages/dashboard/pages/Purchases/ReceivePurchase.jsx";
import QuarantineList from "../pages/dashboard/pages/inventory/QuarantineList";
import ShopShorts from "../pages/dashboard/pages/ShopShorts/ShopShorts";
import Customers from "../pages/dashboard/pages/Customers/Customers.jsx";
import DeletedCustomers from "../pages/dashboard/pages/Customers/DeletedCustomers.jsx";
import Employees from "../pages/dashboard/pages/Employees/Employees.jsx";
import Owners from "../pages/dashboard/pages/Owners/Owners.jsx";
import OwnerProfile from "../pages/dashboard/pages/Owners/OwnerProfile.jsx";
import DeletedEmployees from "../pages/dashboard/pages/Employees/DeletedEmployees.jsx";
import Payroll from "../pages/dashboard/pages/Payroll/Payroll.jsx";
import Attendances from "../pages/dashboard/pages/Attendances/Attendances.jsx";
import Sales from "../pages/dashboard/pages/Sales/Sales.jsx";
import SystemSettings from "../pages/dashboard/pages/SystemSettings/SystemSettings.jsx";
import Finance from "../pages/dashboard/pages/Finance/Finance.jsx";
import Carts from "../pages/dashboard/pages/Carts/Carts.jsx";
import Orders from "../pages/dashboard/pages/Orders/Orders.jsx";
import Returns from "../pages/dashboard/pages/Returns/Returns.jsx";
import CashFlow from "../pages/dashboard/pages/Finance/CashFlow/CashFlow.jsx";
import FinanceReports from "../pages/dashboard/pages/Finance/Reports/Reports.jsx";

/* SHOP (ONLINE STORE) */
import ShopLayout from "../pages/shop/components/layout/ShopLayout";
import ShopHome from "../pages/shop/Home/Home";
import ShopCatalog from "../pages/shop/Catalog/Catalog";
import ShopProductDetail from "../pages/shop/Product/ProductDetail";
import ShopCartView from "../pages/shop/Cart/CartView";
import BundleDetail from "../pages/shop/Bundle/BundleDetail";

import { useThemeStore } from "../store/themeStore";

const ThemeLayout = ({ theme }) => (
  <div className={theme} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
    <Outlet />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const { isDark } = useThemeStore();
  const adminThemeClass = isDark ? "admin-theme-dark" : "admin-theme";
  const posThemeClass = isDark ? "pos-theme-dark" : "pos-theme";
  const shopThemeClass = isDark ? "shop-theme-dark" : "shop-theme";

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* ================= PUBLIC & AUTH (HOME THEME) ================= */}
        <Route element={<PageTransition><ThemeLayout theme="home-theme" /></PageTransition>}>
          <Route path="/" element={<Home />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/tracking/:id" element={<Tracking />} />
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
            <Route path="logs" element={<ProtectedRoute permissions={["view_audit_logs"]}><Logs /></ProtectedRoute>} />
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
            <Route path="suppliers/:id" element={<ProtectedRoute permissions={["view_suppliers"]}><SupplierProfile /></ProtectedRoute>} />
            <Route path="suppliers/returns" element={<ProtectedRoute permissions={["view_suppliers"]}><SupplierReturns /></ProtectedRoute>} />
            <Route path="suppliers/deleted" element={<ProtectedRoute permissions={["view_suppliers"]}><DeletedSuppliers /></ProtectedRoute>} />
            <Route path="purchases" element={<ProtectedRoute permissions={["view_purchases"]}><PurchasesList /></ProtectedRoute>} />
            <Route path="purchases/create" element={<ProtectedRoute permissions={["create_purchases"]}><CreatePurchase /></ProtectedRoute>} />
            <Route path="purchases/receive/:id" element={<ProtectedRoute permissions={["receive_inventory"]}><ReceivePurchase /></ProtectedRoute>} />
            <Route path="purchases/accounts-payable" element={<ProtectedRoute permissions={["view_purchases"]}><AccountsPayableList /></ProtectedRoute>} />
            <Route path="inventory/quarantine" element={<ProtectedRoute permissions={["manage_inventory"]}><QuarantineList /></ProtectedRoute>} />
            <Route path="shop-shorts" element={
              <ProtectedRoute allowedPermissions={['view_promotions']}>
                <ShopShorts />
              </ProtectedRoute>
            } />
            <Route path="clients" element={<ProtectedRoute permissions={["view_customers"]}><Customers /></ProtectedRoute>} />
            <Route path="clients/deleted" element={<ProtectedRoute permissions={["view_customers"]}><DeletedCustomers /></ProtectedRoute>} />
            <Route path="employees" element={<ProtectedRoute permissions={["manage_executives"]}><Employees /></ProtectedRoute>} />
            <Route path="owners" element={<ProtectedRoute permissions={["view_owners"]}><Owners /></ProtectedRoute>} />
            <Route path="owners/:id" element={<ProtectedRoute permissions={["view_owners"]}><OwnerProfile /></ProtectedRoute>} />
            <Route path="employees/deleted" element={<ProtectedRoute permissions={["manage_executives"]}><DeletedEmployees /></ProtectedRoute>} />
            <Route path="payroll" element={<ProtectedRoute permissions={["manage_user_salaries"]}><Payroll /></ProtectedRoute>} />
            <Route path="attendances" element={<ProtectedRoute permissions={["manage_executives"]}><Attendances /></ProtectedRoute>} />
            <Route path="sales" element={<ProtectedRoute permissions={["view_sales"]}><Sales /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute permissions={["manage_sales"]}><Orders /></ProtectedRoute>} />
            <Route path="finance" element={<ProtectedRoute permissions={["view_finance"]}><Finance /></ProtectedRoute>} />
            <Route path="finance/cashflow" element={<ProtectedRoute permissions={["view_cashflow"]}><CashFlow /></ProtectedRoute>} />
            <Route path="finance/reports" element={<ProtectedRoute permissions={["view_finance_reports"]}><FinanceReports /></ProtectedRoute>} />
            <Route path="carts" element={<ProtectedRoute permissions={["view_carts"]}><Carts /></ProtectedRoute>} />
            <Route path="returns" element={<ProtectedRoute permissions={["view_returns"]}><Returns /></ProtectedRoute>} />
            <Route path="system-settings" element={<ProtectedRoute permissions={["manage_settings"]}><SystemSettings /></ProtectedRoute>} />

          </Route>
        </Route>

        {/* ================= POS (POS THEME) ================= */}
        <Route element={<ThemeLayout theme={posThemeClass} />}>
          <Route path="/pos" element={
              <ProtectedRoute>
                <PosLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Terminal />} />
          </Route>
        </Route>

        {/* ================= SHOP (ONLINE STORE) ================= */}
        <Route element={<PageTransition><ThemeLayout theme={shopThemeClass} /></PageTransition>}>
          <Route path="/shop" element={<ShopLayout />}>
            <Route index element={<ShopHome />} />
            <Route path="catalog" element={<ShopCatalog />} />
            <Route path="product/:id" element={<ShopProductDetail />} />
            <Route path="bundle/:id" element={<BundleDetail />} />
            <Route path="cart" element={<ShopCartView />} />
          </Route>
        </Route>

      </Routes>
    </AnimatePresence>
  );
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
