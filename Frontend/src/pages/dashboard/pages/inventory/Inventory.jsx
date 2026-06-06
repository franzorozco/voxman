import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getInventory } from "../../../../api/inventory";
import { getBranches } from "../../../../api/branches";
import { Search, Filter, History, AlertTriangle, ArrowRightLeft, PenTool } from "lucide-react";
import CanAccess from "../../../../components/ui/CanAccess";
import AdjustStockModal from "./AdjustStockModal";
import TransferStockModal from "./TransferStockModal";
import "./Inventory.css";
import { API_BASE_URL } from "../../../../config/api";

export default function Inventory() {
  const [inventories, setInventories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    search: "",
    branch_id: "",
    status: ""
  });

  const [adjustModal, setAdjustModal] = useState({ isOpen: false, item: null });
  const [transferModal, setTransferModal] = useState({ isOpen: false, item: null });

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, branchRes] = await Promise.all([
        getInventory(filters),
        getBranches()
      ]);
      setInventories(invRes.data?.data || []);
      setBranches(branchRes.data || branchRes || []);
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleAdjustSuccess = () => {
    setAdjustModal({ isOpen: false, item: null });
    loadData();
  };

  const handleTransferSuccess = () => {
    setTransferModal({ isOpen: false, item: null });
    loadData();
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1 className="inventory-title">Inventario</h1>

        <div className="inventory-actions">
          <CanAccess permission="view_inventory">
            <Link 
              to="/dashboard/inventory/movements"
              className="btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            >
              <History size={16} /> Historial de Movimientos
            </Link>
          </CanAccess>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: showFilters ? '15px' : '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar producto o SKU..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado de Stock</label>
              <select
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="in_stock">En Stock</option>
                <option value="low_stock">Bajo Stock</option>
                <option value="out_of_stock">Agotado</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Sucursal</th>
              <th>Stock Actual</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                  Cargando inventario...
                </td>
              </tr>
            ) : inventories.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                  No se encontraron registros de inventario.
                </td>
              </tr>
            ) : (
              inventories.map((item) => {
                const product = item.variant?.product;
                const isLowStock = item.stock <= item.min_stock && item.stock > 0;
                const isOutOfStock = item.stock <= 0;
                
                const imgUrl = product?.product_images?.find(img => img.is_main)?.url 
                               || product?.product_images?.[0]?.url;
                const finalImgUrl = imgUrl ? (imgUrl.startsWith("http") ? imgUrl : `${API_BASE_URL}${imgUrl}`) : "/placeholder.png";

                const attributesText = item.variant?.variant_attribute_values?.map(vav => vav.attribute_value?.value).filter(Boolean).join(", ") || "Única";

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img
                          src={finalImgUrl}
                          alt={product?.name}
                          className="product-img"
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                          onError={(e) => { e.target.src = `${API_BASE_URL}/storage/products/default.png`; }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ fontWeight: 600, lineHeight: '1.2' }}>{product?.name || "Desconocido"}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: '1.2' }}>
                            {product?.sku} | {attributesText}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{item.branch?.name || "Sin sucursal"}</td>
                    <td>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{item.stock}</span>
                      <span style={{ fontSize: '0.8em', color: 'var(--text-muted)', marginLeft: '4px' }}>uds</span>
                    </td>
                    <td>
                      {isOutOfStock ? (
                        <span className="status-badge danger"><AlertTriangle size={12} /> Agotado</span>
                      ) : isLowStock ? (
                        <span className="status-badge warning"><AlertTriangle size={12} /> Bajo Stock</span>
                      ) : (
                        <span className="status-badge success">En Stock</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <CanAccess permission="manage_inventory">
                          <button 
                            className="btn-edit" 
                            onClick={() => setAdjustModal({ isOpen: true, item })}
                            title="Ajustar Stock"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <PenTool size={16} /> Ajustar
                          </button>
                        </CanAccess>
                        
                        <CanAccess permission="manage_inventory">
                          <button 
                            className="btn-secondary" 
                            onClick={() => setTransferModal({ isOpen: true, item })}
                            title="Transferir Stock"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <ArrowRightLeft size={16} /> Transferir
                          </button>
                        </CanAccess>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {adjustModal.isOpen && (
        <AdjustStockModal 
          item={adjustModal.item}
          onClose={() => setAdjustModal({ isOpen: false, item: null })}
          onSuccess={handleAdjustSuccess}
        />
      )}

      {transferModal.isOpen && (
        <TransferStockModal 
          item={transferModal.item}
          branches={branches}
          onClose={() => setTransferModal({ isOpen: false, item: null })}
          onSuccess={handleTransferSuccess}
        />
      )}
    </div>
  );
}
