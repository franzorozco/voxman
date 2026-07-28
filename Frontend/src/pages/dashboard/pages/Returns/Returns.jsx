import { useState, useEffect } from "react";
import { Search, Filter, RefreshCw, Eye, Undo2, DollarSign, PackageOpen } from "lucide-react";
import { toast } from "react-hot-toast";
import { getReturns } from "../../../../api/admin/returns";
import ReturnDetailsModal from "./ReturnDetailsModal";
import "./Returns.css";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function Returns() {
  const [returnsList, setReturnsList] = useState([]);
  const [summary, setSummary] = useState({
    total_refunded: 0,
    pending_returns: 0,
    return_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    date_from: "",
    date_to: ""
  });
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const fetchReturns = async (currentFilters) => {
    try {
      setLoading(true);
      const { data } = await getReturns(currentFilters);
      setReturnsList(data.data.data); // data is paginated
      setSummary(data.summary);
    } catch (error) {
      toast.error("Error al cargar devoluciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns(filters);
  }, [filters]);

  const handleViewDetails = (ret) => {
    setSelectedReturn(ret);
    setIsDetailsOpen(true);
  };

  const handleModalClose = (wasUpdated) => {
    setIsDetailsOpen(false);
    if (wasUpdated) {
      fetchReturns(filters);
    }
  };

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title">
          <Undo2 size={28} className="text-primary" />
          Devoluciones
        </h1>
        <button className="btn-secondary" onClick={() => fetchReturns(filters)} title="Actualizar">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="metrics-container">
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }}>
            <PackageOpen size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Casos Pendientes</div>
            <div className="metric-value">{summary.pending_returns}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}>
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Monto Reembolsado</div>
            <div className="metric-value">Bs. {Number(summary.total_refunded).toFixed(2)}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}>
            <Filter size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Tasa de Devolución</div>
            <div className="metric-value">{summary.return_rate}%</div>
          </div>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner" style={{ marginBottom: showFilters ? '15px' : '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar por referencia, ej. DEV-001..." 
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: showFilters ? 'var(--color-primary)' : 'var(--bg-card)', color: showFilters ? 'var(--color-primary-text)' : 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
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
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Todos los Estados</option>
                <option value="pending">Pendiente</option>
                <option value="inspection">En Inspección</option>
                <option value="approved">Aprobado / Reembolsado</option>
                <option value="rejected">Rechazado</option>
              </CustomSelect>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Desde Fecha</label>
              <input 
                type="date"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Hasta Fecha</label>
              <input 
                type="date"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">Cargando devoluciones...</div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Ref.</th>
                <th>Venta / Cliente</th>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Estado</th>
                <th>Reembolso</th>
                <th>Fecha</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {returnsList.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No se encontraron devoluciones.
                  </td>
                </tr>
              ) : (
                returnsList.map(ret => (
                  <tr key={ret.id}>
                    <td style={{ fontWeight: 600 }}>{ret.reference_number || "S/N"}</td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{ret.sale_detail?.sale?.invoice_number || "Venta Original"}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {ret.sale_detail?.sale?.customer ? (ret.sale_detail.sale.customer.first_name + " " + ret.sale_detail.sale.customer.last_name) : "Cliente Anónimo"}
                      </div>
                    </td>
                    <td>{ret.sale_detail?.product_variant?.product?.name || "Desconocido"}</td>
                    <td style={{ fontWeight: 600 }}>{ret.quantity}</td>
                    <td>
                      <span className={`status-badge status-${ret.status}`}>
                        {ret.status === 'pending' && 'Pendiente'}
                        {ret.status === 'inspection' && 'Inspección'}
                        {ret.status === 'approved' && 'Aprobado'}
                        {ret.status === 'rejected' && 'Rechazado'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: ret.status === 'approved' ? '#4caf50' : 'inherit' }}>
                      {ret.refund_amount ? `Bs. ${Number(ret.refund_amount).toFixed(2)}` : "-"}
                    </td>
                    <td>{new Date(ret.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-view" onClick={() => handleViewDetails(ret)} title="Ver / Gestionar">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isDetailsOpen && (
        <ReturnDetailsModal 
          returnItem={selectedReturn} 
          onClose={handleModalClose} 
        />
      )}
    </div>
  );
}
