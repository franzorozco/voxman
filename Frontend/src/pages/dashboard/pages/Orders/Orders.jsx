import { useState, useEffect } from "react";
import { getCarts } from "../../../../api/admin/carts";
import { getDeliverySchedules } from "../../../../api/admin/orderNetwork";
import { ShoppingCart, Truck, Calendar, MapPin, Search, Eye, Filter, Download, User, Phone, RefreshCw, Link as LinkIcon, CheckCircle, Plus } from "lucide-react";
import { toast } from "react-hot-toast";


import DeliveryDetailsModal from "./DeliveryDetailsModal";
import NewOrderModal from "./NewOrderModal";
import DeliveryZonesModal from "./DeliveryZonesModal";
import "./Orders.css";

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

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filters.status) params.status = filters.status;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      
      const { data } = await getDeliverySchedules(params);
      setSchedules(data.data);
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
  }, [search, filters]);

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendiente",
      assigned: "Agendado",
      on_the_way: "En Camino",
      at_the_meeting_point: "En el Punto",
      completed: "Entregado",
      cancelled: "Cancelado"
    };
    return labels[status] || status;
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
              <select 
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
              </select>
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
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Cargando datos...
          </div>
        ) : (
          <table className="orders-table">
                <thead>
                  <tr>
                    <th>Ref. Envío / Venta</th>
                    <th>Cliente / Invitado</th>
                    <th>Repartidor</th>
                    <th>Punto de Encuentro</th>
                    <th>Fecha y Hora</th>
                    <th>Monto Total</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No hay entregas programadas.
                      </td>
                    </tr>
                  ) : (
                    schedules.map(schedule => {
                      const guestName = schedule.shipment?.sale?.guest?.name;
                      const customerName = schedule.shipment?.sale?.customer?.user?.name;
                      const guestPhone = schedule.shipment?.sale?.guest?.whatsapp_phone;
                      const customerPhone = schedule.shipment?.sale?.customer?.phone;
                      
                      const nameToDisplay = guestName || customerName || "Anónimo";
                      const phoneToDisplay = guestPhone || customerPhone || "N/A";
                      const totalAmount = schedule.shipment?.sale?.total || 0;
                      
                      return (
                        <tr key={schedule.id}>
                          <td style={{ fontWeight: 600 }}>{schedule.shipment?.delivery_code || schedule.id.slice(0,8)}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                <User size={14} style={{ color: 'var(--text-muted)' }} />
                                {nameToDisplay}
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tel: {phoneToDisplay}</span>
                            </div>
                          </td>
                          <td>
                            {schedule.driver ? (
                              <span>{schedule.driver.user?.profile?.first_name || 'Conductor asignado'}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                              {schedule.meeting_point || "No especificado"}
                            </div>
                          </td>
                          <td>
                            {schedule.scheduled_date} <br/>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{schedule.time_window}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>Bs. {Number(totalAmount).toFixed(2)}</td>
                          <td>
                            <span className={`status-badge status-${schedule.status}`}>
                              {getStatusLabel(schedule.status)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                className="action-btn" 
                                style={{ padding: '6px 12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                                onClick={() => {
                                  const trackingUrl = `${window.location.origin}/tracking/${schedule.id}`;
                                  navigator.clipboard.writeText(trackingUrl);
                                  toast.success("Enlace copiado");
                                }}
                                title="Copiar enlace de seguimiento"
                              >
                                <LinkIcon size={14} />
                              </button>
                              <button 
                                className="action-btn"
                                style={{ padding: '6px 12px' }}
                                onClick={() => setStatusModalSchedule(schedule)}
                              >
                                Ver Detalles
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
          </table>
        )}
      </div>



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
