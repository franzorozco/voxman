import React, { useState } from "react";
import { X, Package, Tag, DollarSign, Activity, Link as LinkIcon, Info, Users, ArrowUpRight, BarChart3, Image as ImageIcon } from "lucide-react";
import { API_BASE_URL } from "../../../../config/api";
import "./Products.css";

export default function ProductViewModal({ product, onClose }) {
  if (!product) return null;

  const [activeTab, setActiveTab] = useState("general");

  // Determine Product primary image
  const primaryImage = product.product_images?.find(img => img.is_primary)?.image_url 
    || product.product_images?.[0]?.image_url;

  const getImageUrl = (url) => {
    if (!url) return `${API_BASE_URL}/storage/product_images/default.png`;
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
  };

  const formatMoney = (value) => {
    const num = Number(value || 0);
    return `Bs ${num.toLocaleString("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const calculateFinalPrice = () => {
    // If it has active discount, we can calculate. But simple base_price for now.
    return product.base_price;
  };

  // Get owner name
  const ownerName = product.owner?.user?.profile
    ? `${product.owner.user.profile.first_name || ''} ${product.owner.user.profile.last_name_paternal || ''}`.trim()
    : product.owner?.user?.email || "Sin propietario";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--bg-overlay)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <img 
                src={getImageUrl(primaryImage)} 
                alt={product.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => e.target.src = `${API_BASE_URL}/storage/product_images/default.png`}
              />
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', color: 'var(--text-main)', fontWeight: '700' }}>{product.name}</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>SKU: {product.sku || 'N/A'}</span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-color)' }}></span>
                <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`} style={{ padding: '2px 8px', fontSize: '11px' }}>
                  {product.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '24px', padding: '0 32px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <button 
            onClick={() => setActiveTab('general')}
            style={{ 
              padding: '16px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
              color: activeTab === 'general' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'general' ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: '0.2s'
            }}
          >
            Información General
          </button>
          <button 
            onClick={() => setActiveTab('variants')}
            style={{ 
              padding: '16px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
              color: activeTab === 'variants' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'variants' ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: '0.2s'
            }}
          >
            Variantes e Inventario ({product.product_variants?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('images')}
            style={{ 
              padding: '16px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
              color: activeTab === 'images' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'images' ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: '0.2s'
            }}
          >
            Galería ({product.product_images?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div className="modal-content" style={{ padding: '32px', overflowY: 'auto', flex: '1', background: 'var(--bg-main)' }}>
          
          {activeTab === 'general' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-main)' }}>
                    <Info size={18} color="var(--color-primary)" /> Detalles del Producto
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Categoría</p>
                      <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)' }}>{product.category?.name || 'Sin categoría'}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Tipo de Producto</p>
                      <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)' }}>{product.product_type?.name || 'Estándar'}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Marca</p>
                      <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)' }}>{product.brand || '-'}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Propietario / Dueño</p>
                      <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)' }}>{ownerName}</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Descripción Corta</p>
                      <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: '1.5' }}>{product.short_description || 'Sin descripción'}</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Descripción Larga</p>
                      <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{product.long_description || 'Sin descripción'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-main)' }}>
                    <DollarSign size={18} color="var(--color-primary)" /> Finanzas y Precios
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Precio Base</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '16px' }}>{formatMoney(product.base_price)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Costo</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{formatMoney(product.cost_price)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Margen (Beneficio)</span>
                      <span style={{ fontWeight: '600', color: 'var(--color-success)' }}>
                        {formatMoney(product.base_price - product.cost_price)}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-main)' }}>
                    <BarChart3 size={18} color="var(--color-primary)" /> Métricas
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Vistas Totales</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{product.view_count || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Total de Variantes</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{product.product_variants?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'variants' && (
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              {product.product_variants?.length > 0 ? (
                <table className="products-table" style={{ width: '100%', border: 'none', borderRadius: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ background: 'var(--bg-overlay)' }}>Variante (SKU)</th>
                      <th style={{ background: 'var(--bg-overlay)' }}>Atributos</th>
                      <th style={{ background: 'var(--bg-overlay)' }}>Precio Final</th>
                      <th style={{ background: 'var(--bg-overlay)' }}>Stock Total</th>
                      <th style={{ background: 'var(--bg-overlay)' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.product_variants.map((variant) => {
                      const totalStock = variant.inventories?.reduce((acc, inv) => acc + (inv.quantity || 0), 0) || 0;
                      return (
                        <tr key={variant.id}>
                          <td style={{ fontWeight: '500' }}>
                            {variant.sku}
                            {variant.barcode && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cód: {variant.barcode}</div>}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {variant.variant_attribute_values?.map(vav => (
                                <span key={vav.id} style={{ background: 'var(--bg-overlay)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                                  {vav.attribute_value?.value}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>{formatMoney(variant.specific_price || product.base_price)}</td>
                          <td>
                            <span style={{ color: totalStock > 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: '600' }}>
                              {totalStock} unid.
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${variant.is_active ? 'active' : 'inactive'}`} style={{ padding: '2px 8px', fontSize: '11px' }}>
                              {variant.is_active ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Este producto no tiene variantes registradas.
                </div>
              )}
            </div>
          )}

          {activeTab === 'images' && (
            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              {product.product_images?.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                  {product.product_images.map((img) => (
                    <div key={img.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: img.is_primary ? '2px solid var(--color-primary)' : '1px solid var(--border-color)', aspectRatio: '1' }}>
                      <img 
                        src={getImageUrl(img.image_url)} 
                        alt="Product Image" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {img.is_primary && (
                        <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'var(--color-primary)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                          Principal
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Este producto no tiene imágenes adicionales.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="modal-actions" style={{ background: 'var(--bg-card)', padding: '24px 32px' }}>
          <button className="btn-secondary" onClick={onClose} style={{ minWidth: '120px' }}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
