import { getImageUrl } from '../../../utils/imageUtils';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProduct } from '../../../api/shop/products';
import useShopCartStore from '../../../store/shop/useShopCartStore';
import useShopWishlistStore from '../../../store/shop/useShopWishlistStore';
import { API_BASE_URL } from '../../../config/api';
import { Check, Copy, Share2, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import './BundleDetail.css';


const ConfigurableBundleItem = ({ prod, added, onAdd, onValidationChange, onSelectionChange }) => {
  const [selectedColor, setSelectedColor] = React.useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [selectedSize, setSelectedSize] = React.useState(null);

  React.useEffect(() => {
    let defaultColor = null;
    if (prod.attribute_value_images?.length > 0) {
      const mainColorImg = prod.attribute_value_images.find(img => img.is_main) || prod.attribute_value_images[0];
      defaultColor = mainColorImg.attribute_value?.value;
    } else if (prod.product_variants?.length > 0) {
      const firstVariant = prod.product_variants.find(v => v.variant_attribute_values?.some(attr => attr.attribute_value?.attribute?.name?.toLowerCase().includes('color')));
      if (firstVariant) {
        const colorAttr = firstVariant.variant_attribute_values.find(attr => attr.attribute_value?.attribute?.name?.toLowerCase().includes('color'));
        defaultColor = colorAttr?.attribute_value?.value;
      }
    }
    setSelectedColor(defaultColor);
  }, [prod]);

  const uniqueColorsMap = new Map();
  if (prod.attribute_value_images) {
    prod.attribute_value_images.forEach(img => {
      const c = img.attribute_value?.value;
      if (c && !uniqueColorsMap.has(c)) {
        uniqueColorsMap.set(c, img.url);
      }
    });
  }
  
  if (uniqueColorsMap.size === 0 && prod.product_variants) {
    prod.product_variants.forEach(v => {
      const colorAttr = v.variant_attribute_values?.find(a => 
        a.attribute_value?.attribute?.name?.toLowerCase().includes('color')
      );
      if (colorAttr) {
        const c = colorAttr.attribute_value?.value;
        if (c && !uniqueColorsMap.has(c) && v.variant_images?.length > 0) {
          uniqueColorsMap.set(c, v.variant_images[0].url);
        }
      }
    });
  }
  const colors = Array.from(uniqueColorsMap.entries()).map(([name, url]) => ({ name, url }));

  const availableSizes = [];
  if (prod.product_variants) {
    prod.product_variants.forEach(v => {
      const matchesColor = selectedColor ? v.variant_attribute_values?.some(a => a.attribute_value?.value === selectedColor) : true;
      if (matchesColor && v.size) {
        let stock = 0;
        if (v.inventories && v.inventories.length > 0) {
          stock = v.inventories.reduce((sum, inv) => sum + Number(inv.stock || 0), 0);
        } else if (v.stock !== undefined) {
          stock = Number(v.stock);
        }
        if (stock > 0) {
          if (!availableSizes.some(s => s.name === v.size.name)) {
            availableSizes.push({ name: v.size.name, inStock: true });
          }
        }
      }
    });
  }


  // Stabilize callbacks in refs so the useEffect doesn't need them as dependencies
  const onValidationRef = React.useRef(onValidationChange);
  const onSelectionRef  = React.useRef(onSelectionChange);
  React.useEffect(() => { onValidationRef.current = onValidationChange; }, [onValidationChange]);
  React.useEffect(() => { onSelectionRef.current = onSelectionChange; }, [onSelectionChange]);

  const hasSizes = availableSizes.length > 0;

  React.useEffect(() => {
    if (onValidationRef.current) {
      const isValid = (!hasSizes || selectedSize !== null);
      onValidationRef.current(isValid);
    }
    if (onSelectionRef.current) {
      let variantId = null;
      let originalPrice = prod.base_price;
      if (prod.product_variants?.length > 0) {
        const matched = prod.product_variants.find(v => {
          const matchesColor = selectedColor ? v.variant_attribute_values?.some(a => a.attribute_value?.value === selectedColor) : true;
          const matchesSize  = selectedSize  ? v.size?.name === selectedSize : true;
          return matchesColor && matchesSize;
        });
        if (matched) {
          variantId = matched.id;
          originalPrice = (matched.price !== null && matched.price !== undefined) ? matched.price : prod.base_price;
        }
      }
      onSelectionRef.current({ productId: prod.id, variantId, originalPrice: parseFloat(originalPrice || 0), color: selectedColor, size: selectedSize });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor, selectedSize, hasSizes, prod.id]);

  const handleAdd = () => {
    let variantId = null;
    if (prod.product_variants?.length > 0) {
      const matchedVariant = prod.product_variants.find(v => {
        const matchesColor = selectedColor ? v.variant_attribute_values?.some(a => a.attribute_value?.value === selectedColor) : true;
        const matchesSize = selectedSize ? v.size?.name === selectedSize : true;
        return matchesColor && matchesSize;
      });
      variantId = matchedVariant?.id || null;
    }
    onAdd(prod.id, variantId, selectedColor);
  };

  const isAddDisabled = added || (availableSizes.length > 0 && !selectedSize);
  
  let displayPrice = prod.price || prod.base_price;
  if (selectedColor && prod.product_variants) {
    const variant = prod.product_variants.find(v => v.variant_attribute_values?.some(a => a.attribute_value?.value === selectedColor));
    if (variant && (variant.price !== null && variant.price !== undefined)) displayPrice = variant.price;
  }


  let selectedVariant = null;
  if (prod.product_variants?.length > 0) {
    selectedVariant = prod.product_variants.find(v => {
      const matchesColor = selectedColor ? v.variant_attribute_values?.some(a => a.attribute_value?.value === selectedColor) : true;
      const matchesSize = selectedSize ? v.size?.name === selectedSize : true;
      return matchesColor && matchesSize;
    });
    if (!selectedVariant && selectedColor) {
      selectedVariant = prod.product_variants.find(v => v.variant_attribute_values?.some(a => a.attribute_value?.value === selectedColor));
    }
  }

  let allSizesMeasurements = null;
  
  const filteredVariantsForMeasurements = prod.product_variants?.filter(v => {
    return selectedColor ? v.variant_attribute_values?.some(a => a.attribute_value?.value === selectedColor) : true;
  }) || [];

  if (filteredVariantsForMeasurements.some(v => v.variant_measurements?.length > 0)) {
    const uniqueSizes = [];
    const sizeMap = new Map();
    filteredVariantsForMeasurements.forEach(v => {
      if (v.size && v.variant_measurements && v.variant_measurements.length > 0) {
        if (!sizeMap.has(v.size.name)) {
          sizeMap.set(v.size.name, true);
          uniqueSizes.push(v.size.name);
        }
      }
    });

    const measTypes = new Map();
    filteredVariantsForMeasurements.forEach(v => {
      if (v.variant_measurements) {
        v.variant_measurements.forEach(m => {
          if (m.measurement_type) {
            measTypes.set(m.measurement_type.id, m.measurement_type.name);
          }
        });
      }
    });

    if (uniqueSizes.length > 0 && measTypes.size > 0) {
      const rows = Array.from(measTypes.keys()).map(mId => {
        const mName = measTypes.get(mId);
        const values = uniqueSizes.map(sName => {
          const variant = filteredVariantsForMeasurements.find(v => v.size?.name === sName && v.variant_measurements?.length > 0);
          if (variant) {
            const m = variant.variant_measurements.find(meas => meas.measurement_type?.id === mId);
            return m ? m.value : '-';
          }
          return '-';
        });
        return { name: mName, values };
      });

      allSizesMeasurements = {
        sizes: uniqueSizes,
        rows
      };
    }
  }

  let currentImgUrl = prod.cover_image;
  if (selectedColor) {
    const colorObj = colors.find(c => c.name === selectedColor);
    if (colorObj) currentImgUrl = colorObj.url;
  }

  return (
    <div style={{ padding: '12px', border: '1px solid #f0f0f0', borderRadius: '8px', marginBottom: '0px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ width: '60px', height: '75px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#f9f9f9' }}>
          <img src={getImageUrl(currentImgUrl)} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0', color: '#111', textTransform: 'uppercase' }}>{prod.name}</h4>
          
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '12px' }}>
            {colors.length > 0 && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Color {selectedColor ? `- ${selectedColor}` : ''}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {colors.map(color => (
                    <button
                      key={color.name}
                      className={selectedColor === color.name ? 'active' : ''}
                      onClick={() => { setSelectedColor(color.name); setSelectedSize(null); }}
                      title={color.name}
                      style={{ width: '32px', height: '40px', border: selectedColor === color.name ? '1px solid #111' : '1px solid transparent', padding: '2px', cursor: 'pointer', background: 'none' }}
                    >
                      <img src={getImageUrl(color.url)} alt={color.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {availableSizes.length > 0 && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Talla
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {availableSizes.map(size => (
                    <button
                      key={size.name}
                      className={selectedSize === size.name ? 'active' : ''}
                      onClick={() => setSelectedSize(size.name)}
                      disabled={!size.inStock}
                      style={{
                        minWidth: '28px', height: '28px', 
                        border: '1px solid #e5e5e5', 
                        backgroundColor: selectedSize === size.name ? '#111' : '#fff',
                        color: selectedSize === size.name ? '#fff' : (size.inStock ? '#111' : '#ccc'),
                        cursor: size.inStock ? 'pointer' : 'not-allowed',
                        fontSize: '11px'
                      }}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#111' }}>
              Bs {parseFloat(displayPrice || 0).toFixed(2)}
            </div>
            
            <button 
              onClick={handleAdd}
              disabled={isAddDisabled}
              style={{ 
                fontSize: '11px', 
                fontWeight: '600',
                padding: '6px 12px', 
                borderRadius: '4px', 
                backgroundColor: added ? '#22c55e' : 'transparent',
                color: added ? 'white' : (isAddDisabled ? '#ccc' : '#111'),
                border: added ? '1px solid #22c55e' : (isAddDisabled ? '1px solid #eee' : '1px solid #ccc'),
                cursor: isAddDisabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              {added ? <Check size={12} /> : 'Añadir'}
            </button>
            </div>

          <div style={{ marginTop: '16px', borderTop: '1px solid #eee' }}>
            <button
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666'
              }}
            >
              <span>Ver detalles</span>
              {isDetailsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {isDetailsOpen && (
              <div style={{ paddingBottom: '12px', fontSize: '13px' }}>
                {prod.description && (
                  <div style={{ marginBottom: '16px' }} dangerouslySetInnerHTML={{ __html: prod.description }} />
                )}
                
                {selectedVariant && selectedVariant.variant_attribute_values?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    
                    <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedVariant.variant_attribute_values.map(attr => (
                        <li key={attr.id || attr.attribute_value?.id} style={{ fontSize: '12px' }}>
                          <span style={{ fontWeight: '600', color: '#333' }}>{attr.attribute_value?.attribute?.name}:</span> <span style={{ color: '#666' }}>{attr.attribute_value?.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {allSizesMeasurements && (
                  <div>
                    <h4 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', marginBottom: '8px', fontWeight: '600' }}>Guía de Tallas (cm):</h4>
                    <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
                      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                            <th style={{ padding: '6px 8px', fontWeight: '600', color: '#666' }}>Medida</th>
                            {allSizesMeasurements.sizes.map(s => (
                              <th key={s} style={{ padding: '6px 8px', fontWeight: '600', color: '#666', textAlign: 'center' }}>Talla {s}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {allSizesMeasurements.rows.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: idx < allSizesMeasurements.rows.length - 1 ? '1px solid #eee' : 'none' }}>
                              <td style={{ padding: '6px 8px', color: '#333', fontWeight: '500' }}>{row.name}</td>
                              {row.values.map((val, vIdx) => (
                                <td key={vIdx} style={{ padding: '6px 8px', textAlign: 'center', color: '#666' }}>{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

}; // end ConfigurableBundleItem

const FixedBundleItem = ({ prod, variant, added, onAdd }) => {
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  // Resolve image
  let imgUrl = null;
  if (variant?.variant_images?.length > 0) {
    imgUrl = variant.variant_images[0].url;
  }
  if (!imgUrl && variant?.variant_attribute_values) {
    const colorAttrValue = variant.variant_attribute_values.find(vav =>
      prod.attribute_value_images?.some(img => img.attribute_value_id === vav.attribute_value_id)
    );
    if (colorAttrValue) {
      const colorImg = prod.attribute_value_images?.find(img => img.attribute_value_id === colorAttrValue.attribute_value_id);
      if (colorImg) imgUrl = colorImg.url;
    }
  }
  if (!imgUrl && prod.product_images?.length > 0) imgUrl = prod.product_images[0].url;
  if (!imgUrl) imgUrl = prod.cover_image;

  // Attribute badges
  const attrs = [];
  if (variant?.size) attrs.push(`Talla: ${variant.size.name}`);
  if (variant?.variant_attribute_values) {
    variant.variant_attribute_values.forEach(vav => {
      attrs.push(vav.attribute_value?.value || '');
    });
  }

  // Measurements table for this specific variant
  let measurements = null;
  if (variant?.variant_measurements?.length > 0) {
    const rows = variant.variant_measurements.map(m => ({
      name: m.measurement_type?.name || '',
      value: m.value,
    }));
    measurements = rows;
  }

  const displayPrice = parseFloat(variant?.price ?? prod?.base_price ?? 0).toFixed(2);

  return (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: '8px' }}>
      {/* Main row */}
      <div style={{ display: 'flex', gap: '16px', padding: '12px', alignItems: 'center' }}>
        <div style={{ width: '60px', height: '75px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#f9f9f9' }}>
          <img src={getImageUrl(imgUrl)} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0', color: '#111' }}>{prod.name}</h4>
          <div style={{ fontSize: '12px', color: '#666', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {attrs.map((attr, i) => (
              <span key={i} style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>{attr}</span>
            ))}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#111', marginTop: '6px' }}>
            Bs {displayPrice}
          </div>
        </div>

        <button
          onClick={() => onAdd(prod.id, variant?.id)}
          disabled={added}
          style={{
            fontSize: '11px', fontWeight: '600', padding: '6px 12px', borderRadius: '4px',
            backgroundColor: added ? '#22c55e' : 'transparent',
            color: added ? 'white' : '#111',
            border: added ? '1px solid #22c55e' : '1px solid #ccc',
            cursor: added ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s', flexShrink: 0
          }}
        >
          {added ? <Check size={12} /> : 'Añadir'}
        </button>
      </div>

      {/* Ver detalles accordion */}
      <div style={{ borderTop: '1px solid #f0f0f0' }}>
        <button
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666'
          }}
        >
          <span>Ver detalles</span>
          {isDetailsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {isDetailsOpen && (
          <div style={{ padding: '0 12px 14px', fontSize: '13px' }}>
            {prod.description && (
              <div style={{ marginBottom: '14px', color: '#555', lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{ __html: prod.description }} />
            )}

            {variant?.variant_attribute_values?.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {variant.variant_attribute_values.map(attr => (
                    <li key={attr.id || attr.attribute_value?.id} style={{ fontSize: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#333' }}>{attr.attribute_value?.attribute?.name}:</span>{' '}
                      <span style={{ color: '#666' }}>{attr.attribute_value?.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {measurements && measurements.length > 0 && (
              <div>
                <h4 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', marginBottom: '8px', fontWeight: '600' }}>Guía de Tallas (cm):</h4>
                <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
                  <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                        <th style={{ padding: '6px 8px', fontWeight: '600', color: '#666' }}>Medida</th>
                        <th style={{ padding: '6px 8px', fontWeight: '600', color: '#666', textAlign: 'center' }}>
                          {variant?.size ? `Talla ${variant.size.name}` : 'Valor'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: idx < measurements.length - 1 ? '1px solid #eee' : 'none' }}>
                          <td style={{ padding: '6px 8px', color: '#333', fontWeight: '500' }}>{row.name}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center', color: '#666', fontWeight: '600' }}>{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!prod.description && !variant?.variant_attribute_values?.length && !measurements?.length && (
              <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>Sin detalles adicionales.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const BundleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bundle, setBundle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [addedBundle, setAddedBundle] = useState(false);
  const [addedItems, setAddedItems] = useState({});
  const [itemsValidState, setItemsValidState] = useState({});
  // Tracks the selected variant/price for each configurable item
  const [selectionsMap, setSelectionsMap] = useState({});

  const handleItemValidation = React.useCallback((productId, isValid) => {
    setItemsValidState(prev => {
      if (prev[productId] === isValid) return prev;
      return { ...prev, [productId]: isValid };
    });
  }, []);

  const handleSelectionChange = React.useCallback((selection) => {
    setSelectionsMap(prev => ({ ...prev, [selection.productId]: selection }));
  }, []);

  
  const addToCart = useShopCartStore((state) => state.addToCart);
  const addBundleToCart = useShopCartStore((state) => state.addBundleToCart);

  const toggleWishlist = useShopWishlistStore((state) => state.toggleWishlist);
  const isInWishlist = useShopWishlistStore((state) => state.isInWishlist);
  const fetchWishlist = useShopWishlistStore((state) => state.fetchWishlist);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Fetch wishlist once so heart state is correct
  useEffect(() => {
    fetchWishlist().catch(() => {});
  }, []);

  useEffect(() => {
    const fetchBundle = async () => {
      setIsLoading(true);
      try {
        const response = await getProduct(id);
        if (response.data && response.data.is_bundle) {
          setBundle(response.data);
        } else {
          setError('Este producto no es un conjunto.');
        }
      } catch (err) {
        console.error("Error fetching bundle:", err);
        setError('No se pudo cargar el conjunto.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) fetchBundle();
  }, [id]);

  const handleAddBundle = async () => {
    try {
      // 1. Recopilar todos los ítems del bundle con sus precios originales
      const itemsToAdd = [];

      for (const item of bundle.bundle_items) {
        const prod = item.product;
        const variant = item.variant;
        if (!prod) continue;

        const isConfigurable =
          !variant &&
          (prod.product_variants?.length > 0 || prod.attribute_value_images?.length > 0);

        if (isConfigurable) {
          // Ítem configurable: usa la selección actual del usuario
          const sel = selectionsMap[prod.id];
          itemsToAdd.push({
            productId: prod.id,
            variantId: sel?.variantId || null,
            originalPrice: sel?.originalPrice ?? parseFloat(prod.base_price || 0),
            color: sel?.color || null,
            size: sel?.size || null,
          });
        } else {
          // Ítem fijo (variante preseleccionada)
          const variantPrice =
            variant?.price !== null && variant?.price !== undefined
              ? parseFloat(variant.price)
              : parseFloat(prod.base_price || 0);
          itemsToAdd.push({
            productId: prod.id,
            variantId: variant?.id || null,
            originalPrice: variantPrice,
            color: null,
            size: null,
          });
        }
      }

      if (itemsToAdd.length === 0) return;

      // 2. Distribuir el precio del bundle proporcionalmente según el precio original de cada ítem
      const bundlePrice = parseFloat(bundle.base_price || 0);
      const totalOriginal = itemsToAdd.reduce((sum, i) => sum + i.originalPrice, 0);

      const itemsWithBundlePrice = itemsToAdd.map((i) => ({
        ...i,
        bundleItemPrice:
          totalOriginal > 0
            ? parseFloat(((i.originalPrice / totalOriginal) * bundlePrice).toFixed(2))
            : parseFloat((bundlePrice / itemsToAdd.length).toFixed(2)),
      }));

      // 3. Agregar al carrito (cada ítem individualmente, compartiendo bundle_group_id)
      await addBundleToCart(bundle.id, itemsWithBundlePrice);
      setAddedBundle(true);
      setTimeout(() => setAddedBundle(false), 2000);
    } catch (e) {
      console.error('No se pudo añadir el conjunto:', e);
    }
  };

  const handleAddIndividualItem = async (itemId, variantId, color = null) => {
    try {
      await addToCart(itemId, variantId || null, 1, color);
      setAddedItems(prev => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setAddedItems(prev => ({ ...prev, [itemId]: false }));
      }, 2000);
    } catch (e) {
      console.error("No se pudo añadir el artículo:", e);
    }
  };

  

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #111', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
        <p style={{ color: '#666', fontSize: '1.2rem' }}>{error || 'Conjunto no encontrado'}</p>
        <button onClick={() => navigate('/shop')} style={{ padding: '12px 24px', backgroundColor: '#111', color: '#fff', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Volver a la tienda</button>
      </div>
    );
  }

  // Gather all bundle images for the gallery
  let galleryImages = [];
  if (bundle.cover_image) galleryImages.push(bundle.cover_image);
  
  if (bundle.product_images && bundle.product_images.length > 0) {
    bundle.product_images.forEach(img => {
      if (img.url !== bundle.cover_image) galleryImages.push(img.url);
    });
  }

  // Always gather images from the items so the user can see what's included
  if (bundle.bundle_items) {
    bundle.bundle_items.forEach(item => {
      const prod = item.product;
      const variant = item.variant;
      let imgAdded = false;

      if (variant && variant.variant_images?.length > 0) {
        variant.variant_images.forEach(img => galleryImages.push(img.url));
        imgAdded = true;
      } 
      
      if (!imgAdded && variant && variant.variant_attribute_values) {
        const colorAttrValue = variant.variant_attribute_values.find(vav => {
          return prod.attribute_value_images?.some(img => img.attribute_value_id === vav.attribute_value_id);
        });
        if (colorAttrValue) {
          const colorImgs = prod.attribute_value_images.filter(img => img.attribute_value_id === colorAttrValue.attribute_value_id);
          if (colorImgs.length > 0) {
            colorImgs.forEach(img => galleryImages.push(img.url));
            imgAdded = true;
          }
        }
      }

      if (!imgAdded && prod?.product_images?.length > 0) {
        prod.product_images.forEach(img => galleryImages.push(img.url));
        imgAdded = true;
      } 
      
      if (!imgAdded && prod?.cover_image) {
        galleryImages.push(prod.cover_image);
      }
    });
  }

  // Remove duplicates
  galleryImages = [...new Set(galleryImages)];

  if (galleryImages.length === 0) {
    galleryImages.push('https://via.placeholder.com/1200x600?text=Conjunto');
  }

  return (
    <div className="product-detail-page">
      {/* Breadcrumbs */}
      <div className="text-[11px] text-gray-500 uppercase tracking-widest mb-6 px-4 md:px-0" style={{ maxWidth: '1200px', margin: '0 auto 24px auto' }}>
        <Link to="/shop" className="hover:text-black transition-colors" style={{ textDecoration: 'none', color: 'inherit' }}>Inicio</Link>
        <span className="mx-2">/</span>
        <Link to={`/shop/catalog?category=${bundle.category?.id || ''}`} className="hover:text-black transition-colors" style={{ textDecoration: 'none', color: 'inherit' }}>
          {bundle.category?.name || 'Catálogo'}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black font-medium">{bundle.name} (Conjunto)</span>
      </div>

      <div className="product-detail-grid">
        {/* Left Column: Gallery */}
        <div className="product-gallery-container editorial-grid">
          {galleryImages.map((img, idx) => {
            // Pattern repeats every 7 items (excluding the cover at idx 0)
            let posClass = `pos-${idx === 0 ? 0 : ((idx - 1) % 7) + 1}`;
            return (
              <div 
                key={`gallery-${idx}`} 
                className={`product-gallery-item editorial-item ${posClass}`}
              >
                <img 
                  src={getImageUrl(img)} 
                  alt={`${bundle.name} - Imagen ${idx + 1}`} 
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </div>
            );
          })}
        </div>

        {/* Right Column: Info */}
        <div className="product-info-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#111', backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px', display: 'inline-block' }}>
                Conjunto
              </span>
              <h1 className="product-title" style={{ margin: 0 }}>{bundle.name}</h1>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Wishlist Heart Button — bundles have no variant, so variant_id = null */}
              {(() => {
                const inWishlist = isInWishlist(bundle.id, null);
                return (
                  <button
                    onClick={async () => {
                      if (wishlistLoading) return;
                      setWishlistLoading(true);
                      try {
                        await toggleWishlist(bundle.id, null);
                      } finally {
                        setWishlistLoading(false);
                      }
                    }}
                    disabled={wishlistLoading}
                    title={inWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    className="product-wishlist-btn"
                    style={{
                      width: '32px', height: '32px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%', border: 'none', cursor: wishlistLoading ? 'not-allowed' : 'pointer',
                      backgroundColor: inWishlist ? '#fff0f0' : '#f5f5f5',
                      color: inWishlist ? '#ef4444' : '#666',
                      transition: 'all 0.2s ease',
                      transform: wishlistLoading ? 'scale(0.9)' : 'scale(1)',
                    }}
                  >
                    <Heart
                      size={15}
                      fill={inWishlist ? '#ef4444' : 'none'}
                      strokeWidth={inWishlist ? 0 : 1.8}
                    />
                  </button>
                );
              })()}

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Enlace copiado al portapapeles");
                }}
                title="Copiar enlace"
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#f5f5f5', color: '#666', border: 'none', cursor: 'pointer' }}
              >
                <Copy size={15} />
              </button>
              <a
                href={`https://wa.me/?text=Mira%20este%20conjunto:%20${encodeURIComponent(bundle.name)}%20${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir por WhatsApp"
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#e6f7ed', color: '#10b981', textDecoration: 'none' }}
              >
                <Share2 size={15} />
              </a>
            </div>
          </div>
          
          <p className="product-price">Bs {parseFloat(bundle.base_price || 0).toFixed(2)}</p>

          {bundle.description && (
            <div className="mb-8 mt-4 text-gray-600 text-sm leading-relaxed">
              <p>{bundle.description}</p>
            </div>
          )}

          {/* Included Items List */}
          <div className="mb-8">
            <div className="variant-section-title" style={{ marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
              Artículos Incluidos ({bundle.bundle_items?.length || 0})
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bundle.bundle_items && bundle.bundle_items.map((item, index) => {
                const prod = item.product;
                const variant = item.variant;
                if (!prod) return null;

                if (!variant && (prod.product_variants?.length > 0 || prod.attribute_value_images?.length > 0)) {
                  return (
                    <ConfigurableBundleItem
                      key={item.id || index}
                      prod={prod}
                      added={addedItems[prod.id]}
                      onAdd={handleAddIndividualItem}
                      onValidationChange={(isValid) => handleItemValidation(prod.id, isValid)}
                      onSelectionChange={handleSelectionChange}
                    />
                  );
                }

                return (
                  <FixedBundleItem
                    key={item.id || index}
                    prod={prod}
                    variant={variant}
                    added={addedItems[prod.id]}
                    onAdd={handleAddIndividualItem}
                  />
                );
              })}
            </div>
          </div>

          {/* Add to Cart Bundle */}
          <div className="product-actions mt-8">
            {(() => {
              const configurableItems = bundle.bundle_items?.filter(item => !item.variant && (item.product?.product_variants?.length > 0 || item.product?.attribute_value_images?.length > 0)) || [];
              const isBundleValid = configurableItems.every(item => itemsValidState[item.product.id] === true);
              
              return (
                <>
                  <button 
                    className={`add-to-cart-btn w-full ${addedBundle ? 'btn-added-animate text-white' : ''}`}
                    onClick={handleAddBundle}
                    disabled={addedBundle || !isBundleValid}
                    style={{ opacity: (!isBundleValid && !addedBundle) ? 0.5 : 1, cursor: (!isBundleValid && !addedBundle) ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}
                  >
                    {addedBundle ? (
                      <>
                        <Check size={20} className="mr-2" />
                        Añadido a la cesta
                      </>
                    ) : (
                      'Añadir Conjunto a la Cesta'
                    )}
                  </button>
                  {!isBundleValid && (
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '12px', textAlign: 'center', fontWeight: '500' }}>
                      Por favor, selecciona la talla y color para todos los productos antes de añadir el conjunto.
                    </p>
                  )}
                </>
              );
            })()}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default BundleDetail;
