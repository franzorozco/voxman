import { useState } from "react";
import FinanceDashboard from "./FinanceDashboard";
import ExpensesTab from "./ExpensesTab";
import OwnerPaymentsTab from "./OwnerPaymentsTab";
import { PieChart, TrendingDown, Wallet } from "lucide-react";
import CanAccess from "../../../../components/ui/CanAccess";
import "./Finance.css";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="finance-page fade-in">
      <div className="finance-header">
        <h1>Gastos y Capital</h1>
        <p>Controla los egresos del negocio y el patrimonio aportado o retirado por los socios.</p>
      </div>
        
      {/* TAB NAVIGATION */}
      <div className="finance-tabs">
          <button 
            className={`finance-tab ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <PieChart size={18} />
            Balance Financiero
          </button>
          
          <CanAccess permission="manage_expenses">
            <button 
              className={`finance-tab ${activeTab === "expenses" ? "active" : ""}`}
              onClick={() => setActiveTab("expenses")}
            >
              <TrendingDown size={18} />
              Control de Gastos
            </button>
          </CanAccess>
          
          <CanAccess permission="manage_owner_payments">
            <button 
              className={`finance-tab ${activeTab === "owner-payments" ? "active" : ""}`}
              onClick={() => setActiveTab("owner-payments")}
            >
              <Wallet size={18} />
              Aportes y Retiros (Socios)
            </button>
          </CanAccess>
        </div>
      <div className="settings-content-card" style={{ padding: '0', background: 'transparent', border: 'none' }}>
        {activeTab === "dashboard" && <FinanceDashboard />}
        <CanAccess permission="manage_expenses">
          {activeTab === "expenses" && <ExpensesTab />}
        </CanAccess>
        <CanAccess permission="manage_owner_payments">
          {activeTab === "owner-payments" && <OwnerPaymentsTab />}
        </CanAccess>
      </div>
    </div>
  );
}
