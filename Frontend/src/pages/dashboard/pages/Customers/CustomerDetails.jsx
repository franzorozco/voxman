import { useState, useEffect } from "react";
import { X, MapPin, ShoppingBag, Gift, Ticket, Award, CreditCard, ChevronDown, ChevronUp, Clock, Store, User as UserIcon, Tag, Plus, Minus, History, Mail, Phone, Calendar, Hash, Globe, ShieldCheck, Send, Check } from "lucide-react";
import { getCustomerById, updateCustomerTags, adjustCustomerPoints, getCustomerTimeline } from "../../../../api/admin/customers";
import { verifyRegisterCode, resendRegisterCode } from "../../../../api/admin/auth";
import { toast } from "react-hot-toast";
import Spinner from "../../components/Spinner/Spinner";

const getSaleStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'paid':
    case 'pagado':
    case 'completed':
    case 'completado':
      return { text: 'Completado', class: 'sale-status-completed' };
    case 'cancelled':
    case 'cancelado':
      return { text: 'Cancelado', class: 'sale-status-cancelled' };
    case 'pending':
    case 'pendiente':
      return { text: 'Pendiente', class: 'sale-status-pending' };
    case 'refunded':
    case 'reembolsado':
      return { text: 'Reembolsado', class: 'sale-status-refunded' };
    default:
      return { text: (status || 'Desconocido').toUpperCase(), class: 'sale-status-neutral' };
  }
};

