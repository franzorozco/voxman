import React, { useState } from 'react';
import { addTreasuryAdjustment } from '../../../../../api/admin/finance';
import { toast } from 'react-hot-toast';
import { X, Save, TrendingUp, TrendingDown } from 'lucide-react';

import CustomSelect from '../../../../../components/ui/CustomSelect';
const TreasuryAdjustmentModal = ({ isOpen, onClose, onSuccess, branches }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    branch_id: '',
    type: 'out',
    amount: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.branch_id || !formData.amount || !formData.description) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }
    
    setLoading(true);
    try {
      await addTreasuryAdjustment(formData);
      toast.success("Ajuste registrado con éxito.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al registrar el ajuste");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="modal-content" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
            <Save size={20} />
            Registrar Ajuste Extraordinario
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background-color 0.2s' }}>
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto' }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>Sucursal</label>
            <CustomSelect 
              value={formData.branch_id} 
              onChange={e => setFormData({...formData, branch_id: e.target.value})}
              required
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', padding: '10px', width: '100%', outline: 'none' }}
            >
              <option value="">Seleccione una sucursal</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </CustomSelect>
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px', fontSize: '12px' }}>
              El ajuste se aplicará a la caja física de esta sucursal (debe estar abierta).
            </small>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>Tipo de Ajuste</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  border: formData.type === 'in' ? '2px solid #22c55e' : '1px solid var(--border-color)',
                  background: formData.type === 'in' ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-input)',
                  color: formData.type === 'in' ? '#22c55e' : 'var(--text-muted)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: formData.type === 'in' ? '600' : '400',
                  transition: 'all 0.2s'
                }}
                onClick={() => setFormData({...formData, type: 'in'})}
              >
                <TrendingUp size={18} /> Ingreso
              </button>
              <button
                type="button"
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  border: formData.type === 'out' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                  background: formData.type === 'out' ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-input)',
                  color: formData.type === 'out' ? '#ef4444' : 'var(--text-muted)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: formData.type === 'out' ? '600' : '400',
                  transition: 'all 0.2s'
                }}
                onClick={() => setFormData({...formData, type: 'out'})}
              >
                <TrendingDown size={18} /> Egreso
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>Monto (Bs.)</label>
            <input 
              type="number" 
              step="0.01"
              min="0"
              value={formData.amount} 
              onChange={e => setFormData({...formData, amount: e.target.value})}
              required
              placeholder="0.00"
              style={{ fontSize: '20px', fontWeight: 'bold', padding: '12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>Motivo / Descripción</label>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              required
              rows={3}
              placeholder="Ej: Faltante de caja por error de cobro..."
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', padding: '10px', width: '100%', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
            ></textarea>
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0 0', margin: 0, display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={16} /> {loading ? 'Guardando...' : 'Registrar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TreasuryAdjustmentModal;
