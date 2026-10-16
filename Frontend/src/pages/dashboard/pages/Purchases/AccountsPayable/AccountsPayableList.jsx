import React, { useState, useEffect } from "react";
import { Search, DollarSign, Clock, CheckCircle, RefreshCw, Eye, FileText, AlertTriangle, Filter, MoreVertical } from "lucide-react";
import RowDropdown from "../../../../../components/ui/RowDropdown";
import { toast } from "react-hot-toast";
import { getAccountsPayable, getAccountsPayableStats } from "../../../../../api/admin/accountsPayable";
import { getPurchase } from "../../../../../api/admin/purchases";
import { Link } from "react-router-dom";
import Spinner from "../../../components/Spinner/Spinner";
import ViewPurchaseModal from "../ViewPurchaseModal";
import "../Purchases.css";
import "./AccountsPayable.css";

import CustomSelect from '../../../../../components/ui/CustomSelect';
export default function AccountsPayableList() {
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const activeFiltersCount = [statusFilter].filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0 || Boolean(search);

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const [accRes, statsRes] = await Promise.all([
        getAccountsPayable({ search, status: statusFilter }),
        getAccountsPayableStats()
      ]);
      setAccounts(accRes.data.data || accRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Error al cargar cuentas por pagar");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [search, statusFilter]);

  return (
    <div className="purchases-container">
      {/* Reutilizamos el modal de detalles de compra para hacer los pagos */}
      {selectedPurchase && (
        <ViewPurchaseModal 
          purchase={selectedPurchase} 
          onClose={() => setSelectedPurchase(null)}
          onUpdate={fetchAccounts}
        />
      )}

      <div className="purchases-header">
        <h1 className="purchases-title">
          <DollarSign size={28} className="text-primary" />
          Cuentas por Pagar a Proveedores
        </h1>
        <div className="purchases-header-actions">
          <Link to="/dashboard/purchases" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <FileText size={16} /> Volver a Compras
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="accounts-kpi-grid">
        <div className="accounts-kpi-card kpi-total">
          <div className="accounts-kpi-top">
            <span className="accounts-kpi-value">{accounts ? accounts.length : 0}</span>
          </div>
          <div className="accounts-kpi-bottom">
            <div className="accounts-kpi-icon-mini">
              <FileText size={14} />
            </div>
            <span className="accounts-kpi-label">Total Cuentas</span>
          </div>
        </div>

        <div className="accounts-kpi-card kpi-debt">
          <div className="accounts-kpi-top">
            <span className="accounts-kpi-value">
              Bs. {Number(stats?.total_debt || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </div>
          <div className="accounts-kpi-bottom">
            <div className="accounts-kpi-icon-mini">
              <DollarSign size={14} />
            </div>
            <span className="accounts-kpi-label">Deuda Pendiente</span>
          </div>
        </div>

        <div className="accounts-kpi-card kpi-paid">
          <div className="accounts-kpi-top">
            <span className="accounts-kpi-value">
              Bs. {Number(stats?.total_paid_historical || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </div>
          <div className="accounts-kpi-bottom">
            <div className="accounts-kpi-icon-mini">
              <CheckCircle size={14} />
            </div>
            <span className="accounts-kpi-label">Total Abonado</span>
          </div>
        </div>

        <div className="accounts-kpi-card kpi-overdue">
          <div className="accounts-kpi-top">
            <span className="accounts-kpi-value">{stats?.overdue_count ?? 0}</span>
          </div>
          <div className="accounts-kpi-bottom">
            <div className="accounts-kpi-icon-mini">
              <AlertTriangle size={14} />
            </div>
            <span className="accounts-kpi-label">Deudas Vencidas</span>
          </div>
        </div>
      </div>

      <div className="accounts-filters-container">
        <div className={`accounts-search-bar-row ${showFilters ? 'open' : ''}`}>
          <div className="accounts-search-input-wrapper">
            <Search size={18} className="accounts-search-icon" />
            <input 
              className="accounts-search-input"
              placeholder="Buscar por Proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`accounts-filter-toggle-btn ${showFilters ? 'active' : ''}`}
          >
            <Filter size={18} />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="accounts-filter-badge">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="accounts-filters-panel">
            <div className="accounts-filter-group">
              <label>Estado de Pago</label>
              <CustomSelect 
                className="purchase-form-select account-filter-select" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="pending">Por Pagar</option>
                <option value="partial">Pago Parcial</option>
                <option value="paid">Pagado Completo</option>
              </CustomSelect>
            </div>
            
            <div className="accounts-filter-actions-row">
              <button 
                type="button"
                className="accounts-filter-clear-btn" 
                onClick={handleClearFilters} 
                title="Limpiar Filtros"
              >
                <RefreshCw size={15} />
                <span>Limpiar Filtros</span>
              </button>
              <button 
                type="button"
                className="accounts-filter-refresh-btn" 
                onClick={fetchAccounts} 
                title="Actualizar"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="purchases-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
        <table className="products-table" style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Ref. Compra</th>
              <th>Vencimiento</th>
              <th>Monto Total</th>
              <th>Pagado</th>
              <th>Saldo</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '50px 30px' }}>
                  <Spinner size={30} style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No se encontraron cuentas por pagar</td>
              </tr>
            ) : (
              accounts.map((acc) => {
                const isOverdue = acc.status !== 'paid' && new Date(acc.due_date) < new Date();
                return (
                  <tr key={acc.id} className={isOverdue ? "row-overdue" : ""}>
                    <td style={{ position: 'relative' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <RowDropdown rowId={acc.id} activeId={activeDropdown} setActiveId={setActiveDropdown}>
      <button
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', textAlign: 'left', fontSize: '14px' }}
              onClick={async () => {
                setActiveDropdown(null);
                try {
                  const toastId = toast.loading("Cargando detalles...");
                  const res = await getPurchase(acc.purchase.id);
                  const fullPurchaseData = res.data.data || res.data;
                  fullPurchaseData.accounts_payables = [acc];
                  toast.dismiss(toastId);
                  setSelectedPurchase(fullPurchaseData);
                } catch (e) {
                  toast.dismiss();
                  toast.error("Error al cargar detalles");
                }
              }}
            >
              {acc.status === 'paid' ? <Eye size={16} /> : <DollarSign size={16} />}
              {acc.status === 'paid' ? ' Ver' : ' Pagar'}
            </button>
    </RowDropdown>
    <div>
      <div style={{ fontWeight: 600 }}>{acc.supplier?.name || "Desconocido"}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{acc.supplier?.contact_name}</div>
    </div>
  </div>
</td>
                    <td >
                      <div style={{ fontWeight: 500 }}>{acc.purchase?.invoice_number || "Sin factura"}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {acc.purchase?.id?.split('-')[0]}</div>
                    </td>
                    <td >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isOverdue ? 'var(--color-danger)' : 'var(--text-main)', fontWeight: isOverdue ? 600 : 400 }}>
                        {isOverdue && <AlertTriangle size={14} />}
                        {new Date(acc.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td  style={{ fontWeight: 600 }}>Bs. {Number(acc.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td  style={{ color: 'var(--color-success)', fontWeight: 500 }}>Bs. {Number(acc.paid_amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td  style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Bs. {Number(acc.balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td >
                      <span className={`status-badge status-${acc.status === 'paid' ? 'success' : acc.status === 'partial' ? 'warning' : 'danger'}`}>
                        {acc.status === 'paid' ? 'Pagado' : acc.status === 'partial' ? 'Pago Parcial' : 'Por Pagar'}
                      </span>
                    </td>
                    <td  className="actions-cell">
                      <div className="hide-on-mobile action-buttons" style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          className="btn-primary account-action-btn"
                          style={{ opacity: acc.status === 'paid' ? 0.5 : 1 }}
                          onClick={async () => {
                            try {
                              const toastId = toast.loading("Cargando detalles...");
                              const res = await getPurchase(acc.purchase.id);
                              const fullPurchaseData = res.data.data || res.data;
                              fullPurchaseData.accounts_payables = [acc];
                              toast.dismiss(toastId);
                              setSelectedPurchase(fullPurchaseData);
                            } catch (e) {
                              toast.dismiss();
                              toast.error("Error al cargar detalles");
                            }
                          }}
                          title={acc.status === 'paid' ? "Ver Detalles" : "Registrar Pago"}
                        >
                          {acc.status === 'paid' ? <Eye size={16} /> : <DollarSign size={16} />}
                          {acc.status === 'paid' ? ' Ver' : ' Pagar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}




