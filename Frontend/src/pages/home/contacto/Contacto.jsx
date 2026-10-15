import React, { useState, useEffect } from 'react';
import { Mail, MessageCircle, Send, Loader2, CheckCircle2, AlertCircle, UserCheck, HelpCircle } from 'lucide-react';
import { useShopSettingsStore } from "../../../store/shop/useShopSettingsStore";
import { useAuthStore } from "../../../store/authStore";
import Navbar from "../components/Navbar";
import Footer from "../../../components/layout/Footer";
import { sendContactMessage, checkContactEmail } from "../../../api/shop/contact";
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Contacto.css';

export const CONTACT_SUBJECT_CATEGORIES = [
  {
    category: "Pedidos y Entregas",
    options: [
      {
        id: "consulta_pedido",
        label: "Consulta sobre estado de mi pedido o número de guía",
        template: `Hola equipo de soporte VOXman,

Quisiera consultar sobre el estado de mi pedido:
• Código de venta / entrega (ej. VXM-12345 o DLV-...): 
• Nombre completo registrado: 
• Situación actual: [Indica si el pedido no ha salido, si falta el código de seguimiento o qué consulta tienes]`
      },
      {
        id: "problema_entrega",
        label: "Inconveniente en la entrega (demora, dirección o paquetería)",
        template: `Hola equipo de soporte,

Tengo un problema con la entrega de mi paquete:
• Número de pedido / entrega: 
• Agencia o dirección de despacho: 
• ¿Qué ocurrió?: [Indica si hubo retraso injustificado, dirección incorrecta o no fue entregado en agencia]`
      }
    ]
  },
  {
    category: "Prendas, Tallas y Devoluciones",
    options: [
      {
        id: "defecto_prenda",
        label: "Prenda recibida con defecto de fábrica o dañada",
        template: `Hola equipo de soporte VOXman,

Recibí un artículo con un detalle o defecto de fábrica:
• Código de pedido: 
• Prenda afectada (nombre y talla): 
• Descripción del defecto o falla: [Describe detalladamente lo que encontraste en la prenda]
• Confirmo que la prenda no ha sido usada y cuenta con su etiqueta de fábrica intacta.`
      },
      {
        id: "cambio_talla",
        label: "Solicitud de cambio de talla, fit o color",
        template: `Hola equipo de soporte,

Deseo solicitar un cambio para una de mis prendas:
• Código de pedido: 
• Prenda recibida (talla y color actual): 
• Nueva talla o variante deseada: 
• Sucursal de preferencia (o envío): 
• Confirmo que la prenda está completamente nueva y con etiqueta original.`
      },
      {
        id: "consulta_devolucion",
        label: "Dudas sobre proceso de devolución o reembolso (75%)",
        template: `Hola equipo de soporte VOXman,

Tengo una consulta sobre el trámite de devolución:
• Código de pedido: 
• Prenda en cuestión: 
• Situación: [Indica tu duda sobre el plazo de 24h, la inspección física o el reembolso del 75%]`
      },
      {
        id: "duda_tallaje",
        label: "Duda sobre tallaje, medidas o especificaciones de tela",
        template: `Hola equipo de asesores de VOXman,

Quisiera orientación sobre una prenda antes de comprar:
• Nombre del producto o enlace: 
• Mi estatura y peso aproximado (o medidas): 
• Duda específica: [¿Es corte Slim o Regular?, ¿cede la tela?, ¿qué talla me recomiendan?]`
      },
      {
        id: "stock_reposicion",
        label: "Consulta sobre reposición de stock o producto agotado",
        template: `Hola equipo comercial,

Quisiera consultar sobre la disponibilidad de un producto:
• Nombre de la prenda: 
• Color y talla que busco: 
• ¿Tienen fecha estimada de reposición o disponibilidad en alguna sucursal física?`
      }
    ]
  },
  {
    category: "Pagos, Descuentos y Facturación",
    options: [
      {
        id: "problema_pago",
        label: "Problema con el pago, QR o validación de comprobante",
        template: `Hola equipo de finanzas y soporte,

Tuve un inconveniente al realizar o registrar el pago de mi compra:
• Número de pedido o carrito: 
• Método de pago utilizado (QR / Transferencia / Tarjeta): 
• Monto pagado: Bs. 
• Número de referencia bancaria o transacción: 
• Detalle de lo sucedido: [Describe si el comprobante no carga, si el saldo no se actualizó, etc.]`
      },
      {
        id: "error_cupon",
        label: "Error al aplicar cupón promocional o código de descuento",
        template: `Hola equipo de soporte,

Tengo un problema al canjear un descuento:
• Código de cupón ingresado: 
• Mensaje de error que aparece en pantalla: 
• Prendas que tengo en mi carrito: 
• Detalle adicional: [Describe lo que ocurre al intentar aplicar el código]`
      },
      {
        id: "solicitud_factura",
        label: "Solicitud de factura legal con NIT o corrección fiscal",
        template: `Hola equipo de administración,

Solicito la emisión / corrección de factura de mi compra:
• Número de pedido: 
• Razón Social / Nombre: 
• NIT / CI: 
• Correo electrónico para el envío de la factura digital: 
• Observaciones adicionales: `
      }
    ]
  },
  {
    category: "Cuenta y Atención al Cliente",
    options: [
      {
        id: "acceso_cuenta",
        label: "Problemas de acceso a mi cuenta o restablecimiento de contraseña",
        template: `Hola equipo técnico de VOXman,

No puedo acceder a mi cuenta de usuario:
• Correo electrónico de la cuenta: 
• Inconveniente específico: [No llega el correo de recuperación / Sesión bloqueada / Datos desactualizados]
• Mensaje de error (si aplica): `
      },
      {
        id: "queja_reclamo",
        label: "Queja o reclamo sobre atención al cliente o servicio",
        template: `A la atención de Administración VOXman,

Deseo presentar un reclamo formal sobre el servicio recibido:
• Canal o sucursal donde ocurrió: [Tienda física / Canal de WhatsApp / Plataforma Web]
• Fecha y hora aproximada: 
• Personal involucrado (si aplica): 
• Hechos ocurridos: [Describe con claridad y respeto lo acontecido...]`
      },
      {
        id: "sugerencia",
        label: "Sugerencia o propuesta de mejora para la tienda",
        template: `Hola equipo de VOXman,

Me gustaría compartir una sugerencia para mejorar la experiencia de compra:
• Área de la sugerencia (Colecciones, Envíos, Empaque, Plataforma web): 
• Mi propuesta o recomendación: [Escribe aquí tu idea detallada...]`
      },
      {
        id: "otro",
        label: "Otro motivo no listado (especificar en el mensaje)",
        template: `Hola equipo de soporte VOXman,

Me comunico por el siguiente motivo particular:
• Motivo principal: [Indica brevemente el tema de tu consulta]
• Explicación de lo sucedido: [Describe aquí detalladamente tu situación para poder asistirte...]`
      }
    ]
  }
];

