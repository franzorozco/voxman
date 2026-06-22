import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, CalendarDays } from "lucide-react";
import { toast } from "react-hot-toast";
import { getExpenses, deleteExpense } from "../../../../api/admin/finance";
import ExpenseModal from "./ExpenseModal";

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await getExpenses();
      setExpenses(res.data);
    } catch (error) {
      toast.error("Error al cargar los gastos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este gasto? Esto afectará los cálculos financieros.")) return;
    try {
      await deleteExpense(id);
      toast.success("Gasto eliminado");
      fetchExpenses();
    } catch (error) {
      toast.error("Error al eliminar gasto");
    }
  };

  const getSplitTypeLabel = (type) => {
    switch(type) {
      case 'equal': return 'División 50/50';
      case 'proportional': return 'Proporcional a ventas';
      case 'single_owner': return 'Un solo dueño';
      case 'custom': return 'Personalizado';
      default: return type;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          className="btn-primary" 
          onClick={() => { setSelectedExpense(null); setIsModalOpen(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Registrar Gasto
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">Cargando gastos...</div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Monto</th>
                <th>Tipo de División</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td data-label="Fecha">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <CalendarDays size={14} />
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{new Date(e.expense_date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td data-label="Concepto">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{e.name}</span>
                      {e.description && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{e.description}</span>}
                    </div>
                  </td>
                  <td data-label="Categoría">
                    <span style={{ background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                      {e.category || 'General'}
                    </span>
                  </td>
                  <td data-label="Monto">
                    <span style={{ fontWeight: 'bold', color: '#ef4444' }}>Bs. {Number(e.amount).toFixed(2)}</span>
                  </td>
                  <td data-label="Tipo de División">
                    <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                      {getSplitTypeLabel(e.split_type)}
                    </span>
                  </td>
                  <td data-label="Estado">
                    <span style={{ background: e.status === 'paid' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: e.status === 'paid' ? '#22c55e' : '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {e.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button 
                        className="btn-secondary"
                        onClick={() => { setSelectedExpense(e); setIsModalOpen(true); }}
                        title="Editar"
                        style={{ padding: '6px' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={() => handleDelete(e.id)}
                        title="Eliminar"
                        style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No hay gastos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <ExpenseModal 
          expense={selectedExpense}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchExpenses();
          }}
        />
      )}
    </div>
  );
}
