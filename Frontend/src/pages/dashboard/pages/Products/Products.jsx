import { useEffect, useState, useMemo } from "react";

import {
  getProducts,
  createProduct,
  updateProduct,
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

import ProductsTable from "./ProductsTable";
import ProductForm from "./ProductForm";

export default function Products() {

  // ======================================================
  // MAIN STATE
  // ======================================================

  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([]);
  const [owners, setOwners] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [fits, setFits] = useState([]);

  const [selected, setSelected] = useState(null);

  const [open, setOpen] = useState(false);

  // ======================================================
  // FILTERS
  // ======================================================

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

  // ======================================================
  // LOADERS
  // ======================================================

  const loadProducts = async () => {

    try {

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
    }
  };

  const loadInitialData = async () => {

    try {

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

      setCategories(
        categoriesRes.data?.data ??
        categoriesRes.data ??
        []
      );

      setOwners(
        ownersRes.data?.data ??
        ownersRes.data ??
        []
      );

      setProductTypes(
        productTypesRes.data?.data ??
        productTypesRes.data ??
        []
      );

      setAttributes(
        attributesRes.data?.data ??
        attributesRes.data ??
        []
      );

      setSizes(
        sizesRes.data?.data ??
        sizesRes.data ??
        []
      );

      setFits(
        fitsRes.data?.data ??
        fitsRes.data ??
        []
      );

    } catch (error) {

      console.error(
        "Error cargando datos:",
        error
      );
    }
  };

  // ======================================================
  // INIT
  // ======================================================

  useEffect(() => {

    loadProducts();

    loadInitialData();

  }, []);

  // ======================================================
  // CREATE
  // ======================================================

  const handleCreate = () => {

    setSelected(null);

    setOpen(true);
  };

  // ======================================================
  // SUBMIT
  // ======================================================

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
        error
      );
    }
  };

  // ======================================================
  // ENRICHED PRODUCTS
  // ======================================================

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

  // ======================================================
  // FILTERS
  // ======================================================

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

    <div className="users-container">

      <div className="users-header">

        <h1 className="users-title">
          Productos
        </h1>

        <button
          className="btn-primary"
          onClick={handleCreate}
        >
          + Crear Producto
        </button>

      </div>

      {/* ====================================================== */}
      {/* FILTERS */}
      {/* ====================================================== */}

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

              prev.sortBy === field &&
              prev.sortDir === "asc"

                ? "desc"

                : "asc",
          }));
        }}
      />

      {/* ====================================================== */}
      {/* MODAL */}
      {/* ====================================================== */}

      {open && (

        <ProductForm

          product={selected}

          categories={categories}

          owners={owners}

          productTypes={productTypes}

          attributes={attributes}

          sizes={sizes}

          fits={fits}

          onClose={() =>
            setOpen(false)
          }

          onSubmit={handleSubmit}
        />
      )}

    </div>
  );
}