import { useState, useEffect } from "react";
import { Search, Clock, Calendar, RefreshCw } from "lucide-react";
import { getAttendances } from "../../../../api/admin/attendances";
import Spinner from "../../components/Spinner/Spinner";
import toast from "react-hot-toast";
import "../Employees/Employees.css"; // Reuse styling

export default function Attendances() {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAttendances();
  }, [filterDate]);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const res = await getAttendances({ date: filterDate });
      setAttendances(res.data || res);
    } catch (err) {
      toast.error("Error al cargar asistencias");
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendances = attendances.filter(att => {
    const profile = att.employee?.user?.profile || {};
    const searchString = `${att.employee?.employee_code} ${profile.first_name} ${profile.last_name_paternal}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title">Control de Asistencia</h1>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Calendar size={20} color="var(--text-muted)" />
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
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
            <button className="btn-secondary" onClick={fetchAttendances} disabled={loading} style={{ padding: '10px' }}>
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
                <th>ENTRADA (CHECK-IN)</th>
                <th>SALIDA (CHECK-OUT)</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center" style={{ padding: '40px' }}>
                    <Spinner size={30} color="var(--color-primary)" />
                  </td>
                </tr>
              ) : filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>
                    No hay registros de asistencia para esta fecha.
                  </td>
                </tr>
              ) : (
                filteredAttendances.map(att => {
                  const profile = att.employee?.user?.profile || {};
                  const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''}`.trim() || 'Sin Nombre';
                  return (
                    <tr key={att.id} className="fade-in">
                      <td><span className="customer-code">{att.employee?.employee_code}</span></td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{fullName}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                          <Clock size={16} color="#10b981" />
                          {att.check_in ? new Date(att.check_in).toLocaleTimeString() : '--:--'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                          <Clock size={16} color="#ef4444" />
                          {att.check_out ? new Date(att.check_out).toLocaleTimeString() : '--:--'}
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: 'bold', 
                          background: att.status === 'late' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: att.status === 'late' ? '#f59e0b' : '#10b981'
                        }}>
                          {att.status === 'late' ? 'Atraso' : 'A Tiempo'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
