import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import { createExpense, updateExpense } from "../../../../api/admin/finance";
import { getOwners } from "../../../../api/admin/owners";

export default function ExpenseModal({ expense, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split('T')[0],
    category: "General",
    status: "paid",
    split_type: "equal",
    owner_id: "",
    splits: []
  });

  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOwners();
    if (expense) {
      setFormData({
        name: expense.name || "",
        description: expense.description || "",
        amount: expense.amount || "",
        expense_date: expense.expense_date ? expense.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
        category: expense.category || "General",
        status: expense.status || "paid",
        split_type: expense.split_type || "equal",
        owner_id: expense.split_type === 'single_owner' && expense.expense_splits?.length ? expense.expense_splits[0].owner_id : "",
        splits: expense.split_type === 'custom' ? expense.expense_splits.map(s => ({ owner_id: s.owner_id, amount: s.amount })) : []
      });
    }
  }, [expense]);

  const fetchOwners = async () => {
    try {
      const res = await getOwners();
      setOwners(res.data);
      if (!expense && res.data.length > 0) {
        setFormData(prev => ({ ...prev, owner_id: res.data[0].id }));
      }
    } catch (error) {
      toast.error("Error al cargar socios");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomSplitChange = (ownerId, amount) => {
    const newSplits = [...formData.splits];
    const index = newSplits.findIndex(s => s.owner_id === ownerId);
    if (index >= 0) {
      newSplits[index].amount = amount;
    } else {
      newSplits.push({ owner_id: ownerId, amount });
    }
    setFormData({ ...formData, splits: newSplits });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let dataToSend = { ...formData };
      
      if (formData.split_type === 'custom') {
        const totalCustom = formData.splits.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        if (Math.abs(totalCustom - Number(formData.amount)) > 0.01) {
          toast.error("La suma de la división personalizada no coincide con el monto total del gasto.");
          setLoading(false);
          return;
        }
      }

      if (expense) {
        await updateExpense(expense.id, dataToSend);
        toast.success("Gasto actualizado");
      } else {
        await createExpense(dataToSend);
        toast.success("Gasto registrado");
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al guardar el gasto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal scale-in" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <h2 style={{ margin: 0, padding: 0, fontSize: '20px', border: 'none', background: 'none', WebkitTextFillColor: 'var(--text-main)' }}>
            {expense ? "Editar Gasto" : "Registrar Gasto"}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group">
              <label>Concepto / Nombre del Gasto</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Ej. Alquiler Local" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Monto (Bs)</label>
                <input type="number" step="0.01" min="0" name="amount" required value={formData.amount} onChange={handleChange} placeholder="0.00" />
              </div>

              <div className="form-group">
                <label>Fecha del Gasto</label>
                <input type="date" name="expense_date" required value={formData.expense_date} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Categoría</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="General">General</option>
                  <option value="Alquiler">Alquiler</option>
                  <option value="Servicios">Servicios (Luz, Agua, Internet)</option>
                  <option value="Marketing">Marketing / Publicidad</option>
                  <option value="Insumos">Insumos de Tienda</option>
                  <option value="Planilla">Planilla / Sueldos</option>
                </select>
              </div>

              <div className="form-group">
                <label>Estado de Pago</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="paid">Pagado</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Descripción (Opcional)</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Detalles adicionales..." style={{ minHeight: '80px' }}></textarea>
            </div>

            <div style={{ background: 'var(--bg-overlay)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div className="form-group">
                <label style={{ color: 'var(--color-primary)' }}>¿Cómo se divide este gasto entre los socios?</label>
                <select name="split_type" value={formData.split_type} onChange={handleChange}>
                  <option value="equal">Dividir en partes iguales (50/50)</option>
                  <option value="proportional">Dividir proporcional a las ventas del mes</option>
                  <option value="single_owner">Lo asume un solo socio al 100%</option>
                  <option value="custom">Personalizado (Monto exacto por socio)</option>
                </select>
              </div>

              {formData.split_type === 'single_owner' && (
                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label>Seleccionar Socio que asume el gasto</label>
                  <select name="owner_id" value={formData.owner_id} onChange={handleChange} required>
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>{o.user?.profile?.first_name} {o.user?.profile?.last_name_paternal}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.split_type === 'custom' && (
                <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Asignación Manual (Bs)</label>
                  {owners.map(o => {
                    const splitValue = formData.splits.find(s => s.owner_id === o.id)?.amount || '';
                    return (
                      <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ flex: 1, fontSize: '14px' }}>{o.user?.profile?.first_name} {o.user?.profile?.last_name_paternal}</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00" 
                          value={splitValue}
                          onChange={(e) => handleCustomSplitChange(o.id, e.target.value)}
                          style={{ width: '120px', height: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                        />
                      </div>
                    )
                  })}
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>
                    Suma total debe ser: Bs. {formData.amount || 0}
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Gasto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
