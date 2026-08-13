import React from 'react';
import { X, Package, DollarSign, Target, CheckCircle2, AlertCircle, TrendingDown, Users, PieChart, Tag, Hash, Building2 } from 'lucide-react';
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

  const StatusBadge = () => (
    <span className={`bvm-status-badge ${bundle.is_active ? 'status-active' : 'status-inactive'}`}>
      {bundle.is_active ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
      {bundle.is_active ? 'Activo' : 'Inactivo'}
    </span>
  );

  return (
    <div className="modal-overlay bundle-modal-overlay">
      <div className="bundle-view-modal bvm-container">
        
        {/* Header - Image side by side with name */}
        <div className="bvm-header">
          <div className="bvm-header-info">
            <div className="bvm-header-img">
              <img 
                src={mainImage} 
                alt={bundle.name} 
                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE; }}
              />
            </div>
            <div className="bvm-header-text">
              <div className="bvm-name-row">
                <h2 className="bvm-name">{bundle.name}</h2>
                <StatusBadge />
              </div>
              <p className="bvm-category">{bundle.category?.name || 'Sin categoría'}</p>
              <span className="bvm-stock-badge">
                <Package size={13} color="var(--color-primary)" />
                <b>{bundle.virtualStock || 0}</b> posibles (Stock Virtual)
              </span>
            </div>
          </div>
          <button className="bvm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="bvm-body">
          
          {/* KPI Cards */}
          <div className="bvm-kpi-grid">
            <div className="bvm-kpi-card">
              <div className="bvm-kpi-label">
                <DollarSign size={15} /> Precio del Conjunto
              </div>
              <div className="bvm-kpi-value">Bs. {parseFloat(bundle.base_price || 0).toFixed(2)}</div>
            </div>

            <div className="bvm-kpi-card">
              <div className="bvm-kpi-label">
                <Target size={15} /> Precio Regular
              </div>
              <div className="bvm-kpi-value bvm-val-regular">
                Bs. {(bundle.regularPrice || 0).toFixed(2)}
              </div>
            </div>

            <div className="bvm-kpi-card bvm-kpi-savings">
              <div className="bvm-kpi-label bvm-val-success">
                <TrendingDown size={15} /> Ahorro del Cliente
              </div>
              <div className="bvm-kpi-value bvm-val-success">
                Bs. {(bundle.savings || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Items Section - No wrapper border */}
          <h3 className="bvm-section-title">
            <Package size={17} color="var(--color-primary)" /> Ítems del Conjunto
          </h3>
          
          {enrichedItems.length === 0 ? (
            <p className="bvm-empty-msg">Este conjunto no tiene ítems asignados.</p>
          ) : (
            <div className="bvm-items-list">
              {enrichedItems.map((item, idx) => {
                let itemName = "";
                let sku = "";
                let attributesText = "";
                let itemImg = null;

                if (item.variant_id && item.variant) {
                  const size = item.variant.size?.name || '';
                  const fit = item.variant.fit?.name || '';
                  const otherAttrs = (item.variant.variant_attribute_values || []).map(val => val.attribute_value?.value).filter(Boolean);
                  itemName = item.product?.name || 'Producto';
                  attributesText = [fit, size, ...otherAttrs].filter(Boolean).join(" · ");
                  sku = item.variant.sku || "N/A";
                  
                  const colorId = item.variant.variant_attribute_values?.[0]?.attribute_value_id;
                  const avi = item.product?.attribute_value_images?.find(img => img.attribute_value_id === colorId);
                  itemImg = item.variant.variant_images?.[0]?.url || avi?.url || item.product?.product_images?.find(img => img.is_main)?.url || item.product?.product_images?.[0]?.url;
                } else if (item.product) {
                  itemName = item.product.name;
                  sku = item.product.sku || item.product.code || "N/A";
                  attributesText = "General";
                  itemImg = item.product.product_images?.find(img => img.is_main)?.url || item.product.product_images?.[0]?.url;
                } else {
                  itemName = "Producto no encontrado";
                }

                const imgSrc = getImageUrl(itemImg);

                return (
                  <div key={item.id || idx} className="bvm-item-card">
                    {/* Item top row: image + info + quantity */}
                    <div className="bvm-item-top">
                      <div className="bvm-item-img">
                        <img 
                          src={imgSrc} 
                          alt="item" 
                          onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE; }}
                        />
                      </div>
                      <div className="bvm-item-info">
                        <div className="bvm-item-name">{itemName}</div>
                        <div className="bvm-item-meta">
                          <span><Building2 size={11} /> {item.owner}</span>
                          <span><Hash size={11} /> {sku}</span>
                          {attributesText && <span><Tag size={11} /> {attributesText}</span>}
                        </div>
                      </div>
                      <div className="bvm-item-qty-badge">×{item.quantity}</div>
                    </div>

                    {/* Item financials grid */}
                    <div className="bvm-item-financials">
                      <div>
                        <span className="bvm-fin-label">Precio Reg. Total</span>
                        <span className="bvm-fin-value">Bs. {item.itemRegularValue.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="bvm-fin-label">Ingreso ({(item.proportion * 100).toFixed(1)}%)</span>
                        <span className="bvm-fin-value bvm-fin-primary">Bs. {item.assignedRevenue.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="bvm-fin-label">Costo Total</span>
                        <span className="bvm-fin-value bvm-fin-danger">Bs. {item.totalCost.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="bvm-fin-label">Ganancia</span>
                        <span className={`bvm-fin-value-bold ${item.profit >= 0 ? 'text-success' : 'text-danger'}`}>Bs. {item.profit.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Liquidación por Socio */}
          {ownerDistribution.length > 0 && (
            <div className="bvm-settlement-section">
              <h3 className="bvm-section-title">
                <PieChart size={17} color="var(--color-success)" /> Liquidación por Socio
              </h3>
              
              {/* Desktop table */}
              <div className="bvm-settlement-table-wrap">
                <table className="bvm-settlement-table">
                  <thead>
                    <tr>
                      <th>Socio</th>
                      <th>Ingreso Bruto</th>
                      <th>Costo Total</th>
                      <th>Ganancia Real</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerDistribution.map((owner, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="bvm-owner-cell"><Users size={14} className="text-muted" /> {owner.name}</span>
                        </td>
                        <td className="bvm-td-primary">Bs. {owner.revenue.toFixed(2)}</td>
                        <td className="bvm-td-danger">Bs. {owner.cost.toFixed(2)}</td>
                        <td className={`bvm-td-bold ${owner.profit >= 0 ? 'text-success' : 'text-danger'}`}>Bs. {owner.profit.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="bvm-settlement-cards">
                {ownerDistribution.map((owner, idx) => (
                  <div key={idx} className="bvm-settlement-card">
                    <div className="bvm-settlement-card-name">
                      <Users size={14} color="var(--text-muted)" /> {owner.name}
                    </div>
                    <div className="bvm-settlement-card-grid">
                      <div>
                        <span className="bvm-fin-label">Ingreso</span>
                        <span className="bvm-fin-value bvm-fin-primary">Bs. {owner.revenue.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="bvm-fin-label">Costo</span>
                        <span className="bvm-fin-value bvm-fin-danger">Bs. {owner.cost.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="bvm-fin-label">Ganancia</span>
                        <span className={`bvm-fin-value-bold ${owner.profit >= 0 ? 'text-success' : 'text-danger'}`}>Bs. {owner.profit.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
