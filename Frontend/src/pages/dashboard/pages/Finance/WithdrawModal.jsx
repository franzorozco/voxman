import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { createOwnerPayment } from "../../../../api/admin/finance";
import { toast } from "react-hot-toast";

export default function WithdrawModal({ isOpen, onClose, onSuccess, initialData }) {
  const [formData, setFormData] = useState({
    owner_id: "",
    amount: "",
    fund_source: "cash",
    payment_method: "",
    reference_number: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        owner_id: initialData.owner_id || "",
        amount: "",
        fund_source: "cash",
        payment_method: "",
        reference_number: "",
        notes: ""
      });
    }
  }, [isOpen, initialData]);

  const maxBalance = formData.fund_source === 'cash' 
    ? Number(initialData?.cash_balance || 0) 
    : Number(initialData?.bank_balance || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      toast.error("Por favor, ingresa un monto válido mayor a 0.");
      return;
    }
    
    // Check balance
    if (Number(formData.amount) > maxBalance) {
      toast.error(`El monto supera el saldo disponible en ${formData.fund_source === 'cash' ? 'Caja' : 'Banco'} (Bs. ${maxBalance.toFixed(2)}).`);
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
                Fondo a Retirar <span className="text-danger">*</span>
              </label>
              <select 
                className="form-control" 
                value={formData.fund_source}
                onChange={(e) => setFormData({ ...formData, fund_source: e.target.value })}
                required
              >
                <option value="cash">Caja Física (Tienda)</option>
                <option value="bank">Cuenta Bancaria</option>
              </select>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-overlay)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Saldo Disponible en {formData.fund_source === 'cash' ? 'Caja' : 'Banco'}:</p>
              <h3 style={{ margin: 0, fontSize: '28px', color: 'var(--text-main)', fontWeight: 700 }}>Bs. {maxBalance.toFixed(2)}</h3>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Monto a Retirar (Bs) <span className="text-danger">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className="form-control" 
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max={maxBalance}
                  required
                  style={{ paddingLeft: '40px', fontSize: '18px', fontWeight: 'bold' }}
                />
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>Bs.</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Método de Pago</label>
                <input type="text" className="form-control" value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} placeholder="Ej. Transferencia" />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nro. Referencia</label>
                <input type="text" className="form-control" value={formData.reference_number} onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} placeholder="Ej. 123456" />
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
