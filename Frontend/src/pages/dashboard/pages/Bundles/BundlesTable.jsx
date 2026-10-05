import { getImageUrl } from '../../../../utils/imageUtils';
import React, { useState } from "react";
import { Edit2, Trash2, Eye, MoreVertical, CheckSquare } from "lucide-react";
import RowDropdown from "../../../../components/ui/RowDropdown";
import CanAccess from "../../../../components/ui/CanAccess";
import { API_BASE_URL } from "../../../../config/api";

export default function BundlesTable({ bundles, loading, selectedRows, setSelectedRows, onEdit, onDelete, onView }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
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

  const DEFAULT_IMAGE = getImageUrl('/catalog/products/default.png');

  

  return (
    <div className="table-wrapper">
      <table className="bundles-table">
        <thead>
          <tr>
            <th className="bt-col-check checkbox-col">
              <input type="checkbox" onChange={handleSelectAll} checked={bundles.length > 0 && selectedRows.length === bundles.length} className="custom-table-checkbox" />
            </th>
            <th className="bt-col-img">Img</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Categoría</th>
            <th>Ítems</th>
            <th>Stock Virtual</th>
            <th>Estado</th>
            <th className="actions-col">Acciones</th>
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
                <td className="checkbox-col" style={{ width: '40px' }}>
                  <div className={selectedRows.includes(bundle.id) ? "" : "hide-on-mobile"}>
                    <input type="checkbox" checked={selectedRows.includes(bundle.id)} onChange={() => handleSelectRow(bundle.id)} className="custom-table-checkbox" />
                  </div>
                  {!selectedRows.includes(bundle.id) && (
                    <div className="hide-on-pc">
                            <RowDropdown rowId={bundle.id} activeId={activeDropdown} setActiveId={setActiveDropdown}>
                              <button style={{ background: "transparent", border: "none", padding: "10px 12px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--text-main)", width: "100%", fontSize: "14px" }} onClick={() => handleSelectRow(bundle.id)}>
                          <CheckSquare size={16} /> Seleccionar
                        </button>
                        <button style={{ background: "transparent", border: "none", padding: "10px 12px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--text-main)", width: "100%", fontSize: "14px" }} onClick={() => onView && onView(bundle)}>
                          <Eye size={16} /> Ver
                        </button>
                        <CanAccess permission="edit_products">
                          <button style={{ background: "transparent", border: "none", padding: "10px 12px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--text-main)", width: "100%", fontSize: "14px" }} onClick={() => onEdit(bundle)}>
                            <Edit2 size={16} /> Editar
                          </button>
                        </CanAccess>
                        <CanAccess permission="delete_products">
                          <button style={{ background: "transparent", border: "none", padding: "10px 12px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#ef4444", width: "100%", fontSize: "14px" }} onClick={() => onDelete(bundle.id)}>
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </CanAccess>
                            </RowDropdown>
                          </div>
                  )}
                </td>
                <td onClick={() => onView && onView(bundle)} className="bt-clickable-td">
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
                <td onClick={() => onView && onView(bundle)} className="bt-clickable-td">
                  <div className="bt-cell-name">
                    {bundle.name}
                    {selectedRows.includes(bundle.id) && <span className="hide-on-pc" style={{ color: 'var(--color-primary)', marginLeft: '6px' }}>✓</span>}
                  </div>
                  {bundle.slug && <div className="bt-cell-slug">{bundle.slug}</div>}
                </td>
                <td>
                  <div className="bt-cell-price">
                    <span className="bt-price-main">Bs. {parseFloat(bundle.base_price).toFixed(2)}</span>
                    {bundle.savings > 0 && (
                      <span className="bt-price-regular">
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
                  <span className={`bt-stock ${bundle.virtualStock > 0 ? 'bt-stock-ok' : 'bt-stock-low'}`}>
                    {bundle.virtualStock} posibles
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${bundle.is_active ? "active" : "inactive"}`}>
                    {bundle.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="actions-col">
                  <div className="table-actions">
                    <button className="btn-view" onClick={() => onView && onView(bundle)} title="Ver detalles">
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




