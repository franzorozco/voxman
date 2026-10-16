import { useMemo, useState, useEffect } from "react";
import {
  Filter,
  Search,
  Eye,
  Edit,
  FileText,
  Trash2,
  ShieldCheck,
  Clock,
  Globe,
  Store,
  User as UserIcon,
  RefreshCw,
} from "lucide-react";
import RowDropdown from "../../../../components/ui/RowDropdown";
import ConfirmModal from "../../../../components/ui/ConfirmModal";
import UserViewModal from "./UserViewModal";
import CanAccess from "../../../../components/ui/CanAccess";
import CustomSelect from "../../../../components/ui/CustomSelect";
import {
  getUserOrigin,
  getUserVerification,
  getUserFullName,
  getUserInitials,
  formatDate,
  GoogleIcon,
} from "./userHelpers";

export default function UsersTable({
  users,
  onEdit,
  onDelete,
  onReload,
  search,
  setSearch,
  filters,
  setFilters,
  generateUserPdf,
  authUser,
}) {
  // =========================
  // 🧠 STATES
  // =========================
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status !== "all") count++;
    if (filters.verification && filters.verification !== "all") count++;
    if (filters.origin && filters.origin !== "all") count++;
    if (filters.type && filters.type !== "all") count++;
    if (filters.role && filters.role !== "all") count++;
    if (filters.sort && filters.sort !== "created_at_desc") count++;
    if (filters.groupBy && filters.groupBy !== "none") count++;
    if (filters.minPoints !== "" && filters.minPoints !== undefined) count++;
    if (filters.maxPoints !== "" && filters.maxPoints !== undefined) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFiltersCount > 0 || Boolean(search);

  const handleClearFilters = () => {
    setSearch("");
    setFilters({
      status: "all",
      type: "all",
      role: "all",
      sort: "created_at_desc",
      minPoints: "",
      maxPoints: "",
      groupBy: "none",
      verification: "all",
      origin: "all",
    });
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    let data = [...(users || [])];

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          u.profile?.first_name?.toLowerCase().includes(q) ||
          u.profile?.last_name_paternal?.toLowerCase().includes(q) ||
          u.customer?.customer_code?.toLowerCase().includes(q) ||
          u.employee?.employee_code?.toLowerCase().includes(q)
      );
    }

    if (filters.status !== "all") {
      data = data.filter((u) => (filters.status === "active" ? u.is_active : !u.is_active));
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
      data = data.filter((u) => u.roles?.some((r) => r.name === filters.role));
    }

    // Filtro por estado de verificación
    if (filters.verification && filters.verification !== "all") {
      data = data.filter((u) => {
        const isVer = Boolean(u.email_verified_at || u.google_id);
        if (filters.verification === "verified") return isVer;
        if (filters.verification === "pending")
          return !isVer && !u.email?.toLowerCase().includes("@guest");
        if (filters.verification === "guest")
          return Boolean(u.email?.toLowerCase().includes("@guest"));
        return true;
      });
    }

    // Filtro por canal / origen
    if (filters.origin && filters.origin !== "all") {
      data = data.filter((u) => {
        const origin = getUserOrigin(u);
        return origin.type === filters.origin;
      });
    }

    if (filters.minPoints !== "") {
      data = data.filter((u) => (u.customer?.points || 0) >= Number(filters.minPoints));
    }

    if (filters.maxPoints !== "") {
      data = data.filter((u) => (u.customer?.points || 0) <= Number(filters.maxPoints));
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
      default:
        break;
    }

    return data;
  }, [users, search, filters]);

  const groupedUsers = useMemo(() => {
    if (filters.groupBy === "none") return { all: filteredUsers };

    return filteredUsers.reduce((acc, user) => {
      let key = "Otros";

      if (filters.groupBy === "type") {
        if (user.owner?.is_active) key = "Owners / Socios";
        else if (user.employee?.is_active) key = "Personal / Empleados";
        else if (user.customer?.is_active) key = "Clientes";
        else key = "Otros usuarios";
      }

      if (filters.groupBy === "role") {
        key = user.roles?.[0]?.name || "Sin rol asignado";
      }

      if (filters.groupBy === "origin") {
        const o = getUserOrigin(user);
        key = o.label;
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(user);

      return acc;
    }, {});
  }, [filteredUsers, filters.groupBy]);

  const canManageExecutives =
    authUser?.permissions?.includes("manage_executives") || authUser?.roles?.includes("Owner");

  const canModify = (u) => {
    const isAdmin = u.roles?.some((r) => r.name === "Administrador");
    const isOwner = u.owner?.is_active;

    if ((isAdmin || isOwner) && !canManageExecutives) {
      return false;
    }

    return true;
  };

  const getModifyReason = (u) => {
    if (!canManageExecutives) {
      if (u.roles?.some((r) => r.name === "Administrador"))
        return "No tienes permiso para modificar a un Administrador";
      if (u.owner?.is_active) return "No tienes permiso para modificar a un Owner";
    }
    return "";
  };

  return (
    <div className="users-admin">
      {/* ================= BARRA DE BÚSQUEDA Y FILTROS ================= */}
      <div className="users-filters-container">
        <div className={`users-search-bar-row ${showFilters ? "open" : ""}`}>
          <div className="users-search-input-wrapper">
            <Search size={18} className="users-search-icon" />
            <input
              className="users-search-input"
              placeholder="Buscar por nombre, email, usuario o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`users-filter-toggle-btn ${showFilters ? "active" : ""}`}
          >
            <Filter size={18} />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="users-filter-badge">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        {/* Panel Desplegable de Filtros Profesionales */}
        {showFilters && (
          <div className="users-filters-panel">
            {/* Estado */}
            <div className="users-filter-group">
              <label>Estado</label>
              <CustomSelect
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </CustomSelect>
            </div>

            {/* Verificación */}
            <div className="users-filter-group">
              <label>Verificación</label>
              <CustomSelect
                value={filters.verification || "all"}
                onChange={(e) => setFilters({ ...filters, verification: e.target.value })}
              >
                <option value="all">Todas las cuentas</option>
                <option value="verified">Emails Verificados</option>
                <option value="pending">Pendientes de confirmar</option>
                <option value="guest">Clientes POS (Sin email)</option>
              </CustomSelect>
            </div>

            {/* Canal / Origen */}
            <div className="users-filter-group">
              <label>Canal / Origen</label>
              <CustomSelect
                value={filters.origin || "all"}
                onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
              >
                <option value="all">Todos los canales</option>
                <option value="web">Plataforma Web</option>
                <option value="google">Google OAuth</option>
                <option value="pos">POS / Tienda</option>
                <option value="system">Sistema Interno</option>
              </CustomSelect>
            </div>

            {/* Tipo de cuenta */}
            <div className="users-filter-group">
              <label>Tipo de cuenta</label>
              <CustomSelect
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="all">Todos tipos</option>
                <option value="owner">Owner / Socio</option>
                <option value="customer">Cliente</option>
                <option value="employee">Empleado</option>
              </CustomSelect>
            </div>

            {/* Ordenar por */}
            <div className="users-filter-group">
              <label>Ordenar por</label>
              <CustomSelect
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              >
                <option value="created_at_desc">Más recientes</option>
                <option value="created_at_asc">Más antiguos</option>
                <option value="points_desc">Más puntos</option>
                <option value="points_asc">Menos puntos</option>
              </CustomSelect>
            </div>

            {/* Agrupar */}
            <div className="users-filter-group">
              <label>Agrupar tabla por</label>
              <CustomSelect
                value={filters.groupBy}
                onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
              >
                <option value="none">Sin agrupar</option>
                <option value="type">Por tipo de cuenta</option>
                <option value="role">Por rol asignado</option>
                <option value="origin">Por canal / origen</option>
              </CustomSelect>
            </div>

            {/* Limpiar Filtros */}
            <div className="users-filter-group users-filter-actions">
              <label style={{ visibility: "hidden" }}>Acción</label>
              <button
                type="button"
                onClick={handleClearFilters}
                className="users-filter-clear-btn"
                title="Restablecer filtros"
              >
                <RefreshCw size={15} />
                <span>Limpiar Filtros</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= TABLA PROFESIONAL ================= */}
      {filteredUsers.length === 0 ? (
        <div className="loading-container">
          <p>No se encontraron usuarios con los criterios seleccionados</p>
        </div>
      ) : (
        Object.entries(groupedUsers).map(([group, items]) => (
          <div key={group} className="group-section">
            {filters.groupBy !== "none" && (
              <div className="group-header-row">
                <h3 className="group-title">{group}</h3>
                <span className="group-count-badge">{items.length} usuarios</span>
              </div>
            )}

            <div className="table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px", textAlign: "center" }}>#</th>
                    <th>Usuario / Correo</th>
                    <th>Nombre Completo</th>
                    <th>Estado</th>
                    <th>Canal</th>
                    <th>Tipo</th>
                    <th>Roles</th>
                    <th>Cliente / Puntos</th>
                    <th>Empleado</th>
                    <th>Registro</th>
                    <th style={{ display: isMobile ? "none" : "table-cell", textAlign: "right" }}>
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((u) => {
                    const origin = getUserOrigin(u);
                    const verification = getUserVerification(u);
                    const fullName = getUserFullName(u);
                    const initials = getUserInitials(u);

                    return (
                      <tr key={u.id}>
                        {/* Columna Menú / ID */}
                        <td style={{ textAlign: "center", position: "relative" }}>
                          <RowDropdown
                            rowId={u.id}
                            activeId={activeDropdown}
                            setActiveId={setActiveDropdown}
                          >
                            <CanAccess permission="view_users">
                              <button
                                onClick={() => {
                                  setViewUser(u);
                                  setActiveDropdown(null);
                                }}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  padding: "10px 12px",
                                  textAlign: "left",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  cursor: "pointer",
                                  color: "var(--text-main)",
                                  width: "100%",
                                  fontSize: "14px",
                                }}
                              >
                                <Eye size={16} /> Ver detalle
                              </button>
                            </CanAccess>
                            <CanAccess permission="edit_users">
                              <button
                                onClick={() => {
                                  if (!canModify(u)) return;
                                  onEdit(u);
                                  setActiveDropdown(null);
                                }}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  padding: "10px 12px",
                                  textAlign: "left",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  cursor: canModify(u) ? "pointer" : "not-allowed",
                                  color: canModify(u)
                                    ? "var(--color-primary)"
                                    : "var(--text-muted)",
                                  width: "100%",
                                  fontSize: "14px",
                                }}
                                disabled={!canModify(u)}
                                title={!canModify(u) ? getModifyReason(u) : "Editar"}
                              >
                                <Edit size={16} /> Editar
                              </button>
                            </CanAccess>
                            <CanAccess permission="view_users">
                              <button
                                onClick={() => {
                                  generateUserPdf(u.id);
                                  setActiveDropdown(null);
                                }}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  padding: "10px 12px",
                                  textAlign: "left",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  cursor: "pointer",
                                  color: "var(--text-main)",
                                  width: "100%",
                                  fontSize: "14px",
                                }}
                              >
                                <FileText size={16} /> Exportar PDF
                              </button>
                            </CanAccess>
                            <CanAccess permission="delete_users">
                              <button
                                onClick={() => {
                                  if (!canModify(u)) return;
                                  setConfirmId(u.id);
                                  setActiveDropdown(null);
                                }}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  padding: "10px 12px",
                                  textAlign: "left",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  cursor: canModify(u) ? "pointer" : "not-allowed",
                                  color: canModify(u) ? "#ef4444" : "var(--text-muted)",
                                  width: "100%",
                                  fontSize: "14px",
                                }}
                                disabled={!canModify(u)}
                                title={!canModify(u) ? getModifyReason(u) : "Eliminar"}
                              >
                                <Trash2 size={16} /> Eliminar
                              </button>
                            </CanAccess>
                          </RowDropdown>
                        </td>

                        {/* Usuario / Correo con Avatar y Badges */}
                        <td>
                          <div className="table-user-cell">
                            <div className="table-user-avatar">
                              {u.avatar ? (
                                <img
                                  src={u.avatar}
                                  alt={u.username}
                                  className="table-avatar-img"
                                />
                              ) : (
                                <span>{initials}</span>
                              )}
                            </div>
                            <div className="table-user-info">
                              <div className="table-user-email-row">
                                <span className="table-user-email" title={u.email}>
                                  {u.email}
                                </span>
                                {/* Badge de Verificación */}
                                <span
                                  className={`table-badge-verify ${verification.statusClass}`}
                                  title={verification.label}
                                >
                                  {verification.icon}
                                  <span>{verification.label}</span>
                                </span>
                              </div>
                              <span className="table-user-username">@{u.username}</span>
                            </div>
                          </div>
                        </td>

                        {/* Nombre Completo */}
                        <td>
                          <span className="table-user-fullname">{fullName}</span>
                        </td>

                        {/* Estado */}
                        <td>
                          <span
                            className={`user-status-pill ${u.is_active ? "active" : "inactive"}`}
                          >
                            <span className="status-dot" />
                            {u.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        {/* Canal de Origen */}
                        <td>
                          <span className={`user-origin-pill ${origin.type}`} title={origin.label}>
                            {origin.icon}
                            <span>{origin.shortLabel}</span>
                          </span>
                        </td>

                        {/* Tipos de Cuenta */}
                        <td>
                          <div className="user-types-cell">
                            {u.owner?.is_active && (
                              <span className="user-type-tag owner">Owner</span>
                            )}
                            {u.customer?.is_active && (
                              <span className="user-type-tag customer">Cliente</span>
                            )}
                            {u.employee?.is_active && (
                              <span className="user-type-tag employee">Empleado</span>
                            )}
                            {!u.owner?.is_active &&
                              !u.customer?.is_active &&
                              !u.employee?.is_active && (
                                <span className="table-muted-text">-</span>
                              )}
                          </div>
                        </td>

                        {/* Roles */}
                        <td>
                          <div className="user-roles-cell">
                            {u.roles && u.roles.length > 0 ? (
                              u.roles.map((r) => (
                                <span key={r.id || r.name} className="user-role-badge">
                                  {r.name}
                                </span>
                              ))
                            ) : (
                              <span className="table-muted-text">-</span>
                            )}
                          </div>
                        </td>

                        {/* Cliente / Puntos */}
                        <td>
                          {u.customer?.is_active ? (
                            <div className="user-customer-cell">
                              <span className="user-code-badge">
                                {u.customer.customer_code}
                              </span>
                              <span className="user-points-badge">
                                {u.customer.points || 0} pts
                              </span>
                            </div>
                          ) : (
                            <span className="table-muted-text">-</span>
                          )}
                        </td>

                        {/* Empleado */}
                        <td>
                          {u.employee?.is_active ? (
                            <div className="user-employee-cell">
                              <span className="user-code-badge">
                                {u.employee.employee_code || "Sin código"}
                              </span>
                              <span className="user-role-sub">{u.employee.role}</span>
                            </div>
                          ) : (
                            <span className="table-muted-text">-</span>
                          )}
                        </td>

                        {/* Fecha de Registro */}
                        <td>
                          <span className="table-date">{formatDate(u.created_at)}</span>
                        </td>

                        {/* Acciones para Desktop */}
                        <td style={{ display: isMobile ? "none" : "table-cell", textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "4px",
                              justifyContent: "flex-end",
                              alignItems: "center",
                            }}
                          >
                            <CanAccess permission="view_users">
                              <button
                                className="btn-view"
                                onClick={() => setViewUser(u)}
                                title="Ver detalle"
                              >
                                <Eye size={15} />
                              </button>
                            </CanAccess>
                            <CanAccess permission="edit_users">
                              <button
                                className={`btn-edit ${!canModify(u) ? "disabled" : ""}`}
                                disabled={!canModify(u)}
                                title={!canModify(u) ? getModifyReason(u) : "Editar usuario"}
                                onClick={() => {
                                  if (!canModify(u)) return;
                                  onEdit(u);
                                }}
                              >
                                <Edit size={15} />
                              </button>
                            </CanAccess>
                            <CanAccess permission="view_users">
                              <button
                                className="btn-report"
                                onClick={() => generateUserPdf(u.id)}
                                title="Exportar PDF"
                              >
                                <FileText size={15} />
                              </button>
                            </CanAccess>
                            <CanAccess permission="delete_users">
                              <button
                                className={`btn-delete ${!canModify(u) ? "disabled" : ""}`}
                                disabled={!canModify(u)}
                                title={!canModify(u) ? getModifyReason(u) : "Eliminar usuario"}
                                onClick={() => {
                                  if (!canModify(u)) return;
                                  setConfirmId(u.id);
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </CanAccess>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Confirmación para Eliminar */}
      <ConfirmModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          const userToDelete = users.find((u) => u.id === confirmId);
          if (!userToDelete || !canModify(userToDelete)) {
            setConfirmId(null);
            return;
          }
          onDelete(confirmId);
          setConfirmId(null);
        }}
        title="Eliminar usuario"
        message="¿Seguro que deseas eliminar este usuario del sistema?"
        confirmText="Sí, eliminar"
        type="danger"
      />

      {/* Modal de Detalle Remasterizado */}
      {viewUser && (
        <UserViewModal
          user={viewUser}
          onClose={() => setViewUser(null)}
          onUserUpdated={(updatedUser) => {
            setViewUser(updatedUser);
            if (onReload) onReload();
          }}
        />
      )}
    </div>
  );
}
