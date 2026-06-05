import { useState, useEffect } from "react";
import { getBranches, deleteBranch } from "../../../../api/branches";
import { LayoutGrid, List, MapPin, Phone, User, Edit2, Trash2 } from "lucide-react";
import BranchFormModal from "./BranchFormModal";
import "./Branches.css";

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

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
    if (window.confirm("¿Estás seguro de eliminar esta sucursal?")) {
      try {
        await deleteBranch(id);
        loadBranches();
      } catch (error) {
        console.error("Error eliminando sucursal:", error);
        alert("No se pudo eliminar la sucursal");
      }
    }
  };

  const handleSaveSuccess = () => {
    setIsModalOpen(false);
    loadBranches();
  };

  return (
    <div className="branches-container">
      <div className="branches-header">
        <h1 className="branches-title">Sucursales</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="view-toggle-segmented" style={{ display: 'flex', background: 'var(--bg-input)', padding: '4px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
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
          <button className="btn-primary" onClick={handleCreate}>
            + Nueva Sucursal
          </button>
        </div>
      </div>

      <div className="filters-bar" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Buscar sucursal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          style={{ minWidth: '300px' }}
        />
      </div>

      {loading ? (
        <div className="loading-state">Cargando sucursales...</div>
      ) : branches.length === 0 ? (
        <div className="empty-state">No se encontraron sucursales.</div>
      ) : viewMode === "grid" ? (
        <div className="branches-grid">
          {branches.map((branch) => {
            const primaryImage = branch.images?.find(img => img.is_primary)?.image_url 
              || branch.images?.[0]?.image_url 
              || "/storage/branches/default.png";
              
            const imageUrl = primaryImage.startsWith("http") ? primaryImage : `http://localhost:8000${primaryImage}`;

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
                  <img src={imageUrl} alt={branch.name} onError={(e) => e.target.src = "http://localhost:8000/storage/branches/default.png"} />
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
                    <button className="btn-icon" onClick={() => handleEdit(branch)} title="Editar">
                      <Edit2 size={18} />
                    </button>
                    <button className="btn-icon delete" onClick={() => handleDelete(branch.id)} title="Eliminar">
                      <Trash2 size={18} />
                    </button>
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
            ) : branches.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "24px" }}>
                  No se encontraron sucursales.
                </td>
              </tr>
            ) : (
              branches.map((branch) => (
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
                    <button className="btn-edit" onClick={() => handleEdit(branch)}>
                      Editar
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(branch.id)}>
                      Eliminar
                    </button>
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
    </div>
  );
}
