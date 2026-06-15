import { useState, useEffect } from "react";
import { getRoles } from "../../../../api/admin/roles";
import { restoreUser } from "../../../../api/admin/users";
import { useAuthStore } from "../../../../store/authStore";

export default function UserForm({ user, onClose, onSubmit }) {
  const authUser = useAuthStore((state) => state.user);
  const canManageRoles = authUser?.permissions?.includes("manage_user_roles") || authUser?.roles?.includes("Owner");
  const canManageSalaries = authUser?.permissions?.includes("manage_user_salaries") || authUser?.roles?.includes("Owner");
  const canManageExecutives = authUser?.permissions?.includes("manage_executives") || authUser?.roles?.includes("Owner");

  const [availableRoles, setAvailableRoles] = useState([]);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    is_active: true,

    first_name: "",
    last_name_paternal: "",
    last_name_maternal: "",
    phone: "",
    birthdate: "",
    gender: "",

    roles: [],
    types: [],

    customer_code: "",
    points: 0,
    total_purchases: 0,

    employee_code: "",
    employee_role: "seller",
    base_salary: 0,
    commission_percentage: 0,
  });

  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  const phoneRegex = /^[0-9]+$/;

  const today = new Date().toISOString().split("T")[0];
  const minDate = "1900-01-01";
  const [errors, setErrors] = useState({});
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
  let newErrors = {};

  
  // EMAIL
  if (!form.email) newErrors.email = "Email es obligatorio";

  // USERNAME
  if (!form.username) {
    newErrors.username = "Username es obligatorio";
  } else if (!usernameRegex.test(form.username)) {
    newErrors.username = "Solo letras, números y _ (sin espacios)";
  }

  // PASSWORD
  if (!user && !form.password) {
    newErrors.password = "Password obligatorio";
  } else if (form.password && form.password.length < 6) {
    newErrors.password = "Mínimo 6 caracteres";
  }

  // NOMBRE
  if (!form.first_name) {
    newErrors.first_name = "Nombre obligatorio";
  }

  // TELÉFONO
  if (form.phone && !phoneRegex.test(form.phone)) {
    newErrors.phone = "Solo números";
  }

  // FECHA
  if (form.birthdate) {
    if (form.birthdate > today) {
      newErrors.birthdate = "No puede ser futura";
    } else if (form.birthdate < minDate) {
      newErrors.birthdate = "Fecha no válida";
    }
  }

  // ROLES (recomendado obligatorio)
  if (form.roles.length === 0) {
    newErrors.roles = "Debe asignar al menos un rol";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  // 🔹 cargar roles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await getRoles();
        setAvailableRoles(res.data);
      } catch (error) {
        console.error("Error cargando roles", error);
      }
    };

    loadRoles();
  }, []);

  // 🔹 cargar usuario
  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || "",
        username: user.username || "",
        password: "",

        is_active: user.is_active ?? true,

        first_name: user.profile?.first_name || "",
        last_name_paternal: user.profile?.last_name_paternal || "",
        last_name_maternal: user.profile?.last_name_maternal || "",
        phone: user.profile?.phone || "",
        birthdate: user.profile?.birthdate || "",
        gender: user.profile?.gender || "",

        roles: user.roles?.map((r) => r.name) || [],
        types: [
          ...(user.owner?.is_active ? ["owner"] : []),
          ...(user.customer?.is_active ? ["customer"] : []),
          ...(user.employee?.is_active ? ["employee"] : []),
        ],

        customer_code: user.customer?.customer_code || "",
        points: user.customer?.points || 0,
        total_purchases: user.customer?.total_purchases || 0,

        employee_code: user.employee?.employee_code || "",
        employee_role: user.employee?.role || "seller",
        base_salary: user.employee?.base_salary || 0,
        commission_percentage: user.employee?.commission_percentage || 0,


      });
    }
  }, [user]);

const handleChange = (e) => {
  const { name, value, type, checked } = e.target;

  const newValue = type === "checkbox" ? checked : value;

  const updatedForm = {
    ...form,
    [name]: newValue,
  };

  setForm(updatedForm);

  const newErrors = validateField(name, newValue);
  setErrors((prev) => ({
    ...prev,
    [name]: newErrors,
  }));
};

