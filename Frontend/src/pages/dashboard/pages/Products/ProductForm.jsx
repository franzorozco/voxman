import { useEffect, useState } from "react";
import { getAttributes } from "../../../../api/attributes";
import { createAttributeValue } from "../../../../api/attributeValues";
import { createSize } from "../../../../api/sizes";
import namer from "color-namer";
import { Plus } from "lucide-react";


export default function ProductForm({
  product,
  categories = [],
  owners = [],
  productTypes = [],
  attributes: initialAttributes = [],
  sizes: initialSizes = [], 
  fits = [],
  onClose,
  onSubmit,
}){
  const [attributes, setAttributes] = useState(initialAttributes);
  const [sizes, setSizes] = useState(initialSizes);

  useEffect(() => {
    setAttributes(initialAttributes);
  }, [initialAttributes]);

  useEffect(() => {
    setSizes(initialSizes);
  }, [initialSizes]);

  const [showCreateColor, setShowCreateColor] =
    useState(false);

  const [showCreateSize, setShowCreateSize] =
    useState(false);

  const [newColor, setNewColor] = useState({
    value: "",
    hex_code: "#000000",
  });






  const translateText = async (text) => {
    try {

      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`
      );

      const data = await response.json();

      return data[0][0][0];

    } catch (error) {

      console.error(error);

      return text;
    }
  };

  const getColorName = async (hex) => {
    try {

      const result = namer(hex);

      const englishName =
        result.ntc[0].name;

      const translatedName =
        await translateText(englishName);

      return translatedName;

    } catch {

      return "Color desconocido";
    }
  };

  
  const handleCreateColor = async () => {
    try {
      const payload = {
        attribute_id: colorAttribute.id,
        value: newColor.value,
        hex_code: newColor.hex_code,
      };

      const res =
        await createAttributeValue(payload);

      const createdColor = res.data?.data ?? res.data;

      // actualizar attributes (usar functional update para evitar stale closures)
      setAttributes(prev =>
        prev.map(attr => {
          if (attr.name?.toLowerCase() !== "color")
            return attr;

          return {
            ...attr,
            attribute_values: [
              ...attr.attribute_values,
              createdColor
            ]
          };
        })
      );

      // seleccionarlo automáticamente
      setSimpleConfig(prev => ({
        ...prev,
        colors: [
          ...prev.colors,
          createdColor.id
        ]
      }));

      setShowCreateColor(false);

      setNewColor({
        value: "",
        hex_code: "#000000",
      });

    } catch (error) {
      console.error(error);
    }
  };


  const handleCreateSize = async () => {
    try {

      const res =
        await createSize(newSize);

      const createdSize = res.data?.data ?? res.data;

      setSizes(prev => [
        ...prev,
        createdSize
      ]);

      setSimpleConfig(prev => ({
        ...prev,
        sizes: [
          ...prev.sizes,
          createdSize.id
        ]
      }));

      setShowCreateSize(false);

      setNewSize({
        name: "",
        description: "",
      });

    } catch (error) {
      console.error(error);
    }
  };


  const [newSize, setNewSize] = useState({
    name: "",
    description: "",
  });
  //==========================================================
  //  MODO SIMPLE
  //==========================================================

  const [variantMode, setVariantMode] = useState("simple");
  const [simpleConfig, setSimpleConfig] = useState({
    colors: [],
    sizes: [],

    globalPrice: "",
    globalCost: "",
    globalWeight: "",

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
          price: simpleConfig.globalPrice || form.base_price || "",
          cost: simpleConfig.globalCost || "",
          weight: simpleConfig.globalWeight || "",
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
    if (!attributes.length) return;
  }, [attributes]);


  const getOwnerName = (o) => {
    const p = o.user?.user_profiles?.[0];
    if (!p) return "Sin nombre";
    return `${p.first_name ?? ""} ${p.last_name_paternal ?? ""}`.trim();
  };



  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };


  const [showColorsModal, setShowColorsModal] =
    useState(false);

  const [showSizesModal, setShowSizesModal] =
    useState(false);

  const [advancedColorModal, setAdvancedColorModal] =
    useState({
      open: false,
      variantIndex: null
    });

  const [advancedSizeModal, setAdvancedSizeModal] =
    useState({
      open: false,
      variantIndex: null
    });
    
  const MAX_VISIBLE_COLORS = 4;
  const MAX_VISIBLE_SIZES = 6;

  const toggleSelection = (field, value) => {
    setSimpleConfig((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value]
    }));
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

          <div style={{marginTop: 40,}}>
            {/* ====================================================== */}
            {/* VARIANTS PREVIEW TABLE */}
            {/* ====================================================== */}
            {form.variants.length > 0 && (
              <div className="variants-preview-container">
                <div className="variants-preview-header">
                  <div>
                    <div className="variants-preview-title">
                      Variantes Generadas
                    </div>

                    <div className="variants-preview-description">
                      Vista rápida en tiempo real de las variantes configuradas
                    </div>
                  </div>

                  <div className="variants-preview-count">
                    {form.variants.length}
                  </div>

                </div>

                <div className="variants-preview-table-wrapper">
                  <table className="variants-preview-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>SKU</th>
                        <th>Variante</th>
                        <th>Atributos</th>
                        <th>Precio</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {form.variants.map((variant, index) => {
                        const attributesContent = [
                          // FIT PRIMERO
                          variant.fit_id && {
                            id: "fit",
                            name: "Fit",
                            value:
                              fits.find(
                                f => f.id === variant.fit_id
                              )?.name || "N/A"
                          },

                          // RESTO DE ATRIBUTOS (SIN COLOR)
                          ...Object.entries(
                            variant.attribute_value_ids || {}
                          )
                            .filter(
                              ([attributeId]) =>
                                attributeId !== colorAttribute?.id
                            )
                            .map(([attributeId, valueId]) => {
                              const attribute = attributes.find(
                                a => a.id === attributeId
                              );

                              const value =
                                attribute?.attribute_values?.find(
                                  v => v.id === valueId
                                );

                              if (!value) return null;

                              return {
                                id: attributeId,
                                name: attribute.name,
                                value: value.value
                              };
                            })
                        ]
                        .filter(Boolean)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="variant-attribute-tag"
                          >
                            <span className="variant-attribute-name">
                              {item.name}
                            </span>

                            <span className="variant-attribute-value">
                              {item.value}
                            </span>
                          </div>
                        ));

                        return (
                          <tr key={index}>

                            <td>
                              #{index + 1}
                            </td>

                            <td>
                              {variant.sku || "-"}
                            </td>

                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4
                                }}
                              >
                                {/* COLOR */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10
                                }}
                              >
                                {(() => {
                                  const colorId =
                                    variant.attribute_value_ids?.[
                                      colorAttribute?.id
                                    ];

                                  const color =
                                    colorAttribute?.attribute_values?.find(
                                      c => c.id === colorId
                                    );

                                  return (
                                    <>
                                      <div
                                        style={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: 999,
                                          background:
                                            color?.hex_code || "#999",
                                          border:
                                            "2px solid rgba(255,255,255,.2)"
                                        }}
                                      />

                                      <span style={{ fontWeight: 600 }}>
                                        {color?.value || "Sin color"}
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>

                                {/* TALLA */}
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "rgba(255,255,255,.65)"
                                  }}
                                >
                                  Talla:{" "}
                                  {sizes.find(
                                    s => s.id === variant.size_id
                                  )?.name || "-"}
                                </span>
                              </div>
                            </td>

                            <td className="variant-attributes-cell">
                              {attributesContent?.length
                                ? attributesContent
                                : "Sin atributos"}

                            </td>

                            <td>
                              {variant.price || "-"}
                            </td>

                            <td>
                              <span
                                className={
                                  variant.is_active
                                    ? "variant-status active"
                                    : "variant-status inactive"
                                }
                              >
                                {
                                  variant.is_active
                                    ? "Activo"
                                    : "Inactivo"
                                }
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}          

            <div className="variants-header">
              <div className="variants-header-info">
                <div className="variants-title">
                  Variantes del Producto
                </div>

                <div className="variants-description">
                  Configura variantes automáticas o manuales
                  para este producto
                </div>
              </div>

              <div className="variants-header-actions">
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
              </div>
            </div>

            {/* ====================================================== */}
            {/* SIMPLE MODE */}
            {/* ====================================================== */}

            {variantMode === "advanced" && (
              <button
                type="button"
                className="btn-primary"
                onClick={addVariant}
              >
                Agregar Variante
              </button>
            )}

            {variantMode === "simple" ? (
              <div className="simple-mode-container">
                {/* HEADER */}
                <div className="simple-mode-header">
                  <div>
                    <div className="simple-mode-title">
                      Generación Automática
                    </div>
                    <div className="simple-mode-description">
                      Combina colores, tallas y atributos
                      globales automáticamente
                    </div>
                  </div>
                </div>

                {/* GRID */}
                <div className="simple-grid">

                  {/* ====================================================== */}
                  {/* COLORES */}
                  {/* ====================================================== */}
                  <div className="simple-card">
                    <div className="selector-header">

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10
                        }}
                      >
                        <h4>Colores</h4>

                        <button
                          type="button"
                          className="add-mini-btn"
                          onClick={() =>
                            setShowCreateColor(true)
                          }
                        >
                          <Plus size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                      <span className="selected-counter">
                        {simpleConfig.colors.length} seleccionados
                      </span>
                    </div>

                    <div className="color-selector-grid">
                      {(colorAttribute?.attribute_values || [])
                        .slice(0, MAX_VISIBLE_COLORS)
                        .map((color) => {

                          const selected =
                            simpleConfig.colors.includes(color.id);

                          return (
                            <button
                              key={color.id}
                              type="button"
                              className={
                                selected
                                  ? "color-circle active"
                                  : "color-circle"
                              }
                              onClick={() =>
                                toggleSelection(
                                  "colors",
                                  color.id
                                )
                              }
                            >
                              <div
                                className="color-circle-preview"
                                style={{
                                  background:
                                    color.hex_code || "#ccc"
                                }}
                              />

                              <span>
                                {color.value}
                              </span>
                            </button>
                          );
                        })}
                    </div>

                    {(colorAttribute?.attribute_values?.length || 0) >
                      MAX_VISIBLE_COLORS && (
                      <button
                        type="button"
                        className="see-more-btn"
                        onClick={() =>
                          setShowColorsModal(true)
                        }
                      >
                        Ver todos los colores
                      </button>
                    )}
                  </div>

                  {/* ====================================================== */}
                  {/* TALLAS */}
                  {/* ====================================================== */}

                  <div className="simple-card">
                    <div className="selector-header">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10
                        }}
                      >
                        <h4>Tallas</h4>

                        <button
                          type="button"
                          className="add-mini-btn"
                          onClick={() =>
                            setShowCreateSize(true)
                          }
                        >
                          <Plus size={18} strokeWidth={2.5} />
                        </button>
                      </div>

                      <span className="selected-counter">
                        {simpleConfig.sizes.length}
                        {" "}seleccionadas
                      </span>
                    </div>

                    <div className="size-selector">
                      {sizes
                        .slice(0, MAX_VISIBLE_SIZES)
                        .map((size) => {

                          const selected =
                            simpleConfig.sizes.includes(size.id);

                          return (
                            <button
                              key={size.id}
                              type="button"
                              className={
                                selected
                                  ? "size-chip active"
                                  : "size-chip"
                              }
                              onClick={() =>
                                toggleSelection(
                                  "sizes",
                                  size.id
                                )
                              }
                            >
                              {size.name}
                            </button>
                          );
                        })}
                    </div>

                    {sizes.length > MAX_VISIBLE_SIZES && (
                      <button
                        type="button"
                        className="see-more-btn"
                        onClick={() =>
                          setShowSizesModal(true)
                        }
                      >
                        Ver todas las tallas
                      </button>
                    )}
                  </div>

                </div>

                {/* ====================================================== */}
                {/* ATRIBUTOS GLOBALES */}
                {/* ====================================================== */}

                <div className="simple-card" style={{ marginTop: 20 }}>

                  <h4>Configuración Global</h4>

                  <div className="simple-attributes-grid">

                    {/* FIT */}
                    <div className="simple-global-field">

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
                    <div className="simple-global-field">

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
                    <div className="simple-global-field">
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
                    <div className="simple-global-field">
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

                    {/* PRECIO GLOBAL */}
                    <div className="simple-global-field">

                      <label>
                        Precio Venta
                      </label>

                      <input
                        className="simple-price-input"
                        type="number"
                        value={simpleConfig.globalPrice}
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalPrice: e.target.value
                          })
                        }
                      />

                    </div>

                    {/* COSTO GLOBAL */}
                    <div className="simple-global-field">

                      <label>
                        Costo
                      </label>

                      <input
                        className="simple-price-input"
                        type="number"
                        value={simpleConfig.globalCost}
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalCost: e.target.value
                          })
                        }
                      />

                    </div>

                    {/* PESO GLOBAL */}
                    <div className="simple-global-field">

                      <label>
                        Peso
                      </label>

                      <input
                        className="simple-price-input"
                        type="number"
                        step="0.01"
                        value={simpleConfig.globalWeight}
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalWeight: e.target.value
                          })
                        }
                      />

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
                  className="variant-card"
                >
                  <div className="variant-card-header">
                    <div>
                      <div className="variant-card-title">
                        Variante #{index + 1}
                      </div>

                      <div className="variant-card-subtitle">
                        Configuración individual de variante
                      </div>

                    </div>
                    <div className="variant-badge">
                      #{index + 1}
                    </div>
                  </div>

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
                      <label>Talla</label>

                      <div className="advanced-selector-grid">
                        {sizes
                          .slice(0, MAX_VISIBLE_SIZES)
                          .map((size) => {

                            const selected =
                              variant.size_id === size.id;

                            return (
                              <button
                                key={size.id}
                                type="button"
                                className={
                                  selected
                                    ? "size-chip active"
                                    : "size-chip"
                                }
                                onClick={() =>
                                  handleVariantChange(
                                    index,
                                    "size_id",
                                    size.id
                                  )
                                }
                              >
                                {size.name}
                              </button>
                            );
                          })}
                      </div>

                      {sizes.length > MAX_VISIBLE_SIZES && (
                        <button
                          type="button"
                          className="see-more-btn"
                          onClick={() =>
                            setAdvancedSizeModal({
                              open: true,
                              variantIndex: index
                            })
                          }
                        >
                          Ver todas las tallas
                        </button>
                      )}
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
                  <div className="variant-section-title">
                    Atributos de Variante
                  </div>

                  <div className="form-grid">
                  {attributes.map((attribute) => {

                    const isColor =
                      attribute.id === colorAttribute?.id;

                    if (isColor) {
                      return (
                        <div
                          key={attribute.id}
                          className="form-group"
                        >
                          <span className="variant-attribute-name">
                            Color
                          </span>

                          <div className="advanced-color-grid">
                            {(attribute.attribute_values ?? [])
                              .slice(0, MAX_VISIBLE_COLORS)
                              .map((value) => {

                                const selected =
                                  form.variants[index]
                                    ?.attribute_value_ids?.[
                                      attribute.id
                                    ] === value.id;

                                return (
                                  <button
                                    key={value.id}
                                    type="button"
                                    className={
                                      selected
                                        ? "advanced-color-item active"
                                        : "advanced-color-item"
                                    }
                                    onClick={() =>
                                      handleAttributeChange(
                                        index,
                                        attribute.id,
                                        value.id
                                      )
                                    }
                                  >
                                    <div
                                      className="advanced-color-dot"
                                      style={{
                                        background:
                                          value.hex_code || "#ccc"
                                      }}
                                    />

                                    <div>
                                      <div>
                                        {value.value}
                                      </div>

                                      <small>
                                        {value.hex_code ||
                                          "#000000"}
                                      </small>
                                    </div>
                                  </button>
                                );
                              })}
                          </div>

                          {(attribute.attribute_values
                            ?.length || 0) >
                            MAX_VISIBLE_COLORS && (
                            <button
                              type="button"
                              className="see-more-btn"
                              onClick={() =>
                                setAdvancedColorModal({
                                  open: true,
                                  variantIndex: index
                                })
                              }
                            >
                              Ver todos los colores
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={attribute.id}
                        className="form-group"
                      >
                        <span className="variant-attribute-name">
                          {attribute.name}
                        </span>

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

                          {(attribute.attribute_values ?? [])
                            .map((value) => (
                              <option
                                key={value.id}
                                value={value.id}
                              >
                                {value.value}
                              </option>
                            ))}
                        </select>
                      </div>
                    );
                  })}
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

          {/* =======================================
              MODAL COLORES
          ======================================= */}
          {showColorsModal && (
            <div className="selector-modal-overlay">
              <div className="selector-modal">

                <div className="selector-modal-header">

                  <div className="modal-title-group">
                    <h3>Seleccionar Colores</h3>

                    <button
                      type="button"
                      className="add-mini-btn"
                      onClick={() =>
                        setShowCreateColor(true)
                      }
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="close-modal-btn"
                    onClick={() =>
                      setShowColorsModal(false)
                    }
                  >
                    ✕
                  </button>

                </div>

                <div className="color-selector-grid modal-grid">
                  {(colorAttribute?.attribute_values || []).map(
                    (color) => {

                      const selected =
                        simpleConfig.colors.includes(
                          color.id
                        );

                      return (
                        <button
                          key={color.id}
                          type="button"
                          className={
                            selected
                              ? "color-circle active"
                              : "color-circle"
                          }
                          onClick={() =>
                            toggleSelection(
                              "colors",
                              color.id
                            )
                          }
                        >
                          <div
                            className="color-circle-preview"
                            style={{
                              background:
                                color.hex_code || "#ccc"
                            }}
                          />

                          <span>
                            {color.value}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  type="button"
                  className="modal-ready-btn"
                  onClick={() =>
                    setShowColorsModal(false)
                  }
                >
                  Listo
                </button>
              </div>
            </div>
          )}

          {/* =======================================
              MODAL TALLAS
          ======================================= */}
          {showSizesModal && (
            <div className="selector-modal-overlay">
              <div className="selector-modal">
                <div className="selector-modal-header">

                  <div className="modal-title-group">
                    <h3>Seleccionar Tallas</h3>

                    <button
                      type="button"
                      className="add-mini-btn"
                      onClick={() =>
                        setShowCreateSize(true)
                      }
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="close-modal-btn"
                    onClick={() =>
                      setShowSizesModal(false)
                    }
                  >
                    ✕
                  </button>

                </div>

                <div className="size-selector modal-size-grid">
                  {sizes.map((size) => {

                    const selected =
                      simpleConfig.sizes.includes(
                        size.id
                      );

                    return (
                      <button
                        key={size.id}
                        type="button"
                        className={
                          selected
                            ? "size-chip active"
                            : "size-chip"
                        }
                        onClick={() =>
                          toggleSelection(
                            "sizes",
                            size.id
                          )
                        }
                      >
                        {size.name}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="modal-ready-btn"
                  onClick={() =>
                    setShowSizesModal(false)
                  }
                >
                  Listo
                </button>
              </div>
            </div>
          )}

          {/* =======================================
              ADVANCED COLOR MODAL
          ======================================= */}
          {advancedColorModal.open && (
            <div className="selector-modal-overlay">
              <div className="selector-modal">

                <div className="selector-modal-header">

                  <div className="modal-title-group">
                    <h3>Seleccionar Color</h3>

                    <button
                      type="button"
                      className="add-mini-btn"
                      onClick={() =>
                        setShowCreateColor(true)
                      }
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="close-modal-btn"
                    onClick={() =>
                      setAdvancedColorModal({
                        open: false,
                        variantIndex: null
                      })
                    }
                  >
                    ✕
                  </button>

                </div>

                <div className="advanced-color-grid modal-grid">
                  {(colorAttribute?.attribute_values || [])
                    .map((color) => {

                      const selected =
                        form.variants[
                          advancedColorModal.variantIndex
                        ]?.attribute_value_ids?.[
                          colorAttribute.id
                        ] === color.id;

                      return (
                        <button
                          key={color.id}
                          type="button"
                          className={
                            selected
                              ? "advanced-color-item active"
                              : "advanced-color-item"
                          }
                          onClick={() =>
                            handleAttributeChange(
                              advancedColorModal.variantIndex,
                              colorAttribute.id,
                              color.id
                            )
                          }
                        >
                          <div
                            className="advanced-color-dot"
                            style={{
                              background:
                                color.hex_code || "#ccc"
                            }}
                          />

                          <div>
                            <div>
                              {color.value}
                            </div>

                            <small>
                              {color.hex_code}
                            </small>
                          </div>
                        </button>
                      );
                    })}
                </div>

                <button
                  type="button"
                  className="modal-ready-btn"
                  onClick={() =>
                    setAdvancedColorModal({
                      open: false,
                      variantIndex: null
                    })
                  }
                >
                  Listo
                </button>
              </div>
            </div>
          )}

          {/* =======================================
              ADVANCED SIZE MODAL
          ======================================= */}
          {advancedSizeModal.open && (
            <div className="selector-modal-overlay">
              <div className="selector-modal">

                <div className="selector-modal-header">

                  <div className="modal-title-group">
                    <h3>Seleccionar Talla</h3>

                    <button
                      type="button"
                      className="add-mini-btn"
                      onClick={() =>
                        setShowCreateSize(true)
                      }
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="close-modal-btn"
                    onClick={() =>
                      setAdvancedSizeModal({
                        open: false,
                        variantIndex: null
                      })
                    }
                  >
                    ✕
                  </button>

                </div>

                <div className="size-selector modal-size-grid">
                  {sizes.map((size) => {

                    const selected =
                      form.variants[
                        advancedSizeModal.variantIndex
                      ]?.size_id === size.id;

                    return (
                      <button
                        key={size.id}
                        type="button"
                        className={
                          selected
                            ? "size-chip active"
                            : "size-chip"
                        }
                        onClick={() =>
                          handleVariantChange(
                            advancedSizeModal.variantIndex,
                            "size_id",
                            size.id
                          )
                        }
                      >
                        {size.name}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="modal-ready-btn"
                  onClick={() =>
                    setAdvancedSizeModal({
                      open: false,
                      variantIndex: null
                    })
                  }
                >
                  Listo
                </button>
              </div>
            </div>
          )}

          {/* =======================================
              CREATE COLOR MODAL
          ======================================= */
          }
          {showCreateColor && (
            <div className="selector-modal-overlay">
              <div className="create-modal create-color-modal-premium">

                {/* HEADER */}
                <div className="create-modal-header">
                  <div>
                    <h2>🎨 Nuevo Color</h2>
                    <p>
                      Agrega un color rápidamente sin salir
                      del formulario
                    </p>
                  </div>

                  <button
                    type="button"
                    className="close-modal-btn"
                    onClick={() =>
                      setShowCreateColor(false)
                    }
                  >
                    ✕
                  </button>
                </div>

                {/* BODY */}
                <div className="create-modal-body">

                  {/* Preview */}
                  <div className="color-preview-card">

                    <div
                      className="color-preview-circle"
                      style={{
                        background:
                          newColor.hex_code
                      }}
                    />

                    <div className="color-preview-info">
                      <span className="color-preview-name">
                        {newColor.value || "Sin nombre"}
                      </span>

                      <span className="color-preview-hex">
                        {newColor.hex_code}
                      </span>
                    </div>
                  </div>

                  {/* Picker */}
                  <div className="form-field-modern">
                    <label>
                      Seleccionar Color
                    </label>

                    <input
                      type="color"
                      value={newColor.hex_code}
                      className="premium-color-picker"
                      onChange={async (e) => {

                        const hex = e.target.value;

                        const translatedColor =
                          await getColorName(hex);

                        setNewColor({
                          hex_code: hex,
                          value: translatedColor
                        });
                      }}
                    />
                  </div>

                  {/* Nombre */}
                  <div className="form-field-modern">
                    <label>
                      Nombre del Color
                    </label>

                    <input
                      value={newColor.value}
                      placeholder="Ej: Azul Marino"
                      onChange={(e) =>
                        setNewColor({
                          ...newColor,
                          value: e.target.value
                        })
                      }
                    />
                  </div>

                  {/* HEX */}
                  <div className="form-field-modern">
                    <label>
                      Código HEX
                    </label>

                    <input
                      value={newColor.hex_code}
                      readOnly
                    />
                  </div>

                </div>

                {/* FOOTER */}
                <div className="create-modal-footer">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() =>
                      setShowCreateColor(false)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="save-btn"
                    onClick={handleCreateColor}
                  >
                    Guardar Color
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =======================================
              CREATE SIZE MODAL
          =========================================== */
          }
          {showCreateSize && (
            <div className="selector-modal-overlay">
              <div className="create-modal">

                {/* HEADER */}
                <div className="create-modal-header">
                  <div>
                    <h2>📏 Nueva Talla</h2>
                    <p>
                      Crea una talla sin abandonar
                      el formulario
                    </p>
                  </div>

                  <button
                    type="button"
                    className="close-modal-btn"
                    onClick={() =>
                      setShowCreateSize(false)
                    }
                  >
                    ✕
                  </button>
                </div>

                {/* BODY */}
                <div className="create-modal-body">

                  <div className="size-preview-card">
                    <div className="size-preview-chip">
                      {newSize.name || "XXL"}
                    </div>

                    <div>
                      <div className="size-preview-title">
                        Vista previa
                      </div>

                      <div className="size-preview-description">
                        Así se mostrará tu talla
                      </div>
                    </div>
                  </div>

                  <div className="form-field-modern">
                    <label>
                      Nombre
                    </label>

                    <input
                      placeholder="Ej: XL"
                      value={newSize.name}
                      onChange={(e) =>
                        setNewSize({
                          ...newSize,
                          name: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="form-field-modern">
                    <label>
                      Descripción
                    </label>

                    <textarea
                      rows={3}
                      placeholder="Ej: Extra Large"
                      value={newSize.description}
                      onChange={(e) =>
                        setNewSize({
                          ...newSize,
                          description: e.target.value
                        })
                      }
                    />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="create-modal-footer">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() =>
                      setShowCreateSize(false)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="save-btn"
                    onClick={handleCreateSize}
                  >
                    Guardar Talla
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
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
              {product
                ? "Actualizar Producto"
                : "Crear Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}