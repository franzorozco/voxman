import { useMemo, useState, useEffect } from "react";
import { Filter, Search } from "lucide-react";
import ConfirmModal from "../../../../components/ui/ConfirmModal";
import UserViewModal from "./UserViewModal";
import CanAccess from "../../../../components/ui/CanAccess";
export default function UsersTable({
  users,
  onEdit,
  onDelete,
  search,
  setSearch,
  filters,
  setFilters,
  generateUserPdf,
  authUser
}){

  // =========================
  // 🧠 STATES
  // =========================
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  // =========================
  // ⏳ LOADING CONTROL
  // =========================
  useEffect(() => {
    if (Array.isArray(users)) {
      setLoading(false);
    }
  }, [users]);


  // =========================
  // 🔎 FILTRADO + ORDENAMIENTO
  // =========================
  const filteredUsers = useMemo(() => {
    let data = [...users];

    if (search) {
      const q = search.toLowerCase();
      data = data.filter((u) =>
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.profile?.first_name?.toLowerCase().includes(q) ||
        u.customer?.customer_code?.toLowerCase().includes(q)
      );
    }

    if (filters.status !== "all") {
      data = data.filter((u) =>
        filters.status === "active" ? u.is_active : !u.is_active
      );
    }

  if (filters.type !== "all") {
    data = data.filter((u) =>
      filters.type === "owner"
        ? u.owner?.is_active
        : filters.type === "customer"
        ? u.customer?.is_active
        : filters.type === "employee"
        ? u.employee?.is_active
        : true
    );
  }

    if (filters.role !== "all") {
      data = data.filter((u) =>
        u.roles?.some((r) => r.name === filters.role)
      );
    }

    if (filters.minPoints !== "") {
      data = data.filter((u) =>
        (u.customer?.points || 0) >= Number(filters.minPoints)
      );
    }

    if (filters.maxPoints !== "") {
      data = data.filter((u) =>
        (u.customer?.points || 0) <= Number(filters.maxPoints)
      );
    }

    switch (filters.sort) {
      case "created_at_asc":
        data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case "created_at_desc":
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case "points_desc":
        data.sort((a, b) => (b.customer?.points || 0) - (a.customer?.points || 0));
        break;
      case "points_asc":
        data.sort((a, b) => (a.customer?.points || 0) - (b.customer?.points || 0));
        break;
    }

    return data;
  }, [users, search, filters]);

  const groupedUsers = useMemo(() => {
    if (filters.groupBy === "none") return { all: filteredUsers };

    return filteredUsers.reduce((acc, user) => {
      let key = "otros";

      if (filters.groupBy === "type") {
        if (user.owner?.is_active) key = "Owner";
        else if (user.customer?.is_active) key = "Customer";
        else if (user.employee?.is_active) key = "Employee";
        else key = "Otros";
      }
            
      if (filters.groupBy === "role") {
        key = user.roles?.[0]?.name || "Sin rol";
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(user);

      return acc;
    }, {});
  }, [filteredUsers, filters.groupBy]);
  
  const canDelete = (u) => {

    const isAdmin = u.roles?.some(
      r => r.name === "Administrador"
    );

    const isOwner = u.owner?.is_active;

    const isSelf = authUser?.id === u.id;

    return !(isAdmin || isOwner || isSelf);
  };

  const getDeleteReason = (u) => {
    if (authUser?.id === u.id) return "No puedes eliminar tu propia cuenta";
    if (u.roles?.some(r => r.name === "Administrador")) return "Es Administrador";
    if (u.owner?.is_active) return "Es Owner";
    return "";
  };
  return (
    <div className="users-admin">

      {/* ================= FILTROS ================= */}
      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: showFilters ? '15px' : '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar usuario por nombre, email o código..."
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
              <select
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Tipo de cuenta</label>
              <select
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
              >
                <option value="all">Todos tipos</option>
                <option value="owner">Owner</option>
                <option value="customer">Customer</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Ordenar por</label>
              <select
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.sort}
                onChange={(e) =>
                  setFilters({ ...filters, sort: e.target.value })
                }
              >
                <option value="created_at_desc">Más recientes</option>
                <option value="created_at_asc">Más antiguos</option>
                <option value="points_desc">Más puntos</option>
                <option value="points_asc">Menos puntos</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Min puntos</label>
              <input
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                placeholder="0"
                type="number"
                value={filters.minPoints}
                onChange={(e) =>
                  setFilters({ ...filters, minPoints: e.target.value })
                }
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Max puntos</label>
              <input
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                placeholder="1000"
                type="number"
                value={filters.maxPoints}
                onChange={(e) =>
                  setFilters({ ...filters, maxPoints: e.target.value })
                }
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Agrupar tabla por</label>
              <select
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.groupBy}
                onChange={(e) =>
                  setFilters({ ...filters, groupBy: e.target.value })
                }
              >
                <option value="none">Sin agrupar</option>
                <option value="type">Por tipo</option>
                <option value="role">Por rol</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ================= TABLA ================= */}
      {filteredUsers.length === 0 ? (
        <div className="loading-container">
          <p>No se encontraron usuarios</p>
        </div>
      ) : (
        Object.entries(groupedUsers).map(([group, items]) => (
          <div key={group} className="group-section">

            {filters.groupBy !== "none" && (
              <h3 className="group-title">{group}</h3>
            )}

            <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Tipo</th>
                  <th>Roles</th>
                  <th>Cliente</th>
                  <th>Empleado</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {items.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.username}</td>

                    <td>
                      {u.profile?.first_name} {u.profile?.last_name_paternal}
                    </td>

                    <td>{u.is_active ? "Activo" : "Inactivo"}</td>

                    <td>
                      {u.owner?.is_active && "Owner "}
                      {u.customer?.is_active && "Customer "}
                      {u.employee?.is_active && "Employee "}

                      {!u.owner?.is_active && !u.customer?.is_active && !u.employee?.is_active && "-"}
                    </td>

                    <td>{u.roles?.map((r) => r.name).join(", ") || "-"}</td>

                    <td>
                      {u.customer?.is_active
                      ? `${u.customer.customer_code} (${u.customer.points} pts)`
                      : "-"}
                    </td>
                    <td>
                      {u.employee?.is_active
                        ? `${u.employee.employee_code || "Sin código"} (${u.employee.role})`
                        : "-"}
                    </td>

                    <td>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td>
                      <CanAccess permission="view_users">
                        <button
                          className="btn-view"
                          onClick={() => setViewUser(u)}
                        >
                          Ver
                        </button>
                      </CanAccess>

                      <CanAccess permission="edit_users">
                        <button className="btn-edit" onClick={() => onEdit(u)}>
                          Editar
                        </button>
                      </CanAccess>

                      <CanAccess permission="view_users">
                        <button
                          className="btn-report"
                          onClick={() => generateUserPdf(u.id)}
                        >
                          PDF
                        </button>
                      </CanAccess>

                      <CanAccess permission="delete_users">
                        <button
                          className={`btn-delete ${!canDelete(u) ? "disabled" : ""}`}
                          disabled={!canDelete(u)}
                          title={!canDelete(u) ? getDeleteReason(u) : "Eliminar usuario"}
                          onClick={() => {
                            if (!canDelete(u)) return; // 🔒 doble protección
                            setConfirmId(u.id);
                          }}
                        >
                          {canDelete(u) ? "Eliminar" : "No permitido"}
                        </button>
                      </CanAccess>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ))
      )}

      <ConfirmModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          const userToDelete = users.find(u => u.id === confirmId);
          if (!userToDelete || !canDelete(userToDelete)) {
            setConfirmId(null);
            return;
          }
          onDelete(confirmId);
          setConfirmId(null);
        }}
        title="Eliminar usuario"
        message="¿Seguro que deseas eliminar este usuario?"
        confirmText="Sí, eliminar"
        type="danger"
      />

      {viewUser && (
        <UserViewModal
          user={viewUser}
          onClose={() => setViewUser(null)}
        />
      )}


    </div>
  );
}