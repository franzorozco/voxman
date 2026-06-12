import React, { useState, useEffect } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import { API_BASE_URL } from "../../../../config/api";
import { updateProductImages } from "../../../../api/products";
import ImageGalleryModal from "./ImageGalleryModal";
import toast from "react-hot-toast";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
};

export default function ProductImageEditor({ product, onSaved, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [colorImages, setColorImages] = useState({});
  const [variantImages, setVariantImages] = useState({});
  const [advancedImageMode, setAdvancedImageMode] = useState("color");
  const [galleryModalConfig, setGalleryModalConfig] = useState({ open: false, type: "", id: null });

  const getAttributeDetails = (attrValId) => {
    if (!product.product_variants) return null;
    for (const variant of product.product_variants) {
      const found = variant.variant_attribute_values?.find(vav => String(vav.attribute_value_id) === String(attrValId));
      if (found && found.attribute_value) {
        return found.attribute_value;
      }
    }
    return null;
  };

  useEffect(() => {
    if (product) {
      // Initialize states from product data
      let initialColorImages = {};
      let initialVariantImages = {};
      
      let hasColorImages = false;
      let hasVariantImages = false;

      if (product.attribute_value_images && product.attribute_value_images.length > 0) {
        hasColorImages = true;
        product.attribute_value_images.forEach(img => {
          if (!initialColorImages[img.attribute_value_id]) initialColorImages[img.attribute_value_id] = [];
          initialColorImages[img.attribute_value_id].push(getImageUrl(img.url));
        });
      }

      product.product_variants?.forEach((v, index) => {
        if (v.variant_images && v.variant_images.length > 0) {
          hasVariantImages = true;
          initialVariantImages[index] = v.variant_images.map(img => getImageUrl(img.url));
        }
      });

      // Priority: If it has variant images, set strategy to variant. Else color.
      const strategy = hasVariantImages && !hasColorImages ? "variant" : "color";

      setAdvancedImageMode(strategy);
      setColorImages(initialColorImages);
      setVariantImages(initialVariantImages);

      if (product.product_images && product.product_images.length > 0) {
        const mainImage = product.product_images.find(img => img.is_main) || product.product_images[0];
        setImagePreview(getImageUrl(mainImage.url));
      } else {
        setImagePreview(null);
      }
    }
  }, [product]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProductImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageModeSwitch = (targetMode) => {
    if (advancedImageMode === targetMode) return;

    if (targetMode === "variant") {
      const newVariantImages = { ...variantImages };
      let migrated = false;
      product.product_variants?.forEach((v, idx) => {
        const colorVav = v.variant_attribute_values?.find(vav => vav.attribute_value?.attribute?.name?.toLowerCase() === 'color' || colorImages[vav.attribute_value_id]);
        const colorId = colorVav?.attribute_value_id;
        if (colorId && colorImages[colorId] && colorImages[colorId].length > 0) {
          if (!newVariantImages[idx] || newVariantImages[idx].length === 0) {
            newVariantImages[idx] = [...colorImages[colorId]];
            migrated = true;
          }
        }
      });
      if (migrated) setVariantImages(newVariantImages);
      setAdvancedImageMode("variant");
    } else {
      const newColorImages = { ...colorImages };
      let migrated = false;
      product.product_variants?.forEach((v, idx) => {
        const colorVav = v.variant_attribute_values?.find(vav => vav.attribute_value?.attribute?.name?.toLowerCase() === 'color' || vav.attribute_value?.hex_code);
        const colorId = colorVav?.attribute_value_id;
        
        if (colorId && variantImages[idx] && variantImages[idx].length > 0) {
          if (!newColorImages[colorId] || newColorImages[colorId].length === 0) {
            newColorImages[colorId] = [...variantImages[idx]];
            migrated = true;
          }
        }
      });
      
      if (migrated) setColorImages(newColorImages);
      setAdvancedImageMode("color");
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (productImage) {
        formData.append("product_images[]", productImage);
      } else if (imagePreview && imagePreview.startsWith("http")) {
        // Not changing main image, backend ignores if product_images not sent
      }

      // Color Images
      if (advancedImageMode === "color") {
        Object.entries(colorImages).forEach(([colorId, files]) => {
          files.forEach((file) => {
            if (typeof file !== "string") {
              formData.append(`color_images[${colorId}][]`, file);
            } else {
              formData.append(`kept_color_images[${colorId}][]`, file);
            }
          });
        });
      }

      // Variant Images
      if (advancedImageMode === "variant") {
        Object.entries(variantImages).forEach(([variantIndex, files]) => {
          files.forEach((file) => {
            if (typeof file !== "string") {
              formData.append(`variant_images[${variantIndex}][]`, file);
            } else {
              formData.append(`kept_variant_images[${variantIndex}][]`, file);
            }
          });
        });
      }

      await updateProductImages(product.id, formData);
      toast.success("Imágenes actualizadas correctamente");
      onSaved();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar imágenes");
    } finally {
      setIsSubmitting(false);
    }
  };

  const colorValues = Array.from(new Set(product.product_variants?.flatMap(v => 
    v.variant_attribute_values?.filter(vav => vav.attribute_value?.attribute?.name?.toLowerCase() === 'color' || vav.attribute_value?.hex_code)
      .map(vav => vav.attribute_value_id)
  ).filter(Boolean)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "var(--text-main)" }}>Edición de Imágenes</h3>
        
        <div className="product-layout">
          
          <div className="product-image-box" style={{ background: "var(--bg-overlay)", padding: "20px", borderRadius: "12px", border: "1px dashed var(--border-color)" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--text-muted)", textAlign: "center" }}>Portada Principal</h4>
            <label className="image-upload-box" style={{ width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)", borderRadius: "12px", overflow: "hidden", cursor: "pointer", position: "relative" }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
              {imagePreview ? (
                <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}>
                  <ImageIcon size={32} />
                  <span>Subir imagen</span>
                </div>
              )}
            </label>
          </div> 

          <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
              <div style={{ fontWeight: 600, color: "var(--text-main)" }}>Estrategia de Imágenes</div>
              <div className="variant-tabs" style={{ display: "flex", gap: "8px", background: "var(--bg-input)", padding: "4px", borderRadius: "8px" }}>
                <button 
                  type="button" 
                  style={{ padding: "6px 12px", borderRadius: "6px", background: advancedImageMode === "color" ? "var(--color-primary)" : "transparent", color: advancedImageMode === "color" ? "var(--color-primary-text)" : "var(--text-muted)", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "500", transition: "0.2s" }}
                  onClick={() => handleImageModeSwitch("color")}
                >
                  Por Color (Compartidas)
                </button>
                <button 
                  type="button" 
                  style={{ padding: "6px 12px", borderRadius: "6px", background: advancedImageMode === "variant" ? "var(--color-primary)" : "transparent", color: advancedImageMode === "variant" ? "var(--color-primary-text)" : "var(--text-muted)", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "500", transition: "0.2s" }}
                  onClick={() => handleImageModeSwitch("variant")}
                >
                  Por Variante (Únicas)
                </button>
              </div>
            </div>

            {advancedImageMode === "color" && (
              <div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Haz clic en un color para gestionar las fotos que se aplicarán a todas sus variantes:
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {colorValues.length === 0 && <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>No hay colores disponibles en las variantes.</span>}
                  {colorValues.map(colorId => {
                    const colorAttr = getAttributeDetails(colorId);
                    const count = colorImages[colorId]?.length || 0;
                    return (
                      <button
                        key={colorId}
                        type="button"
                        onClick={() => setGalleryModalConfig({ open: true, type: "color", id: colorId })}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "20px",
                          border: count > 0 ? "1px solid var(--color-primary)" : "1px solid var(--border-color)",
                          background: count > 0 ? "rgba(16, 185, 129, 0.1)" : "var(--bg-input)",
                          color: "var(--color-primary-te)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          transition: "0.2s"
                        }}
                      >
                        {colorAttr?.hex_code && (
                          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: colorAttr.hex_code }} />
                        )}
                        <span style={{ fontSize: "13px", fontWeight: 500 }}>{colorAttr?.value || `Color #${colorId}`}</span>
                        <span style={{ fontSize: "11px", background: count > 0 ? "var(--color-primary)" : "var(--bg-overlay)", color: count > 0 ? "var(--color-primary-text)" : "var(--text-muted)", padding: "2px 6px", borderRadius: "10px" }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {advancedImageMode === "variant" && (
              <div style={{ overflowX: "auto" }}>
                <table className="products-table" style={{ width: "100%", fontSize: "13px", textAlign: "left", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "10px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontWeight: 600 }}>SKU</th>
                      <th style={{ padding: "10px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontWeight: 600 }}>Talla</th>
                      <th style={{ padding: "10px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontWeight: 600 }}>Color</th>
                      <th style={{ padding: "10px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontWeight: 600 }}>Imágenes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.product_variants?.map((v, index) => {
                      const colorVal = v.variant_attribute_values?.find(vav => vav.attribute_value?.attribute?.name?.toLowerCase() === 'color' || vav.attribute_value?.hex_code)?.attribute_value?.value;
                      const sizeVal = v.size?.name || v.variant_attribute_values?.find(vav => vav.attribute_value?.attribute?.name?.toLowerCase() === 'talla' || vav.attribute_value?.attribute?.name?.toLowerCase() === 'size')?.attribute_value?.value;
                      const count = variantImages[index]?.length || 0;
                      return (
                        <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "10px", color: "var(--text-main)" }}>{v.sku}</td>
                          <td style={{ padding: "10px", color: "var(--text-main)" }}>{sizeVal || "—"}</td>
                          <td style={{ padding: "10px", color: "var(--text-main)" }}>{colorVal || "—"}</td>
                          <td style={{ padding: "10px" }}>
                            <button
                              type="button"
                              onClick={() => setGalleryModalConfig({ open: true, type: "variant", id: index })}
                              style={{ 
                                padding: "6px 12px", 
                                fontSize: "12px", 
                                display: "flex", 
                                gap: "6px", 
                                alignItems: "center",
                                borderRadius: "8px",
                                border: count > 0 ? "1px solid var(--color-primary)" : "1px solid var(--border-color)",
                                background: count > 0 ? "var(--color-primary)" : "transparent",
                                color: count > 0 ? "var(--color-primary-text)" : "var(--text-main)",
                                cursor: "pointer",
                                transition: "0.2s"
                              }}
                            >
                              <Camera size={14} /> {count} {count === 1 ? "foto" : "fotos"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</button>
        <button className="btn-save" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Imágenes"}
        </button>
      </div>


      <ImageGalleryModal
        isOpen={galleryModalConfig.open}
        onClose={() => setGalleryModalConfig({ ...galleryModalConfig, open: false })}
        title={galleryModalConfig.type === "color" 
          ? `Imágenes del Color: ${getAttributeDetails(galleryModalConfig.id)?.value || ""}`
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
