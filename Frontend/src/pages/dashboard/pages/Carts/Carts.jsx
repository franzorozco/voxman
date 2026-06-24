import { useState, useEffect } from "react";
import { Search, Filter, ShoppingCart, Eye, Trash2, CheckCircle, Bell, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { getCarts, deleteCart, convertCartToSale, sendCartReminder } from "../../../../api/admin/carts";
import CartDetailsModal from "./CartDetailsModal";
import "./Carts.css";

export default function Carts() {
  const [carts, setCarts] = useState([]);
  const [summary, setSummary] = useState({
    abandoned_value: 0,
    active_proformas: 0,
    conversion_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    source: "",
    date_from: "",
    date_to: ""
  });
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCart, setSelectedCart] = useState(null);

  const fetchCarts = async (currentFilters) => {
    try {
      setLoading(true);
      const { data } = await getCarts(currentFilters);
      setCarts(data.data.data); // data is paginated
      setSummary(data.summary);
    } catch (error) {
      toast.error("Error al cargar carritos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts(filters);
  }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este carrito/proforma permanentemente?")) return;
    try {
      await deleteCart(id);
      toast.success("Carrito eliminado correctamente");
      fetchCarts(filters);
    } catch (error) {
      toast.error("Error al eliminar carrito");
    }
  };

  const handleConvert = async (id) => {
    if (!window.confirm("¿Convertir esta proforma en venta exitosa?")) return;
    try {
      await convertCartToSale(id);
      toast.success("Convertido a venta exitosamente");
      fetchCarts(filters);
    } catch (error) {
      toast.error("Error al convertir carrito");
    }
  };

  const handleReminder = async (id) => {
    try {
      await sendCartReminder(id);
      toast.success("Recordatorio enviado al cliente");
    } catch (error) {
      toast.error("Error al enviar recordatorio");
    }
  };

  const handleViewDetails = (cart) => {
    setSelectedCart(cart);
    setIsDetailsOpen(true);
  };

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title">
          <ShoppingCart size={28} className="text-primary" />
          Carritos y Proformas
        </h1>
        <button className="btn-secondary" onClick={() => fetchCarts(filters)} title="Actualizar">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="metrics-container">
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(244, 67, 54, 0.1)', color: '#e53935' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Monto Abandonado</div>
            <div className="metric-value">Bs. {Number(summary.abandoned_value).toFixed(2)}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(33, 150, 243, 0.1)', color: '#1e88e5' }}>
            <Filter size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Proformas Activas</div>
            <div className="metric-value">{summary.active_proformas}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#43a047' }}>
            <CheckCircle size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Tasa de Conversión</div>
            <div className="metric-value">{summary.conversion_rate}%</div>
          </div>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner" style={{ marginBottom: showFilters ? '15px' : '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar por referencia, ej. PROF-001..." 
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
              <select 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Todos los Estados</option>
                <option value="active">Activo</option>
                <option value="abandoned">Abandonado</option>
                <option value="proforma">Proforma</option>
                <option value="converted">Convertido</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Origen</label>
              <select 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              >
                <option value="">Todos los Orígenes</option>
                <option value="store">Tienda Física</option>
                <option value="web">Tienda Web</option>
                <option value="mobile">App Móvil</option>
              </select>
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
          <div className="loading-state">Cargando datos...</div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Origen</th>
                <th>Fecha</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {carts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No se encontraron carritos ni proformas.
                  </td>
                </tr>
              ) : (
                carts.map(cart => (
                  <tr key={cart.id}>
                    <td style={{ fontWeight: 600 }}>{cart.reference_number || "Sin Ref."}</td>
                    <td>{cart.user ? (cart.user.profile?.first_name + " " + cart.user.profile?.last_name) : "Anónimo"}</td>
                    <td style={{ fontWeight: 600 }}>Bs. {Number(cart.total_amount_calculated).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${cart.status}`}>
                        {cart.status === 'active' && 'Activo'}
                        {cart.status === 'abandoned' && 'Abandonado'}
                        {cart.status === 'proforma' && 'Proforma'}
                        {cart.status === 'converted' && 'Convertido'}
                      </span>
                    </td>
                    <td>
                      <span className="source-badge">{cart.source}</span>
                    </td>
                    <td>{new Date(cart.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn-view" onClick={() => handleViewDetails(cart)} title="Ver Detalles">
                        <Eye size={18} />
                      </button>
                      {cart.status !== 'converted' && (
                        <button className="btn-convert" onClick={() => handleConvert(cart.id)} title="Convertir a Venta">
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {cart.status === 'abandoned' && (
                        <button className="btn-reminder" onClick={() => handleReminder(cart.id)} title="Enviar Recordatorio">
                          <Bell size={18} />
                        </button>
                      )}
                      <button className="btn-delete" onClick={() => handleDelete(cart.id)} title="Eliminar">
                        <Trash2 size={18} />
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
        <CartDetailsModal 
          cart={selectedCart} 
          onClose={() => setIsDetailsOpen(false)} 
        />
      )}
    </div>
  );
}
