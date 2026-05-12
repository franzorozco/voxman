export default function ProductsTable({ products, onEdit, onDelete, onSort }) {

  const API_URL = "http://127.0.0.1:8000";
  const DEFAULT_IMAGE = `${API_URL}/storage/product_images/default.png`;

  const getImageUrl = (url) => {
    if (!url) return DEFAULT_IMAGE;
    if (url.startsWith("http")) return url;
    return `${API_URL}/storage/${url}`;
  };

  const formatMoney = (value) => {
    const num = Number(value || 0);
    return `Bs ${num.toLocaleString("es-BO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };
 
  const SortableTh = ({ label, field }) => (
    <th
      style={{ cursor: "pointer", userSelect: "none" }}
      onClick={() => onSort?.(field)}
    >
      {label}
    </th>
  );

  return (
    <div className="table-wrapper">
      <table className="users-table">

        <thead>
          <tr>
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
          {products.map((p) => {

            const mainImage =
              getImageUrl(
                p.product_images?.find(img => img.is_main)?.url ||
                p.product_images?.[0]?.url
              );

            return (
              <tr key={p.id}>

                {/* IMAGE */}
                <td>
                  <img
                    src={mainImage}
                    alt={p.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_IMAGE;
                    }}
                    style={{
                      width: 45,
                      height: 45,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #ddd"
                    }}
                  />
                </td>

                {/* PRODUCT */}
                <td>
                  <strong>{p.name}</strong>
                  <br />
                  <small style={{ opacity: 0.6 }}>
                    {p.slug}
                  </small>
                </td>

                {/* OWNER */}
                <td>{p.owner_name || "Sin propietario"}</td>

                {/* CATEGORY */}
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

                {/* PRICE */}
                <td>{formatMoney(p.price)}</td>

                {/* COST */}
                <td>{formatMoney(p.cost)}</td>

                {/* MARGIN */}
                <td style={{
                  color: p.margin >= 0 ? "#4ade80" : "#f87171",
                  fontWeight: 600
                }}>
                  {formatMoney(p.margin)}
                </td>

                {/* STOCK */}
                <td>
                  <span style={{
                    color: p.stock <= 5 ? "#f87171" : "#4ade80",
                    fontWeight: 600
                  }}>
                    {p.stock}
                  </span>
                </td>

                {/* VARIANTS */}
                <td>{p.variantsCount}</td>

                {/* VIEWS */}
                <td>{p.views}</td>

                {/* STATUS */}
                <td>{p.is_active ? "Activo" : "Inactivo"}</td>

                {/* UPDATED */}
                <td>
                  {p.updated_at
                    ? new Date(p.updated_at).toLocaleDateString("es-BO")
                    : "N/A"}
                </td>

                {/* ACTIONS */}
                <td>
                  <button className="btn-view" onClick={() => console.log(p)}>
                    Ver
                  </button>

                  <button className="btn-edit" onClick={() => onEdit(p)}>
                    Editar
                  </button>

                  <button className="btn-delete" onClick={() => onDelete(p.id)}>
                    Eliminar
                  </button>
                </td>

              </tr>
            );
          })}
        </tbody>

      </table>
    </div>
  );
}