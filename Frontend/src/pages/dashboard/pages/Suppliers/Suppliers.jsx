import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, Truck, RefreshCw, RotateCcw } from "lucide-react";
import RowDropdown from "../../../../components/ui/RowDropdown";
import { toast } from "react-hot-toast";
import { Eye, MoreVertical } from "lucide-react";
import { getSuppliers, deleteSupplier, getSupplierStats } from "../../../../api/admin/suppliers";
import SupplierModal from "./SupplierModal";
import { Link, useNavigate } from "react-router-dom";
import CanAccess from "../../../../components/ui/CanAccess";
import "./Suppliers.css";
import { Building2, DollarSign, ShoppingBag } from "lucide-react";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const navigate = useNavigate();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const [suppRes, statsRes] = await Promise.all([
        getSuppliers(search),
        getSupplierStats()
      ]);
      setSuppliers(suppRes.data);
      setStats(statsRes.data);
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
    if (window.confirm("Â¿EstÃ¡s seguro de que deseas eliminar este proveedor?")) {
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
      <div className="suppliers-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="suppliers-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Truck size={28} className="text-primary" />
          Proveedores
        </h1>

        <div className="suppliers-action-buttons" style={{ display: 'flex', flex: isMobile ? 1 : 'unset', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
          <Link to="/dashboard/suppliers/returns" className="btn-secondary" style={{ display: 'flex', flex: isMobile ? 1 : 'unset', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={18} />
            <span className="hide-on-mobile">Devoluciones</span>
          </Link>
          <Link to="/dashboard/suppliers/deleted" className="btn-secondary" style={{ display: 'flex', flex: isMobile ? 1 : 'unset', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={18} />
            <span className="hide-on-mobile">Papelera</span>
          </Link>
          <CanAccess permission="create_suppliers">
            <button className="btn-primary" onClick={() => openModal()} style={{ display: 'flex', flex: isMobile ? 1 : 'unset', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} />
              <span className="hide-on-mobile">Agregar</span>
            </button>
          </CanAccess>
          <button onClick={fetchSuppliers} className="btn-secondary" style={{ display: 'flex', flex: isMobile ? 1 : 'unset', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span className="hide-on-mobile">Actualizar</span>
          </button>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} color="var(--color-primary)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Proveedores</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>{stats.total_suppliers}</div>
          </div>
          
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={16} color="var(--color-success)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Proveedores Activos</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>{stats.active_suppliers}</div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={16} color="var(--color-warning)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Compras de este mes</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Bs. {Number(stats.purchases_this_month).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
        </div>
      )}

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner" style={{ display: 'flex', gap: '12px', marginBottom: '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar por nombre, empresa, NIT, email..." 
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
              <th>TelÃ©fono</th>
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
                  <td style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <RowDropdown rowId={supplier.id} activeId={activeDropdown} setActiveId={setActiveDropdown}>
                        <CanAccess permission="view_suppliers">
                          <button
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', width: '100%', textAlign: 'left', fontSize: '14px', cursor: 'pointer' }}
                            onClick={() => {
                              navigate(`/dashboard/suppliers/${supplier.id}`);
                              setActiveDropdown(null);
                            }}
                          >
                            <Eye size={16} /> Ver Perfil
                          </button>
                        </CanAccess>
                        <CanAccess permission="edit_suppliers">
                          <button
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', width: '100%', textAlign: 'left', fontSize: '14px', cursor: 'pointer' }}
                            onClick={() => {
                              openModal(supplier);
                              setActiveDropdown(null);
                            }}
                          >
                            <Edit size={16} /> Editar
                          </button>
                        </CanAccess>
                        <CanAccess permission="delete_suppliers">
                          <button
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: 'none', color: '#ef4444', width: '100%', textAlign: 'left', fontSize: '14px', cursor: 'pointer' }}
                            onClick={() => {
                              handleDelete(supplier.id);
                              setActiveDropdown(null);
                            }}
                          >
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </CanAccess>
                      </RowDropdown>

                      <div>
                        <div style={{ fontWeight: 600 }}>{supplier.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{supplier.company_name}</div>
                      </div>
                    </div>
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
                    <div className="hide-on-mobile action-buttons">
                      <CanAccess permission="view_suppliers">
                        <button
                          className="btn-icon btn-view"
                          onClick={() => navigate(`/dashboard/suppliers/${supplier.id}`)}
                          title="Ver Perfil"
                        >
                          <Eye size={16} />
                        </button>
                      </CanAccess>
                      <CanAccess permission="edit_suppliers">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => openModal(supplier)}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                      </CanAccess>
                      <CanAccess permission="delete_suppliers">
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(supplier.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </CanAccess>
                    </div>
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