export default function CustomerDetails({ customerId, onClose, onCustomerUpdated }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSales, setExpandedSales] = useState({});
  const [timeline, setTimeline] = useState([]);
  
  // States for management
  const [newTag, setNewTag] = useState('');
  const [pointsAdjust, setPointsAdjust] = useState({ amount: 0, reason: '' });

  // Email verification states
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendVerificationEmail = async () => {
    if (!customer?.user?.email || resendingEmail || resendCooldown > 0) return;
    try {
      setResendingEmail(true);
      const res = await resendRegisterCode({ email: customer.user.email });
      toast.success(res.data?.message || `Código de verificación enviado a ${customer.user.email}`);
      setResendCooldown(res.data?.cooldown_seconds || 60);
    } catch (error) {
      if (error.response?.data?.cooldown_seconds) {
        setResendCooldown(error.response.data.cooldown_seconds);
      }
      toast.error(error.response?.data?.message || "No se pudo enviar el correo de verificación");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleVerifyCustomerCode = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = (verifyCodeInput || "").replace(/\D/g, "").trim();
    if (cleanCode.length !== 6) {
      toast.error("Ingresa el código de 6 dígitos enviado al correo del cliente");
      return;
    }
    try {
      setVerifyingEmail(true);
      const res = await verifyRegisterCode({
        email: customer.user.email,
        code: cleanCode,
      });
      const verifiedAt = res.data?.user?.email_verified_at || new Date().toISOString();
      setCustomer((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          email_verified_at: verifiedAt,
        },
      }));
      setVerifyCodeInput("");
      toast.success(res.data?.message || "Correo del cliente verificado correctamente");
      if (onCustomerUpdated) onCustomerUpdated();
    } catch (error) {
      toast.error(error.response?.data?.message || "Código inválido o expirado");
    } finally {
      setVerifyingEmail(false);
    }
  };

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const res = await getCustomerById(customerId);
        setCustomer(res.data);
      } catch (error) {
        console.error("Error fetching customer details", error);
      } finally {
        setLoading(false);
      }
    };
    const fetchTimeline = async () => {
      try {
        const res = await getCustomerTimeline(customerId);
        setTimeline(res.data);
      } catch (error) {
        console.error("Error fetching timeline", error);
      }
    };
    if (customerId) {
      fetchCustomer();
      fetchTimeline();
    }
  }, [customerId]);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    try {
      const currentTags = customer.tags || [];
      if (currentTags.includes(newTag.trim())) {
        toast.error('La etiqueta ya existe');
        return;
      }
      const updatedTags = [...currentTags, newTag.trim()];
      await updateCustomerTags(customer.id, updatedTags);
      setCustomer({ ...customer, tags: updatedTags });
      setNewTag('');
      toast.success('Etiqueta agregada');
    } catch (error) {
      toast.error('Error al agregar etiqueta');
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    try {
      const updatedTags = (customer.tags || []).filter(t => t !== tagToRemove);
      await updateCustomerTags(customer.id, updatedTags);
      setCustomer({ ...customer, tags: updatedTags });
      toast.success('Etiqueta eliminada');
    } catch (error) {
      toast.error('Error al eliminar etiqueta');
    }
  };

  const handleAdjustPoints = async (type) => {
    if (!pointsAdjust.amount || !pointsAdjust.reason) {
      toast.error('Ingrese cantidad y motivo');
      return;
    }
    const finalAmount = type === 'add' ? Math.abs(pointsAdjust.amount) : -Math.abs(pointsAdjust.amount);
    
    try {
      const res = await adjustCustomerPoints(customer.id, { points: finalAmount, reason: pointsAdjust.reason });
      setCustomer(res.data.customer);
      toast.success('Puntos ajustados');
      setPointsAdjust({ amount: 0, reason: '' });
      // reload timeline
      const tRes = await getCustomerTimeline(customerId);
      setTimeline(tRes.data);
    } catch (error) {
      toast.error('Error al ajustar puntos');
    }
  };

  const toggleSale = (id) => {
    setExpandedSales(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading || !customer) {
    return (
      <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
        <Spinner size={40} color="var(--color-primary)" />
      </div>
    );
  }

  const isWebCustomer = !!customer.user;
  const profile = isWebCustomer ? (customer.user?.profile || {}) : (customer.pos_profile || customer.posProfile || {});
  const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''} ${profile.last_name_maternal || ''}`.replace(/\s+/g, ' ').trim() || 'Sin Nombre';

  // Calculate accurate total gastado
  const validSales = customer.sales?.filter(s => s.status !== 'cancelled' && s.status !== 'refunded') || [];
  const totalGastado = validSales.reduce((acc, sale) => acc + Number(sale.total), 0);
  const totalCompras = validSales.length;

  return (
    <div 
      className="modal-overlay fade-in customer-details-overlay" 
      onClick={onClose}
      style={{ display: 'flex', justifyContent: 'flex-end', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, backdropFilter: 'blur(5px)' }}
    >
      <div 
        className="customer-modal-drawer" 
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--bg-main)', width: '100%', maxWidth: '1000px', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', animation: 'slideInRight 0.3s ease' }}
      >
        
        {/* Premium Header */}
        <div className="customer-modal-container customer-modal-header" style={{ position: 'relative', overflow: 'hidden', padding: '30px 40px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-card)' }}>
          {/* Decorative shapes */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'var(--bg-overlay)', zIndex: 0 }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <div className="customer-modal-header-content">
              <div style={{ width: '60px', height: '60px', minWidth: '60px', borderRadius: '50%', background: 'var(--color-primary)', color: 'var(--color-primary-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                {profile.first_name ? profile.first_name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.5px' }}>
                    {fullName}
                  </h2>
                </div>
                
                <div className="customer-modal-badges">
                  <span className="customer-badge-code">
                    <Hash size={13} />
                    <span>{customer.customer_code}</span>
                  </span>
                  <span className={`customer-badge-type ${isWebCustomer ? 'type-web' : 'type-pos'}`}>
                    {isWebCustomer ? <Globe size={13} /> : <Store size={13} />}
                    <span>{isWebCustomer ? 'Cliente Web' : 'Cliente Caja (POS)'}</span>
                  </span>
                  {isWebCustomer && customer.user?.email && !customer.user.email.includes('@guest') && (
                    customer.user?.email_verified_at ? (
                      <span
                        title={`Correo verificado el ${new Date(customer.user.email_verified_at).toLocaleString()}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.14)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <ShieldCheck size={13} />
                        <span>Correo Verificado</span>
                      </span>
                    ) : (
                      <span
                        title="Pendiente de confirmar correo dentro de las primeras 24 horas"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#f59e0b',
                          border: '1px solid rgba(245, 158, 11, 0.35)'
                        }}
                      >
                        <Clock size={13} />
                        <span>Pendiente de verificar (24h)</span>
                      </span>
                    )
                  )}
                </div>

                <div className="customer-modal-meta">
                  <span className="customer-meta-item">
                    <Mail size={14} />
                    <span>{customer.user?.email || 'Sin correo registrado'}</span>
                  </span>
                  {profile.phone && (
                    <span className="customer-meta-item">
                      <Phone size={14} />
                      <span>{profile.phone}</span>
                    </span>
                  )}
                  <span className="customer-meta-item">
                    <Calendar size={14} />
                    <span>Miembro desde {new Date(customer.created_at).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button className="customer-modal-close-btn" onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Stats Row */}
        <div className="customer-details-kpi-container customer-modal-container">
          <div className="customer-details-kpi-card kpi-gastado">
            <div className="customer-details-kpi-icon-wrapper">
              <CreditCard size={20} />
            </div>
            <div className="customer-details-kpi-content">
              <span className="customer-details-kpi-label">Total Gastado</span>
              <span className="customer-details-kpi-value">Bs. {totalGastado.toFixed(2)}</span>
            </div>
          </div>

          <div className="customer-details-kpi-card kpi-compras">
            <div className="customer-details-kpi-icon-wrapper">
              <ShoppingBag size={20} />
            </div>
            <div className="customer-details-kpi-content">
              <span className="customer-details-kpi-label">Total Compras</span>
              <span className="customer-details-kpi-value">{totalCompras}</span>
            </div>
          </div>
          
          <div className="customer-details-kpi-card kpi-puntos">
            <div className="customer-details-kpi-icon-wrapper">
              <Award size={20} />
            </div>
            <div className="customer-details-kpi-content">
              <span className="customer-details-kpi-label">Puntos VIP</span>
              <span className="customer-details-kpi-value">{customer.points}</span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="customer-modal-tabs">
          {[
            { id: 'overview', label: 'Resumen' },
            { id: 'timeline', label: 'Historial' },
            { id: 'sales', label: `Compras (${customer.sales?.length || 0})` },
            { id: 'management', label: 'Gestión CRM' },
            { id: 'giftcards', label: `Giftcards (${customer.received_giftcards?.length || 0})` },
            { id: 'discounts', label: 'Cupones' },
            { id: 'addresses', label: 'Direcciones' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '18px 24px',
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                borderBottom: activeTab === tab.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '20px', height: '3px', background: 'var(--color-primary)' }}></span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="customer-modal-container customer-modal-body" style={{ flex: 1, padding: '30px 40px', background: 'var(--bg-main)' }}>
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="fade-in">
               <h3 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserIcon size={20} color="var(--color-primary)"/> Perfil del Cliente
               </h3>
               <div className="customer-modal-grid-2">
                  <div className="customer-crm-card">
                     <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Información Personal</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                           <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nombre Completo</label>
                           <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{fullName}</div>
                        </div>
                        <div>
                           <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Correo Electrónico</label>
                           <div style={{ fontSize: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                             <span>{customer.user?.email || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No registrado (POS)</span>}</span>
                             {isWebCustomer && customer.user?.email && !customer.user.email.includes('@guest') && (
                               customer.user?.email_verified_at ? (
                                 <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.14)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                   <ShieldCheck size={12} /> Verificado
                                 </span>
                               ) : (
                                 <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                                   <Clock size={12} /> Pendiente (24h)
                                 </span>
                               )
                             )}
                           </div>
                        </div>
                        <div>
                           <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Teléfono</label>
                           <div style={{ fontSize: '16px', color: 'var(--text-main)' }}>{profile.phone || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No registrado</span>}</div>
                        </div>
                        {isWebCustomer && (
                          <>
                            <div>
                               <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Género</label>
                               <div style={{ fontSize: '16px', color: 'var(--text-main)' }}>{profile.gender === 'male' ? 'Masculino' : profile.gender === 'female' ? 'Femenino' : profile.gender === 'other' ? 'Otro' : <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No especificado</span>}</div>
                            </div>
                            <div>
                               <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fecha de Nacimiento</label>
                               <div style={{ fontSize: '16px', color: 'var(--text-main)' }}>{profile.birthdate ? new Date(profile.birthdate).toLocaleDateString() : <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No especificada</span>}</div>
                            </div>
                          </>
                        )}
                     </div>
                  </div>
                  <div className="customer-crm-card">
                     <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Estadísticas de Cuenta</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                           <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fecha de Registro</label>
                           <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{new Date(customer.created_at).toLocaleString()}</div>
                        </div>
                        <div>
                           <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Estado</label>
                           <div style={{ marginTop: '4px' }}>
                             <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: customer.is_active ? 'var(--bg-overlay)' : 'var(--bg-overlay)', color: customer.is_active ? 'var(--color-success)' : 'var(--color-danger)' }}>
                               {customer.is_active ? 'Activo' : 'Inactivo'}
                             </span>
                           </div>
                        </div>
                        {isWebCustomer && customer.user?.email && !customer.user.email.includes('@guest') && (
                          <div>
                             <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Verificación de Correo</label>
                             <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-main)' }}>
                               {customer.user?.email_verified_at ? (
                                 <span style={{ color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                   <ShieldCheck size={15} />
                                   Verificado el {new Date(customer.user.email_verified_at).toLocaleString()}
                                 </span>
                               ) : (
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                   <span style={{ color: '#f59e0b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                     <Clock size={15} />
                                     Pendiente de confirmación (se depura a las 24h si no verifica)
                                   </span>

                                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                     <button
                                       type="button"
                                       onClick={handleSendVerificationEmail}
                                       disabled={resendingEmail || resendCooldown > 0}
                                       style={{
                                         display: 'inline-flex',
                                         alignItems: 'center',
                                         gap: '6px',
                                         padding: '7px 12px',
                                         borderRadius: '8px',
                                         border: '1px solid rgba(245, 158, 11, 0.45)',
                                         background: 'rgba(245, 158, 11, 0.12)',
                                         color: '#d97706',
                                         fontSize: '12px',
                                         fontWeight: 700,
                                         cursor: resendingEmail || resendCooldown > 0 ? 'not-allowed' : 'pointer',
                                         opacity: resendingEmail || resendCooldown > 0 ? 0.65 : 1,
                                       }}
                                     >
                                       <Send size={13} />
                                       {resendingEmail
                                         ? 'Enviando correo...'
                                         : resendCooldown > 0
                                         ? `Reenviar en ${resendCooldown}s`
                                         : 'Enviar correo con código'}
                                     </button>
                                   </div>

                                   <form
                                     onSubmit={handleVerifyCustomerCode}
                                     style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}
                                   >
                                     <input
                                       type="text"
                                       inputMode="numeric"
                                       maxLength={6}
                                       placeholder="Código (6 dígitos)"
                                       value={verifyCodeInput}
                                       onChange={(e) => setVerifyCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                       style={{
                                         width: '145px',
                                         padding: '7px 10px',
                                         borderRadius: '8px',
                                         border: '1px solid var(--border-color)',
                                         background: 'var(--bg-input)',
                                         color: 'var(--text-main)',
                                         fontSize: '13px',
                                         fontWeight: 700,
                                         letterSpacing: '2px',
                                         textAlign: 'center',
                                         outline: 'none',
                                       }}
                                     />
                                     <button
                                       type="submit"
                                       disabled={verifyingEmail || verifyCodeInput.length !== 6}
                                       style={{
                                         display: 'inline-flex',
                                         alignItems: 'center',
                                         gap: '5px',
                                         padding: '7px 12px',
                                         borderRadius: '8px',
                                         border: 'none',
                                         background: '#10b981',
                                         color: '#ffffff',
                                         fontSize: '12px',
                                         fontWeight: 700,
                                         cursor: verifyingEmail || verifyCodeInput.length !== 6 ? 'not-allowed' : 'pointer',
                                         opacity: verifyingEmail || verifyCodeInput.length !== 6 ? 0.6 : 1,
                                       }}
                                     >
                                       <Check size={13} />
                                       {verifyingEmail ? 'Verificando...' : 'Confirmar código'}
                                     </button>
                                   </form>
                                 </div>
                               )}
                             </div>
                          </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <div className="fade-in">
              <h3 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={20} color="var(--color-primary)"/> Línea de Tiempo
              </h3>
              
              {timeline.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No hay actividad registrada aún.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '6px', width: '2px', background: 'var(--border-color)' }}></div>
                  {timeline.map((event) => (
                    <div key={event.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-18px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary)', border: '2px solid var(--bg-main)', top: '6px' }}></div>
                      <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px', textTransform: 'capitalize' }}>
                            {event.event_type.replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>{event.description}</p>
                        {event.creator && (
                          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <UserIcon size={12}/> {event.creator.profile?.first_name} {event.creator.profile?.last_name_paternal}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MANAGEMENT TAB */}
          {activeTab === 'management' && (
            <div className="fade-in">
              <h3 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Store size={20} color="var(--color-primary)"/> Gestión de Cliente (CRM)
              </h3>
              
              <div className="customer-modal-grid-2">
                {/* Puntos */}
                <div className="customer-crm-card">
                  <h4 style={{ margin: '0 0 16px 0', color: 'var(--color-warning)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <Award size={18} /> Ajuste Manual de Puntos
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      Los puntos actuales son <strong style={{ color: 'var(--text-main)' }}>{customer.points}</strong>. Usa esta herramienta para sumar o restar puntos en casos especiales.
                    </p>
                    
                    <div style={{ width: '100%' }}>
                      <input 
                        type="number" 
                        value={pointsAdjust.amount || ''}
                        onChange={(e) => setPointsAdjust({...pointsAdjust, amount: e.target.value})}
                        placeholder="Ej. 50 (sumar) o -20 (restar)"
                        style={{ width: '100%', minWidth: 0, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <input 
                      type="text" 
                      value={pointsAdjust.reason}
                      onChange={(e) => setPointsAdjust({...pointsAdjust, reason: e.target.value})}
                      placeholder="Motivo del ajuste (obligatorio)"
                      style={{ width: '100%', minWidth: 0, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }}
                    />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px', width: '100%' }}>
                      <button onClick={() => handleAdjustPoints('add')} style={{ padding: '10px', borderRadius: '8px', background: 'var(--color-success)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                        <Plus size={16}/> Sumar
                      </button>
                      <button onClick={() => handleAdjustPoints('sub')} style={{ padding: '10px', borderRadius: '8px', background: 'var(--color-danger)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                        <Minus size={16}/> Restar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Etiquetas */}
                <div className="customer-crm-card">
                  <h4 style={{ margin: '0 0 16px 0', color: 'var(--color-primary)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <Tag size={18} /> Etiquetas (Tags)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div className="customer-crm-tag-form">
                      <input 
                        type="text" 
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Ej: Mayorista, VIP..."
                        className="customer-crm-tag-input"
                      />
                      <button onClick={handleAddTag} className="customer-crm-tag-btn">
                        Agregar
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(!customer.tags || customer.tags.length === 0) ? (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No hay etiquetas asignadas.</span>
                      ) : (
                        customer.tags.map(tag => (
                          <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', padding: '4px 8px 4px 12px', borderRadius: '20px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{tag}</span>
                            <button onClick={() => handleRemoveTag(tag)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SALES TAB */}
          {activeTab === 'sales' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', color: 'var(--text-main)', margin: 0 }}>Desglose de Compras</h3>
              </div>

              {customer.sales?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {customer.sales.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(sale => {
                    const isExpanded = expandedSales[sale.id];
                    
                    return (
                      <div key={sale.id} style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', transition: 'all 0.3s' }}>
                        {/* Sale Header (Clickable) */}
                        <div 
                          onClick={() => toggleSale(sale.id)}
                          className={`customer-sale-card-header ${isExpanded ? 'is-expanded' : ''}`}
                        >
                          <div className="customer-sale-header-left">
                            <div className="customer-sale-code-row">
                              <span className="customer-sale-mini-icon">
                                <ShoppingBag size={14} />
                              </span>
                              <span className="customer-sale-code-title">
                                Factura {sale.invoice_number ? `#${sale.invoice_number}` : `#${sale.id.split('-')[0]}`}
                              </span>
                            </div>
                            <div className="customer-sale-meta-row">
                              {(() => {
                                const badge = getSaleStatusBadge(sale.status);
                                return (
                                  <span className={`customer-sale-status-badge ${badge.class}`}>
                                    {badge.text}
                                  </span>
                                );
                              })()}
                              <span className="customer-sale-meta-item">
                                <Clock size={12} /> {new Date(sale.created_at).toLocaleString()}
                              </span>
                              <span className="customer-sale-meta-item">
                                <Store size={12} /> {sale.branch?.name || 'Tienda Principal'}
                              </span>
                            </div>
                          </div>

                          <div className="customer-sale-header-right">
                            <div className="customer-sale-amount-block">
                              <span className="customer-sale-amount-label">Total Pagado</span>
                              <span className="customer-sale-amount-val">Bs. {Number(sale.total).toFixed(2)}</span>
                            </div>
                            <div className="customer-sale-chevron">
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                          </div>
                        </div>

                        {/* Sale Details (Expanded) */}
                        {isExpanded && (
                          <div style={{ borderTop: '1px solid var(--border-color)', padding: '24px', background: 'var(--bg-main)' }}>
                            <div className="customer-modal-sale-details">
                              
                              {/* Items List */}
                              <div>
                                <h5 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '1px' }}>Artículos ({sale.sale_details?.length || 0})</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  {sale.sale_details?.map(detail => (
                                    <div key={detail.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                      <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
                                          {detail.product_variant?.product?.name || 'Producto Desconocido'} 
                                          {detail.product_variant?.sku && <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '8px' }}>({detail.product_variant.sku})</span>}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                          {detail.quantity}x a Bs. {Number(detail.unit_price).toFixed(2)}
                                          {Number(detail.discount) > 0 && <span style={{ color: 'var(--color-danger)', marginLeft: '8px' }}>(-Bs. {Number(detail.discount).toFixed(2)} dto)</span>}
                                        </div>
                                      </div>
                                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                        Bs. {Number(detail.final_price).toFixed(2)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Summary & Payments */}
                              <div>
                                <h5 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '1px' }}>Resumen de Pago</h5>
                                <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    <span>Subtotal</span>
                                    <span>Bs. {Number(sale.subtotal).toFixed(2)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: 'var(--color-danger)' }}>
                                    <span>Descuentos</span>
                                    <span>-Bs. {Number(sale.discount_total).toFixed(2)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>
                                    <span>Total</span>
                                    <span>Bs. {Number(sale.total).toFixed(2)}</span>
                                  </div>
                                </div>

                                <h5 style={{ margin: '24px 0 16px 0', fontSize: '14px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '1px' }}>Métodos Utilizados</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {sale.payments?.map(payment => (
                                    <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', background: 'var(--bg-overlay)', padding: '8px 12px', borderRadius: '6px' }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                                        <CreditCard size={14}/> {payment.payment_method?.name || 'Desconocido'}
                                      </span>
                                      <span style={{ fontWeight: 600 }}>Bs. {Number(payment.amount).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>

                                <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                  <strong>Atendido por:</strong> {sale.user?.profile?.first_name || 'Sistema'} {sale.user?.profile?.last_name_paternal || ''}
                                </div>
                              </div>

                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '16px', margin: '0 auto' }} />
                  <p>Este cliente aún no tiene historial de compras.</p>
                </div>
              )}
            </div>
          )}

          {/* GIFTCARDS TAB */}
          {activeTab === 'giftcards' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', color: 'var(--text-main)', margin: 0 }}>Billetera Digital</h3>
              </div>

              {customer.received_giftcards?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  {customer.received_giftcards.map(gc => (
                    <div key={gc.id} style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                      
                      {/* Visual Giftcard Design */}
                      <div style={{ background: 'var(--bg-overlay)', padding: '30px', color: 'var(--text-main)', position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>Tarjeta de Regalo</div>
                            <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', letterSpacing: '2px', fontFamily: 'monospace' }}>
                              {gc.code.match(/.{1,4}/g)?.join(' ') || gc.code}
                            </div>
                          </div>
                          <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <Gift size={24} color="var(--text-main)" />
                          </div>
                        </div>

                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px' }}>
                          <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Saldo Disponible</div>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-success)' }}>Bs. {Number(gc.current_balance).toFixed(2)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estado</div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: gc.is_active ? 'var(--color-success)' : 'var(--color-danger)' }}>{gc.is_active ? 'ACTIVA' : 'INACTIVA'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Transaction History */}
                      <div style={{ padding: '24px' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '1px' }}>Historial de Movimientos</h4>
                        {gc.transactions?.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {gc.transactions.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(tx => (
                              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <div style={{ 
                                    background: 'var(--bg-overlay)', 
                                    color: tx.type === 'issue' ? 'var(--color-success)' : tx.type === 'redemption' ? 'var(--color-warning)' : 'var(--color-primary)',
                                    padding: '10px', borderRadius: '50%' 
                                  }}>
                                    {tx.type === 'issue' ? <Gift size={16} /> : tx.type === 'redemption' ? <ShoppingBag size={16} /> : <CreditCard size={16} />}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
                                      {tx.type === 'issue' ? 'Emisión / Carga' : tx.type === 'redemption' ? 'Uso en Compra' : 'Reembolso'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleString()} • {tx.notes || 'Automático'}</div>
                                  </div>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '16px', color: tx.type === 'issue' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                  {tx.type === 'issue' ? '+Bs. ' : '-Bs. '}{Number(tx.amount).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No hay movimientos registrados.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <Gift size={48} style={{ opacity: 0.2, marginBottom: '16px', margin: '0 auto' }} />
                  <p>El cliente no ha recibido ni adquirido ninguna Giftcard.</p>
                </div>
              )}
            </div>
          )}

          {/* DISCOUNTS TAB */}
          {activeTab === 'discounts' && (
            <div className="fade-in">
              <h3 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-main)' }}>Cupones Especiales</h3>
              {customer.discounts?.length > 0 ? (
                <div className="customer-modal-grid-2">
                  {customer.discounts.map(disc => (
                    <div key={disc.id} style={{ position: 'relative', background: 'var(--bg-overlay)', borderRadius: '16px', border: '1px dashed var(--color-primary)', overflow: 'hidden', padding: '24px', color: 'var(--text-main)', transition: 'transform 0.2s', cursor: 'pointer' }}>
                      {/* Ticket cutouts */}
                      <div style={{ position: 'absolute', top: '50%', left: '-10px', transform: 'translateY(-50%)', width: '20px', height: '20px', background: 'var(--bg-main)', borderRadius: '50%', borderRight: '1px dashed var(--color-primary)' }}></div>
                      <div style={{ position: 'absolute', top: '50%', right: '-10px', transform: 'translateY(-50%)', width: '20px', height: '20px', background: 'var(--bg-main)', borderRadius: '50%', borderLeft: '1px dashed var(--color-primary)' }}></div>
                      
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                          <Tag size={32} color="var(--color-primary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '24px', color: 'var(--color-primary)', marginBottom: '4px' }}>
                            {disc.type === 'percentage' ? `${disc.value}% OFF` : `Bs. ${disc.value} OFF`}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{disc.name}</div>
                          <div style={{ fontSize: '12px', display: 'inline-block', background: 'var(--bg-card)', padding: '4px 8px', borderRadius: '4px', border: '1px dotted var(--color-primary)' }}>
                            CÓDIGO: {disc.code || 'AUTOMÁTICO'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <Ticket size={48} style={{ opacity: 0.2, marginBottom: '16px', margin: '0 auto' }} />
                  <p>No tiene cupones u ofertas especiales asignados.</p>
                </div>
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="fade-in">
              <h3 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-main)' }}>Libreta de Direcciones</h3>
              {customer.addresses?.length > 0 ? (
                <div className="customer-modal-grid-2">
                  {customer.addresses.map(addr => (
                    <div key={addr.id} style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
                      <div style={{ background: 'var(--bg-overlay)', padding: '12px', borderRadius: '50%', color: 'var(--color-primary)', height: 'fit-content' }}>
                        <MapPin size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', fontSize: '16px' }}>{addr.address_type?.toUpperCase()}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                          <p style={{ margin: '0 0 4px 0', color: 'var(--text-main)', fontWeight: 500 }}>{addr.street}</p>
                          <p style={{ margin: 0 }}>{addr.city ? `${addr.city}` : ''} {addr.state ? `, ${addr.state}` : ''}</p>
                          {addr.postal_code && <p style={{ margin: '4px 0 0 0' }}>CP: {addr.postal_code}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <MapPin size={48} style={{ opacity: 0.2, marginBottom: '16px', margin: '0 auto' }} />
                  <p>No hay direcciones de envío guardadas.</p>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="customer-modal-footer">
            <button type="button" onClick={onClose} className="customer-modal-footer-btn">
              <X size={16} /> Cerrar Ficha
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
