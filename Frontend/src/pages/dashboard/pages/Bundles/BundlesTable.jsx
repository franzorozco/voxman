import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import CanAccess from "../../../../components/ui/CanAccess";

export default function BundlesTable({ bundles, loading, onEdit, onDelete }) {
  if (loading) {
    return <div className="loading-state">Cargando conjuntos...</div>;
  }

  if (!bundles || bundles.length === 0) {
    return <div className="empty-state">No se encontraron conjuntos.</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="bundles-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Precio Base</th>
            <th>Categoría</th>
            <th>Ítems</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {bundles.map((bundle) => (
            <tr key={bundle.id}>
              <td>
                <div style={{ fontWeight: 500, color: "var(--text-main)" }}>{bundle.name}</div>
                {bundle.slug && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{bundle.slug}</div>}
              </td>
              <td>Bs. {parseFloat(bundle.base_price).toFixed(2)}</td>
              <td>{bundle.category?.name || "-"}</td>
              <td>
                <span className="bundle-badge">
                  {bundle.bundle_items?.length || 0} ítems
                </span>
              </td>
              <td>
                <span className={`status-badge ${bundle.is_active ? "active" : "inactive"}`}>
                  {bundle.is_active ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>
                <div className="table-actions">
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
