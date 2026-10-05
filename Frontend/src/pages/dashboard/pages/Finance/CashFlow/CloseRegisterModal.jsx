import React, { useState, useEffect } from 'react';
import { closeCashRegister } from '../../../../../api/admin/finance';
import { toast } from 'react-hot-toast';
import { X, Lock, AlertTriangle } from 'lucide-react';

const CloseRegisterModal = ({ isOpen, onClose, onSuccess, branch }) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // expected cash: cash_balance reported by the backend (branch.cash_balance)
  // actually branch.cash_balance represents the theoretical cash right now.
  const theoreticalBalance = branch?.cash_balance || 0;

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen || !branch) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) {
      toast.error("Ingresa el monto de cierre (monto físico).");
      return;
    }
    
    setLoading(true);
    try {
      await closeCashRegister({
        register_id: branch.active_register.id,
        closing_amount: amount,
        expected_amount: theoreticalBalance,
        notes: notes
      });
      toast.success("Caja cerrada, arqueo registrado exitosamente.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al cerrar la caja");
    } finally {
      setLoading(false);
    }
  };

  const diff = Number(amount) - Number(theoreticalBalance);
  const isDiff = amount !== '' && diff !== 0;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="modal-content" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', width: '100%', maxWidth: '550px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
            <Lock size={20} />
            Arqueo y Cierre de Caja - {branch.name}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background-color 0.2s' }}>
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '13px' }}>Saldo Físico Teórico (Según Sistema)</p>
            <h3 style={{ margin: 0, fontSize: '24px', color: 'var(--text-main)' }}>Bs. {Number(theoreticalBalance).toFixed(2)}</h3>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>Dinero Físico Real (Arqueo) - Bs.</label>
            <input 
              type="number" 
              step="0.01"
              min="0"
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              required
              placeholder="¿Cuánto dinero hay realmente en caja?"
              autoFocus
              style={{ fontSize: '20px', fontWeight: 'bold', padding: '12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {isDiff && (
            <div style={{ 
              padding: '12px', 
              borderRadius: '8px', 
              background: diff > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${diff > 0 ? '#22c55e' : '#ef4444'}`,
              marginBottom: '20px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <AlertTriangle size={24} color={diff > 0 ? '#22c55e' : '#ef4444'} />
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: diff > 0 ? '#22c55e' : '#ef4444' }}>
                  {diff > 0 ? 'Sobrante detectado' : 'Faltante detectado'} (Bs. {Math.abs(diff).toFixed(2)})
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-main)' }}>
                  Al cerrar, se generará un movimiento de ajuste automático en tesorería.
                </p>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>Notas de Cierre (Opcional)</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder={isDiff ? "Explica el motivo del descuadre..." : "Notas de fin de turno..."}
              required={isDiff}
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', padding: '10px', width: '100%', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
            ></textarea>
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0 0', margin: 0, display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {loading ? 'Procesando...' : 'Cerrar Caja Definitivamente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CloseRegisterModal;
