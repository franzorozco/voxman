import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

import {
  getDeletedBranches,
  restoreBranch,
  forceDeleteBranch,
} from "../../../../api/admin/branches";

import "./Branches.css";
import "../css/stylesCruds.css";

import { RefreshCw, Trash2, ArrowLeft } from "lucide-react";
import ConfirmModal from "../../../../components/ui/ConfirmModal";
import CanAccess from "../../../../components/ui/CanAccess";
import toast from "react-hot-toast";

export default function DeletedBranches() {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", id: null });

  const loadBranches = async () => {
    try {
      setLoading(true);
      const res = await getDeletedBranches();
      setBranches(
        Array.isArray(res) ? res : res.data?.data || res.data || []
      );
    } catch (error) {
      console.error("Error cargando sucursales eliminadas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleRestore = async (id) => {
    try {
      setLoading(true);
      await restoreBranch(id);
      toast.success("Sucursal restaurada correctamente");
      loadBranches();
    } catch (err) {
      console.error("Error restaurando sucursal:", err);
      toast.error(err.response?.data?.message || "Error al restaurar la sucursal.");
    } finally {
      setLoading(false);
    }
  };

  const handleForceDelete = async (id) => {
    try {
      setLoading(true);
      await forceDeleteBranch(id);
      toast.success("Sucursal eliminada permanentemente");
      loadBranches();
    } catch (err) {
      console.error("Error eliminando permanentemente la sucursal:", err);
      toast.error(err.response?.data?.message || "Error al eliminar la sucursal de forma permanente.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const search = filters.search.toLowerCase();
      const matchSearch = 
        b.name?.toLowerCase().includes(search) || 
        b.phone?.toLowerCase().includes(search);
      return matchSearch;
    });
  }, [branches, filters]);

  return (
    <div className="branches-container">
      <div className="branches-header">
        <h1 className="branches-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/dashboard/branches" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </Link>
          Papelera de Sucursales
        </h1>
      </div>

      <div className="filters-panel" style={{ marginBottom: '20px' }}>
        <input
          placeholder="Buscar sucursal eliminada..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
        />
      </div>

      <div className="table-wrapper">
        <table className="table" style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Fecha Eliminación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                  Cargando sucursales eliminadas...
                </td>
              </tr>
            ) : filteredBranches.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                  No hay sucursales en la papelera.
                </td>
              </tr>
            ) : (
              filteredBranches.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>
                    {b.address 
                      ? `${b.address.street || ''} ${b.address.city ? ', ' + b.address.city : ''}` 
                      : 'Sin dirección'}
                  </td>
                  <td>{b.phone || '-'}</td>
                  <td>
                    {b.deleted_at ? new Date(b.deleted_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <CanAccess permission="restore_branches">
                        <button
                          className="btn-edit"
                          onClick={() => setConfirmModal({ isOpen: true, type: "restore", id: b.id })}
                          title="Restaurar"
                          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.15)', width: 'max-content', padding: '6px 12px' }}
                        >
                          <RefreshCw size={16} /> Restaurar
                        </button>
                      </CanAccess>
                      <CanAccess permission="delete_branches">
                        <button
                          className="btn-delete"
                          onClick={() => setConfirmModal({ isOpen: true, type: "forceDelete", id: b.id })}
                          title="Eliminar permanentemente"
                          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: '6px', width: 'max-content', padding: '6px 12px' }}
                        >
                          <Trash2 size={16} /> Eliminar
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: "", id: null })}
        onConfirm={() => {
          if (confirmModal.type === "restore") handleRestore(confirmModal.id);
          if (confirmModal.type === "forceDelete") handleForceDelete(confirmModal.id);
        }}
        title={confirmModal.type === "restore" ? "Restaurar sucursal" : "Eliminar permanente"}
        message={
          confirmModal.type === "restore" 
          ? "¿Estás seguro de restaurar esta sucursal? Volverá a estar activa en el sistema." 
          : "ADVERTENCIA: ¿Estás seguro de eliminar PERMANENTEMENTE esta sucursal? Esta acción no se puede deshacer y borrará todos sus datos definitivamente."
        }
        confirmText={confirmModal.type === "restore" ? "Sí, restaurar" : "Sí, eliminar definitivamente"}
        type={confirmModal.type === "restore" ? "success" : "danger"}
      />
    </div>
  );
}
