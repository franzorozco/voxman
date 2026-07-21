import { useState, useEffect } from "react";
import { X, MapPin, Phone, User, Package, CalendarClock, Truck, Link as LinkIcon, Edit3, XCircle, Save, Ban, Clock, CheckCircle } from "lucide-react";
import { getDeliveryDetails, updateDeliveryStatus, updateDeliveryDetails, getDeliveryDrivers } from "../../../../api/admin/orderNetwork";
import { toast } from "react-hot-toast";
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '8px'
};

const defaultCenter = {
  lat: -17.3895,
  lng: -66.1568
};

const STEPS = [
  { key: 'pending', label: 'Pendiente' },
  { key: 'assigned', label: 'Agendado' },
  { key: 'on_the_way', label: 'En Camino' },
  { key: 'at_the_meeting_point', label: 'En el Punto' },
  { key: 'completed', label: 'Entregado' }
];

const getStepIndex = (status) => {
  const idx = STEPS.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
};

export default function DeliveryDetailsModal({ scheduleId, onClose, onStatusChange, onEditRequest }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyD2GCanK5Gxm26zDyPrKc7MNy7WhAJZK7M"
  });

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const { data } = await getDeliveryDetails(scheduleId);
        setDetails(data.schedule);
      } catch (error) {
        toast.error("Error al cargar los detalles de la entrega");
      } finally {
        setLoading(false);
      }
    };
    if (scheduleId) loadDetails();
  }, [scheduleId]);

  const handleUpdateStatus = async (newStatus) => {
    if (newStatus === 'cancelled' && !window.confirm('¿Estás seguro de cancelar esta entrega? Esta acción no se puede deshacer.')) return;
    setUpdating(true);
    try {
      await updateDeliveryStatus(scheduleId, newStatus);
      const { data } = await getDeliveryDetails(scheduleId);
      setDetails(data.schedule);
      toast.success(newStatus === 'cancelled' ? "Entrega cancelada" : "Estado actualizado exitosamente");
      onStatusChange();
    } catch (error) {
      toast.error("Error al actualizar estado");
    } finally {
      setUpdating(false);
    }
  };

  const startEditing = () => {
    if (onEditRequest) {
      onEditRequest(details);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendiente", assigned: "Agendado", on_the_way: "En Camino",
      at_the_meeting_point: "En el Punto", completed: "Entregado", cancelled: "Cancelado"
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "var(--color-warning)", assigned: "var(--color-info)", on_the_way: "#8b5cf6",
      at_the_meeting_point: "#f97316", completed: "var(--color-success)", cancelled: "#ef4444"
    };
    return colors[status] || "var(--text-muted)";
  };

  if (loading || !details) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '600px', display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        </div>
      </div>
    );
  }

  const sale = details.shipment?.sale;
  const guestName = sale?.guest?.name;
  const customerName = sale?.customer?.user?.name;
  const guestPhone = sale?.guest?.whatsapp_phone;
  const customerPhone = sale?.customer?.phone;
  
  const clientName = guestName || customerName || "Anónimo";
  const clientPhone = guestPhone || customerPhone || "No especificado";

  const mapCenter = details.latitude && details.longitude 
    ? { lat: parseFloat(details.latitude), lng: parseFloat(details.longitude) } 
    : defaultCenter;

  const currentStepIndex = getStepIndex(details.status);
  const isOnTheWay = details.status === 'on_the_way' || details.status === 'at_the_meeting_point';
  const isCancelled = details.status === 'cancelled';
  const isCompleted = details.status === 'completed';
  const isFinal = isCancelled || isCompleted;
  const canEdit = !isOnTheWay && !isFinal;

  const statusTheme = {
    pending: { color: '#eab308', rgb: '234, 179, 8', title: 'ENTREGA PENDIENTE', icon: <Clock size={24} />, pulse: false },
    assigned: { color: '#3b82f6', rgb: '59, 130, 246', title: 'ENTREGA AGENDADA', icon: <CalendarClock size={24} />, pulse: false },
    on_the_way: { color: '#8b5cf6', rgb: '139, 92, 246', title: '¡EL PEDIDO ESTÁ EN CAMINO!', icon: <Truck size={28} className="pulse-anim" />, pulse: true },
    at_the_meeting_point: { color: '#f97316', rgb: '249, 115, 22', title: '¡REPARTIDOR EN EL PUNTO!', icon: <MapPin size={28} className="pulse-anim" />, pulse: true },
    completed: { color: '#10b981', rgb: '16, 185, 129', title: 'ENTREGA COMPLETADA', icon: <CheckCircle size={28} />, pulse: false },
    cancelled: { color: '#ef4444', rgb: '239, 68, 68', title: 'ENTREGA CANCELADA', icon: <Ban size={28} className="pulse-anim" />, pulse: true }
  };

  const currentTheme = statusTheme[details.status] || statusTheme.pending;
  const accentColor = currentTheme.color;
  const rgb = currentTheme.rgb;

  let overlayBg = {};
  let contentStyle = { maxWidth: '800px', width: '95%', transition: 'all 0.4s ease' };
  let headerStyle = { background: 'var(--bg-main)', borderBottomColor: 'var(--border-color)' };

  if (currentTheme.pulse) {
    overlayBg = { background: `rgba(${rgb}, 0.2)`, backdropFilter: 'blur(4px)' };
    contentStyle = { ...contentStyle, boxShadow: `0 0 50px rgba(${rgb}, 0.3)`, border: `2px solid ${accentColor}` };
    headerStyle = { background: `rgba(${rgb}, 0.08)`, borderBottomColor: accentColor };
  } else {
    contentStyle = { ...contentStyle, borderTop: `4px solid ${accentColor}` };
  }

  const headerTitle = currentTheme.title;
  const headerIcon = currentTheme.icon;

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '14px' };

  return (
    <div className="modal-overlay fade-in" style={overlayBg}>
      <div className="modal-content" style={contentStyle}>
        <div className="modal-header" style={headerStyle}>
          <div>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: accentColor }}>
              {headerIcon} {headerTitle}
            </h2>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Ref: {details.shipment?.delivery_code || details.id.slice(0,8)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="action-btn" 
              style={{ padding: '6px 12px', background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              onClick={() => {
                const trackingUrl = `${window.location.origin}/tracking/${details.id}`;
                navigator.clipboard.writeText(trackingUrl);
                toast.success("Enlace copiado");
              }}
              title="Copiar enlace de seguimiento"
            >
              <LinkIcon size={14} /> Copiar Enlace
            </button>
            {canEdit && (
              <button 
                className="action-btn" 
                style={{ padding: '6px 12px', background: 'var(--bg-input)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                onClick={startEditing}
              >
                <Edit3 size={14} /> Editar
              </button>
            )}
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0' }}>
          
          {/* TIMELINE */}
          <div style={{ padding: '24px', background: isCancelled ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '36px', left: '40px', right: '40px', height: '4px', background: 'var(--border-color)', zIndex: 1, borderRadius: '2px' }}>
              <div style={{ 
                height: '100%', 
                background: isCancelled ? '#ef4444' : accentColor, 
                width: isCancelled ? '100%' : `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
                transition: 'width 0.5s ease, background 0.5s ease',
                borderRadius: '2px'
              }} />
            </div>
            {STEPS.map((step, idx) => {
              const isStepCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const stepColor = isCancelled ? '#ef4444' : (isStepCompleted ? accentColor : 'var(--text-muted)');
              const stepBg = isCancelled ? '#ef4444' : (isStepCompleted ? accentColor : 'var(--bg-body)');
              
              return (
                <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, width: '80px' }}>
                  <div style={{ 
                    width: '28px', height: '28px', borderRadius: '50%', background: stepBg, border: `3px solid ${isStepCompleted ? 'transparent' : 'var(--border-color)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isCurrent && !isCancelled ? `0 0 0 4px rgba(${rgb}, 0.2)` : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    {isStepCompleted && <div style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%' }} />}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: isCurrent ? 700 : 500, color: stepColor, textAlign: 'center', lineHeight: 1.2 }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
            {isCancelled && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', padding: '6px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', zIndex: 10 }}>
                CANCELADO
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', padding: '20px' }}>
            
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'var(--bg-card)', border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`, borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} /> Datos del Cliente
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-main)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Nombre:</span>
                    <span style={{ fontWeight: 500 }}>{clientName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Teléfono:</span>
                    <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} /> {clientPhone}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`, borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={16} /> Detalle de Productos
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sale?.sale_details?.map(item => {
                    const variant = item.product_variant;
                    const imageUrl = variant?.variant_images?.[0]?.image_path 
                      ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${variant.variant_images[0].image_path}`
                      : null;
                      
                    return (
                      <div key={item.id} style={{ display: 'flex', gap: '12px', fontSize: '13px', paddingBottom: '12px', borderBottom: '1px dashed var(--border-color)', alignItems: 'flex-start', opacity: isCancelled ? 0.6 : 1 }}>
                        {imageUrl ? (
                          <img src={imageUrl} alt="Variant" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                        ) : (
                          <div style={{ width: '50px', height: '50px', background: 'var(--bg-input)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                            <Package size={20} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        )}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            {item.quantity}x {variant?.product?.name} {variant?.name && `(${variant.name})`}
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {variant?.sku && <span style={{ background: 'var(--bg-body)', padding: '2px 6px', borderRadius: '4px' }}>SKU: {variant.sku}</span>}
                            {variant?.size && <span style={{ background: 'var(--bg-body)', padding: '2px 6px', borderRadius: '4px' }}>Talla: {variant.size.name}</span>}
                            {variant?.fit && <span style={{ background: 'var(--bg-body)', padding: '2px 6px', borderRadius: '4px' }}>Fit: {variant.fit.name}</span>}
                            {variant?.variant_attribute_values?.map(attrVal => (
                              <span key={attrVal.variant_id + '-' + attrVal.attribute_value_id} style={{ background: 'var(--bg-body)', padding: '2px 6px', borderRadius: '4px' }}>
                                {attrVal.attribute_value?.attribute?.name}: {attrVal.attribute_value?.value}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span style={{ fontWeight: 600 }}>Bs. {Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', textDecoration: isCancelled ? 'line-through' : 'none', opacity: isCancelled ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <span>Subtotal:</span>
                      <span>Bs. {Number(sale?.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <span>Costo de Envío:</span>
                      <span>Bs. {Number(details.shipment?.shipping_cost || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '15px', fontWeight: 700 }}>
                      <span>TOTAL:</span>
                      <span style={{ color: 'var(--color-primary)' }}>Bs. {Number(sale?.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`, borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={16} /> Estado y Repartidor
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
                    <span style={{ fontWeight: 600, color: getStatusColor(details.status) }}>
                      {getStatusLabel(details.status)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Repartidor:</span>
                    <span style={{ fontWeight: 500 }}>
                      {details.driver ? `${details.driver.user?.profile?.first_name} ${details.driver.user?.profile?.last_name_paternal}` : 'Sin Asignar'}
                    </span>
                  </div>
                  {details.driver && details.driver.phone && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tel. Repartidor:</span>
                      <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {details.driver.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'var(--bg-card)', border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`, borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CalendarClock size={16} /> Horario y Lugar
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-main)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <CalendarClock size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{details.scheduled_date}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{details.time_window}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <MapPin size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                    <div style={{ fontWeight: 500 }}>{details.meeting_point}</div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`, borderRadius: '12px', overflow: 'hidden' }}>
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={15}
                    options={{ disableDefaultUI: true, zoomControl: true }}
                  >
                    <MarkerF position={mapCenter} />
                  </GoogleMap>
                ) : (
                  <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Cargando mapa...</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-footer" style={{ borderTop: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: isCancelled ? 'rgba(239, 68, 68, 0.04)' : (isOnTheWay ? 'rgba(139, 92, 246, 0.05)' : 'transparent') }}>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isCancelled ? (
              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={20} /> Entrega Cancelada
              </span>
            ) : isCompleted ? (
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Entrega Completada</span>
            ) : (
              <>
                <button 
                  className="action-btn"
                  style={{ 
                    padding: '12px 24px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', border: 'none',
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px',
                    background: details.status === 'pending' || details.status === 'assigned' ? '#8b5cf6' : (details.status === 'on_the_way' ? '#f97316' : 'var(--color-success)'),
                    color: '#fff',
                    boxShadow: isOnTheWay ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    let next = 'on_the_way';
                    if(details.status === 'on_the_way') next = 'at_the_meeting_point';
                    if(details.status === 'at_the_meeting_point') next = 'completed';
                    handleUpdateStatus(next);
                  }}
                  disabled={updating}
                >
                  <Truck size={20} />
                  {details.status === 'pending' || details.status === 'assigned' ? 'Marcar En Camino' : 
                   (details.status === 'on_the_way' ? 'Marcar En el Punto' : 'Marcar Completado')}
                </button>
                
                <button 
                  className="action-btn"
                  style={{ padding: '12px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', transition: 'all 0.2s ease' }}
                  onClick={() => handleUpdateStatus('cancelled')}
                  disabled={updating}
                >
                  <XCircle size={16} /> Cancelar Entrega
                </button>
              </>
            )}
          </div>

          <button className="action-btn" style={{ padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} onClick={onClose} disabled={updating}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
