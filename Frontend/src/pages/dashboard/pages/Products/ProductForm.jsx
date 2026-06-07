import { API_BASE_URL } from "../../../../config/api";
import { useEffect, useState, useRef } from "react";
import { getAttributes } from "../../../../api/attributes";
import { createAttributeValue } from "../../../../api/attributeValues";
import { createSize } from "../../../../api/sizes";
import namer from "color-namer";
import { Plus, Camera, AlertTriangle, ChevronDown, Eye, EyeOff } from "lucide-react";
import ImageGalleryModal from "./ImageGalleryModal";
import { X } from "lucide-react";
import { useAuthStore } from "../../../../store/authStore";

function CustomDropdown({ buttonText, options, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>
      <button 
        type="button" 
        className="custom-dropdown-trigger" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus size={16} />
        {buttonText}
        <ChevronDown size={14} className={`dropdown-arrow ${isOpen ? "open" : ""}`} />
      </button>

      {isOpen && (
        <div className="custom-dropdown-menu">
          {options.map((group, gIndex) => {
            if (!group.items || group.items.length === 0) return null;
            return (
              <div key={gIndex} className="custom-dropdown-group">
                {group.label && <div className="custom-dropdown-label">{group.label}</div>}
                {group.items.map((item, iIndex) => (
                  <button
                    key={iIndex}
                    type="button"
                    className="custom-dropdown-item"
                    onClick={() => {
                      onSelect(item.value);
                      setIsOpen(false);
                    }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

  const user = useAuthStore((state) => state.user);
  const canViewCosts = user?.permissions?.includes("view_product_costs") || user?.roles?.includes("Owner");
  const canManagePricing = user?.permissions?.includes("manage_product_pricing") || user?.roles?.includes("Owner");

  useEffect(() => {
    setAttributes(initialAttributes);
  }, [initialAttributes]);

  useEffect(() => {
    setSizes(initialSizes);
  }, [initialSizes]);

  const normalizeAttr = (name) => name?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const colorAttribute = attributes.find(a => a.is_fixed) || attributes.find(
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
    axes: [
      { id: colorAttribute?.id || "", type: "attribute", values: [] },
      { id: "sizes", type: "size", values: [] }
    ],

    globalPrice: "",
    globalCost: "",
    globalWeight: "",

    sharedAttributes: []
  });

  const [simpleModeError, setSimpleModeError] = useState("");
  const [showSKU, setShowSKU] = useState(false);

  const handleAddAxis = () => {
    setSimpleConfig({
      ...simpleConfig,
      axes: [...simpleConfig.axes, { id: "", type: "", values: [] }]
    });
  };

  const handleRemoveAxis = (index) => {
    const newAxes = [...simpleConfig.axes];
    newAxes.splice(index, 1);
    setSimpleConfig({ ...simpleConfig, axes: newAxes });
  };

  const handleAxisSelect = (index, newId, newType) => {
    const newAxes = [...simpleConfig.axes];
    newAxes[index] = { ...newAxes[index], id: newId, type: newType, values: [] };
    setSimpleConfig({ ...simpleConfig, axes: newAxes });
  };

  const toggleSelection = (axisIndex, valueId) => {
    const axis = simpleConfig.axes[axisIndex];
    const newValues = axis.values.includes(valueId)
      ? axis.values.filter(id => id !== valueId)
      : [...axis.values, valueId];
      
    const newAxes = [...simpleConfig.axes];
    newAxes[axisIndex] = { ...axis, values: newValues };
    setSimpleConfig({ ...simpleConfig, axes: newAxes });
  };

  const generateSimpleVariants = () => {
    // Validate axes
    const validAxes = simpleConfig.axes.filter(a => a.id && a.values.length > 0);
    if (validAxes.length === 0) {
      setSimpleModeError("Debes configurar al menos un eje con valores para generar variantes.");
      return;
    }
    
    // Check if any defined axis is empty
    const emptyDefinedAxis = simpleConfig.axes.find(a => a.id && a.values.length === 0);
    if (emptyDefinedAxis) {
      setSimpleModeError("Hay ejes configurados que no tienen ningún valor seleccionado.");
      return;
    }

    setSimpleModeError("");

    const generateCombinations = (axes, currentCombination, result) => {
      if (axes.length === 0) {
        result.push({ ...currentCombination });
        return;
      }

      const currentAxis = axes[0];
      const remainingAxes = axes.slice(1);

      currentAxis.values.forEach(valueId => {
        const nextCombination = { ...currentCombination };
        if (currentAxis.type === "size") {
          nextCombination.size_id = valueId;
        } else if (currentAxis.type === "fit") {
          nextCombination.fit_id = valueId;
        } else if (currentAxis.type === "attribute") {
          nextCombination.attribute_value_ids = { ...(currentCombination.attribute_value_ids || {}) };
          nextCombination.attribute_value_ids[currentAxis.id] = valueId;
        }
        generateCombinations(remainingAxes, nextCombination, result);
      });
    };

    const combinations = [];
    generateCombinations(validAxes, {}, combinations);

    const variants = combinations.map((combo, idx) => {
      const attributeMap = { ...(combo.attribute_value_ids || {}) };
  
        // Add shared attributes if not overridden by axes
        simpleConfig.sharedAttributes.forEach(sa => {
          if (sa.id && sa.valueId && !attributeMap[sa.id]) {
            attributeMap[sa.id] = sa.valueId;
          }
        });

      return {
        sku: generateSKU(
          form.name,
          combo.size_id || "",
          combo.fit_id || "",
          attributeMap,
          idx
        ),
        barcode: generateBarcode(),
        price: simpleConfig.globalPrice || form.base_price || "",
        cost: simpleConfig.globalCost || "",
        weight: simpleConfig.globalWeight || "",
        size_id: combo.size_id || null,
        fit_id: combo.fit_id || "",
        is_active: true,
        attribute_value_ids: attributeMap
      };
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
    short_description: "",
    long_description: "",
    base_price: "",
    cost_price: "",
    brand: "",
    sku: "",
    category_id: "",
    product_type_id: "",
    owner_id: "",
    variants: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);


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
      .slice(0, 3) || "XXX";

    const parts = [cleanProduct];

    const attrValues = Object.values(attributeIds || {}).filter(Boolean);
    const attrStrings = attrValues.map(valId => {
      const val = attributes?.flatMap(a => a.attribute_values)?.find(v => v?.id === valId)?.value;
      return val?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    }).filter(Boolean);

    parts.push(...attrStrings);

    if (sizeId) {
      const sizeStr = sizes.find(s => s.id === sizeId)?.name?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
      if (sizeStr) parts.push(sizeStr);
    }

    if (fitId) {
      const fitStr = fits.find(f => f.id === fitId)?.name?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 2);
      if (fitStr) parts.push(fitStr);
    }

    parts.push(index + 1);

    return parts.join("-");
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
    const initialAttrVals = {};
    attributes.filter(a => a.is_fixed).forEach(a => {
      initialAttrVals[a.id] = null;
    });

    setForm({
      ...form,
      variants: [
        ...form.variants,
        {
          sku: generateSKU(form.name, "", "", {}, index),
          barcode: generateBarcode(),
          price: "",
          cost: "",
          weight: "",
          size_id: undefined,
          attribute_value_ids: initialAttrVals,
          is_active: true
        }
      ]
    });
  };

  const removeAttributeFromVariant = (variantIndex, type, id) => {
    const newVariants = [...form.variants];
    if (type === 'size') {
      newVariants[variantIndex].size_id = undefined;
    } else if (type === 'fit') {
      newVariants[variantIndex].fit_id = undefined;
    } else {
      if (!newVariants[variantIndex].attribute_value_ids) newVariants[variantIndex].attribute_value_ids = {};
      delete newVariants[variantIndex].attribute_value_ids[id];
    }
    setForm({ ...form, variants: newVariants });
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
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
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
          } else {
            formData.append(`kept_color_images[${colorId}][]`, file);
          }
        });
      });

      // Variant Images
      Object.entries(variantImages).forEach(([variantIndex, files]) => {
        files.forEach((file) => {
          if (typeof file !== "string") {
            formData.append(`variant_images[${variantIndex}][]`, file);
          } else {
            formData.append(`kept_variant_images[${variantIndex}][]`, file);
          }
        });
      });

      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    if (!attributes.length) return;
    if (colorAttribute?.id) {
      setSimpleConfig((prev) => {
        if (prev.axes.some(a => String(a.id) === String(colorAttribute.id))) return prev;
        const emptyIndex = prev.axes.findIndex(a => a.type === "attribute" && !a.id);
        if (emptyIndex !== -1) {
          const newAxes = [...prev.axes];
          newAxes[emptyIndex] = { ...newAxes[emptyIndex], id: colorAttribute.id };
          return { ...prev, axes: newAxes };
        }
        return prev;
      });
    }
  }, [attributes, colorAttribute]);


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

  const [activeAxisModal, setActiveAxisModal] = useState(null);

  const [advancedDynamicModal, setAdvancedDynamicModal] = useState({ open: false, variantIndex: null, axisIndex: null });
    
  const MAX_VISIBLE_COLORS = 4;
  const MAX_VISIBLE_SIZES = 6;



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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>
            {product ? "Editar Producto" : "Crear Producto"}
          </h2>
          <button className="close-btn" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

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

                {/* TODO TU FORM ACTUAL AQUÃ */}
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
                  <input type="number" name="base_price" value={form.base_price} onChange={handleChange} disabled={!canManagePricing} />
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
                {(() => {
                  let tableColumns = [];
                  const firstVariant = form.variants[0];
                  Object.keys(firstVariant.attribute_value_ids || {}).forEach(attrId => {
                    const attr = attributes.find(a => String(a.id) === String(attrId));
                    tableColumns.push({ type: 'attribute', id: attrId, name: attr?.name || "Atributo", isFixed: attr?.is_fixed });
                  });
                  if (firstVariant.size_id !== undefined && firstVariant.size_id !== null) {
                    tableColumns.push({ type: 'size', id: 'sizes', name: "Talla", isFixed: false });
                  }
                  if (firstVariant.fit_id !== undefined && firstVariant.fit_id !== null && firstVariant.fit_id !== "") {
                    tableColumns.push({ type: 'fit', id: 'fits', name: "Fit", isFixed: false });
                  }
                  tableColumns.sort((a, b) => {
                    if (a.isFixed && !b.isFixed) return -1;
                    if (!a.isFixed && b.isFixed) return 1;
                    return 0;
                  });

                  return (
                    <>
                      <div className="variants-preview-header">
                        <div>
                          <div className="variants-preview-title">
                            Variantes Generadas
                          </div>
                          <div className="variants-preview-description">
                            Vista rápida en tiempo real de las variantes configuradas
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <button 
                            type="button" 
                            onClick={() => setShowSKU(!showSKU)}
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: '6px', 
                              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                              color: showSKU ? '#fff' : 'var(--text-muted)', 
                              padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {showSKU ? <Eye size={14} /> : <EyeOff size={14} />}
                            {showSKU ? "Ocultar SKU" : "Mostrar SKU"}
                          </button>
                          <div className="variants-preview-count">
                            {form.variants.length}
                          </div>
                        </div>
                      </div>

                      <div className="variants-preview-table-wrapper">
                        <table className="variants-preview-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>SKU</th>
                              {tableColumns.map((col, idx) => (
                                <th key={idx}>{col.name}</th>
                              ))}
                              <th>Precio</th>
                              <th>Status</th>
                            </tr>
                          </thead>

                          <tbody>
                            {form.variants.map((variant, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                  {showSKU ? (
                                    <span style={{ wordBreak: 'break-all' }}>{variant.sku || "-"}</span>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                      <EyeOff size={16} opacity={0.5} />
                                    </div>
                                  )}
                                </td>

                                {tableColumns.map((col, cIdx) => {
                                  let valName = "-";
                                  let hexCode = null;
                                  if (col.type === 'size') {
                                    valName = sizes.find(s => String(s.id) === String(variant.size_id))?.name || "-";
                                  } else if (col.type === 'fit') {
                                    valName = fits.find(f => String(f.id) === String(variant.fit_id))?.name || "-";
                                  } else if (col.type === 'attribute') {
                                    const valId = variant.attribute_value_ids?.[col.id];
                                    const attr = attributes.find(a => String(a.id) === String(col.id));
                                    const valObj = attr?.attribute_values?.find(v => String(v.id) === String(valId));
                                    valName = valObj?.value || valObj?.name || "-";
                                    hexCode = valObj?.hex_code;
                                  }

                                  return (
                                    <td key={cIdx}>
                                      {hexCode ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <div style={{ width: 14, height: 14, borderRadius: "50%", background: hexCode, border: "1px solid rgba(255,255,255,0.2)" }} />
                                          <span style={{ whiteSpace: "nowrap" }}>{valName}</span>
                                        </div>
                                      ) : (
                                        <span style={{ whiteSpace: "nowrap" }}>{valName}</span>
                                      )}
                                    </td>
                                  );
                                })}

                                <td>{variant.price || "-"}</td>
                                <td>
                                  <span className={ variant.is_active ? "variant-status active" : "variant-status inactive" } >
                                    { variant.is_active ? "Activo" : "Inactivo" }
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
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


                {/* ====================================================== */}

<div className="simple-grid">
                  {simpleConfig.axes.map((axis, axisIndex) => {
                    const currentId = axis.id;
                    const currentType = axis.type;
                    const currentValues = axis.values;

                    let optionsToRender = [];
                    let isColorGrid = false;
                    let isFixedAxis = false;
                    
                    if (currentType === "size") {
                      optionsToRender = sizes;
                    } else if (currentType === "fit") {
                      optionsToRender = fits;
                    } else if (currentType === "attribute") {
                      const attr = attributes.find(a => a.id === currentId);
                      optionsToRender = attr?.attribute_values || [];
                      isColorGrid = optionsToRender.some(v => v.hex_code);
                      isFixedAxis = attr?.is_fixed;
                    }

                    if (!currentId) return null;

                    return (
                      <div key={axisIndex} className="simple-card">
                        <div className="selector-header" style={{flexDirection: 'column', alignItems: 'flex-start', gap: 10, marginBottom: 15}}>
                          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
                              <h4 style={{fontSize: 15, fontWeight: 600, margin: 0}}>Eje {axisIndex + 1}</h4>
                              <span style={{fontSize: 13, color: 'var(--text-muted)'}}>
                                {currentType === 'size' ? 'Tallas' : currentType === 'fit' ? 'Fit' : attributes.find(a => a.id === currentId)?.name}
                              </span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                              <span className="selected-counter">
                                {currentValues.length} seleccionados
                              </span>
                              {!isFixedAxis && (
                                <button type="button" onClick={() => handleRemoveAxis(axisIndex)} style={{background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: 0}} title="Eliminar Eje"><X size={16} /></button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={isColorGrid ? "color-selector-grid" : "size-selector"}>
                          {optionsToRender
                            .slice(0, isColorGrid ? MAX_VISIBLE_COLORS : MAX_VISIBLE_SIZES)
                            .map((opt) => {
                              const selected = currentValues.includes(opt.id);

                              if (isColorGrid) {
                                return (
                                  <button key={opt.id} type="button" className={ selected ? "color-circle active" : "color-circle" } onClick={() => toggleSelection(axisIndex, opt.id) } >
                                    <div className="color-circle-preview" style={{ background: opt.hex_code || "#ccc" }} />
                                    <span>{opt.value || opt.name}</span>
                                  </button>
                                );
                              }

                              return (
                                <button key={opt.id} type="button" className={ selected ? "size-chip active" : "size-chip" } onClick={() => toggleSelection(axisIndex, opt.id) } >
                                  {opt.value || opt.name}
                                </button>
                              );
                            })}
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginTop: "12px", alignItems: "center" }}>
                          {optionsToRender.length > (isColorGrid ? MAX_VISIBLE_COLORS : MAX_VISIBLE_SIZES) && (
                            <button type="button" className="see-more-btn" onClick={() => {
                              setActiveAxisModal(axisIndex);
                            }}>
                              Ver todos
                            </button>
                          )}
                          
                          {currentType === "size" && (
                            <button type="button" className="add-mini-btn" onClick={() => setShowCreateSize(true)} title="Crear nueva talla">
                              <Plus size={18} strokeWidth={2.5} />
                            </button>
                          )}
                          {currentType === "attribute" && isColorGrid && (
                            <button type="button" className="add-mini-btn" onClick={() => setShowCreateColor(true)} title="Crear nuevo color">
                              <Plus size={18} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* BOTÓN PARA AGREGAR EJE */}
                    <div style={{display: 'flex', justifyContent: 'center', marginTop: 10, gridColumn: '1 / -1'}}>
                      <CustomDropdown
                        buttonText="Agregar Eje"
                        options={[
                          {
                            label: "Sistema",
                            items: [
                              ...(!simpleConfig.axes.some(axis => axis.type === 'size') ? [{ name: "Tallas", value: "size|sizes" }] : []),
                              ...(!simpleConfig.axes.some(axis => axis.type === 'fit') ? [{ name: "Fit", value: "fit|fits" }] : [])
                            ]
                          },
                          {
                            label: "Atributos",
                            items: attributes
                              .filter(a => 
                                !simpleConfig.axes.some(axis => axis.type === 'attribute' && String(axis.id) === String(a.id)) &&
                                !simpleConfig.sharedAttributes.some(shared => String(shared.id) === String(a.id))
                              )
                              .map(a => ({ name: a.name, value: `attribute|${a.id}` }))
                          }
                        ]}
                        onSelect={(value) => {
                          const [t, idStr] = value.split('|');
                          const id = isNaN(Number(idStr)) || idStr === 'sizes' || idStr === 'fits' ? idStr : Number(idStr);
                          setSimpleConfig({
                            ...simpleConfig,
                            axes: [...simpleConfig.axes.filter(a => a.id), { type: t, id: id, values: [] }]
                          });
                        }}
                      />
                    </div>
                </div>

                {/* ====================================================== */}
                {/* VALORES GLOBALES (PRECIO, COSTO, PESO) */}
                {/* ====================================================== */}

                <div className="simple-card" style={{ marginTop: 20 }}>
                  <h4>Valores por Defecto y Compartidos</h4>
                  <div className="simple-attributes-grid">
                    {/* PRECIO GLOBAL */}
                    <div className="simple-global-field">
                      <label>
                        Precio Venta
                      </label>

                      <input className="simple-price-input" type="number" value={simpleConfig.globalPrice}
                        disabled={!canManagePricing}
                        onChange={(e) =>
                          setSimpleConfig({
                            ...simpleConfig,
                            globalPrice: e.target.value }) }
                      />
                    </div>

                    {/* COSTO GLOBAL */}
                    {canViewCosts && (
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
                    )}

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

                  {/* ====================================================== */}
                  {/* ATRIBUTOS COMPARTIDOS */}
                  {/* ====================================================== */}
                  <div style={{ marginTop: 25, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20 }}>
                    <div style={{ marginBottom: 15 }}>
                      <h4 style={{ margin: 0 }}>Atributos Compartidos</h4>
                      <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                        Estos atributos se aplicarán a todas las variantes (Selección Única).
                      </p>
                    </div>
                  
                  {simpleConfig.sharedAttributes.map((sa, idx) => {
                    const attr = attributes.find(a => String(a.id) === String(sa.id));
                    return (
                      <div key={idx} style={{ display: 'flex', gap: 15, marginBottom: 15, alignItems: 'center' }}>
                        <div style={{ width: '150px' }}>
                          <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{attr?.name || "Atributo"}</span>
                        </div>
                        <select
                          className="form-control"
                          style={{ flex: 1, padding: "10px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "white" }}
                          value={sa.valueId || ""}
                          onChange={(e) => {
                            const newShared = [...simpleConfig.sharedAttributes];
                            newShared[idx] = { ...newShared[idx], valueId: e.target.value };
                            setSimpleConfig({ ...simpleConfig, sharedAttributes: newShared });
                          }}
                        >
                          <option value="">-- Seleccionar --</option>
                          {attr?.attribute_values?.map(val => (
                            <option key={val.id} value={val.id}>{val.value || val.name}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => {
                          const newShared = [...simpleConfig.sharedAttributes];
                          newShared.splice(idx, 1);
                          setSimpleConfig({ ...simpleConfig, sharedAttributes: newShared });
                        }} style={{background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer'}}>
                          <X size={20} />
                        </button>
                      </div>
                    );
                  })}

                  <div style={{ marginTop: 10 }}>
                    <CustomDropdown
                      buttonText="Agregar Atributo"
                      options={[
                        {
                          label: "Atributos Disponibles",
                          items: attributes
                            .filter(a => 
                              !simpleConfig.axes.some(axis => axis.type === 'attribute' && String(axis.id) === String(a.id)) &&
                              !simpleConfig.sharedAttributes.some(shared => String(shared.id) === String(a.id))
                            )
                            .map(a => ({ name: a.name, value: `attribute|${a.id}` }))
                        }
                      ]}
                      onSelect={(value) => {
                        const [t, idStr] = value.split('|');
                        const id = isNaN(Number(idStr)) ? idStr : Number(idStr);
                        setSimpleConfig({
                          ...simpleConfig,
                          sharedAttributes: [...simpleConfig.sharedAttributes, { id: id, valueId: "" }]
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

                {/* ====================================================== */}
                {/* SUMMARY */}
                {/* ====================================================== */}
                <div className="simple-summary">
                  <h4>Resumen</h4>

                  <div className="simple-summary-grid">
                    {simpleConfig.axes.filter(a => a.id).map((axis, idx) => {
                      let axisName = "Desconocido";
                      if (axis.type === "size") axisName = "Tallas";
                      else if (axis.type === "fit") axisName = "Fit";
                      else if (axis.type === "attribute") {
                        const attr = attributes.find(a => a.id === axis.id);
                        if (attr) axisName = attr.name;
                      }

                      let valueNames = "Ninguno";
                      if (axis.values.length > 0) {
                        if (axis.type === "size") {
                          valueNames = axis.values.map(vId => sizes.find(s => s.id === vId)?.name).filter(Boolean).join(", ");
                        } else if (axis.type === "fit") {
                          valueNames = axis.values.map(vId => fits.find(f => f.id === vId)?.name).filter(Boolean).join(", ");
                        } else if (axis.type === "attribute") {
                          valueNames = axis.values.map(getAttributeValueName).filter(Boolean).join(", ");
                        }
                      }

                      return (
                        <div key={idx} className="simple-summary-item">
                          <div className="simple-summary-label">{axisName}</div>
                          <div className="simple-summary-value">{valueNames}</div>
                        </div>
                      );
                    })}

                    {simpleConfig.sharedAttributes.filter(sa => sa.id && sa.valueId).map((sa, idx) => {
                      const attr = attributes.find(a => String(a.id) === String(sa.id));
                      const val = attr?.attribute_values?.find(v => String(v.id) === String(sa.valueId));
                      return (
                        <div key={`sa-${idx}`} className="simple-summary-item" style={{ borderLeft: '3px solid #6366f1', paddingLeft: '10px' }}>
                          <div className="simple-summary-label">{attr?.name} <span style={{fontSize: 10, color: '#6366f1'}}>(Compartido)</span></div>
                          <div className="simple-summary-value">{val?.value || val?.name || ""}</div>
                        </div>
                      );
                    })}

                    <div className="simple-summary-item">
                      <div className="simple-summary-label">Variantes a generar</div>
                      <div className="simple-summary-value">
                        {(() => {
                          const validAxes = simpleConfig.axes.filter(a => a.id && a.values.length > 0);
                          if (validAxes.length === 0) return 0;
                          return validAxes.reduce((acc, axis) => acc * axis.values.length, 1);
                        })()}
                      </div>
                    </div>
                  </div>
                </div>


                {/* GALLERY (SIMPLE MODE) */}
                {/* ====================================================== */}
                {(() => {
                  if (!colorAttribute) return null;
                  const colorAxis = simpleConfig.axes.find(a => a.type === "attribute" && String(a.id) === String(colorAttribute.id));
                  const colorValues = colorAxis ? colorAxis.values : [];
                  
                  if (colorValues.length === 0) return null;

                  return (
                    <div style={{ marginTop: 20, marginBottom: 20 }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 15, color: "rgba(255,255,255,0.9)" }}>
                        Gestión de Imágenes por Color
                      </div>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {colorValues.map(colorId => {
                          const colorAttr = colorAttribute?.attribute_values?.find(c => String(c.id) === String(colorId));
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
                  );
                })()}

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
                        const colorAttr = colorAttribute?.attribute_values?.find(c => String(c.id) === String(colorId));
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
                  Atributos de la Variante
                </div>

                <div className="variant-main-grid">
                  {(() => {
                    const variantAxes = [];
                    Object.keys(variant.attribute_value_ids || {}).forEach(attrId => {
                      const isFixed = attributes.find(a => String(a.id) === String(attrId))?.is_fixed;
                      variantAxes.push({ type: 'attribute', id: attrId, isFixed });
                    });
                    if (variant.size_id !== undefined) {
                      variantAxes.push({ type: 'size', id: 'sizes', isFixed: false });
                    }
                    if (variant.fit_id !== undefined) {
                      variantAxes.push({ type: 'fit', id: 'fits', isFixed: false });
                    }
                    const getOrder = (axis) => {
                      if (axis.isFixed) return 1;
                      if (axis.type === 'size') return 2;
                      if (axis.type === 'fit') return 3;
                      return 4;
                    };
                    
                    variantAxes.sort((a, b) => {
                      return getOrder(a) - getOrder(b);
                    });

                    return (
                      <>
                      {variantAxes.map((axis, axisIndex) => {
                        const currentId = axis.id;
                        const currentType = axis.type;
                        
                        let optionsToRender = [];
                        let isColorGrid = false;
                        let label = "";
                        let isFixedAxis = false;

                        if (currentType === "size") {
                          optionsToRender = sizes;
                          label = "Talla";
                        } else if (currentType === "fit") {
                          optionsToRender = fits;
                          label = "Fit";
                        } else if (currentType === "attribute") {
                          const attr = attributes.find(a => String(a.id) === String(currentId));
                          optionsToRender = attr?.attribute_values || [];
                          isColorGrid = optionsToRender.some(v => v.hex_code);
                          label = attr?.name || "Atributo";
                          isFixedAxis = attr?.is_fixed;
                        }

                        return (
                          <div key={`${currentId}-${axisIndex}`} className="form-group">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <label style={{ margin: 0 }}>{label}</label>
                              {!isFixedAxis && (
                                <button type="button" onClick={() => removeAttributeFromVariant(index, currentType, currentId)} style={{background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: 0, fontSize: "0.85rem"}} title="Remover atributo">Remover</button>
                              )}
                            </div>

                            <div className={isColorGrid ? "color-selector-grid" : "size-selector"}>
                              {optionsToRender.slice(0, isColorGrid ? MAX_VISIBLE_COLORS : MAX_VISIBLE_SIZES).map((opt) => {
                                let selected = false;
                                if (currentType === "size") {
                                  selected = form.variants[index]?.size_id === opt.id;
                                } else if (currentType === "fit") {
                                  selected = form.variants[index]?.fit_id === opt.id;
                                } else {
                                  selected = form.variants[index]?.attribute_value_ids?.[currentId] === opt.id;
                                }

                                if (isColorGrid) {
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      className={selected ? "color-circle active" : "color-circle"}
                                      onClick={(e) => { e.preventDefault(); handleAttributeChange(index, currentId, opt.id); }}
                                    >
                                      <div className="color-circle-preview" style={{ background: opt.hex_code || "#ccc" }} />
                                      <span>{opt.value || opt.name}</span>
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={selected ? "size-chip active" : "size-chip"}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (currentType === "size") {
                                        handleVariantChange(index, "size_id", opt.id);
                                      } else if (currentType === "fit") {
                                        handleVariantChange(index, "fit_id", opt.id);
                                      } else {
                                        handleAttributeChange(index, currentId, opt.id);
                                      }
                                    }}
                                  >
                                    {opt.value || opt.name}
                                  </button>
                                );
                              })}
                            </div>

                            <div style={{ display: "flex", gap: "10px", marginTop: "12px", alignItems: "center" }}>
                              {optionsToRender.length > (isColorGrid ? MAX_VISIBLE_COLORS : MAX_VISIBLE_SIZES) && (
                                <button
                                  type="button"
                                  className="see-more-btn"
                                  onClick={(e) => { e.preventDefault(); setAdvancedDynamicModal({ open: true, variantIndex: index, axisIndex: currentId, axisType: currentType }); }}
                                >
                                  Ver todas las opciones
                                </button>
                              )}
                              
                              {currentType === "size" && (
                                <button type="button" className="add-mini-btn" onClick={(e) => { e.preventDefault(); setShowCreateSize(true); }} title="Crear nueva talla">
                                  <Plus size={18} strokeWidth={2.5} />
                                </button>
                              )}
                              {currentType === "attribute" && isColorGrid && (
                                <button type="button" className="add-mini-btn" onClick={(e) => { e.preventDefault(); setShowCreateColor(true); }} title="Crear nuevo color">
                                  <Plus size={18} strokeWidth={2.5} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      <div className="form-group" style={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-start", marginTop: "10px" }}>
                        <CustomDropdown
                          buttonText="Agregar Atributo"
                          options={[
                            {
                              label: "Sistema",
                              items: [
                                ...(variant.size_id === undefined ? [{ name: "Talla", value: "size|sizes" }] : []),
                                ...(variant.fit_id === undefined ? [{ name: "Fit", value: "fit|fits" }] : [])
                              ]
                            },
                            {
                              label: "Atributos",
                              items: attributes
                                .filter(a => !(variant.attribute_value_ids || {}).hasOwnProperty(a.id))
                                .map(a => ({ name: a.name, value: `attribute|${a.id}` }))
                            }
                          ]}
                          onSelect={(value) => {
                            const [t, idStr] = value.split('|');
                            const id = isNaN(Number(idStr)) ? idStr : Number(idStr);
                            if (t === 'size') {
                              handleVariantChange(index, "size_id", null);
                            } else if (t === 'fit') {
                              handleVariantChange(index, "fit_id", null);
                            } else if (t === 'attribute') {
                              handleAttributeChange(index, id, null);
                            }
                          }}
                        />
                      </div>
                      </>
                    );
                  })()}
                </div>

                {/* ================= DATOS DE VARIANTE ================= */}
                <div className="variant-section-title">
                  Valores de Variante
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Precio Venta</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={variant.price || ""}
                      onChange={(e) => handleVariantChange(index, "price", e.target.value)}
                      disabled={!canManagePricing}
                    />
                  </div>

                  {canViewCosts && (
                    <div className="form-group">
                      <label>Costo</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={variant.cost || ""}
                        onChange={(e) => handleVariantChange(index, "cost", e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Peso</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={variant.weight || ""}
                      onChange={(e) => handleVariantChange(index, "weight", e.target.value)}
                    />
                  </div>
                </div>

                <div className="variant-section-title">
                  Información generada
                </div>

                <div className="form-grid">

                  <div className="form-group">
                    <label>SKU</label>
                    <input
                      value={variant.sku}
                      className="form-control"
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label>Barcode</label>
                    <input
                      value={variant.barcode}
                      className="form-control"
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
              MODAL VER TODOS (DINÃ MICO PARA EJE N)
          ======================================= */}
          {activeAxisModal !== null && (() => {
            const axis = simpleConfig.axes[activeAxisModal];
            if (!axis || !axis.id) return null;

            let optionsToRender = [];
            let isColorGrid = false;
            let title = "";

            if (axis.type === "size") {
              optionsToRender = sizes;
              title = "Seleccionar Tallas";
            } else if (axis.type === "attribute") {
              const attr = attributes.find(a => String(a.id) === String(axis.id));
              optionsToRender = attr?.attribute_values || [];
              isColorGrid = optionsToRender.some(v => v.hex_code);
              title = `Seleccionar ${attr?.name || "Opciones"}`;
            }

            return (
              <div className="selector-modal-overlay">
                <div className="selector-modal">
                  <div className="selector-modal-header">
                    <div className="modal-title-group">
                      <h3>{title}</h3>
                      {axis.type === "size" && (
                        <button type="button" className="add-mini-btn" onClick={() => setShowCreateSize(true)}>
                          <Plus size={18} />
                        </button>
                      )}
                      {axis.type === "attribute" && isColorGrid && (
                        <button type="button" className="add-mini-btn" onClick={() => setShowCreateColor(true)}>
                          <Plus size={18} />
                        </button>
                      )}
                    </div>
                    <button type="button" className="close-modal-btn" onClick={() => setActiveAxisModal(null)}><X size={16} /></button>
                  </div>

                  <div className={isColorGrid ? "color-selector-grid modal-grid" : "size-selector modal-size-grid"}>
                    {optionsToRender.map((opt) => {
                      const selected = axis.values.includes(opt.id);

                      if (isColorGrid) {
                        return (
                          <button key={opt.id} type="button" className={ selected ? "color-circle active" : "color-circle" } onClick={() => toggleSelection(activeAxisModal, opt.id)}>
                            <div className="color-circle-preview" style={{ background: opt.hex_code || "#ccc" }} />
                            <span>{opt.value || opt.name}</span>
                          </button>
                        );
                      }

                      return (
                        <button key={opt.id} type="button" className={ selected ? "size-chip active" : "size-chip" } onClick={() => toggleSelection(activeAxisModal, opt.id)}>
                          {opt.value || opt.name}
                        </button>
                      );
                    })}
                  </div>

                  <button type="button" className="modal-ready-btn" onClick={() => setActiveAxisModal(null)}>
                    Listo
                  </button>
                </div>
              </div>
            );
          })()}

{/* =======================================
              ADVANCED DYNAMIC MODAL
          ======================================= */}
          {advancedDynamicModal.open && (() => {
            const vIndex = advancedDynamicModal.variantIndex;
            const aIndex = advancedDynamicModal.axisIndex;
            const aType = advancedDynamicModal.axisType;
            if (!aIndex) return null;

            const axis = { id: aIndex, type: aType };

            let optionsToRender = [];
            let isColorGrid = false;
            let title = "";

            if (axis.type === "size") {
              optionsToRender = sizes;
              title = "Seleccionar Tallas";
            } else if (axis.type === "attribute") {
              const attr = attributes.find(a => String(a.id) === String(axis.id));
              optionsToRender = attr?.attribute_values || [];
              isColorGrid = optionsToRender.some(v => v.hex_code);
              title = `Seleccionar ${attr?.name || "Opciones"}`;
            }

            return (
              <div className="selector-modal-overlay">
                <div className="selector-modal">
                  <div className="selector-modal-header">
                    <div className="modal-title-group">
                      <h3>{title}</h3>
                      {axis.type === "size" && (
                        <button type="button" className="add-mini-btn" onClick={() => setShowCreateSize(true)}>
                          <Plus size={18} />
                        </button>
                      )}
                      {axis.type === "attribute" && isColorGrid && (
                        <button type="button" className="add-mini-btn" onClick={() => setShowCreateColor(true)}>
                          <Plus size={18} />
                        </button>
                      )}
                    </div>
                    <button type="button" className="close-modal-btn" onClick={() => setAdvancedDynamicModal({ open: false, variantIndex: null, axisIndex: null })}>X</button>
                  </div>

                  <div className={isColorGrid ? "color-selector-grid modal-grid" : "size-selector modal-size-grid"}>
                    {optionsToRender.map((opt) => {
                      let selected = false;
                      if (axis.type === "size") {
                        selected = form.variants[vIndex]?.size_id === opt.id;
                      } else {
                        selected = form.variants[vIndex]?.attribute_value_ids?.[axis.id] === opt.id;
                      }

                      if (isColorGrid) {
                        return (
                          <button key={opt.id} type="button" className={ selected ? "color-circle active" : "color-circle" } onClick={() => handleAttributeChange(vIndex, axis.id, opt.id)}>
                            <div className="color-circle-preview" style={{ background: opt.hex_code || "#ccc" }} />
                            <span>{opt.value || opt.name}</span>
                          </button>
                        );
                      }

                      return (
                        <button key={opt.id} type="button" className={ selected ? "size-chip active" : "size-chip" } onClick={() => {
                          if (axis.type === "size") handleVariantChange(vIndex, "size_id", opt.id);
                          else handleAttributeChange(vIndex, axis.id, opt.id);
                        }}>
                          {opt.value || opt.name}
                        </button>
                      );
                    })}
                  </div>

                  <button type="button" className="modal-ready-btn" onClick={() => setAdvancedDynamicModal({ open: false, variantIndex: null, axisIndex: null })}>
                    Listo
                  </button>
                </div>
              </div>
            );
          })()}

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
                    <X size={16} />
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
                    <X size={16} />
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
              disabled={!isFormValid() || isSubmitting}
              style={{ opacity: (!isFormValid() || isSubmitting) ? 0.5 : 1, cursor: (!isFormValid() || isSubmitting) ? "not-allowed" : "pointer" }}
            >
              {isSubmitting 
                ? (product ? "Actualizando..." : "Guardando...") 
                : (product ? "Actualizar Producto" : "Crear Producto")}
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
          ? `Imágenes del Color: ${colorAttribute?.attribute_values?.find(c => String(c.id) === String(galleryModalConfig.id))?.value || ""}`
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
      {/* FULL SCREEN LOADING OVERLAY */}
      {isSubmitting && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white"
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "4px solid rgba(255,255,255,0.3)",
            borderTop: "4px solid #fff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "20px"
          }} />
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", margin: 0 }}>
            {product ? "Actualizando Producto..." : "Guardando Producto..."}
          </h2>
          <p style={{ marginTop: "10px", color: "#ccc" }}>Por favor, no cierre esta ventana.</p>
        </div>
      )}
    </div>
  );
}
