import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMovements } from "../../../../api/inventory";
import { getBranches } from "../../../../api/branches";
import { Search, Filter, ArrowLeft, ArrowUpRight, ArrowDownRight, RefreshCcw } from "lucide-react";
import "./Inventory.css";

export default function InventoryMovements() {
  const [movements, setMovements] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    branch_id: "",
    type: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [movRes, branchRes] = await Promise.all([
        getMovements(filters),
        getBranches()
      ]);
      setMovements(movRes.data?.data || []);
      setBranches(branchRes.data || branchRes || []);
    } catch (error) {
      console.error("Error loading movements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'in': return <ArrowDownRight size={16} color="#22c55e" />;
      case 'out': return <ArrowUpRight size={16} color="#ef4444" />;
      default: return <RefreshCcw size={16} color="#3b82f6" />;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'in': return <span style={{ color: '#22c55e', fontWeight: 600 }}>Entrada</span>;
      case 'out': return <span style={{ color: '#ef4444', fontWeight: 600 }}>Salida</span>;
      default: return <span style={{ color: '#3b82f6', fontWeight: 600 }}>Ajuste</span>;
    }
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/dashboard/inventory" className="btn-secondary" style={{ padding: '8px', borderRadius: '50%', display: 'flex' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="inventory-title">Historial de Movimientos</h1>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: showFilters ? '15px' : '0' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: showFilters ? 'var(--primary-color)' : 'var(--bg-card)', color: showFilters ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
          >
            <Filter size={18} />
            <span className="hide-on-mobile">Filtros</span>
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Sucursal</label>
              <select
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.branch_id}
                onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
              >
                <option value="">Todas</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Tipo de Movimiento</label>
              <select
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="in">Entradas</option>
                <option value="out">Salidas</option>
                <option value="adjustment">Ajustes</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Sucursal</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Referencia</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "24px" }}>
                  Cargando movimientos...
                </td>
              </tr>
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "24px" }}>
                  No hay movimientos registrados.
                </td>
              </tr>
            ) : (
              movements.map((mov) => {
                const date = new Date(mov.created_at).toLocaleString();
                const userName = mov.user?.profile?.first_name 
                                 ? `${mov.user.profile.first_name} ${mov.user.profile.last_name || ''}` 
                                 : mov.user?.username || 'Sistema';

                const product = mov.variant?.product;
                let imgUrl = mov.variant?.variant_images?.[0]?.url;

                if (!imgUrl) {
                  const attrIds = mov.variant?.variant_attribute_values?.map(vav => vav.attribute_value_id) || [];
                  const colorImg = product?.attribute_value_images?.find(img => attrIds.includes(img.attribute_value_id));
                  if (colorImg) {
                    imgUrl = colorImg.url;
                  }
                }

                if (!imgUrl) {
                  imgUrl = product?.product_images?.find(img => img.is_main)?.url || product?.product_images?.[0]?.url;
                }

                const finalImgUrl = imgUrl ? (imgUrl.startsWith("http") ? imgUrl : `${API_BASE_URL}${imgUrl}`) : "/placeholder.png";

                let colorVal = null;
                let otherAttrs = [];
                
                mov.variant?.variant_attribute_values?.forEach(vav => {
                  const attrName = vav.attribute_value?.attribute?.name?.toLowerCase() || "";
                  const isColor = attrName.includes("color") || vav.attribute_value?.attribute?.is_fixed || vav.attribute_value?.hex_code;
                  
                  if (isColor && !colorVal) {
                    colorVal = vav.attribute_value?.value;
                  } else if (vav.attribute_value?.value) {
                    otherAttrs.push(vav.attribute_value?.value);
                  }
                });

                const orderedAttrs = [];
                if (colorVal) orderedAttrs.push(colorVal);
                if (mov.variant?.size?.name) orderedAttrs.push(mov.variant.size.name);
                orderedAttrs.push(...otherAttrs);
                if (mov.variant?.fit?.name) orderedAttrs.push(mov.variant.fit.name);

                const attributesText = orderedAttrs.length > 0 ? orderedAttrs.join(", ") : "Única";

                return (
                  <tr key={mov.id}>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{date}</td>
                    <td>{userName}</td>
                    <td>{mov.branch?.name || "-"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img
                          src={finalImgUrl}
                          alt={mov.variant?.product?.name}
                          className="product-img"
                          style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '6px' }}
                          onError={(e) => { e.target.src = `${API_BASE_URL}/storage/products/default.png`; }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ fontWeight: 600, lineHeight: '1.2' }}>{mov.variant?.product?.name || "Desconocido"}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: '1.2' }}>
                            {mov.variant?.sku} | {attributesText}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getTypeIcon(mov.movement_type)}
                        {getTypeText(mov.movement_type)}
                      </div>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{mov.quantity}</td>
                    <td style={{ fontSize: '13px', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={mov.reference}>
                      {mov.reference || "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
