import React, { useState, useEffect } from 'react';
import { Package, Loader2 } from 'lucide-react';
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
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
      <div className="auth-returns-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '15px' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--color-primary)' }} />
        <p>Cargando tus compras...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="auth-returns-container">
        <h2>Mis Compras</h2>
        <div className="no-items-message">
          <Package size={48} />
          <h3>No tienes compras registradas</h3>
          <p>Realiza una compra para poder solicitar devoluciones.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-returns-container">
      <h2>Mis Compras</h2>
      <p>Selecciona la compra que contiene el artículo que deseas devolver.</p>

      <div className="orders-list">
        {orders.map(order => {
          // Mostrar sólo si hay items
          if (!order.items || order.items.length === 0) return null;

          return (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h4>Pedido: {order.invoice_number}</h4>
                  <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="order-status">
                  <span className={`badge status-${order.status}`}>{order.status}</span>
                </div>
              </div>
              <div className="order-items-preview">
                {order.items.map(item => (
                  <div key={item.id} className="mini-item">
                    {item.product_name} (Cant: {item.quantity})
                    {item.return_request && (
                      <span className="return-badge status-pending" style={{ marginLeft: '8px', fontSize: '10px', background: '#333', padding: '2px 6px', borderRadius: '4px' }}>
                        Devolución: {item.return_request.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="order-actions">
                <button className="btn-select-order" onClick={() => setSelectedSale(order)}>
                  Gestionar Devolución
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
