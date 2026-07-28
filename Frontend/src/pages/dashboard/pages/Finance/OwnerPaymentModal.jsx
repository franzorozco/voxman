import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import { createOwnerPayment, updateOwnerPayment } from "../../../../api/admin/finance";
import { getOwners } from "../../../../api/admin/owners";
import { getBranches } from "../../../../api/admin/branches";
import { useAuthStore } from "../../../../store/authStore";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function OwnerPaymentModal({ payment, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    owner_id: "",
    branch_id: "",
    amount: "",
    payment_date: new Date().toISOString().split('T')[0],
    type: "withdrawal",
    fund_source: "cash",
    payment_method: "Efectivo",
    reference_number: `REF-${Date.now()}`,
    notes: "Registro de movimiento de capital."
  });

  const [owners, setOwners] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchOwners();
    fetchBranches();
    if (payment) {
      setFormData({
        owner_id: payment.owner_id || "",
        branch_id: payment.branch_id || "",
        amount: payment.amount || "",
        payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
        type: payment.type || "withdrawal",
        fund_source: payment.fund_source || "cash",
        payment_method: payment.payment_method || "Efectivo",
        reference_number: payment.reference_number || `REF-${Date.now()}`,
        notes: payment.notes || "Registro de movimiento de capital."
      });
    }
  }, [payment]);

  const fetchOwners = async () => {
    try {
      const res = await getOwners();
      setOwners(res.data);
      if (!payment && res.data.length > 0) {
        const myOwner = res.data.find(o => o.user_id === user?.id);
        if (myOwner) {
          setFormData(prev => ({ ...prev, owner_id: myOwner.id }));
        } else {
          setFormData(prev => ({ ...prev, owner_id: res.data[0].id }));
        }
      }
    } catch (error) {
      toast.error("Error al cargar socios");
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await getBranches();
      setBranches(res.data || res);
      if (!payment && res.data && res.data.length > 0) {
        setFormData(prev => ({ ...prev, branch_id: res.data[0].id }));
      }
    } catch (error) {
      console.error("Error al cargar sucursales", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      setErrorMsg(null);
      
      const payload = {
        ...formData,
        payment_date: new Date().toISOString().split('T')[0] // Always use current date to ensure security
      };

      if (payment) {
        await updateOwnerPayment(payment.id, payload);
        toast.success("Movimiento actualizado");
      } else {
        await createOwnerPayment(payload);
        toast.success("Movimiento registrado");
      }
      onSuccess();
    } catch (error) {
      setErrorMsg(error.response?.data?.error || error.response?.data?.message || "Error al guardar el movimiento");
      toast.error("Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal scale-in" style={{ maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', flexShrink: 0 }}>
          <h2 style={{ margin: 0, padding: 0, fontSize: '20px', border: 'none', background: 'none', WebkitTextFillColor: 'var(--text-main)' }}>
            {payment ? "Editar Movimiento" : "Registrar Movimiento"}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {errorMsg && (
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '13px' }}>
                <strong>Error:</strong> {errorMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Tipo de Movimiento</label>
                <CustomSelect name="type" value={formData.type} onChange={handleChange}>
                  <option value="withdrawal">Retiro de Capital</option>
                  <option value="deposit">Inyección de Capital</option>
                </CustomSelect>
              </div>

              <div className="form-group">
                <label>Socio</label>
                <CustomSelect name="owner_id" value={formData.owner_id} onChange={handleChange} required disabled>
                  <option value="">Seleccione un socio</option>
                  {owners.map(o => (
                    <option key={o.id} value={o.id}>{o.user?.profile?.first_name} {o.user?.profile?.last_name_paternal}</option>
                  ))}
                </CustomSelect>
                <span style={{ fontSize: '11px', color: 'var(--color-primary)' }}>Por seguridad, solo puedes operar tu cuenta.</span>
              </div>
            </div>

            <div className="form-group">
              <label>Sucursal</label>
              <CustomSelect name="branch_id" value={formData.branch_id} onChange={handleChange} required>
                <option value="">Seleccione una sucursal</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </CustomSelect>
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--color-primary)' }}>Origen / Destino de Fondos</label>
              <CustomSelect name="fund_source" value={formData.fund_source} onChange={handleChange}>
                <option value="cash">Caja Física (Tienda)</option>
                <option value="bank">Cuenta Bancaria (Marca)</option>
              </CustomSelect>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>
                {formData.type === 'withdrawal' 
                  ? "⚠️ El dinero se restará del saldo de esta cuenta en la sucursal elegida." 
                  : "✅ El dinero se sumará al saldo de esta cuenta en la sucursal elegida."}
              </span>
            </div>

            <div className="form-group">
              <label>Monto (Bs)</label>
              <input type="number" step="0.01" min="0.01" name="amount" required value={formData.amount} onChange={handleChange} placeholder="0.00" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Método de Pago</label>
                <CustomSelect name="payment_method" value={formData.payment_method} onChange={handleChange}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="QR">QR</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Otro">Otro</option>
                </CustomSelect>
              </div>

              <div className="form-group">
                <label>Nro. Referencia</label>
                <input type="text" name="reference_number" value={formData.reference_number} readOnly style={{ backgroundColor: 'var(--bg-overlay)' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Notas Adicionales</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Motivo o detalle del movimiento..." style={{ minHeight: '80px' }}></textarea>
            </div>

          </div>

          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Movimiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
