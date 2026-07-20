import { useState, useEffect } from "react";
import { getCarts } from "../../../../api/admin/carts";
import { getDeliverySchedules } from "../../../../api/admin/orderNetwork";
import { ShoppingCart, Truck, Calendar, MapPin, Search, Filter, RefreshCw, User } from "lucide-react";
import { toast } from "react-hot-toast";

import ScheduleDeliveryModal from "./ScheduleDeliveryModal";
import DeliveryStatusModal from "./DeliveryStatusModal";
import "./Orders.css";

export default function Orders() {
  const [activeTab, setActiveTab] = useState("proformas"); // 'proformas' | 'schedules'
  
  const [proformas, setProformas] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [scheduleModalCart, setScheduleModalCart] = useState(null);
  const [statusModalSchedule, setStatusModalSchedule] = useState(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    date_from: "",
    date_to: ""
  });

  const fetchProformas = async () => {
    setLoading(true);
    try {
      const { data } = await getCarts({ source: 'order_network', status: 'proforma' });
      setProformas(data.data.data);
    } catch (error) {
      toast.error("Error al cargar proformas de redes");
    } finally {
      setLoading(false);
    }
  };

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
      if (activeTab === "proformas") {
        fetchProformas();
      } else {
        fetchSchedules();
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, search, filters]);

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
        <button 
          className="action-btn primary" 
          style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', color: 'var(--color-primary-text)', background: 'var(--color-primary)', cursor: 'pointer' }}
          onClick={() => activeTab === "proformas" ? fetchProformas() : fetchSchedules()}
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          <span className="hide-on-mobile">Actualizar</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeInUp 0.3s ease' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Proformas Pendientes</span>
          <span style={{ color: 'var(--text-main)', fontSize: '28px', fontWeight: 800 }}>{proformas.length || 0}</span>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeInUp 0.4s ease' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Envíos (Página Actual)</span>
          <span style={{ color: 'var(--text-main)', fontSize: '28px', fontWeight: 800 }}>{schedules.length || 0}</span>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeInUp 0.5s ease' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completados (Página Actual)</span>
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

      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === "proformas" ? "active" : ""}`}
          onClick={() => setActiveTab("proformas")}
        >
          <ShoppingCart size={18} /> Proformas Pendientes
        </button>
        <button 
          className={`tab-button ${activeTab === "schedules" ? "active" : ""}`}
          onClick={() => setActiveTab("schedules")}
        >
          <Calendar size={18} /> Envíos Programados
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Cargando datos...
          </div>
        ) : (
          <table className="orders-table">
            {activeTab === "proformas" ? (
              <>
                <thead>
                  <tr>
                    <th>Referencia</th>
                    <th>Cliente / Invitado</th>
                    <th>Total</th>
                    <th>Fecha Creación</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proformas.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No hay proformas de redes sociales pendientes de agendar.
                      </td>
                    </tr>
                  ) : (
                    proformas.map(cart => (
                      <tr key={cart.id}>
                        <td style={{ fontWeight: 600 }}>{cart.reference_number}</td>
                        <td>
                          {cart.customer 
                            ? (cart.customer.user?.profile?.first_name || "Cliente Registrado")
                            : "Anónimo (Invitado)"}
                        </td>
                        <td style={{ fontWeight: 600 }}>Bs. {Number(cart.total_amount).toFixed(2)}</td>
                        <td>{new Date(cart.created_at).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="action-btn success"
                            onClick={() => setScheduleModalCart(cart)}
                          >
                            <Calendar size={16} /> Agendar Entrega
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            ) : (
              <>
                <thead>
                  <tr>
                    <th>Ref. Envío / Venta</th>
                    <th>Cliente / Invitado</th>
                    <th>Repartidor</th>
                    <th>Punto de Encuentro</th>
                    <th>Fecha y Hora</th>
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
                      
                      return (
                        <tr key={schedule.id}>
                          <td style={{ fontWeight: 600 }}>{schedule.shipment?.tracking_code || schedule.id.slice(0,8)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <User size={14} style={{ color: 'var(--text-muted)' }} />
                              {guestName || customerName || "Anónimo"}
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
                              {schedule.meeting_point_details || "No especificado"}
                            </div>
                          </td>
                          <td>
                            {schedule.delivery_date} <br/>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{schedule.delivery_time_window}</span>
                          </td>
                          <td>
                            <span className={`status-badge status-${schedule.status}`}>
                              {getStatusLabel(schedule.status)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="action-btn"
                              onClick={() => setStatusModalSchedule(schedule)}
                              disabled={schedule.status === 'completed' || schedule.status === 'cancelled'}
                            >
                              Gestionar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </>
            )}
          </table>
        )}
      </div>

      {scheduleModalCart && (
        <ScheduleDeliveryModal 
          cart={scheduleModalCart}
          onClose={() => setScheduleModalCart(null)}
          onSuccess={() => {
            setScheduleModalCart(null);
            fetchProformas();
          }}
        />
      )}

      {statusModalSchedule && (
        <DeliveryStatusModal 
          schedule={statusModalSchedule}
          onClose={() => setStatusModalSchedule(null)}
          onSuccess={() => {
            setStatusModalSchedule(null);
            fetchSchedules();
          }}
        />
      )}
    </div>
  );
}
