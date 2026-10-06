import React, { useState } from 'react';
import { Package, ArrowLeft, Loader2, Send } from 'lucide-react';
import { requestReturn } from '../../../../api/shop/returns';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '../../../../utils/imageUtils';

export default function ReturnRequestForm({ sale, guestPhone, onBack, onReturnSuccess }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    quantity: 1,
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  // Filtrar detalles que no tienen devoluciones pendientes/aprobadas o donde ya no hay cantidad disponible
  const eligibleItems = sale.sale_details?.filter(detail => {
    // Si tuviéramos un helper en backend que mande 'available_quantity' sería ideal,
    // pero de momento verificamos si ya tiene un return_request asociado con toda la cantidad.
    // Esto es algo básico; en un sistema real el backend filtraría mejor esto.
    if (detail.return_request && detail.return_request.status !== 'rejected') {
      if (detail.return_request.quantity >= detail.quantity) {
        return false;
      }
    }
    return true;
  }) || [];

  const handleSelect = (item) => {
    setSelectedItem(item);
    setFormData({ quantity: 1, reason: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (!formData.reason.trim()) {
      toast.error('Por favor, indica el motivo de la devolución.');
      return;
    }

    try {
      setLoading(true);
      await requestReturn({
        sale_detail_id: selectedItem.id,
        quantity: formData.quantity,
        reason: formData.reason,
        whatsapp_phone: guestPhone // null si es auth user
      });
      toast.success('Solicitud de devolución enviada correctamente.');
      onReturnSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  if (eligibleItems.length === 0) {
    return (
      <div className="return-request-container">
        <button className="btn-back" onClick={onBack}><ArrowLeft size={16} /> Volver</button>
        <div className="no-items-message">
          <Package size={48} />
          <h3>No hay artículos disponibles</h3>
          <p>Todos los artículos de esta compra ya han sido devueltos o tienen una solicitud en proceso.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="return-request-container">
      <button className="btn-back" onClick={onBack}><ArrowLeft size={16} /> Volver</button>
      
      <h2>Selecciona el artículo a devolver</h2>
      <p>Compra: {sale.invoice_number}</p>

      {!selectedItem ? (
        <div className="items-list">
          {eligibleItems.map(item => {
            const variant = item.product_variant;
            const product = variant?.product;
            const colorId = variant?.variant_attribute_values?.[0]?.attribute_value_id;
            const colorImg = product?.attribute_value_images?.find(img => img.attribute_value_id === colorId);
            let imageUrl = variant?.variant_images?.[0]?.url || colorImg?.url || product?.product_images?.find(img => img.is_main)?.url || product?.product_images?.[0]?.url;
            
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = getImageUrl(imageUrl);
            }

            return (
              <div key={item.id} className="item-card" onClick={() => handleSelect(item)}>
                <div className="item-image">
                  {imageUrl ? <img src={imageUrl} alt="Producto" /> : <div className="placeholder-img" />}
                </div>
                <div className="item-details">
                  <h4>{product?.name || 'Producto Desconocido'}</h4>
                  <p className="item-meta">
                    {[
                      variant?.size?.name ? `Talla: ${variant.size.name}` : null,
                      variant?.fit?.name ? `Fit: ${variant.fit.name}` : null,
                      ...(variant?.variant_attribute_values?.map(attr => 
                        `${attr.attribute_value?.attribute?.name || 'Var'}: ${attr.attribute_value?.value}`
                      ) || [])
                    ].filter(Boolean).join(' | ')}
                  </p>
                  <p className="item-price">
                    {item.final_price < item.unit_price ? (
                      <>
                        <span style={{ textDecoration: 'line-through', color: '#888', marginRight: '6px' }}>Bs. {item.unit_price}</span>
                        <span style={{ color: '#ff4d4f' }}>Bs. {item.final_price}</span>
                      </>
                    ) : (
                      <span>Bs. {item.final_price}</span>
                    )}
                  </p>
                </div>
                <div className="item-action">
                  <button className="btn-select">Seleccionar</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="return-form">
          <div className="selected-item-summary">
            <h4>Estás devolviendo: {selectedItem.product_variant?.product?.name}</h4>
            <button type="button" className="btn-change-item" onClick={() => setSelectedItem(null)}>Cambiar artículo</button>
          </div>

          <div className="form-group">
            <label>Cantidad a devolver (Max: {selectedItem.quantity})</label>
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
                max={selectedItem.quantity} 
                value={formData.quantity}
                onChange={(e) => {
                  let val = parseInt(e.target.value) || 1;
                  if (val > selectedItem.quantity) val = selectedItem.quantity;
                  if (val < 1) val = 1;
                  setFormData({ ...formData, quantity: val });
                }}
                className="qty-input"
                required
              />
              <button 
                type="button" 
                className="qty-btn"
                onClick={() => setFormData(prev => ({ ...prev, quantity: Math.min(selectedItem.quantity, prev.quantity + 1) }))}
                disabled={formData.quantity >= selectedItem.quantity}
              >
                +
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Motivo de la devolución</label>
            <textarea 
              placeholder="Explica brevemente por qué deseas devolver este artículo..." 
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              rows={4}
              className="reason-textarea"
            />
          </div>

          <button type="submit" className="btn-submit-return" disabled={loading}>
            {loading ? <><Loader2 size={18} className="spin" /> Procesando...</> : <><Send size={18} /> Enviar Solicitud</>}
          </button>
        </form>
      )}
    </div>
  );
}
