import React from 'react';
import { X, Package, DollarSign, Target, CheckCircle2, AlertCircle, TrendingDown, Image as ImageIcon, Users, PieChart, Tag, Hash, Building2 } from 'lucide-react';
import { API_BASE_URL } from '../../../../config/api';

export default function BundleViewModal({ bundle, onClose }) {
  if (!bundle) return null;

  const DEFAULT_IMAGE = `${API_BASE_URL}/storage/product_images/default.png`;

  const getImageUrl = (url) => {
    if (!url) return DEFAULT_IMAGE;
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
  };

  const mainImage = getImageUrl(
    bundle.product_images?.find(img => img.is_main)?.url || 
    bundle.product_images?.[0]?.url
  );

  const basePrice = parseFloat(bundle.base_price || 0);
  
  const totalRegularValue = (bundle.bundle_items || []).reduce((acc, item) => {
    let price = 0;
    if (item.variant) {
      price = parseFloat(item.variant.price || item.product?.base_price || 0);
    } else if (item.product) {
      price = parseFloat(item.product.base_price || 0);
    }
    return acc + (price * item.quantity);
  }, 0);

  const enrichedItems = (bundle.bundle_items || []).map(item => {
    let price = 0;
    let cost = 0;
    let ownerProfile = item.product?.owner?.user?.profile || item.variant?.product?.owner?.user?.profile;
    let owner = ownerProfile ? `${ownerProfile.first_name || ''} ${ownerProfile.last_name_paternal || ''}`.trim() : "Sin Socio";

    if (item.variant) {
      price = parseFloat(item.variant.price || item.product?.base_price || 0);
      cost = parseFloat(item.variant.cost || 0);
    } else if (item.product) {
      price = parseFloat(item.product.base_price || 0);
      cost = parseFloat(item.product.product_variants?.[0]?.cost || 0);
    }

    const itemRegularValue = price * item.quantity;
    const proportion = totalRegularValue > 0 ? (itemRegularValue / totalRegularValue) : 0;
    
    const assignedRevenue = basePrice * proportion;
    const totalCost = cost * item.quantity;
    const profit = assignedRevenue - totalCost;

    return {
      ...item,
      owner,
      unitPrice: price,
      unitCost: cost,
      itemRegularValue,
      proportion,
      assignedRevenue,
      totalCost,
      profit
    };
  });

  const ownerDistribution = Object.entries(enrichedItems.reduce((acc, item) => {
    if (!acc[item.owner]) acc[item.owner] = { revenue: 0, cost: 0, profit: 0 };
    acc[item.owner].revenue += item.assignedRevenue;
    acc[item.owner].cost += item.totalCost;
    acc[item.owner].profit += item.profit;
    return acc;
  }, {})).map(([ownerName, data]) => ({ name: ownerName, ...data }));

  // Render status badge
  const StatusBadge = () => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
      background: bundle.is_active ? 'var(--color-success-alpha)' : 'var(--color-danger-alpha)',
      color: bundle.is_active ? 'var(--color-success)' : 'var(--color-danger)'
    }}>
      {bundle.is_active ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {bundle.is_active ? 'Activo' : 'Inactivo'}
    </span>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content view-modal" style={{ maxWidth: '800px', width: '90%', padding: '0', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img 
                src={mainImage} 
                alt={bundle.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE; }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: 'var(--text-main)' }}>{bundle.name}</h2>
                <StatusBadge />
              </div>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                {bundle.category?.name || 'Sin categoría'}
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-main)' }}>
                  <Package size={14} color="var(--color-primary)" />
                  <b>{bundle.virtualStock || 0}</b> posibles (Stock Virtual)
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', background: 'var(--bg-body)', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {/* KPI Cards */}
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <DollarSign size={16} /> <span style={{ fontSize: '13px' }}>Precio del Conjunto</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
                Bs. {parseFloat(bundle.base_price || 0).toFixed(2)}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <Target size={16} /> <span style={{ fontSize: '13px' }}>Precio Regular (Por separado)</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                Bs. {(bundle.regularPrice || 0).toFixed(2)}
              </div>
            </div>

            <div style={{ background: 'var(--color-success-alpha)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', marginBottom: '8px' }}>
                <TrendingDown size={16} /> <span style={{ fontSize: '13px' }}>Ahorro del Cliente</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-success)' }}>
                Bs. {(bundle.savings || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} color="var(--color-primary)" /> Ítems del Conjunto
            </h3>
            
            {enrichedItems.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Este conjunto no tiene ítems asignados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {enrichedItems.map((item, idx) => {
                  let itemName = "";
                  let itemType = "";
                  let itemImg = null;
                  let sku = "";
                  let attributesText = "";

                  if (item.variant_id && item.variant) {
                    const size = item.variant.size?.name || '';
                    const color = item.variant.variant_attribute_values?.[0]?.attribute_value?.value || '';
                    itemName = item.product?.name || 'Producto';
                    attributesText = [size, color].filter(Boolean).join(" - ");
                    itemType = "Variante";
                    sku = item.variant.sku || "N/A";
                    
                    const colorId = item.variant.variant_attribute_values?.[0]?.attribute_value_id;
                    const avi = item.product?.attribute_value_images?.find(img => img.attribute_value_id === colorId);
                    itemImg = item.variant.variant_images?.[0]?.url || avi?.url || item.product?.product_images?.find(img => img.is_main)?.url || item.product?.product_images?.[0]?.url;
                  } else if (item.product) {
                    itemName = item.product.name;
                    itemType = "Producto Base";
                    sku = item.product.sku || item.product.code || "N/A";
                    attributesText = "General";
                    itemImg = item.product.product_images?.find(img => img.is_main)?.url || item.product.product_images?.[0]?.url;
                  } else {
                    itemName = "Producto no encontrado";
                  }

                  const imgSrc = getImageUrl(itemImg);

                  return (
                    <div key={item.id || idx} style={{ display: 'flex', flexDirection: 'column', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-overlay)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                          <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                            <img 
                              src={imgSrc} 
                              alt="item" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE; }}
                            />
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px', marginBottom: '4px' }}>{itemName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={12} /> {item.owner}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Hash size={12} /> {sku}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Tag size={12} /> {attributesText}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ fontWeight: '600', color: 'var(--color-primary)', background: 'var(--color-primary-alpha)', padding: '6px 14px', borderRadius: '20px', fontSize: '14px' }}>
                          Cantidad: {item.quantity}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Precio Reg. Total</p>
                          <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>Bs. {item.itemRegularValue.toFixed(2)}</div>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingreso Asignado ({(item.proportion * 100).toFixed(1)}%)</p>
                          <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>Bs. {item.assignedRevenue.toFixed(2)}</div>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Costo Total</p>
                          <div style={{ fontWeight: '600', color: 'var(--color-danger)' }}>Bs. {item.totalCost.toFixed(2)}</div>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ganancia Neta</p>
                          <div style={{ fontWeight: '700', color: item.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>Bs. {item.profit.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Liquidación por Socio */}
          {ownerDistribution.length > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px', marginTop: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} color="var(--color-success)" /> Liquidación por Socio (Por 1 Conjunto Vendido)
              </h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 8px' }}>Socio</th>
                      <th style={{ padding: '12px 8px' }}>Ingreso Bruto</th>
                      <th style={{ padding: '12px 8px' }}>Costo Total</th>
                      <th style={{ padding: '12px 8px' }}>Ganancia Real</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerDistribution.map((owner, idx) => (
                      <tr key={idx} style={{ borderBottom: idx === ownerDistribution.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 8px', fontWeight: '500', color: 'var(--text-main)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} color="var(--text-muted)" /> {owner.name}</span>
                        </td>
                        <td style={{ padding: '14px 8px', fontWeight: '600', color: 'var(--color-primary)' }}>Bs. {owner.revenue.toFixed(2)}</td>
                        <td style={{ padding: '14px 8px', fontWeight: '600', color: 'var(--color-danger)' }}>Bs. {owner.cost.toFixed(2)}</td>
                        <td style={{ padding: '14px 8px', fontWeight: '700', color: owner.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>Bs. {owner.profit.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
