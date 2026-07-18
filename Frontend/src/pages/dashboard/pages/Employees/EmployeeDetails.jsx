import { useState, useEffect } from "react";
import { X, User, Phone, Mail, Building, Briefcase, Calendar, DollarSign, Percent, Info, TrendingUp, Activity, ShoppingCart, List, ShieldCheck, Wallet, Banknote, Plus, Save } from "lucide-react";
import { getEmployeeById, getEmployeeStats, assignRoleToEmployee } from "../../../../api/admin/employees";
import { toast } from "react-hot-toast";
import Spinner from "../../components/Spinner/Spinner";

export default function EmployeeDetails({ employee, onClose }) {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile"); // profile | performance | finances | permissions

  const [selectedRole, setSelectedRole] = useState("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const fetchEmployeeData = async () => {
    try {
      const resData = await getEmployeeById(employee.id);
      setData(resData.data || resData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resData, resStats] = await Promise.all([
          getEmployeeById(employee.id),
          getEmployeeStats(employee.id)
        ]);
        setData(resData.data || resData);
        setStats(resStats.data || resStats);
        
        // Initialize selectedRole to current role
        if (resData && resData.data && resData.data.employee && resData.data.employee.role) {
            setSelectedRole(resData.data.employee.role);
        } else if (resData && resData.employee && resData.employee.role) {
            setSelectedRole(resData.employee.role);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employee]);

  const handleAssignRole = async () => {
    if (!selectedRole) return;
    setIsUpdatingRole(true);
    try {
      await assignRoleToEmployee(employee.id, selectedRole);
      toast.success("Rol asignado correctamente");
      await fetchEmployeeData();
    } catch (err) {
      toast.error("Error al asignar rol");
    } finally {
      setIsUpdatingRole(false);
    }
  };



  if (loading || !data || !stats) {
    return (
      <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'flex-end', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
        <div className="slide-panel slide-in-right" style={{ width: '400px', background: 'var(--bg-main)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size={30} color="var(--color-primary)" />
        </div>
      </div>
    );
  }
  const employeeData = data.employee;
  const directPermissions = data.direct_permissions || [];
  const rolePermissions = data.role_permissions || [];
  const allPermissions = data.all_permissions || [];
  const payments = data.payments || [];

  const profile = employeeData.user?.profile || {};
  const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''} ${profile.last_name_maternal || ''}`.trim() || 'Sin Nombre';

  // Chart calculation
  const maxSales = stats.chart_data.reduce((max, item) => item.total_sales > max ? item.total_sales : max, 0);

  return (
    <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'flex-end', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
      <div className="slide-panel slide-in-right" style={{ width: '100%', maxWidth: '650px', background: 'var(--bg-main)', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 30px rgba(0,0,0,0.3)' }}>
        
        {/* HEADER */}
        <div style={{ padding: '24px 24px 0 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={24} color="var(--color-primary)" />
                Expediente de Empleado
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Código: {employeeData.employee_code}</span>
            </div>
            <button onClick={onClose} style={{ background: 'var(--bg-overlay)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', padding: '8px', borderRadius: '50%' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '1px' }} className="hide-scrollbar">
            <button 
              onClick={() => setActiveTab("profile")}
              style={{ padding: '10px 4px', whiteSpace: 'nowrap', background: 'transparent', border: 'none', borderBottom: activeTab === 'profile' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: activeTab === 'profile' ? 600 : 500, cursor: 'pointer', transition: '0.2s', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <User size={16} /> Perfil Laboral
            </button>
            <button 
              onClick={() => setActiveTab("performance")}
              style={{ padding: '10px 4px', whiteSpace: 'nowrap', background: 'transparent', border: 'none', borderBottom: activeTab === 'performance' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'performance' ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: activeTab === 'performance' ? 600 : 500, cursor: 'pointer', transition: '0.2s', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <TrendingUp size={16} /> Rendimiento
            </button>
            <button 
              onClick={() => setActiveTab("finances")}
              style={{ padding: '10px 4px', whiteSpace: 'nowrap', background: 'transparent', border: 'none', borderBottom: activeTab === 'finances' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'finances' ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: activeTab === 'finances' ? 600 : 500, cursor: 'pointer', transition: '0.2s', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Wallet size={16} /> Finanzas y Pagos
            </button>
            <button 
              onClick={() => setActiveTab("permissions")}
              style={{ padding: '10px 4px', whiteSpace: 'nowrap', background: 'transparent', border: 'none', borderBottom: activeTab === 'permissions' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'permissions' ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: activeTab === 'permissions' ? 600 : 500, cursor: 'pointer', transition: '0.2s', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ShieldCheck size={16} /> Accesos
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {activeTab === 'profile' && (
            <div className="fade-in">
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', margin: '0 auto 16px' }}>
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <h3 style={{ fontSize: '1.5rem', margin: '0 0 8px 0', color: 'var(--text-main)' }}>{fullName}</h3>
                <span style={{ background: employeeData.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: employeeData.is_active ? '#10b981' : '#ef4444', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: `1px solid ${employeeData.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                  {employeeData.is_active ? 'Activo en el sistema' : 'Inactivo / Baja'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Contact Info */}
                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={16} /> Información de Contacto
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Mail size={18} color="var(--color-primary)" />
                      <span style={{ color: 'var(--text-main)', fontSize: '14px' }}>{employeeData.user?.email || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Phone size={18} color="var(--color-primary)" />
                      <span style={{ color: 'var(--text-main)', fontSize: '14px' }}>{employeeData.phone || profile.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Employment Info */}
                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={16} /> Información Laboral
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Building size={18} color="var(--color-primary)" />
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Sucursal</span>
                        <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: 500 }}>{employeeData.branch?.name || 'Sin Asignar'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Briefcase size={18} color="var(--color-primary)" />
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Rol / Cargo</span>
                        <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>{employeeData.role || 'N/A'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Calendar size={18} color="var(--color-primary)" />
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Fecha de Contratación</span>
                        <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: 500 }}>{employeeData.hire_date ? new Date(employeeData.hire_date).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Compensations Info */}
                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} /> Compensaciones Estáticas
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <DollarSign size={18} color="var(--color-primary)" style={{ marginTop: '2px' }} />
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Sueldo Base</span>
                        <span style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: 'bold' }}>Bs. {Number(employeeData.base_salary).toFixed(2)}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <Percent size={18} color="var(--color-primary)" style={{ marginTop: '2px' }} />
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Comisión Base</span>
                        <span style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: 'bold' }}>{Number(employeeData.commission_percentage).toFixed(2)}%</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="fade-in">
              <h3 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--color-primary)" />
                Resumen del Mes Actual
              </h3>
              
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)', border: '1px solid rgba(99,102,241,0.2)', padding: '20px', borderRadius: '16px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Ventas Totales (Mes)</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>Bs. {Number(stats.current_month.total_sales).toFixed(2)}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontWeight: 500 }}>
                    <ShoppingCart size={14} /> {stats.current_month.sales_count} tickets cerrados
                  </span>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(20,184,166,0.1) 100%)', border: '1px solid rgba(16,185,129,0.2)', padding: '20px', borderRadius: '16px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Comisión Estimada</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>Bs. {Number(stats.current_month.estimated_commissions).toFixed(2)}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontWeight: 500 }}>
                    <Percent size={14} /> al {stats.current_month.commission_percentage}% pactado
                  </span>
                </div>
              </div>

              {/* Chart */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} /> Histórico de Ventas (6 Meses)
                </h4>
                
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', gap: '12px', paddingBottom: '10px' }}>
                  {stats.chart_data.map((item, idx) => {
                    const heightPercent = maxSales > 0 ? (item.total_sales / maxSales) * 100 : 0;
                    return (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', position: 'relative', justifyContent: 'center' }}>
                          <div 
                            style={{ 
                              width: '40%', 
                              minWidth: '20px',
                              height: `${heightPercent}%`, 
                              background: 'var(--color-primary)', 
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.5s ease-out',
                              minHeight: heightPercent > 0 ? '4px' : '0'
                            }} 
                            title={`Bs. ${item.total_sales.toFixed(2)}`}
                          />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Sales */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <List size={16} /> Últimas 5 Ventas
                </h4>
                
                {stats.recent_sales.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No hay ventas registradas.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.recent_sales.map(sale => (
                      <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: 500, display: 'block' }}>Factura: {sale.invoice_number || 'N/A'}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(sale.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: 'bold', display: 'block' }}>Bs. {Number(sale.total).toFixed(2)}</span>
                          <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 500 }}>+ Bs. {(Number(sale.total) * (stats.current_month.commission_percentage / 100)).toFixed(2)} com.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'finances' && (
            <div className="fade-in">
              <h3 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} color="var(--color-primary)" />
                Historial de Pagos y Finanzas
              </h3>

              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(20,184,166,0.1) 100%)', border: '1px solid rgba(16,185,129,0.2)', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Comisiones Generadas (Mes Actual)</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>Bs. {Number(stats.current_month.estimated_commissions).toFixed(2)}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#059669', display: 'block', marginTop: '8px' }}>
                  Pendiente de pago junto con sueldo base.
                </span>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Banknote size={16} /> Últimos Pagos Registrados
                </h4>
                
                {payments.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No hay historial de pagos registrados para este empleado.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {payments.map(payment => (
                      <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: 500, display: 'block' }}>Pago de Nómina</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(payment.payment_date).toLocaleDateString()}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: 'bold', display: 'block' }}>Bs. {Number(payment.total_paid).toFixed(2)}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 500 }}>Base: {Number(payment.base_salary).toFixed(2)} | Com: {Number(payment.commissions).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="fade-in">
              <h3 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="var(--color-primary)" />
                Gestión de Roles y Permisos
              </h3>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Rol del Empleado</h4>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
                  El rol define el conjunto de permisos y accesos que el empleado tiene en el sistema.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <select 
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    disabled={isUpdatingRole}
                  >
                    <option value="">Selecciona un rol...</option>
                    {(data.all_roles || []).map(r => (
                      <option key={r.name} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleAssignRole}
                    disabled={!selectedRole || selectedRole === employeeData.role || isUpdatingRole}
                    className="btn-primary" 
                    style={{ padding: '0 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!selectedRole || selectedRole === employeeData.role || isUpdatingRole) ? 0.5 : 1, cursor: (!selectedRole || selectedRole === employeeData.role || isUpdatingRole) ? 'not-allowed' : 'pointer', border: 'none' }}
                  >
                    {isUpdatingRole ? <Spinner size={16} color="#ffffff" /> : <><Save size={16} /> Guardar</>}
                  </button>
                </div>

                {selectedRole && (
                  <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed var(--border-color)' }}>
                    <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      Permisos incluidos en el rol <strong>{selectedRole}</strong>:
                    </h4>
                    
                    {(() => {
                      const roleObj = (data.all_roles || []).find(r => r.name === selectedRole);
                      const perms = roleObj ? roleObj.permissions : [];
                      
                      if (perms.length === 0) {
                        return <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Este rol no tiene permisos asignados.</span>;
                      }

                      return (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {perms.map((perm, idx) => (
                            <span key={idx} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
                              {perm}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
