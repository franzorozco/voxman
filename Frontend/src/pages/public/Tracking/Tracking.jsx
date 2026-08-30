import { getImageUrl } from '../../../utils/imageUtils';
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Package, Truck, MapPin, CheckCircle, Clock, AlertCircle, ShoppingBag, User, Phone, Map, Box, StickyNote, Check, Edit2, X as XIcon, Save } from "lucide-react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import echo from "../../../echo";
import { useShopSettingsStore } from '../../../store/shop/useShopSettingsStore';
import "./Tracking.css";
import { API_BASE_URL as BASE_URL, API_URL } from "../../../config/api";

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

  // Recipient Edit State
  const [isEditingRecipient, setIsEditingRecipient] = useState(false);
  const [recipientForm, setRecipientForm] = useState({
    recipient_name: '',
    recipient_ci: '',
    recipient_phone: '',
    destination_city: ''
  });
  const [savingRecipient, setSavingRecipient] = useState(false);

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

  const { settings, fetchSettings } = useShopSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (schedule?.shipment) {
      setRecipientForm({
        recipient_name: schedule.shipment.recipient_name || '',
        recipient_ci: schedule.shipment.recipient_ci || '',
        recipient_phone: schedule.shipment.recipient_phone || '',
        destination_city: schedule.shipment.destination_city || ''
      });
      if (!schedule.shipment.recipient_edit_session?.is_shared) {
        setIsEditingRecipient(false);
      }
    }
  }, [schedule]);

  const handleSaveRecipient = async () => {
    setSavingRecipient(true);
    try {
      await axios.put(`${API_URL}/v1/delivery/${id}/recipient`, recipientForm);
      setSchedule(prev => ({
        ...prev,
        shipment: {
          ...prev.shipment,
          ...recipientForm
        }
      }));
      setIsEditingRecipient(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error al guardar información");
    } finally {
      setSavingRecipient(false);
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
            saleTotal: fetchedSchedule.checkout_session.sale_total,
            isAdvancePayment: fetchedSchedule.checkout_session.is_advance_payment
          });
        } else {
          setCheckoutSession(null);
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
      const montoReal = data?.montoReal || data?.monto_real;
      if (!montoReal) {
        setCheckoutSession(null);
      } else {
        setCheckoutSession({
          paymentMethod: data.paymentMethod || data.payment_method,
          montoReal: montoReal,
          cashAmount: data.cashAmount || data.cash_amount,
          qrAmount: data.qrAmount || data.qr_amount,
          saleTotal: data.saleTotal || data.sale_total,
          isAdvancePayment: data.isAdvancePayment || data.is_advance_payment
        });
      }
    });
    privateChannel.listen('.delivery.discount.applied', () => {
      fetchTracking();
    });
    privateChannel.listen('.delivery.discount.removed', () => {
      fetchTracking();
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
    privateChannel.listen('.DeliveryUpdated', (data) => {
      if (data.type === 'recipient_info_updated' || data.type === 'recipient_edit_toggled') {
        fetchTracking();
      }
    });

    return () => {
      globalChannel.stopListening('.delivery.status.updated');
      echo.leaveChannel(`deliveries.global`);
      privateChannel.stopListening('.delivery.status.updated');
      privateChannel.stopListening('.checkout.session.shared');
      privateChannel.stopListening('.delivery.discount.applied');
      privateChannel.stopListening('.delivery.discount.removed');
      privateChannel.stopListening('.DeliveryNotesUpdated');
      privateChannel.stopListening('.DeliveryUpdated');
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
  let customerPhone = null;
  let customerCode = null;

  if (customer) {
    customerCode = customer.customer_code;
    if (customer.pos_profile) {
      customerName = `${customer.pos_profile.first_name || ''} ${customer.pos_profile.last_name_paternal || ''}`.trim() || "Cliente";
      customerPhone = customer.pos_profile.phone;
    } else if (customer.user?.profile) {
      customerName = `${customer.user.profile.first_name || ''} ${customer.user.profile.last_name_paternal || ''}`.trim() || "Cliente";
      customerPhone = customer.user.profile.phone;
    } else if (customer.user) {
      customerName = customer.user.username || customer.user.email || "Cliente";
    } else {
      customerName = `Cliente ${customer.customer_code}`;
    }
  } else if (guest) {
    customerName = guest.name || "Invitado";
    customerPhone = guest.phone;
  }

  const isExternal = schedule?.shipment?.delivery_type === 'external';
  const isPickup = schedule?.shipment?.delivery_type === 'pickup';

  let branchCoords = null;
  let pickupAddressStr = '';
  if (isPickup && schedule?.shipment?.pickup_branch?.address) {
    const bAddress = schedule.shipment.pickup_branch.address;
    pickupAddressStr = `${bAddress.city || ''}, ${bAddress.zone || ''} - ${bAddress.street || ''}`;
    if (bAddress.latitude && bAddress.longitude) {
      branchCoords = { lat: parseFloat(bAddress.latitude), lng: parseFloat(bAddress.longitude) };
    }
  }

  const mapLat = isPickup ? branchCoords?.lat : schedule?.latitude;
  const mapLng = isPickup ? branchCoords?.lng : schedule?.longitude;

  const getStatusInfo = (status) => {
    if (isPickup) {
      switch (status) {
        case 'pending':
        case 'assigned':
        case 'requested': return { label: 'Solicitado', icon: <Clock size={28} />, color: '#64748b', activeStep: 1 };
        case 'reserved': return { label: 'Reservado', icon: <CheckCircle size={28} />, color: '#3b82f6', activeStep: 2 };
        case 'preparing': return { label: 'Preparando', icon: <Package size={28} />, color: '#f97316', activeStep: 3 };
        case 'ready_for_pickup': return { label: 'Listo para recoger', icon: <MapPin size={28} />, color: '#8b5cf6', activeStep: 4 };
        case 'completed': return { label: 'Entregado', icon: <CheckCircle size={28} />, color: '#10b981', activeStep: 5 };
        case 'cancelled': return { label: 'Cancelado', icon: <AlertCircle size={28} />, color: '#ef4444', activeStep: 0 };
        default: return { label: 'Desconocido', icon: <Package size={28} />, color: '#6b7280', activeStep: 0 };
      }
    } else if (isExternal) {
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
    const variantAttrIds = variant?.variant_attribute_values?.map(v => v.attribute_value_id) || [];
    const colorImg = product?.attribute_value_images?.find(img => variantAttrIds.includes(img.attribute_value_id));
    
    let imageUrl = variant?.variant_images?.[0]?.url || colorImg?.url || product?.product_images?.find(img => img.is_main)?.url || product?.product_images?.[0]?.url;
    
    if (!imageUrl) {
      const fallbackPath = variant?.variant_images?.[0]?.image_path || colorImg?.image_path || product?.product_images?.[0]?.image_path;
      if (fallbackPath) {
        imageUrl = fallbackPath;
      }
    }

    return imageUrl ? getImageUrl(imageUrl) : null;
  };

  // Calculate Progress width
  const progressWidth = statusInfo.activeStep === 0 ? 0 : ((statusInfo.activeStep - 1) / 4) * 100;

  return (
    <div className="tracking-wrapper">
      <div className="tracking-card">
        <div className="tracking-header">
          <h1>Seguimiento de Envío</h1>
          <p className="tracking-ref"><strong>Ref: {schedule.shipment?.delivery_code || schedule.id.slice(0,8)} {sale?.invoice_number ? `| Venta: ${sale.invoice_number}` : ''}</strong></p>
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
            ) : isPickup ? (
              <>
                <div className={`timeline-step ${statusInfo.activeStep >= 1 ? 'active' : ''} ${statusInfo.activeStep === 1 ? 'current' : ''}`}>
                  <div className="step-icon"><Clock size={16} /></div>
                  <p>Solicitado</p>
                </div>
                <div className={`timeline-step ${statusInfo.activeStep >= 2 ? 'active' : ''} ${statusInfo.activeStep === 2 ? 'current' : ''}`}>
                  <div className="step-icon"><CheckCircle size={16} /></div>
                  <p>Reservado</p>
                </div>
                <div className={`timeline-step ${statusInfo.activeStep >= 3 ? 'active' : ''} ${statusInfo.activeStep === 3 ? 'current' : ''}`}>
                  <div className="step-icon"><Package size={16} /></div>
                  <p>Preparando</p>
                </div>
                <div className={`timeline-step ${statusInfo.activeStep >= 4 ? 'active' : ''} ${statusInfo.activeStep === 4 ? 'current' : ''}`}>
                  <div className="step-icon"><MapPin size={16} /></div>
                  <p>Listo para recoger</p>
                </div>
                <div className={`timeline-step ${statusInfo.activeStep >= 5 ? 'active' : ''} ${statusInfo.activeStep === 5 ? 'current' : ''}`}>
                  <div className="step-icon"><CheckCircle size={16} /></div>
                  <p>Entregado</p>
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
              <span className="detail-label">Cliente</span>
              <span className="detail-value">{customerName} {customerCode ? `(Cód: ${customerCode})` : ''}</span>
            </div>
            {customerPhone && (
              <div className="detail-item">
                <span className="detail-label">WhatsApp</span>
                <span className="detail-value">{customerPhone}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">{schedule.shipment?.delivery_type === 'home_delivery' ? 'Dirección de Entrega' : 'Lugar de Entrega'}</span>
              <span className="detail-value">
                {isPickup && pickupAddressStr ? (
                  <>
                    <strong>{schedule.shipment.pickup_branch?.name ? `Sucursal ${schedule.shipment.pickup_branch.name}` : 'Sucursal'}</strong>
                    <br />
                    {pickupAddressStr}
                  </>
                ) : (schedule.shipment?.delivery_type === 'home_delivery' && schedule.shipment?.address 
                  ? `${schedule.shipment.address.street}, ${schedule.shipment.address.zone}` 
                  : schedule.meeting_point)}
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
          {mapLat && mapLng && isLoaded && !isExternal && (
            <div style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', height: '250px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={{ lat: Number(mapLat), lng: Number(mapLng) }}
                zoom={16}
                options={{ disableDefaultUI: true, gestureHandling: 'greedy' }}
              >
                <MarkerF position={{ lat: Number(mapLat), lng: Number(mapLng) }} />
              </GoogleMap>
            </div>
          )}

          {isExternal && (
            <div style={{ marginTop: '20px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#0f172a', fontSize: '16px' }}>
                  <User size={18} style={{ color: '#0ea5e9' }} /> Persona que Recibe
                </h4>
                {schedule.shipment?.recipient_edit_session?.is_shared && !isEditingRecipient && (
                  <button 
                    onClick={() => setIsEditingRecipient(true)}
                    style={{ background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                )}
              </div>
              
              {isEditingRecipient ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Nombre</label>
                    <input type="text" value={recipientForm.recipient_name} onChange={(e) => setRecipientForm({...recipientForm, recipient_name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', color: '#1e293b' }} placeholder="Nombre completo" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>C.I.</label>
                    <input type="text" value={recipientForm.recipient_ci} onChange={(e) => setRecipientForm({...recipientForm, recipient_ci: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', color: '#1e293b' }} placeholder="Carnet de Identidad" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Teléfono / WhatsApp</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" placeholder="+591" 
                        value={(recipientForm.recipient_phone || '').includes(' ') ? (recipientForm.recipient_phone || '').split(' ')[0] : '+591'} 
                        onChange={(e) => {
                          const code = e.target.value;
                          const num = (recipientForm.recipient_phone || '').includes(' ') ? (recipientForm.recipient_phone || '').split(' ').slice(1).join(' ') : (recipientForm.recipient_phone || '');
                          setRecipientForm({...recipientForm, recipient_phone: `${code} ${num}`.trim()});
                        }} 
                        style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', color: '#1e293b', textAlign: 'center' }} 
                      />
                      <input type="text" placeholder="Número de contacto" 
                        value={(recipientForm.recipient_phone || '').includes(' ') ? (recipientForm.recipient_phone || '').split(' ').slice(1).join(' ') : (recipientForm.recipient_phone || '')} 
                        onChange={(e) => {
                          const num = e.target.value;
                          const code = (recipientForm.recipient_phone || '').includes(' ') ? (recipientForm.recipient_phone || '').split(' ')[0] : '+591';
                          setRecipientForm({...recipientForm, recipient_phone: `${code} ${num}`.trim()});
                        }} 
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', color: '#1e293b' }} 
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Destino (Ciudad / Depto)</label>
                    <input type="text" value={recipientForm.destination_city} onChange={(e) => setRecipientForm({...recipientForm, destination_city: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', color: '#1e293b' }} placeholder="Ej: La Paz" />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => {
                        setIsEditingRecipient(false);
                        setRecipientForm({
                          recipient_name: schedule.shipment.recipient_name || '',
                          recipient_ci: schedule.shipment.recipient_ci || '',
                          recipient_phone: schedule.shipment.recipient_phone || '',
                          destination_city: schedule.shipment.destination_city || ''
                        });
                      }} 
                      disabled={savingRecipient}
                      style={{ padding: '10px 16px', borderRadius: '8px', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveRecipient}
                      disabled={savingRecipient}
                      style={{ padding: '10px 16px', borderRadius: '8px', background: '#0ea5e9', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {savingRecipient ? 'Guardando...' : <><Save size={14} /> Guardar</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Nombre:</span>
                    <span style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700 }}>{schedule.shipment?.recipient_name || <span style={{ color: '#94a3b8', fontWeight: 400, fontStyle: 'italic' }}>No especificado</span>}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>CI:</span>
                    <span style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700 }}>{schedule.shipment?.recipient_ci || <span style={{ color: '#94a3b8', fontWeight: 400, fontStyle: 'italic' }}>No especificado</span>}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Teléfono:</span>
                    <span style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700 }}>{schedule.shipment?.recipient_phone || <span style={{ color: '#94a3b8', fontWeight: 400, fontStyle: 'italic' }}>No especificado</span>}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Destino:</span>
                    <span style={{ color: '#0f172a', fontSize: '15px', fontWeight: 700 }}>{schedule.shipment?.destination_city || <span style={{ color: '#94a3b8', fontWeight: 400, fontStyle: 'italic' }}>No especificado</span>}</span>
                  </div>
                </div>
              )}
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
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Costo de Envío:</span>
                      <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>Bs. {Number(schedule.shipment.shipping_cost || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ marginTop: '8px', padding: '10px', background: '#fffbeb', color: '#b45309', borderRadius: '8px', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center', border: '1px solid #fef3c7' }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <p style={{ margin: 0, lineHeight: 1.4 }}>Recuerda que debes pagar el costo de envío directamente a la agencia de transporte al recoger tu paquete.</p>
                    </div>
                  </>
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
                <div 
                  key={idx} 
                  className="product-item"
                  style={{
                    opacity: item.deleted_at ? 0.6 : 1,
                    filter: item.deleted_at ? 'grayscale(100%)' : 'none',
                    background: item.deleted_at ? '#f9fafb' : '#fff'
                  }}
                >
                  {imgUrl ? (
                    <img src={imgUrl} alt="Producto" className="product-image" />
                  ) : (
                    <div className="product-image-placeholder">
                      <Box size={24} />
                    </div>
                  )}
                  
                  <div className="product-details" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, gap: '12px', width: '100%' }}>
                    <div className="product-left-col" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="product-name" style={{ textDecoration: item.deleted_at ? 'line-through' : 'none', fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>
                        {variant?.product?.name || 'Producto'}
                      </div>
                      <div className="product-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {variant?.size && <span className="product-badge">Talla: {variant.size.name}</span>}
                        {variant?.fit && <span className="product-badge">Fit: {variant.fit.name}</span>}
                        {variant?.variant_attribute_values?.map(attrVal => (
                          <span key={attrVal.attribute_value_id} className="product-badge">
                            {attrVal.attribute_value?.attribute?.name}: {attrVal.attribute_value?.value}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="product-price-block" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                      <span className="product-qty" style={{ textDecoration: item.deleted_at ? 'line-through' : 'none', fontSize: '13px', color: '#64748b' }}>
                        {item.quantity}x Bs. {Number(item.unit_price).toFixed(2)}
                      </span>
                      {Number(item.discount) > 0 && !item.deleted_at && (
                        <span style={{ fontSize: '13px', color: '#059669', fontWeight: 600, background: '#d1fae5', padding: '2px 8px', borderRadius: '12px' }}>
                          Desc: -Bs. {Number(item.discount).toFixed(2)}
                        </span>
                      )}
                      <span className="product-subtotal" style={{ textDecoration: item.deleted_at ? 'line-through' : 'none', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        Bs. {Number(item.subtotal).toFixed(2)}
                      </span>
                      {item.deleted_at && (
                        <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600, display: 'block' }}>
                          Rechazado
                        </span>
                      )}
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
            {Number(shipment?.agency_dispatch_cost) > 0 && (
              <div className="summary-row">
                <span>Costo de Envío a Agencia</span>
                <span>Bs. {Number(shipment?.agency_dispatch_cost).toFixed(2)}</span>
              </div>
            )}
            
            {shipment?.shipping_payment_type !== 'collect' && Number(shipment?.shipping_cost) > 0 && (
              <div className="summary-row">
                <span>Costo de Envío</span>
                <span>Bs. {Number(shipment?.shipping_cost || 0).toFixed(2)}</span>
              </div>
            )}
            
            {Number(schedule?.shipment?.sale?.discount_total) > 0 && (
              <div className="summary-row" style={{ color: '#10b981', fontWeight: 600 }}>
                <span>Descuento Aplicado</span>
                <span>- Bs. {Number(schedule.shipment.sale.discount_total).toFixed(2)}</span>
              </div>
            )}

            {(() => {
              const totalPaid = sale?.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
              const isFullyPaid = sale?.status === 'paid';
              const isAdvance = checkoutSession?.isAdvancePayment;

              return (
                <>
                  {!isFullyPaid && totalPaid > 0 && (
                    <div className="summary-row" style={{ color: '#4f46e5', fontWeight: 600 }}>
                      <span>Adelanto Registrado</span>
                      <span>- Bs. {Number(totalPaid).toFixed(2)}</span>
                    </div>
                  )}

                  {checkoutSession && !isAdvance && Number(checkoutSession.montoReal) < (Number(sale?.total || 0) - totalPaid) && !(schedule?.shipment?.sale?.discount_id || schedule?.shipment?.sale?.giftcard_id) && (
                    <div className="summary-row" style={{ color: '#f59e0b', fontWeight: 600 }}>
                      <span>Ajuste Especial</span>
                      <span>- Bs. {((Number(sale?.total || 0) - totalPaid) - Number(checkoutSession.montoReal)).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="summary-row total" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '16px', marginTop: '8px', textTransform: 'uppercase' }}>
                    <span style={{ fontSize: '18px' }}>
                      {isFullyPaid ? 'TOTAL PAGADO' : 'TOTAL A PAGAR'}
                    </span>
                    <span style={{ fontSize: '22px', color: (checkoutSession && !isAdvance) ? '#4f46e5' : '#111827' }}>
                      Bs. {
                        (checkoutSession && !isAdvance) 
                          ? Number(checkoutSession.montoReal).toFixed(2) 
                          : Number((sale?.total || 0) - (!isFullyPaid ? totalPaid : 0)).toFixed(2)
                      }
                    </span>
                  </div>
                </>
              );
            })()}
          </div>

          {checkoutSession && (checkoutSession.isAdvancePayment || (!isExternal && statusInfo.activeStep === 4) || (isExternal && statusInfo.activeStep === 1)) && (
            <div className="checkout-session-card" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #e5e7eb' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <span style={{ display: 'inline-block', background: checkoutSession.isAdvancePayment ? '#e0e7ff' : '#dcfce7', color: checkoutSession.isAdvancePayment ? '#4338ca' : '#166534', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                  {checkoutSession.isAdvancePayment ? 'Por favor realiza el pago de tu adelanto' : 'Por favor realiza tu pago para completar la entrega'}
                </span>
                <div style={{ marginTop: '12px', fontSize: '24px', fontWeight: 800, color: checkoutSession.isAdvancePayment ? '#4338ca' : '#166534' }}>
                  Bs. {Number(checkoutSession.montoReal).toFixed(2)}
                </div>
              </div>

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
                    src={settings?.payment_qr ? getImageUrl(settings.payment_qr) : getImageUrl("/system/payments/default.png")} 
                    alt="QR Code" 
                    style={{ width: '200px', height: '200px', margin: '0 auto', display: 'block', borderRadius: '12px' }} 
                  />
                </div>
              )}

              {!checkoutSession.isAdvancePayment && (
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
              )}
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
