import { API_BASE_URL } from "../../../../config/api";
import { useEffect, useState } from "react";
import { getAttributes } from "../../../../api/attributes";
import { createAttributeValue } from "../../../../api/attributeValues";
import { createSize } from "../../../../api/sizes";
import namer from "color-namer";
import { Plus, Camera, AlertTriangle } from "lucide-react";
import ImageGalleryModal from "./ImageGalleryModal";


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
  const [productImage, setProductImage] = useState(null);

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
      if (!newColor.value || !newColor.hex_code) return;

      const existingColor = colorAttribute?.attribute_values?.find(
        (c) =>
          c.value.toLowerCase() === newColor.value.toLowerCase() ||
          c.hex_code.toLowerCase() === newColor.hex_code.toLowerCase()
      );

      let colorIdToSelect;

      if (existingColor) {
        colorIdToSelect = existingColor.id;
      } else {
        const payload = {
          attribute_id: colorAttribute.id,
          value: newColor.value,
          hex_code: newColor.hex_code,
        };

        const res = await createAttributeValue(payload);
        const createdColor = res.data?.data ?? res.data;
        colorIdToSelect = createdColor.id;

        setAttributes((prev) =>
          prev.map((attr) => {
            if (attr.id !== colorAttribute?.id) return attr;
            return {
              ...attr,
              attribute_values: [...attr.attribute_values, createdColor],
            };
          })
        );
      }

      if (advancedColorModal?.open && advancedColorModal.variantIndex !== null) {
        handleAttributeChange(advancedColorModal.variantIndex, colorAttribute.id, colorIdToSelect);
      } else {
        setSimpleConfig((prev) => {
          if (prev.colors.includes(colorIdToSelect)) return prev;
          return {
            ...prev,
            colors: [...prev.colors, colorIdToSelect],
          };
        });
      }

      setShowCreateColor(false);
      setNewColor({ value: "", hex_code: "#000000" });
    } catch (error) {
      console.error(error);
    }
  };;

  const handleCreateSize = async () => {
    try {
      if (!newSize.name) return;

      const existingSize = sizes.find(
        (s) => s.name.toLowerCase() === newSize.name.toLowerCase()
      );

      let sizeIdToSelect;

      if (existingSize) {
        sizeIdToSelect = existingSize.id;
      } else {
        const res = await createSize(newSize);
        const createdSize = res.data?.data ?? res.data;
        sizeIdToSelect = createdSize.id;

        setSizes((prev) => [...prev, createdSize]);
      }

      if (advancedSizeModal?.open && advancedSizeModal.variantIndex !== null) {
        handleVariantChange(advancedSizeModal.variantIndex, "size_id", sizeIdToSelect);
      } else {
        setSimpleConfig((prev) => {
          if (prev.sizes.includes(sizeIdToSelect)) return prev;
          return {
            ...prev,
            sizes: [...prev.sizes, sizeIdToSelect],
          };
        });
      }

      setShowCreateSize(false);
      setNewSize({ name: "", description: "" });
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
  const [showSwitchWarning, setShowSwitchWarning] = useState(false);
  const [showStrategyWarning, setShowStrategyWarning] = useState(false);

  // Imágenes por Variante o Color
  const [colorImages, setColorImages] = useState({});
  const [variantImages, setVariantImages] = useState({});
  const [advancedImageMode, setAdvancedImageMode] = useState("color");
  const [galleryModalConfig, setGalleryModalConfig] = useState({ open: false, type: "color", id: null });

  const handleSwitchToSimple = () => {
    if (variantMode === "advanced" && form.variants.length > 0) {
      setShowSwitchWarning(true);
    } else {
      setVariantMode("simple");
    }
  };

  const confirmSwitchToSimple = () => {
    setVariantMode("simple");
    setShowSwitchWarning(false);
  };

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

  const [simpleModeError, setSimpleModeError] = useState("");

  const generateSimpleVariants = () => {
    if (simpleConfig.colors.length === 0 || simpleConfig.sizes.length === 0) {
      setSimpleModeError("Debes seleccionar al menos un color y una talla para generar variantes.");
      return;
    }
    setSimpleModeError("");

    const variants = [];
    simpleConfig.colors.forEach((colorValueId) => {
      simpleConfig.sizes.forEach((sizeId) => {
        const attributeMap = {};

        if (colorAttribute) {
          attributeMap[colorAttribute.id] = colorValueId;
        }

        if (
          materialAttribute &&
          simpleConfig.globalAttributes.material_id
        ) {
          attributeMap[materialAttribute.id] =
            simpleConfig.globalAttributes.material_id;
        }

        if (
          styleAttribute &&
          simpleConfig.globalAttributes.style_id
        ) {
          attributeMap[styleAttribute.id] =
            simpleConfig.globalAttributes.style_id;
        }

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

  const normalizeAttr = (name) => name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const colorAttribute = attributes.find(
    a => normalizeAttr(a.name).includes("color") || a.attribute_values?.some(v => v.hex_code)
  );

  const materialAttribute = attributes.find(
    a => normalizeAttr(a.name).includes("material")
  );

  const seasonAttribute = attributes.find(
    a => normalizeAttr(a.name).includes("season") || normalizeAttr(a.name).includes("temporada")
  );

  const styleAttribute = attributes.find(
    a => normalizeAttr(a.name).includes("style") || normalizeAttr(a.name).includes("estilo")
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

      // Force Advanced Mode on Edit
      setVariantMode("advanced");

      // Resolve Strategy and Images
      let strategy = "color";
      const initialColorImages = {};
      const initialVariantImages = {};

      const getImageUrl = (url) => url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

      if (product.attribute_value_images && product.attribute_value_images.length > 0) {
        strategy = "color";
        product.attribute_value_images.forEach(img => {
          if (!initialColorImages[img.attribute_value_id]) initialColorImages[img.attribute_value_id] = [];
          initialColorImages[img.attribute_value_id].push(getImageUrl(img.url));
        });
      } else {
        let hasVariantImages = false;
        product.product_variants.forEach((v, index) => {
          if (v.variant_images && v.variant_images.length > 0) {
            hasVariantImages = true;
            initialVariantImages[index] = v.variant_images.map(img => getImageUrl(img.url));
          }
        });
        if (hasVariantImages) strategy = "variant";
      }

      setAdvancedImageMode(strategy);
      setColorImages(initialColorImages);
      setVariantImages(initialVariantImages);

      // Load existing image into preview
      if (product.product_images && product.product_images.length > 0) {
        const mainImage = product.product_images.find(img => img.is_main) || product.product_images[0];
        setImagePreview(getImageUrl(mainImage.url));
      } else {
        setImagePreview(null);
      }
    } else {
      setImagePreview(null);
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

  const handleImageModeSwitch = (targetMode) => {
    if (advancedImageMode === targetMode) return;

    if (targetMode === "variant") {
      // Migrate Color to Variant
      const newVariantImages = { ...variantImages };
      let migrated = false;
      form.variants.forEach((v, idx) => {
        const colorId = v.attribute_value_ids?.[colorAttribute?.id];
        if (colorId && colorImages[colorId] && colorImages[colorId].length > 0) {
          newVariantImages[idx] = [...colorImages[colorId]];
          migrated = true;
        }
      });
      if (migrated) setVariantImages(newVariantImages);
      setAdvancedImageMode("variant");
    } else {
      // Migrate Variant to Color (Destructive)
      const hasVariantImages = Object.values(variantImages).some(arr => arr && arr.length > 0);
      if (hasVariantImages) {
        setShowStrategyWarning(true);
      } else {
        setAdvancedImageMode("color");
      }
    }
  };

  const confirmStrategySwitch = () => {
    setVariantImages({});
    setAdvancedImageMode("color");
    setShowStrategyWarning(false);
  };

  // ======================================================
  // SUBMIT
  // ======================================================
  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append(
      "name",
      form.name || ""
    );

    formData.append(
      "description",
      form.description || ""
    );

    formData.append(
      "base_price",
      form.base_price || ""
    );

    formData.append(
      "category_id",
      form.category_id || ""
    );

    formData.append(
      "owner_id",
      form.owner_id || ""
    );

    formData.append(
      "product_type_id",
      form.product_type_id || ""
    );

    // imagen
    if (productImage) {
        formData.append("product_images[]", productImage);
    }

      // variantes
      formData.append(
        "variants",
        JSON.stringify(
          form.variants.map((v) => ({
            ...v,
            attribute_value_ids:
              Object.values(
                v.attribute_value_ids || {}
              )
          }))
        )
      );

      // Color Images
      Object.entries(colorImages).forEach(([colorId, files]) => {
        files.forEach((file) => {
          if (typeof file !== "string") {
            formData.append(`color_images[${colorId}][]`, file);
          }
        });
      });

      // Variant Images
      Object.entries(variantImages).forEach(([variantIndex, files]) => {
        files.forEach((file) => {
          if (typeof file !== "string") {
            formData.append(`variant_images[${variantIndex}][]`, file);
          }
        });
      });

      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      onSubmit(formData);
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

    setProductImage(file);

    setImagePreview(
      URL.createObjectURL(file)
    );
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

  // ======================================================
  // VALIDATIONS
  // ======================================================
  const duplicateVariants = form.variants.filter((v1, i) => {
    return form.variants.findIndex(v2 => 
      v1.size_id === v2.size_id && 
      JSON.stringify(v1.attribute_value_ids) === JSON.stringify(v2.attribute_value_ids)
    ) !== i;
  });
  const hasDuplicates = duplicateVariants.length > 0;
  
  const hasMissingVariantData = form.variants.some(v => !v.price || Number(v.price) <= 0);

  const isFormValid = () => {
    if (variantMode === "simple" && form.variants.length === 0) return false;
    if (variantMode === "advanced" && (hasDuplicates || hasMissingVariantData || form.variants.length === 0)) return false;
    if (!form.name || !form.base_price || !form.category_id) return false;
    return true;
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
          {product ? "Editar Producto" : "Crear Producto"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* ====================================================== */}
          {/* GENERAL */}
          {/* ====================================================== */}

          <div className="product-layout">

            {/* IMAGEN */}
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
            {/* VARIANTS TABLE */}
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
                          variant.fit_id && {
                            id: "fit",
                            name: "Fit",
                            value:
                              fits.find(
                                f => f.id === variant.fit_id
                              )?.name || "N/A"
                          },

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
                                      <div style={{ width: 20, height: 20, borderRadius: 999, background: color?.hex_code || "#999", border: "2px solid rgba(255,255,255,.2)" }} 
                                      />

                                      <span style={{ fontWeight: 600 }}>
                                        {color?.value || "Sin color"}
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>

                                <span style={{ fontSize: 12, color: "rgba(255,255,255,.65)" }}>
                                  Talla:{" "}
                                  {sizes.find( s => s.id === variant.size_id )?.name || "-"}
                                </span>

                              </div>
                            </td>

                            <td className="variant-attributes-cell">
                              {attributesContent?.length ? attributesContent : "Sin atributos"}
                            </td>

                            <td>
                              {variant.price || "-"}
                            </td>

                            <td>
                              <span className={ variant.is_active ? "variant-status active" : "variant-status inactive" } >
                                { variant.is_active ? "Activo" : "Inactivo" }
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
                  {!product && (
                    <button type="button" className={ variantMode === "simple" ? "variant-tab active" : "variant-tab" } onClick={handleSwitchToSimple} >
                      Modo Simple
                    </button>
                  )}
                  <button type="button" className={ variantMode === "advanced" ? "variant-tab active" : "variant-tab" } onClick={() => setVariantMode("advanced") } style={product ? {width: "100%", borderRadius: "10px"} : {}}>
                    Modo Avanzado
                  </button>
                </div>
              </div>
            </div>

            {/* ====================================================== */}
            {/* SIMPLE MODE */}
            {/* ====================================================== */}
            {variantMode === "simple" ? (
              <div className="simple-mode-container">
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

                <div className="simple-grid">
                  {/* COLORES */}
                  <div className="simple-card">
                    <div className="selector-header">

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }} >
                        <h4>Colores</h4>
                      </div>
                      <span className="selected-counter">
                        {simpleConfig.colors.length} seleccionados
                      </span>
                    </div>

                    <div className="color-selector-grid">
                      {(colorAttribute?.attribute_values || [])
                        .slice(0, MAX_VISIBLE_COLORS)
                        .map((color) => {

                          const selected = simpleConfig.colors.includes(color.id);

                          return (
                            <button key={color.id} type="button" className={ selected ? "color-circle active" : "color-circle" } onClick={() => toggleSelection( "colors", color.id ) } >
                              <div className="color-circle-preview" style={{ background: color.hex_code || "#ccc" }}
                              />

                              <span>
                                {color.value}
                              </span>
                            </button>
                          );
                        })}
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "12px", alignItems: "center" }}>
                      {(colorAttribute?.attribute_values?.length || 0) >
                        MAX_VISIBLE_COLORS && (
                        <button type="button" className="see-more-btn" onClick={() => setShowColorsModal(true) } >
                          Ver todos los colores
                        </button>
                      )}
                      <button type="button" className="add-mini-btn" onClick={() => setShowCreateColor(true) } title="Crear nuevo color" >
                        <Plus size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* ====================================================== */}
                  {/* TALLAS */}
                  {/* ====================================================== */}

                  <div className="simple-card">
                    <div className="selector-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }} >
                        <h4>Tallas</h4>
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
                            <button key={size.id} type="button" className={ selected ? "size-chip active" : "size-chip" } onClick={() => toggleSelection( "sizes", size.id ) } >
                              {size.name}
                            </button>
                          );
                        })}
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "12px", alignItems: "center" }}>
                      {sizes.length > MAX_VISIBLE_SIZES && (
                        <button type="button" className="see-more-btn" onClick={() => setShowSizesModal(true) } >
                          Ver todas las tallas
                        </button>
                      )}
                      <button type="button" className="add-mini-btn" onClick={() => setShowCreateSize(true) } title="Crear nueva talla" >
                        <Plus size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ====================================================== */}
                {/* ATRIBUTOS GLOBALES */}
                {/* ====================================================== */}

                <div className="simple-card" style={{ marginTop: 20 }}>
                  <h4>Configuración Global</h4>
                  <div className="simple-attributes-grid">
                    <div className="simple-global-field">
                      <label>
                        Fit
                      </label>
                      <select value={ simpleConfig.globalAttributes.fit_id }
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalAttributes: {
                              ...simpleConfig.globalAttributes,
                              fit_id: e.target.value } }) }
                      >

                        <option value="">
                          Seleccionar
                        </option>

                        {fits.map((fit) => (

                          <option key={fit.id} value={fit.id} >
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

                      <select value={ simpleConfig.globalAttributes.material_id }
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalAttributes: {
                              ...simpleConfig.globalAttributes,
                              material_id: e.target.value } }) }
                      >
                        <option value="">
                          Seleccionar
                        </option>

                        {(materialAttribute?.attribute_values || []).map((value) => (
                          <option key={value.id} value={value.id} >
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

                      <select value={ simpleConfig.globalAttributes.style_id }
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalAttributes: {
                              ...simpleConfig.globalAttributes,
                              style_id: e.target.value } }) }
                      >

                        <option value="">
                          Seleccionar
                        </option>

                        {(styleAttribute?.attribute_values || []).map((value) => (
                          <option key={value.id} value={value.id} >
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

                      <select value={ simpleConfig.globalAttributes.season_id }
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalAttributes: {
                              ...simpleConfig.globalAttributes,
                              season_id: e.target.value } }) }
                      >
                        <option value="">
                          Seleccionar
                        </option>

                        {(seasonAttribute?.attribute_values || []).map((value) => (
                          <option key={value.id} value={value.id} >
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

                      <input className="simple-price-input" type="number" value={simpleConfig.globalPrice}
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalPrice: e.target.value }) }
                      />
                    </div>

                    {/* COSTO GLOBAL */}
                    <div className="simple-global-field">

                      <label>
                        Costo
                      </label>

                      <input className="simple-price-input" type="number" value={simpleConfig.globalCost}
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalCost: e.target.value }) }
                      />

                    </div> 

                    <div className="simple-global-field">
                      <label>
                        Peso
                      </label>

                      <input className="simple-price-input" type="number" step="0.01" value={simpleConfig.globalWeight}
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalWeight: e.target.value }) }
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
                {/* GALLERY (SIMPLE MODE) */}
                {/* ====================================================== */}
                {simpleConfig.colors.length > 0 && (
                  <div style={{ marginTop: 20, marginBottom: 20 }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 15, color: "rgba(255,255,255,0.9)" }}>
                      Gestión de Imágenes por Color
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {simpleConfig.colors.map(colorId => {
                        const colorAttr = colorAttribute?.attribute_values?.find(c => c.id === colorId);
                        const count = colorImages[colorId]?.length || 0;
                        return (
                          <button
                            key={colorId}
                            type="button"
                            className="btn-secondary"
                            onClick={() => setGalleryModalConfig({ open: true, type: "color", id: colorId })}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px" }}
                          >
                            <div style={{ width: 16, height: 16, borderRadius: "50%", background: colorAttr?.hex_code || "#ccc" }} />
                            {colorAttr?.value || "Color"} 
                            <span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                              {count} <Camera size={14} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ====================================================== */}
                {/* GENERATE */}
                {/* ====================================================== */}

                <button type="button" className="simple-generate-btn" onClick={generateSimpleVariants} >
                  Generar Variantes Automáticamente
                </button>
                {simpleModeError && (
                  <div className="error-text" style={{ color: "#ef4444", marginTop: "10px", fontSize: "0.9rem", textAlign: "center" }}>
                    {simpleModeError}
                  </div>
                )}

                {form.variants.length > 0 && (
                  <div className="generated-count">
                    {form.variants.length}
                    {" "}
                    variantes generadas
                  </div>
                )}
              </div>

            ) : (
            <>
              {/* ADVANCED MODE HEADERS (IMAGE MODE TOGGLE) */}
              <div style={{ marginBottom: "20px", background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: advancedImageMode === "color" ? "15px" : "0" }}>
                  <div style={{ fontWeight: 600 }}>Estrategia de Imágenes</div>
                  <div className="variant-tabs">
                    <button type="button" className={`variant-tab ${advancedImageMode === "color" ? "active" : ""}`} onClick={() => handleImageModeSwitch("color")}>
                      Por Color (Compartidas)
                    </button>
                    <button type="button" className={`variant-tab ${advancedImageMode === "variant" ? "active" : ""}`} onClick={() => handleImageModeSwitch("variant")}>
                      Por Variante (Únicas)
                    </button>
                  </div>
                </div>

                {advancedImageMode === "color" && (
                  <div>
                    <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", marginBottom: "10px" }}>
                      Imágenes compartidas por color entre todas las variantes
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {Array.from(new Set(form.variants.map(v => v.attribute_value_ids?.[colorAttribute?.id]).filter(Boolean))).map(colorId => {
                        const colorAttr = colorAttribute?.attribute_values?.find(c => c.id === colorId);
                        const count = colorImages[colorId]?.length || 0;
                        return (
                          <button
                            key={colorId}
                            type="button"
                            className="btn-secondary"
                            onClick={() => setGalleryModalConfig({ open: true, type: "color", id: colorId })}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px" }}
                          >
                            <div style={{ width: 16, height: 16, borderRadius: "50%", background: colorAttr?.hex_code || "#ccc" }} />
                            {colorAttr?.value || "Color"} 
                            <span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                              {count} <Camera size={14} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {form.variants.map((variant, index) => (
                
              <div key={index} className="variant-card">

                {/* ================= HEADER ================= */}
                <div className="variant-card-header">
                  <div>
                    <div className="variant-card-title">
                      Variante #{index + 1}
                    </div>

                    <div className="variant-card-subtitle">
                      Configuración individual de variante
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10
                    }}
                  >
                    {advancedImageMode === "variant" && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setGalleryModalConfig({ open: true, type: "variant", id: index })}
                        style={{ padding: "4px 8px", fontSize: "0.8rem", display: "flex", gap: "5px", alignItems: "center" }}
                      >
                        <Camera size={14} /> {variantImages[index]?.length || 0}
                      </button>
                    )}
                    <div className="variant-badge">
                      #{index + 1}
                    </div>

                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => removeVariant(index)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* ================= COLOR + TALLA ================= */}
                <div className="variant-section-title">
                  Variante principal
                </div>

                <div className="variant-main-grid">

                  {/* COLOR */}
                  {attributes.map((attribute) => {

                    const isColor =
                      attribute.id === colorAttribute?.id;

                    if (!isColor) return null;

                    return (
                      <div
                        key={attribute.id}
                        className="form-group"
                      >
                        <label>Color</label>

                        <div className="color-selector-grid">
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
                                      ? "color-circle active"
                                      : "color-circle"
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
                                    className="color-circle-preview"
                                    style={{
                                      background:
                                        value.hex_code || "#ccc"
                                    }}
                                  />

                                  <span>
                                    {value.value}
                                  </span>
                                </button>
                              );
                            })}
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginTop: "12px", alignItems: "center" }}>
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
                          <button type="button" className="add-mini-btn" onClick={() => setShowCreateColor(true) } title="Crear nuevo color" >
                            <Plus size={18} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* TALLA */}
                  <div className="form-group variant-size-group">
                    <label>Talla</label>

                    <div className="size-selector">
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

                    <div style={{ display: "flex", gap: "10px", marginTop: "12px", alignItems: "center" }}>
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
                      <button type="button" className="add-mini-btn" onClick={() => setShowCreateSize(true) } title="Crear nueva talla" >
                        <Plus size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                </div>

                {/* ================= CONFIGURACIÓN COMERCIAL ================= */}
                <div className="variant-section-title">
                  Configuración comercial
                </div>

                <div className="form-grid">

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
                    <label>Activo</label>

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
                    <label>Costo</label>

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

                </div>

                {/* ================= DETALLES ================= */}
                <div className="variant-section-title">
                  Detalles
                </div>

                <div className="form-grid">

                  {/* FIT */}
                  <div className="form-group">
                    <label>Fit</label>

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

                  {/* PESO */}
                  <div className="form-group">
                    <label>Peso</label>

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

                  {/* ATRIBUTOS EXTRAS */}
                  {attributes
                    .filter(
                      (attribute) =>
                        attribute.id !== colorAttribute?.id
                    )
                    .map((attribute) => (
                      <div key={attribute.id} className="form-group variant-color-group" >
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
                    ))}
                </div>

                {/* ================= SOLO LECTURA ================= */}
                <div className="variant-section-title">
                  Información generada
                </div>

                <div className="form-grid">

                  <div className="form-group">
                    <label>SKU</label>
                    <input
                      value={variant.sku}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label>Barcode</label>
                    <input
                      value={variant.barcode}
                      readOnly
                    />
                  </div>

                </div>

              </div>
              ))}
              <button type="button" className="add-variant-card" onClick={addVariant} >
                <div className="add-variant-icon">
                  +
                </div>

                <div className="add-variant-content">
                  <div className="add-variant-title">
                    Agregar Variante
                  </div>

                  <div className="add-variant-subtitle">
                    Crear una nueva configuración
                  </div>
                </div>
              </button>
            </>
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

                <div className="color-selector-grid modal-grid">
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
                              ? "color-circle active"
                              : "color-circle"
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
          ======================================= */}
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
          =========================================== */}
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

          <div className="form-actions" style={{ flexWrap: "wrap" }}>
            {variantMode === "advanced" && hasDuplicates && (
              <div style={{ width: "100%", color: "#ef4444", marginBottom: "10px", fontSize: "0.9rem", textAlign: "right" }}>
                Existen variantes duplicadas con el mismo color y talla. Por favor, corrígelas.
              </div>
            )}
            {variantMode === "simple" && form.variants.length === 0 && (
              <div style={{ width: "100%", color: "#ef4444", marginBottom: "10px", fontSize: "0.9rem", textAlign: "right" }}>
                Debes generar las variantes antes de guardar.
              </div>
            )}
            
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
              disabled={!isFormValid()}
              style={{ opacity: isFormValid() ? 1 : 0.5, cursor: isFormValid() ? "pointer" : "not-allowed" }}
            >
              {product
                ? "Actualizar Producto"
                : "Crear Producto"}
            </button>
          </div>

        </form>
      </div>

      {/* ====================================================== */}
      {/* WARNING MODAL: SWITCH TO SIMPLE MODE */}
      {/* ====================================================== */}
      {showSwitchWarning && (
        <div className="selector-modal-overlay" style={{ zIndex: 10000 }}>
          <div className="warning-modal">
            <div className="warning-modal-header">
              <div className="warning-icon-wrapper warning-yellow">
                <AlertTriangle size={24} />
              </div>
              <h3>Advertencia</h3>
            </div>
            <div className="warning-modal-body">
              Al cambiar al Modo Simple y regenerar las variantes, perderás los precios y cantidades que hayas configurado manualmente.
              <br /><br />
              ¿Deseas continuar?
            </div>
            <div className="warning-modal-footer">
              <button type="button" className="warning-btn-cancel" onClick={() => setShowSwitchWarning(false)}>
                Cancelar
              </button>
              <button type="button" className="warning-btn-confirm btn-yellow" onClick={confirmSwitchToSimple}>
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* WARNING MODAL: IMAGE STRATEGY SWITCH */}
      {/* ====================================================== */}
      {showStrategyWarning && (
        <div className="selector-modal-overlay" style={{ zIndex: 10000 }}>
          <div className="warning-modal">
            <div className="warning-modal-header">
              <div className="warning-icon-wrapper">
                <AlertTriangle size={24} />
              </div>
              <h3>Pérdida de Datos</h3>
            </div>
            <div className="warning-modal-body">
              ¿Estás seguro? Al pasar a la estrategia <strong>'Por Color'</strong> perderás todas las configuraciones individuales de imagen de cada variante actual.
            </div>
            <div className="warning-modal-footer">
              <button type="button" className="warning-btn-cancel" onClick={() => setShowStrategyWarning(false)}>
                Cancelar
              </button>
              <button type="button" className="warning-btn-confirm" onClick={confirmStrategySwitch}>
                Sí, cambiar a Por Color
              </button>
            </div>
          </div>
        </div>
      )}

      <ImageGalleryModal
        isOpen={galleryModalConfig.open}
        onClose={() => setGalleryModalConfig({ ...galleryModalConfig, open: false })}
        title={galleryModalConfig.type === "color" 
          ? `Imágenes del Color: ${colorAttribute?.attribute_values?.find(c => c.id === galleryModalConfig.id)?.value || ""}`
          : `Imágenes de la Variante #${galleryModalConfig.id + 1}`
        }
        images={galleryModalConfig.type === "color" 
          ? (colorImages[galleryModalConfig.id] || []) 
          : (variantImages[galleryModalConfig.id] || [])
        }
        onImagesChange={(newImages) => {
          if (galleryModalConfig.type === "color") {
            setColorImages({ ...colorImages, [galleryModalConfig.id]: newImages });
          } else {
            setVariantImages({ ...variantImages, [galleryModalConfig.id]: newImages });
          }
        }}
      />
    </div>
  );
}