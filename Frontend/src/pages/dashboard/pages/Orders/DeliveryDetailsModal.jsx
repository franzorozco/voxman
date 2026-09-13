import { getImageUrl } from '../../../../utils/imageUtils';
import { useState, useEffect } from "react";
import { X, MapPin, Phone, User, Package, CalendarClock, Truck, Link as LinkIcon, Edit3, XCircle, Save, Ban, Clock, CheckCircle, Share2, StickyNote, Plus, AlertTriangle, UserCheck, Lock, Unlock, Printer, DollarSign, Store, MessageCircle } from "lucide-react";
import { getDeliveryDetails, updateDeliveryStatus, updateDeliveryDetails, getDeliveryDrivers, removeDeliveryItem, restoreDeliveryItem, addDeliveryItem } from "../../../../api/admin/orderNetwork";
import AddProductToDeliveryModal from "./components/AddProductToDeliveryModal";
import api from "../../../../api/client";
import echo from "../../../../echo";
import { toast } from "react-hot-toast";
import { MarkerF } from '@react-google-maps/api';
import GoogleMapWrapper from "../../../../components/ui/GoogleMapWrapper";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";
import DiscountInput from '../../components/DiscountInput';
import CustomSelect from '../../../../components/ui/CustomSelect';
import CanAccess from '../../../../components/ui/CanAccess';
import { API_BASE_URL } from "../../../../config/api";
const logo = getImageUrl('/system/logos/logo_white.png');

const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '8px'
};

const defaultCenter = {
  lat: -16.4897,
  lng: -68.1193 // La Paz
};

const STEPS_LOCAL = [
  { key: 'pending', label: 'Pendiente' },
  { key: 'assigned', label: 'Agendado' },
  { key: 'on_the_way', label: 'En Camino' },
  { key: 'at_the_meeting_point', label: 'En el Punto' },
  { key: 'completed', label: 'Entregado' }
];

const STEPS_EXTERNAL = [
  { key: 'pending', label: 'Pendiente' },
  { key: 'prepared', label: 'Preparado' },
  { key: 'packaged', label: 'Empaquetado' },
  { key: 'shipped', label: 'Remitido' },
  { key: 'completed', label: 'Entregado' }
];

const STEPS_PICKUP = [
  { key: 'requested', label: 'Solicitado', description: 'Esperando confirmación o pago.' },
  { key: 'reserved', label: 'Reservado', description: 'Pago confirmado, inventario reservado.' },
  { key: 'preparing', label: 'Preparando', description: 'El pedido se está alistando.' },
  { key: 'ready_for_pickup', label: 'Listo para recoger', description: 'El pedido está listo en la sucursal.' },
  { key: 'completed', label: 'Completado', description: 'El pedido fue entregado.' }
];

const TRANSPORT_COMPANIES = [
  { name: 'BoA (Boliviana de Aviación)', type: 'Avión' },
  { name: 'EcoJet', type: 'Avión' },
  { name: 'Trans Copacabana S.A.', type: 'Bus' },
  { name: 'Flota Copacabana MEM 1', type: 'Bus' },
  { name: 'Bolívar', type: 'Bus' },
  { name: 'El Dorado', type: 'Bus' },
  { name: 'Cosmos', type: 'Bus' },
  { name: 'Naser', type: 'Bus' },
  { name: 'Danubio', type: 'Bus' },
  { name: 'Transzela', type: 'Bus' },
  { name: 'Urus', type: 'Bus' },
  { name: 'Trans Azul', type: 'Bus' },
  { name: 'Otro', type: 'Otro' }
];

const getStepIndex = (status, stepsArr = STEPS_LOCAL) => {
  const idx = stepsArr.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
};

