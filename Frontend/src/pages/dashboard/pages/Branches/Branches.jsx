import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getBranches, deleteBranch } from "../../../../api/admin/branches";
import { LayoutGrid, List, MapPin, Phone, User, Edit2, Trash2, Search, Filter } from "lucide-react";
import ConfirmModal from "../../../../components/ui/ConfirmModal";
import BranchFormModal from "./BranchFormModal";
import CanAccess from "../../../../components/ui/CanAccess";
import "./Branches.css";
import { API_BASE_URL } from "../../../../config/api";
import toast from "react-hot-toast";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
  });
  const [viewMode, setViewMode] = useState("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const loadBranches = async () => {
    try {
      setLoading(true);
      const res = await getBranches(search);
      setBranches(res.data || res || []);
    } catch (error) {
      console.error("Error cargando sucursales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, [search]);

  const handleCreate = () => {
    setSelectedBranch(null);
    setIsModalOpen(true);
  };

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteBranch(id);
      toast.success("Sucursal eliminada a la papelera");
      loadBranches();
    } catch (error) {
      console.error("Error eliminando sucursal:", error);
      toast.error(error.response?.data?.message || "No se pudo eliminar la sucursal");
    }
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    loadBranches();
  };

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      if (filters.status === "active" && !b.is_active) return false;
      if (filters.status === "inactive" && b.is_active) return false;
      return true;
    });
  }, [branches, filters]);

  return (
    <div className="branches-container">
      <div className="branches-header">
        <h1 className="branches-title">Sucursales</h1>

        <div className="branches-actions">
          <CanAccess permission="create_branches">
            <button className="btn-primary" onClick={handleCreate}>
              + Nueva Sucursal
            </button>
          </CanAccess>

          <CanAccess permission="view_branches">
            <Link 
              to="/dashboard/branches/deleted"
              className="btn-secondary" 
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            >
              <Trash2 size={16} /> Papelera
            </Link>
          </CanAccess>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: showFilters ? '15px' : '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar sucursal por nombre o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: showFilters ? 'var(--color-primary)' : 'var(--bg-card)', color: showFilters ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
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
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="all">Todas</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </CustomSelect>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div className="view-toggle-segmented" style={{ display: 'inline-flex', background: 'var(--bg-input)', padding: '4px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setViewMode('grid')}
            title="Vista de Cuadrícula"
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', border: 'none', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s ease',
              background: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent', 
              color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--text-muted)',
              boxShadow: viewMode === 'grid' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              fontWeight: viewMode === 'grid' ? '600' : '500'
            }}
          >
            <LayoutGrid size={18} style={{ marginRight: '6px' }} /> Tarjetas
          </button>
          <button 
            onClick={() => setViewMode('table')}
            title="Vista de Lista"
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', border: 'none', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s ease',
              background: viewMode === 'table' ? 'var(--bg-card)' : 'transparent', 
              color: viewMode === 'table' ? 'var(--color-primary)' : 'var(--text-muted)',
              boxShadow: viewMode === 'table' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              fontWeight: viewMode === 'table' ? '600' : '500'
            }}
          >
            <List size={18} style={{ marginRight: '6px' }} /> Lista
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando sucursales...</div>
      ) : filteredBranches.length === 0 ? (
        <div className="empty-state">No se encontraron sucursales.</div>
      ) : viewMode === "grid" ? (
        <div className="branches-grid">
          {filteredBranches.map((branch) => {
            const primaryImage = branch.images?.find(img => img.is_primary)?.image_url 
              || branch.images?.[0]?.image_url 
              || "/storage/branches/default.png";
              
            const imageUrl = primaryImage.startsWith("http") ? primaryImage : `${API_BASE_URL}${primaryImage}`;

            const managerName = branch.manager?.user?.profile
              ? `${branch.manager.user.profile.first_name || ''} ${branch.manager.user.profile.last_name_paternal || ''}`.trim() || branch.manager.user.email
              : branch.manager?.user?.email 
              || 'Sin asignar';

            const addressStr = branch.address 
              ? `${branch.address.street || ''} ${branch.address.city ? ', ' + branch.address.city : ''}`.trim() 
              : 'Sin dirección registrada';

            return (
              <div className="branch-card" key={branch.id}>
                <div className="branch-card-image">
                  <img src={imageUrl} alt={branch.name} onError={(e) => e.target.src = `${API_BASE_URL}/storage/branches/default.png`} />
                  <span className={`branch-status-badge ${branch.is_active ? 'active' : 'inactive'}`}>
                    {branch.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="branch-card-content">
                  <h3 className="branch-card-title">{branch.name}</h3>
                  <div className="branch-card-info">
                    <div className="info-item">
                      <MapPin size={16} />
                      <span>{addressStr}</span>
                    </div>
                    <div className="info-item">
                      <Phone size={16} />
                      <span>{branch.phone || 'Sin teléfono'}</span>
                    </div>
                    <div className="info-item">
                      <User size={16} />
                      <span>{managerName}</span>
                    </div>
                  </div>
                  <div className="branch-card-actions">
                    <CanAccess permission="edit_branches">
                      <button className="btn-icon" onClick={() => handleEdit(branch)} title="Editar">
                        <Edit2 size={18} />
                      </button>
                    </CanAccess>
                    <CanAccess permission="delete_branches">
                      <button className="btn-icon delete" onClick={() => setConfirmModal({ isOpen: true, id: branch.id })} title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </CanAccess>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="branches-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Gerente</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "24px" }}>
                  Cargando sucursales...
                </td>
              </tr>
            ) : filteredBranches.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "24px" }}>
                  No se encontraron sucursales.
                </td>
              </tr>
            ) : (
              filteredBranches.map((branch) => (
                <tr key={branch.id}>
                  <td style={{ fontWeight: 500 }}>{branch.name}</td>
                  <td>
                    {branch.address 
                      ? `${branch.address.street || ''} ${branch.address.city ? ', ' + branch.address.city : ''}` 
                      : 'Sin dirección'}
                  </td>
                  <td>{branch.phone || '-'}</td>
                  <td>
                    {branch.manager?.user?.profile
                      ? `${branch.manager.user.profile.first_name || ''} ${branch.manager.user.profile.last_name_paternal || ''}`.trim() || branch.manager.user.email
                      : branch.manager?.user?.email 
                      || '-'}
                  </td>
                  <td>
                    <span className={`status-badge ${branch.is_active ? 'active' : 'inactive'}`}>
                      {branch.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <CanAccess permission="edit_branches">
                        <button className="btn-edit" onClick={() => handleEdit(branch)}>
                          Editar
                        </button>
                      </CanAccess>
                      <CanAccess permission="delete_branches">
                        <button className="btn-delete" onClick={() => setConfirmModal({ isOpen: true, id: branch.id })}>
                          Eliminar
                        </button>
                      </CanAccess>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {isModalOpen && (
        <BranchFormModal
          branch={selectedBranch}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveSuccess}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={() => handleDelete(confirmModal.id)}
        title="Eliminar sucursal"
        message="¿Estás seguro de eliminar esta sucursal? Se moverá a la papelera."
        confirmText="Sí, eliminar"
        type="danger"
      />
    </div>
  );
}
