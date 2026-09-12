import React, { useState } from 'react';
import { openCashRegister } from '../../../../../api/admin/finance';
import { toast } from 'react-hot-toast';
import { X, Unlock } from 'lucide-react';

const OpenRegisterModal = ({ isOpen, onClose, onSuccess, branch }) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');

  if (!isOpen || !branch) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) {
      toast.error("Ingresa el monto de apertura.");
      return;
    }
    
    setLoading(true);
    try {
      await openCashRegister({
        branch_id: branch.id,
        opening_amount: amount
      });
      toast.success("Caja abierta exitosamente.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al abrir la caja");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="modal-content" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e' }}>
            <Unlock size={20} />
            Abrir Caja - {branch.name}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background-color 0.2s' }}>
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
            Para habilitar el cobro y las transacciones de esta sucursal, debes registrar con cuánto dinero inicia la caja hoy.
          </p>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>Monto Inicial de Caja (Físico) - Bs.</label>
            <input 
              type="number" 
              step="0.01"
              min="0"
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              required
              placeholder="Ej: 500.00"
              autoFocus
              style={{ fontSize: '20px', fontWeight: 'bold', padding: '12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0 0', margin: 0, display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#22c55e', color: '#fff', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {loading ? 'Procesando...' : 'Abrir Caja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OpenRegisterModal;
