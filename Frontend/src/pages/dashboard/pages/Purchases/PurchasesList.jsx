import { useState, useEffect } from "react";
import { Plus, Search, FileText, XCircle, RefreshCw, Eye, Package } from "lucide-react";
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
  const [selectedPurchase, setSelectedPurchase] = useState(null);

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
      toast.error("Error al cargar órdenes de compra");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [search, statusFilter]);

  const handleCancel = async (id) => {
    if (window.confirm("¿Estás seguro de cancelar esta orden de compra?")) {
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
    <div className="purchases-container">
      {selectedPurchase && (
        <ViewPurchaseModal 
          purchase={selectedPurchase} 
          onClose={() => setSelectedPurchase(null)}
          onUpdate={fetchPurchases}
        />
      )}

      <div className="purchases-header">
        <h1 className="purchases-title">
          <FileText size={28} className="text-primary" />
          Órdenes de Compra
        </h1>

        <div style={{ display: 'flex', gap: '10px' }}>
          <CanAccess permission="create_purchases">
            <Link to="/dashboard/purchases/create" className="btn-primary" style={{ textDecoration: 'none' }}>
              <Plus size={16} />
              Nueva Compra
            </Link>
          </CanAccess>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deuda Total (Cuentas por Pagar)</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={16} /></div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Bs. {Number(stats.total_debt).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
          
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Pagado (Mes)</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={16} /></div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Bs. {Number(stats.monthly_payments).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mercadería Recibida (Mes)</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16} /></div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Bs. {Number(stats.monthly_purchases).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
        </div>
      )}

      <div className="purchases-filters">
        <div className="purchases-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por Nro Factura o Proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="purchases-search-input"
          />
        </div>
        <CustomSelect 
          className="purchase-form-select" 
          style={{ width: '200px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="received">Recepcionados</option>
          <option value="cancelled">Cancelados</option>
        </CustomSelect>
        <button className="btn-secondary" onClick={fetchPurchases} title="Actualizar" style={{ padding: '10px' }}>
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="purchases-table-container">
        <table className="purchases-table">
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
                  <td>{new Date(purchase.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{purchase.supplier?.name || "Desconocido"}</div>
                  </td>
                  <td>{purchase.branch?.name || "-"}</td>
                  <td>{purchase.invoice_number || "-"}</td>
                  <td style={{ fontWeight: 600 }}>${Number(purchase.total).toFixed(2)}</td>
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
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px', minWidth: 'auto' }}
                        onClick={() => setSelectedPurchase(purchase)}
                        title="Ver Detalles"
                      >
                        <Eye size={16} />
                      </button>

                      <CanAccess permission="receive_inventory">
                        {purchase.status === 'pending' && (
                          <Link
                            to={`/dashboard/purchases/receive/${purchase.id}`}
                            className="btn-primary"
                            style={{ padding: '6px', minWidth: 'auto' }}
                            title="Recepcionar Mercadería"
                          >
                            <Package size={16} />
                          </Link>
                        )}
                      </CanAccess>

                      <CanAccess permission="cancel_purchases">
                        {purchase.status === 'pending' && (
                          <button
                            className="btn-remove-item"
                            style={{ padding: '6px', minWidth: 'auto' }}
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
