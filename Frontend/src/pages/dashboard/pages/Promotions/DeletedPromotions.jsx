import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Trash2, Search, Ticket, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { getDeletedPromotions, restorePromotion, forceDeletePromotion } from "../../../../api/admin/discounts";
import { Link } from "react-router-dom";
import "./Promotions.css";

export default function DeletedPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCodes, setVisibleCodes] = useState({});

  useEffect(() => {
    fetchDeleted();
  }, []);

  const fetchDeleted = async () => {
    try {
      setLoading(true);
      const res = await getDeletedPromotions();
      setPromotions(res.data);
    } catch (error) {
      toast.error("Error al cargar promociones eliminadas");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("¿Deseas restaurar esta promoción?")) return;
    try {
      await restorePromotion(id);
      toast.success("Promoción restaurada");
      fetchDeleted();
    } catch (error) {
      toast.error("Error al restaurar");
    }
  };

  const handleForceDelete = async (id) => {
    if (!window.confirm("¿Eliminar permanentemente? Esta acción es irreversible.")) return;
    try {
      await forceDeletePromotion(id);
      toast.success("Promoción eliminada permanentemente");
      fetchDeleted();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const filtered = promotions.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="products-container">
      <div className="products-header promo-header-container">
        <div className="promo-header-title-row">
          <Link to="/dashboard/promotions" className="btn-secondary" style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="products-title promo-header-title">Papelera de Promociones</h1>
            <p className="promo-header-subtitle">Promociones desactivadas o eliminadas</p>
          </div>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner promo-filters-row">
          <div style={{ flex: 1 }} className="promo-search-wrapper">
            <Search size={18} className="promo-search-icon" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="promo-search-input"
            />
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="promo-table-loading">
            Cargando papelera...
          </div>
        ) : (
          <table className="promo-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Alcance</th>
                <th>Eliminación</th>
                <th width="150">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((promo) => {
                  // Calculate target count
                  let targetLabels = [];
                  if (promo.brands?.length) targetLabels.push(`${promo.brands.length} Marcas`);
                  if (promo.categories?.length || promo.discount_categories?.length) targetLabels.push(`${(promo.categories || promo.discount_categories).length} Categorías`);
                  if (promo.products?.length) targetLabels.push(`${promo.products.length} Productos`);
                  if (promo.variants?.length) targetLabels.push(`${promo.variants.length} Variantes`);
                  if (promo.branches?.length) targetLabels.push(`${promo.branches.length} Sucursales`);
                  if (promo.customers?.length) targetLabels.push(`${promo.customers.length} Clientes`);
                  if (promo.employees?.length) targetLabels.push(`${promo.employees.length} Empleados`);

                  return (
                  <tr key={promo.id}>
                    <td data-label="Nombre">
                      <span className="promo-name">{promo.name}</span>
                    </td>
                    <td data-label="Código">
                      {!promo.code ? (
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
                    <td data-label="Tipo">{promo.type === 'percentage' ? 'Porcentaje' : 'Fijo'}</td>
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
                    <td data-label="Alcance">
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
                    <td data-label="Eliminación">{new Date(promo.deleted_at).toLocaleDateString()}</td>
                    <td className="promo-actions-cell">
                      <span className="promo-actions-wrapper">
                        <button 
                          className="action-btn promo-restore-btn" 
                          title="Restaurar"
                          onClick={() => handleRestore(promo.id)}
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button 
                          className="action-btn promo-force-delete-btn" 
                          title="Eliminar Permanente"
                          onClick={() => handleForceDelete(promo.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </span>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="promo-empty-text">
                    La papelera está vacía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
