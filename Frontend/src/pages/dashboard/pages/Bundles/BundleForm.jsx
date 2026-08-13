import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Camera } from "lucide-react";
import AsyncSelect from "react-select/async";
import toast from "react-hot-toast";

import { createBundle, updateBundle } from "../../../../api/admin/bundles";
import { getProducts } from "../../../../api/admin/products";
import { API_BASE_URL } from "../../../../config/api";
import useScanner from "../../../../hooks/useScanner";
import { useScannerStore } from "../../../../store/useScannerStore";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function BundleForm({ bundle, categories, owners, productTypes, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: "",
    category_id: "",
    owner_id: "",
    product_type_id: "",
    is_active: true,
    bundle_items: []
  });

  const openScanner = useScannerStore(state => state.openScanner);

  useEffect(() => {
    if (bundle) {
      const items = (bundle.bundle_items || []).map(item => {
        let label = "";
        let type = "";
        let value = "";
        
        if (item.product_id && !item.variant_id) {
          type = "product";
          value = item.product_id;
          label = `[Producto] ${item.product?.name || 'Desconocido'}`;
        } else if (item.variant_id) {
          type = "variant";
          value = item.variant_id;
          const size = item.variant?.size?.name || '';
          const fit = item.variant?.fit?.name || '';
          const otherAttrs = (item.variant?.variant_attribute_values || []).map(val => val.attribute_value?.value).filter(Boolean);
          const allAttrs = [fit, size, ...otherAttrs].filter(Boolean).join(" - ");
          label = `[Variante] ${item.product?.name || 'Desconocido'} - ${allAttrs}`;
        }

        let mainImage = null;
        if (item.variant_id) {
          const colorId = item.variant?.variant_attribute_values?.[0]?.attribute_value_id;
          const avi = item.product?.attribute_value_images?.find(img => img.attribute_value_id === colorId);
          mainImage = item.variant?.variant_images?.[0]?.url || avi?.url || item.product?.product_images?.find(img => img.is_main)?.url || item.product?.product_images?.[0]?.url;
        } else {
          mainImage = item.product?.product_images?.find(img => img.is_main)?.url || item.product?.product_images?.[0]?.url;
        }
        const imageUrl = mainImage ? (mainImage.startsWith('http') ? mainImage : `${API_BASE_URL}${mainImage}`) : null;

        let price = 0;
        let cost = 0;
        let sku = "";
        let attributesText = "";

        if (type === 'product') {
          price = parseFloat(item.product?.base_price || 0);
          cost = parseFloat(item.product?.product_variants?.[0]?.cost || 0);
          sku = item.product?.sku || item.product?.code || "N/A";
        } else if (type === 'variant') {
          price = parseFloat(item.variant?.price || item.product?.base_price || 0);
          cost = parseFloat(item.variant?.cost || 0);
          sku = item.variant?.sku || "N/A";
          const size = item.variant?.size?.name || '';
          const fit = item.variant?.fit?.name || '';
          const otherAttrs = (item.variant?.variant_attribute_values || []).map(val => val.attribute_value?.value).filter(Boolean);
          attributesText = [fit, size, ...otherAttrs].filter(Boolean).join(" - ");
        }

        return {
          id: item.id,
          type,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          selectOption: { 
            value, 
            label, 
            type, 
            productId: item.product_id, 
            image: imageUrl,
            price,
            cost,
            sku,
            attributesText
          }
        };
      });

      setFormData({
        name: bundle.name || "",
        description: bundle.description || "",
        base_price: bundle.base_price || "",
        category_id: bundle.category_id || "",
        owner_id: bundle.owner_id || "",
        product_type_id: bundle.product_type_id || "",
        is_active: bundle.is_active,
        bundle_items: items
      });

      if (bundle.product_images) {
        setImagePreviews(bundle.product_images.map(img => img.url));
      }
    }
  }, [bundle]);

  const loadOptions = async (inputValue) => {
    if (!inputValue) return [];
    try {
      const res = await getProducts({ search: inputValue });
      const products = res.data?.data ?? res.data ?? [];
      
      let options = [];
      products.forEach(p => {
        const mainImage = p.product_images?.find(img => img.is_main)?.url || p.product_images?.[0]?.url;
        const imageUrl = mainImage ? (mainImage.startsWith('http') ? mainImage : `${API_BASE_URL}${mainImage}`) : null;

        // Opción de elegir el producto completo (dinámico)
        const productCost = p.product_variants?.length > 0 ? parseFloat(p.product_variants[0].cost || 0) : 0;
        options.push({ 
          value: p.id, 
          label: `[Producto] ${p.name}`, 
          type: 'product', 
          price: parseFloat(p.base_price || 0), 
          cost: productCost, 
          image: imageUrl,
          sku: p.sku || p.code || 'N/A',
          attributesText: ''
        });
        
        // Opción de elegir variantes específicas (fijo)
        if (p.product_variants) {
          p.product_variants.forEach(v => {
            let variantImage = v.variant_images?.[0]?.url;
            if (!variantImage && p.attribute_value_images) {
               const colorId = v.variant_attribute_values?.[0]?.attribute_value_id;
               const avi = p.attribute_value_images.find(img => img.attribute_value_id === colorId);
               if (avi) variantImage = avi.url;
            }
            const finalVariantImage = variantImage ? (variantImage.startsWith('http') ? variantImage : `${API_BASE_URL}${variantImage}`) : imageUrl;
            
            const sizeName = v.size?.name || '';
            const fitName = v.fit?.name || '';
            const otherAttrs = (v.variant_attribute_values || []).map(val => val.attribute_value?.value).filter(Boolean);
            const allAttrs = [fitName, sizeName, ...otherAttrs].filter(Boolean).join(" - ");
            
            options.push({
              value: v.id,
              label: `[Variante] ${p.name} - ${allAttrs} (SKU: ${v.sku})`,
              type: 'variant',
              productId: p.id,
              price: parseFloat(v.price || p.base_price || 0),
              cost: parseFloat(v.cost || 0),
              image: finalVariantImage,
              sku: v.sku || 'N/A',
              attributesText: allAttrs
            });
          });
        }
      });
      return options;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      bundle_items: [
        ...prev.bundle_items,
        { product_id: null, variant_id: null, quantity: 1, type: null, selectOption: null }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    const newItems = [...formData.bundle_items];
    newItems.splice(index, 1);
    const newPrice = calculateTotal(newItems);
    setFormData({ ...formData, bundle_items: newItems, base_price: newPrice.toFixed(2) });
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => {
      const price = item.selectOption?.price || 0;
      return sum + (price * item.quantity);
    }, 0);
  };

  const calculateTotalCost = (items) => {
    return items.reduce((sum, item) => {
      const cost = item.selectOption?.cost || 0;
      return sum + (cost * item.quantity);
    }, 0);
  };

  const handleItemChange = (index, selectedOption) => {
    const newItems = [...formData.bundle_items];
    if (!selectedOption) {
      newItems[index] = { ...newItems[index], product_id: null, variant_id: null, type: null, selectOption: null };
    } else {
      newItems[index] = {
        ...newItems[index],
        selectOption: selectedOption,
        type: selectedOption.type,
        product_id: selectedOption.type === 'product' ? selectedOption.value : selectedOption.productId,
        variant_id: selectedOption.type === 'variant' ? selectedOption.value : null,
        quantity: selectedOption.type === 'product' ? 1 : newItems[index].quantity,
      };
    }
    const newPrice = calculateTotal(newItems);
    setFormData({ ...formData, bundle_items: newItems, base_price: newPrice.toFixed(2) });
  };

  const handleQuantityChange = (index, val) => {
    const newItems = [...formData.bundle_items];
    newItems[index].quantity = parseInt(val) || 1;
    const newPrice = calculateTotal(newItems);
    setFormData({ ...formData, bundle_items: newItems, base_price: newPrice.toFixed(2) });
  };

  const processScannedCode = async (scannedText) => {
    const code = scannedText.includes('/p/') ? scannedText.split('/p/').pop().trim() : scannedText.trim();
    if (!code) return;

    try {
      const res = await getProducts({ search: code });
      const products = res.data?.data ?? res.data ?? [];
      
      let foundVariant = null;
      let foundProduct = null;
      
      for (const prod of products) {
        const variant = prod.product_variants?.find(v => v.sku === code || v.barcode === code);
        if (variant) {
          foundVariant = variant;
          foundProduct = prod;
          break;
        }
      }

      if (!foundVariant && products.length > 0) {
         foundProduct = products[0];
         foundVariant = foundProduct.product_variants?.[0];
      }

      if (foundProduct && foundVariant) {
        const p = foundProduct;
        const v = foundVariant;
        
        let variantImage = v.variant_images?.[0]?.url;
        if (!variantImage && p.attribute_value_images) {
            const colorId = v.variant_attribute_values?.[0]?.attribute_value_id;
            const avi = p.attribute_value_images.find(img => img.attribute_value_id === colorId);
            if (avi) variantImage = avi.url;
        }
        const mainImage = p.product_images?.find(img => img.is_main)?.url || p.product_images?.[0]?.url;
        const imageUrl = mainImage ? (mainImage.startsWith('http') ? mainImage : `${API_BASE_URL}${mainImage}`) : null;
        const finalVariantImage = variantImage ? (variantImage.startsWith('http') ? variantImage : `${API_BASE_URL}${variantImage}`) : imageUrl;
        
        const sizeName = v.size?.name || '';
        const colorName = v.variant_attribute_values?.[0]?.attribute_value?.value || '';

        const selectOption = {
            value: v.id,
            label: `[Variante] ${p.name} - ${sizeName} ${colorName} (SKU: ${v.sku})`,
            type: 'variant',
            productId: p.id,
            price: parseFloat(v.price || p.base_price || 0),
            cost: parseFloat(v.cost || 0),
            image: finalVariantImage,
            sku: v.sku || 'N/A',
            attributesText: [sizeName, colorName].filter(Boolean).join(" - ")
        };

        setFormData(prev => {
            const newItems = [...prev.bundle_items];
            const existingIndex = newItems.findIndex(item => item.variant_id === v.id);
            if (existingIndex >= 0) {
                newItems[existingIndex] = {
                  ...newItems[existingIndex],
                  quantity: newItems[existingIndex].quantity + 1
                };
            } else {
                newItems.push({
                    product_id: p.id,
                    variant_id: v.id,
                    quantity: 1,
                    type: 'variant',
                    selectOption
                });
            }
            return {
                ...prev,
                bundle_items: newItems,
                base_price: calculateTotal(newItems).toFixed(2)
            };
        });
        toast.success(`+1 añadido: ${v.sku}`);
      } else {
        toast.error(`SKU ${code} no encontrado`);
      }
    } catch (err) {
      toast.error("Error al buscar el producto escaneado");
    }
  };

  useScanner(processScannedCode, true);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImageFiles([files[0]]);
      setImagePreviews([URL.createObjectURL(files[0])]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const validItems = formData.bundle_items.filter(i => i.product_id || i.variant_id);
    
    let payload;
    if (imageFiles.length > 0) {
      payload = new FormData();
      payload.append("name", formData.name);
      payload.append("description", formData.description);
      payload.append("base_price", formData.base_price);
      if (formData.category_id) payload.append("category_id", formData.category_id);
      if (formData.product_type_id) payload.append("product_type_id", formData.product_type_id);
      if (formData.owner_id) payload.append("owner_id", formData.owner_id);
      payload.append("is_active", formData.is_active ? 1 : 0);
      payload.append("bundle_items", JSON.stringify(validItems));
      
      imageFiles.forEach(file => {
        payload.append("product_images[]", file);
      });
    } else {
      payload = {
        ...formData,
        bundle_items: validItems
      };
      if (!payload.category_id) delete payload.category_id;
    }

    try {
      if (bundle) {
        await updateBundle(bundle.id, payload);
        toast.success("Conjunto actualizado");
      } else {
        await createBundle(payload);
        toast.success("Conjunto creado");
      }
      onSuccess();
    } catch (error) {
      toast.error("Error al guardar el conjunto");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const themeNode = document.querySelector('.admin-theme') || document.querySelector('.admin-theme-dark') || document.body;

  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      background: 'var(--bg-input)',
      borderColor: state.isFocused ? 'var(--color-primary)' : 'var(--border-color)',
      color: 'var(--text-main)',
      minHeight: '42px',
      borderRadius: '8px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'var(--color-primary)'
      }
    }),
    menu: (provided) => ({
      ...provided,
      background: 'var(--bg-card)',
      zIndex: 9999,
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '4px'
    }),
    option: (provided, state) => {
      let bg = 'transparent';
      let textColor = 'var(--text-main)';
      if (state.isFocused) {
        bg = 'var(--color-primary)';
        textColor = 'var(--color-primary-text)';
      } else if (state.isSelected) {
        bg = 'var(--color-primary-hover, var(--color-primary))';
        textColor = 'var(--color-primary-text)';
      }
      return {
        ...provided,
        background: bg,
        color: textColor,
        cursor: 'pointer',
        borderRadius: '6px',
        margin: '2px 0',
        padding: '10px 14px',
        fontSize: '13px'
      };
    },
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--text-main)',
      fontSize: '13px'
    }),
    input: (provided) => ({
      ...provided,
      color: 'var(--text-main)',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'var(--text-muted)',
      fontSize: '13px'
    }),
    menuPortal: base => ({ ...base, zIndex: 999999 })
  };

  return (
    <div className="modal-overlay bundle-modal-overlay">
      <form id="bundle-form-modal" onSubmit={handleSubmit} className="modal-content bundle-modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {bundle ? "Editar Conjunto" : "Crear Conjunto"}
          </h2>
          <button type="button" onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body bundle-modal-grid">
          
          {/* Columna Izquierda: Info Principal */}
          <div className="form-info-col">
            <h3 className="bfm-section-title">Información del Conjunto</h3>
            <div className="form-grid bfm-form-grid">
              <div className="form-group">
                <label>Nombre del Conjunto</label>
                <input type="text" className="form-control" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="form-group bfm-price-group">
                <label className="flex-wrap-mobile bfm-price-label">
                  <span>Precio del Conjunto</span>
                  {(() => {
                    const regularPrice = calculateTotal(formData.bundle_items);
                    const basePrice = parseFloat(formData.base_price || 0);
                    const savings = regularPrice - basePrice;
                    if (savings > 0) {
                      return (
                        <span className="bfm-savings-text">
                          Ahorro Cliente: Bs. {savings.toFixed(2)}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </label>
                <div className="bfm-price-input-wrapper">
                  <input type="number" step="0.01" className="form-control" required value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} />
                  {(() => {
                    const regularPrice = calculateTotal(formData.bundle_items);
                    if (regularPrice > 0) {
                      return (
                        <div className="bfm-reg-price-tag">
                          Reg: <span>Bs. {regularPrice.toFixed(2)}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                
                {/* Rentabilidad Interna */}
                {(() => {
                  const totalCost = calculateTotalCost(formData.bundle_items);
                  const basePrice = parseFloat(formData.base_price || 0);
                  const margin = basePrice - totalCost;
                  
                  if (totalCost > 0 || basePrice > 0) {
                    return (
                      <div className={`bfm-margin-box ${margin >= 0 ? 'margin-positive' : 'margin-negative'}`}>
                        <div className="bfm-margin-col">
                          <span className="bfm-margin-lbl">Costo Total Ítems</span>
                          <span className="bfm-margin-val">Bs. {totalCost.toFixed(2)}</span>
                        </div>
                        <div className="bfm-margin-col bfm-margin-col-right">
                          <span className="bfm-margin-lbl">Margen de Ganancia</span>
                          <span className={`bfm-margin-val-big ${margin >= 0 ? 'text-success' : 'text-danger'}`}>
                            Bs. {margin.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="bundle-form-row-grid">
                <div className="form-group">
                  <label>Categoría <span className="bfm-optional-label">(Opcional)</span></label>
                  <CustomSelect  value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}>
                    <option value="">Seleccione...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </CustomSelect>
                </div>

                <div className="form-group">
                  <label>Tipo de Prod.</label>
                  <CustomSelect  value={formData.product_type_id} onChange={(e) => setFormData({ ...formData, product_type_id: e.target.value })}>
                    <option value="">Seleccione...</option>
                    {productTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                  </CustomSelect>
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea className="form-control" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
              </div>

              <div className="form-group">
                <label>Imágenes del Conjunto</label>
                <div className="bfm-custom-upload-zone">
                  <input 
                    type="file" 
                    id="bundle-image-upload"
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="bfm-hidden-file-input" 
                  />
                  {imagePreviews.length > 0 ? (
                    <label htmlFor="bundle-image-upload" className="bfm-single-image-preview">
                      <img src={imagePreviews[0]} alt="Preview" />
                      <div className="bfm-preview-overlay">
                        <Camera size={24} />
                        <span>Cambiar Imagen</span>
                      </div>
                    </label>
                  ) : (
                    <label htmlFor="bundle-image-upload" className="bfm-upload-placeholder">
                      <div className="bfm-upload-icon-wrapper">
                        <Camera size={32} />
                      </div>
                      <span className="bfm-upload-text">Haz clic para añadir imagen</span>
                      <span className="bfm-upload-subtext">JPG, PNG o WEBP</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Ítems del Conjunto */}
          <div className="form-items-col">
            <h3 className="bfm-section-title">Ítems del Conjunto</h3>
            <p className="bfm-section-desc">Selecciona Productos (el cliente elige talla/color) o Variantes (talla/color fijo).</p>

            <div className="bundle-items-cards">
              {formData.bundle_items.map((item, index) => (
                <div key={index} className="bfm-item-card">
                  <button type="button" className="bfm-item-remove-btn" onClick={() => handleRemoveItem(index)}>
                    <X size={16} />
                  </button>
                  
                  {/* Select Header */}
                  <div className="bfm-item-header">
                     <label className="bfm-item-label">Ítem {index + 1}</label>
                     <AsyncSelect
                        className="bundle-item-select"
                        styles={selectStyles}
                        cacheOptions
                        defaultOptions
                        loadOptions={loadOptions}
                        value={item.selectOption}
                        onChange={(opt) => handleItemChange(index, opt)}
                        placeholder="Buscar producto o variante..."
                        noOptionsMessage={() => "No se encontraron resultados"}
                        menuPortalTarget={themeNode}
                        menuPosition="fixed"
                      />
                  </div>

                  {/* Body: Image and Details side by side */}
                  <div className="bfm-item-body">
                    <div className="bfm-item-image">
                      {item.selectOption?.image ? (
                        <img src={item.selectOption.image} alt="Portada" />
                      ) : (
                        <span>Sin img</span>
                      )}
                    </div>

                    <div className="bfm-item-details-container">
                      {item.selectOption && (
                        <div className="bfm-item-details-wrapper">
                          <div className="bfm-item-details-grid">
                            <div>
                              <span>SKU / Cód.</span>
                              <strong>{item.selectOption.sku || 'N/A'}</strong>
                            </div>
                            <div>
                              <span>Variante</span>
                              <strong title={item.selectOption.attributesText}>{item.selectOption.attributesText || 'General'}</strong>
                            </div>
                            <div>
                              <span>Precio Reg.</span>
                              <strong className="text-success">Bs. {parseFloat(item.selectOption.price || 0).toFixed(2)}</strong>
                            </div>
                          </div>
                          
                          <div className="bfm-item-cost">
                            <span>Costo Interno (Fábrica)</span>
                            <strong>Bs. {parseFloat(item.selectOption.cost || 0).toFixed(2)}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bfm-item-quantity-row">
                    <label>
                      Cantidad {item.type === 'product' && <span>(Fija)</span>}
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={item.type === 'product'}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bfm-add-actions">
              <button type="button" className="btn-add-item bfm-add-btn" onClick={handleAddItem}>
                <Plus size={18} /> Agregar Ítem Manual
              </button>
              <button
                type="button"
                className="bfm-scanner-btn"
                onClick={() => openScanner(processScannedCode, true)}
                title="Escanear Ítem"
              >
                <Camera size={20} />
              </button>
            </div>
          </div>

          </div>
        <div className="bundle-modal-footer">
          
          <div className="bfm-checkbox-group">
            <input type="checkbox" id="bundle-active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="bfm-checkbox" />
            <label htmlFor="bundle-active" className="bfm-checkbox-label">Conjunto Activo</label>
          </div>
          
          <div className="bfm-footer-actions">
            <button type="button" className="btn-secondary bfm-footer-btn" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary bfm-footer-btn bfm-submit-btn" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Conjunto"}
            </button>
          </div>
          
        </div>
      </form>
    </div>
  );
}
