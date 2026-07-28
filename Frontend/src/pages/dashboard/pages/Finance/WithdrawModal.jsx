import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { createOwnerPayment } from "../../../../api/admin/finance";
import { toast } from "react-hot-toast";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function WithdrawModal({ isOpen, onClose, onSuccess, initialData }) {
  const [formData, setFormData] = useState({
    owner_id: "",
    branch_id: "",
    amount: "",
    fund_source: "cash",
    payment_method: "Efectivo",
    reference_number: "",
    notes: "Retiro de utilidades del mes"
  });
  const [loading, setLoading] = useState(false);
  const [availableBranches, setAvailableBranches] = useState([]);

  useEffect(() => {
    if (isOpen && initialData) {
      // Filter out the 'legacy' pseudo-branch
      const branches = (initialData.branches || []).filter(b => b.branch_id);
      setAvailableBranches(branches);
      setFormData({
        owner_id: initialData.owner_id || "",
        branch_id: branches.length > 0 ? branches[0].branch_id : "",
        amount: "",
        fund_source: "cash",
        payment_method: "Efectivo",
        reference_number: `REF-${Date.now()}`,
        notes: "Retiro de utilidades del mes"
      });
    }
  }, [isOpen, initialData]);

  // Determine which branch the user selected
  const selectedBranch = availableBranches.find(b => b.branch_id === formData.branch_id);

  // Calculate max balance based on selected branch and fund_source
  const maxBalance = selectedBranch 
    ? (formData.fund_source === 'cash' ? Number(selectedBranch.cash_balance || 0) : Number(selectedBranch.bank_balance || 0))
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      toast.error("Por favor, ingresa un monto válido mayor a 0.");
      return;
    }
    
    if (!formData.branch_id) {
      toast.error("Debes seleccionar una sucursal para realizar el retiro.");
      return;
    }

    // Check balance
    if (Number(formData.amount) > maxBalance) {
      toast.error(`El monto supera el saldo disponible en ${formData.fund_source === 'cash' ? 'Caja' : 'Banco'} para esta sucursal (Bs. ${maxBalance.toFixed(2)}).`);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        type: 'withdrawal',
        // Send full ISO string to include the current time
        payment_date: new Date().toISOString(),
      };
      
      await createOwnerPayment(payload);
      toast.success("Retiro de fondos registrado exitosamente");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0][0];
        toast.error(firstError);
      } else {
        toast.error("Error al procesar el retiro");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal scale-in" style={{ maxWidth: '400px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', flexShrink: 0 }}>
          <h2 style={{ margin: 0, padding: 0, fontSize: '20px', border: 'none', background: 'none', WebkitTextFillColor: 'var(--text-main)' }}>
            Retirar Fondos
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Sucursal de Origen <span className="text-danger">*</span>
              </label>
              <CustomSelect 
                 
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                required
              >
                <option value="">Seleccione una sucursal</option>
                {availableBranches.map(b => (
                  <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                ))}
              </CustomSelect>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Fondo a Retirar <span className="text-danger">*</span>
              </label>
              <CustomSelect 
                 
                value={formData.fund_source}
                onChange={(e) => setFormData({ ...formData, fund_source: e.target.value })}
                required
              >
                <option value="cash">Caja Física (Tienda)</option>
                <option value="bank">Cuenta Bancaria</option>
              </CustomSelect>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Saldo Disponible:</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: maxBalance > 0 ? '#22c55e' : '#ef4444' }}>
                  Bs. {maxBalance.toFixed(2)}
                </span>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Monto a Retirar (Bs.) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxBalance > 0 ? maxBalance : 0.01}
                  className="form-control"
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Método de Pago</label>
                <CustomSelect 
                   
                  value={formData.payment_method} 
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="QR">QR</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Otro">Otro</option>
                </CustomSelect>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nro. Referencia (Automático)</label>
                <input type="text" className="form-control" value={formData.reference_number} readOnly style={{ backgroundColor: 'var(--bg-overlay)' }} />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notas Adicionales</label>
              <textarea 
                className="form-control" 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                placeholder="Motivo del retiro..." 
                style={{ minHeight: '60px' }}
              ></textarea>
            </div>

          </div>

          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Procesando..." : "Confirmar Retiro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
