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

  //==========================================================
  //  MODO SIMPLE
  //==========================================================

  const [variantMode, setVariantMode] = useState("advanced");


  const [simpleConfig, setSimpleConfig] = useState({
    colors: [],
    sizes: [],
    globalAttributes: {
      fit_id: "",
      material_id: "",
      season_id: "",
      style_id: ""
    }
  });

  const generateSimpleVariants = () => {

    const variants = [];

    simpleConfig.colors.forEach((colorValueId) => {

      simpleConfig.sizes.forEach((sizeId) => {

        const attributeMap = {};

        // COLOR
        if (colorAttribute) {
          attributeMap[colorAttribute.id] = colorValueId;
        }

        // MATERIAL
        if (
          materialAttribute &&
          simpleConfig.globalAttributes.material_id
        ) {
          attributeMap[materialAttribute.id] =
            simpleConfig.globalAttributes.material_id;
        }

        // STYLE
        if (
          styleAttribute &&
          simpleConfig.globalAttributes.style_id
        ) {
          attributeMap[styleAttribute.id] =
            simpleConfig.globalAttributes.style_id;
        }

        // SEASON
        if (
          seasonAttribute &&
          simpleConfig.globalAttributes.season_id
        ) {
          attributeMap[seasonAttribute.id] =
            simpleConfig.globalAttributes.season_id;
        }

        variants.push({

          sku: generateSKU(
            form.name,
            sizeId,
            simpleConfig.globalAttributes.fit_id,
            attributeMap,
            variants.length
          ),

          barcode: generateBarcode(),

          price: form.base_price || "",
          cost: "",
          weight: "",

          size_id: sizeId,

          fit_id:
            simpleConfig.globalAttributes.fit_id || "",

          is_active: true,

          attribute_value_ids: attributeMap

        });

      });

    });

    setForm({
      ...form,
      variants
    });

  };

  const generateSKUAdvanced = ({ productName, color, size }) => {
    const p = productName
      ?.toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3);

    const c = color?.slice(0, 3).toUpperCase() || "XXX";
    const s = sizes.find(x => x.id === size)?.name?.slice(0, 1).toUpperCase() || "X";

    return `${p}-${c}-${s}`;
  };

  const colorAttribute = attributes.find(
    a => a.name.toLowerCase() === "color"
  );

  const materialAttribute = attributes.find(
    a => a.name.toLowerCase() === "material"
  );

  const seasonAttribute = attributes.find(
    a => a.name.toLowerCase() === "season"
  );

  const styleAttribute = attributes.find(
    a => a.name.toLowerCase() === "style"
  );


const getAttributeValueName = (valueId) => {

  for (const attr of attributes) {

    const found = attr.attribute_values?.find(
      v => v.id === valueId
    );

    if (found) {
      return found.value;
    }
  }

  return "N/A";
};











