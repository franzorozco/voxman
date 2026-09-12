import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import { createExpense, updateExpense, payExpenseSplit } from "../../../../api/admin/finance";
import { getOwners } from "../../../../api/admin/owners";
import { useAuthStore } from "../../../../store/authStore";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function ExpenseModal({ expense, onClose, onSuccess, isQuickPay = false }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split('T')[0],
    category: "General",
    status: "pending",
    split_type: "equal",
    owner_id: "",
    splits: [],
    is_recurring: false,
    recurrence_interval: "monthly",
    fund_source: "",
    deducted_from_wallet: true
  });

  const [owners, setOwners] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [splitLoadingId, setSplitLoadingId] = useState(null);
  const [splitError, setSplitError] = useState(null);
  
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (isQuickPay) {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isQuickPay]);

  useEffect(() => {
    fetchOwners();
    fetchBranches();
    if (expense) {
      setFormData({
        branch_id: expense.branch_id || "",
        name: expense.name || "",
        description: expense.description || "",
        amount: expense.amount || "",
        expense_date: expense.expense_date ? expense.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
        category: expense.category || "General",
        status: expense.status || "pending",
        split_type: expense.split_type || "equal",
        owner_id: expense.split_type === 'single_owner' && expense.expense_splits?.length ? expense.expense_splits[0].owner_id : "",
        splits: expense.split_type === 'custom' ? expense.expense_splits.map(s => ({ owner_id: s.owner_id, amount: s.amount })) : [],
        is_recurring: expense.is_recurring || false,
        recurrence_interval: expense.recurrence_interval || "monthly",
        fund_source: expense.fund_source || "",
        deducted_from_wallet: true
      });
    }
  }, [expense]);

  const fetchBranches = async () => {
    try {
      // Usa fetch o getBranches si lo importas
      const { getBranches } = await import('../../../../api/admin/branches');
      const res = await getBranches();
      setBranches(res.data || res);
      if (!expense && res.data && res.data.length > 0) {
        setFormData(prev => ({ ...prev, branch_id: res.data[0].id }));
      }
    } catch (error) {
      console.error("Error al cargar sucursales", error);
    }
  };

  const fetchOwners = async () => {
    try {
      const { data } = await getOwners();
      setOwners(data.filter(o => o.is_active !== false)); // Default to active if undefined
    } catch (error) {
      toast.error("Error al cargar socios");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCustomSplitChange = (ownerId, amount) => {
    setFormData(prev => {
      const newSplits = [...prev.splits];
      const index = newSplits.findIndex(s => s.owner_id === ownerId);
      if (index >= 0) {
        newSplits[index].amount = amount;
      } else {
        newSplits.push({ owner_id: ownerId, amount });
      }
      return { ...prev, splits: newSplits };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = { ...formData };
      
      // Clean up empty strings
      if (dataToSend.owner_id === "") delete dataToSend.owner_id;
      if (dataToSend.fund_source === "") delete dataToSend.fund_source;
      if (dataToSend.splits && dataToSend.splits.length === 0) delete dataToSend.splits;
      if (dataToSend.recurrence_interval === "") delete dataToSend.recurrence_interval;
      
      if (formData.status === 'paid' && formData.deducted_from_wallet && !formData.fund_source) {
        toast.error("Debes seleccionar de qué cuenta saldrá el dinero (Caja o Banco).");
        setLoading(false);
        return;
      }

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
      console.error(error.response?.data);
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0][0];
        toast.error(firstError);
      } else {
        toast.error(error.response?.data?.error || error.response?.data?.message || "Error al guardar el gasto");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaySplit = async (splitId, deductedFromWallet, fundSource, branchId) => {
    setSplitError(null);
    if (deductedFromWallet && !fundSource) {
      setSplitError("Debes seleccionar de qué cuenta saldrá el dinero (Caja o Banco).");
      return;
    }
    if (deductedFromWallet && !branchId) {
      setSplitError("Debes seleccionar de qué sucursal se hará el descuento.");
      return;
    }
    
    try {
      setSplitLoadingId(splitId);
      await payExpenseSplit(splitId, { 
        deducted_from_wallet: deductedFromWallet,
        fund_source: fundSource,
        branch_id: branchId
      });
      toast.success("Cuota pagada correctamente");
      onSuccess();
    } catch (error) {
      setSplitError(error.response?.data?.error || "Error al procesar el pago");
    } finally {
      setSplitLoadingId(null);
    }
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal scale-in" style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', flexShrink: 0 }}>
          <h2 style={{ margin: 0, padding: 0, fontSize: '20px', border: 'none', background: 'none', WebkitTextFillColor: 'var(--text-main)' }}>
            {isQuickPay ? "Pagar Gasto" : (expense ? "Editar Gasto" : "Registrar Gasto")}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {isQuickPay ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'var(--bg-overlay)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{formData.name}</h3>
                  <p style={{ margin: '0 0 15px 0', color: 'var(--text-muted)', fontSize: '14px' }}>Monto a pagar: <strong style={{ color: '#ef4444' }}>Bs. {Number(formData.amount).toFixed(2)}</strong></p>
                  
                  {expense && expense.expense_splits && expense.expense_splits.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p style={{ margin: '0', fontSize: '13px', fontWeight: 600 }}>Desglose de aportes por socio:</p>
                      {expense.expense_splits.map((s, idx) => {
                        const ownerUserId = s.owner?.user_id;
                        const isMySplit = user?.id === ownerUserId;
                        return (
                          <div key={idx} style={{ background: 'var(--bg-card)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 500 }}>{s.owner?.user?.profile?.first_name} {s.owner?.user?.profile?.last_name_paternal}</span>
                              <strong style={{ color: '#ef4444', fontSize: '16px' }}>Bs. {Number(s.amount).toFixed(2)}</strong>
                            </div>
                            
                            {s.status === 'paid' ? (
                              <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                                PAGADO
                              </div>
                            ) : isMySplit ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px', paddingTop: '15px', borderTop: '1px dashed var(--border-color)' }}>
                                
                                {splitError && (
                                  <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '13px' }}>
                                    <strong>Error:</strong> {splitError}
                                  </div>
                                )}

                                <div>
                                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px', display: 'block' }}>¿Cómo realizarás este pago?</label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div 
                                      onClick={() => { setFormData({...formData, deducted_from_wallet: false}); setSplitError(null); }}
                                      style={{ padding: '12px', borderRadius: '8px', border: !formData.deducted_from_wallet ? '2px solid var(--color-primary)' : '1px solid var(--border-color)', background: !formData.deducted_from_wallet ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-card)', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                      <strong style={{ color: !formData.deducted_from_wallet ? 'var(--color-primary)' : 'var(--text-main)', display: 'block', fontSize: '14px' }}>💳 Lo pagué de mi bolsillo</strong>
                                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Solo marcar como pagado. No se descontará dinero de la tienda.</span>
                                    </div>

                                    <div 
                                      onClick={() => { setFormData({...formData, deducted_from_wallet: true}); setSplitError(null); }}
                                      style={{ padding: '12px', borderRadius: '8px', border: formData.deducted_from_wallet ? '2px solid var(--color-danger)' : '1px solid var(--border-color)', background: formData.deducted_from_wallet ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-card)', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                      <strong style={{ color: formData.deducted_from_wallet ? 'var(--color-danger)' : 'var(--text-main)', display: 'block', fontSize: '14px' }}>🏪 Sacar dinero de la tienda</strong>
                                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>El dinero se restará físicamente de la Caja o Banco de la tienda seleccionada.</span>
                                    </div>
                                  </div>
                                </div>

                                {formData.deducted_from_wallet && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ padding: '12px', background: 'var(--bg-overlay)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
                                        ¿De qué cuenta se pagará tu cuota?
                                      </label>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div 
                                          onClick={() => setFormData({...formData, fund_source: 'cash'})}
                                          style={{ padding: '10px', borderRadius: '6px', border: formData.fund_source === 'cash' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)', background: formData.fund_source === 'cash' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-input)', cursor: 'pointer', textAlign: 'center', fontSize: '13px', color: formData.fund_source === 'cash' ? 'var(--color-primary)' : 'var(--text-main)', fontWeight: formData.fund_source === 'cash' ? 600 : 400, transition: 'all 0.2s ease' }}
                                        >
                                          Caja Física
                                        </div>
                                        <div 
                                          onClick={() => setFormData({...formData, fund_source: 'bank'})}
                                          style={{ padding: '10px', borderRadius: '6px', border: formData.fund_source === 'bank' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)', background: formData.fund_source === 'bank' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-input)', cursor: 'pointer', textAlign: 'center', fontSize: '13px', color: formData.fund_source === 'bank' ? 'var(--color-primary)' : 'var(--text-main)', fontWeight: formData.fund_source === 'bank' ? 600 : 400, transition: 'all 0.2s ease' }}
                                        >
                                          Cuenta Bancaria
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div style={{ padding: '12px', background: 'var(--bg-overlay)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
                                        ¿De qué sucursal se hará el descuento?
                                      </label>
                                      <CustomSelect 
                                        
                                        value={formData.branch_id || ""}
                                        onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                                      >
                                        <option value="">Seleccione una sucursal</option>
                                        {branches.map(b => (
                                          <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                      </CustomSelect>
                                    </div>
                                  </div>
                                )}

                                <button 
                                  type="button" 
                                  className="btn-primary" 
                                  style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 'bold' }}
                                  disabled={splitLoadingId === s.id || countdown > 0 || (formData.deducted_from_wallet && (!formData.fund_source || !formData.branch_id))}
                                  onClick={() => handlePaySplit(s.id, formData.deducted_from_wallet, formData.fund_source, formData.branch_id)}
                                >
                                  {splitLoadingId === s.id 
                                    ? 'Procesando...' 
                                    : (countdown > 0 ? `Revisa los datos (${countdown}s)` : 'Confirmar Pago de mi Cuota')
                                  }
                                </button>
                              </div>
                            ) : (
                              <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                                PENDIENTE DE PAGO
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay un desglose de socios para este gasto.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                    <label>Concepto / Nombre del Gasto</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Ej. Alquiler Local" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Monto (Bs)</label>
                    <input type="number" step="0.01" min="0" name="amount" required value={formData.amount} onChange={handleChange} placeholder="0.00" />
                  </div>

                  <div className="form-group">
                    <label>Categoría</label>
                    <CustomSelect name="category" value={formData.category} onChange={handleChange}>
                      <option value="General">General</option>
                      <option value="Alquiler">Alquiler</option>
                      <option value="Servicios">Servicios (Luz, Agua, Internet)</option>
                      <option value="Marketing">Marketing / Publicidad</option>
                      <option value="Insumos">Insumos de Tienda</option>
                      <option value="Planilla">Planilla / Sueldos</option>
                    </CustomSelect>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Estado de Pago</label>
                    <CustomSelect name="status" value={formData.status} onChange={handleChange}>
                      <option value="pending">Pendiente</option>
                      <option value="paid">Pagado</option>
                    </CustomSelect>
                  </div>

                  {formData.status === 'paid' && (
                    <div className="form-group">
                      <label style={{ color: 'var(--color-primary)' }}>Origen de Fondos <span className="text-danger">*</span></label>
                      <CustomSelect name="fund_source" value={formData.fund_source} onChange={handleChange} required>
                        <option value="">Selecciona de dónde salió el dinero</option>
                        <option value="cash">Caja Física (Dinero en Tienda)</option>
                        <option value="bank">Cuenta Bancaria (Transferencia)</option>
                      </CustomSelect>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                        Para mantener el saldo real cuadrando con el sistema.
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--bg-overlay)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: formData.is_recurring ? '1fr 1fr' : '1fr', gap: '15px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>
                        {formData.is_recurring ? "Fecha del Primer Cobro" : "Fecha del Gasto"}
                      </label>
                      <input type="date" name="expense_date" required value={formData.expense_date} onChange={handleChange} />
                    </div>
                    {formData.is_recurring && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Frecuencia de Recurrencia</label>
                        <CustomSelect name="recurrence_interval" value={formData.recurrence_interval} onChange={handleChange}>
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensual</option>
                          <option value="yearly">Anual</option>
                        </CustomSelect>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="is_recurring" 
                      name="is_recurring" 
                      checked={formData.is_recurring} 
                      onChange={handleChange}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="is_recurring" style={{ color: 'var(--color-primary)', cursor: 'pointer', margin: 0 }}>¿Es un Gasto Recurrente?</label>
                  </div>
                  
                  {formData.is_recurring && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      A partir de la fecha seleccionada, al marcar este gasto como pagado, se generará automáticamente el gasto del próximo ciclo en estado "Pendiente".
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Descripción (Opcional)</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Detalles adicionales..." style={{ minHeight: '80px' }}></textarea>
                </div>

                <div style={{ background: 'var(--bg-overlay)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div className="form-group">
                    <label style={{ color: 'var(--color-primary)' }}>¿Cómo se divide este gasto entre los socios?</label>
                    <CustomSelect name="split_type" value={formData.split_type} onChange={handleChange}>
                      <option value="equal">Dividir en partes iguales (50/50)</option>
                      <option value="proportional">Dividir proporcional a las ventas del mes</option>
                      <option value="single_owner">Lo asume un solo socio al 100%</option>
                      <option value="custom">Personalizado (Monto exacto por socio)</option>
                    </CustomSelect>
                  </div>

                  {formData.split_type === 'single_owner' && (
                    <div className="form-group" style={{ marginTop: '15px' }}>
                      <label>Seleccionar Socio que asume el gasto</label>
                      <CustomSelect name="owner_id" value={formData.owner_id} onChange={handleChange} required>
                        {owners.map(o => (
                          <option key={o.id} value={o.id}>{o.user?.profile?.first_name} {o.user?.profile?.last_name_paternal}</option>
                        ))}
                      </CustomSelect>
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
              </>
            )}

          </div>

          <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-overlay)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading || splitLoadingId}>
              Cancelar
            </button>
            {!isQuickPay && (
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || (formData.status === 'paid' && formData.deducted_from_wallet && !formData.fund_source)}
                onClick={handleSubmit}
              >
                {loading ? "Guardando..." : (expense ? "Actualizar Gasto" : "Registrar Gasto")}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
