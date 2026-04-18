import { useMemo, useState } from "react";

export default function UsersTable({
  users,
  onEdit,
  onDelete,
  search,
  setSearch,
  filters,
  setFilters
}) {


  // =========================
  // 🔎 FILTRADO + ORDENAMIENTO
  // =========================
  const filteredUsers = useMemo(() => {
    let data = [...users];

    // 🔎 SEARCH GLOBAL
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((u) =>
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.profile?.first_name?.toLowerCase().includes(q) ||
        u.customer?.customer_code?.toLowerCase().includes(q)
      );
    }

    // 📌 STATUS
    if (filters.status !== "all") {
      data = data.filter((u) =>
        filters.status === "active" ? u.is_active : !u.is_active
      );
    }

    // 📌 TYPE
    if (filters.type !== "all") {
      data = data.filter((u) =>
        filters.type === "owner" ? u.owner :
        filters.type === "customer" ? u.customer : true
      );
    }

    // 📌 ROLE
    if (filters.role !== "all") {
      data = data.filter((u) =>
        u.roles?.some((r) => r.name === filters.role)
      );
    }

    // 📌 RANGO PUNTOS
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

    // 📊 SORT
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

  // =========================
  // 🧠 AGRUPACIÓN
  // =========================
  const groupedUsers = useMemo(() => {
    if (filters.groupBy === "none") return { all: filteredUsers };

    return filteredUsers.reduce((acc, user) => {
      let key = "otros";

      if (filters.groupBy === "type") {
        key = user.owner ? "Owner" : user.customer ? "Customer" : "Otros";
      }

      if (filters.groupBy === "role") {
        key = user.roles?.[0]?.name || "Sin rol";
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(user);

      return acc;
    }, {});
  }, [filteredUsers, filters.groupBy]);

  return (
    <div className="users-admin">

      {/* ================= FILTROS ================= */}
      <div className="filters-panel">

        {/* SEARCH */}
        <input
          placeholder="Buscar usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* STATUS */}
        <select
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>

        {/* TYPE */}
        <select
          onChange={(e) =>
            setFilters({ ...filters, type: e.target.value })
          }
        >
          <option value="all">Todos tipos</option>
          <option value="owner">Owner</option>
          <option value="customer">Customer</option>
        </select>

        {/* SORT */}
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

        {/* RANGO PUNTOS */}
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

        {/* GROUP BY */}
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
      {Object.entries(groupedUsers).map(([group, items]) => (
        <div key={group} className="group-section">

          {filters.groupBy !== "none" && (
            <h3 className="group-title">{group}</h3>
          )}

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

                  <td>
                    {u.is_active ? "Activo" : "Inactivo"}
                  </td>

                  <td>
                    {u.owner && "Owner"}
                    {u.customer && "Customer"}
                    {!u.owner && !u.customer && "-"}
                  </td>

                  <td>
                    {u.roles?.map((r) => r.name).join(", ") || "-"}
                  </td>

                  <td>
                    {u.customer
                      ? `${u.customer.customer_code} (${u.customer.points} pts)`
                      : "-"}
                  </td>

                  <td>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  <td>
                    <button className="btn-edit" onClick={() => onEdit(u)}>
                      Editar
                    </button>
                    <button className="btn-delete" onClick={() => onDelete(u.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      ))}
    </div>
  );
}