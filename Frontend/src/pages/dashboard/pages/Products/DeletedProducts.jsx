import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

import {
  getProducts,
  restoreProduct,
  forceDeleteProduct,
  updatePartialProduct,
  deleteProduct
} from "../../../../api/products";
import { API_BASE_URL } from "../../../../config/api";

import "./Products.css";
import "../css/stylesCruds.css";

import { RefreshCw, Trash2, ArrowLeft } from "lucide-react";
import ConfirmModal from "../../../../components/ui/ConfirmModal";

export default function DeletedProducts() {
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("inactive"); // "inactive" or "deleted"
  const [filters, setFilters] = useState({
    search: "",
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", id: null });

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await getProducts({ status: activeTab });
      setProducts(
        Array.isArray(res) ? res : res.data?.data || res.data || []
      );
    } catch (error) {
      console.error("Error cargando productos eliminados:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [activeTab]);

  const handleActivate = async (id) => {
    try {
      setLoadingProducts(true);
      const fd = new FormData();
      fd.append("is_active", 1);
      await updatePartialProduct(id, fd);
      loadProducts();
    } catch (err) {
      console.error("Error activando producto:", err);
      alert("Error al activar el producto.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSoftDelete = async (id) => {
    try {
      setLoadingProducts(true);
      await deleteProduct(id);
      loadProducts();
    } catch (err) {
      console.error("Error moviendo a papelera:", err);
      alert("Error al eliminar el producto.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      setLoadingProducts(true);
      await restoreProduct(id);
      loadProducts();
    } catch (err) {
      console.error("Error restaurando producto:", err);
      alert("Error al restaurar el producto.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleForceDelete = async (id) => {
    try {
      setLoadingProducts(true);
      await forceDeleteProduct(id);
      loadProducts();
    } catch (err) {
      console.error("Error eliminando permanentemente el producto:", err);
      alert("Error al eliminar el producto de forma permanente.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const enrichedProducts = useMemo(() => {
    return products.map((p) => {
      const variants = p.product_variants || [];
      const stock = variants.reduce((acc, v) => {
        return acc + (v.inventories || []).reduce((s, i) => s + Number(i?.stock || 0), 0);
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

  const filteredProducts = useMemo(() => {
    return enrichedProducts.filter((p) => {
      const search = filters.search.toLowerCase();
      const matchSearch = p.name?.toLowerCase().includes(search) || p.slug?.toLowerCase().includes(search);
      return matchSearch;
    });
  }, [enrichedProducts, filters]);

  return (
    <div className="products-container">
      <div className="products-header">
        <h1 className="products-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/dashboard/products" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </Link>
          Inactivos y Papelera
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('inactive')}
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '10px 20px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            color: activeTab === 'inactive' ? 'var(--primary-color)' : 'var(--text-muted)',
            borderBottom: activeTab === 'inactive' ? '2px solid var(--primary-color)' : '2px solid transparent',
            fontWeight: activeTab === 'inactive' ? 600 : 400
          }}>
          Productos Inactivos
        </button>
        <button 
          onClick={() => setActiveTab('deleted')}
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '10px 20px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            color: activeTab === 'deleted' ? '#ef4444' : 'var(--text-muted)',
            borderBottom: activeTab === 'deleted' ? '2px solid #ef4444' : '2px solid transparent',
            fontWeight: activeTab === 'deleted' ? 600 : 400
          }}>
          Papelera (Eliminados)
        </button>
      </div>

      <div className="filters-bar">
        <input
          placeholder={activeTab === 'inactive' ? "Buscar producto inactivo..." : "Buscar producto eliminado..."}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="table-wrapper">
        <table className="products-table" style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Stock Total</th>
              <th>{activeTab === 'deleted' ? 'Fecha Eliminación' : 'Estado'}</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loadingProducts ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                  Cargando productos eliminados...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                  {activeTab === 'inactive' ? "No hay productos inactivos." : "No hay productos en la papelera."}
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td style={{ minWidth: '250px', whiteSpace: 'normal' }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img
                        src={
                          (() => {
                            const imgUrl = p.product_images?.find((img) => img.is_main)?.url ||
                                           p.product_images?.[0]?.url;
                            if (!imgUrl) return "/placeholder.png";
                            return imgUrl.startsWith("http") ? imgUrl : `${API_BASE_URL}${imgUrl}`;
                          })()
                        }
                        alt={p.name}
                        className="product-img"
                        onError={(e) => {
                          e.target.src = `${API_BASE_URL}/storage/products/default.png`;
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontWeight: 600, lineHeight: '1.2' }}>{p.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: '1.2' }}>
                          {p.category?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>Bs. {p.price?.toFixed(2)}</td>
                  <td>
                    <span className={p.stock > 0 ? "stock-badge success" : "stock-badge danger"}>
                      {p.stock} uds
                    </span>
                  </td>
                  <td>
                    {activeTab === 'deleted' 
                      ? (p.deleted_at ? new Date(p.deleted_at).toLocaleDateString() : 'N/A')
                      : <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, display: 'inline-block' }}>Inactivo</span>
                    }
                  </td>
                  <td>
                    {activeTab === 'deleted' ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          className="btn-edit"
                          onClick={() => setConfirmModal({ isOpen: true, type: "restore", id: p.id })}
                          title="Restaurar"
                          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.15)', width: 'max-content', padding: '6px 12px' }}
                        >
                          <RefreshCw size={16} /> Restaurar
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => setConfirmModal({ isOpen: true, type: "forceDelete", id: p.id })}
                          title="Eliminar permanentemente"
                          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: '6px', width: 'max-content', padding: '6px 12px' }}
                        >
                          <Trash2 size={16} /> Eliminar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          className="btn-edit"
                          onClick={() => handleActivate(p.id)}
                          title="Activar"
                          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.15)', width: 'max-content', padding: '6px 12px' }}
                        >
                          <RefreshCw size={16} /> Activar
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => setConfirmModal({ isOpen: true, type: "softDelete", id: p.id })}
                          title="Mover a papelera"
                          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: '6px', width: 'max-content', padding: '6px 12px' }}
                        >
                          <Trash2 size={16} /> Papelera
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: "", id: null })}
        onConfirm={() => {
          if (confirmModal.type === "restore") handleRestore(confirmModal.id);
          if (confirmModal.type === "forceDelete") handleForceDelete(confirmModal.id);
          if (confirmModal.type === "softDelete") handleSoftDelete(confirmModal.id);
        }}
        title={
          confirmModal.type === "restore" ? "Restaurar producto" : 
          confirmModal.type === "softDelete" ? "Mover a papelera" : 
          "Eliminar permanente"
        }
        message={
          confirmModal.type === "restore" 
          ? "¿Estás seguro de restaurar este producto? Volverá a estar disponible con sus variantes e inventario intactos." 
          : confirmModal.type === "softDelete"
          ? "¿Estás seguro de mover este producto a la papelera?"
          : "ADVERTENCIA: ¿Estás seguro de eliminar PERMANENTEMENTE este producto? Esta acción no se puede deshacer y borrará todas las imágenes, variantes e inventario asociados."
        }
        confirmText={
          confirmModal.type === "restore" ? "Sí, restaurar" : 
          confirmModal.type === "softDelete" ? "Sí, eliminar" : 
          "Sí, eliminar definitivamente"
        }
        type={confirmModal.type === "restore" ? "success" : "danger"}
      />
    </div>
  );
}
