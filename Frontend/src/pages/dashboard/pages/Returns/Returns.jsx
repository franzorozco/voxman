import { getImageUrl } from '../../../../utils/imageUtils';
import { useState, useEffect } from "react";
import { Search, Filter, RefreshCw, Eye, Undo2, DollarSign, PackageOpen, MoreVertical, Package, RotateCcw } from "lucide-react";
import RowDropdown from "../../../../components/ui/RowDropdown";
import { toast } from "react-hot-toast";
import { getReturns } from "../../../../api/admin/returns";
import { API_BASE_URL } from '../../../../config/api';
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
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    date_from: "",
    date_to: ""
  });

  const hasActiveFilters = Boolean(
    filters.status ||
    filters.date_from ||
    filters.date_to
  );

  const activeFiltersCount = [filters.status, filters.date_from, filters.date_to].filter(Boolean).length;

  const handleClearFilters = () => {
    setFilters(prev => ({
      ...prev,
      status: "",
      date_from: "",
      date_to: ""
    }));
  };
  
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
        <h1 className="products-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Undo2 size={24} className="text-primary" />
          Devoluciones
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="action-btn primary" 
            style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', color: 'var(--color-primary-text)', background: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => fetchReturns(filters)}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span className="hide-on-mobile">Actualizar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="returns-kpi-grid">
        <div className="returns-kpi-card kpi-total">
          <div className="returns-kpi-top">
            <span className="returns-kpi-value">{returnsList ? returnsList.length : 0}</span>
          </div>
          <div className="returns-kpi-bottom">
            <div className="returns-kpi-icon-mini">
              <Package size={14} />
            </div>
            <span className="returns-kpi-label">Total Casos</span>
          </div>
        </div>

        <div className="returns-kpi-card kpi-pending">
          <div className="returns-kpi-top">
            <span className="returns-kpi-value">{summary.pending_returns}</span>
          </div>
          <div className="returns-kpi-bottom">
            <div className="returns-kpi-icon-mini">
              <PackageOpen size={14} />
            </div>
            <span className="returns-kpi-label">Casos Pendientes</span>
          </div>
        </div>

        <div className="returns-kpi-card kpi-refunded">
          <div className="returns-kpi-top">
            <span className="returns-kpi-value">Bs. {Number(summary.total_refunded || 0).toFixed(2)}</span>
          </div>
          <div className="returns-kpi-bottom">
            <div className="returns-kpi-icon-mini">
              <DollarSign size={14} />
            </div>
            <span className="returns-kpi-label">Monto Reembolsado</span>
          </div>
        </div>

        <div className="returns-kpi-card kpi-rate">
          <div className="returns-kpi-top">
            <span className="returns-kpi-value">{summary.return_rate || 0}%</span>
          </div>
          <div className="returns-kpi-bottom">
            <div className="returns-kpi-icon-mini">
              <RotateCcw size={14} />
            </div>
            <span className="returns-kpi-label">Tasa Devolución</span>
          </div>
        </div>
      </div>

      <div className="returns-filters-container">
        <div className="returns-filters-container-inner">
          <div className="returns-search-wrapper">
            <Search size={18} className="returns-search-icon" />
            <input 
              className="returns-search-input"
              placeholder="Buscar por referencia, ej. DEV-001..." 
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button 
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`returns-filter-toggle-btn ${showFilters ? 'active' : ''}`}
            title="Alternar filtros"
          >
            <Filter size={18} />
            <span className="hide-on-mobile">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="returns-filter-badge">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="returns-filters-panel">
            <div className="returns-filter-group">
              <label className="returns-filter-label">Estado</label>
              <CustomSelect 
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

            <div className="returns-filter-group">
              <label className="returns-filter-label">Desde Fecha</label>
              <input 
                type="date"
                className="returns-filter-date-input"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>

            <div className="returns-filter-group">
              <label className="returns-filter-label">Hasta Fecha</label>
              <input 
                type="date"
                className="returns-filter-date-input"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>

            {hasActiveFilters && (
              <div className="returns-filter-actions">
                <button 
                  type="button"
                  onClick={handleClearFilters}
                  className="returns-filter-clear-btn"
                >
                  <RefreshCw size={14} />
                  Limpiar Filtros
                </button>
              </div>
            )}
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
                <th className="actions-col" style={{ textAlign: 'right' }}>Acción</th>
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
                    <td className="first-col-mobile">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div className="hide-on-pc">
                            <RowDropdown rowId={ret.id} activeId={activeDropdown} setActiveId={setActiveDropdown}>
                              <button onClick={() => handleViewDetails(ret)} style={{ background: "transparent", border: "none", padding: "10px 12px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--text-main)", width: "100%", fontSize: "14px" }}>
                              <Eye size={16} /> Ver / Gestionar
                            </button>
                            </RowDropdown>
                          </div>
                        <span style={{ fontWeight: 600 }}>{ret.reference_number || "S/N"}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{ret.sale_detail?.sale?.invoice_number || "Venta Original"}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {ret.sale_detail?.sale?.customer ? (
                          ret.sale_detail.sale.customer.user?.profile ? 
                            `${ret.sale_detail.sale.customer.user.profile.first_name} ${ret.sale_detail.sale.customer.user.profile.last_name_paternal || ''}` : 
                          (ret.sale_detail.sale.customer.pos_profile || ret.sale_detail.sale.customer.posProfile) ? 
                            `${(ret.sale_detail.sale.customer.pos_profile || ret.sale_detail.sale.customer.posProfile).first_name} ${(ret.sale_detail.sale.customer.pos_profile || ret.sale_detail.sale.customer.posProfile).last_name_paternal || ''}` :
                          "Cliente sin perfil"
                        ) : ret.sale_detail?.sale?.guest ? ret.sale_detail.sale.guest.name : "N/A"}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(() => {
                          const variant = ret.sale_detail?.product_variant;
                          const product = variant?.product;
                          const colorId = variant?.variant_attribute_values?.[0]?.attribute_value_id;
                          const colorImg = product?.attribute_value_images?.find(img => img.attribute_value_id === colorId);
                          let imageUrl = variant?.variant_images?.[0]?.url || colorImg?.url || product?.product_images?.find(img => img.is_main)?.url || product?.product_images?.[0]?.url;
                          if (imageUrl && !imageUrl.startsWith('http')) {
                            imageUrl = getImageUrl(imageUrl);
                          }
                          
                          return imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt="Variant" 
                              style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                            />
                          ) : (
                            <div style={{ width: '32px', height: '32px', background: 'var(--border-color)', borderRadius: '4px' }}></div>
                          );
                        })()}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{ret.sale_detail?.product_variant?.product?.name || "Desconocido"}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Talla: {ret.sale_detail?.product_variant?.size?.name || "N/A"} | Fit: {ret.sale_detail?.product_variant?.fit?.name || "N/A"} | Color: {ret.sale_detail?.product_variant?.variant_attribute_values?.[0]?.attribute_value?.value || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>
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
                    <td className="actions-col" style={{ textAlign: 'right' }}>
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


