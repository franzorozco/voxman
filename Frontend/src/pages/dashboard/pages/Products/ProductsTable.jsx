import {
  API_BASE_URL
} from "../../../../config/api";
import Spinner from "../../components/Spinner/Spinner";

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
    `${API_BASE_URL}/storage/product_images/default.png`;

  const getImageUrl = (url) => {
    if (!url) return DEFAULT_IMAGE;

    if (url.startsWith("http")) return url;

    return `${API_BASE_URL}${url}`;
  };

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
            <th style={{ width: '40px' }}>
              <input 
                type="checkbox" 
                checked={products.length > 0 && selectedRows.length === products.length} 
                onChange={handleSelectAll} 
                className="custom-table-checkbox"
              />
            </th>
            <th></th>

            <SortableTh label="Producto" field="name" />

            <th>Propietario</th>
            <th>Categoría</th>
            <th>Descuento</th>

            <SortableTh label="Precio" field="price" />
            <th>Costo</th>

            <SortableTh label="Margen" field="margin" />
            <SortableTh label="Stock" field="stock" />

            <th>Variantes</th>
            <th>Vistas</th>
            <th>Estado</th>
            <th>Actualizado</th>

            <th>Acciones</th>
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
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedRows.includes(p.id)} 
                      onChange={() => handleSelectRow(p.id)} 
                      className="custom-table-checkbox"
                    />
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
                  <td>{formatMoney(p.cost)}</td>

                  <td
                    style={{
                      color: p.margin >= 0 ? "#4ade80" : "#f87171",
                      fontWeight: 600
                    }}
                  >
                    {formatMoney(p.margin)}
                  </td>

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

                  <td>
                    <button className="btn-view" onClick={() => onView(p)}>
                      Ver
                    </button>

                    <button className="btn-edit" onClick={() => onEdit(p)}>
                      Editar
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => onDelete(p.id)}
                    >
                      Eliminar
                    </button>
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