import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, Truck, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import { getSuppliers, deleteSupplier } from "../../../../api/admin/suppliers";
import SupplierModal from "./SupplierModal";
import { Link } from "react-router-dom";
import CanAccess from "../../../../components/ui/CanAccess";
import "./Suppliers.css";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data } = await getSuppliers(search);
      setSuppliers(data);
    } catch (error) {
      toast.error("Error al cargar proveedores");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este proveedor?")) {
      try {
        const { data } = await deleteSupplier(id);
        toast.success(data.message);
        fetchSuppliers();
      } catch (error) {
        toast.error("Error al eliminar el proveedor");
      }
    }
  };

  const openModal = (supplier = null) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedSupplier(null);
    setIsModalOpen(false);
    fetchSuppliers();
  };

  return (
    <div className="suppliers-container">
      <div className="suppliers-header">
        <h1 className="suppliers-title">
          <Truck size={28} className="text-primary" />
          Proveedores
        </h1>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/dashboard/suppliers/returns" className="btn-secondary">
            <RotateCcw size={16} />
            Devoluciones
          </Link>
          <Link to="/dashboard/suppliers/deleted" className="btn-secondary">
            <Trash2 size={16} />
            Papelera
          </Link>
          <CanAccess permission="create_suppliers">
            <button className="btn-primary" onClick={() => openModal()}>
              <Plus size={16} />
              Nuevo Proveedor
            </button>
          </CanAccess>
        </div>
      </div>

      <div className="suppliers-filters">
        <div className="suppliers-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, empresa, NIT, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="suppliers-search-input"
          />
        </div>
        <button className="btn-secondary" onClick={fetchSuppliers} title="Actualizar" style={{ padding: '10px' }}>
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="suppliers-table-container">
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Contacto</th>
              <th>NIT</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Cargando...</td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No se encontraron proveedores</td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{supplier.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{supplier.company_name}</div>
                  </td>
                  <td>
                    <div>{supplier.contact_name || "-"}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{supplier.email}</div>
                  </td>
                  <td>{supplier.tax_id || "-"}</td>
                  <td>{supplier.phone || "-"}</td>
                  <td>
                    <span className={`status-badge ${supplier.status === 'active' ? 'status-success' : 'status-danger'}`}>
                      {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <CanAccess permission="edit_suppliers">
                      <button
                        className="btn-edit"
                        onClick={() => openModal(supplier)}
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                    </CanAccess>
                    <CanAccess permission="delete_suppliers">
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(supplier.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </CanAccess>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <SupplierModal
          supplier={selectedSupplier}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
