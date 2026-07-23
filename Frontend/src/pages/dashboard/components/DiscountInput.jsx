import React, { useState } from 'react';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import Spinner from './Spinner/Spinner';

export default function DiscountInput({ 
  subtotal, 
  items, 
  customerId, 
  branchId, 
  onValidated, 
  disabled = false 
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const handleValidate = async () => {
    if (!code.trim()) {
      toast.error('Por favor, ingresa un código.');
      return;
    }

    setLoading(true);
    try {
      const mappedItems = items.map(item => ({
        variant_id: item.product_variant_id || item.variant_id,
        line_subtotal: item.subtotal || item.line_subtotal
      }));

      const response = await api.post('/v1/admin/checkout/validate-code', {
        code: code.trim(),
        subtotal: parseFloat(subtotal),
        items: mappedItems,
        customer_id: customerId,
        branch_id: branchId
      });

      const data = response.data;
      if (data.valid) {
        toast.success(data.message);
        setValidationResult(data);
        if (onValidated) onValidated(data);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al validar el código';
      toast.error(msg);
      setValidationResult(null);
      if (onValidated) onValidated(null);
    } finally {
      setLoading(false);
    }
  };

  const clearCode = () => {
    setCode('');
    setValidationResult(null);
    if (onValidated) onValidated(null);
  };

  return (
    <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
        Código de Descuento o Giftcard
      </label>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ej. VOX-123456 o VERANO20"
          disabled={disabled || validationResult !== null}
          style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '1px' }}
        />
        
        {validationResult ? (
          <button
            type="button"
            className="btn-danger"
            onClick={clearCode}
            disabled={disabled}
            style={{ padding: '0 16px', borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            Quitar
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={handleValidate}
            disabled={disabled || loading || !code.trim()}
            style={{ padding: '0 16px', borderRadius: '6px', cursor: (disabled || loading || !code.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}
          >
            {loading ? <Spinner size={16} color="#ffffff" trackColor="rgba(255,255,255,0.3)" borderWidth={2} /> : 'Aplicar'}
          </button>
        )}
      </div>

      {validationResult && (
        <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-focus)', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Original:</span>
            <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Bs. {parseFloat(validationResult.original_total).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'var(--color-success)' }}>{validationResult.type === 'giftcard' ? 'Giftcard:' : 'Descuento:'}</span>
            <span style={{ fontWeight: 500, color: 'var(--color-success)' }}>- Bs. {parseFloat(validationResult.discount_amount).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', marginTop: '4px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Nuevo Total:</span>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Bs. {parseFloat(validationResult.new_total).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
