import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Eye, ArchiveRestore, Filter } from "lucide-react";
import { toast } from "react-hot-toast";
import { getEmployees, deleteEmployee } from "../../../../api/admin/employees";
import EmployeeModal from "./EmployeeModal";
import EmployeeDetails from "./EmployeeDetails";
import "./Employees.css"; 
import { Link } from "react-router-dom";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "active",
    sortBy: "created_at"
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsEmployee, setDetailsEmployee] = useState(null);

  const fetchEmployees = async (currentFilters) => {
    try {
      setLoading(true);
      const res = await getEmployees(currentFilters);
      setEmployees(res.data);
    } catch (error) {
      toast.error("Error al cargar empleados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(filters);
  }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de desactivar este empleado? Se enviará a la papelera.")) return;
    try {
      await deleteEmployee(id);
      toast.success("Empleado desactivado y enviado a la papelera");
      fetchEmployees(filters);
    } catch (error) {
      toast.error("Error al desactivar empleado");
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleViewDetails = (employee) => {
    setDetailsEmployee(employee);
    setIsDetailsOpen(true);
  };

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title">Empleados</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/dashboard/employees/deleted" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <ArchiveRestore size={18} />
            Papelera
          </Link>
          <button 
            className="btn-primary" 
            onClick={() => { setSelectedEmployee(null); setIsModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            Nuevo Empleado
          </button>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner" style={{ marginBottom: showFilters ? '15px' : '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar por código, email, nombre o teléfono..." 
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: showFilters ? 'var(--color-primary)' : 'var(--bg-card)', color: showFilters ? 'var(--color-primary-text)' : 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
          >
            <Filter size={18} />
            <span className="hide-on-mobile">Filtros</span>
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado</label>
              <CustomSelect 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="active">Activos (Por defecto)</option>
                <option value="all">Todos</option>
                <option value="inactive">Inactivos</option>
              </CustomSelect>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Ordenar Por</label>
              <CustomSelect 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <option value="created_at">Más recientes</option>
                <option value="base_salary">Sueldo Base</option>
                <option value="hire_date">Fecha Contratación</option>
              </CustomSelect>
            </div>
          </div>
        )}
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">Cargando empleados...</div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Empleado</th>
                <th>Rol</th>
                <th>Contacto</th>
                <th>Sueldo Base</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const profile = e.user?.profile || {};
                const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''} ${profile.last_name_maternal || ''}`.trim() || 'Sin Nombre';
                
                return (
                  <tr key={e.id}>
                    <td data-label="Código">
                      <span style={{ fontWeight: 600, letterSpacing: '1px', background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '4px' }}>
                        {e.employee_code}
                      </span>
                    </td>
                    <td data-label="Empleado">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{fullName}</span>
                      </div>
                    </td>
                    <td data-label="Rol">
                      <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{e.role || 'N/A'}</span>
                    </td>
                    <td data-label="Contacto">
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>{e.user?.email || 'S/E'}</span>
                        {e.phone && <span>Tel: {e.phone}</span>}
                      </div>
                    </td>
                    <td data-label="Sueldo Base">
                      <span style={{ fontWeight: 500 }}>Bs. {Number(e.base_salary).toFixed(2)}</span>
                    </td>
                    <td data-label="Estado">
                      <span style={{ background: 'var(--bg-overlay)', color: e.is_active ? 'var(--color-success)' : 'var(--color-danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        {e.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          className="btn-secondary"
                          onClick={() => handleViewDetails(e)}
                          title="Ver Perfil"
                          style={{ padding: '6px' }}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="btn-secondary"
                          onClick={() => handleEdit(e)}
                          title="Editar"
                          style={{ padding: '6px' }}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn-danger"
                          onClick={() => handleDelete(e.id)}
                          title="Desactivar"
                          style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No se encontraron empleados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <EmployeeModal 
          employee={selectedEmployee}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchEmployees(filters);
          }}
        />
      )}

      {isDetailsOpen && detailsEmployee && (
        <EmployeeDetails 
          employee={detailsEmployee}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}
    </div>
  );
}
