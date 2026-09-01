import { useState, useEffect } from "react";
import { Search, Filter, ShoppingCart, Eye, Trash2, CheckCircle, Bell, RefreshCw, Plus, Edit, Truck } from "lucide-react";
import { toast } from "react-hot-toast";
import { getCarts, deleteCart, convertCartToSale, sendCartReminder, convertCartToOrder, restoreCart } from "../../../../api/admin/carts";
import CartDetailsModal from "./CartDetailsModal";
import CartFormModal from "./CartFormModal";
import CanAccess from "../../../../components/ui/CanAccess";
import ConfirmModal from "../../../../components/ui/ConfirmModal";
import "./Carts.css";

import CustomSelect from '../../../../components/ui/CustomSelect';
import { useNavigate } from 'react-router-dom';

export default function Carts() {
  const navigate = useNavigate();
  const [carts, setCarts] = useState([]);
  const [successModalData, setSuccessModalData] = useState({ isOpen: false, scheduleId: null, details: null, mappedType: null });
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
    date_to: "",
    sortBy: "created_at",
    sortDir: "desc"
  });
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCart, setSelectedCart] = useState(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCart, setEditingCart] = useState(null);

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

  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    type: '', 
    cartId: null, 
    title: '', 
    message: '' 
  });

  const handleDeleteClick = (id) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      cartId: id,
      title: 'Eliminar Proforma',
      message: '¿Estás seguro de eliminar permanentemente esta proforma? Esta acción no se puede deshacer.'
    });
  };

  const handleConvertClick = (id) => {
    setConfirmModal({
      isOpen: true,
      type: 'convert',
      cartId: id,
      title: 'Convertir a Venta',
      message: '¿Convertir esta proforma en una venta exitosa? El stock se descontará de forma definitiva.'
    });
  };

  const handleConvertToOrderClick = (id) => {
    setConfirmModal({
      isOpen: true,
      type: 'convert_order',
      cartId: id,
      title: 'Convertir a Entrega',
      message: '¿Convertir esta proforma en una entrega pendiente? Podrás completar los datos de envío desde la página de Entregas.'
    });
  };

  const handleConfirmAction = async () => {
    const { type, cartId } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });
    
    if (type === 'delete') {
      try {
        await deleteCart(cartId);
        toast.success("Carrito eliminado correctamente");
        fetchCarts(filters);
      } catch (error) {
        toast.error("Error al eliminar carrito");
      }
    } else if (type === 'convert') {
      try {
        await convertCartToSale(cartId);
        toast.success("Convertido a venta exitosamente");
        fetchCarts(filters);
      } catch (error) {
        toast.error("Error al convertir carrito");
      }
    } else if (type === 'convert_order') {
      try {
        const response = await convertCartToOrder(cartId);
        setSuccessModalData({
          isOpen: true,
          scheduleId: response.data.schedule_id,
          details: response.data.applied_details,
          mappedType: response.data.mapped_type
        });
        toast.success("Convertido a entrega pendiente exitosamente");
        fetchCarts(filters);
      } catch (error) {
        const msg = error?.response?.data?.error || "Error al convertir a entrega";
        toast.error(msg);
      }
    }
  };

  const handleReminder = async (cart) => {
    let phone = "";
    let name = "Cliente";
    
    if (cart.customer) {
      if (cart.customer.user?.profile) {
         phone = cart.customer.user.profile.phone;
         name = cart.customer.user.profile.first_name || name;
      } else if (cart.customer.posProfile) {
         phone = cart.customer.posProfile.whatsapp_phone || cart.customer.posProfile.phone;
         name = cart.customer.posProfile.first_name || name;
      }
    } else if (cart.guest) {
      phone = cart.guest.whatsapp_phone;
      name = cart.guest.name || name;
    }

    if (!phone) {
      toast.error("El cliente no tiene un número de WhatsApp registrado.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Hola ${name}, te contactamos de VOXman. Notamos que tienes un carrito de compras activo con algunos artículos. ¿Podemos ayudarte en algo para que concretes tu pedido?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');

    try {
      await sendCartReminder(cart.id);
      toast.success("Redirigiendo a WhatsApp...");
    } catch (error) {
      console.error(error);
    }
  };

  const handleRestore = async (id) => {
    if (window.confirm("¿Seguro que deseas restaurar este carrito? Se extenderá su fecha de vencimiento.")) {
      try {
        await restoreCart(id);
        toast.success("Carrito restaurado exitosamente.");
        fetchCarts(filters);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Error al restaurar carrito.");
      }
    }
  };

  const handleViewDetails = (cart) => {
    setSelectedCart(cart);
    setIsDetailsOpen(true);
  };

  const handleReopenSuccessModal = (cart) => {
    if (cart.delivery_details && cart.delivery_details.converted_schedule_id) {
      setSuccessModalData({
        isOpen: true,
        scheduleId: cart.delivery_details.converted_schedule_id,
        details: cart.delivery_details,
        mappedType: cart.delivery_details.converted_mapped_type
      });
    } else {
      toast.error("Datos de conversión no encontrados.");
    }
  };

  const handleOpenForm = (cart = null) => {
    setEditingCart(cart);
    setIsFormOpen(true);
  };
  
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    toast.success(editingCart ? "Proforma actualizada" : "Proforma creada exitosamente");
    fetchCarts(filters);
  };

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title">
          <ShoppingCart size={28} className="text-primary" />
          Carritos y Proformas
        </h1>
        <div className="products-header-actions carts-header-actions">
          <CanAccess permission="create_carts">
            <button className="btn-primary" onClick={() => handleOpenForm(null)}>
              <Plus size={18} /> Nueva Proforma
            </button>
          </CanAccess>
          <button className="btn-secondary" onClick={() => fetchCarts(filters)} title="Actualizar">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="metrics-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(33, 150, 243, 0.1)', color: '#1e88e5' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Proformas Activas</div>
            <div className="metric-value">{summary.active_proformas}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(156, 39, 176, 0.1)', color: '#8e24aa' }}>
            <Filter size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Valor en Proformas</div>
            <div className="metric-value">Bs. {Number(summary.proformas_value || 0).toFixed(2)}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#43a047' }}>
            <CheckCircle size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Valor Convertido</div>
            <div className="metric-value">Bs. {Number(summary.converted_value || 0).toFixed(2)}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(244, 67, 54, 0.1)', color: '#e53935' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Monto Abandonado</div>
            <div className="metric-value">Bs. {Number(summary.abandoned_value || 0).toFixed(2)}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrapper" style={{ background: 'rgba(255, 152, 0, 0.1)', color: '#fb8c00' }}>
            <Filter size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Ticket Promedio</div>
            <div className="metric-value">Bs. {Number(summary.average_value || 0).toFixed(2)}</div>
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
              <CustomSelect 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Todos los Estados</option>
                <option value="active">Activo</option>
                <option value="abandoned">Abandonado</option>
                <option value="proforma">Proforma</option>
                <option value="converted">Convertido</option>
              </CustomSelect>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Origen</label>
              <CustomSelect 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              >
                <option value="">Todos los Orígenes</option>
                <option value="store">Tienda Física</option>
                <option value="web">Tienda Web</option>
                <option value="mobile">App Móvil</option>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Ordenar por</label>
              <CustomSelect 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <option value="created_at">Fecha de Creación</option>
                <option value="status">Estado</option>
                <option value="source">Origen</option>
              </CustomSelect>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Dirección</label>
              <CustomSelect 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.sortDir}
                onChange={(e) => setFilters({ ...filters, sortDir: e.target.value })}
              >
                <option value="desc">Descendente</option>
                <option value="asc">Ascendente</option>
              </CustomSelect>
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
                <th>Fecha Creado</th>
                <th>Vencimiento</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {carts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No se encontraron carritos ni proformas.
                  </td>
                </tr>
              ) : (
                carts.map(cart => (
                  <tr key={cart.id}>
                    <td style={{ fontWeight: 600 }}>{cart.reference_number || "Sin Ref."}</td>
                    <td>
                      {cart.customer 
                        ? (cart.customer.user 
                            ? (cart.customer.user.profile?.first_name + " " + (cart.customer.user.profile?.last_name_paternal || "")) 
                            : (cart.customer.posProfile?.first_name + " " + (cart.customer.posProfile?.last_name_paternal || ""))) 
                        : "Anónimo"}
                    </td>
                    <td style={{ fontWeight: 600 }}>Bs. {Number(cart.total_amount_calculated).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${cart.status}`}>
                        {cart.status === 'active' && 'Carrito Web (Activo)'}
                        {cart.status === 'abandoned' && 'Abandonado'}
                        {cart.status === 'proforma' && 'Proforma (Manual)'}
                        {cart.status === 'converted' && 'Venta Concretada'}
                        {cart.status === 'ordered' && 'Convertido a Entrega'}
                      </span>
                    </td>
                    <td>
                      <span className="source-badge">{cart.source}</span>
                    </td>
                    <td>
                      {new Date(cart.created_at).toLocaleDateString()} {new Date(cart.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td style={{ color: cart.expires_at && new Date(cart.expires_at) < new Date() ? '#ef4444' : 'inherit' }}>
                      {cart.expires_at 
                        ? `${new Date(cart.expires_at).toLocaleDateString()} ${new Date(cart.expires_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
                        : '-'}
                    </td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn-view" onClick={() => handleViewDetails(cart)} title="Ver Detalles">
                        <Eye size={18} />
                      </button>
                      <CanAccess permission="edit_carts">
                        {(cart.status !== 'converted' && cart.status !== 'ordered') && (
                          <button className="btn-edit" onClick={() => handleOpenForm(cart)} title="Editar Proforma" style={{ background: 'none', border: 'none', color: 'var(--color-warning)', cursor: 'pointer' }}>
                            <Edit size={18} />
                          </button>
                        )}
                      </CanAccess>
                      {(cart.status === 'proforma' || cart.status === 'active') && (
                        <>
                          <CanAccess permission="convert_carts">
                            <button className="btn-convert" onClick={() => handleConvertClick(cart.id)} title="Convertir a Venta">
                              <CheckCircle size={18} />
                            </button>
                          </CanAccess>
                          <CanAccess permission="create_orders">
                            <button className="btn-convert-order" onClick={() => handleConvertToOrderClick(cart.id)} title="Convertir a Entrega">
                              <Truck size={18} />
                            </button>
                          </CanAccess>
                        </>
                      )}
                      {cart.status === 'ordered' && (
                        <button className="btn-convert-order" onClick={() => handleReopenSuccessModal(cart)} title="Ver detalles de la conversión">
                          <Truck size={18} />
                        </button>
                      )}
                      {(cart.status === 'abandoned' || cart.status === 'active') && (
                        <CanAccess permission="send_cart_reminders">
                          <button className="btn-reminder" onClick={() => handleReminder(cart)} title="Enviar Recordatorio">
                            <Bell size={18} />
                          </button>
                        </CanAccess>
                      )}
                      {cart.expires_at && new Date(cart.expires_at) < new Date() && cart.status !== 'converted' && cart.status !== 'ordered' && (
                        <CanAccess permission="edit_carts">
                          <button className="btn-restore" onClick={() => handleRestore(cart.id)} title="Restaurar Carrito" style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>
                            <RefreshCw size={18} />
                          </button>
                        </CanAccess>
                      )}
                      <CanAccess permission="delete_carts">
                        <button className="btn-delete" onClick={() => handleDeleteClick(cart.id)} title="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      </CanAccess>
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
          onEdit={(cart) => handleOpenForm(cart)}
          onConvert={(id) => handleConvertClick(id)}
          onConvertOrder={(id) => handleConvertToOrderClick(id)}
          onReminder={(cartObj) => handleReminder(cartObj)}
          onDelete={(id) => handleDeleteClick(id)}
          onRestore={(id) => handleRestore(id)}
        />
      )}

      {isFormOpen && (
        <CartFormModal 
          cart={editingCart}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type === 'delete' ? 'danger' : 'success'}
        confirmText={confirmModal.type === 'delete' ? 'Eliminar' : 'Convertir'}
      />

      {successModalData.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <CheckCircle size={48} color="#10b981" />
            </div>
            <h2 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Aplicación correcta</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              La entrega se ha creado correctamente. A continuación los datos aplicados:
            </p>
            
            <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '8px', textAlign: 'left', marginBottom: '24px', fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}><strong>Tipo asignado:</strong> <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{successModalData.mappedType}</span></div>
              {successModalData.details && Object.entries(successModalData.details).map(([key, value]) => (
                <div key={key} style={{ marginTop: '4px' }}>
                  <strong>{key}:</strong> {value}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setSuccessModalData({ isOpen: false, scheduleId: null, details: null, mappedType: null })}
              >
                Cerrar
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setSuccessModalData({ isOpen: false, scheduleId: null, details: null, mappedType: null });
                  navigate(`/dashboard/orders?open_schedule=${successModalData.scheduleId}`);
                }}
              >
                Ir a la Entrega
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
