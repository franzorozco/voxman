import { useState, useEffect } from "react";
import { X, ShoppingBag, CreditCard, ChevronDown, ChevronUp, Clock, Store, User as UserIcon, Truck, MapPin, Calendar, Package, CalendarClock, Phone } from "lucide-react";
import { getGuestHistory } from "../../../../api/admin/guests";
import Spinner from "../../components/Spinner/Spinner";

export default function GuestDetails({ guestId, onClose }) {
  const [guest, setGuest] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSales, setExpandedSales] = useState({});

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await getGuestHistory(guestId);
        setGuest(res.data.guest);
        setSales(res.data.sales);
      } catch (error) {
        console.error("Error fetching guest details", error);
      } finally {
        setLoading(false);
      }
    };
    if (guestId) {
      fetchHistory();
    }
  }, [guestId]);

  const toggleSale = (id) => {
    setExpandedSales(prev => ({ ...prev, [id]: !prev[id] }));
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

  if (loading || !guest) {
    return (
      <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
        <Spinner size={40} color="var(--color-primary)" />
      </div>
    );
  }

  const totalCompras = sales.length;
  const totalGastado = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
      <div className="modal-content" style={{ background: 'var(--bg-main)', borderRadius: '24px', width: '100%', maxWidth: '1100px', height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 40px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800 }}>
              {guest.name || 'Invitado'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ padding: '4px 10px', background: 'var(--bg-overlay)', borderRadius: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Invitado (Delivery)</span>
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}>
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Stats Row */}
        <div className="customer-modal-grid-3 customer-modal-container" style={{ padding: '30px 40px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main)', display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s' }}>
            <div style={{ background: 'var(--bg-overlay)', padding: '14px', borderRadius: '14px', color: 'var(--color-primary)' }}>
              <ShoppingBag size={26} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Total Compras</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>{totalCompras}</h3>
            </div>
          </div>
          
          <div style={{ flex: 1, background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s' }}>
            <div style={{ background: 'var(--bg-overlay)', padding: '14px', borderRadius: '14px', color: 'var(--color-success)' }}>
              <CreditCard size={26} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Total Gastado</p>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>Bs. {totalGastado.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="customer-modal-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          {[
            { id: 'overview', label: 'Resumen' },
            { id: 'sales', label: `Compras (${sales.length})` }
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
        <div className="customer-modal-container" style={{ flex: 1, overflowY: 'auto', padding: '30px 40px', background: 'var(--bg-main)' }}>
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="fade-in">
               <h3 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserIcon size={20} color="var(--color-primary)"/> Perfil de Invitado
               </h3>
               <div className="customer-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                     <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Información Personal</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                           <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nombre</label>
                           <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{guest.name}</div>
                        </div>
                        <div>
                           <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Teléfono / WhatsApp</label>
                           <div style={{ fontSize: '16px', color: 'var(--text-main)' }}>{guest.whatsapp_phone || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No registrado</span>}</div>
                        </div>
                     </div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                     <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Estadísticas</h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                           <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Primera vez visto</label>
                           <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{new Date(guest.created_at).toLocaleString()}</div>
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

              {sales.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sales.map(sale => {
                    const isExpanded = expandedSales[sale.id];
                    const shipment = sale.shipments?.length > 0 ? sale.shipments[0] : sale.shipment;
                    
                    return (
                      <div key={sale.id} style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', transition: 'all 0.3s' }}>
                        {/* Sale Header (Clickable) */}
                        <div 
                          onClick={() => toggleSale(sale.id)}
                          style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'var(--bg-overlay)' : 'transparent', flexWrap: 'wrap', gap: '16px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ background: 'var(--bg-overlay)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }}>
                              <ShoppingBag size={20} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '16px' }}>Factura {sale.invoice_number || `#${sale.id.split('-')[0]}`}</span>
                                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-overlay)', color: sale.status === 'paid' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                  {sale.status.toUpperCase()}
                                </span>
                                {shipment && (
                                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-overlay)', color: 'var(--color-primary)' }}>
                                    ENTREGA: {shipment.status.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <span><Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }}/> {new Date(sale.created_at).toLocaleString()}</span>
                                <span><Store size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }}/> {sale.branch?.name || 'Tienda Principal'}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Pagado</div>
                              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '18px' }}>Bs. {Number((sale.dynamic_total || sale.total)).toFixed(2)}</div>
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          </div>
                        </div>

                        {/* Sale Details (Expanded) */}
                        {isExpanded && (
                          <div style={{ borderTop: '1px solid var(--border-color)', padding: '24px', background: 'var(--bg-main)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
                              
                              {/* LEFT COLUMN */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Detalle de Productos */}
                                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Package size={16} /> Detalle de Productos
                                  </h3>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {sale.sale_details?.map(item => {
                                      const variant = item.product_variant;
                                      const product = variant?.product;

                                      return (
                                        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', paddingBottom: '12px', borderBottom: '1px dashed var(--border-color)' }}>
                                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                                {item.quantity}x {product?.name || 'Producto'}
                                              </div>
                                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                                                {variant?.sku && <span>SKU: {variant.sku}</span>}
                                                {variant?.size?.name && <span>• Talla: {variant.size.name}</span>}
                                                {variant?.fit?.name && <span>• Fit: {variant.fit.name}</span>}
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                            <div style={{ color: 'var(--text-muted)' }}>
                                              {item.quantity}x Bs. {Number(item.unit_price).toFixed(2)} 
                                            </div>
                                            <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              {Number(item.discount) > 0 && <span style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: 500 }}>(-Bs. {Number(item.discount).toFixed(2)})</span>}
                                              Bs. {Number(item.final_price).toFixed(2)}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {/* Resumen Totales */}
                                    <div style={{ paddingTop: '8px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                        <span>Subtotal:</span>
                                        <span>Bs. {Number((sale.dynamic_subtotal || sale.subtotal)).toFixed(2)}</span>
                                      </div>
                                      {shipment && shipment.delivery_type === 'external' && Number(shipment.agency_dispatch_cost || 0) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                          <span>Costo de Envío a Agencia:</span>
                                          <span>Bs. {Number(shipment.agency_dispatch_cost).toFixed(2)}</span>
                                        </div>
                                      )}
                                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid var(--border-color)', fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>
                                        <span>{sale.status === 'paid' ? 'TOTAL PAGADO:' : 'TOTAL A PAGAR:'}</span>
                                        <span>Bs. {Number((sale.dynamic_total || sale.total)).toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Notas de Entrega */}
                                {shipment && shipment.notes && (
                                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Store size={16} /> Notas de Entrega
                                    </h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-wrap' }}>
                                      {shipment.notes}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* RIGHT COLUMN */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {shipment ? (
                                  <>
                                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                                      <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Truck size={16} /> Estado y Repartidor
                                      </h3>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
                                          <span style={{ fontWeight: 600, color: getStatusColor(shipment.status) }}>
                                            {getStatusLabel(shipment.status)?.toUpperCase()}
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <span style={{ color: 'var(--text-muted)' }}>Repartidor:</span>
                                          <span style={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-word', paddingLeft: '12px' }}>
                                            {shipment.delivery_schedule?.driver ? `${shipment.delivery_schedule.driver.user?.profile?.first_name || ''} ${shipment.delivery_schedule.driver.user?.profile?.last_name_paternal || ''} ${shipment.delivery_schedule.driver.user?.profile?.last_name_maternal || ''}`.trim() || 'Sin Nombre' : 'Sin Asignar'}
                                          </span>
                                        </div>
                                        {shipment.delivery_schedule?.driver && (
                                          <>
                                            {shipment.delivery_schedule.driver.user?.employee?.employee_code && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Cód. Empleado:</span>
                                                <span style={{ fontWeight: 500 }}>{shipment.delivery_schedule.driver.user.employee.employee_code}</span>
                                              </div>
                                            )}
                                            {(shipment.delivery_schedule.driver.phone || shipment.delivery_schedule.driver.user?.profile?.whatsapp_number || shipment.delivery_schedule.driver.user?.profile?.phone) && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>WhatsApp / Tel:</span>
                                                <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                  <Phone size={12} /> {shipment.delivery_schedule.driver.phone || shipment.delivery_schedule.driver.user?.profile?.whatsapp_number || shipment.delivery_schedule.driver.user?.profile?.phone}
                                                </span>
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                      
                                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                                      <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CalendarClock size={16} /> Horario y Lugar
                                      </h3>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-main)' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                          <CalendarClock size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                                          <div>
                                            <div style={{ fontWeight: 500 }}>{shipment.delivery_schedule?.scheduled_date ? new Date(shipment.delivery_schedule.scheduled_date).toLocaleDateString() : 'Pendiente'}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{shipment.delivery_schedule?.time_window || 'Hora a convenir'}</div>
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                          <MapPin size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                                          <div>
                                            <div style={{ fontWeight: 500 }}>
                                              {shipment.delivery_type === 'home_delivery' && shipment.address 
                                                ? `${shipment.address.street}, ${shipment.address.zone}` 
                                                : (shipment.delivery_schedule?.meeting_point || shipment.destination_city || 'Punto de Encuentro')}
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                              {shipment.delivery_type === 'home_delivery' ? 'A Domicilio' : 
                                               shipment.delivery_type === 'external' ? 'Envío Nacional' : 
                                               shipment.delivery_type === 'manual' ? 'Entrega Manual' : 
                                               'Punto de Encuentro'}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {(shipment.recipient_name || shipment.recipient_phone || shipment.recipient_ci) && (
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                              <UserIcon size={14} /> Persona que Recibe
                                            </h4>
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                            {shipment.recipient_name && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Nombre:</span>
                                                <span style={{ fontWeight: 500 }}>{shipment.recipient_name}</span>
                                              </div>
                                            )}
                                            {shipment.recipient_ci && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>CI:</span>
                                                <span style={{ fontWeight: 500 }}>{shipment.recipient_ci}</span>
                                              </div>
                                            )}
                                            {shipment.recipient_phone && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Teléfono:</span>
                                                <span style={{ fontWeight: 500 }}>{shipment.recipient_phone}</span>
                                              </div>
                                            )}
                                            {shipment.destination_city && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Destino:</span>
                                                <span style={{ fontWeight: 500 }}>{shipment.destination_city}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                      
                                      {(shipment.external_company || shipment.external_guide) && (
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                                          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Package size={14} /> Información de Transportadora
                                          </h4>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                            {shipment.shipping_payment_type === 'collect' && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Costo de Envío:</span>
                                                <span style={{ fontWeight: 500, color: 'var(--color-warning)' }}>Por pagar en destino</span>
                                              </div>
                                            )}
                                            {shipment.shipping_payment_type === 'paid' && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Costo de Envío:</span>
                                                <span style={{ fontWeight: 500, color: 'var(--color-success)' }}>Pagado (Bs. {Number(shipment.shipping_cost).toFixed(2)})</span>
                                              </div>
                                            )}
                                            {shipment.external_company && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Empresa:</span>
                                                <span style={{ fontWeight: 500 }}>{shipment.external_company}</span>
                                              </div>
                                            )}
                                            {shipment.external_guide && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>N° Guía / Rastreo:</span>
                                                <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{shipment.external_guide}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Tracking updates */}
                                      {shipment.delivery_type === 'external' && shipment.tracking_history && shipment.tracking_history.length > 0 && (
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '12px' }}>Historial de Seguimiento</div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {shipment.tracking_history.map((update, i) => (
                                              <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                                                <div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                  {new Date(update.timestamp || update.created_at).toLocaleString()}
                                                </div>
                                                <div style={{ color: 'var(--text-main)' }}>
                                                  {update.description || update.status}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                                    No hay información de entrega asociada a esta compra.
                                  </div>
                                )}
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
                  <p>Este invitado aún no tiene historial de compras.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
