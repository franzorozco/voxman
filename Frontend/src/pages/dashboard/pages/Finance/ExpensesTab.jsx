import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, CalendarDays, CheckCircle, Archive, XCircle, List, History, Eye, Building } from "lucide-react";
import { toast } from "react-hot-toast";
import { getExpenses, deleteExpense, createExpense, payExpenseSplit, archiveExpense, annulExpense } from "../../../../api/admin/finance";
import { getBranches } from "../../../../api/admin/branches";
import ExpenseModal from "./ExpenseModal";
import ExpenseDetailModal from "./ExpenseDetailModal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { es } from "date-fns/locale";
import { useAuthStore } from "../../../../store/authStore";

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isQuickPayModalOpen, setIsQuickPayModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [viewMode, setViewMode] = useState('general'); // 'general' | 'kardex'
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [selectedBranch, startDate, endDate]);

  const fetchBranches = async () => {
    try {
      const res = await getBranches();
      setBranches(res.data || res);
    } catch (error) {
      console.error("Error cargando sucursales", error);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const params = { branch_id: selectedBranch };
      if (startDate && endDate) {
        params.start_date = startDate.toISOString();
        params.end_date = endDate.toISOString();
      }
      
      const res = await getExpenses(params);
      setExpenses(res.data);
    } catch (error) {
      toast.error("Error al cargar los gastos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este gasto pendiente?")) return;
    try {
      await deleteExpense(id);
      toast.success("Gasto eliminado");
      fetchInitialData();
    } catch (error) {
      toast.error("Error al eliminar gasto");
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm("¿Archivar este gasto? Desaparecerá de esta vista pero mantendrá los cálculos financieros intactos en el Kardex.")) return;
    try {
      await archiveExpense(id);
      toast.success("Gasto archivado");
      fetchInitialData();
    } catch (error) {
      toast.error("Error al archivar gasto");
    }
  };

  const handleAnnul = async (id) => {
    if (!window.confirm("¿Estás seguro de anular este gasto? El dinero regresará a la tesorería.")) return;
    try {
      await annulExpense(id);
      toast.success("Gasto anulado correctamente");
      fetchInitialData();
    } catch (error) {
      toast.error("Error al anular gasto");
    }
  };

  const isRecent = (dateStr) => {
    const diff = new Date() - new Date(dateStr);
    return diff <= 24 * 60 * 60 * 1000;
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

  const calculateDebtSummary = () => {
    const summary = {};
    expenses.forEach(exp => {
      if (exp.status === 'pending' && exp.expense_splits) {
        exp.expense_splits.forEach(split => {
          if (split.status !== 'paid') {
            const ownerName = [split.owner?.user?.profile?.first_name, split.owner?.user?.profile?.last_name_paternal].filter(Boolean).join(' ') || 'Desconocido';
            if (!summary[ownerName]) summary[ownerName] = 0;
            summary[ownerName] += Number(split.amount);
          }
        });
      }
    });
    return summary;
  };

  const debtSummary = calculateDebtSummary();

  const getKardexData = () => {
    let ledger = [];
    expenses.forEach(e => {
      if (e.expense_splits) {
        e.expense_splits.forEach(s => {
          if (s.status === 'paid' || s.status === 'archived' || s.status === 'annulled') {
            ledger.push({
              id: s.id,
              expense_id: e.id,
              date: s.paid_at || e.expense_date,
              expenseName: e.name,
              category: e.category,
              ownerName: [s.owner?.user?.profile?.first_name, s.owner?.user?.profile?.last_name_paternal].filter(Boolean).join(' ') || 'Desconocido',
              amount: s.amount,
              fund_source: s.fund_source || e.fund_source || 'cash',
              status: s.status,
              created_at: e.created_at,
              branchName: e.branch?.name || 'Global',
              rawExpense: e
            });
          }
        });
      }
    });
    return ledger.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getExpensesByCategory = () => {
    const categories = {};
    expenses.forEach(exp => {
      const cat = exp.category || 'Otros';
      if (!categories[cat]) categories[cat] = 0;
      categories[cat] += Number(exp.amount);
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };
  const categoryData = getExpensesByCategory();
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Resumen de Deudas */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Resumen de Deudas Pendientes (Por Socio)
        </h3>
        {Object.keys(debtSummary).length > 0 ? (
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {Object.entries(debtSummary).map(([name, total]) => (
              <div key={name} style={{ background: 'var(--bg-overlay)', padding: '15px', borderRadius: '10px', minWidth: '200px', flex: 1, border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: 'var(--text-muted)' }}>{name}</p>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>Bs. {total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>No hay deudas pendientes registradas.</p>
        )}
      </div>

      {/* Gráfico de Distribución de Gastos */}
      {categoryData.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: 'var(--text-main)' }}>Distribución de Gastos por Categoría</h3>
          <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => `Bs. ${value.toFixed(2)}`} contentStyle={{ backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="responsive-header">
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-overlay)', padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setViewMode('general')}
            style={{ 
              padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '13px',
              background: viewMode === 'general' ? 'var(--bg-card)' : 'transparent',
              color: viewMode === 'general' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: viewMode === 'general' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <List size={16} /> Vista General
          </button>
          <button 
            onClick={() => setViewMode('kardex')}
            style={{ 
              padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '13px',
              background: viewMode === 'kardex' ? 'var(--bg-card)' : 'transparent',
              color: viewMode === 'kardex' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: viewMode === 'kardex' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <History size={16} /> Kardex de Pagos
          </button>
        </div>

        <div className="responsive-filters">
          <div style={{ zIndex: 10 }}>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              isClearable={true}
              locale={es}
              placeholderText="Filtrar fechas..."
              className="form-control"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building size={20} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={selectedBranch} 
              onChange={(e) => setSelectedBranch(e.target.value)} 
              className="form-control"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', minWidth: '200px' }}
            >
              <option value="all">Todas las Sucursales</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => { setSelectedExpense(null); setIsModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            Registrar Gasto
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">Cargando datos...</div>
        ) : viewMode === 'general' ? (
          <div className="table-responsive">
          <table className="products-table">
            <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Sucursal</th>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th>Monto</th>
                  <th>Tipo de División</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expenses.filter(e => e.status !== 'archived').map((e) => (
                  <tr key={e.id}>
                    <td data-label="Fecha">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                        <CalendarDays size={14} />
                        <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{new Date(e.expense_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td data-label="Sucursal">
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{e.branch?.name || 'Global'}</span>
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
                      <span style={{ 
                        background: e.status === 'paid' ? 'rgba(34, 197, 94, 0.1)' : e.status === 'annulled' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                        color: e.status === 'paid' ? '#22c55e' : e.status === 'annulled' ? '#64748b' : '#f59e0b', 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' 
                      }}>
                        {e.status === 'paid' ? 'Pagado' : e.status === 'annulled' ? 'Anulado' : 'Pendiente'}
                      </span>
                    </td>
                    <td data-label="Acciones">
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      {e.status === 'pending' && (
                        (() => {
                          const mySplit = e.expense_splits?.find(s => s.owner?.user_id === user?.id);
                          const hasPaidMySplit = mySplit?.status === 'paid';
                          
                          return (
                            <button 
                              className="btn-primary"
                              onClick={() => { setSelectedExpense({...e, status: 'paid', fund_source: 'cash'}); setIsQuickPayModalOpen(true); }}
                              title="Pagar ahora"
                              disabled={hasPaidMySplit}
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', opacity: hasPaidMySplit ? 0.5 : 1, cursor: hasPaidMySplit ? 'not-allowed' : 'pointer' }}
                            >
                              <CheckCircle size={16} /> Pagar
                            </button>
                          );
                        })()
                      )}
                      
                      <button 
                        onClick={() => { setSelectedExpense(e); setIsDetailModalOpen(true); }}
                        title="Ver Detalles"
                        style={{ padding: '6px', background: 'var(--bg-overlay)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Eye size={16} />
                      </button>

                      {e.status !== 'annulled' && (
                        <button 
                          className="btn-secondary"
                          onClick={() => { setSelectedExpense(e); setIsModalOpen(true); }}
                          title="Editar"
                          style={{ padding: '6px' }}
                        >
                          <Edit size={16} />
                        </button>
                      )}

                      {e.status === 'pending' && (
                        <button 
                          className="btn-danger"
                          onClick={() => handleDelete(e.id)}
                          title="Eliminar Gasto Pendiente"
                          style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      {e.status === 'paid' && isRecent(e.created_at) && (
                        <button 
                          onClick={() => handleAnnul(e.id)}
                          title="Anular Gasto (Devolver saldo)"
                          style={{ padding: '6px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <XCircle size={16} />
                        </button>
                      )}

                      {e.status === 'paid' && !isRecent(e.created_at) && (
                        <button 
                          onClick={() => handleArchive(e.id)}
                          title="Archivar Gasto (Ocultar)"
                          style={{ padding: '6px', background: 'rgba(100, 116, 139, 0.1)', color: '#64748b', border: '1px solid rgba(100, 116, 139, 0.2)', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <Archive size={16} />
                        </button>
                      )}

                    </div>
                  </td>
                </tr>
              ))}
              {expenses.filter(e => e.status !== 'archived').length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No hay gastos activos en la vista general.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        ) : (
          <div className="table-responsive">
          <table className="products-table">
            <thead>
              <tr>
                <th>Fecha de Pago</th>
                <th>Sucursal</th>
                <th>Concepto</th>
                <th>Socio</th>
                <th>Fondo</th>
                <th>Monto</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {getKardexData().map((tx, idx) => (
                <tr key={idx} style={{ opacity: tx.status === 'annulled' ? 0.6 : 1 }}>
                  <td>{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                    {tx.branchName}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {tx.expenseName}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{tx.category}</div>
                  </td>
                  <td>{tx.ownerName}</td>
                  <td>
                    <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                      {tx.fund_source === 'cash' ? 'Caja Física' : tx.fund_source === 'bank' ? 'Cuenta Bancaria' : 'N/A'}
                    </span>
                  </td>
                  <td style={{ color: tx.status === 'annulled' ? 'var(--text-muted)' : '#ef4444', fontWeight: 'bold' }}>
                    Bs. {Number(tx.amount).toFixed(2)}
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
                      background: tx.status === 'paid' ? 'rgba(34, 197, 94, 0.1)' : 
                                  tx.status === 'archived' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                      color: tx.status === 'paid' ? '#22c55e' : 
                             tx.status === 'archived' ? '#3b82f6' : '#64748b'
                    }}>
                      {tx.status === 'paid' ? 'Pagado' : tx.status === 'archived' ? 'Archivado' : 'Anulado'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => { setSelectedExpense(tx.rawExpense); setIsDetailModalOpen(true); }}
                      title="Ver Detalles"
                      style={{ padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)' }}
                    >
                      <Eye size={16} style={{ color: 'var(--color-primary-text)' }} />
                    </button>
                  </td>
                </tr>
              ))}
              {getKardexData().length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No hay historial de pagos en el Kardex.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <ExpenseDetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => { setIsDetailModalOpen(false); setSelectedExpense(null); }} 
        expense={selectedExpense} 
      />

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

      {isQuickPayModalOpen && (
        <ExpenseModal 
          expense={selectedExpense}
          isQuickPay={true}
          onClose={() => setIsQuickPayModalOpen(false)}
          onSuccess={() => {
            setIsQuickPayModalOpen(false);
            fetchExpenses();
          }}
        />
      )}
    </div>
  );
}
