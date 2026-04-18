import { useState, useEffect } from "react";
import { getRoles } from "../../../../api/roles";

export default function UserForm({ user, onClose, onSubmit }) {
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
    type: "",

    customer_code: "",
    points: 0,
    total_purchases: 0,
  });

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
        type: user.owner ? "owner" : user.customer ? "customer" : "",

        customer_code: user.customer?.customer_code || "",
        points: user.customer?.points || 0,
        total_purchases: user.customer?.total_purchases || 0,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.email || !form.username || (!user && !form.password)) {
      alert("Email, username y password son obligatorios");
      return;
    }

    if (!form.first_name) {
      alert("El nombre es obligatorio");
      return;
    }

    const payload = {
      email: form.email,
      username: form.username,
      is_active: form.is_active,

      first_name: form.first_name,
      last_name_paternal: form.last_name_paternal,
      last_name_maternal: form.last_name_maternal,
      phone: form.phone,
      birthdate: form.birthdate,
      gender: form.gender,
    };

    if (form.roles.length > 0) payload.roles = form.roles;
    if (form.password) payload.password = form.password;
    if (form.type) payload.type = form.type;

    if (form.type === "customer") {
      payload.customer = {
        customer_code: form.customer_code,
        points: form.points,
        total_purchases: form.total_purchases,
      };
    }

    onSubmit(payload);
  };

  return (
    <div className="modal-overlay">
      <form className="modal" onSubmit={handleSubmit}>
        <h2>{user ? "Editar" : "Crear"} Usuario</h2>

        {/* ================= CUENTA ================= */}
        <div className="form-section">
          <h3>Datos de cuenta</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Email *</label>
              <input name="email" value={form.email} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Username *</label>
              <input name="username" value={form.username} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Password {!user && "*"}</label>
              <input type="password" name="password" onChange={handleChange} />
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
              <input name="first_name" value={form.first_name} onChange={handleChange} />
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
              <input name="phone" value={form.phone} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Fecha de nacimiento</label>
              <input type="date" name="birthdate" value={form.birthdate} onChange={handleChange} />
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
          <h3>Tipo de usuario</h3>

          <div className="form-group">
            <label>Tipo</label>
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="">Ninguno</option>
              <option value="owner">Owner</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>

        {/* ================= CUSTOMER ================= */}
        {form.type === "customer" && (
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

        {/* ================= ROLES ================= */}
        <div className="form-section">
          <h3>Roles</h3>

          <div className="roles-grid">
            {availableRoles.map((role) => (
              <label key={role.id} className="role-item">
                <input
                  type="checkbox"
                  checked={form.roles.includes(role.name)}
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