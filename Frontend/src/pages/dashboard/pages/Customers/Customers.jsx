import { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, ArchiveRestore, Filter, Link2, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import { getCustomers, deleteCustomer, getCustomerKpis } from "../../../../api/admin/customers";
import CustomerModal from "./CustomerModal";
import CustomerDetails from "./CustomerDetails";
import LinkCustomerModal from "./LinkCustomerModal";
import "./Customers.css"; // Reuse existing UI token styles
import { Link } from "react-router-dom";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ totalCustomers: 0, activeCustomers: 0, newThisMonth: 0, totalPoints: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "active",
    minPoints: "",
    sortBy: "created_at",
    type: "all",
    tag: "",
    startDate: "",
    endDate: ""
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  
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

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const res = await getCustomerKpis();
        setKpis(res.data);
      } catch (error) {
        console.error("Error fetching KPIs", error);
      }
    };
    fetchKpis();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este cliente? Se enviará a la papelera.")) return;
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
            className="btn-secondary" 
            onClick={() => setIsLinkModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Link2 size={18} />
            <span className="hide-on-mobile">Vincular</span>
          </button>
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

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Total de Clientes</span>
          <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>{kpis.totalCustomers}</span>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Clientes Activos</span>
          <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)' }}>{kpis.activeCustomers}</span>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Nuevos (Este Mes)</span>
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>+{kpis.newThisMonth}</span>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Puntos Distribuidos</span>
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>{kpis.totalPoints}</span>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner" style={{ marginBottom: showFilters ? '15px' : '0' }}>
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
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Tipo de Cliente</label>
              <CustomSelect 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="all">Todos</option>
                <option value="web">Cliente Web</option>
                <option value="pos">Cliente POS</option>
              </CustomSelect>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Etiqueta (Tag)</label>
              <input 
                type="text"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                placeholder="Ej. VIP"
                value={filters.tag}
                onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Puntos Mínimos</label>
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
              <CustomSelect 
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <option value="created_at">MÃ¡s recientes</option>
                <option value="points">Puntos</option>
                <option value="total_purchases">Total Comprado</option>
              </CustomSelect>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Registrado Desde</label>
              <input 
                type="date"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Registrado Hasta</label>
              <input 
                type="date"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
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
                const isWebCustomer = !!c.user;
                const profile = isWebCustomer ? (c.user?.profile || {}) : (c.pos_profile || c.posProfile || {});
                const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''} ${profile.last_name_maternal || ''}`.replace(/\s+/g, ' ').trim() || 'Sin Nombre';
                const initial = profile.first_name ? profile.first_name.charAt(0).toUpperCase() : 'C';

                return (
                  <tr key={c.id}>
                    <td data-label="Código">
                      <span style={{ fontWeight: 600, letterSpacing: '1px', background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '4px' }}>
                        {c.customer_code}
                      </span>
                    </td>
                    <td data-label="Cliente">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary)', color: 'var(--color-primary-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                          {initial}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{fullName}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isWebCustomer ? '#3b82f6' : '#8b5cf6' }}></span>
                            {isWebCustomer ? 'Cliente Web' : 'Cliente Caja (POS)'}
                          </span>
                          
                          {/* Tags */}
                          {c.tags && c.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                              {c.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg-main)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '10px', fontWeight: 500 }}>{tag}</span>
                              ))}
                              {c.tags.length > 3 && (
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{c.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td data-label="Contacto">
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', color: 'var(--text-muted)', gap: '2px' }}>
                        <span style={{ color: 'var(--text-main)' }}>{c.user?.email || 'Sin Correo'}</span>
                        {profile.phone && <span>📞 {profile.phone}</span>}
                      </div>
                    </td>
                    <td data-label="Puntos">
                      <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{c.points} pts</span>
                    </td>
                    <td data-label="Total Compras">
                      <span style={{ fontWeight: 500 }}>${Number(c.total_purchases).toFixed(2)}</span>
                    </td>
                    <td data-label="Estado">
                      <span style={{ background: 'var(--bg-overlay)', color: c.is_active ? 'var(--color-success)' : 'var(--color-danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        {c.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td data-label="Acciones">
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
            fetchCustomers(filters);
          }}
        />
      )}

      {isDetailsOpen && detailsCustomer && (
        <CustomerDetails 
          customerId={detailsCustomer.id}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}

      {isLinkModalOpen && (
        <LinkCustomerModal 
          onClose={() => setIsLinkModalOpen(false)}
          onSuccess={() => {
            setIsLinkModalOpen(false);
            fetchCustomers(filters);
          }}
        />
      )}
    </div>
  );
}
