import { useEffect, useState, useMemo } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../../../api/products";

import "./Products.css";
import "../css/stylesCruds.css";

import ProductsTable from "./ProductsTable";
import ProductForm from "./ProductForm";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

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

  const loadProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data?.data ?? res.data ?? []);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreate = () => {
    setSelected(null);
    setOpen(true);
  };

  const handleSubmit = async (data) => {
    try {
      if (selected) {
        await updateProduct(selected.id, data);
      } else {
        await createProduct(data);
      }

      setOpen(false);
      loadProducts();
    } catch (error) {
      console.error("Error guardando producto:", error);
    }
  };

  // 🔥 PRE-CÁLCULO DE CAMPOS (CLAVE PARA FILTER + SORT)
  const enrichedProducts = useMemo(() => {
    return products.map((p) => {
      const variants = p.product_variants ?? [];

      const stock = variants.reduce((acc, v) => {
        return acc + (v.inventories ?? []).reduce((s, i) => s + Number(i?.stock || 0), 0);
      }, 0);

      const cost = variants?.[0]?.cost || 0;
      const price = variants?.[0]?.price || p.base_price || 0;

      return {
        ...p,
        stock,
        cost,
        price,
        margin: price - cost,
        variantsCount: variants.length,
      };
    });
  }, [products]);

  // 🔥 FILTROS + SORT CORRECTO
  const filteredProducts = useMemo(() => {
    return enrichedProducts
      .filter((p) => {
        const search = filters.search.toLowerCase();

        const matchSearch =
          p.name?.toLowerCase().includes(search) ||
          p.slug?.toLowerCase().includes(search);

        const matchCategory =
          !filters.category || p.category?.name === filters.category;

        const matchOwner =
          !filters.owner || p.owner_name === filters.owner;

        const matchStatus =
          !filters.status ||
          (filters.status === "active" ? p.is_active : !p.is_active);

        const matchMin =
          !filters.minPrice || p.price >= Number(filters.minPrice);

        const matchMax =
          !filters.maxPrice || p.price <= Number(filters.maxPrice);

        return (
          matchSearch &&
          matchCategory &&
          matchOwner &&
          matchStatus &&
          matchMin &&
          matchMax
        );
      })
      .sort((a, b) => {
        const dir = filters.sortDir === "asc" ? 1 : -1;

        const getValue = (p) => {
          switch (filters.sortBy) {
            case "price":
              return p.price;
            case "stock":
              return p.stock;
            case "margin":
              return p.margin;
            case "name":
              return p.name;
            case "views":
              return p.views;
            default:
              return "";
          }
        };

        const valA = getValue(a);
        const valB = getValue(b);

        if (typeof valA === "string") {
          return valA.localeCompare(valB) * dir;
        }

        return (valA - valB) * dir;
      });
  }, [enrichedProducts, filters]);

  return (
    <div className="users-container">

      <div className="users-header">
        <h1 className="users-title">Productos</h1>

        <button className="btn-primary" onClick={handleCreate}>
          + Crear Producto
        </button>
      </div>

      {/* FILTROS */}
      <div className="filters-bar">

        <input
          placeholder="Buscar producto..."
          value={filters.search}
          onChange={(e) =>
            setFilters({ ...filters, search: e.target.value })
          }
        />

        <select
          onChange={(e) =>
            setFilters({ ...filters, category: e.target.value })
          }
        >
          <option value="">Categorías</option>
          {[...new Set(products.map(p => p.category?.name))].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="">Estado</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>

        <input
          type="number"
          placeholder="Precio min"
          onChange={(e) =>
            setFilters({ ...filters, minPrice: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Precio max"
          onChange={(e) =>
            setFilters({ ...filters, maxPrice: e.target.value })
          }
        />
      </div>

      {/* TABLE */}
      <ProductsTable
        products={filteredProducts}
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
              prev.sortBy === field && prev.sortDir === "asc"
                ? "desc"
                : "asc",
          }));
        }}
      />

      {open && (
        <ProductForm
          product={selected}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}