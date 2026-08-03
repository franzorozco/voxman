import { useEffect, useState, useMemo } from "react";

import {
  getProducts,
  createProduct,
  updateProduct,
  updatePartialProduct,
  deleteProduct,
} from "../../../../api/admin/products";

import { getCategories } from "../../../../api/admin/categories";
import { getOwners } from "../../../../api/admin/owners";
import { getProductTypes } from "../../../../api/admin/productTypes";
import { getAttributes } from "../../../../api/admin/attributes";
import { getSizes } from "../../../../api/admin/sizes";
import { getFits } from "../../../../api/admin/fits";

import "./Products.css";
import "../css/stylesCruds.css";
import { Link } from "react-router-dom";
import { X, Trash2, Search, Filter, Camera, Package, Plus } from "lucide-react";
import ConfirmModal from "../../../../components/ui/ConfirmModal";
import CanAccess from "../../../../components/ui/CanAccess";

import useScanner from "../../../../hooks/useScanner";
import { useScannerStore } from "../../../../store/useScannerStore";
import toast from "react-hot-toast";

import ProductsTable from "./ProductsTable";
import ProductForm from "./ProductForm";
import ProductViewModal from "./ProductViewModal";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function Products() {
  const [loadingData, setLoadingData] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [owners, setOwners] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [fits, setFits] = useState([]);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", payload: null });
  const [selected, setSelected] = useState(null);
  const [selectedView, setSelectedView] = useState(null);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    owner: "",
    status: "",
    minPrice: "",
    maxPrice: "",
    stockStatus: "",
    tag: "",
    sortBy: "name",
    sortDir: "asc",
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({ owner_id: "", category_id: "" });

  const openScanner = useScannerStore(state => state.openScanner);
  const [scannedVariantId, setScannedVariantId] = useState(null);

  const processScannedCode = (scannedText) => {
    const code = scannedText.includes('/p/') ? scannedText.split('/p/').pop().trim() : scannedText.trim();
    if (!code) return;
    
    let foundVariant = null;
    let foundProduct = null;
    
    for (const p of products) {
        const v = p.product_variants?.find(v => v.sku === code || v.barcode === code);
        if (v) {
            foundVariant = v;
            foundProduct = p;
            break;
        }
    }
    
    if (foundVariant && foundProduct) {
        setSelectedView(foundProduct);
        setScannedVariantId(foundVariant.id);
        setViewOpen(true);
    } else {
        toast.error("Producto o variante no encontrada", { icon: '🔍' });
    }
  };

  useScanner(processScannedCode, !open && !viewOpen && !bulkEditOpen);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);

      const res = await getProducts();

      setProducts(
        res.data?.data ??
        res.data ??
        []
      );

    } catch (error) {
      console.error(
        "Error cargando productos:",
        error
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setLoadingProducts(true);
      await Promise.all(selectedRows.map(id => deleteProduct(id)));
      setSelectedRows([]);
      loadProducts();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleBulkStatus = async (isActive) => {
    try {
      setLoadingProducts(true);
      await Promise.all(selectedRows.map(id => {
        const fd = new FormData();
        fd.append("is_active", isActive ? 1 : 0);
        return updatePartialProduct(id, fd);
      }));
      setSelectedRows([]);
      loadProducts();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSingleDelete = async (id) => {
    try {
      setLoadingProducts(true);
      await deleteProduct(id);
      loadProducts();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleBulkEditSubmit = async () => {
    if (!bulkEditForm.owner_id && !bulkEditForm.category_id) {
      setBulkEditOpen(false);
      return;
    }

    try {
      setLoadingProducts(true);
      await Promise.all(selectedRows.map(id => {
        const fd = new FormData();
        if (bulkEditForm.owner_id) fd.append("owner_id", bulkEditForm.owner_id);
        if (bulkEditForm.category_id) fd.append("category_id", bulkEditForm.category_id);
        return updatePartialProduct(id, fd);
      }));
      setSelectedRows([]);
      setBulkEditOpen(false);
      setBulkEditForm({ owner_id: "", category_id: "" });
      loadProducts();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoadingData(true);

      const [
        categoriesRes,
        ownersRes,
        productTypesRes,
        attributesRes,
        sizesRes,
        fitsRes,
      ] = await Promise.all([
        getCategories(),
        getOwners(),
        getProductTypes(),
        getAttributes(),
        getSizes(),
        getFits(),
      ]);

      setCategories(categoriesRes.data?.data ?? categoriesRes.data ?? []);
      setOwners(ownersRes.data?.data ?? ownersRes.data ?? []);
      setProductTypes(productTypesRes.data?.data ?? productTypesRes.data ?? []);
      setAttributes(attributesRes.data?.data ?? attributesRes.data ?? []);
      setSizes(sizesRes.data?.data ?? sizesRes.data ?? []);
      setFits(fitsRes.data?.data ?? fitsRes.data ?? []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadInitialData();
  }, []);

  const handleCreate = () => {
    setSelected(null);
    setOpen(true);
  };

  const handleSubmit = async (data) => {
    try {
      if (selected) {
        await updateProduct(
          selected.id,
          data
        );
      } else {
        await createProduct(data);
      }
      setOpen(false);
      loadProducts();
    } catch (error) {

      console.error(
        "Error guardando producto:",
        error.response?.data
      );
    }
  };

  const enrichedProducts = useMemo(() => {
    return products.map((p) => {
      const variants =
        p.product_variants || [];
      const stock = variants.reduce(
        (acc, v) => {

          return (
            acc +
            (v.inventories || []).reduce(
              (s, i) =>
                s +
                Number(i?.stock || 0),
              0
            )
          );
        },
        0
      );
      const cost =
        variants?.[0]?.cost || 0;

      const price =
        variants?.[0]?.price ||
        p.base_price ||
        0;

      return {
        ...p,
        stock,
        cost,
        price,
        margin: price - cost,
        variantsCount:
          variants.length,
      };
    });

  }, [products]);

  const filteredProducts = useMemo(() => {
    return enrichedProducts
      .filter((p) => !p.is_bundle)
      .filter((p) => {
        const search = filters.search.toLowerCase();
        const matchSearch =
          p.name?.toLowerCase().includes(search) ||
          p.slug?.toLowerCase().includes(search);
          
        const matchCategory =
          !filters.category || p.category?.name === filters.category;
          
        const matchStatus =
          !filters.status ||
          (filters.status === "active" ? p.is_active : !p.is_active);

        const matchMin =
          !filters.minPrice || p.price >= Number(filters.minPrice);
          
        const matchMax =
          !filters.maxPrice || p.price <= Number(filters.maxPrice);
          
        const matchOwner = 
          !filters.owner || String(p.owner_id) === String(filters.owner);
          
        const matchTag = 
          !filters.tag || (p.tags && p.tags.includes(filters.tag));
          
        let matchStock = true;
        if (filters.stockStatus) {
          if (filters.stockStatus === 'in_stock') matchStock = p.stock > 0;
          if (filters.stockStatus === 'out_of_stock') matchStock = p.stock <= 0;
          if (filters.stockStatus === 'low_stock') {
            // Simplified low stock check: any variant has stock <= min_stock
            const variants = p.product_variants || [];
            matchStock = variants.some(v => {
              const vStock = v.inventories?.reduce((s, inv) => s + (inv.stock || inv.quantity || 0), 0) || 0;
              const minStock = v.inventories?.reduce((max, inv) => Math.max(max, inv.min_stock || 0), 0) || 0;
              return vStock > 0 && vStock <= minStock;
            });
          }
        }

        return (
          matchSearch &&
          matchCategory &&
          matchStatus &&
          matchMin &&
          matchMax &&
          matchOwner &&
          matchTag &&
          matchStock
        );
      })

      .sort((a, b) => {

        const dir =
          filters.sortDir === "asc"
            ? 1
            : -1;

        const getValue = (p) => {

          switch (filters.sortBy) {

            case "price":
              return p.price;

            case "stock":
              return p.stock;

            case "margin":
              return p.margin;

            case "views":
              return p.views;

            case "name":
            default:
              return p.name;
          }
        };

        const valA = getValue(a);

        const valB = getValue(b);

        if (
          typeof valA === "string"
        ) {

          return (
            valA.localeCompare(valB) *
            dir
          );
        }

        return (
          (valA - valB) * dir
        );
      });

  }, [enrichedProducts, filters]);

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="products-container">
      <div className="products-header">
        <h1 className="products-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={24} className="text-primary" />
          Productos
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <CanAccess permission="view_products">
            <Link 
              to="/dashboard/products/deleted" 
              className="action-btn" 
              style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)', color: 'var(--text-main)', background: 'var(--bg-main)', cursor: 'pointer', fontWeight: 600, textDecoration: 'none' }}
            >
              <Trash2 size={18} />
              <span className="hide-on-mobile">Papelera</span>
            </Link>
          </CanAccess>
          <CanAccess permission="create_products">
            <button 
              className="action-btn primary" 
              style={{ padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', color: 'var(--color-primary-text)', background: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
              onClick={handleCreate}
            >
              <Plus size={18} />
              <span className="hide-on-mobile">Crear Producto</span>
            </button>
          </CanAccess>
        </div>
      </div>
      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: showFilters ? '15px' : '0' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar producto por nombre o código..."
              value={filters.search}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  search: e.target.value,
                })
              }
            />
          </div>
          <button
            onClick={() => openScanner(processScannedCode)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s' }}
            title="Escanear código de barras o QR"
          >
            <Camera size={18} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: showFilters ? 'var(--color-primary)' : 'var(--bg-card)', color: showFilters ? 'var(--color-primary-text)' : 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
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
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    category: e.target.value,
                  })
                }
              >
                <option value="">Todas</option>
                {[
                  ...new Set(
                    products.filter(p => p.category?.name).map(
                      (p) => p.category?.name
                    )
                  ),
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </CustomSelect>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado</label>
              <CustomSelect
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.status}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value,
                  })
                }
              >
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
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
                {owners.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.user?.profile?.first_name 
                      ? `${o.user.profile.first_name} ${o.user.profile.last_name_paternal || ''}`
                      : o.user?.email || 'Desconocido'}
                  </option>
                ))}
              </CustomSelect>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Inventario</label>
              <CustomSelect
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.stockStatus}
                onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="in_stock">En Stock</option>
                <option value="low_stock">Stock Bajo (Crítico)</option>
                <option value="out_of_stock">Sin Stock</option>
              </CustomSelect>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Etiqueta</label>
              <CustomSelect
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.tag}
                onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
              >
                <option value="">Todas</option>
                {[...new Set(products.flatMap(p => p.tags || []))].map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </CustomSelect>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Precio Mínimo (Bs)</label>
              <input
                type="number"
                placeholder="0"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Precio Máximo (Bs)</label>
              <input
                type="number"
                placeholder="0"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
      {/* ====================================================== */}
      {/* TABLE */}
      {/* ====================================================== */}

        {selectedRows.length > 0 && (
          <div className="bulk-actions-bar">
            <div className="bulk-actions-left">
              <span className="bulk-actions-count">{selectedRows.length} seleccionados</span>
              <div className="bulk-actions-divider"></div>
              <CanAccess permission="edit_products">
                <button className="btn btn-secondary" onClick={() => setBulkEditOpen(true)}>Editar</button>
              </CanAccess>
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

      <ProductsTable
        products={filteredProducts}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        loading={loadingProducts}
        onEdit={(p) => {
          setSelected(p);
          setOpen(true);
        }}
        onDelete={(id) => {
          setConfirmModal({ isOpen: true, type: "singleDelete", payload: id });
        }}
        onSort={(field) => {
          setFilters((prev) => ({

            ...prev,

            sortBy: field,

            sortDir:

              prev.sortBy === field &&
              prev.sortDir === "asc"

                ? "desc"

                : "asc",
          }));
        }}
        onView={(p) => {
          setSelectedView(p);
          setViewOpen(true);
        }}
      />
      
      {/* ====================================================== */}
      {/* VIEW MODAL */}
      {/* ====================================================== */}

      {viewOpen && !loadingData && selectedView && (
        <ProductViewModal
          product={selectedView}
          initialVariantId={scannedVariantId}
          directVariantMode={!!scannedVariantId}
          onClose={() => {
             setViewOpen(false);
             setScannedVariantId(null);
          }}
          onUpdated={() => loadProducts()}
        />
      )}

      {bulkEditOpen && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ width: '100%', maxWidth: '450px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <div className="modal-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Edición Masiva</h2>
              <button onClick={() => setBulkEditOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Propietario</label>
                <CustomSelect
                  
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
                  value={bulkEditForm.owner_id}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, owner_id: e.target.value })}
                >
                  <option value="">-- No modificar --</option>
                  {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </CustomSelect>
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categoría</label>
                <CustomSelect
                  
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
                  value={bulkEditForm.category_id}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, category_id: e.target.value })}
                >
                  <option value="">-- No modificar --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </CustomSelect>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setBulkEditOpen(false)}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={handleBulkEditSubmit} disabled={loadingProducts}>
                Aplicar a {selectedRows.length} productos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* MODAL */}
      {/* ====================================================== */}

      {open && !loadingData && (
        <ProductForm
          product={selected}
          categories={categories}
          owners={owners}
          productTypes={productTypes}
          attributes={attributes}
          sizes={sizes}
          fits={fits}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: "", payload: null })}
        onConfirm={() => {
          if (confirmModal.type === "bulkDelete") handleBulkDelete();
          if (confirmModal.type === "bulkActive") handleBulkStatus(true);
          if (confirmModal.type === "bulkInactive") handleBulkStatus(false);
          if (confirmModal.type === "singleDelete") handleSingleDelete(confirmModal.payload);
        }}
        title={
          confirmModal.type === "bulkDelete" ? "Eliminar productos" :
          confirmModal.type === "singleDelete" ? "Eliminar producto" :
          confirmModal.type === "bulkActive" ? "Activar productos" :
          "Inactivar productos"
        }
        message={
          confirmModal.type === "bulkDelete" ? `¿Estás seguro de eliminar ${selectedRows.length} productos? Se enviarán a la papelera.` :
          confirmModal.type === "singleDelete" ? "¿Estás seguro de eliminar este producto? Se enviará a la papelera." :
          confirmModal.type === "bulkActive" ? `¿Estás seguro de cambiar el estado de ${selectedRows.length} productos a Activo?` :
          `¿Estás seguro de cambiar el estado de ${selectedRows.length} productos a Inactivo?`
        }
        confirmText={
          confirmModal.type.includes("Delete") ? "Sí, eliminar" : "Sí, confirmar"
        }
        type={
          confirmModal.type.includes("Delete") ? "danger" : 
          confirmModal.type === "bulkActive" ? "success" : "warning"
        }
      />
    </div>
  );
}
// force reload
