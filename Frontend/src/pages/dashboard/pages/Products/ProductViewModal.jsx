import React, { useState } from "react";
import { X, Package, Tag, DollarSign, Activity, Link as LinkIcon, Info, Users, ArrowUpRight, BarChart3, Image as ImageIcon } from "lucide-react";
import { API_BASE_URL } from "../../../../config/api";
import "./Products.css";

export default function ProductViewModal({ product, onClose }) {
  if (!product) return null;

  const [activeTab, setActiveTab] = useState("general");

  const getImageUrl = (url) => {
    if (!url) return `${API_BASE_URL}/storage/product_images/default.png`;
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
  };

  // Determine Product primary image
  const primaryImage = product.product_images?.find(img => img.is_primary)?.image_url 
    || product.product_images?.[0]?.image_url;

  const formatMoney = (value) => {
    const num = Number(value || 0);
    return `Bs ${num.toLocaleString("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calculate Prices and Costs from variants
  let minPrice = Number(product.base_price || 0);
  let maxPrice = Number(product.base_price || 0);
  let minCost = 0;
  let maxCost = 0;

  if (product.product_variants && product.product_variants.length > 0) {
    const prices = product.product_variants.map(v => Number(v.price || product.base_price));
    const costs = product.product_variants.map(v => Number(v.cost || 0));
    
    minPrice = Math.min(...prices);
    maxPrice = Math.max(...prices);
    minCost = Math.min(...costs);
    maxCost = Math.max(...costs);
  }

  // Calculate total stock across all variants
  const globalStock = product.product_variants?.reduce((total, v) => {
    return total + (v.inventories?.reduce((acc, inv) => acc + (inv.stock || inv.quantity || 0), 0) || 0);
  }, 0) || 0;

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
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>SKU Base: {product.sku || 'N/A'}</span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-color)' }}></span>
                <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`} style={{ padding: '2px 8px', fontSize: '11px' }}>
                  {product.is_active ? 'Activo' : 'Inactivo'}
                </span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-color)' }}></span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Stock Total: {globalStock} u.</span>
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
            Galería y Colores
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
                    <DollarSign size={18} color="var(--color-primary)" /> Finanzas (Rango de Variantes)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Precio de Venta</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>
                        {minPrice === maxPrice ? formatMoney(minPrice) : `${formatMoney(minPrice)} - ${formatMoney(maxPrice)}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Costo</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>
                        {minCost === maxCost ? formatMoney(minCost) : `${formatMoney(minCost)} - ${formatMoney(maxCost)}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Margen de Beneficio</span>
                      <span style={{ fontWeight: '600', color: 'var(--color-success)', fontSize: '15px' }}>
                        {minPrice - minCost === maxPrice - maxCost 
                          ? formatMoney(minPrice - minCost) 
                          : `${formatMoney(minPrice - minCost)} - ${formatMoney(maxPrice - maxCost)}`}
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
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{product.views || product.view_count || 0}</span>
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
                      <th style={{ background: 'var(--bg-overlay)', width: '25%' }}>Variante (SKU)</th>
                      <th style={{ background: 'var(--bg-overlay)' }}>Atributos</th>
                      <th style={{ background: 'var(--bg-overlay)' }}>Precio y Costo</th>
                      <th style={{ background: 'var(--bg-overlay)', minWidth: '150px' }}>Inventario por Sucursal</th>
                      <th style={{ background: 'var(--bg-overlay)', width: '100px' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.product_variants.map((variant, vIndex) => {
                      const totalStock = variant.inventories?.reduce((acc, inv) => acc + (inv.stock || inv.quantity || 0), 0) || 0;
                      return (
                        <tr key={variant.id || vIndex}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {variant.variant_images?.[0] ? (
                                <img 
                                  src={getImageUrl(variant.variant_images[0].image_url)} 
                                  style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                                />
                              ) : (
                                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ImageIcon size={14} color="var(--text-muted)" />
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{variant.sku}</div>
                                {variant.barcode && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cód: {variant.barcode}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              
                              {/* Display Size if exists */}
                              {variant.size && (
                                <div 
                                  style={{ 
                                    display: 'inline-flex', alignItems: 'center', background: 'var(--bg-overlay)', padding: '4px 10px', 
                                    borderRadius: '8px', fontSize: '13px', color: 'var(--color-primary)', border: '1px solid var(--color-primary)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                  }}
                                >
                                  <span style={{ fontWeight: '700', marginRight: '4px' }}>Talla:</span>
                                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{variant.size.name}</span>
                                </div>
                              )}

                              {/* Display Fit if exists */}
                              {variant.fit && (
                                <div 
                                  style={{ 
                                    display: 'inline-flex', alignItems: 'center', background: 'var(--bg-overlay)', padding: '4px 10px', 
                                    borderRadius: '8px', fontSize: '13px', color: 'var(--color-primary)', border: '1px solid var(--color-primary)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                  }}
                                >
                                  <span style={{ fontWeight: '700', marginRight: '4px' }}>Fit:</span>
                                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{variant.fit.name}</span>
                                </div>
                              )}

                              {/* Display other attributes (Color, Material, etc) */}
                              {variant.variant_attribute_values?.map((vav, aIndex) => {
                                const attrName = vav.attribute_value?.attribute?.name || '';
                                const attrValue = vav.attribute_value?.value || '';
                                return (
                                  <div 
                                    key={vav.id || aIndex} 
                                    style={{ 
                                      display: 'inline-flex', 
                                      alignItems: 'center',
                                      background: 'var(--bg-overlay)', 
                                      padding: '4px 10px', 
                                      borderRadius: '8px', 
                                      fontSize: '13px', 
                                      color: 'var(--color-primary)', 
                                      border: '1px solid var(--color-primary)',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}
                                  >
                                    <span style={{ fontWeight: '700', marginRight: '4px', textTransform: 'capitalize' }}>
                                      {attrName}:
                                    </span>
                                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                      {attrValue}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Venta: {formatMoney(variant.price || product.base_price)}</span>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Costo: {formatMoney(variant.cost || 0)}</span>
                            </div>
                          </td>
                          <td>
                            {variant.inventories?.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-overlay)', padding: '8px', borderRadius: '8px' }}>
                                {variant.inventories.map((inv, invIdx) => (
                                   <div key={inv.id || invIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                      <span style={{ color: 'var(--text-main)' }}>{inv.branch?.name || 'Sucursal Base'}:</span>
                                      <span style={{ fontWeight: '600', color: (inv.stock || inv.quantity) > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{inv.stock || inv.quantity || 0} u.</span>
                                   </div>
                                ))}
                                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
                                   <span style={{ color: 'var(--text-main)' }}>Total:</span>
                                   <span style={{ color: 'var(--color-primary)' }}>{totalStock} u.</span>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: '500' }}>Sin inventario</span>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${variant.is_active ? 'active' : 'inactive'}`} style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                              {variant.is_active ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Package size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                  <p style={{ margin: 0, fontSize: '15px' }}>Este producto no tiene variantes registradas.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'images' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Product Global Images */}
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-main)' }}>Imágenes Generales del Producto</h3>
                {product.product_images?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                    {product.product_images.map((img, iIndex) => (
                      <div key={img.id || iIndex} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: img.is_primary ? '2px solid var(--color-primary)' : '1px solid var(--border-color)', aspectRatio: '1' }}>
                        <img 
                          src={getImageUrl(img.image_url)} 
                          alt="Global Image" 
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
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay imágenes generales.</div>
                )}
              </div>

              {/* Variant Images / Color Images */}
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-main)' }}>Imágenes por Variante / Color</h3>
                {product.product_variants?.some(v => v.variant_images?.length > 0) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {product.product_variants.filter(v => v.variant_images?.length > 0).map((variant, vIdx) => (
                      <div key={variant.id || vIdx} style={{ padding: '16px', background: 'var(--bg-overlay)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{variant.sku}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                            ({variant.variant_attribute_values?.map(vav => vav.attribute_value?.value).join(', ')})
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
                          {variant.variant_images.map((img, iIdx) => (
                            <div key={img.id || iIdx} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '1' }}>
                              <img src={getImageUrl(img.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay imágenes específicas por variante o color.
                  </div>
                )}
              </div>

              {/* Attribute Value Images (Si el backend las expone) */}
              {product.attribute_value_images?.length > 0 && (
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-main)' }}>Imágenes por Atributo (Ej. Colores)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
                    {product.attribute_value_images.map((img, iIndex) => (
                      <div key={img.id || iIndex} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '1' }}>
                          <img src={getImageUrl(img.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
                          Atributo ID: {img.attribute_value_id}
                        </div>
                      </div>
                    ))}
                  </div>
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