export default function Contacto() {
  const { settings } = useShopSettingsStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('none');
  const [loading, setLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState({
    checked: false,
    exists: null,
    message: ''
  });

  // Prellenar datos si el usuario está autenticado
  useEffect(() => {
    if (user) {
      const fullName = user.first_name 
        ? `${user.first_name} ${user.last_name_paternal || ''}`.trim() 
        : (user.username || '');
      setFormData(prev => ({
        ...prev,
        name: prev.name || fullName,
        email: user.email || ''
      }));
      setEmailStatus({
        checked: true,
        exists: true,
        message: 'Cuenta autenticada en el sistema'
      });
    }
  }, [user]);

  const handleWhatsApp = () => {
    const phone = settings?.store_phone?.replace(/\s+/g, '') || "+59157003312";
    const message = encodeURIComponent("Hola, me gustaría comunicarme con el equipo de soporte de VOXman.");
    window.open(`https://wa.me/${phone.replace('+', '')}?text=${message}`, '_blank');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Si modifica el correo, reiniciamos el estado de validación si no está logueado
    if (name === 'email' && !user) {
      setEmailStatus({ checked: false, exists: null, message: '' });
    }
  };

  // Validación de existencia de correo para usuarios invitados
  const handleEmailBlur = async () => {
    if (user) return; // Si está autenticado, su correo ya es válido
    const emailToVerify = formData.email.trim();
    if (!emailToVerify || !emailToVerify.includes('@')) {
      return;
    }

    try {
      setEmailCheckLoading(true);
      const res = await checkContactEmail(emailToVerify);
      if (res.data.exists) {
        setEmailStatus({
          checked: true,
          exists: true,
          message: 'Cuenta registrada verificada.'
        });
        // Si no ha escrito su nombre y la cuenta tiene nombre, autocompletar
        if (!formData.name && res.data.name) {
          setFormData(prev => ({ ...prev, name: res.data.name }));
        }
      } else {
        setEmailStatus({
          checked: true,
          exists: false,
          message: res.data.message || 'No existe ninguna cuenta registrada con este correo.'
        });
      }
    } catch (err) {
      setEmailStatus({
        checked: false,
        exists: null,
        message: ''
      });
    } finally {
      setEmailCheckLoading(false);
    }
  };

  // Selector de Asunto y Población Automática de Plantilla
  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubjectId(subjectId);

    if (!subjectId) {
      setFormData(prev => ({ ...prev, subject: '', message: '' }));
      return;
    }

    // Buscar la opción en las categorías
    let foundOption = null;
    for (const group of CONTACT_SUBJECT_CATEGORIES) {
      const match = group.options.find(opt => opt.id === subjectId);
      if (match) {
        foundOption = match;
        break;
      }
    }

    if (foundOption) {
      setFormData(prev => ({
        ...prev,
        subject: foundOption.label,
        message: foundOption.template
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast.error('Por favor, completa todos los campos del formulario.');
      return;
    }

    // Validación de seguridad de cuenta existente
    if (!user && emailStatus.checked && !emailStatus.exists) {
      toast.error('No se puede enviar el mensaje desde una cuenta inexistente. Debes ingresar el correo de tu cuenta activa en VOXman o registrarte.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendContactMessage(formData);
      toast.success(res.data?.message || '¡Mensaje enviado correctamente! Te responderemos pronto.');
      setFormData(prev => ({
        ...prev,
        subject: '',
        message: ''
      }));
      setSelectedSubjectId('');
      setActiveTab('none');
    } catch (error) {
      if (!error.response || error.code === "ERR_NETWORK") {
        toast.error('No se pudo contactar al servidor. Revisa tu conexión.');
      } else {
        toast.error(error.response?.data?.message || 'Ocurrió un error al enviar el mensaje. Intenta de nuevo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar isDarkThemeOverride={true} />
      
      <main className="contacto-page" style={{ flex: 1 }}>
        <div className="contacto-header">
          <h1>Centro de Contacto &amp; Soporte</h1>
          <p>
            ¿Tienes alguna consulta sobre tus pedidos, prendas o necesitas asistencia personalizada? 
            Comunícate directamente a través de WhatsApp o abre un ticket de atención enviando un correo oficial.
          </p>
        </div>

        <div className="contacto-options">
          {/* Card WhatsApp */}
          <div className="contacto-card" onClick={handleWhatsApp}>
            <div className="contacto-icon whatsapp">
              <MessageCircle size={28} />
            </div>
            <h3>WhatsApp Oficial</h3>
            <p>Atención inmediata y personalizada para consultas rápidas sobre stock, compras y entregas.</p>
            <button className="contacto-btn">Chatear por WhatsApp</button>
          </div>

          {/* Card Correo */}
          <div 
            className={`contacto-card ${activeTab === 'email' ? 'active' : ''}`} 
            onClick={() => setActiveTab(activeTab === 'email' ? 'none' : 'email')}
          >
            <div className="contacto-icon email">
              <Mail size={28} />
            </div>
            <h3>Buzón de Soporte</h3>
            <p>Envíanos un mensaje formal estructurado con el asunto de tu consulta y te responderemos por correo.</p>
            <button className="contacto-btn">
              {activeTab === 'email' ? 'Cerrar formulario' : 'Redactar Correo'}
            </button>
          </div>
        </div>

        {activeTab === 'email' && (
          <div className="contacto-form-container">
            <div className="contacto-form-header">
              <h2>Formulario Oficial de Soporte</h2>
              <p>Por políticas de trazabilidad y seguridad, todos los mensajes deben enviarse desde una cuenta registrada en VOXman.</p>
            </div>

            <form onSubmit={handleSubmit} className="contacto-form">
              {/* Nombre */}
              <div className="contacto-form-group">
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Ej. Juan Pérez Morales" 
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Correo Electrónico con Validación de Cuenta Existente */}
              <div className="contacto-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Correo Electrónico de tu Cuenta</label>
                  {emailCheckLoading && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      <Loader2 size={12} className="spin" style={{ display: 'inline', marginRight: 4 }} /> Verificando cuenta...
                    </span>
                  )}
                </div>

                <div className="email-input-container">
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="tucorreo@ejemplo.com" 
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleEmailBlur}
                    readOnly={Boolean(user)}
                    required
                    className={
                      user || (emailStatus.checked && emailStatus.exists)
                        ? 'input-verified'
                        : emailStatus.checked && !emailStatus.exists
                        ? 'input-error'
                        : ''
                    }
                  />
                  {user && (
                    <div className="account-status-pill verified">
                      <UserCheck size={14} />
                      <span>Cuenta Activa</span>
                    </div>
                  )}
                </div>

                {/* Mensajes de validación de correo */}
                {user ? (
                  <span className="account-notice success">
                    <CheckCircle2 size={13} /> Tu mensaje se enviará vinculado a tu cuenta verificada ({user.email}).
                  </span>
                ) : (
                  emailStatus.checked && (
                    emailStatus.exists ? (
                      <span className="account-notice success">
                        <CheckCircle2 size={13} /> Cuenta encontrada y verificada en el sistema.
                      </span>
                    ) : (
                      <div className="account-notice error">
                        <AlertCircle size={14} />
                        <div>
                          <strong>Cuenta no registrada:</strong> No existe ninguna cuenta con este correo. 
                          <span style={{ display: 'block', marginTop: '2px' }}>
                            Por favor ingresa tu correo registrado o <Link to="/register" style={{ color: '#fff', textDecoration: 'underline' }}>crea una cuenta aquí</Link>.
                          </span>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>

              {/* Selector de Asunto */}
              <div className="contacto-form-group">
                <label>Asunto o Situación de tu Consulta</label>
                <select 
                  className="contacto-select" 
                  value={selectedSubjectId} 
                  onChange={handleSubjectChange}
                  required
                >
                  <option value="">-- Selecciona el asunto que mejor describa tu caso --</option>
                  {CONTACT_SUBJECT_CATEGORIES.map((group, gIdx) => (
                    <optgroup key={gIdx} label={group.category}>
                      {group.options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <span className="select-hint">
                  <HelpCircle size={13} /> Al seleccionar una situación, se preparará una plantilla abierta para que completes lo sucedido.
                </span>
              </div>

              {/* Mensaje Predeterminado Abierto */}
              <div className="contacto-form-group">
                <label>Detalle de lo Sucedido / Mensaje</label>
                <textarea 
                  name="message" 
                  placeholder="Selecciona un asunto arriba para cargar la plantilla o describe detalladamente tu situación..." 
                  value={formData.message}
                  onChange={handleChange}
                  rows={8}
                  required
                  minLength={15}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Puedes editar y rellenar los datos entre corchetes con lo acontecido en tu compra o consulta.
                </span>
              </div>

              <button 
                type="submit" 
                className="contacto-submit" 
                disabled={loading || (!user && emailStatus.checked && !emailStatus.exists)}
              >
                {loading ? (
                  <><Loader2 size={18} className="spin" /> Enviando mensaje a soporte...</>
                ) : (
                  <><Send size={18} /> Enviar Mensaje a Soporte</>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
