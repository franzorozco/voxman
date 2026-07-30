import { useState, useEffect } from "react";
import { getCarts } from "../../../../api/admin/carts";
import { getDeliverySchedules } from "../../../../api/admin/orderNetwork";
import { ShoppingCart, Truck, Calendar, MapPin, Search, Eye, Filter, Download, User, Phone, RefreshCw, Link as LinkIcon, CheckCircle, Plus, MessageCircle } from "lucide-react";
import { toast } from "react-hot-toast";


import DeliveryDetailsModal from "./DeliveryDetailsModal";
import NewOrderModal from "./NewOrderModal";
import DeliveryZonesModal from "./DeliveryZonesModal";
import echo from "../../../../echo";
import "./Orders.css";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function Orders() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state

  const [statusModalSchedule, setStatusModalSchedule] = useState(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isZonesModalOpen, setIsZonesModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    date_from: "",
    date_to: ""
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.current_page };
      if (search) params.search = search;
      if (filters.status) params.status = filters.status;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      
      const { data } = await getDeliverySchedules(params);
      setSchedules(data.data);
      if (data.current_page) {
        setPagination(prev => ({
          ...prev,
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total
        }));
      }
    } catch (error) {
      toast.error("Error al cargar entregas programadas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSchedules();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, filters, pagination.current_page]);

  useEffect(() => {
    const channel = echo.channel('deliveries.global');
    channel.listen('.delivery.status.updated', (data) => {
      fetchSchedules();
    });

    return () => {
      channel.stopListening('.delivery.status.updated');
      echo.leaveChannel('deliveries.global');
    };
  }, [search, filters]);

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendiente",
      assigned: "Agendado",
      on_the_way: "En Camino",
      at_the_meeting_point: "En el Punto",
      completed: "Entregado",
      cancelled: "Cancelado",
      prepared: "Preparado",
      packaged: "Empaquetado",
      shipped: "Remitido (Transporte)"
    };
    return labels[status] || status;
  };

  const groupSchedules = (schedules) => {
    const groups = schedules.reduce((acc, schedule) => {
      const date = schedule.scheduled_date || "Sin fecha";
      if (!acc[date]) acc[date] = [];
      acc[date].push(schedule);
      return acc;
    }, {});

    const sortedDates = Object.keys(groups).sort((a, b) => {
      if (a === "Sin fecha") return 1;
      if (b === "Sin fecha") return -1;

      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (a === todayStr && b !== todayStr) return -1;
      if (b === todayStr && a !== todayStr) return 1;

      const isPastA = a < todayStr;
      const isPastB = b < todayStr;

      if (isPastA && !isPastB) return 1;
      if (isPastB && !isPastA) return -1;

      if (isPastA && isPastB) {
        return new Date(b) - new Date(a); // Pasados: descendente (más recientes primero)
      }

      return new Date(a) - new Date(b); // Futuros: ascendente
    });

    return sortedDates.map(date => {
      const daySchedules = groups[date];
      daySchedules.sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        
        const timeA = a.time_window || "23:59";
        const timeB = b.time_window || "23:59";
        return timeA.localeCompare(timeB);
      });
      
      let dateLabel = date;
      if (date !== "Sin fecha") {
        const d = new Date(date + "T00:00:00");
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (d.getTime() === today.getTime()) dateLabel = "Hoy, " + d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        else if (d.getTime() === tomorrow.getTime()) dateLabel = "Mañana, " + d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        else dateLabel = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        
        dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
      }
      
      return { date, dateLabel, schedules: daySchedules };
    });
  };

  const generateWhatsAppLink = (schedule, phone, name) => {
    if (!phone || phone === "N/A") return "#";
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Extract first name for a friendly greeting
    const firstName = name && name !== "Anónimo" ? name.split(" ")[0] : "";
    const greeting = firstName ? `Hola ${firstName}` : "Hola";
    
    let productDetails = "tus productos";
    if (schedule.shipment?.sale?.sale_details?.length > 0) {
      const details = schedule.shipment.sale.sale_details;
      const productStrings = details.map(d => {
        let productName = d.product_variant?.product?.name || "producto";
        let size = d.product_variant?.size?.name || "";
        let fit = d.product_variant?.fit?.name || "";
        let sizeFit = [size, fit].filter(Boolean).join(" ");
        let qty = d.quantity > 1 ? `${d.quantity} ` : "un ";
        return `${qty}${productName}${sizeFit ? ` en talla ${sizeFit}` : ""}`;
      });
      productDetails = productStrings.join(", ");
    }
    
    const trackingUrl = `${window.location.origin}/tracking/${schedule.id}`;
    let message = "";
    
    const isDelivery = schedule.shipment?.delivery_type === 'home_delivery';
    const placeText = isDelivery ? "tu domicilio" : "el punto de encuentro";
    const agreedPlaceText = isDelivery ? "tu domicilio" : "el punto acordado";
    
    switch (schedule.status) {
      case "assigned":
        message = `${greeting}, te escribimos de VOXman para confirmarte ${productDetails}, para hacerte la entrega el día ${schedule.scheduled_date} a las ${schedule.time_window || "una hora a convenir"} en ${schedule.meeting_point || agreedPlaceText}. ¿Me confirmas esto por favor? \n\nPuedes ver el estado de tu entrega aquí: ${trackingUrl}`;
        break;
      case "on_the_way":
        message = `${greeting}, te comento que ya estamos en camino a realizar tu entrega amigo.`;
        break;
      case "at_the_meeting_point":
        message = `${greeting}, ya nos encontramos en ${placeText} (${schedule.meeting_point || ""}). Te esperamos.`;
        break;
      case "completed":
        message = `${greeting}, muchas gracias por tu compra de ${productDetails}. ¡Esperamos que lo disfrutes!`;
        break;
      default:
        message = `${greeting}, te escribimos de VOXman respecto a tu pedido. Puedes ver los detalles aquí: ${trackingUrl}`;
    }
    
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Truck size={24} className="text-primary" />
          Pedidos de Redes Sociales
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="action-btn" 
            style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => {
              setEditData(null);
              setIsNewOrderModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span className="hide-on-mobile">Nueva Entrega</span>
          </button>
          <button 
            className="action-btn" 
            style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)', color: 'var(--text-main)', background: 'var(--bg-main)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setIsZonesModalOpen(true)}
          >
            <MapPin size={18} />
            <span className="hide-on-mobile">Puntos de Entrega</span>
          </button>
          
          <button 
            className="action-btn primary" 
            style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', color: 'var(--color-primary-text)', background: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => fetchSchedules()}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span className="hide-on-mobile">Actualizar</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeInUp 0.3s ease' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de Envíos</span>
          <span style={{ color: 'var(--text-main)', fontSize: '28px', fontWeight: 800 }}>{schedules.length || 0}</span>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeInUp 0.4s ease' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pendientes / Agendados</span>
          <span style={{ color: 'var(--text-main)', fontSize: '28px', fontWeight: 800 }}>
            {schedules.filter(s => ['pending', 'assigned'].includes(s.status)).length || 0}
          </span>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeInUp 0.5s ease' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completados</span>
          <span style={{ color: 'var(--text-main)', fontSize: '28px', fontWeight: 800 }}>
            {schedules.filter(s => s.status === 'completed').length || 0}
          </span>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: showFilters ? '15px' : '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar pedido, factura o cliente..."
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          <div className="filters-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado</label>
              <CustomSelect 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Todos los Estados</option>
                <option value="assigned">Agendados</option>
                <option value="on_the_way">En Camino</option>
                <option value="at_the_meeting_point">En el Punto</option>
                <option value="completed">Entregados</option>
                <option value="cancelled">Cancelados</option>
              </CustomSelect>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Desde (Fecha Entrega)</label>
              <input 
                type="date"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', colorScheme: 'dark' }}
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Hasta (Fecha Entrega)</label>
              <input 
                type="date"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', colorScheme: 'dark' }}
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
            
            {(filters.status !== "" || filters.date_from !== "" || filters.date_to !== "") && (
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button 
                  onClick={() => setFilters({ status: "", date_from: "", date_to: "" })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
                >
                  Limpiar Filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="timeline-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Cargando datos...
          </div>
        ) : schedules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            No hay entregas programadas.
          </div>
        ) : (
          groupSchedules(schedules).map((group, groupIdx) => (
            <div key={group.date} className="date-group" style={{ animation: `fadeInUp ${0.3 + groupIdx * 0.1}s ease` }}>
              <div className="date-group-header">
                <div className="date-badge">
                  <Calendar size={16} /> {group.dateLabel}
                </div>
                <div className="date-line"></div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {group.schedules.map(schedule => {
                  const customer = schedule.shipment?.sale?.customer;
                  const guest = schedule.shipment?.sale?.guest;
                  
                  let nameToDisplay = "Anónimo";
                  let phoneToDisplay = "N/A";
                  
                  if (customer) {
                    if (customer.pos_profile) {
                      nameToDisplay = `${customer.pos_profile.first_name} ${customer.pos_profile.last_name_paternal || ''}`.trim();
                      phoneToDisplay = customer.pos_profile.phone || "N/A";
                    } else if (customer.user?.profile) {
                      nameToDisplay = `${customer.user.profile.first_name} ${customer.user.profile.last_name_paternal || ''}`.trim();
                      phoneToDisplay = customer.user.profile.phone || "N/A";
                    } else if (customer.user) {
                      nameToDisplay = customer.user.username || customer.user.email;
                    } else {
                      nameToDisplay = `Cliente ${customer.customer_code}`;
                    }
                  } else if (guest) {
                    nameToDisplay = guest.name || "Invitado";
                    phoneToDisplay = guest.whatsapp_phone || "N/A";
                  }
                  const totalAmount = schedule.shipment?.sale?.total || 0;
                  const isCompleted = schedule.status === 'completed';
                  
                  return (
                    <div key={schedule.id} className={`bubble-row bubble-status-${schedule.status} ${isCompleted ? 'is-completed' : ''}`}>
                      <div className="bubble-left">
                        <span className="bubble-time">{schedule.time_window || "N/A"}</span>
                        <span className="bubble-ref">Ref: {schedule.shipment?.delivery_code || schedule.id.slice(0,8)}</span>
                      </div>
                      
                      <div className="bubble-main">
                        <div className="bubble-main-header">
                            <div className="bubble-customer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={16} style={{ color: 'var(--text-muted)' }} />
                                <span style={{ fontWeight: 600 }}>{nameToDisplay}</span>
                              </div>
                              <span className="separator-pipe" style={{ color: 'var(--border-color)', margin: '0 4px' }}>|</span>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                                <span style={{ fontWeight: 600 }}>{phoneToDisplay}</span>
                              </div>
                              
                              {schedule.shipment?.sale?.customer?.user?.email && (
                                <>
                                  <span className="separator-pipe" style={{ color: 'var(--border-color)', margin: '0 4px' }}>|</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{schedule.shipment.sale.customer.user.email}</span>
                                  </div>
                                </>
                              )}
                              
                              {schedule.shipment?.sale?.customer?.customer_code && (
                                <span style={{ fontSize: '11px', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-muted)', fontWeight: 600, marginLeft: '4px' }}>
                                  Cód: {schedule.shipment.sale.customer.customer_code}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {schedule.shipment?.delivery_type === 'home_delivery' && (
                                  <span style={{ 
                                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', 
                                    color: 'white', 
                                    padding: '4px 12px', 
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    boxShadow: '0 4px 10px rgba(255, 107, 107, 0.3)'
                                  }}>
                                    <Truck size={14} /> A Domicilio
                                  </span>
                                )}
                                {schedule.shipment?.delivery_type === 'external' && (
                                  <span style={{ 
                                    background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)', 
                                    color: 'white', 
                                    padding: '4px 12px', 
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    boxShadow: '0 4px 10px rgba(14, 165, 233, 0.3)'
                                  }}>
                                    <MapPin size={14} /> Nacional
                                  </span>
                                )}
                              <span className={`status-badge status-${schedule.status}`}>
                                {getStatusLabel(schedule.status)}
                              </span>
                            </div>
                        </div>
                        
                        <div className="bubble-info-grid">
                          <div className="info-item">
                            <MapPin size={16} className="icon" />
                            <div>
                              <span>{schedule.shipment?.delivery_type === 'home_delivery' ? 'Dirección de Entrega' : (schedule.shipment?.delivery_type === 'external' ? 'Destino' : 'Punto de Encuentro')}</span>
                              <strong>
                                {schedule.shipment?.delivery_type === 'home_delivery' && schedule.shipment?.address 
                                  ? `${schedule.shipment.address.street}, ${schedule.shipment.address.zone}` 
                                  : (schedule.meeting_point || "No especificado")}
                              </strong>
                            </div>
                          </div>
                          {schedule.shipment?.delivery_type !== 'external' && (
                            <div className="info-item">
                              <Truck size={16} className="icon" />
                              <div>
                                <span>Repartidor</span>
                                <strong>{schedule.driver?.user?.profile?.first_name || 'Sin asignar'}</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bubble-right">
                        <div className="bubble-total">
                          Bs. {Number(totalAmount).toFixed(2)}
                        </div>
                        <div className="bubble-actions">
                          {phoneToDisplay !== "N/A" && (
                            <a 
                              href={generateWhatsAppLink(schedule, phoneToDisplay, nameToDisplay)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="action-btn"
                              style={{ padding: '8px 12px', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px' }}
                              title="Enviar mensaje por WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </a>
                          )}
                          <button 
                            className="action-btn" 
                            style={{ padding: '8px', background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                            onClick={() => {
                              const trackingUrl = `${window.location.origin}/tracking/${schedule.id}`;
                              navigator.clipboard.writeText(trackingUrl);
                              toast.success("Enlace copiado");
                            }}
                            title="Copiar enlace de seguimiento"
                          >
                            <LinkIcon size={16} />
                          </button>
                          <button 
                            className="action-btn primary"
                            style={{ padding: '8px 16px', borderRadius: '8px' }}
                            onClick={() => setStatusModalSchedule(schedule)}
                          >
                            Ver Detalles
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.last_page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px', padding: '15px 0' }}>
          <button
            className="btn-secondary"
            disabled={pagination.current_page === 1}
            onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
            style={{ padding: '8px 16px', borderRadius: '8px' }}
          >
            Anterior
          </button>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
            Página {pagination.current_page} de {pagination.last_page}
          </span>
          <button
            className="btn-secondary"
            disabled={pagination.current_page === pagination.last_page}
            onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
            style={{ padding: '8px 16px', borderRadius: '8px' }}
          >
            Siguiente
          </button>
        </div>
      )}

      {statusModalSchedule && (
        <DeliveryDetailsModal 
          scheduleId={statusModalSchedule.id}
          onClose={() => setStatusModalSchedule(null)}
          onStatusChange={() => {
            fetchSchedules();
          }}
          onEditRequest={(data) => {
            setEditData(data);
            setStatusModalSchedule(null);
            setIsNewOrderModalOpen(true);
          }}
        />
      )}

      {isNewOrderModalOpen && (
        <NewOrderModal 
          editData={editData}
          onClose={() => {
            setIsNewOrderModalOpen(false);
            setEditData(null);
          }}
          onSuccess={() => {
            fetchSchedules();
            setEditData(null);
          }}
        />
      )}

      {isZonesModalOpen && (
        <DeliveryZonesModal 
          onClose={() => setIsZonesModalOpen(false)}
        />
      )}
    </div>
  );
}
