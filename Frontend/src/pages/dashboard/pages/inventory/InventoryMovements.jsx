import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMovements } from "../../../../api/admin/inventory";
import { getBranches } from "../../../../api/admin/branches";
import { API_BASE_URL } from "../../../../config/api";
import { Search, Filter, ArrowLeft, ArrowUpRight, ArrowDownRight, RefreshCcw } from "lucide-react";
import "./Inventory.css";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function InventoryMovements() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialBranchId = searchParams.get('branch_id') || "";
  const initialSearch = searchParams.get('search') || "";

  const [movements, setMovements] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    branch_id: initialBranchId,
    type: "",
    search: initialSearch
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [movRes, branchRes] = await Promise.all([
        getMovements(filters),
        getBranches()
      ]);
      console.log("getMovements res:", movRes);
      setMovements(movRes.data?.data || movRes.data || []);
      setBranches(branchRes.data?.data || branchRes.data || branchRes || []);
    } catch (error) {
      console.error("Error loading movements details:", error);
      if (error.response) console.error("Error response:", error.response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'transfer_in': 
      case 'purchase': 
      case 'return': 
        return <ArrowDownRight size={16} color="#22c55e" />;
      case 'transfer_out': 
      case 'sale': 
        return <ArrowUpRight size={16} color="#ef4444" />;
      case 'adjustment':
      default: 
        return <RefreshCcw size={16} color="#3b82f6" />;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'purchase': return <span style={{ color: '#22c55e', fontWeight: 600 }}>Compra</span>;
      case 'return': return <span style={{ color: '#22c55e', fontWeight: 600 }}>Devolución</span>;
      case 'transfer_in': return <span style={{ color: '#22c55e', fontWeight: 600 }}>Ingreso por Transferencia</span>;
      case 'sale': return <span style={{ color: '#ef4444', fontWeight: 600 }}>Venta</span>;
      case 'transfer_out': return <span style={{ color: '#ef4444', fontWeight: 600 }}>Salida por Transferencia</span>;
      case 'adjustment': return <span style={{ color: '#3b82f6', fontWeight: 600 }}>Ajuste</span>;
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
          <div className="search-bar" style={{ flex: 1, maxWidth: '400px' }}>
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por SKU, producto o nota..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="search-input"
            />
          </div>
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
              <CustomSelect
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.branch_id}
                onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
              >
                <option value="">Todas</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </CustomSelect>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Tipo de Movimiento</label>
              <CustomSelect
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="purchase">Compras</option>
                <option value="sale">Ventas</option>
                <option value="return">Devoluciones</option>
                <option value="transfer_in">Ingreso por Transferencia</option>
                <option value="transfer_out">Salida por Transferencia</option>
                <option value="adjustment">Ajustes</option>
              </CustomSelect>
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
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ animation: 'pulse 1.5s infinite ease-in-out' }}>
                  <td style={{ padding: '16px' }}><div style={{ width: '80px', height: '14px', borderRadius: '4px', background: 'var(--bg-input)' }}></div></td>
                  <td><div style={{ width: '100px', height: '14px', borderRadius: '4px', background: 'var(--bg-input)' }}></div></td>
                  <td><div style={{ width: '110px', height: '14px', borderRadius: '4px', background: 'var(--bg-input)' }}></div></td>
                  <td>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--bg-input)' }}></div>
                      <div>
                        <div style={{ width: '130px', height: '14px', borderRadius: '4px', background: 'var(--bg-input)', marginBottom: '4px' }}></div>
                        <div style={{ width: '90px', height: '10px', borderRadius: '4px', background: 'var(--bg-input)' }}></div>
                      </div>
                    </div>
                  </td>
                  <td><div style={{ width: '80px', height: '20px', borderRadius: '4px', background: 'var(--bg-input)' }}></div></td>
                  <td><div style={{ width: '40px', height: '14px', borderRadius: '4px', background: 'var(--bg-input)' }}></div></td>
                  <td><div style={{ width: '140px', height: '14px', borderRadius: '4px', background: 'var(--bg-input)' }}></div></td>
                </tr>
              ))
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', opacity: 0.8 }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <History size={32} />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text-main)', fontWeight: 600 }}>Sin movimientos</h3>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>No se encontraron registros en el historial de movimientos.</p>
                    </div>
                  </div>
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
