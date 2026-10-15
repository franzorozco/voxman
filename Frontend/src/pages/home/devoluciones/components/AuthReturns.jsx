import React, { useState, useEffect } from 'react';
import { Package, Loader2, AlertCircle, CheckCircle2, Clock, Tag, Percent, ArrowRight } from 'lucide-react';
import client from '../../../../api/client';
import ReturnRequestForm from './ReturnRequestForm';

export default function AuthReturns() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await client.get('/v1/shop/my-orders');
      setOrders(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const checkOrderEligibility = (order) => {
    // 1. Estado cancelado
    if (order.status === 'cancelled') {
      return { 
        eligible: false, 
        reason: 'Esta compra se encuentra cancelada y no admite devoluciones.', 
        badge: 'Cancelado', 
        badgeClass: 'badge-danger' 
      };
    }

    // 2. Entrega concretada (ni en camino, ni en preparación)
    const shipments = order.shipments || [];
    if (shipments.length > 0) {
      const isDelivered = shipments.every(s => s.status === 'delivered' || Boolean(s.delivered_at));
      if (!isDelivered) {
        return { 
          eligible: false, 
          reason: 'Pedido en camino o en preparación. Solo se admiten devoluciones de compras entregadas.',
          badge: 'En camino / No entregado',
          badgeClass: 'badge-warning'
        };
      }
    } else if (order.status !== 'completed' && order.status !== 'paid') {
      return {
        eligible: false,
        reason: 'Esta compra aún no ha sido concretada en su totalidad.',
        badge: 'Incompleto',
        badgeClass: 'badge-warning'
      };
    }

    // 3. Pago 100% completado (todo el pago pagado y sin saldo pendiente)
    const isPaid = order.status === 'paid' || 
                   order.financials?.is_fully_paid || 
                   (order.financials?.balance_due <= 0 && (order.financials?.total_paid > 0 || order.total === 0));
    if (!isPaid) {
      return {
        eligible: false,
        reason: 'Esta compra tiene un saldo pendiente de pago. Solo se admiten devoluciones con el pago 100% liquidado.',
        badge: 'Pago pendiente',
        badgeClass: 'badge-warning'
      };
    }

    // 4. Plazo máximo de 1 día (24 horas) tras la entrega
    const deliveredShipment = shipments.find(s => s.delivered_at);
    const deliveryDateStr = deliveredShipment?.delivered_at || order.delivered_at || order.created_at;
    const deliveryDate = new Date(deliveryDateStr);
    const diffHours = (new Date() - deliveryDate) / (1000 * 60 * 60);
    if (diffHours > 24) {
      return {
        eligible: false,
        reason: 'El plazo permitido de 1 día (24 horas) tras la entrega para solicitar la devolución ha expirado.',
        badge: 'Plazo expirado (+24h)',
        badgeClass: 'badge-secondary'
      };
    }

    // 5. Solo se pueden seleccionar variables (debe tener al menos un ítem con variante disponible)
    const items = order.items || order.sale_details || [];
    const hasVariantItems = items.some(item => {
      const hasVar = Boolean(item.product_variant_id || item.variant_id || item.product_variant);
      if (!hasVar) return false;
      const returnedQty = item.return_request && item.return_request.status !== 'rejected' 
        ? Number(item.return_request.quantity || 0) 
        : 0;
      return item.quantity > returnedQty;
    });

    if (!hasVariantItems) {
      return {
        eligible: false,
        reason: 'No tiene artículos con variantes (talla/color) disponibles para devolución.',
        badge: 'Sin variantes disponibles',
        badgeClass: 'badge-secondary'
      };
    }

    return { 
      eligible: true, 
      reason: null, 
      badge: 'Concretada y Pagada', 
      badgeClass: 'badge-success' 
    };
  };

  if (selectedSale) {
    return (
      <ReturnRequestForm 
        sale={selectedSale} 
        guestPhone={null} 
        onBack={() => setSelectedSale(null)}
        onReturnSuccess={() => {
          setSelectedSale(null);
          fetchOrders(); // Recargar para actualizar el estado de los items
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="auth-returns-loading">
        <Loader2 size={32} className="spin" style={{ color: 'var(--color-primary, #fff)' }} />
        <p>Cargando tus compras...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="auth-returns-container">
        <div className="no-items-message">
          <Package size={48} />
          <h3>No tienes compras registradas</h3>
          <p>Realiza una compra para poder gestionar devoluciones.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-returns-container">
      <div className="auth-returns-header">
        <h2>Mis Compras</h2>
        <p>Selecciona una compra elegible para iniciar la solicitud de devolución.</p>
      </div>

      {/* Banner de Políticas Claras */}
      <div className="return-policy-banner">
        <div className="policy-badge-item">
          <div className="policy-icon-wrapper">
            <Clock size={16} />
          </div>
          <div className="policy-item-text">
            <strong>1 Día (24 horas)</strong>
            <span>Plazo máximo desde la entrega</span>
          </div>
        </div>

        <div className="policy-badge-item">
          <div className="policy-icon-wrapper">
            <Tag size={16} />
          </div>
          <div className="policy-item-text">
            <strong>Sin uso y con etiqueta</strong>
            <span>Prenda intacta de fábrica</span>
          </div>
        </div>

        <div className="policy-badge-item">
          <div className="policy-icon-wrapper">
            <Percent size={16} />
          </div>
          <div className="policy-item-text">
            <strong>75% de Reembolso</strong>
            <span>Del valor de la prenda</span>
          </div>
        </div>
      </div>

      <div className="orders-list">
        {orders.map(order => {
          const items = order.items || order.sale_details || [];
          if (items.length === 0) return null;

          const eligibility = checkOrderEligibility(order);
          const orderDate = new Date(order.created_at).toLocaleDateString();

          return (
            <div key={order.id} className="order-card">
              {/* Header de la tarjeta responsive */}
              <div className="order-card-header">
                <div className="order-main-info">
                  <div className="order-code-badge">
                    <span className="order-code-prefix">Pedido</span>
                    <span className="order-code-value">{order.invoice_number}</span>
                  </div>
                  <div className="order-date-text">
                    <Clock size={13} />
                    <span>{orderDate}</span>
                  </div>
                </div>

                <div className="order-status-badge-container">
                  <span className={`badge ${eligibility.badgeClass}`}>{eligibility.badge}</span>
                </div>
              </div>

              {/* Lista de prendas del pedido */}
              <div className="order-items-preview">
                {items.map(item => {
                  const hasVariant = Boolean(item.product_variant_id || item.variant_id || item.product_variant);
                  const unitPrice = parseFloat(item.final_price || item.unit_price || 0);
                  const refund75 = unitPrice * 0.75;

                  return (
                    <div key={item.id} className="order-item-row">
                      <div className="order-item-main">
                        <span className="order-item-name">{item.product_name || item.name}</span>
                        <div className="order-item-tags">
                          {item.size && <span className="item-tag tag-size">Talla: {item.size}</span>}
                          {item.fit && <span className="item-tag tag-fit">Fit: {item.fit}</span>}
                          <span className="item-tag tag-qty">Cant: {item.quantity}</span>
                          {!hasVariant && <span className="item-tag tag-novariant">Sin variante</span>}
                        </div>
                      </div>

                      <div className="order-item-pricing">
                        <span className="order-item-price">Bs. {unitPrice.toFixed(2)}</span>
                        <span className="order-item-refund">Reembolso (75%): Bs. {refund75.toFixed(2)}</span>
                        {item.return_request && (
                          <span className={`badge ${item.return_request.status === 'approved' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10px', marginTop: '4px' }}>
                            Devolución: {item.return_request.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mensajes de elegibilidad */}
              {!eligibility.eligible && eligibility.reason && (
                <div className="order-eligibility-note warning">
                  <AlertCircle size={15} className="note-icon" />
                  <span>{eligibility.reason}</span>
                </div>
              )}

              {eligibility.eligible && (
                <div className="order-eligibility-note success">
                  <CheckCircle2 size={15} className="note-icon" />
                  <span>Compra elegible dentro del plazo de 24h. Recuerda que la prenda debe conservar sus etiquetas intactas y no haber sido usada.</span>
                </div>
              )}

              {/* Acciones */}
              <div className="order-actions">
                <button 
                  type="button"
                  className="btn-select-order" 
                  disabled={!eligibility.eligible}
                  onClick={() => eligibility.eligible && setSelectedSale(order)}
                >
                  {eligibility.eligible ? (
                    <>
                      <span>Gestionar Devolución (75% Reembolso)</span>
                      <ArrowRight size={16} />
                    </>
                  ) : (
                    'No elegible para devolución'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
