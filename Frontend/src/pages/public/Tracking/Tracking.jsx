import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Package, Truck, MapPin, CheckCircle, Clock, AlertCircle } from "lucide-react";
import "./Tracking.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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
  
  const customerName = sale?.guest?.name || sale?.customer?.user?.name || "Cliente";

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { label: 'Preparando', icon: <Package size={24} />, color: '#f59e0b', activeStep: 1 };
      case 'assigned': return { label: 'Agendado', icon: <Clock size={24} />, color: '#3b82f6', activeStep: 2 };
      case 'on_the_way': return { label: 'En Camino', icon: <Truck size={24} />, color: '#3b82f6', activeStep: 3 };
      case 'at_the_meeting_point': return { label: 'En el Punto de Encuentro', icon: <MapPin size={24} />, color: '#8b5cf6', activeStep: 4 };
      case 'completed': return { label: 'Entregado', icon: <CheckCircle size={24} />, color: '#10b981', activeStep: 5 };
      case 'cancelled': return { label: 'Cancelado', icon: <AlertCircle size={24} />, color: '#ef4444', activeStep: 0 };
      default: return { label: 'Desconocido', icon: <Package size={24} />, color: '#6b7280', activeStep: 0 };
    }
  };

  const statusInfo = getStatusInfo(schedule.status);

  return (
    <div className="tracking-wrapper">
      <div className="tracking-card">
        <div className="tracking-header">
          <h1>Seguimiento de Envío</h1>
          <p className="tracking-ref">N° de Reserva: <strong>{sale?.reference_number || 'N/A'}</strong></p>
        </div>

        <div className="tracking-status-hero" style={{ background: `linear-gradient(135deg, ${statusInfo.color}22 0%, transparent 100%)`, borderLeft: `4px solid ${statusInfo.color}` }}>
          <div className="status-icon" style={{ color: statusInfo.color }}>
            {statusInfo.icon}
          </div>
          <div className="status-text">
            <h2>{statusInfo.label}</h2>
            <p>Hola {customerName}, este es el estado actual de tu pedido.</p>
          </div>
        </div>

        {schedule.status !== 'cancelled' && (
          <div className="tracking-timeline">
            <div className={`timeline-step ${statusInfo.activeStep >= 1 ? 'active' : ''}`}>
              <div className="step-dot"></div>
              <p>Preparando</p>
            </div>
            <div className={`timeline-step ${statusInfo.activeStep >= 2 ? 'active' : ''}`}>
              <div className="step-dot"></div>
              <p>Agendado</p>
            </div>
            <div className={`timeline-step ${statusInfo.activeStep >= 3 ? 'active' : ''}`}>
              <div className="step-dot"></div>
              <p>En Camino</p>
            </div>
            <div className={`timeline-step ${statusInfo.activeStep >= 4 ? 'active' : ''}`}>
              <div className="step-dot"></div>
              <p>En el Punto</p>
            </div>
            <div className={`timeline-step ${statusInfo.activeStep >= 5 ? 'active' : ''}`}>
              <div className="step-dot"></div>
              <p>Entregado</p>
            </div>
          </div>
        )}

        <div className="tracking-details">
          <h3>Detalles Logísticos</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Punto de Encuentro</span>
              <span className="detail-value">{schedule.meeting_point}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Fecha Programada</span>
              <span className="detail-value">{schedule.scheduled_date}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Hora Estimada</span>
              <span className="detail-value">{schedule.time_window}</span>
            </div>
          </div>
        </div>

        <div className="tracking-products">
          <h3>Tu Pedido</h3>
          <div className="products-list">
            {details.map((item, idx) => (
              <div key={idx} className="product-item">
                <div className="product-info">
                  <span className="product-name">{item.variant?.product?.name || 'Producto'}</span>
                  <span className="product-qty">Cantidad: {item.quantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="tracking-footer">
          <p>Gracias por tu preferencia.</p>
        </div>
      </div>
    </div>
  );
}
