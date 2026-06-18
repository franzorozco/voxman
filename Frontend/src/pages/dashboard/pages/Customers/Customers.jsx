import { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, ArchiveRestore, Filter } from "lucide-react";
import { toast } from "react-hot-toast";
import { getCustomers, deleteCustomer } from "../../../../api/admin/customers";
import CustomerModal from "./CustomerModal";
import CustomerDetails from "./CustomerDetails";
import "./Customers.css"; // Reuse existing UI token styles
import { Link } from "react-router-dom";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    minPoints: "",
    sortBy: "created_at"
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsCustomer, setDetailsCustomer] = useState(null);

  const fetchCustomers = async (currentFilters) => {
    try {
      setLoading(true);
      const res = await getCustomers(currentFilters);
      setCustomers(res.data);
    } catch (error) {
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(filters);
  }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm("Â¿EstÃ¡s seguro de eliminar este cliente? Se enviarÃ¡ a la papelera.")) return;
    try {
      await deleteCustomer(id);
      toast.success("Cliente enviado a la papelera");
      fetchCustomers(filters);
    } catch (error) {
      toast.error("Error al eliminar cliente");
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleViewDetails = (customer) => {
    setDetailsCustomer(customer);
    setIsDetailsOpen(true);
  };

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title">Clientes</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/dashboard/clients/deleted" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <ArchiveRestore size={18} />
            Papelera
          </Link>
          <button 
            className="btn-primary" 
            onClick={() => { setSelectedCustomer(null); setIsModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: showFilters ? '15px' : '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar por cÃ³digo, email, nombre o CI/DNI..." 
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: showFilters ? 'var(--primary-color)' : 'var(--bg-card)', color: showFilters ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
          >
            <Filter size={18} />
            <span className="hide-on-mobile">Filtros</span>
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado</label>
              <select 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Puntos MÃ­nimos</label>
              <input 
                type="number"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                placeholder="Ej. 100"
                value={filters.minPoints}
                onChange={(e) => setFilters({ ...filters, minPoints: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Ordenar Por</label>
              <select 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <option value="created_at">MÃ¡s recientes</option>
                <option value="points">Puntos</option>
                <option value="total_purchases">Total Comprado</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">Cargando clientes...</div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>CÃ³digo</th>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Puntos</th>
                <th>Total Compras</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const profile = c.user?.profile || {};
                const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''}`.trim() || 'Sin Nombre';
                
                return (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontWeight: 600, letterSpacing: '1px', background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '4px' }}>
                        {c.customer_code}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{fullName}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>{c.user?.email || 'S/E'}</span>
                        {profile.phone && <span>Tel: {profile.phone}</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{c.points} pts</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>${Number(c.total_purchases).toFixed(2)}</span>
                    </td>
                    <td>
                      <span className={`status-badge status-active`}>
                        Activo
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          className="btn-secondary"
                          onClick={() => handleViewDetails(c)}
                          title="Ver Expediente"
                          style={{ padding: '6px' }}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="btn-secondary"
                          onClick={() => handleEdit(c)}
                          title="Editar"
                          style={{ padding: '6px' }}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn-danger"
                          onClick={() => handleDelete(c.id)}
                          title="Eliminar"
                          style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No se encontraron clientes activos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <CustomerModal 
          customer={selectedCustomer}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchCustomers(searchQuery);
          }}
        />
      )}

      {isDetailsOpen && detailsCustomer && (
        <CustomerDetails 
          customerId={detailsCustomer.id}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}
    </div>
  );
}
