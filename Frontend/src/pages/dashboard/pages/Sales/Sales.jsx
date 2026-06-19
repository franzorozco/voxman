import { useState, useEffect } from "react";
import { Search, Eye, Filter, CheckCircle, XCircle, ShoppingBag, Clock, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import { getSales } from "../../../../api/admin/sales";
import SaleDetailsModal from "./SaleDetailsModal";
import { Link } from "react-router-dom";
// import CanAccess from "../../../../components/ui/CanAccess";
import "../Customers/Customers.css";
import "./Sales.css";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const { data } = await getSales(params);
      // Paginacion viene en data.data, si no es paginado, es data
      setSales(data.data || data);
    } catch (error) {
      toast.error("Error al cargar ventas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [search, statusFilter]);

  const openDetailsModal = (id) => {
    setSelectedSaleId(id);
    setIsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setSelectedSaleId(null);
    setIsModalOpen(false);
    fetchSales();
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="status-badge status-success"><CheckCircle size={14} style={{marginRight: '4px'}}/> Completada</span>;
      case 'pending':
        return <span className="status-badge status-warning"><Clock size={14} style={{marginRight: '4px'}}/> Pendiente</span>;
      case 'cancelled':
        return <span className="status-badge status-danger"><XCircle size={14} style={{marginRight: '4px'}}/> Cancelada</span>;
      case 'refunded':
        return <span className="status-badge status-info"><RotateCcw size={14} style={{marginRight: '4px'}}/> Reembolsada</span>;
      default:
        return <span className="status-badge status-secondary">{status}</span>;
    }
  };

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShoppingBag size={24} />
          Ventas
        </h1>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por N° Factura..."
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              <option value="completed">Completadas</option>
              <option value="pending">Pendientes</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Factura / ID</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th>Productos</th>
              <th>Pagos</th>
              <th>Total</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Cargando ventas...</td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No se encontraron ventas</td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sale.invoice_number || 'S/N'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sale.source || 'Tienda'}</div>
                  </td>
                  <td>
                    {new Date(sale.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td>
                    {sale.customer?.user?.profile ? (
                      <div style={{ fontWeight: 500 }}>
                        {sale.customer.user.profile.first_name} {sale.customer.user.profile.last_name_paternal}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)' }}>Cliente Ocasional</div>
                    )}
                  </td>
                  <td>
                    {sale.user?.profile ? (
                      <div style={{ fontWeight: 500 }}>
                        {sale.user.profile.first_name} {sale.user.profile.last_name_paternal}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)' }}>N/A</div>
                    )}
                  </td>
                  <td>
                    {(sale.sale_details && sale.sale_details.length > 0) || (sale.giftcard_transactions && sale.giftcard_transactions.length > 0) ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {(sale.sale_details?.reduce((sum, d) => sum + d.quantity, 0) || 0) + (sale.giftcard_transactions?.length || 0)} items
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                          {[
                            ...(sale.sale_details || []).map(d => d.giftcard ? `Giftcard ${d.giftcard.code || ''}` : d.product_variant?.product?.name),
                            ...(sale.giftcard_transactions || []).map(t => `Giftcard ${t.giftcard?.code || ''}`)
                          ].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)' }}>Sin productos</div>
                    )}
                  </td>
                  <td>
                    {sale.payments && sale.payments.length > 0 ? (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {sale.payments.map(p => (
                          <span key={p.id} className="status-badge" style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '2px 6px', fontSize: '11px' }}>
                            {p.payment_method?.name || 'Otro'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)' }}>Pendiente</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      Bs. {parseFloat(sale.total).toFixed(2)}
                    </div>
                    {parseFloat(sale.discount_total) > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--status-danger)' }}>
                        Desc: -Bs. {parseFloat(sale.discount_total).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td>
                    {renderStatusBadge(sale.status)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                      <button
                        className="action-btn view-btn"
                        onClick={() => openDetailsModal(sale.id)}
                        title="Ver Detalles"
                      >
                        <Eye size={18} />
                      </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedSaleId && (
        <SaleDetailsModal 
          saleId={selectedSaleId} 
          onClose={closeDetailsModal} 
        />
      )}
    </div>
  );
}
