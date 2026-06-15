import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { createSupplier, updateSupplier } from "../../../../api/admin/suppliers";
import "./Suppliers.css";

export default function SupplierModal({ supplier, onClose }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    contact_name: "",
    tax_id: "",
    phone: "",
    email: "",
    status: "active"
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        company_name: supplier.company_name || "",
        contact_name: supplier.contact_name || "",
        tax_id: supplier.tax_id || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        status: supplier.status || "active"
      });
    }
  }, [supplier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (supplier) {
        const { data } = await updateSupplier(supplier.id, formData);
        toast.success(data.message);
      } else {
        const { data } = await createSupplier(formData);
        toast.success(data.message);
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Ocurrió un error al guardar el proveedor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="suppliers-modal-overlay">
      <div className="suppliers-modal-content">
        <div className="suppliers-modal-header">
          <h2>{supplier ? "Editar Proveedor" : "Nuevo Proveedor"}</h2>
          <button className="suppliers-btn-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="suppliers-modal-body">
          <div className="suppliers-form-grid">
            <div className="suppliers-form-group full-width">
              <label>Nombre Comercial / Alias *</label>
              <input
                type="text"
                className="suppliers-form-input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej. Distribuidora Central"
              />
            </div>

            <div className="suppliers-form-group">
              <label>Razón Social (Opcional)</label>
              <input
                type="text"
                className="suppliers-form-input"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Ej. Distribuidores Unidos S.A."
              />
            </div>

            <div className="suppliers-form-group">
              <label>NIT / Identificación Fiscal</label>
              <input
                type="text"
                className="suppliers-form-input"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                placeholder="Ej. 123456789-0"
              />
            </div>

            <div className="suppliers-form-group full-width">
              <label>Nombre del Contacto</label>
              <input
                type="text"
                className="suppliers-form-input"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div className="suppliers-form-group">
              <label>Teléfono</label>
              <input
                type="text"
                className="suppliers-form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ej. +591 77777777"
              />
            </div>

            <div className="suppliers-form-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                className="suppliers-form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Ej. ventas@distribuidora.com"
              />
            </div>

            <div className="suppliers-form-group full-width">
              <label>Estado</label>
              <select
                className="suppliers-form-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="suppliers-modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-spin" style={{ marginRight: '8px' }}>⌛</span>
              ) : (
                <Save size={18} style={{ marginRight: '8px' }} />
              )}
              {supplier ? "Guardar Cambios" : "Crear Proveedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
