import { useState, useEffect } from "react";
import { Search, Clock, Calendar, RefreshCw, Plus, Edit, Trash2, CalendarDays, List as ListIcon, ShieldAlert, Filter } from "lucide-react";
import { getAttendances, deleteAttendance } from "../../../../api/admin/attendances";
import { getEmployees } from "../../../../api/admin/employees";
import Spinner from "../../components/Spinner/Spinner";
import toast from "react-hot-toast";
import AttendanceModal from "./AttendanceModal";
import "../Employees/Employees.css"; 

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function Attendances() {
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [viewMode, setViewMode] = useState("daily"); // daily | monthly
  const [selectedEmployeeForMonth, setSelectedEmployeeForMonth] = useState("");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterDate, filterMonth, viewMode, selectedEmployeeForMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Always fetch employees to calculate stats and show dropdown
      const empRes = await getEmployees();
      const allEmps = empRes.data || empRes;
      setEmployees(allEmps.filter(e => e.is_active));

      // Fetch attendances based on view
      if (viewMode === 'daily') {
        const attRes = await getAttendances({ date: filterDate });
        setAttendances(attRes.data || attRes);
      } else {
        if (!selectedEmployeeForMonth) {
          setAttendances([]);
          return;
        }
        // In a real app, backend should support filtering by month and employee_id.
        // For now, we fetch a range if possible, or we filter on frontend if the backend returns all for that employee.
        const attRes = await getAttendances({ employee_id: selectedEmployeeForMonth });
        const allAtts = attRes.data || attRes;
        // Filter by month
        const filtered = allAtts.filter(a => a.date.startsWith(filterMonth));
        setAttendances(filtered);
      }
    } catch (err) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este registro?")) return;
    try {
      await deleteAttendance(id);
      toast.success("Registro eliminado");
      fetchData();
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  const handleEdit = (att) => {
    setSelectedAttendance(att);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAttendance(null);
    setModalOpen(true);
  };

  const filteredAttendances = attendances.filter(att => {
    const profile = att.employee?.user?.profile || {};
    const searchString = `${att.employee?.employee_code} ${profile.first_name} ${profile.last_name_paternal} ${att.notes}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  // Calculate KPIs for daily view
  const activeEmployeesCount = employees.length;
  const presentCount = attendances.filter(a => a.status === 'present').length;
  const lateCount = attendances.filter(a => a.status === 'late').length;
  const excusedCount = attendances.filter(a => a.status === 'excused').length;
  const totalAttended = presentCount + lateCount + excusedCount;
  const absentCount = Math.max(0, activeEmployeesCount - totalAttended);

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title">Control de Asistencia</h1>
        
        <div className="products-header-actions stacked-mobile">
          <button className="btn-primary" onClick={handleAddNew} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={18} /> Registrar Manual
          </button>
          <div className="view-mode-toggle" style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <button 
              className={viewMode === 'daily' ? 'btn-primary' : ''} 
              style={{ padding: '8px 16px', border: 'none', background: viewMode === 'daily' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'daily' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1 }}
              onClick={() => setViewMode('daily')}
            >
              <Calendar size={16} /> Diario
            </button>
            <button 
              className={viewMode === 'monthly' ? 'btn-primary' : ''} 
              style={{ padding: '8px 16px', border: 'none', background: viewMode === 'monthly' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'monthly' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1 }}
              onClick={() => setViewMode('monthly')}
            >
              <CalendarDays size={16} /> Mensual
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'daily' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase' }}>Empleados Activos</span>
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>{activeEmployeesCount}</span>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid #10b981', display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase' }}>Presentes (A tiempo)</span>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#10b981', marginTop: '8px' }}>{presentCount}</span>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid #f59e0b', display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase' }}>Atrasos</span>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b', marginTop: '8px' }}>{lateCount}</span>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid #ef4444', display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase' }}>Ausentes / Faltas</span>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444', marginTop: '8px' }}>{absentCount}</span>
          </div>
        </div>
      )}

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner" style={{ marginBottom: showFilters ? '15px' : '0', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar por nombre, código o notas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: showFilters ? 'var(--color-primary)' : 'var(--bg-card)', color: showFilters ? 'var(--color-primary-text)' : 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
          >
            <Filter size={18} />
            <span className="hide-on-mobile">Filtros</span>
          </button>
          <button className="btn-secondary" onClick={fetchData} disabled={loading} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer' }}>
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease' }}>
            {viewMode === 'daily' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Fecha</label>
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                />
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Mes</label>
                  <input 
                    type="month" 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Empleado</label>
                  <CustomSelect 
                    value={selectedEmployeeForMonth}
                    onChange={(e) => setSelectedEmployeeForMonth(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                  >
                    <option value="">Todos los empleados...</option>
                    {employees.map(emp => {
                      const profile = emp.user?.profile || {};
                      const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''}`.trim() || 'Sin Nombre';
                      return <option key={emp.id} value={emp.id}>{fullName}</option>;
                    })}
                  </CustomSelect>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="table-container fade-in">
        <div className="table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                {viewMode === 'daily' && <th>CÓDIGO</th>}
                {viewMode === 'daily' && <th>EMPLEADO</th>}
                {viewMode === 'monthly' && <th>FECHA</th>}
                <th>ENTRADA</th>
                <th>SALIDA</th>
                <th>ESTADO</th>
                <th>NOTAS</th>
                <th style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={viewMode === 'daily' ? "7" : "6"} className="text-center" style={{ padding: '40px' }}>
                    <Spinner size={30} color="var(--color-primary)" />
                  </td>
                </tr>
              ) : filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === 'daily' ? "7" : "6"} className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>
                    {viewMode === 'monthly' && !selectedEmployeeForMonth ? 'Selecciona un empleado para ver su historial mensual.' : 'No hay registros de asistencia para esta selección.'}
                  </td>
                </tr>
              ) : (
                filteredAttendances.map(att => {
                  const profile = att.employee?.user?.profile || {};
                  const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''}`.trim() || 'Sin Nombre';
                  return (
                    <tr key={att.id} className="fade-in">
                      {viewMode === 'daily' && <td data-label="CÓDIGO"><span className="customer-code">{att.employee?.employee_code}</span></td>}
                      {viewMode === 'daily' && <td data-label="EMPLEADO"><span style={{ fontWeight: 600 }}>{fullName}</span></td>}
                      
                      {viewMode === 'monthly' && (
                        <td data-label="FECHA"><span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(att.date + 'T00:00:00').toLocaleDateString()}</span></td>
                      )}

                      <td data-label="ENTRADA">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', justifyContent: 'flex-end' }}>
                          <Clock size={16} color="#10b981" />
                          {att.check_in ? new Date(att.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                        </div>
                      </td>
                      <td data-label="SALIDA">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', justifyContent: 'flex-end' }}>
                          <Clock size={16} color="#ef4444" />
                          {att.check_out ? new Date(att.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                        </div>
                      </td>
                      <td data-label="ESTADO">
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: 'bold', 
                          background: att.status === 'late' ? 'rgba(245, 158, 11, 0.1)' : att.status === 'absent' ? 'rgba(239, 68, 68, 0.1)' : att.status === 'excused' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: att.status === 'late' ? '#f59e0b' : att.status === 'absent' ? '#ef4444' : att.status === 'excused' ? '#3b82f6' : '#10b981'
                        }}>
                          {att.status === 'late' ? 'Atraso' : att.status === 'absent' ? 'Falta' : att.status === 'excused' ? 'Permiso/Licencia' : 'A Tiempo'}
                        </span>
                      </td>
                      <td data-label="NOTAS">
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '200px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {att.notes || '-'}
                        </span>
                      </td>
                      <td data-label="ACCIONES" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button className="icon-btn" onClick={() => handleEdit(att)} title="Editar Asistencia">
                            <Edit size={16} color="var(--color-primary)" />
                          </button>
                          <button className="icon-btn" onClick={() => handleDelete(att.id)} title="Eliminar Registro">
                            <Trash2 size={16} color="#ef4444" />
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

      {modalOpen && (
        <AttendanceModal 
          attendance={selectedAttendance} 
          initialDate={viewMode === 'daily' ? filterDate : null}
          onClose={() => setModalOpen(false)} 
          onSuccess={() => {
            setModalOpen(false);
            fetchData();
          }} 
        />
      )}
    </div>
  );
}
