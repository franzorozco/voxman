import { getImageUrl } from '../../../utils/imageUtils';
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getProduct, getProducts } from '../../../api/shop/products';
import useShopCartStore from '../../../store/shop/useShopCartStore';
import { API_BASE_URL } from '../../../config/api';
import { ChevronDown, ChevronUp, Share2, Copy, Check } from 'lucide-react';
import { VideoPlayer } from '../../../components/ui/videoHelpers';
import './ProductDetail.css';



const ZoomableImage = ({ src, alt, className }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const updatePosition = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  };

  const handleMouseDown = (e) => {
    setIsZoomed(true);
    updatePosition(e);
  };

  const handleMouseMove = (e) => {
    if (isZoomed) {
      updatePosition(e);
    }
  };

  const handleMouseUp = () => {
    setIsZoomed(false);
  };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        transformOrigin: `${position.x}% ${position.y}%`,
        transform: isZoomed ? 'scale(2.5)' : undefined,
        cursor: isZoomed ? 'grabbing' : 'zoom-in',
        transition: isZoomed ? 'none' : 'transform 0.5s ease',
      }}
      draggable={false}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Read color from URL if present
  const searchParams = new URLSearchParams(location.search);
  const colorFromUrl = searchParams.get('color');

  // Selections
  const [selectedColor, setSelectedColor] = useState(colorFromUrl || null);
  const [selectedSize, setSelectedSize] = useState(null);
  
  // Images to display
  const [displayImages, setDisplayImages] = useState([]);
  
  // Accordions
  const [openAccordion, setOpenAccordion] = useState('description');
  
  // Animation State
  const [addedAnimation, setAddedAnimation] = useState(false);

  const addToCart = useShopCartStore((state) => state.addToCart);
  const isCartLoading = useShopCartStore((state) => state.isLoading);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      try {
        const response = await getProduct(id);
        const data = response.data?.data || response.data;
        setProduct(data);
        
        // Fetch related products
        if (data.category_id || data.category?.id) {
          try {
            const catId = data.category_id || data.category.id;
            const relRes = await getProducts({ category_id: catId, per_page: 5 });
            const relProds = relRes.data?.data || relRes.data || [];
            // filter out current product
            const otherProds = relProds.filter(p => p.id !== data.id);
            const extractedVariants = [];
            
            otherProds.forEach(prod => {
              const attrImages = prod.attribute_value_images || [];
              const mainColorImages = attrImages.filter(img => img.is_main);
              
              if (mainColorImages.length > 0) {
                mainColorImages.forEach(img => {
                  extractedVariants.push({
                    id: `var-${prod.id}-${img.id}`,
                    productId: prod.id,
                    colorName: img.attribute_value?.value || '',
                    productName: prod.name,
                    image: img.url,
                    price: prod.price || prod.base_price,
                    hasDiscount: prod.has_discount || false,
                    discountedPrice: prod.discounted_price || prod.base_price,
                    discountLabel: prod.discount_label || null
                  });
                });
              } else {
                extractedVariants.push({
                  id: `prod-${prod.id}`,
                  productId: prod.id,
                  colorName: '',
                  productName: prod.name,
                  image: prod.cover_image || (prod.product_images && prod.product_images[0]?.url) || '',
                  price: prod.price || prod.base_price,
                  hasDiscount: prod.has_discount || false,
                  discountedPrice: prod.discounted_price || prod.base_price,
                  discountLabel: prod.discount_label || null
                });
              }
            });
            // Take up to 4
            setRelatedProducts(extractedVariants.slice(0, 4));
          } catch (e) {
            console.error('Error fetching related products', e);
          }
        }
        
        // Initialize default selections
        let defaultColor = colorFromUrl || null;
        
        // Find default color only if no color was provided in the URL
        if (!defaultColor) {
          if (data.attribute_value_images?.length > 0) {
            const mainColorImg = data.attribute_value_images.find(img => img.is_main) || data.attribute_value_images[0];
            defaultColor = mainColorImg.attribute_value?.value;
          } else if (data.product_variants?.length > 0) {
            const firstVariant = data.product_variants.find(v => v.variant_attribute_values?.some(attr => attr.attribute_value?.attribute?.name?.toLowerCase().includes('color')));
            if (firstVariant) {
              const colorAttr = firstVariant.variant_attribute_values.find(attr => attr.attribute_value?.attribute?.name?.toLowerCase().includes('color'));
              defaultColor = colorAttr?.attribute_value?.value;
            }
          }
        }
        
        setSelectedColor(defaultColor);
        updateDisplayImages(data, defaultColor);
        
      } catch (error) {
        console.error('Error loading product details', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const updateDisplayImages = (prod, color) => {
    let images = [];
    
    if (color && prod.attribute_value_images?.length > 0) {
      const colorImages = prod.attribute_value_images.filter(img => img.attribute_value?.value === color);
      if (colorImages.length > 0) {
        images = colorImages.map(img => img.url);
      }
    }
    
    if (images.length === 0 && color && prod.product_variants?.length > 0) {
      const variantWithColor = prod.product_variants.find(v => 
        v.variant_attribute_values?.some(attr => attr.attribute_value?.value === color)
      );
      if (variantWithColor && variantWithColor.variant_images?.length > 0) {
        images = variantWithColor.variant_images.map(img => img.url);
      }
    }
    
    if (images.length === 0) {
      images = (prod.product_images || []).map(img => img.url);
    }
    
    if (images.length === 0 && prod.cover_image) {
      images = [prod.cover_image];
    }
    
    setDisplayImages(images);
  };

  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName);
    setSelectedSize(null);
    updateDisplayImages(product, colorName);
  };

  const handleAddToCart = async () => {
    let variantId = null;
    if (product.product_variants?.length > 0) {
      const matchedVariant = product.product_variants.find(v => {
        const matchesColor = selectedColor ? v.variant_attribute_values?.some(a => a.attribute_value?.value === selectedColor) : true;
        const matchesSize = selectedSize ? v.size?.name === selectedSize : true;
        return matchesColor && matchesSize;
      });
      variantId = matchedVariant?.id || null;
    }
    
    try {
      await addToCart(product.id, variantId, 1, selectedColor);
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 2000);
    } catch (e) {
      console.error("Could not add to cart:", e);
    }
  };

  if (isLoading) {
    return (
      <div className="product-detail-loading">
        <div className="loader-spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page flex items-center justify-center">
        <p className="text-gray-500">Producto no encontrado</p>
      </div>
    );
  }

  const uniqueColorsMap = new Map();
  if (product.attribute_value_images) {
    product.attribute_value_images.forEach(img => {
      const c = img.attribute_value?.value;
      if (c && !uniqueColorsMap.has(c)) {
        uniqueColorsMap.set(c, img.url);
      }
    });
  }
  
  if (uniqueColorsMap.size === 0 && product.product_variants) {
    product.product_variants.forEach(v => {
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
  if (product.product_variants) {
    product.product_variants.forEach(v => {
      const matchesColor = selectedColor ? v.variant_attribute_values?.some(a => a.attribute_value?.value === selectedColor) : true;
      if (matchesColor && v.size) {
        // Calculate stock safely
        let stock = 0;
        if (v.inventories && v.inventories.length > 0) {
          stock = v.inventories.reduce((sum, inv) => sum + Number(inv.stock || 0), 0);
        } else if (v.stock !== undefined) {
          stock = Number(v.stock);
        }

        // Only show size if there is actual stock
        if (stock > 0) {
          if (!availableSizes.some(s => s.name === v.size.name)) {
            availableSizes.push({
              name: v.size.name,
              inStock: true
            });
          }
        }
      }
    });
  }

  let selectedVariant = null;
  let selectedVariantStock = 0;
  if (product.product_variants?.length > 0) {
    selectedVariant = product.product_variants.find(v => {
      const matchesColor = selectedColor ? v.variant_attribute_values?.some(a => a.attribute_value?.value === selectedColor) : true;
      const matchesSize = selectedSize ? v.size?.name === selectedSize : true;
      return matchesColor && matchesSize;
    });
    if (!selectedVariant && selectedColor) {
      selectedVariant = product.product_variants.find(v => v.variant_attribute_values?.some(a => a.attribute_value?.value === selectedColor));
    }
    
    if (selectedVariant) {
      if (selectedVariant.inventories && selectedVariant.inventories.length > 0) {
        selectedVariantStock = selectedVariant.inventories.reduce((sum, inv) => sum + Number(inv.stock || 0), 0);
      } else if (selectedVariant.stock !== undefined) {
        selectedVariantStock = Number(selectedVariant.stock);
      }
    }
  }

  let originalPrice = product.price || product.base_price;
  let displayPrice = originalPrice;
  let hasDiscount = product.has_discount || false;
  let discountLabel = product.discount_label || null;

  if (product.has_discount) {
    displayPrice = product.discounted_price;
  }

  if (selectedVariant && (selectedVariant.price || selectedVariant.price === 0)) {
      originalPrice = selectedVariant.base_price || selectedVariant.price;
      displayPrice = selectedVariant.has_discount ? selectedVariant.discounted_price : originalPrice;
      hasDiscount = selectedVariant.has_discount || false;
      discountLabel = selectedVariant.discount_label || null;
  }

  let allSizesMeasurements = null;
  if (product.product_variants?.some(v => v.variant_measurements?.length > 0)) {
    const uniqueSizes = [];
    const sizeMap = new Map();
    product.product_variants.forEach(v => {
      if (v.size && v.variant_measurements && v.variant_measurements.length > 0) {
        if (!sizeMap.has(v.size.name)) {
          sizeMap.set(v.size.name, true);
          uniqueSizes.push(v.size.name);
        }
      }
    });

    const measTypes = new Map();
    product.product_variants.forEach(v => {
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
          const variant = product.product_variants.find(v => v.size?.name === sName && v.variant_measurements?.length > 0);
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

  return (
    <div className="product-detail-page">
      {/* Breadcrumbs */}
      <div className="text-[11px] text-gray-500 uppercase tracking-widest mb-6 px-4 md:px-0" style={{ maxWidth: '1200px', margin: '0 auto 24px auto' }}>
        <Link to="/shop" className="hover:text-black transition-colors" style={{ textDecoration: 'none', color: 'inherit' }}>Inicio</Link>
        <span className="mx-2">/</span>
        <Link to={`/shop/catalog?category=${product.category?.id || ''}`} className="hover:text-black transition-colors" style={{ textDecoration: 'none', color: 'inherit' }}>
          {product.category?.name || 'Catálogo'}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black font-medium">{product.name}</span>
      </div>

      <div className="product-detail-grid">
        
        {/* Left Column: Gallery */}
        <div className="product-gallery-container">
          {/* Imágenes normales */}
          {displayImages.length > 0 ? (
            displayImages.map((img, idx) => (
              <div key={`${img}-${idx}`} className="product-gallery-item">
                <ZoomableImage src={getImageUrl(img)} alt={`${product.name} - Imagen ${idx + 1}`} className="product-gallery-img" />
              </div>
            ))
          ) : (
            <div className="product-gallery-item flex items-center justify-center">
              <span className="text-gray-400">Sin imagen</span>
            </div>
          )}

          {/* Videos de Shorts relacionados con el producto */}
          {product.shorts && product.shorts.length > 0 && product.shorts.map((short, idx) => (
            <div key={`short-${short.id || idx}`} className="product-gallery-item bg-black">
              <VideoPlayer
                url={short.video_url}
                className="w-full h-full object-cover"
                autoPlay={true}
              />
            </div>
          ))}
        </div>

        {/* Right Column: Info */}
        <div className="product-info-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <h1 className="product-title" style={{ margin: 0, flex: 1 }}>{product.name}</h1>
            <div style={{ display: 'flex', gap: '8px' }}>
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
                href={`https://wa.me/?text=Mira%20este%20producto:%20${encodeURIComponent(product.name)}%20${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir por WhatsApp"
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#e6f7ed', color: '#10b981', textDecoration: 'none' }}
              >
                <Share2 size={15} />
              </a>
            </div>
          </div>
          {hasDiscount ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <p className="product-price">Bs {parseFloat(displayPrice || 0).toFixed(2)}</p>
              <p style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '1.25rem' }}>Bs {parseFloat(originalPrice || 0).toFixed(2)}</p>
              <span style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 600 }}>
                {discountLabel}
              </span>
            </div>
          ) : (
            <p className="product-price">Bs {parseFloat(displayPrice || 0).toFixed(2)}</p>
          )}

          {/* Color Selector */}
          {colors.length > 0 && (
            <div className="mb-8">
              <div className="variant-section-title">
                Color {selectedColor ? `- ${selectedColor}` : ''}
              </div>
              <div className="color-selector">
                {colors.map(color => (
                  <button
                    key={color.name}
                    className={`color-btn ${selectedColor === color.name ? 'active' : ''}`}
                    onClick={() => handleColorSelect(color.name)}
                    title={color.name}
                  >
                    <img src={getImageUrl(color.url)} alt={color.name} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {availableSizes.length > 0 && (
            <div className="mb-8">
              <div className="variant-section-title">
                Talla
              </div>
              <div className="size-selector">
                {availableSizes.map(size => (
                  <button
                    key={size.name}
                    className={`size-btn ${selectedSize === size.name ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size.name)}
                    disabled={!size.inStock}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock Notifier */}
          {selectedSize && selectedVariantStock === 1 && (
            <div style={{ marginTop: '-20px', marginBottom: '24px', fontSize: '13px', color: '#ef4444', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
              ¡Date prisa, quedan pocas unidades!
            </div>
          )}

          {/* Add to Cart */}
          <button
            className={`add-to-cart-btn ${addedAnimation ? 'bg-green-500 text-white border-green-500' : ''}`}
            onClick={handleAddToCart}
            disabled={isCartLoading || (availableSizes.length > 0 && !selectedSize) || addedAnimation}
            style={addedAnimation ? { backgroundColor: '#10b981', color: '#fff', borderColor: '#10b981' } : {}}
          >
            {isCartLoading ? 'Añadiendo...' : addedAnimation ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Check size={18} /> ¡Añadido!
              </span>
            ) : 'Añadir a la cesta'}
          </button>

          {/* Accordions */}
          <div className="mt-8">
            <div className="accordion-item">
              <button 
                className="accordion-header"
                onClick={() => setOpenAccordion(openAccordion === 'description' ? null : 'description')}
              >
                <span>Descripción</span>
                {openAccordion === 'description' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className={`accordion-content ${openAccordion === 'description' ? 'open' : ''}`}>
                <div className="accordion-body">
                  <div dangerouslySetInnerHTML={{ __html: product.description || 'Sin descripción detallada.' }} />
                  
                  {selectedVariant && selectedVariant.variant_attribute_values?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-[11px] uppercase tracking-wider mb-2 text-gray-500">Atributos de la Variable:</h4>
                      <ul className="space-y-1">
                        {selectedVariant.variant_attribute_values.map(attr => (
                          <li key={attr.id || attr.attribute_value?.id} className="text-[13px]">
                            <span className="font-medium text-gray-800">{attr.attribute_value?.attribute?.name}:</span> <span className="text-gray-600">{attr.attribute_value?.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {allSizesMeasurements && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-[11px] uppercase tracking-wider mb-3 text-gray-500">Guía de Tallas (cm):</h4>
                      <div className="overflow-x-auto rounded border border-gray-200">
                        <table className="w-full text-left text-sm border-collapse min-w-[300px]">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="p-2.5 border-b border-gray-200 font-medium text-gray-700 text-[11px] uppercase tracking-wider">Parte / Medida</th>
                              {allSizesMeasurements.sizes.map(s => (
                                <th key={s} className="p-2.5 border-b border-gray-200 font-medium text-gray-700 text-[11px] uppercase tracking-wider text-center w-20">Talla {s}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {allSizesMeasurements.rows.map((row, idx) => (
                              <tr key={idx} className="border-b border-gray-100 last:border-0">
                                <td className="p-2.5 text-gray-600 text-[13px]">{row.name}</td>
                                {row.values.map((val, vIdx) => (
                                  <td key={vIdx} className="p-2.5 text-center font-semibold text-gray-800 text-[13px]">{val}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="accordion-item">
              <button 
                className="accordion-header"
                onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
              >
                <span>Envío y Devoluciones</span>
                {openAccordion === 'shipping' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className={`accordion-content ${openAccordion === 'shipping' ? 'open' : ''}`}>
                <div className="accordion-body">
                  <p>Los envíos se realizan en un plazo de 24 a 48 horas laborables.</p>
                  <p className="mt-2">Dispones de 30 días desde la fecha de envío para realizar una devolución de tu compra de manera gratuita.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h3 className="related-products-title">También podría interesarte</h3>
          <div className="related-products-grid">
            {relatedProducts.map(rel => {
              const linkUrl = `/shop/product/${rel.productId}${rel.colorName ? `?color=${encodeURIComponent(rel.colorName)}` : ''}`;
              return (
                <Link to={linkUrl} key={rel.id} className="related-product-card">
                  <div className="related-product-card" style={{ position: 'relative' }}>
                    <div className="related-product-image-wrapper">
                      {rel.image ? (
                        <img src={getImageUrl(rel.image)} alt={rel.productName} />
                      ) : (
                        <div className="related-product-no-image">Sin imagen</div>
                      )}
                      {rel.hasDiscount && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'var(--color-danger)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                          {rel.discountLabel}
                        </div>
                      )}
                    </div>
                    <h4 className="related-product-name">{rel.productName}</h4>
                    {rel.hasDiscount ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                        <p className="related-product-price" style={{ color: 'var(--color-danger)', margin: 0 }}>Bs {parseFloat(rel.discountedPrice || 0).toFixed(2)}</p>
                        <p style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '12px', margin: 0 }}>Bs {parseFloat(rel.price || 0).toFixed(2)}</p>
                      </div>
                    ) : (
                      <p className="related-product-price">Bs {parseFloat(rel.price || 0).toFixed(2)}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
