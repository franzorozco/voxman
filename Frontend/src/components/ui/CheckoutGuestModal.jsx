import React, { useState, useEffect } from "react";
import { User, Phone, ArrowRight, ArrowLeft, CheckCircle, X, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useShopCartStore from "../../store/shop/useShopCartStore";
import api from "../../api/client"; 
import { API_BASE_URL } from "../../config/api";

const getImageUrl = (path) => {
  if (!path) return `${API_BASE_URL}/storage/products/default.jpg`;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}/storage/${path}`;
};

export default function CheckoutGuestModal({ isOpen, onClose, onSuccessRedirect, theme = 'light' }) {
  const navigate = useNavigate();
  const { items, total, cartToken } = useShopCartStore();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    country_code: "+591",
    whatsapp_phone: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState({ waUrl: '', message: '' });

  // Reset state
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setForm({ name: "", country_code: "+591", whatsapp_phone: "" });
      setErrors({});
      setSuccess(false);
      setSuccessData({ waUrl: '', message: '' });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const validate = (name, value) => {
    let error = "";
    if (name === "name") {
      if (value.trim().length < 3) error = "El nombre es requerido y debe tener al menos 3 caracteres";
    }
    if (name === "whatsapp_phone") {
      if (value.trim().replace(/\D/g,'').length < 7) error = "El número debe tener al menos 7 dígitos";
    }
    if (name === "country_code") {
      if (!/^\+\d{1,4}$/.test(value.trim())) error = "Código inválido (ej: +591)";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    validate(name, value);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!form.name || !form.whatsapp_phone || !form.country_code || Object.values(errors).some((err) => err)) {
      toast.error("Por favor completa los campos correctamente");
      return;
    }
    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }
    setStep(2);
  };

  const handleConfirmOrder = async () => {
    try {
      setLoading(true);
      const token = cartToken || localStorage.getItem('shop-cart-storage') ? JSON.parse(localStorage.getItem('shop-cart-storage'))?.state?.cartToken : null;
      if (!token) throw new Error("No hay un carrito activo");

      const fullPhoneNumber = `${form.country_code.trim()} ${form.whatsapp_phone.trim()}`;

      const response = await api.post("/v1/shop/checkout/guest-init", {
        name: form.name,
        whatsapp_phone: fullPhoneNumber,
      }, {
        headers: {
          'X-Cart-Token': token
        }
      });

      const refNumber = response.data.reference_number || "DESCONOCIDO";
      const waNumber = "59157003312";
      const msg = `Hola VOXman, te escribe ${form.name} y quisiera coordinar la entrega de mi pedido por favor. este es mi codigo: ${refNumber}`;
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

      setSuccessData({ waUrl, message: msg });
      setSuccess(true);

    } catch (error) {
      console.error("Error creating guest checkout", error);
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

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: overlayBg,
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: modalBg,
        borderRadius: '16px',
        width: '100%',
        maxWidth: step === 1 ? '420px' : '550px',
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        animation: 'modalSlideUp 0.3s ease-out',
        border: `1px solid ${borderColor}`,
        transition: 'max-width 0.3s ease'
      }}>
        
        {/* Header / Close Button */}
        <div style={{ padding: '24px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {step === 2 && !success && !loading && (
            <button 
              onClick={() => setStep(1)}
              style={{
                background: 'transparent', border: 'none', color: mutedColor, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: '500', padding: 0
              }}
            >
              <ArrowLeft size={16} /> Volver
            </button>
          )}
          {!success && !loading && (
            <button 
              onClick={onClose}
              style={{
                background: 'transparent', border: 'none', color: mutedColor, cursor: 'pointer',
                padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: 'auto'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div style={{ padding: '0 24px 32px 24px' }}>
          {success ? (
            <div style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '16px 0', textAlign: 'center'
            }}>
              <CheckCircle size={56} color="#10b981" style={{ marginBottom: '16px' }} />
              <span style={{ fontSize: '20px', fontWeight: '700', color: textColor, marginBottom: '16px' }}>
                Orden Iniciada
              </span>

              <div style={{ 
                backgroundColor: warningBg, 
                border: `1px solid ${warningBorder}`, 
                padding: '16px', 
                borderRadius: '8px', 
                marginBottom: '24px',
                width: '100%'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: warningText, fontWeight: '500', lineHeight: '1.5' }}>
                  ⚠️ <strong>IMPORTANTE:</strong> Debes enviar el mensaje de WhatsApp si quieres continuar con tu entrega. Si no envías el mensaje, no podrás hacerlo de nuevo y perderás el seguimiento.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(successData.message);
                    toast.success("Mensaje copiado al portapapeles");
                  }}
                  style={{ 
                    background: inputBg, color: textColor, border: `1px solid ${borderColor}`, 
                    padding: '14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px'
                  }}
                >
                  Copiar mensaje
                </button>

                <button 
                  onClick={() => window.open(successData.waUrl, '_blank')}
                  style={{ 
                    background: '#25D366', color: '#fff', border: 'none', 
                    padding: '14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px'
                  }}
                >
                  Enviar a WhatsApp
                </button>

                <button 
                  onClick={onClose}
                  style={{ 
                    background: 'transparent', color: mutedColor, border: 'none', 
                    padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', marginTop: '4px'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '0.05em', color: textColor }}>
                  COMPRA RÁPIDA
                </h2>
                <p style={{ margin: 0, color: mutedColor, fontSize: '14px' }}>
                  {step === 1 ? "Ingresa tus datos para continuar" : "Confirma tu orden"}
                </p>
              </div>

              {step === 1 && (
                <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* NAME */}
                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center', backgroundColor: inputBg,
                      border: `1px solid ${errors.name ? '#ef4444' : borderColor}`, borderRadius: '8px', padding: '0 12px'
                    }}>
                      <User size={18} color={mutedColor} />
                      <input
                        name="name"
                        type="text"
                        placeholder="Nombre completo"
                        value={form.name}
                        onChange={handleChange}
                        style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px', color: textColor, fontSize: '15px', outline: 'none' }}
                      />
                    </div>
                    {errors.name && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block' }}>{errors.name}</span>}
                  </div>

                  {/* PHONE WITH COUNTRY CODE */}
                  <div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{
                        width: '100px',
                        display: 'flex', alignItems: 'center', backgroundColor: inputBg,
                        border: `1px solid ${errors.country_code ? '#ef4444' : borderColor}`, borderRadius: '8px', padding: '0 12px'
                      }}>
                        <input
                          name="country_code"
                          type="text"
                          placeholder="+591"
                          value={form.country_code}
                          onChange={handleChange}
                          style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 0', color: textColor, fontSize: '15px', outline: 'none', textAlign: 'center' }}
                        />
                      </div>
                      
                      <div style={{
                        flex: 1,
                        display: 'flex', alignItems: 'center', backgroundColor: inputBg,
                        border: `1px solid ${errors.whatsapp_phone ? '#ef4444' : borderColor}`, borderRadius: '8px', padding: '0 12px'
                      }}>
                        <Phone size={18} color={mutedColor} />
                        <input
                          name="whatsapp_phone"
                          type="tel"
                          placeholder="Número de WhatsApp"
                          value={form.whatsapp_phone}
                          onChange={handleChange}
                          style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px', color: textColor, fontSize: '15px', outline: 'none' }}
                        />
                      </div>
                    </div>
                    {(errors.whatsapp_phone || errors.country_code) && (
                      <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block' }}>
                        {errors.country_code || errors.whatsapp_phone}
                      </span>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    style={{
                      marginTop: '8px', width: '100%', background: textColor, color: modalBg, border: 'none',
                      padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    Siguiente paso <ArrowRight size={18} />
                  </button>
                </form>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  <div style={{ border: `1px solid ${borderColor}`, borderRadius: '12px', padding: '16px', backgroundColor: inputBg, maxHeight: '250px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: textColor, fontWeight: '600' }}>
                      <ShoppingBag size={18} /> Resumen de tu Carrito
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: idx !== items.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
                          <img 
                            src={getImageUrl(item.image)} 
                            alt={item.name} 
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} 
                          />
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                    <span style={{ color: mutedColor, fontSize: '15px', fontWeight: '500' }}>Total a pagar</span>
                    <span style={{ color: textColor, fontSize: '24px', fontWeight: '700' }}>Bs {total.toFixed(2)}</span>
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
                    {loading ? "Procesando..." : "Confirmar Orden"}
                  </button>
                </div>
              )}
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
