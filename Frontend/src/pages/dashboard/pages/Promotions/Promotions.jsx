import { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Edit, Trash2, Ticket } from "lucide-react";
import { toast } from "react-hot-toast";
import { getPromotions, deletePromotion } from "../../../../api/admin/discounts";
import PromotionModal from "./PromotionModal";
import PromotionCoupon from "./PromotionCoupon";
import "../Products/Products.css";
import { Link } from "react-router-dom";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedCouponPromo, setSelectedCouponPromo] = useState(null);

  // Menú de acciones (Dropdown)
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await getPromotions();
      setPromotions(res.data);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      toast.error("Error al cargar promociones");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (promo = null) => {
    setSelectedPromotion(promo);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleOpenCoupon = (promo) => {
    setSelectedCouponPromo(promo);
    setIsCouponModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas desactivar/eliminar esta promoción?")) return;
    try {
      await deletePromotion(id);
      toast.success("Promoción eliminada");
      fetchPromotions();
    } catch (error) {
      toast.error("Error al eliminar la promoción");
    }
  };

  const filteredPromotions = promotions.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Status calc
    const now = new Date();
    const start = new Date(p.start_date);
    const end = p.end_date ? new Date(p.end_date) : null;
    
    let calculatedStatus = 'active';
    if (!p.is_active) calculatedStatus = 'inactive';
    else if (now < start) calculatedStatus = 'scheduled';
    else if (end && now > end) calculatedStatus = 'expired';
    else if (p.usage_limit && p.times_used >= p.usage_limit) calculatedStatus = 'exhausted';

    const matchesStatus = filterStatus === 'all' || filterStatus === calculatedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="products-container">
      <div className="products-header">
        <h1 className="products-title">Promociones y Descuentos</h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o código..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
            />
          </div>

          <CustomSelect 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Activas</option>
            <option value="scheduled">Programadas (Futuras)</option>
            <option value="expired">Expiradas</option>
            <option value="exhausted">Agotadas (Límite de usos)</option>
            <option value="inactive">Inactivas</option>
          </CustomSelect>
          
          <Link to="/dashboard/promotions/deleted" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '8px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--bg-overlay)', color: 'var(--text-main)' }}>
             <Trash2 size={16}/> Papelera
          </Link>

          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Nueva Promoción
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            Cargando promociones...
          </div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Alcance (Targets)</th>
                <th>Límites</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th width="80">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromotions.length > 0 ? (
                filteredPromotions.map((promo) => {
                  
                  // Calculate target count
                  let targetLabels = [];
                  if (promo.brands?.length) targetLabels.push(`${promo.brands.length} Marcas`);
                  if (promo.categories?.length || promo.discount_categories?.length) targetLabels.push(`${(promo.categories || promo.discount_categories).length} Categorías`);
                  if (promo.products?.length) targetLabels.push(`${promo.products.length} Productos`);
                  if (promo.variants?.length) targetLabels.push(`${promo.variants.length} Variantes`);
                  if (promo.branches?.length) targetLabels.push(`${promo.branches.length} Sucursales`);
                  if (promo.customers?.length) targetLabels.push(`${promo.customers.length} Clientes`);
                  if (promo.employees?.length) targetLabels.push(`${promo.employees.length} Empleados`);

                  // Smart Status Logic
                  let statusText = 'Activo';
                  let statusClass = 'status-active';
                  
                  if (!promo.active) {
                    statusText = 'Inactivo';
                    statusClass = 'status-inactive';
                  } else if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
                    statusText = 'Agotado';
                    statusClass = 'status-inactive'; // Podríamos usar un gris
                  } else if (promo.end_date && new Date(promo.end_date).setHours(23,59,59,999) < new Date().getTime()) {
                    statusText = 'Expirado';
                    statusClass = 'status-inactive';
                  }

                  return (
                  <tr key={promo.id}>
                    <td>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{promo.name}</span>
                    </td>
                    <td>
                      {promo.is_automatic ? (
                        <span style={{ color: 'var(--text-muted)' }}>Automático</span>
                      ) : (
                        <span style={{ fontWeight: 600, letterSpacing: '1px', background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '4px' }}>
                          {promo.code}
                        </span>
                      )}
                    </td>
                    <td>{promo.type === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}</td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{promo.type === 'percentage' ? `${promo.value}%` : `Bs. ${promo.value}`}</span>
                        {promo.type === 'percentage' && promo.max_discount_amount && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                            Max: Bs. {promo.max_discount_amount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {targetLabels.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '180px' }}>
                          {targetLabels.slice(0, 3).map((lbl, idx) => (
                            <span key={idx} style={{ fontSize: '11px', background: 'var(--bg-overlay)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                              {lbl}
                            </span>
                          ))}
                          {targetLabels.length > 3 && (
                            <span style={{ fontSize: '11px', background: 'var(--bg-overlay)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-main)' }}>
                              +{targetLabels.length - 3} más
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--color-primary)', background: 'rgba(37, 99, 235, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          Global (Todo)
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {promo.usage_limit ? `Usos: ${promo.used_count}/${promo.usage_limit}` : 'Sin límite'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {promo.start_date ? new Date(promo.start_date).toLocaleDateString() : 'Siempre'} - 
                        {promo.end_date ? new Date(promo.end_date).toLocaleDateString() : ' Siempre'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${statusClass}`}>
                        {statusText}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                        <button 
                          className="btn-secondary"
                          onClick={() => handleOpenCoupon(promo)}
                          title="Imprimir Ticket"
                          style={{ padding: '6px' }}
                        >
                          <Ticket size={16} />
                        </button>
                        <button 
                          className="btn-edit"
                          onClick={() => handleOpenModal(promo)}
                        >
                          Editar
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDelete(promo.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No se encontraron promociones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <PromotionModal 
          promotion={selectedPromotion}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPromotions();
          }}
        />
      )}

      {isCouponModalOpen && selectedCouponPromo && (
        <PromotionCoupon 
          promotion={selectedCouponPromo}
          onClose={() => setIsCouponModalOpen(false)}
        />
      )}
    </div>
  );
}
