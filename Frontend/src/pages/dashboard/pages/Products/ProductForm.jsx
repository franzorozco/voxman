import { useEffect, useState } from "react";

export default function ProductForm({
  product,

  categories = [],
  owners = [],
  productTypes = [],
  attributes = [],
  sizes = [], 
  fits = [],

  onClose,
  onSubmit,
}){

  const [form, setForm] = useState({

    name: "",
    description: "",

    base_price: "",

    category_id: "",
    owner_id: "",
    product_type_id: "",

    variants: [],
  });


  useEffect(() => {
    if (product) {

      const transformedVariants = product.product_variants.map(v => {

        const attributeMap = {};

        v.variant_attribute_values?.forEach(av => {

          const attributeId = av.attribute_value?.attribute?.id;
          const valueId = av.attribute_value?.id;

          if (attributeId && valueId) {
            attributeMap[attributeId] = valueId;
          }
        });

        return {
          ...v,
          size_id: v.size_id || "",
          fit_id: v.fit_id || "",
          price: v.price || "",
          cost: v.cost || "",
          weight: v.weight || "",
          is_active: v.is_active ?? true,
          attribute_value_ids: attributeMap
        };
      });

      setForm({
        name: product.name || "",
        description: product.description || "",
        base_price: product.base_price || "",
        category_id: product.category_id || "",
        owner_id: product.owner_id || "",
        product_type_id: product.product_type_id || "",
        variants: transformedVariants,
      });
    }
  }, [product]);

  // ======================================================
  // SKU
  // ======================================================

  const generateSKU = (
    productName,
    index
  ) => {

    const clean = productName
      ?.toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);

    return `${clean}-${index + 1}`;
  };

  // ======================================================
  // BARCODE
  // ======================================================

  const generateBarcode = () => {
    return (
      Date.now().toString() +
      Math.floor(Math.random() * 999)
    );
  };

  // ======================================================
  // GENERAL CHANGE
  // ======================================================

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  // ======================================================
  // VARIANT CHANGE
  // ======================================================

  const handleVariantChange = (
    index,
    field,
    value
  ) => {
    const updated = [...form.variants];
    updated[index][field] = value;
    setForm({
      ...form,
      variants: updated,
    });
  };

  // ======================================================
  // ATTRIBUTE CHANGE
  // ======================================================

  const handleAttributeChange = (variantIndex, attributeId, valueId) => {
    const updated = [...form.variants];
    if (!updated[variantIndex].attribute_value_ids) {
      updated[variantIndex].attribute_value_ids = {};
    }
    updated[variantIndex].attribute_value_ids[attributeId] = valueId;
    setForm({ ...form, variants: updated });
  };

  
  // ======================================================
  // ADD VARIANT
  // ======================================================

  const addVariant = () => {

    const index = form.variants.length;

    setForm({
      ...form,
      variants: [
        ...form.variants,
        {
          sku: generateSKU(form.name, index),
          barcode: generateBarcode(),
          price: "",
          cost: "",
          weight: "",
          size_id: "",
          fit_id: "",
          attribute_value_ids: {}
        },
      ],
    });
  };

  // ======================================================
  // REMOVE VARIANT
  // ======================================================

  const removeVariant = (index) => {
    const updated = [...form.variants];
    updated.splice(index, 1);
    setForm({
      ...form,
      variants: updated,
    });
  };

  // ======================================================
  // SUBMIT
  // ======================================================
  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      variants: form.variants.map(v => ({
        ...v,
        attribute_value_ids: Object.values(v.attribute_value_ids || {})
      }))
    };

    onSubmit(payload);
  };
  

useEffect(() => {
  fetch("/api/attributes")
    .then(res => res.json())
    .then(data => {
      console.log("ATTRIBUTES FULL:", data);
      setAttributes(data);
    });
}, []);