export default function DeliveryDetailsModal({ scheduleId, onClose, onStatusChange, onEditRequest, generateWhatsAppLink }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentNextStatus, setPaymentNextStatus] = useState('completed');
  const [showShippedModal, setShowShippedModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [shippingCost, setShippingCost] = useState('');
  const [externalCompany, setExternalCompany] = useState('');
  const [customExternalCompany, setCustomExternalCompany] = useState('');
  const [externalGuide, setExternalGuide] = useState('');
  const [shippingPaymentType, setShippingPaymentType] = useState('collect');
  const [qrAmount, setQrAmount] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [montoReal, setMontoReal] = useState('');
  const [appliedCode, setAppliedCode] = useState(null);

  const sale = details?.shipment?.sale;
  const computedShippingCost = details?.shipment?.shipping_payment_type !== 'collect' ? Number(details?.shipment?.shipping_cost || 0) : 0;
  const computedAgencyCost = Number(details?.shipment?.agency_dispatch_cost || 0);
  const grandTotal = Number(sale?.dynamic_total || 0) + computedShippingCost + computedAgencyCost;
  const totalPaid = sale?.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const remainingAmount = Number(grandTotal - totalPaid);

  const hasGlobalDiscount = (sale?.discount_id != null) || (sale?.sale_applied_discounts?.some(d => d.sale_detail_id == null));
  const hasGiftcard = sale?.giftcard_id != null;
  const hasDiscountOrGiftcard = hasGlobalDiscount || hasGiftcard;

  const { settings, fetchSettings } = useShopSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isAdvancePayment, setIsAdvancePayment] = useState(false);
  
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (showPaymentModal) {
      if (isAdvancePayment) {
        setMontoReal(0);
      } else {
        setMontoReal(remainingAmount > 0 ? remainingAmount.toFixed(2) : '');
      }
    }
  }, [showPaymentModal, details, isAdvancePayment, remainingAmount]);



  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await getDeliveryDetails(scheduleId);
      const data = res.data.schedule || res.data;
      setDetails(data);
      setNotes(data.notes || '');
    } catch (err) {
      toast.error("Error al cargar detalles de la entrega");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!details) return;
    setSavingNotes(true);
    try {
      await updateDeliveryDetails(details.id, { notes: notes });
      toast.success("Notas guardadas correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar notas");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleRemoveItem = (detailId) => {
    setItemToRemove(detailId);
  };

  const handleConfirmRemoveItem = async () => {
    if (!itemToRemove) return;
    try {
      setLoading(true);
      await removeDeliveryItem(details.id, itemToRemove);
      toast.success('Prenda quitada y stock devuelto');
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al quitar la prenda');
      console.error(err);
      setLoading(false);
    } finally {
      setItemToRemove(null);
    }
  };

  const handleAddProduct = async (variant, branchId) => {
    try {
      setLoading(true);
      await addDeliveryItem(details.id, variant.id, branchId);
      toast.success('Prenda agregada exitosamente');
      setShowAddProduct(false);
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al agregar la prenda');
      console.error(err);
      setLoading(false);
    }
  };

  const handleRestoreItem = async (detailId) => {
    try {
      setLoading(true);
      await restoreDeliveryItem(details.id, detailId);
      toast.success('Prenda reintegrada a la entrega');
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al reintegrar la prenda');
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scheduleId) fetchDetails();
  }, [scheduleId]);

  useEffect(() => {
    if (!scheduleId) return;

    const channel = echo.channel(`deliveries.${scheduleId}`);
    channel.listen('.delivery.discount.applied', (data) => {
      toast.success(`Descuento aplicado: Bs. ${data.discountData?.amount || 0}`);
      fetchDetails(); 
    });
    channel.listen('.delivery.discount.removed', () => {
      toast.error(`Descuento removido`);
      fetchDetails();
    });
    channel.listen('.DeliveryNotesUpdated', (data) => {
      setNotes(data.notes || '');
      // No need to fetch all details, just update notes in state to reflect what other clients are seeing.
      setDetails(prev => {
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
    channel.listen('.DeliveryUpdated', (data) => {
      if (data.type === 'recipient_info_updated' || data.type === 'recipient_edit_toggled') {
        fetchDetails();
      }
    });

    return () => {
      channel.stopListening('.delivery.discount.applied');
      channel.stopListening('.delivery.discount.removed');
      channel.stopListening('.DeliveryNotesUpdated');
      channel.stopListening('.DeliveryUpdated');
      echo.leaveChannel(`deliveries.${scheduleId}`);
    };
  }, [scheduleId]);

  const handleRemoveDiscount = async () => {
    setUpdating(true);
    try {
      await api.post(`/v1/admin/order-network/${scheduleId}/remove-discount`);
      toast.success("Descuento removido exitosamente");
      setAppliedCode(null);
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al remover descuento");
    } finally {
      setUpdating(false);
    }
  };

  const handleShareCheckout = async () => {
    try {
      setUpdating(true);
      await api.post(`/v1/admin/order-network/${scheduleId}/share-checkout`, {
        payment_method: paymentMethod,
        monto_real: montoReal,
        cash_amount: cashAmount || null,
        qr_amount: qrAmount || null,
        sale_total: grandTotal,
        is_advance_payment: isAdvancePayment
      });
      toast.success("Detalles de cobro compartidos con el cliente");
    } catch (err) {
      toast.error("Error al compartir detalles");
    } finally {
      setUpdating(false);
    }
  };

  const [togglingEdit, setTogglingEdit] = useState(false);
  const handleToggleRecipientEdit = async () => {
    try {
      setTogglingEdit(true);
      const isShared = !details?.shipment?.recipient_edit_session?.is_shared;
      const res = await api.post(`/v1/admin/order-network/${scheduleId}/toggle-recipient-edit`, {
        is_shared: isShared
      });
      toast.success(res.data.message);
      fetchDetails();
    } catch (err) {
      toast.error("Error al cambiar estado de edición");
      console.error(err);
    } finally {
      setTogglingEdit(false);
    }
  };

  const handleUpdateStatus = async (newStatus, paymentData = null) => {
    setUpdating(true);
    // Optimistic UI update
    const prevDetails = { ...details };
    
    if (!paymentData?.is_advance_payment) {
      setDetails(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: newStatus,
          shipment: {
            ...prev.shipment,
            status: newStatus === 'completed' ? 'delivered' : newStatus
          }
        };
      });
    }

    try {
      const payload = paymentData ? { status: newStatus, ...paymentData } : { status: newStatus };
      await updateDeliveryStatus(scheduleId, payload);
      const { data } = await getDeliveryDetails(scheduleId);
      setDetails(data.schedule);
      toast.success(newStatus === 'cancelled' ? "Entrega cancelada" : "Actualización exitosa");
      onStatusChange();
    } catch (error) {
      toast.error("Error al actualizar estado");
      // Rollback on error
      setDetails(prevDetails);
    } finally {
      setUpdating(false);
    }
  };

  const handleNextStatus = async () => {
    const isExternal = details?.shipment?.delivery_type === 'external';
    const isPickup = details?.shipment?.delivery_type === 'pickup';
    const currentSteps = isPickup ? STEPS_PICKUP : (isExternal ? STEPS_EXTERNAL : STEPS_LOCAL);
    const nextStepIndex = getStepIndex(details.status, currentSteps) + 1;
    if (nextStepIndex < currentSteps.length) {
      const nextStatus = currentSteps[nextStepIndex].key;
      if (nextStatus) {
        const isSalePaid = details?.shipment?.sale?.status === 'paid';
        const isLocalPaymentStage = !isExternal && !isPickup && nextStatus === 'completed';
        const isExternalPaymentStage = isExternal && nextStatus === 'prepared';
        const isPickupAdvanceStage = isPickup && nextStatus === 'reserved';
        const isPickupFinalPaymentStage = isPickup && nextStatus === 'completed';
        
        if ((isLocalPaymentStage || isExternalPaymentStage || isPickupAdvanceStage || isPickupFinalPaymentStage) && !isSalePaid) {
          setIsAdvancePayment(isPickupAdvanceStage);
          setPaymentNextStatus(nextStatus);
          setShowPaymentModal(true);
        } else if (isExternal && nextStatus === 'shipped') {
          setShowShippedModal(true);
        } else {
          handleUpdateStatus(nextStatus);
        }
      }
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

  const customer = sale?.customer;
  const guest = sale?.guest;

  let clientName = "Anónimo";
  let clientPhone = "No especificado";
  let clientType = "Desconocido";
  let clientCode = "N/A";
  let hasValidClient = false;
  if (customer) {
    clientCode = customer.customer_code || "N/A";
    if (customer.pos_profile) {
      clientType = "POS";
      clientName = `${customer.pos_profile.first_name || ''} ${customer.pos_profile.last_name_paternal || ''} ${customer.pos_profile.last_name_maternal || ''}`.trim() || 'Sin Nombre';
      clientPhone = customer.pos_profile.phone || "No especificado";
      hasValidClient = true;
    } else if (customer.user?.profile) {
      clientType = "WEB";
      clientName = `${customer.user.profile.first_name || ''} ${customer.user.profile.last_name_paternal || ''} ${customer.user.profile.last_name_maternal || ''}`.trim() || 'Sin Nombre';
      clientPhone = customer.user.profile.phone || "No especificado";
      hasValidClient = true;
    }
  } else if (guest) {
    clientType = "Invitado";
    clientName = guest.name || 'Sin Nombre';
    clientPhone = guest.whatsapp_phone || "No especificado";
    hasValidClient = true;
  }

  const isExternal = details?.shipment?.delivery_type === 'external';
  const isPickup = details?.shipment?.delivery_type === 'pickup';

  let hasValidLocation = false;
  let hasValidTime = false;

  if (isExternal) {
    hasValidLocation = !!details?.shipment?.destination_city;
    hasValidTime = !!details?.scheduled_date;
  } else if (isPickup) {
    hasValidLocation = !!details?.shipment?.pickup_branch_id;
    hasValidTime = !!details?.scheduled_date;
  } else {
    hasValidLocation = !!details?.meeting_point || !!details?.shipment?.address;
    hasValidTime = !!details?.scheduled_date && !!details?.time_window && details.time_window !== 'Por definir';
  }

  let hasValidStock = true;
  const activeItems = sale?.sale_details?.filter(item => !item.deleted_at) || [];

  const currentStatus = details?.status;
  let requiresReservation = false;
  
  const localReserveStates = ['assigned', 'on_the_way', 'at_the_meeting_point', 'completed'];
  const externalReserveStates = ['prepared', 'packaged', 'shipped', 'completed'];
  const pickupReserveStates = ['reserved', 'preparing', 'ready_for_pickup', 'completed'];
  
  if (isExternal && externalReserveStates.includes(currentStatus)) {
      requiresReservation = true;
  } else if (isPickup && pickupReserveStates.includes(currentStatus)) {
      requiresReservation = true;
  } else if (!isExternal && !isPickup && localReserveStates.includes(currentStatus)) {
      requiresReservation = true;
  } else if (['completed', 'shipped'].includes(currentStatus)) {
      requiresReservation = true;
  }

  for (const item of activeItems) {
      const variant = item.product_variant;
      const totalPhysicalStock = variant?.inventories?.reduce((sum, inv) => sum + Number(inv.stock), 0) || 0;
      
      const allReservations = sale?.stock_reservations || sale?.stockReservations || [];
      const variantReservations = allReservations.filter(res => res.variant_id === item.variant_id && 
(res.status === 'reserved' || res.status === 'confirmed' || !res.status));
      
      const reservedForThisItem = variantReservations.reduce((sum, res) => sum + Number(res.quantity), 0);
      const effectiveStock = totalPhysicalStock + reservedForThisItem;

      if (effectiveStock < item.quantity) {
          hasValidStock = false;
      } else if (requiresReservation) {
          if (variantReservations.length === 0) {
              hasValidStock = false;
          } else {
              for (const res of variantReservations) {
                  if (!res.branch || !res.branch.id) {
                      hasValidStock = false;
                  }
              }
          }
      }
  }

  const isDeliveryValid = hasValidClient && hasValidLocation && hasValidTime && hasValidStock;

  let branchCoords = null;
  let pickupAddressStr = '';
  if (isPickup && details?.shipment?.pickup_branch) {
    const branchName = details.shipment.pickup_branch.name || 'Sucursal';
    const bAddress = details.shipment.pickup_branch.address;
    if (bAddress) {
      const parts = [bAddress.city, bAddress.zone, bAddress.street].filter(Boolean);
      pickupAddressStr = parts.length > 0 ? `${branchName} (${parts.join(', ')})` : branchName;
    } else {
      pickupAddressStr = branchName;
    }
    if (bAddress && bAddress.latitude && bAddress.longitude) {
      branchCoords = { lat: parseFloat(bAddress.latitude), lng: parseFloat(bAddress.longitude) };
    }
  }

  const mapCenter = branchCoords || (details.latitude && details.longitude 
    ? { lat: parseFloat(details.latitude), lng: parseFloat(details.longitude) } 
    : defaultCenter);

  const shouldShowMap = isPickup ? !!branchCoords : !!(details.latitude && details.longitude);

  const currentSteps = isPickup ? STEPS_PICKUP : (isExternal ? STEPS_EXTERNAL : STEPS_LOCAL);
  const currentStepIndex = getStepIndex(details.status, currentSteps);
  const isOnTheWay = details.status === 'on_the_way' || details.status === 'at_the_meeting_point';
  const isCancelled = details.status === 'cancelled';
  const isCompleted = details.status === 'completed';
  const isFinal = isCancelled || isCompleted;
  
  let canEdit = !isFinal;
  if (!isPickup && !isExternal && currentStepIndex >= getStepIndex('on_the_way', STEPS_LOCAL)) {
    canEdit = false;
  } else if (isExternal && currentStepIndex >= getStepIndex('prepared', STEPS_EXTERNAL)) {
    canEdit = false;
  } else if (isPickup && currentStepIndex >= getStepIndex('preparing', STEPS_PICKUP)) {
    canEdit = false;
  }

  const statusTheme = {
    // Pickup states
    requested: { color: '#eab308', rgb: '234, 179, 8', title: 'SOLICITADO', icon: <Clock size={24} />, pulse: false },
    reserved: { color: '#3b82f6', rgb: '59, 130, 246', title: 'RESERVADO', icon: <CheckCircle size={24} />, pulse: false },
    preparing: { color: '#f97316', rgb: '249, 115, 22', title: 'PREPARANDO', icon: <Package size={24} />, pulse: true },
    ready_for_pickup: { color: '#10b981', rgb: '16, 185, 129', title: 'LISTO PARA RECOGER', icon: <Store size={28} className="pulse-anim" />, pulse: true },
    // Local states
    pending: { color: '#eab308', rgb: '234, 179, 8', title: 'ENTREGA PENDIENTE', icon: <Clock size={24} />, pulse: false },
    assigned: { color: '#3b82f6', rgb: '59, 130, 246', title: 'ENTREGA AGENDADA', icon: <CalendarClock size={24} />, pulse: false },
    on_the_way: { color: '#8b5cf6', rgb: '139, 92, 246', title: '¡EL PEDIDO ESTÁ EN CAMINO!', icon: <Truck size={28} className="pulse-anim" />, pulse: true },
    at_the_meeting_point: { color: '#f97316', rgb: '249, 115, 22', title: '¡REPARTIDOR EN EL PUNTO!', icon: <MapPin size={28} className="pulse-anim" />, pulse: true },
    completed: { color: '#10b981', rgb: '16, 185, 129', title: 'ENTREGA COMPLETADA', icon: <CheckCircle size={28} />, pulse: false },
    cancelled: { color: '#ef4444', rgb: '239, 68, 68', title: 'ENTREGA CANCELADA', icon: <Ban size={28} className="pulse-anim" />, pulse: true },
    // External states
    prepared: { color: '#f97316', rgb: '249, 115, 22', title: 'PEDIDO PREPARADO', icon: <Package size={24} />, pulse: false },
    packaged: { color: '#0ea5e9', rgb: '14, 165, 233', title: 'PEDIDO EMPAQUETADO', icon: <Package size={24} />, pulse: false },
    shipped: { color: '#3b82f6', rgb: '59, 130, 246', title: '¡PEDIDO REMITIDO!', icon: <Truck size={28} className="pulse-anim" />, pulse: true }
  };

  const currentTheme = statusTheme[details.status] || statusTheme.pending;
  const accentColor = currentTheme.color;
  const rgb = currentTheme.rgb;

  let overlayBg = {};
  let contentStyle = { maxWidth: '800px', width: '95%', transition: 'all 0.4s ease', padding: 0, overflow: 'hidden' };
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

    const handlePrintLabel = () => {
    const sale = details.shipment?.sale;
    const items = sale?.sale_details || [];
    const recipientName = details.shipment?.recipient_name || 'Sin nombre';
    const recipientPhone = details.shipment?.recipient_phone || 'Sin teléfono';
    const recipientCI = details.shipment?.recipient_ci || 'Sin CI';
    const destination = details.shipment?.destination_city || 'Sin destino';
    const total = parseFloat(grandTotal).toFixed(2);
    const discount = parseFloat(sale?.discount || 0);
    const deliveryCode = details.shipment?.delivery_code || details.id.slice(0,8);
    const saleCode = sale?.invoice_number ? sale.invoice_number : (sale?.id?.slice(0,8) || '');
    
    // Si la imagen es una URL relativa local, necesitamos origin
    const logoUrl = logo.startsWith('http') ? logo : window.location.origin + logo;

    const itemsHtml = items.map(item => {
      const variant = item.product_variant;
      const name = variant?.product?.name || 'Producto';
      
      const attrs = [];
      if (variant?.size?.name) attrs.push(`Talla: ${variant.size.name}`);
      if (variant?.fit?.name) attrs.push(`Fit: ${variant.fit.name}`);
      if (variant?.variant_attribute_values) {
        variant.variant_attribute_values.forEach(attr => {
          if (attr.attribute_value) {
            attrs.push(`${attr.attribute_value.attribute?.name || 'Attr'}: ${attr.attribute_value.value}`);
          }
        });
      }
      const attrsString = attrs.length > 0 ? attrs.join(' | ') : '';

      return `
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px dashed #ccc; padding-bottom: 6px;">
          <span style="flex: 1; padding-right: 8px;">
            <strong>${item.quantity}x ${name}</strong>
            ${attrsString ? `<br/><span style="color: #444; font-size: 9px; line-height: 1.2; display: inline-block; margin-top: 2px;">${attrsString}</span>` : ''}
          </span>
          <span style="white-space: nowrap;">Bs. ${parseFloat(item.subtotal).toFixed(2)}</span>
        </div>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta de Envío - ${deliveryCode}</title>
          <style>
            @page { size: 8.5in 5.5in; margin: 0; }
            @media print {
              html, body {
                width: 8.5in;
                height: 5.5in;
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              width: 8.5in; 
              height: 5.5in; 
              display: flex; 
              box-sizing: border-box;
              overflow: hidden;
            }
            .left-col { 
              width: 75%; 
              height: 100%;
              padding: 30px 40px; 
              box-sizing: border-box;
              display: flex; 
              flex-direction: column; 
              justify-content: center;
              background: #fff;
              border-right: 2px dashed #000;
            }
            .right-col { 
              width: 25%; 
              height: 100%;
              background: #fff; 
              color: #000; 
              padding: 20px; 
              box-sizing: border-box;
              display: flex; 
              flex-direction: column; 
            }
            .dest-title { font-size: 16px; color: #666; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; }
            .dest-value { font-size: 42px; font-weight: 900; text-transform: uppercase; margin-bottom: 25px; line-height: 1; color: #000; }
            .info-label { font-size: 14px; color: #666; margin-top: 15px; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; }
            .info-value { font-size: 24px; font-weight: bold; color: #000; }
            .logo-container { text-align: center; margin-bottom: 15px; }
            .logo { max-width: 120px; }
            .order-title { font-size: 13px; font-weight: bold; margin-bottom: 8px; border-bottom: 2px solid #000; padding-bottom: 4px; text-transform: uppercase; text-align: center; letter-spacing: 1px; }
            .ref-info { font-size: 11px; text-align: center; margin-bottom: 12px; color: #333; line-height: 1.4; }
            .items-container { flex: 1; font-size: 11px; overflow: hidden; line-height: 1.3; }
            .total-container { margin-top: 10px; font-size: 15px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="left-col">
            <div class="dest-title">Ciudad / Destino</div>
            <div class="dest-value">${destination}</div>
            
            <div class="info-label">Datos de quien recibe</div>
            <div class="info-value">${recipientName}</div>
            
            <div class="info-label">Carnet de Identidad (CI)</div>
            <div class="info-value">${recipientCI}</div>
            
            <div class="info-label">Teléfono de Contacto</div>
            <div class="info-value">${recipientPhone}</div>
          </div>
          <div class="right-col">
            <div class="logo-container">
              <img src="${logoUrl}" class="logo" alt="Logo" onerror="this.style.display='none'" />
            </div>
            <div class="order-title">Detalle Envío</div>
            <div class="ref-info">
              Ref Envío: <strong>${deliveryCode}</strong><br/>
              ${saleCode ? `Ref Venta: <strong>${saleCode}</strong>` : ''}
            </div>
            <div class="items-container">
              ${itemsHtml}
            </div>
            ${discount > 0 ? `<div style="text-align: right; margin-top: 5px; font-size: 11px;">Desc: -Bs. ${discount.toFixed(2)}</div>` : ''}
            <div class="total-container">
              TOTAL: Bs. ${total}
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 600);
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      toast.error("Por favor permite las ventanas emergentes (pop-ups) para imprimir.");
    }
  };

  // A sale is considered fully paid if its status is 'paid'.
  // External shipments might be paid at the 'prepared' stage, local at 'completed'.
  const isFullyPaid = sale?.status === 'paid';
  
  const canShowAdelanto = !isCompleted && !isCancelled && !isFullyPaid && details?.status !== 'at_the_meeting_point';

  return (
    <div className="modal-overlay fade-in" style={overlayBg}>
      <style>{`
        .delivery-details-modal-content { padding: 0 !important; overflow: hidden !important; }
        .delivery-details-modal-header { margin: 0 !important; width: 100% !important; border-radius: 0 !important; }
      `}</style>
      <div className="modal-content delivery-details-modal-content" style={contentStyle}>
        <div className="modal-header delivery-details-modal-header" style={headerStyle}>
          <div>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: accentColor }}>
              {headerIcon} {headerTitle}
              {details.shipment?.delivery_type === 'home_delivery' && (
                <span style={{ fontSize: '12px', background: 'var(--color-secondary)', color: 'white', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px', textTransform: 'uppercase' }}>
                  A Domicilio
                </span>
              )}
            </h2>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Ref: {details.shipment?.delivery_code || details.id.slice(0,8)} {sale?.invoice_number ? `| Venta: ${sale.invoice_number}` : ''}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {canShowAdelanto && (
              <CanAccess permission="update_order_status">
                <button 
                  className="action-btn"
                  style={{ padding: '6px 12px', background: 'var(--bg-input)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  onClick={() => {
                    setIsAdvancePayment(true);
                    setPaymentNextStatus(details.status);
                    setShowPaymentModal(true);
                  }}
                  disabled={updating}
                  title="Registrar un adelanto"
                >
                  <DollarSign size={14} /> Adelanto
                </button>
              </CanAccess>
            )}
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
              <CanAccess permission="edit_orders">
                <button 
                  className="action-btn" 
                  style={{ padding: '6px 12px', background: 'var(--bg-input)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  onClick={startEditing}
                >
                  <Edit3 size={14} /> Editar
                </button>
              </CanAccess>
            )}
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

          
          {/* TIMELINE - STICKY TOP */}
          <div className="modal-timeline-wrapper" style={{ background: isCancelled ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
            <div className="modal-timeline-inner" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              <div className="timeline-line-bg" style={{ position: 'absolute', top: '36px', left: '40px', right: '40px', height: '4px', background: 'var(--border-color)', zIndex: 1, borderRadius: '2px' }}>
                <div className="timeline-line-progress" style={{ 
                  height: '100%', 
                  background: isCancelled ? '#ef4444' : accentColor, 
                  width: isCancelled ? '100%' : `${(currentStepIndex / (currentSteps.length - 1)) * 100}%`,
                  '--progress-height': isCancelled ? '100%' : `${(currentStepIndex / (currentSteps.length - 1)) * 100}%`,
                  transition: 'all 0.5s ease',
                  borderRadius: '2px'
                }} />
              </div>
              {currentSteps.map((step, idx) => {
                const isStepCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const stepColor = isCancelled ? '#ef4444' : (isStepCompleted ? accentColor : 'var(--text-muted)');
                const stepBg = isCancelled ? '#ef4444' : (isStepCompleted ? accentColor : 'var(--bg-body)');
                
                return (
                  <div className="timeline-step" key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, width: '80px' }}>
                    <div className="timeline-step-circle" style={{ 
                      width: '28px', height: '28px', borderRadius: '50%', background: stepBg, border: `3px solid ${isStepCompleted ? 'transparent' : 'var(--border-color)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isCurrent && !isCancelled ? `0 0 0 4px rgba(${rgb}, 0.2)` : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                      {isStepCompleted && <div className="timeline-step-inner-circle" style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%' }} />}
                    </div>
                    <span className="timeline-step-text" style={{ fontSize: '12px', fontWeight: isCurrent ? 700 : 500, color: stepColor, textAlign: 'center', lineHeight: 1.2 }}>
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
          </div>

          <div className="modal-body" style={{ maxHeight: 'calc(75vh - 120px)', overflowY: 'auto', padding: '0' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px', padding: '16px' }}>
            
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'var(--bg-card)', border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`, borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} /> Datos del Cliente
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-main)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tipo de Cliente:</span>
                    <span style={{ fontWeight: 500 }}>{clientType}</span>
                  </div>
                  {clientCode !== 'N/A' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Cód. Cliente:</span>
                      <span style={{ fontWeight: 500 }}>{clientCode}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Nombre Completo:</span>
                    <span style={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-word', paddingLeft: '12px' }}>{clientName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>WhatsApp / Tel:</span>
                    <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} /> {clientPhone}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`, borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={16} /> Detalle de Productos
                  </div>
                  {details.status === 'at_the_meeting_point' && (
                    <CanAccess permission="manage_order_items">
                      <button 
                        onClick={() => setShowAddProduct(true)}
                        style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={14} /> Agregar
                      </button>
                    </CanAccess>
                  )}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sale?.sale_details?.map((item, index) => {
                      const variant = item.product_variant;
                      const product = variant?.product;
                      const variantAttrIds = variant?.variant_attribute_values?.map(v => v.attribute_value_id) || [];
                      const colorImgs = product?.attribute_value_images?.filter(img => variantAttrIds.includes(img.attribute_value_id)) || [];
                      const colorImg = colorImgs.find(img => img.is_main) || colorImgs[0];
                        
                      let imageUrl = variant?.variant_images?.[0]?.url || colorImg?.url || product?.product_images?.find(img => img.is_main)?.url || product?.product_images?.[0]?.url;
                        
                      if (!imageUrl) {
                        const fallbackPath = variant?.variant_images?.[0]?.image_path || colorImg?.image_path || product?.product_images?.find(img => img.is_main)?.image_path || product?.product_images?.[0]?.image_path;
                        if (fallbackPath) {
                          imageUrl = `/storage/${fallbackPath}`;
                        }
                      }
  
                      if (imageUrl && !imageUrl.startsWith('http')) {
                        imageUrl = getImageUrl(imageUrl);
                      }

                      // Only grab the reservations for this variant.
                      // Since we don't have sale_detail_id in reservations, we just show the branch from the first matching reservation.
                      const allReservations = sale?.stock_reservations || sale?.stockReservations || [];
                      const variantReservations = allReservations.filter(res => res.variant_id === item.variant_id);
                      const relevantStatuses = item.deleted_at ? ['released'] : ['reserved', 'confirmed'];
                      let relevantReservations = variantReservations.filter(res => relevantStatuses.includes(res.status) || (!item.deleted_at && !res.status));
                      
                      const branchName = relevantReservations[0]?.branch?.name || "Sin Sucursal asignada";
                      const qty = item.quantity;
                      const isBundleItem = item.bundle_group_id !== null && item.bundle_group_id !== undefined;
                      const unitPrice = item.dynamic_unit_price || item.unit_price || item.final_price;
                      const originalPrice = item.original_price || item.unit_price;
                      const subtotal = item.dynamic_subtotal || (unitPrice * qty);

                      const totalPhysicalStock = variant?.inventories?.reduce((sum, inv) => sum + Number(inv.stock), 0) || 0;
                      const reservedForThisItem = relevantReservations.reduce((sum, res) => sum + Number(res.quantity), 0);
                      const effectiveStock = totalPhysicalStock + reservedForThisItem;
                      const isOutOfStock = requiresReservation ? relevantReservations.length === 0 : effectiveStock < qty;

                      return (
                        <div key={`${item.id}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', paddingBottom: '12px', borderBottom: '1px dashed var(--border-color)', opacity: isCancelled || item.deleted_at ? 0.6 : 1, ...(isBundleItem ? { background: 'var(--bg-hover)', padding: '8px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' } : {}) }}>
                            {isOutOfStock && (
                              <div style={{ background: 'var(--color-danger)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start' }}>
                                <AlertTriangle size={14} /> SIN STOCK / AGOTADO
                              </div>
                            )}
                            {isBundleItem && (
                              <div style={{ alignSelf: 'flex-start', fontSize: '11px', color: '#b45309', fontWeight: '600', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                                ⭐ Ítem de Conjunto
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                              {imageUrl ? (
                                <img src={imageUrl} alt="Variant" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                              ) : (
                                <div style={{ width: '50px', height: '50px', background: 'var(--bg-input)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                                  <Package size={20} style={{ color: 'var(--text-muted)' }} />
                                </div>
                              )}
                              
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600 }}>{qty}x {product?.name || 'Producto Desconocido'}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  SKU: <b>{variant?.sku || 'N/A'}</b>
                                  {variant?.variant_attribute_values?.map((v, i) => (
                                    <span key={i}> • {v.attribute_value?.attribute?.name || 'Atributo'}: {v.attribute_value?.value || 'N/A'}</span>
                                  ))}
                                  {!variant?.variant_attribute_values?.some(v => v.attribute_value?.attribute?.name?.toLowerCase() === 'talla' || v.attribute_value?.attribute?.name?.toLowerCase() === 'size') && variant?.size && (
                                    <span> • Talla: {variant.size.name}</span>
                                  )}
                                  {!variant?.variant_attribute_values?.some(v => v.attribute_value?.attribute?.name?.toLowerCase() === 'color' || v.attribute_value?.attribute?.name?.toLowerCase() === 'fit') && variant?.fit && (
                                    <span> • Color/Fit: {variant.fit.name}</span>
                                  )}
                                </div>
                                {!isOutOfStock && !item.deleted_at && relevantReservations.length > 0 && (
                                  <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px' }}>
                                    Extraído de <b>{branchName}</b>
                                  </div>
                                )}
                                {!isOutOfStock && !item.deleted_at && relevantReservations.length === 0 && (
                                  <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px' }}>
                                    <i>Pendiente de reserva</i>
                                  </div>
                                )}
                                {item.deleted_at && (
                                  <div style={{ fontSize: '11px', color: 'var(--color-danger)', marginTop: '4px', fontWeight: 600 }}>
                                    Rechazado de <b>{branchName}</b>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                              {isBundleItem ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                  <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: '12px' }}>
                                    {qty}x Bs. {Number(originalPrice).toFixed(2)}
                                  </span>
                                  <span style={{ color: '#059669', fontWeight: 600 }}>
                                    {qty}x Bs. {Number(unitPrice).toFixed(2)}
                                  </span>
                                </div>
                              ) : originalPrice > unitPrice ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                  <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: '12px' }}>
                                    {qty}x Bs. {Number(originalPrice).toFixed(2)}
                                  </span>
                                  <span style={{ color: '#059669', fontWeight: 600 }}>
                                    {qty}x Bs. {Number(unitPrice).toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>{qty}x Bs. {Number(unitPrice).toFixed(2)}</span>
                              )}
                              
                              {(originalPrice > unitPrice) && !isBundleItem && !item.deleted_at && (
                                <span style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                  -Bs. {Number((originalPrice - unitPrice) * qty).toFixed(2)}
                                </span>
                              )}
                              
                              <span style={{ fontWeight: 600, textDecoration: item.deleted_at ? 'line-through' : 'none', fontSize: '14px' }}>Bs. {Number(subtotal).toFixed(2)}</span>
                              
                              {item.deleted_at && (
                                <span style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 600 }}>Quitar</span>
                              )}
                            </div>
                        </div>
                      );
                  })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)' }}>
                    <span>Subtotal:</span>
                    <span>Bs. {Number(sale?.dynamic_subtotal || 0).toFixed(2)}</span>
                  </div>
                  {Number(sale?.dynamic_global_discount || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-danger)' }}>
                      <span>Descuento Aplicado:</span>
                      <span>- Bs. {Number(sale?.dynamic_global_discount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(details?.shipment?.agency_dispatch_cost) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)' }}>
                      <span>Costo de Envío a Agencia:</span>
                      <span>Bs. {Number(details?.shipment?.agency_dispatch_cost).toFixed(2)}</span>
                    </div>
                  )}
                  {details?.shipment?.shipping_payment_type !== 'collect' && Number(details?.shipment?.shipping_cost) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)' }}>
                      <span>Costo de Envío:</span>
                      <span>Bs. {Number(details?.shipment?.shipping_cost || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {!isFullyPaid && totalPaid > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-primary)', fontWeight: 600 }}>
                      <span>Adelanto Registrado:</span>
                      <span>- Bs. {Number(totalPaid).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', textTransform: 'uppercase' }}>
                    <span>{isFullyPaid ? 'Total Pagado:' : 'Total a Pagar:'}</span>
                    <span style={{ color: 'var(--color-primary)' }}>Bs. {Number(grandTotal - (!isFullyPaid ? totalPaid : 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`, borderRadius: '12px', padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <StickyNote size={16} /> Notas de Entrega
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Añade notas para la entrega, instrucciones especiales, etc."
                    style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '13px', resize: 'vertical' }}
                    disabled={isCancelled}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <CanAccess permission="edit_orders">
                      <button 
                        onClick={handleSaveNotes}
                        disabled={savingNotes || isCancelled}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {savingNotes ? 'Guardando...' : 'Guardar Notas'}
                      </button>
                    </CanAccess>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                    <span style={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-word', paddingLeft: '12px' }}>
                      {details.driver ? `${details.driver.user?.profile?.first_name || ''} ${details.driver.user?.profile?.last_name_paternal || ''} ${details.driver.user?.profile?.last_name_maternal || ''}`.trim() || 'Sin Nombre' : 'Sin Asignar'}
                    </span>
                  </div>
                  {details.driver && (
                    <>
                      {details.driver.user?.employee?.employee_code && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Cód. Empleado:</span>
                          <span style={{ fontWeight: 500 }}>{details.driver.user.employee.employee_code}</span>
                        </div>
                      )}
                      {(details.driver.phone || details.driver.user?.profile?.whatsapp_number || details.driver.user?.profile?.phone) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>WhatsApp / Tel:</span>
                          <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} /> {details.driver.phone || details.driver.user?.profile?.whatsapp_number || details.driver.user?.profile?.phone}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

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
                    <div style={{ fontWeight: 500 }}>
                      {isPickup && pickupAddressStr 
                        ? pickupAddressStr
                        : (details.shipment?.delivery_type === 'home_delivery' && details.shipment?.address 
                          ? [details.shipment.address.street, details.shipment.address.zone].filter(Boolean).join(', ')
                          : details.meeting_point)}
                    </div>
                  </div>
                </div>
                
                {currentStepIndex === 0 && !isDeliveryValid && (
                  <div style={{ marginTop: '16px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', borderRadius: '8px', padding: '12px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#ca8a04', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} /> Faltan datos para proceder
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#a16207', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {!hasValidClient && <li>Falta asignar un cliente válido.</li>}
                      {!hasValidLocation && <li>Falta definir el lugar de entrega o destino.</li>}
                      {!hasValidTime && <li>Falta definir la fecha o el horario.</li>}
                      {!hasValidStock && <li>Faltan resolver problemas de stock en los productos.</li>}
                    </ul>
                  </div>
                )}
                
                {(isExternal || details.shipment?.recipient_name || details.shipment?.recipient_phone || details.shipment?.recipient_ci) && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={14} /> Persona que Recibe
                      </h4>
                      {isExternal && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <CanAccess permission="print_order_labels">
                            <button
                              onClick={handlePrintLabel}
                              style={{
                                background: '#f1f5f9',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Printer size={12} /> Imprimir Etiqueta
                            </button>
                          </CanAccess>
                          <CanAccess permission="edit_orders">
                            <button
                              onClick={handleToggleRecipientEdit}
                              disabled={togglingEdit}
                              style={{
                                background: details.shipment?.recipient_edit_session?.is_shared ? '#fef2f2' : '#f0fdf4',
                                color: details.shipment?.recipient_edit_session?.is_shared ? '#ef4444' : '#10b981',
                                border: `1px solid ${details.shipment?.recipient_edit_session?.is_shared ? '#fca5a5' : '#86efac'}`,
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {togglingEdit ? '...' : (details.shipment?.recipient_edit_session?.is_shared ? <><Lock size={12} /> Dejar de Compartir</> : <><Unlock size={12} /> Compartir Edición</>)}
                            </button>
                          </CanAccess>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      {details.shipment?.recipient_name && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Nombre:</span>
                          <span style={{ fontWeight: 500 }}>{details.shipment.recipient_name}</span>
                        </div>
                      )}
                      {details.shipment?.recipient_ci && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>CI:</span>
                          <span style={{ fontWeight: 500 }}>{details.shipment.recipient_ci}</span>
                        </div>
                      )}
                      {details.shipment?.recipient_phone && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Teléfono:</span>
                          <span style={{ fontWeight: 500 }}>{details.shipment.recipient_phone}</span>
                        </div>
                      )}
                      {details.shipment?.destination_city && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Destino:</span>
                          <span style={{ fontWeight: 500 }}>{details.shipment.destination_city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(details.shipment?.external_company || details.shipment?.external_guide) && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Truck size={14} /> Información de Transportadora
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      {details.shipment?.external_company && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Agencia:</span>
                          <span style={{ fontWeight: 500 }}>{details.shipment.external_company}</span>
                        </div>
                      )}
                      {details.shipment?.external_guide && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Nro. de Guía:</span>
                          <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{details.shipment.external_guide}</span>
                        </div>
                      )}
                      {details.shipment?.shipping_payment_type && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Pago de Envío:</span>
                          <span style={{ fontWeight: 500 }}>{details.shipment.shipping_payment_type === 'collect' ? 'Por Pagar (En Destino)' : 'Pagado (En Origen)'}</span>
                        </div>
                      )}
                      {details.shipment?.shipping_payment_type === 'collect' && Number(details.shipment.shipping_cost) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Costo de Envío:</span>
                          <span style={{ fontWeight: 600 }}>Bs. {Number(details.shipment.shipping_cost).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {!isExternal && shouldShowMap && (
                  <div style={{ background: 'var(--bg-card)', border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`, borderRadius: '12px', overflow: 'hidden', marginTop: '12px' }}>
                    <GoogleMapWrapper
                      mapContainerStyle={mapContainerStyle}
                      center={mapCenter}
                      zoom={15}
                      options={{ disableDefaultUI: true, zoomControl: true }}
                    >
                      <MarkerF position={mapCenter} />
                    </GoogleMapWrapper>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-footer" style={{ borderTop: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: isCancelled ? 'rgba(239, 68, 68, 0.04)' : (isOnTheWay ? 'rgba(139, 92, 246, 0.05)' : 'transparent') }}>
          
          <div className="modal-footer-left" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isCancelled ? (
              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={20} /> Entrega Cancelada
              </span>
            ) : isCompleted ? (
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Entrega Completada</span>
            ) : (
              <>
                <CanAccess permission="update_order_status">
                  {currentStepIndex === 0 && !isDeliveryValid ? (
                    <button 
                      className="action-btn btn-marcar"
                      style={{ 
                        padding: '12px 24px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', border: 'none',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px',
                        background: '#eab308',
                        color: '#fff',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={startEditing}
                      disabled={updating}
                    >
                      <AlertTriangle size={20} />
                      Completar información
                    </button>
                  ) : (
                    <button 
                      className="action-btn btn-marcar"
                      style={{ 
                        padding: '12px 24px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', border: 'none',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px',
                        background: details.status === 'pending' || details.status === 'assigned' ? '#8b5cf6' : (details.status === 'on_the_way' ? '#f97316' : 'var(--color-success)'),
                        color: '#fff',
                        boxShadow: isOnTheWay ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={handleNextStatus}
                      disabled={updating}
                    >
                      <Truck size={20} />
                      {updating ? 'Actualizando...' : 
                        (isExternal && currentSteps[currentStepIndex + 1]?.key === 'shipped') ? 'Remitir a Transportadora' : 
                        `Marcar como ${currentSteps[currentStepIndex + 1]?.label || 'Completado'}`}
                    </button>
                  )}
                </CanAccess>
                
                <CanAccess permission="cancel_orders">
                  <button 
                    className="action-btn btn-cancelar"
                    style={{ padding: '12px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', transition: 'all 0.2s ease' }}
                    onClick={() => setShowCancelModal(true)}
                    disabled={updating}
                  >
                    <XCircle size={16} /> Cancelar Entrega
                  </button>
                </CanAccess>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="action-btn"
              style={{ padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', background: '#25D366', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }} 
              onClick={() => {
                const link = generateWhatsAppLink ? generateWhatsAppLink(details, clientPhone, clientName) : `https://wa.me/${clientPhone.replace(/\D/g, '')}`;
                if (link && link !== "#") window.open(link, '_blank');
              }}
              title={clientPhone === "No especificado" ? "El cliente no tiene teléfono registrado" : "Enviar mensaje de estado"}
            >
              <MessageCircle size={18} /> WhatsApp
            </button>
            <button className="action-btn btn-cerrar" style={{ padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} onClick={onClose} disabled={updating}>Cerrar</button>
          </div>
        </div>
      </div>

      {showShippedModal && (
        <div className="modal-overlay fade-in" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '400px', width: '90%', background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <Truck size={20} style={{ color: 'var(--color-primary)' }} /> Remitir a Transportadora
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>Empresa de Transporte *</label>
                <CustomSelect 
                  value={externalCompany}
                  onChange={(e) => {
                    setExternalCompany(e.target.value);
                    if (e.target.value !== 'Otro') {
                      setCustomExternalCompany('');
                    }
                  }}
                  placeholder="Seleccione una empresa..."
                >
                  <option value="">Seleccione una empresa...</option>
                  {TRANSPORT_COMPANIES.map(company => (
                    <option key={company.name} value={company.name}>
                      {company.name} {company.type !== 'Otro' && `(${company.type})`}
                    </option>
                  ))}
                </CustomSelect>
              </div>

              {externalCompany === 'Otro' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>Nombre de la Empresa *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ingrese el nombre de la empresa manualmente"
                    required
                    value={customExternalCompany}
                    onChange={(e) => setCustomExternalCompany(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>Nro. de Guía / Tracking *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: 12345678"
                  required
                  value={externalGuide}
                  onChange={(e) => setExternalGuide(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>Costo de Envío (Bs) *</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.5"
                  className="form-control" 
                  placeholder="0.00"
                  required
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>Tipo de Pago de Envío</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setShippingPaymentType('paid')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${shippingPaymentType === 'paid' ? 'var(--color-primary)' : 'var(--border-color)'}`, background: shippingPaymentType === 'paid' ? 'var(--color-primary-alpha)' : 'transparent', color: shippingPaymentType === 'paid' ? 'var(--color-primary)' : 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Pagado
                  </button>
                  <button 
                    onClick={() => setShippingPaymentType('collect')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${shippingPaymentType === 'collect' ? 'var(--color-primary)' : 'var(--border-color)'}`, background: shippingPaymentType === 'collect' ? 'var(--color-primary-alpha)' : 'transparent', color: shippingPaymentType === 'collect' ? 'var(--color-primary)' : 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Por Pagar
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-actions-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setShowShippedModal(false)}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}
                disabled={updating}
              >
                Cancelar
              </button>
              <button  
                onClick={() => {
                  if (!externalCompany) {
                    toast.error('La empresa de transporte es requerida');
                    return;
                  }
                  if (externalCompany === 'Otro' && !customExternalCompany) {
                    toast.error('Debe ingresar el nombre de la empresa');
                    return;
                  }
                  if (!externalGuide || shippingCost === '') {
                    toast.error('Completa los datos de guía y costo');
                    return;
                  }
                  setShowShippedModal(false);
                  handleUpdateStatus('shipped', {
                    external_company: externalCompany === 'Otro' ? customExternalCompany : externalCompany,
                    external_guide: externalGuide,
                    shipping_cost: shippingCost,
                    shipping_payment_type: shippingPaymentType
                  });
                }}
                style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={updating}
              >
                Remitir Paquete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA AGREGAR PRODUCTO */}
      {showAddProduct && (
        <AddProductToDeliveryModal 
          onClose={() => setShowAddProduct(false)}
          onAddProduct={handleAddProduct}
        />
      )}

      {/* CONFIRMATION MODALS */}
      {itemToRemove && (
        <div className="modal-overlay fade-in" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '400px', width: '90%', background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#f59e0b' }}>
              <AlertTriangle size={48} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: 'var(--text-main)' }}>Quitar Producto</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px', lineHeight: '1.5' }}>
              ¿Seguro que deseas quitar UNA unidad de esta prenda de la venta? <br/><strong>Se devolverá al stock disponible.</strong>
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setItemToRemove(null)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmRemoveItem}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                Sí, Quitar
              </button>
            </div>
          </div>
        </div>
      )}
      {showCancelModal && (
        <div className="modal-overlay fade-in" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '400px', width: '90%', background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#ef4444' }}>
              <XCircle size={48} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: 'var(--text-main)' }}>Cancelar Entrega</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px', lineHeight: '1.5' }}>
              ¿Estás seguro de que deseas cancelar esta entrega? <br/><strong>Esta acción no se puede deshacer.</strong>
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowCancelModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}
                disabled={updating}
              >
                Cerrar
              </button>
              <button 
                onClick={() => {
                  setShowCancelModal(false);
                  handleUpdateStatus('cancelled');
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                disabled={updating}
              >
                Sí, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {showPaymentModal && (
        <div className="modal-overlay fade-in" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%', background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <CheckCircle size={20} style={{ color: 'var(--color-success)' }} /> 
              {isAdvancePayment ? (isPickup && paymentNextStatus === 'reserved' ? 'Pago de la reserva' : 'Registrar Adelanto') : (paymentNextStatus === 'prepared' ? 'Cobrar y Preparar Pedido' : 'Completar Entrega')}
            </h3>
            
              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{isAdvancePayment ? 'Total de la Venta:' : 'Total Original:'}</span>
                  <strong style={{ color: 'var(--text-muted)' }}>Bs. {grandTotal.toFixed(2)}</strong>
                </div>
                
                {!isAdvancePayment && totalPaid > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--color-success)' }}>Adelanto Registrado:</span>
                    <strong style={{ color: 'var(--color-success)' }}>- Bs. {totalPaid.toFixed(2)}</strong>
                  </div>
                )}
                
                {!isAdvancePayment && totalPaid > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Saldo Restante:</span>
                    <strong style={{ color: 'var(--text-muted)', textDecoration: (Number(montoReal) < remainingAmount) ? 'line-through' : 'none' }}>Bs. {remainingAmount.toFixed(2)}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 600 }}>{isAdvancePayment ? 'Monto a Adelantar:' : 'Monto Real a Cobrar:'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Bs.</span>
                  <input 
                    type="number"
                    value={montoReal}
                    disabled={!isAdvancePayment && hasDiscountOrGiftcard}
                    onChange={(e) => {
                      setMontoReal(e.target.value);
                      if (paymentMethod === 'ambos') {
                        setCashAmount(''); setQrAmount('');
                      }
                    }}
                    style={{ 
                      width: '90px', 
                      padding: '6px 8px', 
                      borderRadius: '6px', 
                      border: '1px solid var(--border-color)', 
                      background: (!isAdvancePayment && hasDiscountOrGiftcard) ? 'var(--bg-card)' : '#fff', 
                      color: (!isAdvancePayment && hasDiscountOrGiftcard) ? 'var(--text-muted)' : 'var(--color-primary)', 
                      fontWeight: 700, 
                      fontSize: '15px', 
                      textAlign: 'right',
                      cursor: (!isAdvancePayment && hasDiscountOrGiftcard) ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
              </div>
              
              {!isAdvancePayment && Number(montoReal) < remainingAmount && !details.shipment?.sale?.discount_id && !details.shipment?.sale?.giftcard_id && (
                <div style={{ marginTop: '8px', color: 'var(--color-danger)', fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>
                  Descuento manual aplicado: -Bs. {(remainingAmount - Number(montoReal)).toFixed(2)}
                </div>
              )}
            </div>

            {!isAdvancePayment && (hasDiscountOrGiftcard ? (
              <div style={{ padding: '16px', background: 'var(--color-success-alpha)', borderRadius: '8px', border: '1px solid var(--color-success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)', display: 'block', marginBottom: '4px' }}>Descuento Guardado</span>
                  <div style={{ color: 'var(--color-success)', fontWeight: 800, fontSize: '16px' }}>- Bs. {Number(details.shipment.sale.dynamic_global_discount).toFixed(2)}</div>
                </div>
                <CanAccess permission="manage_order_discounts">
                  <button 
                    onClick={handleRemoveDiscount} 
                    disabled={updating} 
                    style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--color-danger)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Quitar
                  </button>
                </CanAccess>
              </div>
            ) : (
              <div style={{ marginTop: '16px' }}>
                {!showDiscountInput ? (
                  <CanAccess permission="manage_order_discounts">
                    <button
                      onClick={() => setShowDiscountInput(true)}
                      disabled={updating || paymentMethod === 'ambos'}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: '1px dashed var(--color-primary)',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Plus size={18} /> Agregar descuento
                    </button>
                  </CanAccess>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Código de Descuento o Giftcard</label>
                      <button 
                        onClick={() => setShowDiscountInput(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12px' }}
                      >
                        <X size={14} style={{ marginRight: '4px' }}/> Cancelar
                      </button>
                    </div>
                    <DiscountInput 
                      subtotal={grandTotal}
                      items={details.shipment?.sale?.sale_details || []}
                      customerId={details.shipment?.sale?.customer_id}
                      branchId={details.shipment?.sale?.branch_id}
                      disabled={paymentMethod === 'ambos'}
                      onValidated={async (res) => {
                        if (res && res.valid) {
                          try {
                            setUpdating(true);
                            await api.post(`/v1/admin/order-network/${scheduleId}/apply-discount`, { code: res.code });
                            toast.success("Descuento guardado y compartido");
                            fetchDetails();
                            setShowDiscountInput(false);
                          } catch (err) {
                            toast.error("Error al aplicar descuento");
                          } finally {
                            setUpdating(false);
                          }
                        } else {
                          setMontoReal(grandTotal);
                          setAppliedCode(null);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', marginTop: '16px' }}>
              <button 
                onClick={() => setPaymentMethod('efectivo')}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${paymentMethod === 'efectivo' ? 'var(--color-primary)' : 'var(--border-color)'}`, background: paymentMethod === 'efectivo' ? 'var(--color-primary-alpha)' : 'transparent', color: paymentMethod === 'efectivo' ? 'var(--color-primary)' : 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
              >
                Efectivo
              </button>
              <button 
                onClick={() => setPaymentMethod('qr')}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${paymentMethod === 'qr' ? 'var(--color-primary)' : 'var(--border-color)'}`, background: paymentMethod === 'qr' ? 'var(--color-primary-alpha)' : 'transparent', color: paymentMethod === 'qr' ? 'var(--color-primary)' : 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
              >
                QR
              </button>
              <button 
                onClick={() => { setPaymentMethod('ambos'); setCashAmount(''); setQrAmount(''); }}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${paymentMethod === 'ambos' ? 'var(--color-primary)' : 'var(--border-color)'}`, background: paymentMethod === 'ambos' ? 'var(--color-primary-alpha)' : 'transparent', color: paymentMethod === 'ambos' ? 'var(--color-primary)' : 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
              >
                Ambos
              </button>
            </div>

            {paymentMethod === 'ambos' && (
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Monto Efectivo</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                    value={cashAmount}
                    onChange={(e) => {
                      setCashAmount(e.target.value);
                      const total = Number(montoReal || grandTotal);
                      const cash = Number(e.target.value);
                      if (cash <= total) {
                        setQrAmount((total - cash).toFixed(2));
                      }
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Monto QR</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                    value={qrAmount}
                    onChange={(e) => {
                      setQrAmount(e.target.value);
                      const total = Number(montoReal || grandTotal);
                      const qr = Number(e.target.value);
                      if (qr <= total) {
                        setCashAmount((total - qr).toFixed(2));
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {(paymentMethod === 'qr' || paymentMethod === 'ambos') && (
              <div style={{ textAlign: 'center', marginBottom: '20px', padding: '16px', background: 'var(--bg-input)', borderRadius: '12px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Escanea para pagar {paymentMethod === 'ambos' && qrAmount ? `Bs. ${Number(qrAmount).toFixed(2)}` : ''}
                </p>
                <img 
                  src={settings?.payment_qr ? getImageUrl(settings.payment_qr) : getImageUrl('/system/payments/default.png')} 
                  alt="QR de Pago" 
                  style={{ maxWidth: '200px', borderRadius: '8px', border: '2px solid var(--border-color)' }}
                />
              </div>
            )}

            <div className="payment-modal-footer">
              <CanAccess permission="edit_orders">
                <button 
                  onClick={handleShareCheckout}
                  className="btn-share"
                  disabled={updating}
                >
                  <Share2 size={18} /> Compartir
                </button>
              </CanAccess>
              <div className="payment-modal-footer-actions">
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-cancel-payment"
                  disabled={updating}
                >
                  Cancelar
                </button>
                <CanAccess permission="update_order_status">
                  <button  
                    onClick={() => {
                      setShowPaymentModal(false);
                      handleUpdateStatus(paymentNextStatus, {
                        monto_real: montoReal,
                        payment_method: paymentMethod,
                        amount_cash: cashAmount,
                        amount_qr: qrAmount,
                        applied_code: appliedCode,
                        is_advance_payment: isAdvancePayment
                      });
                    }}
                    className="btn-confirm-payment"
                    disabled={updating}
                  >
                    <CheckCircle size={18} /> {isAdvancePayment ? (isPickup && paymentNextStatus === 'reserved' ? 'Confirmar Reserva' : 'Confirmar Adelanto') : (paymentNextStatus === 'prepared' ? 'Preparar' : 'Confirmar Pago y Entrega')}
                  </button>
                </CanAccess>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
