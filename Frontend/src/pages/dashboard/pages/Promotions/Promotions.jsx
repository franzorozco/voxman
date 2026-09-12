import { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Edit, Trash2, Ticket, Eye, EyeOff, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import { getPromotions, deletePromotion } from "../../../../api/admin/discounts";
import PromotionModal from "./PromotionModal";
import PromotionCoupon from "./PromotionCoupon";
import "../Products/Products.css";
import "./Promotions.css";
import { Link } from "react-router-dom";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [visibleCodes, setVisibleCodes] = useState({});
  
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
      <div className="products-header promo-header-container">
        <div className="promo-header-title-row">
          <div className="promo-header-icon-box">
            <Ticket size={24} />
          </div>
          <div>
            <h1 className="products-title promo-header-title">Promociones y Descuentos</h1>
            <p className="promo-header-subtitle">Gestión de ofertas y cupones</p>
          </div>
        </div>

        <div className="promo-header-actions-row">
          <div className="promo-header-action-col">
            <Link to="/dashboard/promotions/deleted" className="btn-secondary promo-header-action-btn">
              <Trash2 size={18} style={{ flexShrink: 0 }} />
              <span className="hide-on-mobile">Papelera</span>
            </Link>
          </div>
          <div className="promo-header-action-col">
            <button className="btn-primary promo-header-action-btn" onClick={() => handleOpenModal()}>
              <Plus size={18} style={{ flexShrink: 0 }} />
              <span className="hide-on-mobile">Nueva Promoción</span>
            </button>
          </div>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner promo-filters-row">
          <div style={{ flex: 2 }} className="promo-search-wrapper">
            <Search size={18} className="promo-search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o código..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="promo-search-input"
            />
          </div>

          <div style={{ flex: 1 }}>
            <CustomSelect 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="promo-status-select"
              style={{ height: '42px' }}
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activas</option>
              <option value="scheduled">Programadas (Futuras)</option>
              <option value="expired">Expiradas</option>
              <option value="exhausted">Agotadas (Límite de usos)</option>
              <option value="inactive">Inactivas</option>
            </CustomSelect>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="promo-table-loading">
            Cargando promociones...
          </div>
        ) : (
          <table className="promo-table">
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
                    <td data-label="Nombre">
                      <span className="promo-name">{promo.name}</span>
                    </td>
                    <td data-label="Código">
                      {promo.is_automatic ? (
                        <span className="promo-automatic-label">Automático</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="promo-code-badge">
                            {visibleCodes[promo.id] ? promo.code : '••••••••'}
                          </span>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '4px', border: 'none', background: 'transparent' }}
                            onClick={() => setVisibleCodes(prev => ({ ...prev, [promo.id]: !prev[promo.id] }))}
                            title={visibleCodes[promo.id] ? "Ocultar código" : "Mostrar código"}
                          >
                            {visibleCodes[promo.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      )}
                    </td>
                    <td data-label="Tipo">{promo.type === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}</td>
                    <td data-label="Valor" className="promo-value-cell">
                      <div className="promo-value-wrapper">
                        <span>{promo.type === 'percentage' ? `${promo.value}%` : `Bs. ${promo.value}`}</span>
                        {promo.type === 'percentage' && promo.max_discount_amount && (
                          <span className="promo-max-discount">
                            Max: Bs. {promo.max_discount_amount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Alcance (Targets)">
                      {targetLabels.length > 0 ? (
                        <div className="promo-targets-wrapper">
                          {targetLabels.slice(0, 3).map((lbl, idx) => (
                            <span key={idx} className="promo-target-badge">
                              {lbl}
                            </span>
                          ))}
                          {targetLabels.length > 3 && (
                            <span className="promo-target-badge overflow">
                              +{targetLabels.length - 3} más
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="promo-target-badge global">
                          Global (Todo)
                        </span>
                      )}
                    </td>
                    <td data-label="Límites">
                      <div className="promo-limits-text" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {promo.usage_limit ? (
                          <span>Global: {promo.used_count || 0}/{promo.usage_limit}</span>
                        ) : null}
                        {promo.usage_limit_per_customer ? (
                          <span>Por cliente: {promo.usage_limit_per_customer}</span>
                        ) : null}
                        {!promo.usage_limit && !promo.usage_limit_per_customer && (
                          <span>Sin límite</span>
                        )}
                      </div>
                    </td>
                    <td data-label="Vigencia">
                      <div className="promo-dates-text">
                        {promo.start_date ? new Date(promo.start_date).toLocaleDateString() : 'Siempre'} - 
                        {promo.end_date ? new Date(promo.end_date).toLocaleDateString() : ' Siempre'}
                      </div>
                    </td>
                    <td data-label="Estado">
                      <span className={`status-badge ${statusClass}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="promo-actions-cell">
                      <span className="promo-actions-wrapper">
                        <button 
                          className="btn-secondary promo-ticket-btn"
                          onClick={() => handleOpenCoupon(promo)}
                          title="Imprimir Ticket"
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
                      </span>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="promo-empty-text">
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