const validateField = (name, value) => {
  switch (name) {
    case "email":
      if (!value) return "Email es obligatorio";
      if (!emailRegex.test(value)) return "Email no válido";
      return "";

    case "username":
      if (!value) return "Username es obligatorio";
      if (!usernameRegex.test(value)) return "Solo letras, números y _";
      return "";

    case "password":
      if (!user && !value) return "Password obligatorio";
      if (value && value.length < 6) return "Mínimo 6 caracteres";
      return "";

    case "first_name":
      if (!value) return "Nombre obligatorio";
      return "";

    case "phone":
      if (value && !phoneRegex.test(value)) return "Solo números";
      return "";

    default:
      return "";
  }
};


const handleSubmit = async (e) => {
  e.preventDefault();

  const isValid = validate();

  if (!isValid) return;

  const payload = {
    email: form.email,
    username: form.username,
    is_active: form.is_active,
    first_name: form.first_name,
    last_name_paternal: form.last_name_paternal,
    last_name_maternal: form.last_name_maternal,
    phone: form.phone ? `+591${form.phone}` : null,
    birthdate: form.birthdate,
    gender: form.gender,
  };

  if (form.roles.length > 0) payload.roles = form.roles;
  if (form.password) payload.password = form.password;
  payload.types = [...form.types]; // copia limpia

  if (form.types.includes("customer")) {
    payload.customer = {
      customer_code: form.customer_code,
      points: form.points,
      total_purchases: form.total_purchases,
    };
  }

  if (form.types.includes("employee")) {
    payload.employee = {
      employee_code: form.employee_code,
      role: form.employee_role,
      base_salary: form.base_salary,
      commission_percentage: form.commission_percentage,
    };
  }
  try {
    await onSubmit(payload);

  } catch (error) {

    // 🔥 ESTE ES EL BLOQUE CLAVE
    if (error.response?.status === 409) {
      // 👉 NO es error real
      // 👉 Users.jsx ya maneja el modal
      return;
    }

    const data = error.response?.data;

    // ❌ ERRORES REALES
    if (data?.field === "username") {
      setErrors((prev) => ({
        ...prev,
        username: data.message,
      }));

      setUsernameSuggestions(data.suggestions || []);
    }

    if (data?.field === "email") {
      setErrors((prev) => ({
        ...prev,
        email: data.message,
      }));
    }

    console.error("ERROR REAL:", error);
  }
};

  return (
    <div className="modal-overlay">
      <form className="modal" onSubmit={handleSubmit}>
        <h2>{user ? "Editar" : "Crear"} Usuario</h2>

        {/* ================= CUENTA ================= */}
        <div className="form-section">
          <h3>Datos de cuenta</h3>

          <div className="form-grid">
            <div className="form-group full-width">
              <label>Email *</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Username *</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className={errors.username ? "input-error" : ""}
              />

              {errors.username && <span className="error">{errors.username}</span>}

              {usernameSuggestions.length > 0 && (
                <div className="suggestions">
                  <small>Sugerencias:</small>
                  <div className="suggestion-list">
                    {usernameSuggestions.map((sug, index) => (
                      <span
                        key={index}
                        className="suggestion-item"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, username: sug }));
                          setUsernameSuggestions([]);
                          setErrors((prev) => ({ ...prev, username: "" }));
                        }}
                      >
                        {sug}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Password {!user && "*"}</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={errors.password ? "input-error" : ""}
              />
              {errors.password && <span className="error">{errors.password}</span>}
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                Usuario activo
              </label>
            </div>
          </div>
        </div>

        {/* ================= PERFIL ================= */}
        <div className="form-section">
          <h3>Perfil</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Nombre *</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className={errors.first_name ? "input-error" : ""}
              />
              
              {errors.first_name && <span className="error">{errors.first_name}</span>}
            </div>

            <div className="form-group">
              <label>Apellido paterno</label>
              <input name="last_name_paternal" value={form.last_name_paternal} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Apellido materno</label>
              <input name="last_name_maternal" value={form.last_name_maternal} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <div style={{ display: "flex", gap: "5px" }}>
                <select disabled value="+591">
                  <option value="+591">🇧🇴 +591</option>
                </select>

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="77777777"
                />
              </div>
              {errors.phone && <span className="error">{errors.phone}</span>}
            </div>
            <div className="form-group">
              <label>Fecha de nacimiento</label>
              <input
                type="date"
                name="birthdate"
                value={form.birthdate}
                onChange={handleChange}
                max={today}
                min={minDate}
              />
              {errors.birthdate && <span className="error">{errors.birthdate}</span>}
            </div>

            <div className="form-group">
              <label>Género</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Seleccione</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>
        </div>

        {/* ================= TIPO ================= */}
        <div className="form-section">
          <h3>Tipos de usuario</h3>

          <div className="types-grid">
            <label className={`type-card ${form.types.includes("owner") ? "active" : ""}`}>
              <input
                type="checkbox"
                checked={form.types.includes("owner")}
                disabled={!canManageExecutives}
                onChange={(e) => {
                  const checked = e.target.checked;

                  setForm((prev) => ({
                    ...prev,
                    types: checked
                      ? [...prev.types, "owner"]
                      : prev.types.filter((t) => t !== "owner"),
                  }));
                }}
              />
              <div className="type-content">
                <span className="type-title">Owner</span>
                <span className="type-desc">Control total del sistema</span>
              </div>
            </label>

            <label className={`type-card ${form.types.includes("customer") ? "active" : ""}`}>
              <input
                type="checkbox"
                checked={form.types.includes("customer")}
                onChange={(e) => {
                  const checked = e.target.checked;

                  setForm((prev) => ({
                    ...prev,
                    types: checked
                      ? [...prev.types, "customer"]
                      : prev.types.filter((t) => t !== "customer"),
                  }));
                }}
              />
              <div className="type-content">
                <span className="type-title">Customer</span>
                <span className="type-desc">Cliente con puntos y compras</span>
              </div>
            </label>

            <label className={`type-card ${form.types.includes("employee") ? "active" : ""}`}>
              <input
                type="checkbox"
                checked={form.types.includes("employee")}
                onChange={(e) => {
                  const checked = e.target.checked;

                  setForm((prev) => ({
                    ...prev,
                    types: checked
                      ? [...prev.types, "employee"]
                      : prev.types.filter((t) => t !== "employee"),
                  }));
                }}
              />
              <div className="type-content">
                <span className="type-title">Employee</span>
                <span className="type-desc">Empleado del sistema</span>
              </div>
            </label>
          </div>
        </div>
        {/* ================= CUSTOMER ================= */}
        {form.types.includes("customer") && (
          <div className="form-section">
            <h3>Información del Cliente</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>Código</label>
                <input
                  name="customer_code"
                  value={form.customer_code}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Puntos</label>
                <input value={form.points} disabled />
              </div>

              <div className="form-group">
                <label>Total compras</label>
                <input value={form.total_purchases} disabled />
              </div>
            </div>
          </div>
        )}


        {form.types.includes("employee") && (
          <div className="form-section">
            <h3>Información del Empleado</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>Código</label>
                <input
                  name="employee_code"
                  value={form.employee_code}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Rol</label>
                <select
                  name="employee_role"
                  value={form.employee_role}
                  onChange={handleChange}
                >
                  <option value="seller">Vendedor</option>
                  <option value="delivery">Delivery</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cajero</option>
                </select>
              </div>

              {canManageSalaries && (
                <>
                  <div className="form-group">
                    <label>Salario base</label>
                    <input
                      type="number"
                      name="base_salary"
                      value={form.base_salary}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>% Comisión</label>
                    <input
                      type="number"
                      name="commission_percentage"
                      value={form.commission_percentage}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}


        {/* ================= ROLES ================= */}
        <div className="form-section">
          <h3>Roles</h3>

          <div className="roles-grid">
            {availableRoles.map((role) => (
              <label key={role.id} className="role-item">
                <input
                  type="checkbox"
                  checked={form.roles.includes(role.name)}
                  disabled={!canManageRoles}
                  onChange={(e) => {
                    const checked = e.target.checked;

                    setForm((prev) => ({
                      ...prev,
                      roles: checked
                        ? [...prev.roles, role.name]
                        : prev.roles.filter((r) => r !== role.name),
                    }));
                  }}
                />
                {role.name}
              </label>
            ))}
            {errors.roles && <span className="error">{errors.roles}</span>}
          </div>
        </div>

        {/* ================= BOTONES ================= */}
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Guardar
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}