import { useState, useEffect } from "react";
import { Search, DollarSign, RefreshCw, FileText, CheckCircle } from "lucide-react";
import { getEmployees } from "../../../../api/admin/employees";
import { calculatePayroll, payPayroll } from "../../../../api/admin/payroll";
import Spinner from "../../components/Spinner/Spinner";
import toast from "react-hot-toast";
import "../Employees/Employees.css"; // Reuse the styling

export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [payrollLoading, setPayrollLoading] = useState(false);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [deductions, setDeductions] = useState(0);
  const [bonuses, setBonuses] = useState(0);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await getEmployees({ status: 'active' });
      setEmployees(res.data || res);
    } catch (err) {
      toast.error("Error al cargar empleados");
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async (emp) => {
    setSelectedEmployee(emp);
    setDeductions(0);
    setBonuses(0);
    try {
      setPayrollLoading(true);
      const res = await calculatePayroll(emp.id, month, year);
      setPayrollData(res.data || res);
    } catch (err) {
      toast.error("Error al calcular nómina");
      setSelectedEmployee(null);
    } finally {
      setPayrollLoading(false);
    }
  };

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
        payment_date: new Date().toISOString()
      });
      toast.success("Pago registrado exitosamente");
      setSelectedEmployee(null);
      setPayrollData(null);
    } catch (err) {
      toast.error("Error al registrar el pago");
    } finally {
      setPayrollLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const profile = emp.user?.profile || {};
    const searchString = `${emp.employee_code} ${profile.first_name} ${profile.last_name_paternal}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title">Nómina y Pagos</h1>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <select 
            value={month} 
            onChange={(e) => setMonth(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('es', { month: 'long' }).toUpperCase()}</option>
            ))}
          </select>
          <input 
            type="number" 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            style={{ width: '80px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
          />
        </div>
      </div>

      <div className="table-container fade-in" style={{ marginTop: '20px' }}>
        <div className="filters-container" style={{ marginBottom: '20px' }}>
          <div className="filters-container-inner">
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
                placeholder="Buscar por nombre o código..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn-secondary" onClick={fetchEmployees} disabled={loading} style={{ padding: '10px' }}>
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>EMPLEADO</th>
                <th>SUELDO BASE</th>
                <th>% COMISIÓN</th>
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
                  return (
                    <tr key={emp.id} className="fade-in">
                      <td><span className="customer-code">{emp.employee_code}</span></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{fullName}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.role}</span>
                        </div>
                      </td>
                      <td>Bs. {Number(emp.base_salary).toFixed(2)}</td>
                      <td>{Number(emp.commission_percentage).toFixed(2)}%</td>
                      <td className="text-right">
                        <button className="btn-primary" onClick={() => handleCalculate(emp)}>
                          <DollarSign size={16} /> Procesar
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  {payrollData.already_paid && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <CheckCircle size={18} />
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>Este empleado ya tiene un pago registrado este mes.</span>
                    </div>
                  )}

                  <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', fontSize: '14px' }}>
                      <span>Sueldo Base ({payrollData.employee.contract_type || 'Mes'})</span>
                      <span style={{ fontWeight: 600 }}>Bs. {Number(payrollData.base_salary).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', fontSize: '14px' }}>
                      <span>Comisiones ({payrollData.sales_count} ventas)</span>
                      <span style={{ fontWeight: 600, color: '#10b981' }}>+ Bs. {Number(payrollData.commissions).toFixed(2)}</span>
                    </div>
                    
                    <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
                    
                    <div className="form-group">
                      <label>Bonos Extra (Bs.)</label>
                      <input 
                        type="number" 
                        value={bonuses} 
                        onChange={(e) => setBonuses(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Deducciones / Faltas (Bs.)</label>
                      <input 
                        type="number" 
                        value={deductions} 
                        onChange={(e) => setDeductions(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div style={{ background: 'var(--color-primary)', padding: '16px', borderRadius: '8px', color: 'white', marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold' }}>
                        <span>TOTAL A PAGAR:</span>
                        <span>Bs. {(Number(payrollData.base_salary) + Number(payrollData.commissions) + Number(bonuses) - Number(deductions)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setSelectedEmployee(null)}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handlePay}
                disabled={payrollLoading || !payrollData}
              >
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
