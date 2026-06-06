import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

import {
  getDeletedUsers,
  restoreUser,
  forceDeleteUser,
} from "../../../../api/users";

import "./Users.css";
import "../css/stylesCruds.css";

import { RefreshCw, Trash2, ArrowLeft } from "lucide-react";
import ConfirmModal from "../../../../components/ui/ConfirmModal";
import CanAccess from "../../../../components/ui/CanAccess";

export default function DeletedUsers() {
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", id: null });

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await getDeletedUsers();
      setUsers(
        Array.isArray(res) ? res : res.data?.data || res.data || []
      );
    } catch (error) {
      console.error("Error cargando usuarios eliminados:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRestore = async (id) => {
    try {
      setLoadingUsers(true);
      await restoreUser(id);
      loadUsers();
    } catch (err) {
      console.error("Error restaurando usuario:", err);
      alert("Error al restaurar el usuario.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleForceDelete = async (id) => {
    try {
      setLoadingUsers(true);
      await forceDeleteUser(id);
      loadUsers();
    } catch (err) {
      console.error("Error eliminando permanentemente el usuario:", err);
      alert("Error al eliminar el usuario de forma permanente.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const search = filters.search.toLowerCase();
      const matchSearch = 
        u.email?.toLowerCase().includes(search) || 
        u.username?.toLowerCase().includes(search) ||
        u.profile?.first_name?.toLowerCase().includes(search);
      return matchSearch;
    });
  }, [users, filters]);

  return (
    <div className="users-container">
      <div className="users-header">
        <h1 className="users-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/dashboard/users" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </Link>
          Papelera de Usuarios
        </h1>
      </div>

      <div className="filters-panel" style={{ marginBottom: '20px' }}>
        <input
          placeholder="Buscar usuario eliminado..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
        />
      </div>

      <div className="table-wrapper">
        <table className="users-table" style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Fecha Eliminación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loadingUsers ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                  Cargando usuarios eliminados...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                  No hay usuarios en la papelera.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.username}</td>
                  <td>{u.profile?.first_name} {u.profile?.last_name_paternal}</td>
                  <td>
                    {u.deleted_at ? new Date(u.deleted_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <CanAccess permission="restore_users">
                        <button
                          className="btn-edit"
                          onClick={() => setConfirmModal({ isOpen: true, type: "restore", id: u.id })}
                          title="Restaurar"
                          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.15)', width: 'max-content', padding: '6px 12px' }}
                        >
                          <RefreshCw size={16} /> Restaurar
                        </button>
                      </CanAccess>
                      
                      <CanAccess permission="delete_users">
                        <button
                          className="btn-delete"
                          onClick={() => setConfirmModal({ isOpen: true, type: "forceDelete", id: u.id })}
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
        title={confirmModal.type === "restore" ? "Restaurar usuario" : "Eliminar permanente"}
        message={
          confirmModal.type === "restore" 
          ? "¿Estás seguro de restaurar este usuario? Volverá a tener acceso al sistema." 
          : "ADVERTENCIA: ¿Estás seguro de eliminar PERMANENTEMENTE este usuario? Esta acción no se puede deshacer."
        }
        confirmText={confirmModal.type === "restore" ? "Sí, restaurar" : "Sí, eliminar definitivamente"}
        type={confirmModal.type === "restore" ? "success" : "danger"}
      />
    </div>
  );
}
