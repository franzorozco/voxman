import { useMemo, useState, useEffect } from "react";

import UserViewModal from "./UserViewModal";
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
      <div className="filters-panel">

        <input
          placeholder="Buscar usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>

        <select
          onChange={(e) =>
            setFilters({ ...filters, type: e.target.value })
          }
        >
          <option value="all">Todos tipos</option>
          <option value="owner">Owner</option>
          <option value="customer">Customer</option>
          <option value="employee">Employee</option>
        </select>

        <select
          onChange={(e) =>
            setFilters({ ...filters, sort: e.target.value })
          }
        >
          <option value="created_at_desc">Más recientes</option>
          <option value="created_at_asc">Más antiguos</option>
          <option value="points_desc">Más puntos</option>
          <option value="points_asc">Menos puntos</option>
        </select>

        <input
          placeholder="Min puntos"
          type="number"
          onChange={(e) =>
            setFilters({ ...filters, minPoints: e.target.value })
          }
        />

        <input
          placeholder="Max puntos"
          type="number"
          onChange={(e) =>
            setFilters({ ...filters, maxPoints: e.target.value })
          }
        />

        <select
          onChange={(e) =>
            setFilters({ ...filters, groupBy: e.target.value })
          }
        >
          <option value="none">Sin agrupar</option>
          <option value="type">Por tipo</option>
          <option value="role">Por rol</option>
        </select>

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
                      <button
                        className="btn-view"
                        onClick={() => setViewUser(u)}
                      >
                        Ver
                      </button>

                      <button className="btn-edit" onClick={() => onEdit(u)}>
                        Editar
                      </button>

                      <button
                        className="btn-report"
                        onClick={() => generateUserPdf(u.id)}
                      >
                        PDF
                      </button>

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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ))
      )}

      {/* ================= MODAL (CORREGIDO) ================= */}
      {confirmId && (
        <div className="modal-overlay">
          <div className="modal-confirm">

            <h3>Eliminar usuario</h3>

            <p>
              ¿Seguro que deseas eliminar este usuario?
            </p>

            <div className="modal-actions">

              <button
                className="btn-cancel"
                onClick={() => setConfirmId(null)}
              >
                Cancelar
              </button>

              <button
                className="btn-danger"
                onClick={() => {
                  const userToDelete = users.find(u => u.id === confirmId);

                  if (!userToDelete || !canDelete(userToDelete)) {
                    setConfirmId(null);
                    return;
                  }

                  onDelete(confirmId);
                  setConfirmId(null);
                }}
              >
                Sí, eliminar
              </button>

            </div>
          </div>
        </div>
      )}

      {viewUser && (
        <UserViewModal
          user={viewUser}
          onClose={() => setViewUser(null)}
        />
      )}


    </div>
  );
}