import React, { useState, useEffect } from "react";
import { Search, DollarSign, Clock, CheckCircle, RefreshCw, Eye, FileText, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import { getAccountsPayable, getAccountsPayableStats } from "../../../../../api/admin/accountsPayable";
import { Link } from "react-router-dom";
import Spinner from "../../../components/Spinner/Spinner";
import ViewPurchaseModal from "../ViewPurchaseModal";
import "../Purchases.css";
import "./AccountsPayable.css";

export default function AccountsPayableList() {
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState(null); // Para reutilizar el modal de compra

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
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/dashboard/purchases" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <FileText size={16} /> Volver a Compras
          </Link>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deuda Total Pendiente</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={16} /></div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Bs. {Number(stats.total_debt).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
          
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Abonado (Histórico)</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={16} /></div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Bs. {Number(stats.total_paid_historical).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deudas Vencidas</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={16} /></div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>{stats.overdue_count}</div>
          </div>
        </div>
      )}

      <div className="purchases-filters">
        <div className="purchases-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por Proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="purchases-search-input"
          />
        </div>
        <select 
          className="purchase-form-select" 
          style={{ width: '200px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Por Pagar</option>
          <option value="partial">Pago Parcial</option>
          <option value="paid">Pagado Completo</option>
        </select>
        <button className="btn-secondary" onClick={fetchAccounts} title="Actualizar" style={{ padding: '10px' }}>
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="purchases-table-container">
        <table className="purchases-table">
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
                  <tr key={acc.id} style={{ background: isOverdue ? 'rgba(239,68,68,0.02)' : 'transparent' }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{acc.supplier?.name || "Desconocido"}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{acc.supplier?.contact_name}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{acc.purchase?.invoice_number || "Sin factura"}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {acc.purchase?.id?.split('-')[0]}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isOverdue ? 'var(--color-danger)' : 'var(--text-main)', fontWeight: isOverdue ? 600 : 400 }}>
                        {isOverdue && <AlertTriangle size={14} />}
                        {new Date(acc.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>Bs. {Number(acc.total_amount).toFixed(2)}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 500 }}>Bs. {Number(acc.paid_amount).toFixed(2)}</td>
                    <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Bs. {Number(acc.balance).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${acc.status === 'paid' ? 'success' : acc.status === 'partial' ? 'warning' : 'danger'}`}>
                        {acc.status === 'paid' ? 'Pagado' : acc.status === 'partial' ? 'Pago Parcial' : 'Por Pagar'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '6px 12px', opacity: acc.status === 'paid' ? 0.5 : 1 }}
                          onClick={() => {
                            const fullPurchase = { ...acc.purchase, accounts_payables: [acc] };
                            setSelectedPurchase(fullPurchase);
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
