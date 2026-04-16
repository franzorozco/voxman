import { useState, useEffect } from "react";

export default function UserForm({ user, onClose, onSubmit }) {
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
  });

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || "",
        username: user.username || "",
        password: "",

        is_active: user.is_active,

        first_name: user.profile?.first_name || "",
        last_name_paternal: user.profile?.last_name_paternal || "",
        last_name_maternal: user.profile?.last_name_maternal || "",
        phone: user.profile?.phone || "",
        birthdate: user.profile?.birthdate || "",
        gender: user.profile?.gender || "",

        roles: user.roles?.map((r) => r.name) || [],
        type: user.owner ? "owner" : user.customer ? "customer" : "",
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

    onSubmit({
      ...form,
      roles: form.roles, // asegurado
      type: form.type || null
    });
  };

  return (
    <div className="modal-overlay">
      <form className="modal" onSubmit={handleSubmit}>
        <h2>{user ? "Editar" : "Crear"} Usuario</h2>

        <div className="form-group">
          <label>Email</label>
          <input name="email" value={form.email} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Username</label>
          <input name="username" value={form.username} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input type="password" name="password" onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Tipo</label>
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="">Seleccione</option>
            <option value="owner">Owner</option>
            <option value="customer">Customer</option>
          </select>
        </div>
        

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Guardar
          </button>
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}