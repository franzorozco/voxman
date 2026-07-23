import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Package, Truck, MapPin, CheckCircle, Clock, AlertCircle, ShoppingBag, User, Phone, Map, Box } from "lucide-react";
import "./Tracking.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace('/api', '');

export default function Tracking() {
  const { id } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const response = await axios.get(`${API_URL}/v1/delivery/${id}`);
        setSchedule(response.data.schedule);
      } catch (err) {
        setError("No se pudo encontrar la información de este envío. Verifica que el enlace sea correcto.");
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();
  }, [id]);

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
  
  const customerName = sale?.guest?.name || sale?.customer?.user?.profile?.first_name || sale?.customer?.posProfile?.first_name || "Cliente";

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { label: 'Preparando', icon: <Package size={28} />, color: '#64748b', activeStep: 1 };
      case 'assigned': return { label: 'Agendado', icon: <Clock size={28} />, color: '#4f46e5', activeStep: 2 };
      case 'on_the_way': return { label: 'En Camino', icon: <Truck size={28} />, color: '#3b82f6', activeStep: 3 };
      case 'at_the_meeting_point': return { label: 'En el Punto', icon: <MapPin size={28} />, color: '#8b5cf6', activeStep: 4 };
      case 'completed': return { label: 'Entregado', icon: <CheckCircle size={28} />, color: '#10b981', activeStep: 5 };
      case 'cancelled': return { label: 'Cancelado', icon: <AlertCircle size={28} />, color: '#ef4444', activeStep: 0 };
      default: return { label: 'Desconocido', icon: <Package size={28} />, color: '#6b7280', activeStep: 0 };
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
          </div>
        )}

        <div className="tracking-section">
          <h3 className="section-title"><Map size={20} /> Detalles Logísticos</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Lugar de Entrega</span>
              <span className="detail-value">{schedule.meeting_point}</span>
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

        <div className="tracking-section">
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
            <div className="summary-row total">
              <span>Total a Pagar</span>
              <span>Bs. {(Number(sale?.subtotal || 0) + Number(shipment?.shipping_cost || 0)).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="tracking-footer">
          Gracias por tu preferencia. ¡Disfruta tu compra!
        </div>
      </div>
    </div>
  );
}
