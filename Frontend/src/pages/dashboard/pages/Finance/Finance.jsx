import { useState } from "react";
import FinanceDashboard from "./FinanceDashboard";
import ExpensesTab from "./ExpensesTab";
import OwnerPaymentsTab from "./OwnerPaymentsTab";
import { PieChart, TrendingDown, Wallet } from "lucide-react";
import "./Finance.css";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="finance-page fade-in">
      <div className="finance-header">
        <h1>Finanzas</h1>
        <p>Gestiona el resumen general, gastos operativos y movimientos de capital.</p>
      </div>
        
      {/* TAB NAVIGATION */}
      <div className="finance-tabs">
          <button 
            className={`finance-tab ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <PieChart size={18} />
            Resumen General
          </button>
          
          <button 
            className={`finance-tab ${activeTab === "expenses" ? "active" : ""}`}
            onClick={() => setActiveTab("expenses")}
          >
            <TrendingDown size={18} />
            Gastos Operativos
          </button>
          
          <button 
            className={`finance-tab ${activeTab === "owner-payments" ? "active" : ""}`}
            onClick={() => setActiveTab("owner-payments")}
          >
            <Wallet size={18} />
            Movimientos de Capital
          </button>
        </div>
      <div className="settings-content-card" style={{ padding: '0', background: 'transparent', border: 'none' }}>
        {activeTab === "dashboard" && <FinanceDashboard />}
        {activeTab === "expenses" && <ExpensesTab />}
        {activeTab === "owner-payments" && <OwnerPaymentsTab />}
      </div>
    </div>
  );
}
