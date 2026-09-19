import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import { getOwners, deleteOwner } from "../../../../api/admin/owners";
import OwnerModal from "./OwnerModal";
import "../Employees/Employees.css";
import CanAccess from "../../../../components/ui/CanAccess";

export default function Owners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const res = await getOwners();
      setOwners(res.data || res);
    } catch (error) {
      toast.error("Error al cargar los dueños/socios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar o desactivar este socio?")) return;
    try {
      await deleteOwner(id);
      toast.success("Socio eliminado");
      fetchOwners();
    } catch (error) {
      toast.error("Error al eliminar socio");
    }
  };

  const handleEdit = (owner) => {
    setSelectedOwner(owner);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedOwner(null);
    setIsModalOpen(true);
  };

  const filteredOwners = owners.filter(owner => {
    if (!search) return true;
    const s = search.toLowerCase();
    const profile = owner.user?.profile;
    const email = owner.user?.email || "";
    const fullName = profile ? `${profile.first_name || ""} ${profile.last_name_paternal || ""} ${profile.last_name_maternal || ""}`.toLowerCase() : "";
    return fullName.includes(s) || email.includes(s);
  });

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title">Socios / Dueños</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <CanAccess permission="manage_owners">
            <button 
              className="btn-primary" 
              onClick={handleCreate}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} />
              Nuevo Socio
            </button>
          </CanAccess>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner" style={{ marginBottom: '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar por nombre o correo..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">Cargando socios...</div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Socio</th>
                <th>Contacto</th>
                <th>Rol</th>
                <th>Capital Invertido</th>
                <th>Productos</th>
                <th>Fecha Registro</th>
                <th>Estado</th>
                <th style={{ textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "40px" }}>No se encontraron socios.</td>
                </tr>
              ) : (
                filteredOwners.map((owner) => {
                  const profile = owner.user?.profile || {};
                  const fullName = `${profile.first_name || ""} ${profile.last_name_paternal || ""} ${profile.last_name_maternal || ""}`.trim() || 'Sin Nombre';

                  return (
                    <tr key={owner.id}>
                      <td data-label="Socio">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{fullName}</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{owner.user?.email || "Sin correo"}</span>
                        </div>
                      </td>
                      <td data-label="Contacto">
                        <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                          {profile.phone || "No especificado"}
                        </span>
                      </td>
                      <td data-label="Rol">
                        <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>
                          {owner.user?.roles?.[0]?.name || 'Owner'}
                        </span>
                      </td>
                      <td data-label="Capital Invertido">
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '15px' }}>
                          Bs. {(owner.total_capital || 0).toFixed(2)}
                        </span>
                      </td>
                      <td data-label="Productos">
                        <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                          {owner.products_count || 0}
                        </span>
                      </td>
                      <td data-label="Fecha Registro">
                        <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                          {new Date(owner.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td data-label="Estado">
                        <span style={{ background: 'var(--bg-overlay)', color: owner.is_active ? 'var(--color-success)' : 'var(--color-danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          {owner.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td data-label="Acciones">
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: 'center' }}>
                          <button 
                            className="btn-icon" 
                            title="Ver Perfil y Finanzas"
                            onClick={() => window.location.href = `/dashboard/owners/${owner.id}`}
                            style={{ background: 'var(--bg-overlay)', color: 'var(--text-main)' }}
                          >
                            <Eye size={16} />
                          </button>
                          <CanAccess permission="manage_owners">
                            <button 
                              className="btn-icon btn-edit" 
                              title="Editar Datos"
                              onClick={() => handleEdit(owner)}
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              className="btn-icon btn-delete" 
                              title="Eliminar"
                              onClick={() => handleDelete(owner.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </CanAccess>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <OwnerModal 
          owner={selectedOwner} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchOwners();
          }}
        />
      )}
    </div>
  );
}
