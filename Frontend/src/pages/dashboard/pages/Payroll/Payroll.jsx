import { useState, useEffect } from "react";
import { Search, DollarSign, RefreshCw, FileText, CheckCircle, Clock, XCircle, Trash2, Printer } from "lucide-react";
import { getEmployees } from "../../../../api/admin/employees";
import { calculatePayroll, payPayroll, getPayrollHistory, deletePayroll } from "../../../../api/admin/payroll";
import Spinner from "../../components/Spinner/Spinner";
import toast from "react-hot-toast";
import PayslipModal from "./PayslipModal";
import "../Employees/Employees.css";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [activeTab, setActiveTab] = useState("procesar"); // procesar | historial
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [payrollLoading, setPayrollLoading] = useState(false);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [deductions, setDeductions] = useState(0);
  const [bonuses, setBonuses] = useState(0);
  
  const [autoDeduct, setAutoDeduct] = useState(false);
  
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  useEffect(() => {
    fetchData();
  }, [month, year, activeTab]);

  const fetchData = async () => {
    if (activeTab === "procesar") {
      fetchEmployeesAndStatus();
    } else {
      fetchHistory();
    }
  };

  const fetchEmployeesAndStatus = async () => {
    try {
      setLoading(true);
      const [empRes, histRes] = await Promise.all([
        getEmployees({ status: 'active' }),
        getPayrollHistory({ month, year })
      ]);
      const activeEmps = (empRes.data || empRes).filter(e => e.is_active);
      setEmployees(activeEmps);
      setHistory(histRes.data || histRes);
    } catch (err) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await getPayrollHistory({ month, year });
      setHistory(res.data || res);
    } catch (err) {
      toast.error("Error al cargar historial");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCalculate = async (emp) => {
    setSelectedEmployee(emp);
    setDeductions(0);
    setBonuses(0);
    setAutoDeduct(false);
    
    try {
      setPayrollLoading(true);
      const res = await calculatePayroll(emp.id, month, year);
      const data = res.data || res;
      setPayrollData(data);
      
      // Auto deductions? Just suggestion
      if (data.absences_count > 0 || data.lates_count > 0) {
          // No auto deduct, user has to click checkbox
      }
    } catch (err) {
      toast.error("Error al calcular nómina");
      setSelectedEmployee(null);
    } finally {
      setPayrollLoading(false);
    }
  };

  useEffect(() => {
      if (payrollData && autoDeduct) {
          const discount = (payrollData.absences_count * payrollData.salary_per_day) + (payrollData.lates_count * (payrollData.salary_per_day / 2));
          setDeductions(parseFloat(discount.toFixed(2)));
      } else if (payrollData && !autoDeduct) {
          setDeductions(0);
      }
  }, [autoDeduct, payrollData]);

  const handlePay = async () => {
    if (!payrollData) return;
    try {
      setPayrollLoading(true);
      await payPayroll({
        employee_id: selectedEmployee.id,
        base_salary: payrollData.base_salary,
        commissions: payrollData.commissions,
        bonuses: bonuses,
        deductions: deductions,
        payment_date: new Date(year, month - 1, new Date().getDate()).toISOString()
      });
      toast.success("Pago registrado exitosamente");
      setSelectedEmployee(null);
      setPayrollData(null);
      fetchData(); // Refresh to update badge
    } catch (err) {
      toast.error("Error al registrar el pago");
    } finally {
      setPayrollLoading(false);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("¿Seguro que deseas anular este pago?")) return;
    try {
      await deletePayroll(id);
      toast.success("Pago anulado");
      fetchHistory();
    } catch (err) {
      toast.error("Error al anular pago");
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const profile = emp.user?.profile || {};
    const searchString = `${emp.employee_code} ${profile.first_name} ${profile.last_name_paternal}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const getPaymentStatus = (empId) => {
    return history.some(h => h.employee_id === empId);
  };

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title">Nómina y Pagos</h1>
        
        <div className="products-header-actions">
          <CustomSelect 
            value={month} 
            onChange={(e) => setMonth(e.target.value)}
            style={{ width: '100%' }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('es', { month: 'long' }).toUpperCase()}</option>
            ))}
          </CustomSelect>
          <input 
            type="number" 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            style={{ width: '100%', height: '42px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <button 
          className={`tab-btn ${activeTab === 'procesar' ? 'active' : ''}`}
          onClick={() => setActiveTab('procesar')}
          style={{ flex: 1, padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'procesar' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'procesar' ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: '15px', whiteSpace: 'nowrap', textAlign: 'center' }}
        >
          Procesar Pagos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
          style={{ flex: 1, padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'historial' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'historial' ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: '15px', whiteSpace: 'nowrap', textAlign: 'center' }}
        >
          Historial del Mes
        </button>
      </div>

      {activeTab === 'procesar' && (
        <div className="fade-in">
          <div className="filters-container" style={{ marginBottom: '20px' }}>
            <div className="filters-container-inner">
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
                  placeholder="Buscar empleado..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn-secondary" onClick={fetchEmployeesAndStatus} disabled={loading} style={{ padding: '10px' }}>
                <RefreshCw size={18} className={loading ? "spin" : ""} />
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>EMPLEADO</th>
                  <th>DÍA DE PAGO</th>
                  <th>SUELDO BASE</th>
                  <th className="text-right">ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center" style={{ padding: '40px' }}>
                      <Spinner size={30} color="var(--color-primary)" />
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>
                      No se encontraron empleados activos.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => {
                    const profile = emp.user?.profile || {};
                    const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''}`.trim() || 'Sin Nombre';
                    const isPaid = getPaymentStatus(emp.id);
                    const hireDay = emp.hire_date ? parseInt(emp.hire_date.split('-')[2]) : 1;
                    
                    return (
                      <tr key={emp.id} className="fade-in">
                        <td data-label="CÓDIGO"><span className="customer-code">{emp.employee_code}</span></td>
                        <td data-label="EMPLEADO">
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{fullName}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.role}</span>
                          </div>
                        </td>
                        <td data-label="DÍA DE PAGO">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                                <Clock size={14} color="var(--text-muted)" />
                                Día {hireDay} de cada mes
                            </span>
                        </td>
                        <td data-label="SUELDO BASE">Bs. {Number(emp.base_salary).toFixed(2)}</td>
                        <td className="text-right" data-label="ACCIÓN">
                          {isPaid ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                                <CheckCircle size={16} /> Pagado
                            </span>
                          ) : (
                            <button className="btn-primary" onClick={() => handleCalculate(emp)}>
                              <DollarSign size={16} /> Procesar
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="fade-in">
          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>FECHA DE PAGO</th>
                  <th>EMPLEADO</th>
                  <th>SUELDO BASE</th>
                  <th>COMISIONES</th>
                  <th>DESCUENTOS</th>
                  <th>TOTAL PAGADO</th>
                  <th className="text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center" style={{ padding: '40px' }}>
                      <Spinner size={30} color="var(--color-primary)" />
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>
                      No hay pagos registrados para este mes.
                    </td>
                  </tr>
                ) : (
                  history.map(pay => {
                    const profile = pay.employee?.user?.profile || {};
                    const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''}`.trim() || 'Sin Nombre';
                    
                    return (
                      <tr key={pay.id} className="fade-in">
                        <td data-label="FECHA DE PAGO">{new Date(pay.payment_date).toLocaleDateString()}</td>
                        <td data-label="EMPLEADO">
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{fullName}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pay.employee?.employee_code}</span>
                          </div>
                        </td>
                        <td data-label="SUELDO BASE">Bs. {Number(pay.base_salary).toFixed(2)}</td>
                        <td data-label="COMISIONES">Bs. {Number(pay.commissions).toFixed(2)}</td>
                        <td data-label="DESCUENTOS" style={{ color: '#ef4444' }}>Bs. {Number(pay.deductions).toFixed(2)}</td>
                        <td data-label="TOTAL PAGADO"><strong style={{ color: '#10b981' }}>Bs. {Number(pay.total_paid).toFixed(2)}</strong></td>
                        <td className="text-right" data-label="ACCIONES">
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button className="icon-btn" onClick={() => setSelectedPayslip(pay)} title="Ver Recibo">
                                <FileText size={18} color="var(--color-primary)" />
                              </button>
                              <button className="icon-btn" onClick={() => handleDeletePayment(pay.id)} title="Anular Pago">
                                <Trash2 size={18} color="#ef4444" />
                              </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYROLL MODAL */}
      {selectedEmployee && (
        <div className="modal-overlay fade-in">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Calcular Pago: {selectedEmployee.user?.profile?.first_name} {selectedEmployee.user?.profile?.last_name_paternal}</h3>
              <button className="btn-icon" onClick={() => setSelectedEmployee(null)}>×</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {payrollLoading || !payrollData ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Spinner size={30} color="var(--color-primary)" />
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          <strong>Ciclo a pagar:</strong> {payrollData.start_cycle} al {payrollData.end_cycle}
                      </span>
                  </div>

                  {(payrollData.absences_count > 0 || payrollData.lates_count > 0) && (
                      <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', padding: '16px', borderRadius: '12px' }}>
                          <h4 style={{ color: '#d97706', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <XCircle size={18} /> Alerta de Asistencia
                          </h4>
                          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-main)' }}>
                              En este ciclo, el empleado tuvo <strong>{payrollData.absences_count} faltas</strong> y <strong>{payrollData.lates_count} atrasos</strong>.
                              <br />(Sueldo por día aprox: Bs. {payrollData.salary_per_day.toFixed(2)})
                          </p>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 500 }}>
                              <input 
                                  type="checkbox" 
                                  checked={autoDeduct}
                                  onChange={(e) => setAutoDeduct(e.target.checked)}
                                  style={{ width: '18px', height: '18px', accentColor: '#f59e0b' }}
                              />
                              Aplicar descuento automáticamente
                          </label>
                      </div>
                  )}

                  <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', fontSize: '14px' }}>
                      <span>Sueldo Base ({payrollData.employee.contract_type || 'Mes'})</span>
                      <span style={{ fontWeight: 600 }}>Bs. {Number(payrollData.base_salary).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', fontSize: '14px' }}>
                      <span>Comisiones ({payrollData.sales_count} ventas en el ciclo)</span>
                      <span style={{ fontWeight: 600, color: '#10b981' }}>+ Bs. {Number(payrollData.commissions).toFixed(2)}</span>
                    </div>
                    
                    <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bonos Extra (Bs.)</label>
                      <input 
                        type="number" 
                        value={bonuses} 
                        onChange={(e) => setBonuses(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                        style={{ padding: '12px 16px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '15px', width: '100%', outline: 'none' }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deducciones / Faltas (Bs.)</label>
                      <input 
                        type="number" 
                        value={deductions} 
                        onChange={(e) => setDeductions(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                        style={{ padding: '12px 16px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '15px', width: '100%', outline: 'none' }}
                      />
                    </div>

                    <div style={{ background: 'var(--color-primary)', padding: '16px', borderRadius: '8px', color: 'var(--color-primary-text)', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL A PAGAR:</span>
                      <span style={{ fontSize: '20px', fontWeight: 800 }}>Bs. {(Number(payrollData.base_salary) + Number(payrollData.commissions) + Number(bonuses) - Number(deductions)).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSelectedEmployee(null)}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handlePay}
                disabled={payrollLoading || !payrollData}
              >
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPayslip && (
          <PayslipModal payment={selectedPayslip} onClose={() => setSelectedPayslip(null)} />
      )}
    </div>
  );
}
