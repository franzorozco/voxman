import { useEffect, useState } from "react";
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

  const loadProducts = async () => {
    try {
      const res = await getProducts();

      // soporte flexible para Laravel pagination o array
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

  return (
    <div className="users-container">
      <div className="users-header">
        <h1 className="users-title">Productos</h1>

        <div className="users-actions">
          <button className="btn-primary" onClick={handleCreate}>
            + Crear Producto
          </button>
        </div>
      </div>

      <ProductsTable
        products={products}
        onEdit={(p) => {
          setSelected(p);
          setOpen(true);
        }}
        onDelete={async (id) => {
          await deleteProduct(id);
          loadProducts();
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