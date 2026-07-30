import React, { useState, useEffect } from 'react';
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
  const [autoDiscounts, setAutoDiscounts] = useState([]);
  const [loadingAuto, setLoadingAuto] = useState(false);

  useEffect(() => {
    const fetchAutoDiscounts = async () => {
      try {
        setLoadingAuto(true);
        const res = await api.get('/v1/admin/discounts');
        const discounts = res.data.filter(d => d.is_automatic && d.active);
        setAutoDiscounts(discounts);
      } catch (err) {
        console.error("Error fetching discounts", err);
      } finally {
        setLoadingAuto(false);
      }
    };
    fetchAutoDiscounts();
  }, []);

  const handleValidate = async (customCode = null) => {
    // If a customCode is provided (like when clicking an auto discount chip), use it.
    // Otherwise fallback to the `code` state.
    const rawCode = customCode ?? code;
    const codeToValidate = (rawCode || '').toString().trim();
    
    if (!codeToValidate) {
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
        code: codeToValidate,
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
      
      {autoDiscounts.length > 0 && !validationResult && (
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Descuentos Automáticos Disponibles:</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {autoDiscounts.map(d => {
              const codeOrId = d.code || d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setCode(codeOrId);
                    handleValidate(codeOrId);
                  }}
                  disabled={disabled || loading}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '16px',
                    border: '1px solid var(--color-primary)',
                    background: 'var(--color-primary-alpha)',
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: disabled || loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {d.name} {d.code ? `(${d.code})` : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="discount-input-row">
        <input
          type="text"
          className="form-control"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ej. VOX-123456"
          disabled={disabled || validationResult !== null}
          style={{ 
            flex: 1, 
            textTransform: 'uppercase', 
            letterSpacing: '1px', 
            minWidth: 0,
            background: 'var(--bg-input)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)'
          }}
        />
        
        {validationResult ? (
          <button
            type="button"
            className="btn-cancel-payment"
            onClick={clearCode}
            disabled={disabled}
            style={{ padding: '10px 16px', borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            Quitar
          </button>
        ) : (
          <button
            type="button"
            className="btn-confirm-payment"
            onClick={() => handleValidate()}
            disabled={disabled || loading || !code.trim()}
            style={{ padding: '10px 16px', borderRadius: '6px', cursor: (disabled || loading || !code.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}
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
