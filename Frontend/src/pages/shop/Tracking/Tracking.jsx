import { getImageUrl } from '../../../utils/imageUtils';
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Package, Truck, MapPin, CheckCircle, Clock, AlertCircle, ShoppingBag, User, Phone, Map, Box, StickyNote, Check, Edit2, X as XIcon, Save, Loader2, Download, Share2, Calendar, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
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
  const [removingDiscount, setRemovingDiscount] = useState(false);
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

  const fetchTracking = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTracking(true);

    const globalChannel = echo.channel(`deliveries.global`);
    globalChannel.listen('.delivery.status.updated', () => {
      fetchTracking(false);
    });
    globalChannel.listen('.delivery.discount.applied', () => {
      fetchTracking(false);
    });
    globalChannel.listen('.delivery.discount.removed', () => {
      fetchTracking(false);
    });

    const privateChannel = echo.channel(`deliveries.${id}`);
    privateChannel.listen('.delivery.status.updated', () => {
      fetchTracking(false);
    });
    privateChannel.listen('.delivery.discount.applied', () => {
      fetchTracking(false);
    });
    privateChannel.listen('.delivery.discount.removed', () => {
      fetchTracking(false);
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
      if (
        data.type === 'recipient_info_updated' || 
        data.type === 'recipient_edit_toggled' ||
        data.type === 'discount_applied' ||
        data.type === 'discount_removed'
      ) {
        fetchTracking(false);
      }
    });

    return () => {
      globalChannel.stopListening('.delivery.status.updated');
      globalChannel.stopListening('.delivery.discount.applied');
      globalChannel.stopListening('.delivery.discount.removed');
      echo.leaveChannel(`deliveries.global`);

      privateChannel.stopListening('.delivery.status.updated');
      privateChannel.stopListening('.delivery.discount.applied');
      privateChannel.stopListening('.delivery.discount.removed');
      privateChannel.stopListening('.checkout.session.shared');
      privateChannel.stopListening('.DeliveryNotesUpdated');
      privateChannel.stopListening('.DeliveryUpdated');
      echo.leaveChannel(`deliveries.${id}`);
    };
  }, [id, fetchTracking]);

  const handleRemoveDiscount = async () => {
    setRemovingDiscount(true);
    setDiscountMessage(null);
    try {
      const res = await axios.post(`${API_URL}/v1/delivery/${id}/remove-discount`);
      setDiscountMessage(null);
      setDiscountCode('');
      if (res.data?.checkout_session) {
        const cs = res.data.checkout_session;
        setCheckoutSession({
          paymentMethod: cs.payment_method,
          montoReal: cs.monto_real,
          cashAmount: cs.cash_amount,
          qrAmount: cs.qr_amount,
          saleTotal: cs.sale_total,
          isAdvancePayment: cs.is_advance_payment
        });
      }
      await fetchTracking(false);
    } catch (err) {
      setDiscountMessage({ type: 'error', text: err.response?.data?.error || "Error al quitar el descuento" });
    } finally {
      setRemovingDiscount(false);
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
      if (res.data?.checkout_session) {
        const cs = res.data.checkout_session;
        setCheckoutSession({
          paymentMethod: cs.payment_method,
          montoReal: cs.monto_real,
          cashAmount: cs.cash_amount,
          qrAmount: cs.qr_amount,
          saleTotal: cs.sale_total,
          isAdvancePayment: cs.is_advance_payment
        });
      }
      await fetchTracking(false);
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
  
  
  const computedShippingCost = shipment?.shipping_payment_type !== 'collect' ? Number(shipment?.shipping_cost || 0) : 0;
  const computedAgencyCost = Number(shipment?.agency_dispatch_cost || 0);
  const grandTotal = Number(sale?.dynamic_total || 0) + computedShippingCost + computedAgencyCost;

  const hasGlobalDiscount = (sale?.discount_id != null) || (sale?.sale_applied_discounts?.some(d => d.sale_detail_id == null));
  const hasGiftcard = sale?.giftcard_id != null;
  const hasDiscountOrGiftcard = hasGlobalDiscount || hasGiftcard;

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
        case 'requested': return { label: 'Solicitado', icon: <Clock size={28} />, color: '#64748b', theme: 'theme-slate', activeStep: 1 };
        case 'reserved': return { label: 'Reservado', icon: <CheckCircle size={28} />, color: '#3b82f6', theme: 'theme-blue', activeStep: 2 };
        case 'preparing': return { label: 'Preparando', icon: <Package size={28} />, color: '#f97316', theme: 'theme-orange', activeStep: 3 };
        case 'ready_for_pickup': return { label: 'Listo para recoger', icon: <MapPin size={28} />, color: '#8b5cf6', theme: 'theme-purple', activeStep: 4 };
        case 'completed': return { label: 'Entregado', icon: <CheckCircle size={28} />, color: '#10b981', theme: 'theme-emerald', activeStep: 5 };
        case 'cancelled': return { label: 'Cancelado', icon: <AlertCircle size={28} />, color: '#ef4444', theme: 'theme-red', activeStep: 0 };
        default: return { label: 'Desconocido', icon: <Package size={28} />, color: '#6b7280', theme: 'theme-gray', activeStep: 0 };
      }
    } else if (isExternal) {
      switch (status) {
        case 'pending': 
        case 'assigned': 
          return { label: 'Pendiente', icon: <Package size={28} />, color: '#64748b', theme: 'theme-slate', activeStep: 1 };
        case 'prepared': return { label: 'Preparando paquete', icon: <Box size={28} />, color: '#f97316', theme: 'theme-orange', activeStep: 2 };
        case 'packaged': return { label: 'Empaquetado', icon: <Package size={28} />, color: '#0ea5e9', theme: 'theme-sky', activeStep: 3 };
        case 'shipped': return { label: 'Remitido', icon: <Truck size={28} />, color: '#3b82f6', theme: 'theme-blue', activeStep: 4 };
        case 'completed': return { label: 'Completado', icon: <CheckCircle size={28} />, color: '#10b981', theme: 'theme-emerald', activeStep: 5 };
        case 'cancelled': return { label: 'Cancelado', icon: <AlertCircle size={28} />, color: '#ef4444', theme: 'theme-red', activeStep: 0 };
        default: return { label: 'Desconocido', icon: <Package size={28} />, color: '#6b7280', theme: 'theme-gray', activeStep: 0 };
      }
    } else {
      switch (status) {
        case 'pending': return { label: 'Preparando', icon: <Package size={28} />, color: '#64748b', theme: 'theme-slate', activeStep: 1 };
        case 'assigned': return { label: 'Agendado', icon: <Clock size={28} />, color: '#4f46e5', theme: 'theme-indigo', activeStep: 2 };
        case 'on_the_way': return { label: 'En Camino', icon: <Truck size={28} />, color: '#3b82f6', theme: 'theme-blue', activeStep: 3 };
        case 'at_the_meeting_point': return { label: 'En el Punto', icon: <MapPin size={28} />, color: '#8b5cf6', theme: 'theme-purple', activeStep: 4 };
        case 'completed': return { label: 'Entregado', icon: <CheckCircle size={28} />, color: '#10b981', theme: 'theme-emerald', activeStep: 5 };
        case 'cancelled': return { label: 'Cancelado', icon: <AlertCircle size={28} />, color: '#ef4444', theme: 'theme-red', activeStep: 0 };
        default: return { label: 'Desconocido', icon: <Package size={28} />, color: '#6b7280', theme: 'theme-gray', activeStep: 0 };
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

  const qrImageUrl = settings?.payment_qr ? getImageUrl(settings.payment_qr) : getImageUrl("/system/payments/default.png");

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QR-Pago-${schedule.shipment?.delivery_code || schedule.id.slice(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Código QR descargado');
    } catch {
      window.open(qrImageUrl, '_blank');
      toast.success('Abriendo imagen QR');
    }
  };

  const handleShareQR = async () => {
    const trackingCode = schedule.shipment?.delivery_code || schedule.id.slice(0, 8);
    const shareData = {
      title: 'QR de Pago - Voxman',
      text: `Código QR para el pago de tu pedido (Ref: ${trackingCode}).`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    navigator.clipboard.writeText(window.location.href);
    toast.success('Enlace de pago copiado al portapapeles');
  };

  return (
    <div className="tracking-wrapper">
      <div className="tracking-card">
        <div className="tracking-header">
          <h1>Seguimiento de Envío</h1>
          <p className="tracking-ref"><strong>Ref: {schedule.shipment?.delivery_code || schedule.id.slice(0,8)} {sale?.invoice_number ? `| Venta: ${sale.invoice_number}` : ''}</strong></p>
        </div>

        <div className={`tracking-status-hero ${statusInfo.theme || 'theme-indigo'}`}>
          <div className="status-icon">
            {statusInfo.icon}
          </div>
          <div className="status-text">
            <h2>{statusInfo.label}</h2>
            <p>Hola <strong>{customerName}</strong>, este es el estado actual de tu entrega.</p>
          </div>
        </div>


        {schedule.status !== 'cancelled' && (
          <div className={`tracking-timeline ${statusInfo.theme || 'theme-indigo'}`}>
            <div className={`timeline-progress progress-step-${statusInfo.activeStep || 0}`}></div>
            
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

        <div className="tracking-main-grid">
          <div className="tracking-section no-margin">
          <h3 className="section-title"><Map size={20} /> Detalles Logísticos</h3>
          <div className="details-grid">
            <div className={`detail-item ${!customerPhone ? 'span-2' : ''}`}>
              <span className="detail-label">
                <User size={13} className="detail-icon" /> Cliente
              </span>
              <span className="detail-value">{customerName} {customerCode ? `(Cód: ${customerCode})` : ''}</span>
            </div>
            {customerPhone && (
              <div className="detail-item">
                <span className="detail-label">
                  <Phone size={13} className="detail-icon" /> WhatsApp
                </span>
                <span className="detail-value">{customerPhone}</span>
              </div>
            )}
            <div className="detail-item span-2">
              <span className="detail-label">
                <MapPin size={13} className="detail-icon" />
                {schedule.shipment?.delivery_type === 'home_delivery' ? 'Dirección de Entrega' : 'Lugar de Entrega'}
              </span>
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
              <span className="detail-label">
                <Calendar size={13} className="detail-icon" /> Fecha Programada
              </span>
              <span className="detail-value">{schedule.scheduled_date}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">
                <Clock size={13} className="detail-icon" /> Hora Estimada
              </span>
              <span className="detail-value">{schedule.time_window || "A convenir"}</span>
            </div>
          </div>
          {mapLat && mapLng && isLoaded && !isExternal && (
            <div className="tracking-map-container">
              <GoogleMap
                mapContainerClassName="tracking-map-canvas"
                center={{ lat: Number(mapLat), lng: Number(mapLng) }}
                zoom={16}
                options={{ disableDefaultUI: true, gestureHandling: 'greedy' }}
              >
                <MarkerF position={{ lat: Number(mapLat), lng: Number(mapLng) }} />
              </GoogleMap>
            </div>
          )}

          {isExternal && (
            <div className="tracking-recipient-card">
              <div className="tracking-recipient-header">
                <h4 className="tracking-recipient-title">
                  <User size={18} className="tracking-recipient-icon" /> Persona que Recibe
                </h4>
                {schedule.shipment?.recipient_edit_session?.is_shared && !isEditingRecipient && (
                  <button 
                    type="button"
                    onClick={() => setIsEditingRecipient(true)}
                    className="tracking-recipient-edit-btn"
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                )}
              </div>
              
              {isEditingRecipient ? (
                <div className="tracking-recipient-form">
                  <div className="tracking-form-group">
                    <label className="tracking-form-label">Nombre</label>
                    <input 
                      type="text" 
                      value={recipientForm.recipient_name} 
                      onChange={(e) => setRecipientForm({...recipientForm, recipient_name: e.target.value})} 
                      className="tracking-form-input" 
                      placeholder="Nombre completo" 
                    />
                  </div>
                  <div className="tracking-form-group">
                    <label className="tracking-form-label">C.I.</label>
                    <input 
                      type="text" 
                      value={recipientForm.recipient_ci} 
                      onChange={(e) => setRecipientForm({...recipientForm, recipient_ci: e.target.value})} 
                      className="tracking-form-input" 
                      placeholder="Carnet de Identidad" 
                    />
                  </div>
                  <div className="tracking-form-group">
                    <label className="tracking-form-label">Teléfono / WhatsApp</label>
                    <div className="tracking-phone-inputs">
                      <input 
                        type="text" 
                        placeholder="+591" 
                        value={(recipientForm.recipient_phone || '').includes(' ') ? (recipientForm.recipient_phone || '').split(' ')[0] : '+591'} 
                        onChange={(e) => {
                          const code = e.target.value;
                          const num = (recipientForm.recipient_phone || '').includes(' ') ? (recipientForm.recipient_phone || '').split(' ').slice(1).join(' ') : (recipientForm.recipient_phone || '');
                          setRecipientForm({...recipientForm, recipient_phone: `${code} ${num}`.trim()});
                        }} 
                        className="tracking-phone-code" 
                      />
                      <input 
                        type="text" 
                        placeholder="Número de contacto" 
                        value={(recipientForm.recipient_phone || '').includes(' ') ? (recipientForm.recipient_phone || '').split(' ').slice(1).join(' ') : (recipientForm.recipient_phone || '')} 
                        onChange={(e) => {
                          const num = e.target.value;
                          const code = (recipientForm.recipient_phone || '').includes(' ') ? (recipientForm.recipient_phone || '').split(' ')[0] : '+591';
                          setRecipientForm({...recipientForm, recipient_phone: `${code} ${num}`.trim()});
                        }} 
                        className="tracking-phone-number" 
                      />
                    </div>
                  </div>
                  <div className="tracking-form-group">
                    <label className="tracking-form-label">Destino (Ciudad / Depto)</label>
                    <input 
                      type="text" 
                      value={recipientForm.destination_city} 
                      onChange={(e) => setRecipientForm({...recipientForm, destination_city: e.target.value})} 
                      className="tracking-form-input" 
                      placeholder="Ej: La Paz" 
                    />
                  </div>
                  <div className="tracking-form-actions">
                    <button 
                      type="button"
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
                      className="tracking-btn-cancel"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button"
                      onClick={handleSaveRecipient}
                      disabled={savingRecipient}
                      className="tracking-btn-save"
                    >
                      {savingRecipient ? (
                        <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                      ) : (
                        <><Save size={14} /> Guardar</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="tracking-info-list">
                  <div className="tracking-info-row">
                    <span className="tracking-info-label">Nombre:</span>
                    <span className="tracking-info-value">{schedule.shipment?.recipient_name || <span className="tracking-info-value unspecified">No especificado</span>}</span>
                  </div>
                  <div className="tracking-info-row">
                    <span className="tracking-info-label">CI:</span>
                    <span className="tracking-info-value">{schedule.shipment?.recipient_ci || <span className="tracking-info-value unspecified">No especificado</span>}</span>
                  </div>
                  <div className="tracking-info-row">
                    <span className="tracking-info-label">Teléfono:</span>
                    <span className="tracking-info-value">{schedule.shipment?.recipient_phone || <span className="tracking-info-value unspecified">No especificado</span>}</span>
                  </div>
                  <div className="tracking-info-row">
                    <span className="tracking-info-label">Destino:</span>
                    <span className="tracking-info-value">{schedule.shipment?.destination_city || <span className="tracking-info-value unspecified">No especificado</span>}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {isExternal && (
            <div className="tracking-agency-card">
              <h4 className="tracking-agency-title">
                <Truck size={18} className="tracking-agency-icon" /> Información de Transportadora
              </h4>
              <div className="tracking-info-list">
                <div className="tracking-info-row">
                  <span className="tracking-info-label">Agencia:</span>
                  <span className="tracking-info-value">{schedule.shipment?.external_company || 'Pendiente'}</span>
                </div>
                <div className="tracking-info-row">
                  <span className="tracking-info-label">Nro. Guía:</span>
                  <span className={`tracking-guide-badge ${schedule.shipment?.external_guide ? '' : 'is-pending'}`}>
                    {schedule.shipment?.external_guide || 'Pendiente'}
                  </span>
                </div>
                <div className="tracking-info-row">
                  <span className="tracking-info-label">Tipo de Pago:</span>
                  <span className="tracking-agency-val">
                    {schedule.shipment?.shipping_payment_type === 'collect' ? 'Pago en Destino' : (schedule.shipment?.shipping_payment_type === 'paid' ? 'Pagado en Origen' : 'Pendiente')}
                  </span>
                </div>
                {schedule.shipment?.shipping_payment_type === 'collect' && (
                  <>
                    <div className="tracking-info-row">
                      <span className="tracking-info-label">Costo de Envío:</span>
                      <span className="tracking-agency-val">Bs. {Number(schedule.shipment.shipping_cost || 0).toFixed(2)}</span>
                    </div>
                    <div className="tracking-agency-alert">
                      <AlertCircle size={16} className="tracking-agency-alert-icon" />
                      <p>Recuerda que debes pagar el costo de envío directamente a la agencia de transporte al recoger tu paquete.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {isExternal && schedule.shipment?.tracking_history?.length > 0 && (
            <div className="tracking-history-card">
              <h4 className="tracking-history-title">
                <Clock size={16} /> Historial de Seguimiento
              </h4>
              <div className="tracking-history-timeline">
                <div className="tracking-history-spine"></div>
                {schedule.shipment.tracking_history.map((track, i) => (
                  <div key={i} className="tracking-history-step">
                    <div className={`tracking-history-dot ${i === schedule.shipment.tracking_history.length - 1 ? 'latest' : ''}`}></div>
                    <div>
                      <p className="tracking-history-desc">{track.description}</p>
                      <span className="tracking-history-date">
                        {new Date(track.created_at).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas de Entrega Editable */}
          <div className="tracking-notes-box">
            <div className="tracking-notes-header">
              <h4 className="tracking-notes-title">
                <FileText size={16} className="tracking-notes-icon" /> Notas de Entrega
              </h4>
              <span className="tracking-notes-hint">Instrucciones o referencias para la entrega</span>
            </div>
            <div className="tracking-notes-form">
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añade instrucciones especiales, referencias o indicaciones para la entrega..."
                className="tracking-notes-textarea"
                disabled={statusInfo.activeStep >= 5} // Disable if completed
              />
              {statusInfo.activeStep < 5 && (
                <div className="tracking-notes-actions">
                  {notesSuccess && (
                    <span className="tracking-notes-saved-badge">
                      <Check size={14} /> Guardado con éxito
                    </span>
                  )}
                  <button 
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="tracking-notes-btn-save"
                  >
                    {savingNotes ? (
                      <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                    ) : (
                      <>
                        <Save size={14} /> Guardar Notas
                      </>
                    )}
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

          <div className="tracking-section no-margin">
            <h3 className="section-title"><ShoppingBag size={20} /> Detalle del Pedido</h3>
          <div className="products-list">
            {details.map((item, idx) => {
              const variant = item.product_variant;
              const imgUrl = resolveImageUrl(variant);
              return (
                <div 
                  key={idx} 
                  className={`product-item ${item.deleted_at ? 'item-deleted' : ''}`}
                >
                  {imgUrl ? (
                    <img src={imgUrl} alt="Producto" className="product-image" />
                  ) : (
                    <div className="product-image-placeholder">
                      <Box size={24} />
                    </div>
                  )}
                  
                  <div className="product-details product-item-details-wrap">
                    <div className="product-left-col">
                      <div className={`product-name ${item.deleted_at ? 'is-deleted' : ''}`}>
                        {variant?.product?.name || 'Producto'}
                      </div>
                      <div className="product-badges">
                          {(() => {
                            const dynamicAttrs = variant?.variant_attribute_values || [];
                            const hasDynamicTalla = dynamicAttrs.some(attrVal => attrVal.attribute_value?.attribute?.name?.toLowerCase() === 'talla');
                            const hasDynamicColor = dynamicAttrs.some(attrVal => attrVal.attribute_value?.attribute?.name?.toLowerCase() === 'color');
                            return (
                              <>
                                {item.bundle_group_id && (
                                  <span className="product-badge bundle-badge">
                                    ⭐ Ítem de Conjunto
                                  </span>
                                )}
                                {!hasDynamicTalla && variant?.size && <span className="product-badge">Talla: {variant.size.name}</span>}
                                {!hasDynamicColor && variant?.fit && <span className="product-badge">Color: {variant.fit.name}</span>}
                                {dynamicAttrs.map(attrVal => (
                                  <span key={attrVal.attribute_value_id} className="product-badge">
                                    {attrVal.attribute_value?.attribute?.name}: {attrVal.attribute_value?.value}
                                  </span>
                                ))}
                              </>
                            );
                          })()}
                        </div>
                    </div>
                    
                    <div className="product-price-block product-price-block-wrap">
                      <div className="product-qty-col">
                          {item.original_price && item.original_price > (item.dynamic_unit_price || item.unit_price) && !item.deleted_at && (
                            <span className="product-price-original">
                              {item.quantity}x Bs. {Number(item.original_price).toFixed(2)}
                            </span>
                          )}
                          <span className={`product-qty ${item.deleted_at ? 'is-deleted' : ''}`}>
                            {item.quantity}x Bs. {Number(item.dynamic_unit_price || item.unit_price).toFixed(2)}
                          </span>
                        </div>
                        {(() => {
                          const effPrice = item.dynamic_unit_price || item.unit_price;
                          const origPrice = (item.original_price && item.original_price > effPrice) ? item.original_price : effPrice;
                          const dynamicItemDiscount = (origPrice - effPrice) * item.quantity;
                          
                          if (dynamicItemDiscount > 0 && !item.deleted_at) {
                            return (
                              <span className="product-discount-badge">
                                Desc: -Bs. {dynamicItemDiscount.toFixed(2)}
                              </span>
                            );
                          }
                          return null;
                        })()}
                        <span className={`product-subtotal ${item.deleted_at ? 'is-deleted' : ''}`}>
                          Bs. {Number(item.dynamic_subtotal || item.subtotal).toFixed(2)}
                        </span>
                      {item.deleted_at && (
                        <span className="product-rejected-tag">
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
              <span>Bs. {Number(sale?.dynamic_subtotal || sale?.subtotal || 0).toFixed(2)}</span>
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
            
            {Number(sale?.dynamic_global_discount) > 0 && (
              <div className="summary-row discount-row">
                <span>Descuento Aplicado</span>
                <span>- Bs. {Number(sale?.dynamic_global_discount).toFixed(2)}</span>
              </div>
            )}

            {(() => {
              const totalPaid = sale?.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
              const isFullyPaid = sale?.status === 'paid';
              const isAdvance = checkoutSession?.isAdvancePayment;
                const defaultToPay = grandTotal - (!isFullyPaid ? totalPaid : 0);
                const isAjusteEspecial = checkoutSession && !isAdvance && Number(checkoutSession.montoReal) < defaultToPay && !hasDiscountOrGiftcard;
                const finalMontoReal = (checkoutSession && !isAdvance && !isAjusteEspecial) 
                  ? defaultToPay 
                  : (checkoutSession ? Number(checkoutSession.montoReal) : defaultToPay);
  
                return (
                  <>
                    {!isFullyPaid && totalPaid > 0 && (
                      <div className="summary-row advance-row">
                        <span>Adelanto Registrado</span>
                        <span>- Bs. {Number(totalPaid).toFixed(2)}</span>
                      </div>
                    )}
  
                    {isAjusteEspecial && (
                      <div className="summary-row adjustment-row">
                        <span>Ajuste Especial</span>
                        <span>- Bs. {(defaultToPay - finalMontoReal).toFixed(2)}</span>
                      </div>
                    )}
  
                    <div className="summary-row total total-row">
                      <span className="summary-total-label">
                        {isFullyPaid ? 'TOTAL PAGADO' : 'TOTAL A PAGAR'}
                      </span>
                      <span className={`summary-total-value ${(checkoutSession && !isAdvance) ? 'highlighted' : ''}`}>
                        Bs. {finalMontoReal.toFixed(2)}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
  
            {checkoutSession && (checkoutSession.isAdvancePayment || (!isExternal && statusInfo.activeStep === 4) || (isExternal && statusInfo.activeStep === 1)) && (
              <div className="checkout-session-card">
                
                <div className="checkout-session-header">
                  <span className={`checkout-session-badge ${checkoutSession.isAdvancePayment ? 'advance' : ''}`}>
                    {checkoutSession.isAdvancePayment ? 'Por favor realiza el pago de tu adelanto' : 'Por favor realiza tu pago para completar la entrega'}
                  </span>
                  <div className={`checkout-session-amount ${checkoutSession.isAdvancePayment ? 'advance' : ''}`}>
                    Bs. {(() => {
                        const defaultToPay = grandTotal - (sale?.status !== 'paid' ? (sale?.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0) : 0);
                        const isAjusteEspecial = !checkoutSession.isAdvancePayment && Number(checkoutSession.montoReal) < defaultToPay && !hasDiscountOrGiftcard;
                        return (!checkoutSession.isAdvancePayment && !isAjusteEspecial) ? defaultToPay.toFixed(2) : Number(checkoutSession.montoReal).toFixed(2);
                    })()}
                  </div>
                </div>

              {checkoutSession.paymentMethod === 'ambos' && (
                <div className="checkout-split-methods">
                  <span className="checkout-split-method-item">Efectivo: Bs. {checkoutSession.cashAmount}</span>
                  <span className="checkout-split-method-item">QR: Bs. {checkoutSession.qrAmount}</span>
                </div>
              )}

              {(checkoutSession.paymentMethod === 'qr' || checkoutSession.paymentMethod === 'ambos') && (
                <div className="checkout-qr-container">
                  <div className="checkout-qr-header">
                    <p className="checkout-qr-title">Código QR de Pago</p>
                    <p className="checkout-qr-subtitle">Escanea desde tu banca móvil o descarga la imagen</p>
                  </div>
                  <div className="checkout-qr-card">
                    <img 
                      src={qrImageUrl} 
                      alt="Código QR de Pago" 
                      className="checkout-qr-image" 
                    />
                  </div>
                  <div className="checkout-qr-actions">
                    <button
                      type="button"
                      onClick={handleDownloadQR}
                      className="checkout-qr-action-btn"
                      title="Descargar código QR"
                    >
                      <Download size={14} />
                      <span>Descargar QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShareQR}
                      className="checkout-qr-action-btn"
                      title="Compartir enlace o código"
                    >
                      <Share2 size={14} />
                      <span>Compartir</span>
                    </button>
                  </div>
                </div>
              )}

              {!checkoutSession.isAdvancePayment && (
                <div className="checkout-discount-wrapper">
                  {(removingDiscount || applyingDiscount) && (
                    <div className={`checkout-discount-loading-overlay ${removingDiscount ? 'removing' : ''}`}>
                      <Loader2 size={24} className="animate-spin" />
                      <span>{removingDiscount ? 'Quitando descuento...' : 'Aplicando descuento...'}</span>
                    </div>
                  )}
                  {hasDiscountOrGiftcard ? (
                    <div className="checkout-discount-success-row">
                      <div className="checkout-discount-success-info">
                        <span className="checkout-discount-success-badge">
                          <Check size={13} /> Descuento Aplicado
                        </span>
                        <span className="checkout-discount-success-sub">El beneficio se ha descontado de tu total</span>
                      </div>
                      <button 
                        type="button"
                        onClick={handleRemoveDiscount} 
                        disabled={removingDiscount || applyingDiscount} 
                        className="checkout-discount-btn-remove"
                        title="Quitar descuento aplicado"
                      >
                        {removingDiscount ? (
                          <><Loader2 size={13} className="animate-spin" /> Quitando...</>
                        ) : (
                          <><XIcon size={13} /> Quitar</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="checkout-discount-form-title">Código de Descuento o Giftcard</p>
                      <div className="checkout-discount-input-row">
                        <input 
                          type="text" 
                          placeholder="VOX-XXXXXX o CÓDIGO" 
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          className="checkout-discount-input"
                          disabled={applyingDiscount || removingDiscount}
                        />
                        <button 
                          type="button"
                          onClick={handleApplyDiscount}
                          disabled={applyingDiscount || removingDiscount || !discountCode.trim()}
                          className="checkout-discount-btn-apply"
                        >
                          {applyingDiscount ? (
                            <><Loader2 size={15} className="animate-spin" /> Aplicando...</>
                          ) : (
                            'Aplicar'
                          )}
                        </button>
                      </div>
                      {discountMessage && (
                        <p className={`checkout-discount-feedback ${discountMessage.type === 'error' ? 'error' : 'success'}`}>
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
