import { useEffect, useState, useMemo } from "react";
import { getBundles, deleteBundle, updateBundle } from "../../../../api/admin/bundles";
import { getCategories } from "../../../../api/admin/categories";
import { getOwners } from "../../../../api/admin/owners";
import { getProductTypes } from "../../../../api/admin/productTypes";

import "./Bundles.css";
import "../css/stylesCruds.css";

import { Link } from "react-router-dom";
import { Plus, Search, Filter, Trash2, Package, DollarSign, Activity, Archive, TrendingUp } from "lucide-react";
import ConfirmModal from "../../../../components/ui/ConfirmModal";
import CanAccess from "../../../../components/ui/CanAccess";

import BundlesTable from "./BundlesTable";
import BundleForm from "./BundleForm";
import BundleViewModal from "./BundleViewModal";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function Bundles() {
  const [loadingData, setLoadingData] = useState(true);
  const [loadingBundles, setLoadingBundles] = useState(true);
  const [bundles, setBundles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [owners, setOwners] = useState([]);
  const [productTypes, setProductTypes] = useState([]);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", payload: null });
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedView, setSelectedView] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    owner: "",
    minPrice: "",
    maxPrice: "",
    stockStatus: ""
  });

  const loadBundles = async () => {
    try {
      setLoadingBundles(true);
      const res = await getBundles();
      setBundles(res.data?.data ?? res.data ?? []);
    } catch (error) {
      console.error("Error cargando conjuntos:", error);
    } finally {
      setLoadingBundles(false);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [categoriesRes, ownersRes, productTypesRes] = await Promise.all([
        getCategories(),
        getOwners(),
        getProductTypes()
      ]);
      setCategories(categoriesRes.data?.data ?? categoriesRes.data ?? []);
      setOwners(ownersRes.data?.data ?? ownersRes.data ?? []);
      setProductTypes(productTypesRes.data?.data ?? productTypesRes.data ?? []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadBundles();
    loadInitialData();
  }, []);

  const handleCreate = () => {
    setSelected(null);
    setOpen(true);
  };

  const handleSingleDelete = async (id) => {
    try {
      setLoadingBundles(true);
      await deleteBundle(id);
      loadBundles();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBundles(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setLoadingBundles(true);
      await Promise.all(selectedRows.map(id => deleteBundle(id)));
      setSelectedRows([]);
      loadBundles();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBundles(false);
    }
  };

  const handleBulkStatus = async (isActive) => {
    try {
      setLoadingBundles(true);
      await Promise.all(selectedRows.map(id => {
        const fd = new FormData();
        fd.append("is_active", isActive ? 1 : 0);
        return updateBundle(id, fd);
      }));
      setSelectedRows([]);
      loadBundles();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBundles(false);
    }
  };

  const enrichedBundles = useMemo(() => {
    return bundles.map(b => {
      let regularPrice = 0;
      let maxStock = Infinity;

      (b.bundle_items || []).forEach(item => {
        const qtyRequired = item.quantity || 1;
        let itemStock = 0;

        if (item.variant_id && item.variant) {
          regularPrice += (parseFloat(item.variant.price || item.product?.base_price || 0) * qtyRequired);
          itemStock = (item.variant.inventories || []).reduce((sum, inv) => sum + Number(inv.stock || 0), 0);
        } else if (item.product) {
          regularPrice += (parseFloat(item.product.base_price || 0) * qtyRequired);
          const variants = item.product.product_variants || [];
          if (variants.length > 0) {
            itemStock = variants.reduce((acc, v) => acc + (v.inventories || []).reduce((s, i) => s + Number(i.stock || 0), 0), 0);
          } else {
            itemStock = 0; // if no variants, no stock in this system
          }
        }
        
        const possibleBundles = Math.floor(itemStock / qtyRequired);
        if (possibleBundles < maxStock) maxStock = possibleBundles;
      });

      if (maxStock === Infinity || (b.bundle_items || []).length === 0) maxStock = 0;

      const basePrice = parseFloat(b.base_price || 0);
      const savings = regularPrice - basePrice;

      return {
        ...b,
        virtualStock: maxStock,
        regularPrice,
        savings: savings > 0 ? savings : 0,
      };
    });
  }, [bundles]);

  const filteredBundles = useMemo(() => {
    return enrichedBundles.filter((p) => {
      const search = filters.search.toLowerCase();
      const matchSearch = p.name?.toLowerCase().includes(search) || p.slug?.toLowerCase().includes(search);
      const matchCategory = !filters.category || p.category?.name === filters.category;
      const matchStatus = !filters.status || (filters.status === "active" ? p.is_active : !p.is_active);
      const matchOwner = !filters.owner || p.owner?.name === filters.owner;
      const matchMinPrice = !filters.minPrice || p.base_price >= parseFloat(filters.minPrice);
      const matchMaxPrice = !filters.maxPrice || p.base_price <= parseFloat(filters.maxPrice);
      
      let matchStock = true;
      if (filters.stockStatus === "in_stock") matchStock = p.virtualStock > 0;
      if (filters.stockStatus === "out_of_stock") matchStock = p.virtualStock === 0;

      return matchSearch && matchCategory && matchStatus && matchOwner && matchMinPrice && matchMaxPrice && matchStock;
    });
  }, [enrichedBundles, filters]);

  // KPIs
  const kpiStats = useMemo(() => {
    const total = bundles.length;
    const active = bundles.filter(b => b.is_active).length;
    const totalVirtualStock = enrichedBundles.reduce((acc, b) => acc + (b.virtualStock || 0), 0);
    const potentialValue = enrichedBundles.reduce((acc, b) => acc + ((b.virtualStock || 0) * (parseFloat(b.base_price) || 0)), 0);
    
    return { total, active, totalVirtualStock, potentialValue };
  }, [bundles, enrichedBundles]);

  return (
    <div className="bundles-container">
      <div className="bundles-header">
        <h1 className="bundles-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}><Package size={24} className="text-primary" /> Conjuntos</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <CanAccess permission="create_products">
            <button className="btn-primary" style={{ padding: "10px 14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px", border: "none", cursor: "pointer", fontWeight: 600 }} onClick={handleCreate}>
              <Package size={18} />
              <span className="hide-on-mobile">Crear Conjunto</span>
            </button>
          </CanAccess>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Total Conjuntos</p>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{kpiStats.total}</h3>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Conjuntos Activos</p>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{kpiStats.active}</h3>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Archive size={24} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Stock Virtual Total</p>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{kpiStats.totalVirtualStock}</h3>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Valor Potencial (Ingresos)</p>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>Bs. {kpiStats.potentialValue.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: showFilters ? '15px' : '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar conjunto por nombre..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: showFilters ? 'var(--color-primary)' : 'var(--bg-card)', color: showFilters ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
          >
            <Filter size={18} />
            <span className="hide-on-mobile">Filtros</span>
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Categoría</label>
              <CustomSelect
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">Todas</option>
                {[...new Set(bundles.filter(p => p.category?.name).map(p => p.category?.name))].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </CustomSelect>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Propietario</label>
              <CustomSelect
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.owner}
                onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
              >
                <option value="">Todos</option>
                {[...new Set(bundles.filter(p => p.owner?.name).map(p => p.owner?.name))].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </CustomSelect>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado</label>
              <CustomSelect
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </CustomSelect>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Stock Virtual</label>
              <CustomSelect
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.stockStatus}
                onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="in_stock">En Stock (&gt; 0)</option>
                <option value="out_of_stock">Sin Stock (0)</option>
              </CustomSelect>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Rango de Precio (Bs.)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Min"
                  style={{ width: '50%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Max"
                  style={{ width: '50%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedRows.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-actions-left">
            <span className="bulk-actions-count">{selectedRows.length} seleccionados</span>
            <div className="bulk-actions-divider"></div>
            <CanAccess permission="publish_products">
              <button className="btn btn-secondary" onClick={() => setConfirmModal({ isOpen: true, type: "bulkActive", payload: true })}>Activar</button>
              <button className="btn btn-secondary" onClick={() => setConfirmModal({ isOpen: true, type: "bulkInactive", payload: false })}>Inactivar</button>
            </CanAccess>
          </div>
          <div className="bulk-actions-right">
            <CanAccess permission="delete_products">
              <button className="btn btn-danger-bulk" onClick={() => setConfirmModal({ isOpen: true, type: "bulkDelete", payload: null })}>Eliminar</button>
            </CanAccess>
          </div>
        </div>
      )}

      <BundlesTable
        bundles={filteredBundles}
        loading={loadingBundles}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        onEdit={(p) => {
          setSelected(p);
          setOpen(true);
        }}
        onDelete={(id) => {
          setConfirmModal({ isOpen: true, type: "singleDelete", payload: id });
        }}
        onView={(p) => {
          setSelectedView(p);
          setViewOpen(true);
        }}
      />

      {viewOpen && selectedView && (
        <BundleViewModal
          bundle={selectedView}
          onClose={() => setViewOpen(false)}
        />
      )}

      {open && !loadingData && (
        <BundleForm
          bundle={selected}
          categories={categories}
          owners={owners}
          productTypes={productTypes}
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            loadBundles();
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: "", payload: null })}
        onConfirm={() => {
          if (confirmModal.type === "singleDelete") handleSingleDelete(confirmModal.payload);
          if (confirmModal.type === "bulkDelete") handleBulkDelete();
          if (confirmModal.type === "bulkActive") handleBulkStatus(true);
          if (confirmModal.type === "bulkInactive") handleBulkStatus(false);
        }}
        title="Eliminar conjunto"
        message={
          confirmModal.type === "singleDelete" || confirmModal.type === "bulkDelete"
            ? "¿Estás seguro de eliminar este conjunto? Esta acción no se puede deshacer."
            : "¿Estás seguro de cambiar el estado de estos conjuntos?"
        }
        confirmText={
          confirmModal.type === "singleDelete" || confirmModal.type === "bulkDelete"
            ? "Sí, eliminar"
            : "Sí, cambiar"
        }
        type={
          confirmModal.type === "singleDelete" || confirmModal.type === "bulkDelete"
            ? "danger"
            : "primary"
        }
      />
    </div>
  );
}
