export default function ProductsTable({ products, onEdit, onDelete }) {

  const API_URL = "http://127.0.0.1:8000";
  const DEFAULT_IMAGE = `${API_URL}/storage/product_images/default.png`;

  const getImageUrl = (url) => {
    if (!url) return DEFAULT_IMAGE;
    if (url.startsWith("http")) return url;
    return `${API_URL}/storage/${url}`;
  };

  // 🔥 formateador inteligente (2 decimales solo si aplica)
  const formatMoney = (value) => {
    const num = Number(value || 0);
    const rounded = Number.isInteger(num)
      ? num
      : parseFloat(num.toFixed(2));

    return `Bs ${rounded.toLocaleString("es-BO")}`;
  };

  return (
    <div className="table-wrapper">
      <table className="users-table">
        <thead>
          <tr>
            <th></th>
            <th>Producto</th>
            <th>Propietario</th>
            <th>Categoría</th>
            <th>SKU</th>
            <th>Precio</th>
            <th>Costo</th>
            <th>Margen</th>
            <th>Stock</th>
            <th>Variantes</th>
            <th>Vistas</th>
            <th>Estado</th>
            <th>Actualizado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => {

            const variantsCount = p.product_variants?.length || 0;

            const stock = (p.product_variants ?? []).reduce((acc, v) => {
              const variantStock = (v.inventories ?? []).reduce((sum, i) => {
                const value = Number(i?.stock ?? 0);
                return sum + (isNaN(value) ? 0 : value);
              }, 0);

              return acc + variantStock;
            }, 0);

            const cost = p.product_variants?.[0]?.cost || 0;
            const price = p.product_variants?.[0]?.price || p.base_price || 0;

            const margin = price - cost;
            const isLowStock = stock <= 5;

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

                {/* PRODUCTO */}
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

                {/* SKU */}
                <td>{p.product_variants?.[0]?.sku || "N/A"}</td>

                {/* PRICE */}
                <td>{formatMoney(price)}</td>

                {/* COST */}
                <td>{formatMoney(cost)}</td>

                {/* MARGIN */}
                <td style={{ color: margin >= 0 ? "#4ade80" : "#f87171" }}>
                  {formatMoney(margin)}
                </td>

                {/* STOCK */}
                <td>
                  <span style={{
                    color: isLowStock ? "#f87171" : "#4ade80",
                    fontWeight: 600,
                  }}>
                    {stock}
                  </span>
                </td>

                {/* VARIANTS */}
                <td>{variantsCount}</td>

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