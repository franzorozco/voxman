import React from "react";
import { Edit2, Trash2, Eye } from "lucide-react";
import CanAccess from "../../../../components/ui/CanAccess";
import { API_BASE_URL } from "../../../../config/api";

export default function BundlesTable({ bundles, loading, selectedRows, setSelectedRows, onEdit, onDelete, onView }) {
  if (loading) {
    return <div className="loading-state">Cargando conjuntos...</div>;
  }

  if (!bundles || bundles.length === 0) {
    return <div className="empty-state">No se encontraron conjuntos.</div>;
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(bundles.map(b => b.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(r => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const DEFAULT_IMAGE = `${API_BASE_URL}/storage/product_images/default.png`;

  const getImageUrl = (url) => {
    if (!url) return DEFAULT_IMAGE;
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
  };

  return (
    <div className="table-wrapper">
      <table className="bundles-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>
              <input type="checkbox" onChange={handleSelectAll} checked={bundles.length > 0 && selectedRows.length === bundles.length} />
            </th>
            <th style={{ width: '50px' }}>Img</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Categoría</th>
            <th>Ítems</th>
            <th>Stock Virtual</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {bundles.map((bundle) => {
            const mainImage = getImageUrl(
              bundle.product_images?.find(img => img.is_main)?.url || 
              bundle.product_images?.[0]?.url
            );
            
            return (
              <tr key={bundle.id} className={selectedRows.includes(bundle.id) ? "selected-row" : ""}>
                <td>
                  <input type="checkbox" checked={selectedRows.includes(bundle.id)} onChange={() => handleSelectRow(bundle.id)} />
                </td>
                <td onClick={() => onView && onView(bundle)} style={{ cursor: 'pointer' }}>
                  <div className="product-thumb">
                    <img
                      src={mainImage}
                      alt={bundle.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_IMAGE;
                      }}
                    />
                  </div>
                </td>
                <td onClick={() => onView && onView(bundle)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontWeight: 500, color: "var(--text-main)" }}>{bundle.name}</div>
                  {bundle.slug && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{bundle.slug}</div>}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 600 }}>Bs. {parseFloat(bundle.base_price).toFixed(2)}</span>
                    {bundle.savings > 0 && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        Regular: Bs. {bundle.regularPrice?.toFixed(2)}
                      </span>
                    )}
                  </div>
                </td>
                <td>{bundle.category?.name || "-"}</td>
                <td>
                  <span className="bundle-badge">
                    {bundle.bundle_items?.length || 0} ítems
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 500, color: bundle.virtualStock > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {bundle.virtualStock} posibles
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${bundle.is_active ? "active" : "inactive"}`}>
                    {bundle.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="btn-view" onClick={() => onView && onView(bundle)} title="Ver detalles" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Eye size={16} />
                    </button>
                    <CanAccess permission="edit_products">
                      <button className="btn-edit" onClick={() => onEdit(bundle)} title="Editar">
                        <Edit2 size={16} />
                      </button>
                    </CanAccess>
                    <CanAccess permission="delete_products">
                      <button className="btn-delete" onClick={() => onDelete(bundle.id)} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </CanAccess>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
