import { useState, useEffect } from "react";
import { X, MapPin, ShoppingBag, Gift, Ticket, Award, CreditCard, ChevronRight } from "lucide-react";
import { getCustomerById } from "../../../../api/admin/customers";
import Spinner from "../../components/Spinner/Spinner";

export default function CustomerDetails({ customerId, onClose }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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
    if (customerId) fetchCustomer();
  }, [customerId]);

  if (loading || !customer) {
    return (
      <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
        <Spinner size={40} color="var(--primary-color)" />
      </div>
    );
  }

  const profile = customer.user?.profile || {};
  const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''}`.trim() || 'Sin Nombre';

  return (
    <div className="modal-overlay fade-in" style={{ display: 'flex', justifyContent: 'flex-end', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
      <div style={{ background: 'var(--bg-main)', width: '100%', maxWidth: '800px', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', animation: 'slideInRight 0.3s ease' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-card)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                {fullName}
              </h2>
              <span style={{ fontWeight: 600, letterSpacing: '1px', background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                {customer.customer_code}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <span>{customer.user?.email || 'S/E'}</span>
              {profile.phone && <span>• {profile.phone}</span>}
              <span>• Creado: {new Date(customer.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-overlay)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '24px 30px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}>
              <ShoppingBag size={24} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Compras</p>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{customer.sales?.length || 0}</h3>
            </div>
          </div>
          
          <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', color: '#10b981' }}>
              <CreditCard size={24} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Gastado</p>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>${Number(customer.total_purchases).toFixed(2)}</h3>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px', color: '#f59e0b' }}>
              <Award size={24} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Puntos VIP</p>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{customer.points}</h3>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 30px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          {['overview', 'sales', 'addresses', 'discounts', 'giftcards'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '16px 24px',
                color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-muted)',
                fontWeight: activeTab === tab ? 600 : 500,
                borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'overview' ? 'Resumen' : tab === 'sales' ? 'Ventas' : tab === 'addresses' ? 'Direcciones' : tab === 'discounts' ? 'Cupones' : 'Giftcards'}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
          
          {activeTab === 'sales' && (
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-main)' }}>Historial de Ventas</h3>
              {customer.sales?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {customer.sales.map(sale => (
                    <div key={sale.id} style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Venta #{sale.receipt_number || sale.id.split('-')[0]}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(sale.created_at).toLocaleString()} • {sale.source?.toUpperCase()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '16px' }}>${Number(sale.total).toFixed(2)}</div>
                        <span className={`status-badge status-${sale.status === 'completed' ? 'active' : 'inactive'}`} style={{ fontSize: '11px', marginTop: '4px', display: 'inline-block' }}>
                          {sale.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>El cliente no ha realizado compras aún.</p>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-main)' }}>Libreta de Direcciones</h3>
              {customer.addresses?.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {customer.addresses.map(addr => (
                    <div key={addr.id} style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
                      <MapPin style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>{addr.address_type?.toUpperCase()}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          {addr.street} {addr.city ? `, ${addr.city}` : ''} {addr.state ? `, ${addr.state}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No hay direcciones guardadas.</p>
              )}
            </div>
          )}

          {activeTab === 'discounts' && (
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-main)' }}>Cupones & Descuentos Disponibles</h3>
              {customer.discounts?.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {customer.discounts.map(disc => (
                    <div key={disc.id} style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', gap: '12px' }}>
                      <Ticket style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>{disc.name}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                          {disc.type === 'percentage' ? `${disc.value}% OFF` : `$${disc.value} OFF`}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Código: {disc.code || 'Automático'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No tiene cupones especiales asignados.</p>
              )}
            </div>
          )}

          {activeTab === 'giftcards' && (
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-main)' }}>Giftcards Recibidas</h3>
              {customer.received_giftcards?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                  {customer.received_giftcards.map(gc => (
                    <div key={gc.id} style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Gift style={{ color: '#3b82f6' }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', letterSpacing: '2px' }}>{gc.code}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Balance Original: ${gc.initial_balance}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#3b82f6', fontSize: '18px' }}>${gc.current_balance}</div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Disponible</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>No ha recibido ninguna Giftcard.</p>
              )}

              <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-main)' }}>Giftcards Compradas (Regaladas a otros)</h3>
              {customer.purchased_giftcards?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {customer.purchased_giftcards.map(gc => (
                    <div key={gc.id} style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>Giftcard enviada</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Código: {gc.code}</div>
                      </div>
                      <div style={{ fontWeight: 600 }}>${gc.initial_balance}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No ha comprado Giftcards para regalar.</p>
              )}
            </div>
          )}

          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Resumen de Actividad</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Última Compra</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                      {customer.sales?.length > 0 ? new Date(customer.sales[0].created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Items en Wishlist</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{customer.wishlists?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