useEffect(() => {
  if (!attributes || attributes.length === 0) return;
  console.log("ATTRIBUTES FULL:", attributes);
}, [attributes]);

  return (

    <div className="modal-overlay">

      <div
        className="modal"
        style={{
          maxWidth: 1300,
          width: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >

        <h2>
          {product
            ? "Editar Producto"
            : "Crear Producto"}
        </h2>

        <form onSubmit={handleSubmit}>

          {/* ====================================================== */}
          {/* GENERAL */}
          {/* ====================================================== */}

          <h3>
            Información General
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>
                Nombre
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-group">

              <label>
                Categoría
              </label>

              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                required
              >

                <option value="">
                  Seleccionar
                </option>

                {categories.map((c) => (

                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                Tipo Producto
              </label>

              <select
                name="product_type_id"
                value={form.product_type_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  Seleccionar
                </option>
                  
                {productTypes.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                  >
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                Propietario
              </label>

              <select
                name="owner_id"
                value={form.owner_id}
                onChange={handleChange}
              >

                <option value="">
                  Seleccionar
                </option>

                {owners.map((o) => (

                  <option
                    key={o.id}
                    value={o.id}
                  >
                    {
                      o.user
                        ?.user_profiles?.[0]
                        ?.first_name
                    }
                  </option>

                ))}

              </select>

            </div>

            <div className="form-group">

              <label>
                Precio Base
              </label>

              <input
                type="number"
                name="base_price"
                value={form.base_price}
                onChange={handleChange}
              />

            </div>

            <div
              className="form-group"
              style={{
                gridColumn: "1 / -1",
              }}
            >

              <label>
                Descripción
              </label>

              <textarea
                rows={4}
                name="description"
                value={form.description}
                onChange={handleChange}
              />

            </div>
          </div>

          {/* VARIANTS */}

          <div
            style={{
              marginTop: 40,
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >

              <h3>
                Variantes
              </h3>
              <button
                type="button"
                className="btn-primary"
                onClick={addVariant}
              >
                Agregar Variante
              </button>

            </div>

            {form.variants.map(
              (variant, index) => (

                <div
                  key={index}
                  style={{
                    border:
                      "1px solid #ddd",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 25,
                  }}
                >

                  <h4>
                    Variante #
                    {index + 1}
                  </h4>

                  {/* ====================================================== */}
                  {/* DATOS */}
                  {/* ====================================================== */}

                  <div className="form-grid">
                    <div className="form-group">
                      <label>
                        SKU
                      </label>

                      <input
                        value={
                          variant.sku
                        }
                        readOnly
                      />

                    </div>

                    <div className="form-group">
                      <label>
                        Barcode
                      </label>

                      <input
                        value={
                          variant.barcode
                        }
                        readOnly
                      />

                    </div>

                    <div className="form-group">
                      <label>
                        Precio
                      </label>

                      <input
                        type="number"
                        value={
                          variant.price
                        }
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "price",
                            e.target
                              .value
                          )
                        }
                      />

                    </div>
                    <div className="form-group">
                      <label>Activo</label>
                      <select
                        value={variant.is_active}
                        onChange={(e) =>
                          handleVariantChange(index, "is_active", e.target.value === "true")
                        }
                      >
                        <option value={true}>Activo</option>
                        <option value={false}>Inactivo</option>
                      </select>
                    </div>


                    <div className="form-group">
                      <label>
                        Costo
                      </label>

                      <input
                        type="number"
                        value={
                          variant.cost
                        }
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "cost",
                            e.target
                              .value
                          )
                        }
                      />

                    </div>

                    <div className="form-group">
                      <label>
                        Peso
                      </label>

                      <input
                        type="number"
                        step="0.01"
                        value={
                          variant.weight
                        }
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "weight",
                            e.target
                              .value
                          )
                        }
                      />

                    </div>

                    {/* ====================================================== */}
                    {/* TALLA */}
                    {/* ====================================================== */}

                    <div className="form-group">
                      <label>
                        Talla
                      </label>
                      <select
                        value={
                          variant.size_id
                        }
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "size_id",
                            e.target
                              .value
                          )
                        }
                      >
                        <option value="">
                          Seleccionar
                        </option>

                        {sizes.map(
                          (size) => (

                            <option
                              key={
                                size.id
                              }
                              value={
                                size.id
                              }
                            >
                              {
                                size.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {/* ====================================================== */}
                    {/* FIT */}
                    {/* ====================================================== */}
                    <div className="form-group">
                      <label>
                        Fit
                      </label>
                      <select
                        value={
                          variant.fit_id
                        }
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "fit_id",
                            e.target
                              .value
                          )
                        }
                      >
                        <option value="">
                          Seleccionar
                        </option>

                        {fits.map(
                          (fit) => (

                            <option
                              key={fit.id}
                              value={
                                fit.id
                              }
                            >
                              {
                                fit.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  {/* ====================================================== */}
                  {/* ATTRIBUTES */}
                  {/* ====================================================== */}

                  <h4
                    style={{
                      marginTop: 25,
                    }}
                  >
                    Atributos
                  </h4>

                  <div className="form-grid">

                    {attributes.map(
                      (attribute) => (

                        <div
                          key={
                            attribute.id
                          }
                          className="form-group"
                        >

                          <label>
                            {
                              attribute.name
                            }
                          </label>

                            <select
                              value={
                                form.variants[index]?.attribute_value_ids?.[attribute.id] || ""
                              }
                              onChange={(e) =>
                                handleAttributeChange(index, attribute.id, e.target.value)
                              }
                            >
                            <option value="">
                              Seleccionar
                            </option>

                            {(attribute.attribute_values ?? []).map((value) => (

                                <option
                                  key={
                                    value.id
                                  }
                                  value={
                                    value.id
                                  }
                                >
                                  {
                                    value.value
                                  }
                                </option>

                              )
                            )}
                          </select>
                        </div>
                      )
                    )}
                  </div>

                  {/* ====================================================== */}
                  {/* DELETE */}
                  {/* ====================================================== */}

                  <div
                    style={{
                      marginTop: 20,
                    }}
                  >
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() =>
                        removeVariant(
                          index
                        )
                      }
                    >
                      Eliminar Variante
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
          {/* ====================================================== */}
          {/* ACTIONS */}
          {/* ====================================================== */}

          <div
            className="form-actions"
            style={{
              marginTop: 30,
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}