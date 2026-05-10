import { useState, useEffect } from "react";

export default function ProductForm({ product, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    base_price: "",
    category_id: "",
    owner_id: "",
  });

  useEffect(() => {
    if (product) {
      setForm(product);
    }
  }, [product]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{product ? "Editar Producto" : "Crear Producto"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre</label>
              <input name="name" value={form.name} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <input name="description" value={form.description} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Precio</label>
              <input name="base_price" value={form.base_price} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Categoria ID</label>
              <input name="category_id" value={form.category_id} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Owner ID</label>
              <input name="owner_id" value={form.owner_id} onChange={handleChange} />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" className="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}