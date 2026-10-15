import React, { useState } from 'react';
import { Package, ArrowLeft, Loader2, Send, Tag, AlertCircle, ShieldCheck, CheckSquare, Square, Percent } from 'lucide-react';
import { requestReturn } from '../../../../api/shop/returns';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '../../../../utils/imageUtils';

export default function ReturnRequestForm({ sale, guestPhone, onBack, onReturnSuccess }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    quantity: 1,
    reason: ''
  });
  const [acceptedUnusedAndTag, setAcceptedUnusedAndTag] = useState(false);
  const [acceptedRefundRate, setAcceptedRefundRate] = useState(false);
  const [loading, setLoading] = useState(false);

  const allItems = sale.items || sale.sale_details || [];

  // Filtrar exclusivamente artículos que tengan una variante válida y cantidad disponible
  const eligibleItems = allItems.filter(detail => {
    // 1. Obligatorio: Debe tener una variante específica
    const hasVariant = Boolean(detail.product_variant_id || detail.variant_id || detail.product_variant);
    if (!hasVariant) return false;

    // 2. Verificar cantidad disponible (no devuelto totalmente)
    const returnedQty = detail.return_request && detail.return_request.status !== 'rejected'
      ? Number(detail.return_request.quantity || 0)
      : 0;
    
    return (detail.quantity - returnedQty) > 0;
  });

  const getAvailableQuantity = (item) => {
    if (!item) return 1;
    const returnedQty = item.return_request && item.return_request.status !== 'rejected'
      ? Number(item.return_request.quantity || 0)
      : 0;
    return Math.max(1, item.quantity - returnedQty);
  };

  const handleSelect = (item) => {
    setSelectedItem(item);
    setFormData({ quantity: 1, reason: '' });
    setAcceptedUnusedAndTag(false);
    setAcceptedRefundRate(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (!formData.reason.trim() || formData.reason.trim().length < 10) {
      toast.error('Por favor, indica un motivo de al menos 10 caracteres para tramitar la devolución.');
      return;
    }

    if (!acceptedUnusedAndTag) {
      toast.error('Debes confirmar que la prenda está sin uso y conserva su etiqueta original intacta.');
      return;
    }

    if (!acceptedRefundRate) {
      toast.error('Debes aceptar las condiciones de reembolso del 75% del valor de la prenda.');
      return;
    }

    const maxQty = getAvailableQuantity(selectedItem);
    if (formData.quantity > maxQty) {
      toast.error(`Solo puedes devolver un máximo de ${maxQty} unidades.`);
      return;
    }

    try {
      setLoading(true);
      const res = await requestReturn({
        sale_detail_id: selectedItem.id,
        quantity: formData.quantity,
        reason: formData.reason.trim(),
        whatsapp_phone: guestPhone, // null si es auth user
        accept_conditions: true
      });
      toast.success(res.data?.message || 'Solicitud de devolución registrada correctamente.');
      onReturnSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  if (eligibleItems.length === 0) {
    const hasNonVariantItems = allItems.some(i => !i.product_variant_id && !i.variant_id && !i.product_variant);
    return (
      <div className="return-request-container">
        <button className="btn-back" onClick={onBack}><ArrowLeft size={16} /> Volver a mis compras</button>
        <div className="no-items-message">
          <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
          <h3>No hay artículos elegibles para devolución</h3>
          <p style={{ maxWidth: '500px', margin: '0 auto', color: 'var(--text-muted)' }}>
            {hasNonVariantItems
              ? 'Solo se admiten devoluciones de productos con variantes específicas (talla/color) y que no hayan sido devueltos previamente.'
              : 'Todos los artículos de esta compra ya han sido devueltos o cuentan con una solicitud de devolución en trámite.'}
          </p>
        </div>
      </div>
    );
  }

  const selectedMaxQty = getAvailableQuantity(selectedItem);
  const unitPrice = selectedItem ? parseFloat(selectedItem.final_price || selectedItem.unit_price || 0) : 0;
  const totalOriginal = unitPrice * formData.quantity;
  const refundAmount = totalOriginal * 0.75;
  const retainedAmount = totalOriginal * 0.25;

  const isSubmitDisabled = loading || 
    formData.reason.trim().length < 10 || 
    !acceptedUnusedAndTag || 
    !acceptedRefundRate;

  return (
    <div className="return-request-container">
      <button className="btn-back" onClick={onBack}><ArrowLeft size={16} /> Volver a mis compras</button>
      
      <div className="return-request-header">
        <h2>{selectedItem ? 'Configurar Devolución' : 'Selecciona la prenda a devolver'}</h2>
        <p>
          Compra: <strong>{sale.invoice_number}</strong> — Plazo máximo: <strong>24 horas (1 día)</strong> desde la entrega.
        </p>
      </div>

      {!selectedItem ? (
        <div className="items-list">
          {eligibleItems.map(item => {
            const variant = item.product_variant || item.variant;
            const product = variant?.product;
            const colorId = variant?.variant_attribute_values?.[0]?.attribute_value_id;
            const colorImg = product?.attribute_value_images?.find(img => img.attribute_value_id === colorId);
            let imageUrl = item.image || variant?.variant_images?.[0]?.url || colorImg?.url || product?.product_images?.find(img => img.is_main)?.url || product?.product_images?.[0]?.url;
            
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = getImageUrl(imageUrl);
            }

            const availQty = getAvailableQuantity(item);
            const itemPrice = parseFloat(item.final_price || item.unit_price || 0);
            const itemRefund75 = itemPrice * 0.75;

            const variantAttributes = [
              item.size ? `Talla: ${item.size}` : (variant?.size?.name ? `Talla: ${variant.size.name}` : null),
              item.fit ? `Fit: ${item.fit}` : (variant?.fit?.name ? `Fit: ${variant.fit.name}` : null),
              ...(variant?.variant_attribute_values?.map(attr => 
                `${attr.attribute_value?.attribute?.name || 'Color'}: ${attr.attribute_value?.value}`
              ) || [])
            ].filter(Boolean);

            return (
              <div key={item.id} className="item-card" onClick={() => handleSelect(item)}>
                <div className="item-image">
                  {imageUrl ? <img src={imageUrl} alt="Producto" /> : <div className="placeholder-img" />}
                </div>
                <div className="item-details">
                  <h4>{item.product_name || product?.name || 'Prenda'}</h4>
                  <div className="item-tags-wrap">
                    {variantAttributes.map((attr, idx) => (
                      <span key={idx} className="item-tag tag-size">{attr}</span>
                    ))}
                    <span className="item-tag tag-qty">Disponible: {availQty} de {item.quantity}</span>
                  </div>
                  <div className="item-price-row">
                    <span className="item-original-price">Bs. {itemPrice.toFixed(2)}</span>
                    <span className="item-refund-badge">Reembolso (75%): Bs. {itemRefund75.toFixed(2)}</span>
                  </div>
                </div>
                <div className="item-action">
                  <button type="button" className="btn-select">Devolver</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="return-form">
          <div className="selected-item-summary">
            <div className="summary-info">
              <h4>{selectedItem.product_name || selectedItem.product_variant?.product?.name || 'Prenda seleccionada'}</h4>
              <p>
                {[
                  selectedItem.size ? `Talla: ${selectedItem.size}` : (selectedItem.product_variant?.size?.name ? `Talla: ${selectedItem.product_variant.size.name}` : null),
                  ...(selectedItem.product_variant?.variant_attribute_values?.map(a => `${a.attribute_value?.value}`) || [])
                ].filter(Boolean).join(' • ')}
              </p>
            </div>
            <button type="button" className="btn-change-item" onClick={() => setSelectedItem(null)}>
              Cambiar prenda
            </button>
          </div>

          {/* Selector de cantidad */}
          <div className="form-group">
            <label>Cantidad a devolver (Máximo disponible: {selectedMaxQty})</label>
            <div className="quantity-selector">
              <button 
                type="button" 
                className="qty-btn"
                onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                disabled={formData.quantity <= 1}
              >
                -
              </button>
              <input 
                type="number" 
                min="1" 
                max={selectedMaxQty} 
                value={formData.quantity}
                onChange={(e) => {
                  let val = parseInt(e.target.value) || 1;
                  if (val > selectedMaxQty) val = selectedMaxQty;
                  if (val < 1) val = 1;
                  setFormData(prev => ({ ...prev, quantity: val }));
                }}
                className="qty-input"
                required
              />
              <button 
                type="button" 
                className="qty-btn"
                onClick={() => setFormData(prev => ({ ...prev, quantity: Math.min(selectedMaxQty, prev.quantity + 1) }))}
                disabled={formData.quantity >= selectedMaxQty}
              >
                +
              </button>
            </div>
          </div>

          {/* Desglose de Reembolso del 75% */}
          <div className="refund-breakdown-card">
            <div className="breakdown-header">
              <Percent size={18} />
              <span>Desglose de Reembolso (Política del 75%)</span>
            </div>
            <div className="breakdown-row">
              <span>Valor original ({formData.quantity} {formData.quantity > 1 ? 'prendas' : 'prenda'}):</span>
              <strong>Bs. {totalOriginal.toFixed(2)}</strong>
            </div>
            <div className="breakdown-row fee">
              <span>Gastos de gestión e higienización (25% no reembolsable):</span>
              <span>- Bs. {retainedAmount.toFixed(2)}</span>
            </div>
            <div className="breakdown-row total-refund">
              <span>Monto neto a reembolsar (75%):</span>
              <span className="refund-highlight">Bs. {refundAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Motivo */}
          <div className="form-group">
            <label>Motivo detallado de la devolución (Mínimo 10 caracteres)</label>
            <textarea 
              placeholder="Explica detalladamente la razón de la devolución (ej. cambio de talla, detalle en tela, color no esperado)..." 
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              required
              minLength={10}
              rows={4}
              className="reason-textarea"
            />
            <span style={{ fontSize: '11px', color: formData.reason.length < 10 ? '#ef4444' : 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Caracteres: {formData.reason.length} / 10 mínimo
            </span>
          </div>

          {/* Checkboxes de condiciones obligatorias */}
          <div className="conditions-check-container">
            <label className="checkbox-condition-label" onClick={() => setAcceptedUnusedAndTag(!acceptedUnusedAndTag)}>
              <input 
                type="checkbox" 
                checked={acceptedUnusedAndTag} 
                onChange={(e) => setAcceptedUnusedAndTag(e.target.checked)} 
              />
              <span className="checkbox-text">
                <strong>Condición de la prenda:</strong> Declaro que la prenda <u>no presenta signos de uso</u>, lavado, manchas ni olores, y <u>conserva su etiqueta original intacta</u> de fábrica.
              </span>
            </label>

            <label className="checkbox-condition-label" onClick={() => setAcceptedRefundRate(!acceptedRefundRate)}>
              <input 
                type="checkbox" 
                checked={acceptedRefundRate} 
                onChange={(e) => setAcceptedRefundRate(e.target.checked)} 
              />
              <span className="checkbox-text">
                <strong>Monto de reembolso:</strong> Acepto que se me reembolsará el <u>75% del valor de la prenda</u> (<strong>Bs. {refundAmount.toFixed(2)}</strong>) previa inspección física al recibir el artículo devuelto.
              </span>
            </label>
          </div>

          <button type="submit" className="btn-submit-return" disabled={isSubmitDisabled}>
            {loading ? (
              <><Loader2 size={18} className="spin" /> Procesando solicitud...</>
            ) : (
              <><Send size={18} /> Confirmar Solicitud de Devolución</>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
