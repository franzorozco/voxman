import React, { useState } from 'react';
import { X, ShoppingBag, MapPin, CheckCircle, Truck, Store, MapIcon, Home, User as UserIcon } from 'lucide-react';
import { initAuthCheckout } from '../../api/shopAuth';
import useShopCartStore from '../../store/shop/useShopCartStore';
import { getImageUrl } from '../../utils/imageUtils';
import toast from 'react-hot-toast';

export default function CheckoutUserModal({ isOpen, onClose, cartItems, totalAmount, cartToken, deliveryType, isAuth, user, theme = 'light', appliedGlobalDiscount }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  if (!isOpen) return null;

  const handleConfirmOrder = async () => {
    try {
      setLoading(true);
      
      const payload = isAuth ? {
        delivery_type: typeof deliveryType === 'object' ? deliveryType.type : deliveryType,
        branch_id: typeof deliveryType === 'object' ? deliveryType.branchId : null,
        delivery_details: typeof deliveryType === 'object' ? deliveryType : { type: deliveryType },
        discount_id: window.appliedShopDiscount?.id || null,
        discount_amount: window.appliedShopDiscount?.discount_amount || 0
      } : {};

      const res = await initAuthCheckout(payload);
      
      const refNumber = res.data.reference_number || "DESCONOCIDO";
      let waNumber = res.data.whatsapp_number || "59157003312";
      waNumber = waNumber.replace(/\D/g, ''); 
      
      const userName = user?.profile?.first_name || user?.username || "Cliente";
      
      const deliveryMethodStr = typeof deliveryType === 'object' ? deliveryType.text : deliveryType;

      const msg = `Hola te escribe ${userName}, y quisiera hacer mi pedido de unos productos de su tienda, el código de mi carrito es ${refNumber} y elegí la opción de entrega: ${deliveryMethodStr} por favor.`;
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

      setSuccessData({ waUrl, message: msg });
      setSuccess(true);
      
      useShopCartStore.setState({ items: [], total: 0 });

    } catch (error) {
      console.error("Error creating auth checkout", error);
      toast.error(error.response?.data?.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const overlayBg = isDark ? "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0.6)";
  const modalBg = isDark ? "#111827" : "#ffffff";
  const textColor = isDark ? "#f3f4f6" : "#111827";
  const mutedColor = isDark ? "#9ca3af" : "#6b7280";
  const borderColor = isDark ? "#374151" : "#e5e7eb";
  const inputBg = isDark ? "#1f2937" : "#f9fafb";
  const warningBg = isDark ? "rgba(245, 158, 11, 0.1)" : "#fffbeb";
  const warningBorder = isDark ? "rgba(245, 158, 11, 0.3)" : "#fde68a";
  const warningText = isDark ? "#fbbf24" : "#92400e";

  const deliveryMethodStr = typeof deliveryType === 'object' ? deliveryType.text : deliveryType;
  
  const customerProfile = user?.profile || {};
  const customer = user?.customers?.[0] || {};
  const primaryPhone = customerProfile.phone || 'No registrado';
  const customerCode = customer.customer_code || 'No asignado';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: overlayBg, backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: '20px'
    }}>
      <div style={{
        backgroundColor: modalBg, borderRadius: '16px', width: '100%', maxWidth: '550px',
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden', position: 'relative', animation: 'modalSlideUp 0.3s ease-out', border: `1px solid ${borderColor}`
      }}>
        
        <div style={{ padding: '24px 24px 0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {!success && !loading && (
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: mutedColor, cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
              <X size={20} />
            </button>
          )}
        </div>

        <div style={{ padding: '0 24px 32px 24px', maxHeight: '80vh', overflowY: 'auto' }}>
          {success ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0', textAlign: 'center' }}>
              <CheckCircle size={56} color="#10b981" style={{ marginBottom: '16px' }} />
              <span style={{ fontSize: '20px', fontWeight: '700', color: textColor, marginBottom: '16px' }}>Orden Iniciada</span>

              <div style={{ backgroundColor: warningBg, border: `1px solid ${warningBorder}`, padding: '16px', borderRadius: '8px', marginBottom: '24px', width: '100%' }}>
                <p style={{ margin: 0, fontSize: '14px', color: warningText, fontWeight: '500', lineHeight: '1.5' }}>
                  ⚠️ <strong>IMPORTANTE:</strong> Tu reserva expira en 20 minutos. Debes enviar el mensaje de WhatsApp para que procesemos tu orden.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(successData.message);
                    toast.success("Mensaje copiado al portapapeles");
                  }}
                  style={{ background: 'transparent', border: `1px solid ${borderColor}`, color: textColor, padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', width: '100%' }}
                >
                  Copiar Mensaje
                </button>
                <button 
                  onClick={() => window.open(successData.waUrl, '_blank')}
                  style={{ background: '#25D366', border: 'none', color: '#fff', padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  Continuar al Chat
                </button>
                <button 
                  onClick={onClose} 
                  style={{ background: 'transparent', color: mutedColor, border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', marginTop: '4px' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '0.05em', color: textColor }}>CONFIRMA TU ORDEN</h2>
                <p style={{ margin: 0, color: mutedColor, fontSize: '14px' }}>Verifica que todos los datos sean correctos</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Datos del Cliente */}
                {isAuth && (
                  <div style={{ border: `1px solid ${borderColor}`, borderRadius: '12px', padding: '16px', backgroundColor: inputBg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: textColor, fontWeight: '600' }}>
                      <UserIcon size={18} /> Datos del Cliente
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', color: mutedColor, fontSize: '12px' }}>Nombre completo</p>
                        <p style={{ margin: 0, color: textColor, fontWeight: '500' }}>{customerProfile.first_name || ''} {customerProfile.last_name_paternal || ''} {customerProfile.last_name_maternal || ''}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px', color: mutedColor, fontSize: '12px' }}>Código de Cliente</p>
                        <p style={{ margin: 0, color: textColor, fontWeight: '500' }}>{customerCode}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px', color: mutedColor, fontSize: '12px' }}>Teléfono</p>
                        <p style={{ margin: 0, color: textColor, fontWeight: '500' }}>{primaryPhone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Datos de Entrega */}
                <div style={{ border: `1px solid ${borderColor}`, borderRadius: '12px', padding: '16px', backgroundColor: inputBg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: textColor, fontWeight: '600' }}>
                    <MapPin size={18} /> Detalles de Entrega
                  </div>
                  <p style={{ margin: 0, color: textColor, fontSize: '14px', lineHeight: '1.5' }}>
                    {deliveryMethodStr || 'No especificado'}
                  </p>
                </div>

                {/* Resumen del carrito */}
                <div style={{ border: `1px solid ${borderColor}`, borderRadius: '12px', padding: '16px', backgroundColor: inputBg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: textColor, fontWeight: '600' }}>
                    <ShoppingBag size={18} /> Resumen de Productos
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cartItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: idx !== cartItems.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
                        <img src={getImageUrl(item.image)} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: textColor, lineHeight: '1.2' }}>{item.name}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: mutedColor }}>
                            {item.color} {item.size ? `• Talla ${item.size}` : ''} • Cant: {item.quantity}
                          </p>
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: textColor }}>
                          Bs {(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: mutedColor, fontSize: '15px' }}>Subtotal</span>
                    <span style={{ color: textColor, fontSize: '16px', fontWeight: '500' }}>Bs {totalAmount.toFixed(2)}</span>
                  </div>
                  
                  {appliedGlobalDiscount && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#16a34a' }}>
                      <span style={{ fontSize: '15px' }}>Descuento ({appliedGlobalDiscount.code})</span>
                      <span style={{ fontSize: '16px', fontWeight: '500' }}>-Bs {parseFloat(appliedGlobalDiscount.amount).toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: `1px solid ${borderColor}` }}>
                    <span style={{ color: textColor, fontSize: '16px', fontWeight: '600' }}>Total a pagar</span>
                    <span style={{ color: textColor, fontSize: '24px', fontWeight: '700' }}>
                      Bs {appliedGlobalDiscount ? (totalAmount - parseFloat(appliedGlobalDiscount.amount)).toFixed(2) : totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleConfirmOrder}
                  disabled={loading}
                  style={{
                    marginTop: '8px', width: '100%', background: textColor, color: modalBg, border: 'none',
                    padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', 
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Procesando...' : 'Confirmar orden'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
