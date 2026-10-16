import { getImageUrl } from '../../../../utils/imageUtils';
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getBranches, deleteBranch } from "../../../../api/admin/branches";
import { Plus, LayoutGrid, List, MapPin, Phone, User, Edit2, Trash2, Search, Filter, RefreshCw, MoreVertical, Store, DollarSign, Boxes, Award } from "lucide-react";
import RowDropdown from "../../../../components/ui/RowDropdown";
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

  const activeFiltersCount = (filters.status !== "all" ? 1 : 0);
  const hasActiveFilters = activeFiltersCount > 0 || Boolean(search);

  const handleClearFilters = () => {
    setSearch("");
    setFilters({ status: "all" });
  };

  const [viewMode, setViewMode] = useState("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const branchStats = useMemo(() => {
    const list = Array.isArray(branches) ? branches : [];
    const total = list.length;
    const active = list.filter((b) => b.is_active).length;

    let maxBranch = null;
    let maxBranchValue = 0;
    let totalInvested = 0;
    let totalStockUnits = 0;

    list.forEach((b) => {
      const invs = Array.isArray(b.inventories) ? b.inventories : [];
      let branchValue = 0;
      let branchUnits = 0;

      invs.forEach((inv) => {
        const units = Number(inv.stock || 0);
        const cost = Number(inv.variant?.cost || inv.variant?.price || 0);
        branchUnits += units;
        branchValue += units * cost;
      });

      totalStockUnits += branchUnits;
      totalInvested += branchValue;

      if (branchValue >= maxBranchValue) {
        maxBranchValue = branchValue;
        maxBranch = b;
      }
    });

    const topBranchName = maxBranch ? maxBranch.name : "-";

    return {
      total,
      active,
      topBranchName,
      maxBranchValue,
      totalInvested,
      totalStockUnits,
    };
  }, [branches]);

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

        <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
  <CanAccess permission="view_branches">
    <Link 
      to="/dashboard/branches/deleted"
      className="btn-secondary" 
      style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', padding: '10px' }}
      title="Papelera"
    >
      <Trash2 size={18} /> 
      {!isMobile && "Papelera"}
    </Link>
  </CanAccess>
  <CanAccess permission="create_branches">
    <button 
      className="btn-primary" 
      onClick={handleCreate}
      style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
      title="Nueva Sucursal"
    >
      <Plus size={18} />
      {!isMobile && "Nueva Sucursal"}
    </button>
  </CanAccess>
  <button 
    className="btn-secondary" 
    onClick={loadBranches}
    style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
    title="Actualizar"
  >
    <RefreshCw size={18} className={loading ? "spin" : ""} />
    {!isMobile && "Actualizar"}
  </button>
</div>
</div>

      {/* KPI Cards Normalizados */}
      <div className="branches-kpi-grid">
        <div className="branches-kpi-card kpi-top-branch">
          <div className="branches-kpi-top">
            <span className="branches-kpi-value" title={branchStats.topBranchName}>
              {branchStats.topBranchName}
            </span>
          </div>
          <div className="branches-kpi-bottom">
            <div className="branches-kpi-icon-mini">
              <Award size={14} />
            </div>
            <span className="branches-kpi-label">
              Mayor Inversión (Bs. {branchStats.maxBranchValue.toLocaleString()})
            </span>
          </div>
        </div>

        <div className="branches-kpi-card kpi-invested">
          <div className="branches-kpi-top">
            <span className="branches-kpi-value">
              Bs. {branchStats.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="branches-kpi-bottom">
            <div className="branches-kpi-icon-mini">
              <DollarSign size={14} />
            </div>
            <span className="branches-kpi-label">Capital Total Invertido</span>
          </div>
        </div>

        <div className="branches-kpi-card kpi-stock">
          <div className="branches-kpi-top">
            <span className="branches-kpi-value">
              {branchStats.totalStockUnits.toLocaleString()} uds
            </span>
          </div>
          <div className="branches-kpi-bottom">
            <div className="branches-kpi-icon-mini">
              <Boxes size={14} />
            </div>
            <span className="branches-kpi-label">Stock Total en Sucursales</span>
          </div>
        </div>

        <div className="branches-kpi-card kpi-active">
          <div className="branches-kpi-top">
            <span className="branches-kpi-value">
              {branchStats.active} / {branchStats.total}
            </span>
          </div>
          <div className="branches-kpi-bottom">
            <div className="branches-kpi-icon-mini">
              <Store size={14} />
            </div>
            <span className="branches-kpi-label">Sucursales Operativas</span>
          </div>
        </div>
      </div>

      <div className="branches-filters-container">
        <div className={`branches-search-bar-row ${showFilters ? 'open' : ''}`}>
          <div className="branches-search-input-wrapper">
            <Search size={18} className="branches-search-icon" />
            <input
              className="branches-search-input"
              placeholder="Buscar sucursal por nombre o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`branches-filter-toggle-btn ${showFilters ? 'active' : ''}`}
          >
            <Filter size={18} />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="branches-filter-badge">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="branches-filters-panel">
            <div className="branches-filter-group">
              <label>Estado</label>
              <CustomSelect
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

            <div className="branches-filter-group branches-filter-actions">
              <label style={{ visibility: 'hidden' }}>Acción</label>
              <button
                type="button"
                onClick={handleClearFilters}
                className="branches-filter-clear-btn"
                title="Restablecer filtros"
              >
                <RefreshCw size={15} />
                <span>Limpiar Filtros</span>
              </button>
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
        <div className="branches-grid" style={{ gridTemplateColumns: isMobile ? "1fr" : undefined }}>
          {filteredBranches.map((branch) => {
            const primaryImage = branch.images?.find(img => img.is_primary)?.image_url 
              || branch.images?.[0]?.image_url 
              || "/storage/branches/default.png";
              
            const imageUrl = primaryImage.startsWith("http") ? primaryImage : getImageUrl(primaryImage);

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
                  <img src={imageUrl} alt={branch.name} onError={(e) => e.target.src = getImageUrl('/branches/default.png')} />
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
              <th style={{ display: isMobile ? "none" : "table-cell" }}>Acciones</th>
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
<td style={{ fontWeight: 500, position: 'relative' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <RowDropdown rowId={branch.id} activeId={activeDropdown} setActiveId={setActiveDropdown}>
          
            <CanAccess permission="edit_branches">
              <button 
                onClick={() => { handleEdit(branch); setActiveDropdown(null); }}
                style={{ background: 'transparent', border: 'none', padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-primary)', width: '100%', fontSize: '14px' }}
              >
                <Edit2 size={16} /> Editar
              </button>
            </CanAccess>
            <CanAccess permission="delete_branches">
              <button 
                onClick={() => { setConfirmModal({ isOpen: true, id: branch.id }); setActiveDropdown(null); }}
                style={{ background: 'transparent', border: 'none', padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-danger)', width: '100%', fontSize: '14px' }}
              >
                <Trash2 size={16} /> Eliminar
              </button>
            </CanAccess>
</RowDropdown>
    {branch.name}
  </div>
</td>
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
                  <td style={{ display: isMobile ? "none" : "table-cell" }}>
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











