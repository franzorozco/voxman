import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import AsyncSelect from "react-select/async";
import toast from "react-hot-toast";

import { createBundle, updateBundle } from "../../../../api/bundles";
import { getProducts } from "../../../../api/products";
import { API_BASE_URL } from "../../../../config/api";

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
          const color = item.variant?.variant_attribute_values?.[0]?.attribute_value?.value || '';
          const size = item.variant?.size?.name || '';
          label = `[Variante] ${item.product?.name || 'Desconocido'} - ${size} ${color}`;
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

        return {
          id: item.id,
          type,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          selectOption: { value, label, type, productId: item.product_id, image: imageUrl }
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
        options.push({ value: p.id, label: `[Producto] ${p.name}`, type: 'product', price: parseFloat(p.base_price || 0), image: imageUrl });
        
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
            const colorName = v.variant_attribute_values?.[0]?.attribute_value?.value || '';
            options.push({
              value: v.id,
              label: `[Variante] ${p.name} - ${sizeName} ${colorName} (SKU: ${v.sku})`,
              type: 'variant',
              productId: p.id,
              price: parseFloat(v.price || p.base_price || 0),
              image: finalVariantImage
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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
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
      background: '#1a1a1a', // Fondo oscuro para el menú
      zIndex: 9999,
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      overflow: 'hidden'
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '4px'
    }),
    option: (provided, state) => ({
      ...provided,
      background: state.isFocused ? 'var(--color-primary)' : 'transparent',
      color: '#ffffff', // Aseguramos que el texto sea blanco
      cursor: 'pointer',
      borderRadius: '6px',
      margin: '2px 0',
      padding: '10px 14px',
      fontSize: '13px'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#ffffff',
      fontSize: '13px'
    }),
    input: (provided) => ({
      ...provided,
      color: '#ffffff',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'var(--text-muted)',
      fontSize: '13px'
    }),
    menuPortal: base => ({ ...base, zIndex: 999999 })
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 30px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {bundle ? "Editar Conjunto" : "Crear Conjunto"}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', transition: '0.2s' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Nombre del Conjunto</label>
              <input type="text" className="form-control" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Precio Base</label>
              <input type="number" step="0.01" className="form-control" required value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Categoría <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 'normal' }}>(Opcional)</span></label>
              <select className="form-control" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}>
                <option value="">Seleccione...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Tipo de Producto</label>
              <select className="form-control" value={formData.product_type_id} onChange={(e) => setFormData({ ...formData, product_type_id: e.target.value })}>
                <option value="">Seleccione...</option>
                {productTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Descripción</label>
              <textarea className="form-control" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Imágenes del Conjunto</label>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="form-control" 
                style={{ padding: '8px' }} 
              />
              {imagePreviews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginTop: '12px' }}>
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                      <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-section-title" style={{ marginTop: '30px', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <h3>Ítems del Conjunto</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Selecciona Productos (el cliente elige talla/color) o Variantes (talla/color fijo).</p>
          </div>

          <div className="bundle-items-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '15px', paddingRight: '5px' }}>
            {formData.bundle_items.map((item, index) => (
              <div key={index} className="bundle-item-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <button type="button" onClick={() => handleRemoveItem(index)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s', zIndex: 10 }}>
                  <X size={16} />
                </button>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '8px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.selectOption?.image ? (
                      <img src={item.selectOption.image} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sin img</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                     <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ítem {index + 1}</label>
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
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Cantidad {item.type === 'product' && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(Fija)</span>}
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={item.type === 'product'}
                    style={{ width: '80px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: item.type === 'product' ? 'var(--bg-overlay)' : 'var(--bg-input)', color: item.type === 'product' ? 'var(--text-muted)' : 'var(--text-main)', outline: 'none', textAlign: 'center', fontWeight: 600, cursor: item.type === 'product' ? 'not-allowed' : 'text' }}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="btn-add-item" onClick={handleAddItem}>
            <Plus size={18} /> Agregar Ítem al Conjunto
          </button>

          <div className="modal-footer" style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 0 }}>
              <input type="checkbox" id="bundle-active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
              <label htmlFor="bundle-active" style={{ margin: 0, cursor: 'pointer', fontWeight: 500 }}>Conjunto Activo</label>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500, transition: '0.2s' }}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'var(--color-primary-text)', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
                {loading ? "Guardando..." : "Guardar Conjunto"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
