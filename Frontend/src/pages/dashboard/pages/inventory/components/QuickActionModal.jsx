import React from 'react';
import { PenTool, ArrowRightLeft, History, X, Package, Tag, MapPin } from 'lucide-react';
import { API_BASE_URL } from '../../../../../config/api';
import { useNavigate } from 'react-router-dom';

export default function QuickActionModal({ item, onClose, onAdjust, onTransfer }) {
  const navigate = useNavigate();

  if (!item) return null;

  const variant = item.variant;
  const product = variant?.product;
  
  let imgUrl = variant?.variant_images?.[0]?.url;
  if (!imgUrl) {
    const attrIds = variant?.variant_attribute_values?.map(vav => vav.attribute_value_id) || [];
    const colorImg = product?.attribute_value_images?.find(img => attrIds.includes(img.attribute_value_id));
    if (colorImg) imgUrl = colorImg.url;
  }
  if (!imgUrl) {
    imgUrl = product?.product_images?.find(img => img.is_main)?.url || product?.product_images?.[0]?.url;
  }
  const finalImgUrl = imgUrl ? (imgUrl.startsWith("http") ? imgUrl : `${API_BASE_URL}${imgUrl}`) : "/placeholder.png";

  const handleHistory = () => {
    navigate(`/dashboard/inventory/movements?search=${variant?.sku}`);
    onClose();
  };

  // Extraer todos los atributos para badges
  const allAttributes = [];
  if (variant?.size?.name) {
    allAttributes.push({ name: 'Talla', value: variant.size.name });
  }
  variant?.variant_attribute_values?.forEach(vav => {
    if (vav.attribute_value?.value) {
      allAttributes.push({ 
        name: vav.attribute_value?.attribute?.name || 'Attr', 
        value: vav.attribute_value.value 
      });
    }
  });

  const price = variant?.price || product?.price || 0;
  
  // Calcular descuentos
  let discountBadge = null;
  if (product?.product_discount) {
    const d = product.product_discount;
    discountBadge = d.type === 'percentage' ? `-${d.value}%` : `-Bs ${d.value}`;
  } else if (product?.category_discount) {
    const d = product.category_discount;
    discountBadge = d.type === 'percentage' ? `-${d.value}%` : `-Bs ${d.value}`;
  }

  const stock = item.stock || 0;
  const canTransfer = stock > 0;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-content" style={{ maxWidth: '500px', width: '90%', background: 'var(--bg-main)', borderRadius: '24px', overflow: 'hidden', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
        
        {/* ENCABEZADO DE LA TARJETA */}
        <div style={{ padding: '24px 24px 16px 24px', background: 'var(--bg-card)', position: 'relative' }}>
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--bg-input)', border: 'none', color: 'var(--text-muted)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={18} />
          </button>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <img src={finalImgUrl} alt={product?.name} style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', border: '1px solid var(--border-color)', background: 'var(--bg-input)', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
            <div style={{ flex: 1, paddingRight: '32px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, lineHeight: 1.2, color: 'var(--text-main)' }}>{product?.name}</h2>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} /> SKU: <strong style={{ color: 'var(--text-main)' }}>{variant?.sku}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* FICHA INFORMATIVA */}
        <div style={{ padding: '16px 24px', background: 'var(--bg-card)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Atributos</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {allAttributes.length > 0 ? allAttributes.map((attr, idx) => (
                <span key={idx} style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {attr.name === 'Talla' ? `Talla: ${attr.value}` : attr.value}
                </span>
              )) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sin atributos</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Precio</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-success)' }}>Bs {price.toFixed(2)}</span>
              {discountBadge && (
                <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
                  {discountBadge}
                </span>
              )}
            </div>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: stock > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', border: `1px solid ${stock > 0 ? 'var(--color-success)' : 'var(--color-danger)'}`, marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stock > 0 ? 'var(--color-success)' : 'var(--color-danger)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={20} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Stock en Sucursal</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  <MapPin size={14} color="var(--color-primary)" /> {item.branch?.name}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stock > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {stock} <span style={{ fontSize: '14px', fontWeight: 600 }}>uds</span>
            </div>
          </div>

        </div>

        {/* ZONA DE ACCIONES */}
        <div style={{ padding: '24px', background: 'var(--bg-main)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Acciones Rápidas</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={() => { onClose(); onAdjust(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--color-primary)', color: 'var(--text-main)', cursor: 'pointer', transition: '0.2s', textAlign: 'left', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <PenTool size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>Ajustar Stock</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{stock <= 0 ? "Registrar ingreso de mercadería" : "Sumar o restar unidades"}</div>
              </div>
            </button>

            <button 
              onClick={() => { if (canTransfer) { onClose(); onTransfer(); } }}
              disabled={!canTransfer}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: canTransfer ? 'pointer' : 'not-allowed', transition: '0.2s', textAlign: 'left', opacity: canTransfer ? 1 : 0.6 }}
              onMouseEnter={(e) => { if (canTransfer) { e.currentTarget.style.borderColor = 'var(--color-success)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
              onMouseLeave={(e) => { if (canTransfer) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)' } }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: canTransfer ? 'rgba(16,185,129,0.1)' : 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: canTransfer ? 'var(--color-success)' : 'var(--text-muted)' }}>
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>Transferir a Sucursal</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{canTransfer ? "Mover inventario a otra ubicación" : "No hay stock para transferir"}</div>
              </div>
            </button>
            <button 
              onClick={handleHistory}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', transition: '0.2s', textAlign: 'left', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-warning)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
                <History size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>Ver Historial</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Consultar movimientos de la prenda</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
