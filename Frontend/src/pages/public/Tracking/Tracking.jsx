import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Package, Truck, MapPin, CheckCircle, Clock, AlertCircle, ShoppingBag, User, Phone, Map, Box, StickyNote, Check } from "lucide-react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import echo from "../../../echo";
import "./Tracking.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace('/api', '');

export default function Tracking() {
  const { id } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Checkout Session State
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountMessage, setDiscountMessage] = useState(null);
  
  // Notes State
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyD2GCanK5Gxm26zDyPrKc7MNy7WhAJZK7M"
  });

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setNotesSuccess(false);
    setError(null);
    try {
      await axios.post(`${API_URL}/v1/delivery/${id}/notes`, { notes });
      setNotesSuccess(true);
      setTimeout(() => setNotesSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Error al guardar las notas. Intenta de nuevo.");
    } finally {
      setSavingNotes(false);
    }
  };

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const response = await axios.get(`${API_URL}/v1/delivery/${id}`);
        const fetchedSchedule = response.data.schedule;
        setSchedule(fetchedSchedule);
        setNotes(fetchedSchedule.shipment?.notes || '');
        
        if (fetchedSchedule.checkout_session) {
          setCheckoutSession({
            paymentMethod: fetchedSchedule.checkout_session.payment_method,
            montoReal: fetchedSchedule.checkout_session.monto_real,
            cashAmount: fetchedSchedule.checkout_session.cash_amount,
            qrAmount: fetchedSchedule.checkout_session.qr_amount,
            saleTotal: fetchedSchedule.checkout_session.sale_total
          });
        }
      } catch (err) {
        setError("No se pudo encontrar la información de este envío. Verifica que el enlace sea correcto.");
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();

    const globalChannel = echo.channel(`deliveries.global`);
    globalChannel.listen('.delivery.status.updated', () => {
      fetchTracking();
    });

    const privateChannel = echo.channel(`deliveries.${id}`);
    privateChannel.listen('.delivery.status.updated', () => {
      fetchTracking();
    });
    privateChannel.listen('.checkout.session.shared', (data) => {
      setCheckoutSession(data);
    });
    privateChannel.listen('.delivery.discount.applied', (data) => {
      fetchTracking();
      // Update local checkout session total if we had one active
      setCheckoutSession(prev => prev ? { ...prev, montoReal: data.sale.total } : null);
    });
    privateChannel.listen('.delivery.discount.removed', (data) => {
      fetchTracking();
      setCheckoutSession(prev => prev ? { ...prev, montoReal: data.sale.total } : null);
      setDiscountMessage(null);
    });
    privateChannel.listen('.DeliveryNotesUpdated', (data) => {
      setNotes(data.notes || '');
      setSchedule(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          shipment: {
            ...prev.shipment,
            notes: data.notes
          }
        };
      });
    });

    return () => {
      globalChannel.stopListening('.delivery.status.updated');
      echo.leaveChannel(`deliveries.global`);
      privateChannel.stopListening('.delivery.status.updated');
      privateChannel.stopListening('.checkout.session.shared');
      privateChannel.stopListening('.delivery.discount.applied');
      privateChannel.stopListening('.delivery.discount.removed');
      echo.leaveChannel(`deliveries.${id}`);
    };
  }, [id]);

  const handleRemoveDiscount = async () => {
    setApplyingDiscount(true);
    try {
      await axios.post(`${API_URL}/v1/delivery/${id}/remove-discount`);
      setDiscountMessage(null);
      setDiscountCode('');
    } catch (err) {
      setDiscountMessage({ type: 'error', text: err.response?.data?.error || "Error al quitar el descuento" });
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setApplyingDiscount(true);
    setDiscountMessage(null);
    try {
      const res = await axios.post(`${API_URL}/v1/delivery/${id}/apply-discount`, { code: discountCode });
      setDiscountMessage({ type: 'success', text: `Descuento aplicado: Bs. ${res.data.discount_amount}` });
      setDiscountCode('');
    } catch (err) {
      setDiscountMessage({ type: 'error', text: err.response?.data?.error || "Error al aplicar el código" });
    } finally {
      setApplyingDiscount(false);
    }
  };

  if (loading) {
    return (
      <div className="tracking-container loading">
        <div className="spinner"></div>
        <p>Cargando información de tu envío...</p>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="tracking-container error">
        <AlertCircle size={48} className="error-icon" />
        <h2>Enlace no válido</h2>
        <p>{error}</p>
      </div>
    );
  }

  const shipment = schedule.shipment;
  const sale = shipment?.sale;
  const details = sale?.sale_details || [];
  
  const customer = sale?.customer;
  const guest = sale?.guest;

  let customerName = "Cliente";
  if (customer) {
    if (customer.pos_profile) {
      customerName = `${customer.pos_profile.first_name || ''} ${customer.pos_profile.last_name_paternal || ''}`.trim() || "Cliente";
    } else if (customer.user?.profile) {
      customerName = `${customer.user.profile.first_name || ''} ${customer.user.profile.last_name_paternal || ''}`.trim() || "Cliente";
    } else if (customer.user) {
      customerName = customer.user.username || customer.user.email || "Cliente";
    } else {
      customerName = `Cliente ${customer.customer_code}`;
    }
  } else if (guest) {
    customerName = guest.name || "Invitado";
  }

  const isExternal = schedule?.shipment?.delivery_type === 'external';

  const getStatusInfo = (status) => {
    if (isExternal) {
      switch (status) {
        case 'pending': 
        case 'assigned': 
          return { label: 'Pendiente', icon: <Package size={28} />, color: '#64748b', activeStep: 1 };
        case 'prepared': return { label: 'Preparando paquete', icon: <Box size={28} />, color: '#f97316', activeStep: 2 };
        case 'packaged': return { label: 'Empaquetado', icon: <Package size={28} />, color: '#0ea5e9', activeStep: 3 };
        case 'shipped': return { label: 'Remitido', icon: <Truck size={28} />, color: '#3b82f6', activeStep: 4 };
        case 'completed': return { label: 'Completado', icon: <CheckCircle size={28} />, color: '#10b981', activeStep: 5 };
        case 'cancelled': return { label: 'Cancelado', icon: <AlertCircle size={28} />, color: '#ef4444', activeStep: 0 };
        default: return { label: 'Desconocido', icon: <Package size={28} />, color: '#6b7280', activeStep: 0 };
      }
    } else {
      switch (status) {
        case 'pending': return { label: 'Preparando', icon: <Package size={28} />, color: '#64748b', activeStep: 1 };
        case 'assigned': return { label: 'Agendado', icon: <Clock size={28} />, color: '#4f46e5', activeStep: 2 };
        case 'on_the_way': return { label: 'En Camino', icon: <Truck size={28} />, color: '#3b82f6', activeStep: 3 };
        case 'at_the_meeting_point': return { label: 'En el Punto', icon: <MapPin size={28} />, color: '#8b5cf6', activeStep: 4 };
        case 'completed': return { label: 'Entregado', icon: <CheckCircle size={28} />, color: '#10b981', activeStep: 5 };
        case 'cancelled': return { label: 'Cancelado', icon: <AlertCircle size={28} />, color: '#ef4444', activeStep: 0 };
        default: return { label: 'Desconocido', icon: <Package size={28} />, color: '#6b7280', activeStep: 0 };
      }
    }
  };

  const statusInfo = getStatusInfo(schedule.status);
  const driver = schedule.driver;

  // Resolve Image URL Logic (same as Admin Panel)
  const resolveImageUrl = (variant) => {
    const product = variant?.product;
    const colorId = variant?.variant_attribute_values?.[0]?.attribute_value_id;
    const colorImg = product?.attribute_value_images?.find(img => img.attribute_value_id === colorId);
    
    let imageUrl = variant?.variant_images?.[0]?.url || colorImg?.url || product?.product_images?.find(img => img.is_main)?.url || product?.product_images?.[0]?.url;
    
    if (!imageUrl) {
      const fallbackPath = variant?.variant_images?.[0]?.image_path || colorImg?.image_path || product?.product_images?.[0]?.image_path;
      if (fallbackPath) {
        imageUrl = `/storage/${fallbackPath}`;
      }
    }

    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${BASE_URL}${imageUrl}`;
    }
    return imageUrl;
  };

  // Calculate Progress width
  const progressWidth = statusInfo.activeStep === 0 ? 0 : ((statusInfo.activeStep - 1) / 4) * 100;

  return (
    <div className="tracking-wrapper">
      <div className="tracking-card">
        <div className="tracking-header">
          <h1>Seguimiento de Envío</h1>
          <p className="tracking-ref">Ref: <strong>{sale?.reference_number || schedule.id.split('-')[0].toUpperCase()}</strong></p>
        </div>

        <div className="tracking-status-hero" style={{ background: `linear-gradient(135deg, ${statusInfo.color}15 0%, transparent 100%)`, borderLeft: `4px solid ${statusInfo.color}` }}>
          <div className="status-icon" style={{ color: statusInfo.color }}>
            {statusInfo.icon}
          </div>
          <div className="status-text">
            <h2 style={{ color: statusInfo.color }}>{statusInfo.label}</h2>
            <p>Hola <strong>{customerName}</strong>, este es el estado actual de tu entrega.</p>
          </div>
        </div>


        {schedule.status !== 'cancelled' && (
          <div className="tracking-timeline">
            <div className="timeline-progress" style={{ width: `${progressWidth}%`, background: statusInfo.color }}></div>
            
            {isExternal ? (
              <>
                <div className={`timeline-step ${statusInfo.activeStep >= 1 ? 'active' : ''} ${statusInfo.activeStep === 1 ? 'current' : ''}`}>
                  <div className="step-icon"><Package size={16} /></div>
                  <p>Pendiente</p>
                </div>
                <div className={`timeline-step ${statusInfo.activeStep >= 2 ? 'active' : ''} ${statusInfo.activeStep === 2 ? 'current' : ''}`}>
                  <div className="step-icon"><Box size={16} /></div>
                  <p>Preparando paquete</p>
                </div>
                <div className={`timeline-step ${statusInfo.activeStep >= 3 ? 'active' : ''} ${statusInfo.activeStep === 3 ? 'current' : ''}`}>
                  <div className="step-icon"><Package size={16} /></div>
                  <p>Empaquetado</p>
                </div>
                <div className={`timeline-step ${statusInfo.activeStep >= 4 ? 'active' : ''} ${statusInfo.activeStep === 4 ? 'current' : ''}`}>
                  <div className="step-icon"><Truck size={16} /></div>
                  <p>Remitido</p>
                </div>
                <div className={`timeline-step ${statusInfo.activeStep >= 5 ? 'active' : ''} ${statusInfo.activeStep === 5 ? 'current' : ''}`}>
                  <div className="step-icon"><CheckCircle size={16} /></div>
                  <p>Completado</p>
                </div>
              </>
            ) : (
              <>
                <div className={`timeline-step ${statusInfo.activeStep >= 1 ? 'active' : ''} ${statusInfo.activeStep === 1 ? 'current' : ''}`}>
                  <div className="step-icon"><Package size={16} /></div>
                  <p>Preparando</p>
                </div>
                <div className={`timeline-step ${statusInfo.activeStep >= 2 ? 'active' : ''} ${statusInfo.activeStep === 2 ? 'current' : ''}`}>
                  <div className="step-icon"><Clock size={16} /></div>
                  <p>Agendado</p>
                </div>
                <div className={`timeline-step ${statusInfo.activeStep >= 3 ? 'active' : ''} ${statusInfo.activeStep === 3 ? 'current' : ''}`}>
                  <div className="step-icon"><Truck size={16} /></div>
                  <p>En Camino</p>
                </div>
                <div className={`timeline-step ${statusInfo.activeStep >= 4 ? 'active' : ''} ${statusInfo.activeStep === 4 ? 'current' : ''}`}>
                  <div className="step-icon"><MapPin size={16} /></div>
                  <p>En el Punto</p>
                </div>
                <div className={`timeline-step ${statusInfo.activeStep >= 5 ? 'active' : ''} ${statusInfo.activeStep === 5 ? 'current' : ''}`}>
                  <div className="step-icon"><CheckCircle size={16} /></div>
                  <p>Entregado</p>
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'start' }}>
          <div className="tracking-section" style={{ margin: 0 }}>
          <h3 className="section-title"><Map size={20} /> Detalles Logísticos</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">{schedule.shipment?.delivery_type === 'home_delivery' ? 'Dirección de Entrega' : 'Lugar de Entrega'}</span>
              <span className="detail-value">
                {schedule.shipment?.delivery_type === 'home_delivery' && schedule.shipment?.address 
                  ? `${schedule.shipment.address.street}, ${schedule.shipment.address.zone}` 
                  : schedule.meeting_point}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Fecha Programada</span>
              <span className="detail-value">{schedule.scheduled_date}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Hora Estimada</span>
              <span className="detail-value">{schedule.time_window || "A convenir"}</span>
            </div>
          </div>
          {schedule.latitude && schedule.longitude && isLoaded && !isExternal && (
            <div style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', height: '250px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={{ lat: Number(schedule.latitude), lng: Number(schedule.longitude) }}
                zoom={16}
                options={{ disableDefaultUI: true, gestureHandling: 'greedy' }}
              >
                <MarkerF position={{ lat: Number(schedule.latitude), lng: Number(schedule.longitude) }} />
              </GoogleMap>
            </div>
          )}

          {isExternal && (
            <div style={{ marginTop: '20px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', color: '#0f172a', fontSize: '16px' }}>
                <Truck size={18} style={{ color: '#0ea5e9' }} /> Información de Transportadora
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Agencia:</span>
                  <span style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700 }}>{schedule.shipment?.external_company || 'Pendiente'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Nro. Guía:</span>
                  <span style={{ color: '#0ea5e9', fontSize: '15px', fontWeight: 800, background: schedule.shipment?.external_guide ? '#e0f2fe' : '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>{schedule.shipment?.external_guide || 'Pendiente'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Tipo de Pago:</span>
                  <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>{schedule.shipment?.shipping_payment_type === 'collect' ? 'Pago en Destino' : (schedule.shipment?.shipping_payment_type === 'paid' ? 'Pagado en Origen' : 'Pendiente')}</span>
                </div>
                {schedule.shipment?.shipping_payment_type === 'collect' && (
                  <div style={{ marginTop: '8px', padding: '10px', background: '#fffbeb', color: '#b45309', borderRadius: '8px', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center', border: '1px solid #fef3c7' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <p style={{ margin: 0, lineHeight: 1.4 }}>Recuerda que debes pagar el costo de envío directamente a la agencia de transporte al recoger tu paquete.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isExternal && schedule.shipment?.tracking_history?.length > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', color: '#1f2937', fontSize: '15px' }}>
                <Clock size={16} /> Historial de Seguimiento
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: '#e5e7eb' }}></div>
                {schedule.shipment.tracking_history.map((track, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: i === schedule.shipment.tracking_history.length - 1 ? '#4f46e5' : '#9ca3af', border: '4px solid #fff', boxShadow: '0 0 0 1px #e5e7eb', flexShrink: 0, marginTop: '2px' }}></div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#111827', fontWeight: 500, lineHeight: 1.4 }}>{track.description}</p>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(track.created_at).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas de Entrega Editable */}
          <div style={{ marginTop: '20px', padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0', color: '#b45309', fontSize: '15px' }}>
              <StickyNote size={16} /> Notas de Entrega
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añade instrucciones especiales, referencias o indicaciones para la entrega..."
                style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #fcd34d', background: '#fff', color: '#92400e', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }}
                disabled={statusInfo.activeStep >= 5} // Disable if completed
              />
              {statusInfo.activeStep < 5 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                  {notesSuccess && <span style={{ fontSize: '13px', color: '#059669', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Guardado</span>}
                  <button 
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#d97706', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: savingNotes ? 'not-allowed' : 'pointer', opacity: savingNotes ? 0.7 : 1 }}
                  >
                    {savingNotes ? 'Guardando...' : 'Guardar Notas'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Repartidor Info Oculto temporalmente a petición del usuario
          {driver && statusInfo.activeStep >= 2 && statusInfo.activeStep < 5 && (
            <div className="driver-card">
              <div className="driver-info">
                <div className="driver-avatar">
                  <User size={24} />
                </div>
                <div className="driver-details">
                  <h4>Repartidor: {driver.user?.profile?.first_name} {driver.user?.profile?.last_name_paternal || ''}</h4>
                  <p>En caso de dudas, contacta al repartidor.</p>
                </div>
              </div>
              {driver.user?.profile?.phone && (
                <a 
                  href={`https://wa.me/${driver.user.profile.phone.replace(/[^0-9]/g, '')}?text=Hola,%20soy%20${customerName},%20sobre%20mi%20entrega.`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="whatsapp-btn"
                >
                  <Phone size={16} />
                  Contactar
                </a>
              )}
            </div>
          )}
          */}
          </div>

          <div className="tracking-section" style={{ margin: 0 }}>
            <h3 className="section-title"><ShoppingBag size={20} /> Detalle del Pedido</h3>
          <div className="products-list">
            {details.map((item, idx) => {
              const variant = item.product_variant;
              const imgUrl = resolveImageUrl(variant);
              return (
                <div key={idx} className="product-item">
                  {imgUrl ? (
                    <img src={imgUrl} alt="Producto" className="product-image" />
                  ) : (
                    <div className="product-image-placeholder">
                      <Box size={24} />
                    </div>
                  )}
                  
                  <div className="product-details">
                    <div className="product-header">
                      <div className="product-name">{variant?.product?.name || 'Producto'}</div>
                      <div className="product-price-block">
                        <span className="product-qty">{item.quantity}x Bs. {Number(item.unit_price).toFixed(2)}</span>
                        <span className="product-subtotal">Bs. {Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="product-badges">
                      {variant?.size && <span className="product-badge">Talla: {variant.size.name}</span>}
                      {variant?.fit && <span className="product-badge">Fit: {variant.fit.name}</span>}
                      {variant?.variant_attribute_values?.map(attrVal => (
                        <span key={attrVal.attribute_value_id} className="product-badge">
                          {attrVal.attribute_value?.attribute?.name}: {attrVal.attribute_value?.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="financial-summary">
            <div className="summary-row">
              <span>Subtotal del Pedido</span>
              <span>Bs. {Number(sale?.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Costo de Envío</span>
              <span>Bs. {Number(shipment?.shipping_cost || 0).toFixed(2)}</span>
            </div>
            
            {(schedule?.shipment?.sale?.discount_id || schedule?.shipment?.sale?.giftcard_id) && (
              <div className="summary-row" style={{ color: '#10b981', fontWeight: 600 }}>
                <span>Descuento Aplicado</span>
                <span>- Bs. {Number(schedule.shipment.sale.discount_total).toFixed(2)}</span>
              </div>
            )}

            {checkoutSession && Number(checkoutSession.montoReal) < Number(sale?.total || 0) && !(schedule?.shipment?.sale?.discount_id || schedule?.shipment?.sale?.giftcard_id) && (
              <div className="summary-row" style={{ color: '#f59e0b', fontWeight: 600 }}>
                <span>Ajuste Especial</span>
                <span>- Bs. {(Number(sale?.total || 0) - Number(checkoutSession.montoReal)).toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row total" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '16px', marginTop: '8px' }}>
              <span style={{ fontSize: '18px' }}>Total a Pagar</span>
              <span style={{ fontSize: '22px', color: checkoutSession ? '#4f46e5' : '#111827' }}>
                Bs. {checkoutSession ? Number(checkoutSession.montoReal).toFixed(2) : Number(sale?.total || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {checkoutSession && ((!isExternal && statusInfo.activeStep === 4) || (isExternal && statusInfo.activeStep === 1)) && (
            <div className="checkout-session-card" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #e5e7eb' }}>
              
              {checkoutSession.paymentMethod === 'ambos' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '15px', padding: '12px', background: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                  <span style={{ color: '#4b5563', fontWeight: 600 }}>Efectivo: Bs. {checkoutSession.cashAmount}</span>
                  <span style={{ color: '#4b5563', fontWeight: 600 }}>QR: Bs. {checkoutSession.qrAmount}</span>
                </div>
              )}

              {(checkoutSession.paymentMethod === 'qr' || checkoutSession.paymentMethod === 'ambos') && (
                <div style={{ textAlign: 'center', marginBottom: '24px', background: '#f9fafb', padding: '20px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: '0 0 12px 0', fontWeight: 700, color: '#111827', fontSize: '16px' }}>Escanea este QR para pagar</p>
                  <img 
                    src={`${BASE_URL}/storage/payments/QRBCP.jpeg`} 
                    alt="QR de Pago" 
                    style={{ maxWidth: '200px', borderRadius: '12px', border: '2px solid #e5e7eb' }}
                  />
                </div>
              )}

              <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                {(schedule?.shipment?.sale?.discount_id || schedule?.shipment?.sale?.giftcard_id) ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#10b981', display: 'block' }}>¡Cupón aplicado con éxito!</span>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>El descuento ya se refleja en tu total.</span>
                    </div>
                    <button 
                      onClick={handleRemoveDiscount} 
                      disabled={applyingDiscount} 
                      style={{ padding: '8px 16px', borderRadius: '8px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', opacity: applyingDiscount ? 0.7 : 1 }}
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: '#374151' }}>¿Tienes un código de descuento o Giftcard?</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="VOX-XXXXXX o CÓDIGO" 
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', background: '#ffffff', color: '#111827', fontSize: '15px', fontWeight: 600 }}
                        disabled={applyingDiscount}
                      />
                      <button 
                        onClick={handleApplyDiscount}
                        disabled={applyingDiscount || !discountCode.trim()}
                        style={{ padding: '12px 24px', borderRadius: '12px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}
                      >
                        {applyingDiscount ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {discountMessage && (
                      <p style={{ margin: '12px 0 0 0', fontSize: '14px', fontWeight: 700, padding: '10px', borderRadius: '8px', background: discountMessage.type === 'error' ? '#fef2f2' : '#f0fdf4', color: discountMessage.type === 'error' ? '#ef4444' : '#10b981', border: `1px solid ${discountMessage.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
                        {discountMessage.text}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
        
        <div className="tracking-footer">
          Gracias por tu preferencia. ¡Disfruta tu compra!
        </div>
      </div>
    </div>
  );
}
