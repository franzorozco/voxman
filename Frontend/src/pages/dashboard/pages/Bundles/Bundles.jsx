import { useEffect, useState, useMemo } from "react";
import { getBundles, deleteBundle } from "../../../../api/bundles";
import { getCategories } from "../../../../api/categories";
import { getOwners } from "../../../../api/owners";
import { getProductTypes } from "../../../../api/productTypes";

import "./Bundles.css";
import "../css/stylesCruds.css";

import { Link } from "react-router-dom";
import { Search, Filter, Trash2 } from "lucide-react";
import ConfirmModal from "../../../../components/ui/ConfirmModal";
import CanAccess from "../../../../components/ui/CanAccess";

import BundlesTable from "./BundlesTable";
import BundleForm from "./BundleForm";

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
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: ""
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

  const filteredBundles = useMemo(() => {
    return bundles.filter((p) => {
      const search = filters.search.toLowerCase();
      const matchSearch = p.name?.toLowerCase().includes(search) || p.slug?.toLowerCase().includes(search);
      const matchCategory = !filters.category || p.category?.name === filters.category;
      const matchStatus = !filters.status || (filters.status === "active" ? p.is_active : !p.is_active);
      return matchSearch && matchCategory && matchStatus;
    });
  }, [bundles, filters]);

  return (
    <div className="bundles-container">
      <div className="bundles-header">
        <h1 className="bundles-title">Conjuntos</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <CanAccess permission="create_products">
            <button className="btn-primary" onClick={handleCreate}>
              + Crear Conjunto
            </button>
          </CanAccess>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: showFilters ? '15px' : '0' }}>
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
              <select
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">Todas</option>
                {[...new Set(bundles.filter(p => p.category?.name).map(p => p.category?.name))].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado</label>
              <select
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <BundlesTable
        bundles={filteredBundles}
        loading={loadingBundles}
        onEdit={(p) => {
          setSelected(p);
          setOpen(true);
        }}
        onDelete={(id) => {
          setConfirmModal({ isOpen: true, type: "singleDelete", payload: id });
        }}
      />

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
        }}
        title="Eliminar conjunto"
        message="¿Estás seguro de eliminar este conjunto? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        type="danger"
      />
    </div>
  );
}
