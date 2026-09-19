import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { transferOwnerFunds } from "../../../../api/admin/finance";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function OwnerTransferModal({ transferData, onClose, onSuccess }) {
  // transferData should contain { owner_id, branches: [{branch_id, branch_name}] }
  const [formData, setFormData] = useState({
    owner_id: transferData?.owner_id || "",
    branch_id: transferData?.branches?.[0]?.branch_id || "",
    from_fund: "cash",
    to_fund: "bank",
    amount: "",
    notes: "Transferencia entre cuentas del socio",
    transfer_date: new Date().toISOString().split("T")[0]
  });
  
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getAvailableBalance = () => {
    const b = transferData?.branches?.find(x => x.branch_id === formData.branch_id);
    if (!b) return 0;
    return formData.from_fund === "cash" ? Number(b.cash_balance) : Number(b.bank_balance);
  };

  const getDestBalance = () => {
    const b = transferData?.branches?.find(x => x.branch_id === formData.branch_id);
    if (!b) return 0;
    return formData.to_fund === "cash" ? Number(b.cash_balance) : Number(b.bank_balance);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.from_fund === formData.to_fund) {
      toast.error("Las cuentas de origen y destino no pueden ser las mismas");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (payload.amount <= 0) {
        toast.error("El monto debe ser mayor a 0");
        setSaving(false);
        return;
      }

      const available = getAvailableBalance();
      if (payload.amount > available) {
        toast.error(`Fondos insuficientes. Solo tienes Bs. ${available.toFixed(2)} disponibles.`);
        setSaving(false);
        return;
      }

      await transferOwnerFunds(payload);
      toast.success("Transferencia registrada con éxito");
      onSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Error al procesar transferencia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ backgroundColor: 'var(--bg-overlay)' }}>
      <div className="modal-content" style={{ maxWidth: '500px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: 'var(--text-main)', fontSize: '18px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-primary)' }}></span>
            Transferencia de Fondos
          </h2>
          <button className="modal-close" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '20px' }}>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>Sucursal</label>
            <CustomSelect name="branch_id" value={formData.branch_id} onChange={handleChange}  required style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', padding: '10px', width: '100%', outline: 'none' }}>
              {transferData?.branches?.map(b => (
                <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
              ))}
            </CustomSelect>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
            {/* ORIGEN */}
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>ORIGEN</label>
                <CustomSelect name="from_fund" value={formData.from_fund} onChange={handleChange}  style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', padding: '10px', width: '100%', outline: 'none' }}>
                    <option value="cash">Caja Física (Tienda)</option>
                    <option value="bank">Cuenta Bancaria (Marca)</option>
                </CustomSelect>
            </div>

            <ArrowRight size={24} style={{ color: 'var(--text-muted)' }} />

            {/* DESTINO */}
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>DESTINO</label>
                <CustomSelect name="to_fund" value={formData.to_fund} onChange={handleChange}  style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', padding: '10px', width: '100%', outline: 'none' }}>
                    <option value="bank">Cuenta Bancaria (Marca)</option>
                    <option value="cash">Caja Física (Tienda)</option>
                </CustomSelect>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', fontSize: '13px' }}>
            <div style={{ flex: 1, padding: '10px', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Saldo Disponible:</span>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--color-primary)' }}>Bs. {getAvailableBalance().toFixed(2)}</div>
            </div>
            <div style={{ flex: 1, padding: '10px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Saldo Actual Destino:</span>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--color-success)' }}>Bs. {getDestBalance().toFixed(2)}</div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>Monto a Transferir (Bs.)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0.01"
              name="amount" 
              value={formData.amount} 
              onChange={handleChange} 
              required 
              autoFocus
              placeholder="0.00"
              style={{ fontSize: '20px', fontWeight: 'bold', padding: '12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', width: '100%', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>Notas / Motivo</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange} 
              placeholder="Motivo de la transferencia..."
              rows="3"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', padding: '10px', width: '100%', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
            ></textarea>
          </div>

          <div className="modal-footer" style={{ padding: '20px 0 0 0', margin: 0, display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-text)', cursor: 'pointer', fontWeight: '500' }}>
              {saving ? "Procesando..." : "Confirmar Transferencia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
