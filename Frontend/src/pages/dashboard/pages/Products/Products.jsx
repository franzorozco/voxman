import { useEffect, useState, useMemo } from "react";

import {
  getProducts,
  createProduct,
  updateProduct,
  updatePartialProduct,
  deleteProduct,
} from "../../../../api/products";

import { getCategories } from "../../../../api/categories";
import { getOwners } from "../../../../api/owners";
import { getProductTypes } from "../../../../api/productTypes";
import { getAttributes } from "../../../../api/attributes";
import { getSizes } from "../../../../api/sizes";
import { getFits } from "../../../../api/fits";

import "./Products.css";
import "../css/stylesCruds.css";

import { X } from "lucide-react";

import ProductsTable from "./ProductsTable";
import ProductForm from "./ProductForm";
import ProductViewModal from "./ProductViewModal";

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
  const [selected, setSelected] = useState(null);
  const [selectedView, setSelectedView] = useState(null);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    owner: "",
    status: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "name",
    sortDir: "asc",
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({ owner_id: "", category_id: "" });

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
    if (!window.confirm(`¿Estás seguro de eliminar ${selectedRows.length} productos?`)) return;
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
      .filter((p) => {
        const search =
          filters.search.toLowerCase();
        const matchSearch =
          p.name
            ?.toLowerCase()
            .includes(search) ||
          p.slug
            ?.toLowerCase()
            .includes(search);
        const matchCategory =
          !filters.category ||
          p.category?.name ===
            filters.category;
        const matchStatus =
          !filters.status ||
          (
            filters.status ===
            "active"
              ? p.is_active
              : !p.is_active
          );

        const matchMin =
          !filters.minPrice ||
          p.price >=
            Number(filters.minPrice);
        const matchMax =
          !filters.maxPrice ||
          p.price <=
            Number(filters.maxPrice);
        return (
          matchSearch &&
          matchCategory &&
          matchStatus &&
          matchMin &&
          matchMax
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
        <h1 className="products-title">
          Productos
        </h1>
        <button
          className="btn-primary"
          onClick={handleCreate}
        >
          + Crear Producto
        </button>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Buscar producto..."
          value={filters.search}
          onChange={(e) =>
            setFilters({

              ...filters,

              search:
                e.target.value,
            })
          }
        />

        <select
          onChange={(e) =>
            setFilters({
              ...filters,
              category:
                e.target.value,
            })
          }
        >

          <option value="">
            Categorías
          </option>

          {[
            ...new Set(
              products.map(
                (p) =>
                  p.category?.name
              )
            ),
          ].map((c) => (
            <option
              key={c}
              value={c}
            >
              {c}
            </option>
          ))}
        </select>

        <select
          onChange={(e) =>
            setFilters({
              ...filters,
              status:
                e.target.value,
            })
          }
        >
          <option value="">
            Estado
          </option>
          <option value="active">
            Activo
          </option>
          <option value="inactive">
            Inactivo
          </option>
        </select>
      </div>
      {/* ====================================================== */}
      {/* TABLE */}
      {/* ====================================================== */}

        {selectedRows.length > 0 && (
          <div className="bulk-actions-bar">
            <div className="bulk-actions-left">
              <span className="bulk-actions-count">{selectedRows.length} seleccionados</span>
              <div className="bulk-actions-divider"></div>
              <button className="btn btn-secondary" onClick={() => setBulkEditOpen(true)}>Editar</button>
              <button className="btn btn-secondary" onClick={() => handleBulkStatus(true)}>Activar</button>
              <button className="btn btn-secondary" onClick={() => handleBulkStatus(false)}>Inactivar</button>
            </div>
            <div className="bulk-actions-right">
              <button className="btn btn-danger-bulk" onClick={handleBulkDelete}>Eliminar</button>
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

        onDelete={async (id) => {
          await deleteProduct(id);
          loadProducts();
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
          onClose={() => setViewOpen(false)}
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
                <select
                  className="form-control"
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
                  value={bulkEditForm.owner_id}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, owner_id: e.target.value })}
                >
                  <option value="">-- No modificar --</option>
                  {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categoría</label>
                <select
                  className="form-control"
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
                  value={bulkEditForm.category_id}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, category_id: e.target.value })}
                >
                  <option value="">-- No modificar --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
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
    </div>
  );
}
// force reload
