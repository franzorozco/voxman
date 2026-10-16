import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Eye, ArchiveRestore, Filter, MoreVertical, RefreshCw, Users, UserCheck, DollarSign, Briefcase } from "lucide-react";
import RowDropdown from "../../../../components/ui/RowDropdown";
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

  const activeFiltersCount = (filters.status !== "active" ? 1 : 0) + (filters.sortBy !== "created_at" ? 1 : 0);
  const hasActiveFilters = activeFiltersCount > 0 || Boolean(filters.search);

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "active",
      sortBy: "created_at"
    });
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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

  const employeeStats = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    const total = list.length;
    const active = list.filter(e => e.is_active).length;
    const totalSalary = list.reduce((sum, e) => sum + Number(e.base_salary || 0), 0);
    const uniqueRoles = new Set(list.map(e => e.role).filter(Boolean)).size;

    return { total, active, totalSalary, uniqueRoles };
  }, [employees]);

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title">Empleados</h1>
        <div style={{ display: "flex", gap: "8px", width: isMobile ? "100%" : "auto" }}>
  <Link to="/dashboard/employees/deleted" className="btn-secondary" style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', padding: '10px' }} title="Papelera">
    <ArchiveRestore size={18} />
    {!isMobile && "Papelera"}
  </Link>
  <button 
    className="btn-primary" 
    onClick={() => { setSelectedEmployee(null); setIsModalOpen(true); }}
    style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
    title="Nuevo Empleado"
  >
    <Plus size={18} />
    {!isMobile && "Nuevo"}
  </button>
  <button 
    className="btn-secondary" 
    onClick={() => fetchEmployees(filters)}
    style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
    title="Actualizar"
  >
    <RefreshCw size={18} className={loading ? "spin" : ""} />
    {!isMobile && "Actualizar"}
  </button>
</div>
      </div>

      {/* KPI Cards Normalizados */}
      <div className="employees-kpi-grid">
        <div className="employees-kpi-card kpi-total">
          <div className="employees-kpi-top">
            <span className="employees-kpi-value">{employeeStats.total}</span>
          </div>
          <div className="employees-kpi-bottom">
            <div className="employees-kpi-icon-mini">
              <Users size={14} />
            </div>
            <span className="employees-kpi-label">Total Empleados</span>
          </div>
        </div>

        <div className="employees-kpi-card kpi-active">
          <div className="employees-kpi-top">
            <span className="employees-kpi-value">{employeeStats.active}</span>
          </div>
          <div className="employees-kpi-bottom">
            <div className="employees-kpi-icon-mini">
              <UserCheck size={14} />
            </div>
            <span className="employees-kpi-label">Empleados Activos</span>
          </div>
        </div>

        <div className="employees-kpi-card kpi-salary">
          <div className="employees-kpi-top">
            <span className="employees-kpi-value">
              Bs. {employeeStats.totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="employees-kpi-bottom">
            <div className="employees-kpi-icon-mini">
              <DollarSign size={14} />
            </div>
            <span className="employees-kpi-label">Masa Salarial Base</span>
          </div>
        </div>

        <div className="employees-kpi-card kpi-roles">
          <div className="employees-kpi-top">
            <span className="employees-kpi-value">{employeeStats.uniqueRoles}</span>
          </div>
          <div className="employees-kpi-bottom">
            <div className="employees-kpi-icon-mini">
              <Briefcase size={14} />
            </div>
            <span className="employees-kpi-label">Cargos / Roles</span>
          </div>
        </div>
      </div>

      <div className="employees-filters-container">
        <div className={`employees-search-bar-row ${showFilters ? 'open' : ''}`}>
          <div className="employees-search-input-wrapper">
            <Search size={18} className="employees-search-icon" />
            <input 
              className="employees-search-input"
              placeholder="Buscar por código, email, nombre o teléfono..." 
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button 
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`employees-filter-toggle-btn ${showFilters ? 'active' : ''}`}
          >
            <Filter size={18} />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="employees-filter-badge">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="employees-filters-panel">
            <div className="employees-filter-group">
              <label>Estado</label>
              <CustomSelect 
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="active">Activos (Por defecto)</option>
                <option value="all">Todos</option>
                <option value="inactive">Inactivos</option>
              </CustomSelect>
            </div>
            
            <div className="employees-filter-group">
              <label>Ordenar Por</label>
              <CustomSelect 
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <option value="created_at">Más recientes</option>
                <option value="base_salary">Sueldo Base</option>
                <option value="hire_date">Fecha Contratación</option>
              </CustomSelect>
            </div>

            <div className="employees-filter-group employees-filter-actions">
              <label style={{ visibility: 'hidden' }}>Acción</label>
              <button
                type="button"
                onClick={handleClearFilters}
                className="employees-filter-clear-btn"
                title="Restablecer filtros"
              >
                <RefreshCw size={15} />
                <span>Limpiar Filtros</span>
              </button>
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
                <th style={{ textAlign: 'center', display: isMobile ? "none" : "table-cell" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const profile = e.user?.profile || {};
                const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''} ${profile.last_name_maternal || ''}`.trim() || 'Sin Nombre';
                
                return (
                  <tr key={e.id}>
                    <td data-label="Código" style={{ position: 'relative' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <RowDropdown rowId={e.id} activeId={activeDropdown} setActiveId={setActiveDropdown}>
          
            <button 
              onClick={() => { handleViewDetails(e); setActiveDropdown(null); }}
              style={{ background: 'transparent', border: 'none', padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)', width: '100%', fontSize: '14px' }}
            >
              <Eye size={16} /> Ver Perfil
            </button>
            <button 
              onClick={() => { handleEdit(e); setActiveDropdown(null); }}
              style={{ background: 'transparent', border: 'none', padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-primary)', width: '100%', fontSize: '14px' }}
            >
              <Edit size={16} /> Editar
            </button>
            <button 
              onClick={() => { handleDelete(e.id); setActiveDropdown(null); }}
              style={{ background: 'transparent', border: 'none', padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-danger)', width: '100%', fontSize: '14px' }}
            >
              <Trash2 size={16} /> Eliminar
            </button>
</RowDropdown>
    <span style={{ fontWeight: 600, letterSpacing: '1px', background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '4px' }}>
      {e.employee_code}
    </span>
  </div>
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
                      <span style={{ fontWeight: 500 }}>Bs. {Number(e.base_salary).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </td>
                    <td data-label="Estado">
                      <span style={{ background: 'var(--bg-overlay)', color: e.is_active ? 'var(--color-success)' : 'var(--color-danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        {e.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td data-label="Acciones" className={isMobile ? "hide-on-mobile" : ""} style={{ display: isMobile ? "none" : "table-cell" }}>
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











