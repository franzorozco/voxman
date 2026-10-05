import { useState } from "react";
import { getImageUrl } from '../../../../utils/imageUtils';
import {
  API_BASE_URL
} from "../../../../config/api";
import { ChevronUp, ChevronDown, Ruler, MoreVertical, Eye, Edit, Trash2, CheckSquare } from "lucide-react";
import RowDropdown from "../../../../components/ui/RowDropdown";
import CanAccess from "../../../../components/ui/CanAccess";
import Spinner from "../../components/Spinner/Spinner";
import { useAuthStore } from "../../../../store/authStore";

export default function ProductsTable({
  products,
  loading,
  onEdit,
  onDelete,
  onSort,
  onView,
  selectedRows = [],
  setSelectedRows = () => {}
}) {

  const [activeDropdown, setActiveDropdown] = useState(null);
  const user = useAuthStore((state) => state.user);
  const canViewCosts = user?.permissions?.includes("view_product_costs") || user?.roles?.includes("Owner");

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(products.map(p => p.id));
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

  const DEFAULT_IMAGE =
    getImageUrl('/catalog/products/default.png');

  

  const formatMoney = (value) => {
    const num = Number(value || 0);

    return `Bs ${num.toLocaleString("es-BO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const SortableTh = ({
    label,
    field
  }) => (
    <th
      style={{
        cursor: "pointer",
        userSelect: "none"
      }}
      onClick={() =>
        onSort?.(field)
      }
    >
      {label}
    </th>
  );



  return (
    <div className="table-wrapper">
      <table className="products-table">

        <thead>
          <tr>
            <th className="checkbox-col" style={{ width: '40px' }}>
              <input 
                type="checkbox" 
                checked={products.length > 0 && selectedRows.length === products.length} 
                onChange={handleSelectAll} 
                className="custom-table-checkbox"
              />
            </th>
            <th></th>

            <SortableTh label="Producto" field="name" />

            <th>Etiquetas</th>
            <th>Propietario</th>
            <th>Categoría</th>
            <th>Descuento</th>

            <SortableTh label="Precio" field="price" />
            {canViewCosts && <th>Costo</th>}

            {canViewCosts && <SortableTh label="Margen" field="margin" />}
            <SortableTh label="Stock" field="stock" />

            <th>Variantes</th>
            <th>Vistas</th>
            <th>Estado</th>
            <th>Actualizado</th>

            <th className="actions-col">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="14" style={{ padding: "60px 0" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <Spinner />

                  <span
                    style={{
                      fontSize: 14,
                      color: "#ffffff",
                      fontWeight: 500,
                    }}
                  >
                    Cargando productos...
                  </span>
                </div>
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr>
              <td
                colSpan="14"
                style={{
                  textAlign: "center",
                  padding: "40px",
                  opacity: 0.7,
                }}
              >
                No hay productos
              </td>
            </tr>
          ) : (
            products.map((p) => {
              const mainImage =
                getImageUrl(
                  p.product_images?.find(img => img.is_main)?.url ||
                  p.product_images?.[0]?.url
                );

              return (
                <tr key={p.id}>
                  <td className="checkbox-col" style={{ width: '40px' }}>
                    <div className={selectedRows.includes(p.id) ? "" : "hide-on-mobile"}>
                      <input 
                        type="checkbox" 
                        checked={selectedRows.includes(p.id)} 
                        onChange={() => handleSelectRow(p.id)} 
                        className="custom-table-checkbox"
                      />
                    </div>
                    {!selectedRows.includes(p.id) && (
                      <div className="hide-on-pc">
                            <RowDropdown rowId={p.id} activeId={activeDropdown} setActiveId={setActiveDropdown}>
                              <button style={{ background: "transparent", border: "none", padding: "10px 12px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--text-main)", width: "100%", fontSize: "14px" }} onClick={() => handleSelectRow(p.id)}>
                            <CheckSquare size={16} /> Seleccionar
                          </button>
                          <CanAccess permission="view_products">
                            <button style={{ background: "transparent", border: "none", padding: "10px 12px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--text-main)", width: "100%", fontSize: "14px" }} onClick={() => onView(p)}>
                              <Eye size={16} /> Ver
                            </button>
                          </CanAccess>
                          <CanAccess permission="edit_products">
                            <button style={{ background: "transparent", border: "none", padding: "10px 12px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--text-main)", width: "100%", fontSize: "14px" }} onClick={() => onEdit(p)}>
                              <Edit size={16} /> Variables
                            </button>
                          </CanAccess>
                          <CanAccess permission="delete_products">
                            <button style={{ background: "transparent", border: "none", padding: "10px 12px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#ef4444", width: "100%", fontSize: "14px" }} onClick={() => onDelete(p.id)}>
                              <Trash2 size={16} /> Eliminar
                            </button>
                          </CanAccess>
                            </RowDropdown>
                          </div>
                    )}
                  </td>
                  {/* IMAGE */}
                  <td>
                    <div className="product-thumb">
                      <img
                        src={mainImage}
                        alt={p.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_IMAGE;
                        }}
                      />
                    </div>
                  </td>

                  {/* PRODUCT */}
                  <td>
                    <strong>{p.name}</strong>
                    <br />
                    <small style={{ opacity: 0.6 }}>
                      {p.slug}
                    </small>
                  </td>

                  {/* TAGS */}
                  <td>
                    {(p.tags || []).length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '160px' }}>
                        {(p.tags || []).map((tag, idx) => (
                          <span key={idx} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-primary-alpha, rgba(99,102,241,0.15))', color: 'var(--color-primary)', fontSize: '10px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                    )}
                  </td>

                  <td>{p.owner_name || "Sin propietario"}</td>
                  <td>{p.category?.name || "Sin categoría"}</td>

                  {/* DISCOUNT */}
                  <td>
                    {p.product_discount ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#166534",
                            padding: "4px 8px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            width: "fit-content",
                          }}
                        >
                          Producto
                        </span>

                        <small style={{ fontWeight: 600 }}>
                          {p.product_discount.name}
                        </small>

                        <small style={{ opacity: 0.7 }}>
                          {p.product_discount.type === "percentage"
                            ? `${p.product_discount.value}%`
                            : formatMoney(p.product_discount.value)}
                        </small>
                      </div>
                    ) : p.category_discount ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            background: "#dbeafe",
                            color: "#1d4ed8",
                            padding: "4px 8px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            width: "fit-content",
                          }}
                        >
                          Categoría
                        </span>

                        <small style={{ fontWeight: 600 }}>
                          {p.category_discount.name}
                        </small>

                        <small style={{ opacity: 0.7 }}>
                          {p.category_discount.type === "percentage"
                            ? `${p.category_discount.value}%`
                            : formatMoney(p.category_discount.value)}
                        </small>
                      </div>
                    ) : (
                      <span style={{ opacity: 0.6 }}>
                        Sin descuento
                      </span>
                    )}
                  </td>

                  <td>{formatMoney(p.price)}</td>
                  {canViewCosts && <td>{formatMoney(p.cost)}</td>}

                  {canViewCosts && (
                    <td
                      style={{
                        color: p.margin >= 0 ? "#4ade80" : "#f87171",
                        fontWeight: 600
                      }}
                    >
                      {formatMoney(p.margin)}
                    </td>
                  )}

                  <td>
                    <span
                      style={{
                        color: p.stock <= 5 ? "#f87171" : "#4ade80",
                        fontWeight: 600
                      }}
                    >
                      {p.stock}
                    </span>
                  </td>

                  <td>{p.variantsCount}</td>
                  <td>{p.views}</td>
                  <td>{p.is_active ? "Activo" : "Inactivo"}</td>

                  <td>
                    {p.updated_at
                      ? new Date(p.updated_at).toLocaleDateString("es-BO")
                      : "N/A"}
                  </td>

                  <td className="actions-col">
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                      <CanAccess permission="view_products">
                        <button type="button" className="btn-secondary" style={{ position: 'relative', zIndex: 10, padding: '6px 10px', fontSize: '13px' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onView(p); }}>
                          Ver
                        </button>
                      </CanAccess>

                      <CanAccess permission="edit_products">
                        <button type="button" className="btn-edit" style={{ position: 'relative', zIndex: 10 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(p); }}>
                          Variables
                        </button>
                      </CanAccess>

                      <CanAccess permission="delete_products">
                        <button
                          type="button"
                          className="btn-delete"
                          style={{ position: 'relative', zIndex: 10 }}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(p.id); }}
                        >
                          Eliminar
                        </button>
                      </CanAccess>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>

      </table>
    </div>
  );
}






