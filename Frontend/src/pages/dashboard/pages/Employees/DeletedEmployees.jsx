import { useState, useEffect } from "react";
import { ArrowLeft, Search, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { getDeletedEmployees, restoreEmployee } from "../../../../api/admin/employees";
import "./Employees.css";
import { Link } from "react-router-dom";

export default function DeletedEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDeleted = async (search = "") => {
    try {
      setLoading(true);
      const res = await getDeletedEmployees({ search });
      setEmployees(res.data);
    } catch (error) {
      toast.error("Error al cargar empleados eliminados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted(searchQuery);
  }, [searchQuery]);

  const handleRestore = async (id) => {
    if (!window.confirm("¿Estás seguro de restaurar este empleado? Volverá a estar activo.")) return;
    try {
      await restoreEmployee(id);
      toast.success("Empleado restaurado exitosamente");
      fetchDeleted(searchQuery);
    } catch (error) {
      toast.error("Error al restaurar el empleado");
    }
  };

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard/employees" style={{ color: 'var(--text-muted)', display: 'flex', padding: '8px', background: 'var(--bg-card)', borderRadius: '8px', textDecoration: 'none' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="products-title">Papelera de Empleados</h1>
        </div>
      </div>

      <div className="products-controls">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar en papelera..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">Cargando papelera...</div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Empleado</th>
                <th>Contacto</th>
                <th>Desactivado el</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const profile = e.user?.profile || {};
                const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''} ${profile.last_name_maternal || ''}`.trim() || 'Sin Nombre';
                
                return (
                  <tr key={e.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                        {e.employee_code}
                      </span>
                    </td>
                    <td style={{ opacity: 0.6 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-main)', textDecoration: 'line-through' }}>{fullName}</span>
                      </div>
                    </td>
                    <td style={{ opacity: 0.6 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                        <span>{e.user?.email || 'S/E'}</span>
                        {e.phone && <span>Tel: {e.phone}</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ color: '#ef4444', fontSize: '13px' }}>
                        {new Date(e.deleted_at).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          className="btn-primary"
                          onClick={() => handleRestore(e.id)}
                          title="Restaurar"
                          style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                        >
                          <RefreshCw size={16} /> Restaurar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <Trash2 size={48} style={{ opacity: 0.2 }} />
                      <p>La papelera está vacía</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
