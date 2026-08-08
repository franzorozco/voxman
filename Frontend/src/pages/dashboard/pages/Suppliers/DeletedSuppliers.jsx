import { useState, useEffect } from "react";
import { ArrowLeft, Search, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { getDeletedSuppliers, restoreSupplier, forceDeleteSupplier } from "../../../../api/admin/suppliers";
import { Link } from "react-router-dom";
import CanAccess from "../../../../components/ui/CanAccess";
import "./Suppliers.css";

export default function DeletedSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchDeletedSuppliers = async () => {
    try {
      setLoading(true);
      const { data } = await getDeletedSuppliers();
      setSuppliers(data);
    } catch (error) {
      toast.error("Error al cargar proveedores eliminados");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedSuppliers();
  }, []);

  const handleRestore = async (id) => {
    if (window.confirm("¿Deseas restaurar este proveedor? Volverá a estar disponible en el sistema.")) {
      try {
        const { data } = await restoreSupplier(id);
        toast.success(data.message);
        fetchDeletedSuppliers();
      } catch (error) {
        toast.error("Error al restaurar el proveedor");
      }
    }
  };

  const handleForceDelete = async (id) => {
    if (window.confirm("⚠️ ADVERTENCIA: Esta acción eliminará permanentemente al proveedor y podría afectar el historial de compras. ¿Estás absolutamente seguro?")) {
      try {
        const { data } = await forceDeleteSupplier(id);
        toast.success(data.message);
        fetchDeletedSuppliers();
      } catch (error) {
        toast.error("Error al eliminar permanentemente");
      }
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.tax_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="suppliers-container">
      <div className="suppliers-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="suppliers-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--color-danger)' }}>
          <Trash2 size={28} />
          Proveedores Eliminados
        </h1>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'nowrap', flex: 1, justifyContent: 'flex-end', width: '100%', overflowX: 'auto' }}>
          <Link to="/dashboard/suppliers" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 4px', minWidth: '0', maxWidth: '200px' }}>
            <ArrowLeft size={14} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden' }}>Volver a Proveedores</span>
          </Link>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner" style={{ display: 'flex', gap: '12px', marginBottom: '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar proveedor eliminado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Contacto</th>
              <th>NIT</th>
              <th>Fecha Eliminación</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Cargando...</td>
              </tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>La papelera está vacía</td>
              </tr>
            ) : (
              filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} style={{ opacity: 0.75 }}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{supplier.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{supplier.company_name}</div>
                  </td>
                  <td>
                    <div>{supplier.contact_name || "-"}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{supplier.email}</div>
                  </td>
                  <td>{supplier.tax_id || "-"}</td>
                  <td>{new Date(supplier.deleted_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <CanAccess permission="restore_suppliers">
                      <button
                        className="btn-restore"
                        onClick={() => handleRestore(supplier.id)}
                        title="Restaurar Proveedor"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </CanAccess>
                    <CanAccess permission="delete_suppliers">
                      <button
                        className="btn-delete"
                        onClick={() => handleForceDelete(supplier.id)}
                        title="Eliminar Permanentemente"
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
    </div>
  );
}