// =========================================================

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
  const generateSKU = (productName, sizeId, fitId, attributeIds = {}, index = 0) => {

    const cleanProduct = productName
      ?.toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3);

    const size = sizes.find(s => s.id === sizeId)?.name
      ?.toUpperCase()
      .slice(0, 3) || "NA";

    const fit = fits.find(f => f.id === fitId)?.name
      ?.toUpperCase()
      .slice(0, 2) || "";

    // tomar primer atributo (ej: color)
    const attrValues = Object.values(attributeIds || {});
    const attr = attributes
      ?.flatMap(a => a.attribute_values)
      ?.find(v => v.id === attrValues[0])
      ?.value
      ?.toUpperCase()
      ?.slice(0, 3) || "";

    const extra = index + 1;

    return `${cleanProduct}-${attr}-${size}${fit ? "-" + fit : ""}-${extra}`;
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

  const handleVariantChange = (index, field, value) => {
    const updated = [...form.variants];

    updated[index][field] = value;

    const v = updated[index];

    updated[index].sku = generateSKU(
      form.name,
      v.size_id,
      v.fit_id,
      v.attribute_value_ids,
      index
    );

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

    const v = updated[variantIndex];

    updated[variantIndex].sku = generateSKU(
      form.name,
      v.size_id,
      v.fit_id,
      v.attribute_value_ids,
      variantIndex
    );

    setForm({ ...form, variants: updated });
  };

  // ======================================================
  // ADD VARIANT
  // ======================================================
  const addVariant = () => {
    const index = form.variants.length;

    const firstSize = sizes[0]?.id || "";
    const firstFit = fits[0]?.id || "";

    setForm({
      ...form,
      variants: [
        ...form.variants,
        {
          sku: generateSKU(form.name, firstSize, firstFit, {}, index),
          barcode: generateBarcode(),
          price: "",
          cost: "",
          weight: "",
          size_id: firstSize,
          fit_id: firstFit,
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


  const getOwnerName = (o) => {
    const p = o.user?.user_profiles?.[0];
    if (!p) return "Sin nombre";
    return `${p.first_name ?? ""} ${p.last_name_paternal ?? ""}`.trim();
  };


  // ==============================================
  //
  //===============================================

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

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
          <h3>Información General</h3>

          <div className="product-layout">

            {/* IMAGEN - IZQUIERDA */}
            <div className="product-image-box">

              <label className="image-upload-box">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />

                {imagePreview ? (
                  <img src={imagePreview} alt="preview" />
                ) : (
                  <span>Subir imagen</span>
                )}
              </label>
            </div>

            {/* FORMULARIO - DERECHA */}
            <div className="product-form-right">
              <div className="form-grid">

                {/* TODO TU FORM ACTUAL AQUÍ */}
                
                <div className="form-group">
                  <label>Nombre</label>
                  <input name="name" value={form.name} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>Categoría</label>
                  <select name="category_id" value={form.category_id} onChange={handleChange}>
                    <option value="">Seleccionar</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tipo Producto</label>
                  <select name="product_type_id" value={form.product_type_id} onChange={handleChange}>
                    <option value="">Seleccionar</option>
                    {productTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Propietario</label>
                  <select name="owner_id" value={form.owner_id} onChange={handleChange}>
                    <option value="">Seleccionar</option>
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>
                        {getOwnerName(o)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Precio Base</label>
                  <input type="number" name="base_price" value={form.base_price} onChange={handleChange} />
                </div>

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Descripción</label>
                  <textarea rows={4} name="description" value={form.description} onChange={handleChange} />
                </div>

              </div>
            </div>

          </div>
          {/* ====================================================== */}
          {/* VARIANTS */}
          {/* ====================================================== */}

          <div
            style={{
              marginTop: 40,
            }}
          >

            {/* ====================================================== */}
            {/* HEADER */}
            {/* ====================================================== */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                gap: 20,
                flexWrap: "wrap",
              }}
            >

            <div className="variant-tabs">

              <button
                type="button"
                className={
                  variantMode === "simple"
                    ? "variant-tab active"
                    : "variant-tab"
                }
                onClick={() =>
                  setVariantMode("simple")
                }
              >
                Modo Simple
              </button>

              <button
                type="button"
                className={
                  variantMode === "advanced"
                    ? "variant-tab active"
                    : "variant-tab"
                }
                onClick={() =>
                  setVariantMode("advanced")
                }
              >
                Modo Avanzado
              </button>

            </div>


              {variantMode === "advanced" && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={addVariant}
                >
                  Agregar Variante
                </button>
              )}

            </div>

            {/* ====================================================== */}
            {/* SIMPLE MODE */}
            {/* ====================================================== */}

            {variantMode === "simple" ? (

              <div className="simple-mode-container">

                {/* HEADER */}
                <div className="simple-mode-header">

                  <div>
                    <div className="simple-mode-title">
                      Modo Simple
                    </div>

                    <div className="simple-mode-description">
                      Genera variantes automáticamente
                      usando colores y tallas
                    </div>
                  </div>

                </div>

                {/* GRID */}
                <div className="simple-grid">

                  {/* ====================================================== */}
                  {/* COLORES */}
                  {/* ====================================================== */}

                  <div className="simple-card">

                    <h4>
                      Colores
                    </h4>

                    <label>
                      Selecciona colores
                    </label>

                    <select
                      multiple
                      className="simple-multiselect"
                      value={simpleConfig.colors}
                      onChange={(e) => {

                        const values =
                          Array.from(
                            e.target.selectedOptions,
                            option => option.value
                          );

                        setSimpleConfig({
                          ...simpleConfig,
                          colors: values
                        });

                      }}
                    >

                      {(colorAttribute?.attribute_values || []).map((value) => (

                        <option
                          key={value.id}
                          value={value.id}
                        >
                          {value.value}
                        </option>

                      ))}

                    </select>

                  </div>

                  {/* ====================================================== */}
                  {/* TALLAS */}
                  {/* ====================================================== */}

                  <div className="simple-card">

                    <h4>
                      Tallas
                    </h4>

                    <label>
                      Selecciona tallas
                    </label>

                    <select
                      multiple
                      className="simple-multiselect"
                      value={simpleConfig.sizes}
                      onChange={(e) => {

                        const values =
                          Array.from(
                            e.target.selectedOptions,
                            option => option.value
                          );

                        setSimpleConfig({
                          ...simpleConfig,
                          sizes: values
                        });

                      }}
                    >

                      {sizes.map((size) => (

                        <option
                          key={size.id}
                          value={size.id}
                        >
                          {size.name}
                        </option>

                      ))}

                    </select>

                  </div>

                </div>

                {/* ====================================================== */}
                {/* ATRIBUTOS GLOBALES */}
                {/* ====================================================== */}

                <div
                  className="simple-card"
                  style={{
                    marginTop: 20
                  }}
                >

                  <h4>
                    Configuración Global
                  </h4>

                  <div className="simple-attributes-grid">

                    {/* FIT */}
                    <div>

                      <label>
                        Fit
                      </label>

                      <select
                        value={
                          simpleConfig.globalAttributes.fit_id
                        }
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalAttributes: {
                              ...simpleConfig.globalAttributes,
                              fit_id: e.target.value
                            }
                          })
                        }
                      >

                        <option value="">
                          Seleccionar
                        </option>

                        {fits.map((fit) => (

                          <option
                            key={fit.id}
                            value={fit.id}
                          >
                            {fit.name}
                          </option>

                        ))}

                      </select>

                    </div>

                    {/* MATERIAL */}
                    <div>

                      <label>
                        Material
                      </label>

                      <select
                        value={
                          simpleConfig.globalAttributes.material_id
                        }
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalAttributes: {
                              ...simpleConfig.globalAttributes,
                              material_id: e.target.value
                            }
                          })
                        }
                      >

                        <option value="">
                          Seleccionar
                        </option>

                        {(materialAttribute?.attribute_values || []).map((value) => (

                          <option
                            key={value.id}
                            value={value.id}
                          >
                            {value.value}
                          </option>

                        ))}

                      </select>

                    </div>

                    {/* STYLE */}
                    <div>

                      <label>
                        Style
                      </label>

                      <select
                        value={
                          simpleConfig.globalAttributes.style_id
                        }
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalAttributes: {
                              ...simpleConfig.globalAttributes,
                              style_id: e.target.value
                            }
                          })
                        }
                      >

                        <option value="">
                          Seleccionar
                        </option>

                        {(styleAttribute?.attribute_values || []).map((value) => (

                          <option
                            key={value.id}
                            value={value.id}
                          >
                            {value.value}
                          </option>

                        ))}

                      </select>

                    </div>

                    {/* SEASON */}
                    <div>

                      <label>
                        Season
                      </label>

                      <select
                        value={
                          simpleConfig.globalAttributes.season_id
                        }
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalAttributes: {
                              ...simpleConfig.globalAttributes,
                              season_id: e.target.value
                            }
                          })
                        }
                      >

                        <option value="">
                          Seleccionar
                        </option>

                        {(seasonAttribute?.attribute_values || []).map((value) => (

                          <option
                            key={value.id}
                            value={value.id}
                          >
                            {value.value}
                          </option>

                        ))}

                      </select>

                    </div>

                  </div>

                </div>

                {/* ====================================================== */}
                {/* SUMMARY */}
                {/* ====================================================== */}

                <div className="simple-summary">

                  <h4>
                    Resumen
                  </h4>

                  <div className="simple-summary-grid">

                    {/* COLORES */}
                    <div className="simple-summary-item">

                      <div className="simple-summary-label">
                        Colores
                      </div>

                      <div className="simple-summary-value">

                        {simpleConfig.colors.length
                          ? simpleConfig.colors
                              .map(getAttributeValueName)
                              .join(", ")
                          : "Ninguno"}

                      </div>

                    </div>

                    {/* TALLAS */}
                    <div className="simple-summary-item">

                      <div className="simple-summary-label">
                        Tallas
                      </div>

                      <div className="simple-summary-value">

                        {simpleConfig.sizes.length
                          ? simpleConfig.sizes
                              .map(
                                sizeId =>
                                  sizes.find(
                                    s => s.id === sizeId
                                  )?.name
                              )
                              .join(", ")
                          : "Ninguna"}

                      </div>

                    </div>

                    {/* FIT */}
                    <div className="simple-summary-item">

                      <div className="simple-summary-label">
                        Fit
                      </div>

                      <div className="simple-summary-value">

                        {fits.find(
                          f =>
                            f.id ===
                            simpleConfig.globalAttributes.fit_id
                        )?.name || "No definido"}

                      </div>

                    </div>

                    {/* VARIANTES */}
                    <div className="simple-summary-item">

                      <div className="simple-summary-label">
                        Variantes a generar
                      </div>

                      <div className="simple-summary-value">

                        {
                          simpleConfig.colors.length *
                          simpleConfig.sizes.length
                        }

                      </div>

                    </div>

                  </div>

                </div>

                {/* ====================================================== */}
                {/* GENERATE */}
                {/* ====================================================== */}

                <button
                  type="button"
                  className="simple-generate-btn"
                  onClick={generateSimpleVariants}
                >
                  Generar Variantes Automáticamente
                </button>

                {form.variants.length > 0 && (

                  <div className="generated-count">

                    {form.variants.length}
                    {" "}
                    variantes generadas

                  </div>

                )}

              </div>

            ) : (

              /* ====================================================== */
              /* ADVANCED MODE */
              /* ====================================================== */

              form.variants.map((variant, index) => (

                <div
                  key={index}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 25,
                  }}
                >

                  <h4>
                    Variante #{index + 1}
                  </h4>

                  {/* ================= DATOS ================= */}

                  <div className="form-grid">

                    <div className="form-group">
                      <label>SKU</label>
                      <input value={variant.sku} readOnly />
                    </div>

                    <div className="form-group">
                      <label>Barcode</label>
                      <input value={variant.barcode} readOnly />
                    </div>

                    <div className="form-group">
                      <label>Precio</label>

                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "price",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Activo
                      </label>

                      <select
                        value={variant.is_active}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "is_active",
                            e.target.value === "true"
                          )
                        }
                      >
                        <option value={true}>
                          Activo
                        </option>

                        <option value={false}>
                          Inactivo
                        </option>

                      </select>

                    </div>

                    <div className="form-group">

                      <label>
                        Costo
                      </label>

                      <input
                        type="number"
                        value={variant.cost}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "cost",
                            e.target.value
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
                        value={variant.weight}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "weight",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    {/* SIZE */}

                    <div className="form-group">

                      <label>
                        Talla
                      </label>

                      <select
                        value={variant.size_id}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "size_id",
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Seleccionar
                        </option>

                        {sizes.map((size) => (

                          <option
                            key={size.id}
                            value={size.id}
                          >
                            {size.name}
                          </option>

                        ))}

                      </select>

                    </div>

                    {/* FIT */}

                    <div className="form-group">

                      <label>
                        Fit
                      </label>

                      <select
                        value={variant.fit_id}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            "fit_id",
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Seleccionar
                        </option>

                        {fits.map((fit) => (

                          <option
                            key={fit.id}
                            value={fit.id}
                          >
                            {fit.name}
                          </option>

                        ))}

                      </select>

                    </div>

                  </div>

                  {/* ================= ATTRIBUTES ================= */}

                  <h4
                    style={{
                      marginTop: 25
                    }}
                  >
                    Atributos
                  </h4>

                  <div className="form-grid">

                    {attributes.map((attribute) => (

                      <div
                        key={attribute.id}
                        className="form-group"
                      >

                        <label>
                          {attribute.name}
                        </label>

                        <select
                          value={
                            form.variants[index]
                              ?.attribute_value_ids?.[
                                attribute.id
                              ] || ""
                          }
                          onChange={(e) =>
                            handleAttributeChange(
                              index,
                              attribute.id,
                              e.target.value
                            )
                          }
                        >

                          <option value="">
                            Seleccionar
                          </option>

                          {(attribute.attribute_values ?? []).map((value) => (

                            <option
                              key={value.id}
                              value={value.id}
                            >
                              {value.value}
                            </option>

                          ))}

                        </select>

                      </div>

                    ))}

                  </div>

                  {/* DELETE */}

                  <div
                    style={{
                      marginTop: 20
                    }}
                  >

                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() =>
                        removeVariant(index)
                      }
                    >
                      Eliminar Variante
                    </button>

                  </div>

                </div>

              ))

            )}

          </div>
        </form>
      </div>
    </div>
  );
}