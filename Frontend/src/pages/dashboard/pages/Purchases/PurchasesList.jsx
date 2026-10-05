import { useState, useEffect } from "react";
import { Plus, Search, FileText, XCircle, RefreshCw, Eye, Package, Filter, MoreVertical } from "lucide-react";
import RowDropdown from "../../../../components/ui/RowDropdown";
import { toast } from "react-hot-toast";
import { getPurchases, cancelPurchase, getPurchaseStats } from "../../../../api/admin/purchases";
import { Link } from "react-router-dom";
import CanAccess from "../../../../components/ui/CanAccess";
import Spinner from "../../components/Spinner/Spinner";
import ViewPurchaseModal from "./ViewPurchaseModal";
import "./Purchases.css";
import { DollarSign, Clock, CheckCircle } from "lucide-react";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function PurchasesList() {
  const [purchases, setPurchases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const [purRes, statsRes] = await Promise.all([
        getPurchases({ search, status: statusFilter }),
        getPurchaseStats()
      ]);
      setPurchases(purRes.data.data || purRes.data); // handle pagination
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Error al cargar Ã³rdenes de compra");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [search, statusFilter]);

  const handleCancel = async (id) => {
    if (window.confirm("Â¿EstÃ¡s seguro de cancelar esta orden de compra?")) {
      try {
        const { data } = await cancelPurchase(id);
        toast.success(data.message);
        fetchPurchases();
      } catch (error) {
        toast.error(error.response?.data?.message || "Error al cancelar la orden");
      }
    }
  };

  return (
    <div className="products-container fade-in">
      {selectedPurchase && (
        <ViewPurchaseModal 
          purchase={selectedPurchase} 
          onClose={() => setSelectedPurchase(null)}
          onUpdate={fetchPurchases}
        />
      )}

      <div className="products-header">
        <h1 className="products-title">
          <FileText size={28} className="text-primary" />
          Ã“rdenes de Compra
        </h1>

        <div className="purchases-header-actions">
          <button className="btn-secondary" onClick={() => fetchPurchases()} title="Actualizar">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Recargar
          </button>
          <CanAccess permission="create_purchases">
            <Link to="/dashboard/purchases/create" className="btn-primary" style={{ textDecoration: 'none' }}>
              <Plus size={18} /> Nueva Compra
            </Link>
          </CanAccess>
        </div>
      </div>

      {stats && (
        <div className="metrics-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="metric-card">
            <div className="metric-icon-wrapper" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)' }}>
              <Clock size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-label">Deuda Total</div>
              <div className="metric-value">Bs. {Number(stats.total_debt).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon-wrapper" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' }}>
              <CheckCircle size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-label">Total Pagado (Mes)</div>
              <div className="metric-value">Bs. {Number(stats.monthly_payments).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-wrapper" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)' }}>
              <FileText size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-label">MercaderÃ­a Recibida</div>
              <div className="metric-value">Bs. {Number(stats.monthly_purchases).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
          </div>
        </div>
      )}

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: showFilters ? '15px' : '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar por Nro Factura o Proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: showFilters ? 'var(--color-primary)' : 'var(--bg-card)', color: showFilters ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
          >
            <Filter size={18} />
            <span className="hide-on-mobile">Filtros</span>
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado</label>
              <CustomSelect 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="received">Recepcionados</option>
                <option value="cancelled">Cancelados</option>
              </CustomSelect>
            </div>
          </div>
        )}
      </div>

      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Sucursal</th>
              <th>Nro. Factura</th>
              <th>Total</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '50px 30px' }}>
                  <Spinner size={30} style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : purchases.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No se encontraron compras</td>
              </tr>
            ) : (
              purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td style={{ position: 'relative' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <RowDropdown rowId={purchase.id} activeId={activeDropdown} setActiveId={setActiveDropdown}>
      <button
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', width: '100%', textAlign: 'left', fontSize: '14px', cursor: 'pointer' }}
        onClick={() => {
          setSelectedPurchase(purchase);
          setActiveDropdown(null);
        }}
      >
        <Eye size={16} /> Ver Detalles
      </button>

      <CanAccess permission="receive_inventory">
        {purchase.status === 'pending' && (
          <Link
            to={`/dashboard/purchases/receive/${purchase.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', width: '100%', textAlign: 'left', fontSize: '14px', cursor: 'pointer', textDecoration: 'none' }}
            onClick={() => setActiveDropdown(null)}
          >
            <Package size={16} /> Recepcionar
          </Link>
        )}
      </CanAccess>

      <CanAccess permission="cancel_purchases">
        {purchase.status === 'pending' && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: 'none', color: '#ef4444', width: '100%', textAlign: 'left', fontSize: '14px', cursor: 'pointer' }}
            onClick={() => {
              handleCancel(purchase.id);
              setActiveDropdown(null);
            }}
          >
            <XCircle size={16} /> Anular Compra
          </button>
        )}
      </CanAccess>
    </RowDropdown>
    <div>{new Date(purchase.created_at).toLocaleDateString()}</div>
  </div>
</td>
<td>
  <div style={{ fontWeight: 600 }}>{purchase.supplier?.name || "Desconocido"}</div>
</td>
<td>{purchase.branch?.name || "-"}</td>
<td>{purchase.invoice_number || "-"}</td>
<td style={{ fontWeight: 600 }}>Bs. {Number(purchase.total).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <span className={`status-badge status-${purchase.status}`}>
                        {purchase.status === 'pending' ? 'Pendiente' : purchase.status === 'received' ? 'Recepcionado' : 'Cancelado'}
                      </span>
                      {purchase.accounts_payables && purchase.accounts_payables.length > 0 && (
                        <span className={`status-badge status-${purchase.accounts_payables[0].status === 'paid' ? 'success' : purchase.accounts_payables[0].status === 'partial' ? 'warning' : 'danger'}`}>
                          {purchase.accounts_payables[0].status === 'paid' ? 'Pagado' : purchase.accounts_payables[0].status === 'partial' ? 'Pago Parcial' : 'Por Pagar'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="hide-on-mobile action-buttons" style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        className="btn-view"
                        onClick={() => setSelectedPurchase(purchase)}
                        title="Ver Detalles"
                      >
                        <Eye size={16} />
                      </button>

                      <CanAccess permission="receive_inventory">
                        {purchase.status === 'pending' && (
                          <Link
                            to={`/dashboard/purchases/receive/${purchase.id}`}
                            className="btn-convert"
                            title="Recepcionar MercaderÃ­a"
                          >
                            <Package size={16} />
                          </Link>
                        )}
                      </CanAccess>

                      <CanAccess permission="cancel_purchases">
                        {purchase.status === 'pending' && (
                          <button
                            className="btn-delete"
                            onClick={() => handleCancel(purchase.id)}
                            title="Anular Compra"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </CanAccess>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}






