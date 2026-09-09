import { getImageUrl } from '../../../utils/imageUtils';
import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getProducts } from '../../../api/shop/products';
import { getCategories } from '../../../api/shop/categories';
import { API_BASE_URL } from '../../../config/api';
import { X, ShoppingBag } from 'lucide-react';
import CustomSelect from '../../../components/ui/CustomSelect';
import ProductCardMenu from '../components/ProductCardMenu';
import useShopWishlistStore from '../../../store/shop/useShopWishlistStore';
import './Catalog.css';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCategory = searchParams.get('category');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || null);

  useEffect(() => {
    if (selectedCategory) {
      setSearchParams({ category: selectedCategory }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [selectedCategory, setSearchParams]);

  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('prendas');
  const [imageMode, setImageMode] = useState('presentacion');
  const [expandedProductId, setExpandedProductId] = useState(null);
  const expandRef = useRef(null);

  // Quick Add / Quick View state
  const [quickAddProductId, setQuickAddProductId] = useState(null);
  const hoverTimers = useRef({});
  const [selectedQuickSize, setSelectedQuickSize] = useState({});
  const [selectedQuickColor, setSelectedQuickColor] = useState({});

  // Nuevos estados para filtros y paginación
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('recomendados');
  const [visibleCount, setVisibleCount] = useState(12);

  const categoriesFetchedRef = useRef(false);

  useEffect(() => {
    if (categoriesFetchedRef.current) return;
    categoriesFetchedRef.current = true;
    
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data?.data || response.data || []);
      } catch (error) {
        console.error('Error loading categories', error);
      } finally {
        setCategoriesLoaded(true);
      }
    };
    fetchCategories();
  }, []);

  // Removido fetchWishlist para no sobrecargar

  const lastFetchedCategoryRef = useRef(undefined);

  useEffect(() => {
    if (!categoriesLoaded) return;
    if (lastFetchedCategoryRef.current === selectedCategory) return; // Ya trajo estos datos recientemente

    lastFetchedCategoryRef.current = selectedCategory;

    const fetchCatalogItems = async () => {
      setIsLoading(true);
      try {
        // Obtenemos un límite alto (ej. 200) para poder hacer filtros, sort y búsqueda cliente-side
        // ya que el backend no soporta todo esto nativamente aún.
        const params = { per_page: 200 };
        if (selectedCategory) {
          const children = categories.filter(c => c.parent_id === selectedCategory);
          const ids = [selectedCategory, ...children.map(c => c.id)];
          params.category_id = ids.join(',');
        }
        const response = await getProducts(params);
        setProducts(response.data?.data || response.data || []);
        setVisibleCount(12); // Resetear paginación al cambiar de categoría
      } catch (error) {
        console.error('Error loading catalog items', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalogItems();
  }, [selectedCategory, categoriesLoaded, categories]);

  useEffect(() => {
    if (expandedProductId && expandRef.current) {
      setTimeout(() => {
        expandRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [expandedProductId]);

  

  // Extraer las variantes de un producto específico
  const getVariantsForProduct = (product) => {
    const variants = [];
    const attrImages = product.attribute_value_images || [];
    const mainColorImages = attrImages.filter(img => img.is_main);

    if (mainColorImages.length > 0) {
      mainColorImages.forEach((mainImg) => {
        if (mainImg.attribute_value) {
          let matchedVariant = null;
          if (product.product_variants) {
            const colorVariants = product.product_variants.filter(v => 
              v.variant_attribute_values?.some(vav => vav.attribute_value_id === mainImg.attribute_value_id)
            );
            if (colorVariants.length > 0) {
              matchedVariant = colorVariants.reduce((best, curr) => 
                (curr.discounted_price < best.discounted_price) ? curr : best
              , colorVariants[0]);
            }
          }

          variants.push({
            id: `img-${mainImg.id}`,
            name: mainImg.attribute_value.value,
            image: mainImg.url,
            color: mainImg.attribute_value.value,
            price: product.base_price,
            base_price: product.base_price,
            discounted_price: product.discounted_price,
            has_discount: product.has_discount,
            discount_label: product.discount_label
          });
        }
      });
    } else {
      const seenAttrs = new Set();
      (product.product_variants || []).forEach(variant => {
        if (variant.variant_images && variant.variant_images.length > 0) {
          const attrKey = (variant.variant_attribute_values || [])
            .map(va => va.attribute_value?.value || '')
            .sort().join(' ') || variant.id;
          if (!seenAttrs.has(attrKey)) {
            seenAttrs.add(attrKey);
            variants.push({
              id: `var-${variant.id}`,
              name: attrKey || 'Variante',
              image: variant.variant_images[0].url,
              price: product.base_price,
              base_price: product.base_price,
              discounted_price: product.discounted_price,
              has_discount: product.has_discount,
              discount_label: product.discount_label
            });
          }
        }
      });
    }

    if (variants.length === 0) {
      const imageUrl = product.cover_image || (product.product_images?.length > 0 ? product.product_images[0].url : null);
      if (imageUrl) {
        variants.push({
          id: `prod-${product.id}`,
          name: product.name,
          image: imageUrl,
          price: product.base_price,
          base_price: product.base_price,
          discounted_price: product.discounted_price,
          has_discount: product.has_discount,
          discount_label: product.discount_label
        });
      }
    }
    return variants;
  };
  // Extraer prendas (colores/variantes) con segunda imagen
  const getPrendas = () => {
    const prendas = [];
    products.forEach((product) => {
      const attrImages = product.attribute_value_images || [];
      const mainColorImages = attrImages.filter(img => img.is_main);

      if (mainColorImages.length > 0) {
        mainColorImages.forEach(mainImg => {
          const allImgsForColor = attrImages.filter(img => img.attribute_value_id === mainImg.attribute_value_id);
          const secondImg = allImgsForColor.length > 1
            ? (allImgsForColor.find(img => !img.is_main) || allImgsForColor[1])
            : mainImg;
            
          let matchedVariant = null;
          if (product.product_variants) {
            const colorVariants = product.product_variants.filter(v => 
              v.variant_attribute_values?.some(vav => vav.attribute_value_id === mainImg.attribute_value_id)
            );
            if (colorVariants.length > 0) {
              matchedVariant = colorVariants.reduce((best, curr) => 
                (curr.discounted_price < best.discounted_price) ? curr : best
              , colorVariants[0]);
            }
          }
          
          prendas.push({
            id: `img-${mainImg.id}`,
            product_id: product.id,
            slug: product.id,
            name: `${product.name} - ${mainImg.attribute_value?.value || ''}`,
            color: mainImg.attribute_value?.value || '',
            price: product.base_price,
            base_price: product.base_price,
            discounted_price: product.discounted_price,
            has_discount: product.has_discount,
            discount_label: product.discount_label,
            image: mainImg.url,
            image2: secondImg.url,
            active_discounts: product.active_discounts,
            is_bundle: product.is_bundle
          });
        });
      } else {
        const seenAttrs = new Set();
        let addedVariant = false;
        (product.product_variants || []).forEach(variant => {
          if (variant.variant_images && variant.variant_images.length > 0) {
            const attrKey = (variant.variant_attribute_values || [])
              .map(va => va.attribute_value?.value || '')
              .sort().join(' ') || variant.id;
            if (!seenAttrs.has(attrKey)) {
              seenAttrs.add(attrKey);
              addedVariant = true;
              const secondImg = variant.variant_images.length > 1 ? variant.variant_images[1] : variant.variant_images[0];
              prendas.push({
                id: `var-${variant.variant_images[0] ? variant.variant_images[0].id : variant.id}`,
                product_id: product.id,
                slug: product.id,
                name: `${product.name} ${attrKey ? '- ' + attrKey : ''}`,
                color: attrKey,
                price: product.base_price,
                base_price: product.base_price,
                discounted_price: product.discounted_price,
                has_discount: product.has_discount,
                discount_label: product.discount_label,
                image: variant.variant_images[0].url,
                image2: secondImg.url,
                active_discounts: product.active_discounts,
                is_bundle: product.is_bundle
              });
            }
          }
        });
        if (!addedVariant) {
          const imageUrl = product.cover_image || (product.product_images?.length > 0 ? product.product_images[0].url : null);
          const imageUrl2 = product.product_images?.length > 1 ? product.product_images[1].url : imageUrl;
          if (imageUrl) {
            prendas.push({
              id: `prod-${product.id}`,
              product_id: product.id,
              slug: product.id,
              name: product.name,
              price: product.base_price,
              base_price: product.base_price,
              discounted_price: product.discounted_price,
              has_discount: product.has_discount,
              discount_label: product.discount_label,
              image: imageUrl,
              image2: imageUrl2,
              is_bundle: product.is_bundle
            });
          }
        }
      }
    });
    return prendas;
  };

  const prendasItems = getPrendas();
  let baseItems = viewMode === 'producto' ? products : prendasItems;

  // 1. Filtrar por Búsqueda (Search)
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    baseItems = baseItems.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) || 
      (item.color && item.color.toLowerCase().includes(lowerQuery))
    );
  }

  // 2. Filtrar por Precio
  if (minPrice !== '') {
    baseItems = baseItems.filter(item => {
      const p = parseFloat(item.discounted_price || item.price || item.base_price || 0);
      return p >= parseFloat(minPrice);
    });
  }
  if (maxPrice !== '') {
    baseItems = baseItems.filter(item => {
      const p = parseFloat(item.discounted_price || item.price || item.base_price || 0);
      return p <= parseFloat(maxPrice);
    });
  }

  // 3. Procesar Conjuntos y Ordenar (Sort By)
  const processedItems = [...baseItems].map(item => {
    const originalProduct = products.find(p => p.id === (item.product_id || item.id));
    if (item.is_bundle && originalProduct?.bundle_items?.length > 0) {
      const sumBase = originalProduct.bundle_items.reduce((acc, bi) => acc + parseFloat(bi.product?.base_price || 0), 0);
      const bundlePrice = parseFloat(item.discounted_price || item.base_price || item.price || 0);
      if (sumBase > bundlePrice && bundlePrice > 0) {
        return {
          ...item,
          has_discount: true,
          base_price: sumBase,
          discounted_price: bundlePrice,
          discount_label: `- Bs ${(sumBase - bundlePrice).toFixed(2)}`
        };
      }
    }
    return item;
  }).sort((a, b) => {
    const priceA = parseFloat(a.discounted_price || a.price || a.base_price || 0);
    const priceB = parseFloat(b.discounted_price || b.price || b.base_price || 0);
    
    if (sortBy === 'price_asc') return priceA - priceB;
    if (sortBy === 'price_desc') return priceB - priceA;
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    return 0; // recomendados (default order from backend)
  });

  // 4. Paginación / Cargar Más
  const displayItems = processedItems.slice(0, visibleCount);

  const animationKey = `${viewMode}-${imageMode}-${selectedCategory}-${sortBy}-${searchQuery}`;

  const handleProductClick = (e, product) => {
    e.preventDefault();
    if (product.is_bundle) {
      navigate(`/shop/bundle/${product.id}`);
    } else {
      setExpandedProductId(expandedProductId === product.id ? null : product.id);
    }
  };

  // --- QUICK ADD LOGIC ---
  const handleMouseEnterCard = (productId) => {
    hoverTimers.current[productId] = setTimeout(() => {
      setQuickAddProductId(productId);
    }, 1500); // 1.5s to show popup automatically
  };

  const handleMouseLeaveCard = (productId) => {
    if (hoverTimers.current[productId]) {
      clearTimeout(hoverTimers.current[productId]);
    }
    setQuickAddProductId(null);
  };

  const getAvailableSizes = (product) => {
    if (!product.product_variants) return ['S', 'M', 'L'];
    const sizes = new Set();
    product.product_variants.forEach(v => {
      v.variant_attribute_values?.forEach(vav => {
        if (vav.attribute?.name?.toLowerCase() === 'talla' || vav.attribute?.name?.toLowerCase() === 'size') {
          sizes.add(vav.attribute_value.value);
        }
      });
    });
    return sizes.size > 0 ? Array.from(sizes) : ['S', 'M', 'L'];
  };

  const getAvailableColors = (product) => {
    const variants = getVariantsForProduct(product);
    return variants.filter(v => v.color).map(v => ({ name: v.color, image: v.image }));
  };

  const handleQuickAddClick = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (quickAddProductId === productId) {
      setQuickAddProductId(null); // toggle off
    } else {
      setQuickAddProductId(productId); // toggle on
    }
  };

  // Renderizar grid
  const renderProductGrid = () => {
    if (viewMode === 'producto') {
      // Agrupar en filas de 3 para insertar panel expandible entre filas
      const rows = [];
      for (let i = 0; i < displayItems.length; i += 3) {
        rows.push(displayItems.slice(i, i + 3));
      }

      return (
        <div key={animationKey} className="catalog-grid-animate">
          {rows.map((row, rowIdx) => {
            const expandedProduct = row.find(p => p.id === expandedProductId);
            return (
              <React.Fragment key={rowIdx}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: expandedProduct ? '0' : '40px' }}>
              {row.map((item) => {
                const imageUrl = item.cover_image || (item.product_images?.length > 0 ? item.product_images[0].url : null);
                const isExpanded = expandedProductId === item.id;
                return (
                  <div
                    key={item.id}
                    style={{ position: 'relative' }}
                  >
                    <div
                      onClick={(e) => handleProductClick(e, item)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: '#f5f5f5',
                        aspectRatio: '1 / 1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        outline: isExpanded ? '2px solid var(--text-main)' : 'none',
                        transition: 'outline 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {/* BOTÓN WISHLIST */}
                      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 3, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <ProductCardMenu productId={item.id} />
                        {item.has_discount && (
                          <div style={{ backgroundColor: 'var(--text-main)', color: 'var(--bg-main, #fff)', fontSize: '14px', fontWeight: '600', padding: '6px 12px', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', letterSpacing: '0.05em' }}>
                            {item.discount_label}
                          </div>
                        )}
                      </div>

                      {/* ETIQUETAS IZQUIERDA */}
                      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 2 }}>
                        {item.is_bundle && (
                          <div style={{ backgroundColor: '#111', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Conjunto
                          </div>
                        )}
                        {(item.is_new || (Math.random() < 0.15 && item.id % 2 === 0)) && (
                          <div style={{ backgroundColor: '#eab308', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Nuevo
                          </div>
                        )}
                        {(item.stock <= 0 || item.stock_quantity === 0 || item.in_stock === false) && (
                          <div style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Agotado
                          </div>
                        )}
                      </div>
                      {imageUrl ? (
                        <img
                          src={getImageUrl(imageUrl)}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
                          loading="lazy"
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          Sin Imagen
                        </div>
                      )}

                      {/* QUICK ADD POPOVER */}
                      {quickAddProductId === item.id && !item.is_bundle && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            padding: '16px',
                            borderTopLeftRadius: '12px',
                            borderTopRightRadius: '12px',
                            zIndex: 10,
                            boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
                            animation: 'slideUp 0.2s ease-out',
                            backdropFilter: 'blur(4px)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>Añadir Rápido</p>
                            <button onClick={() => setQuickAddProductId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                              <X size={16} />
                            </button>
                          </div>
                          
                          {/* Sizes */}
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            {getAvailableSizes(item).map(sz => (
                              <button 
                                key={sz}
                                onClick={() => setSelectedQuickSize(prev => ({...prev, [item.id]: sz}))}
                                style={{ 
                                  border: selectedQuickSize[item.id] === sz ? '1px solid var(--text-main)' : '1px solid var(--border-color)', 
                                  backgroundColor: selectedQuickSize[item.id] === sz ? 'var(--text-main)' : 'transparent',
                                  color: selectedQuickSize[item.id] === sz ? 'white' : 'var(--text-main)',
                                  padding: '4px 10px', 
                                  borderRadius: '4px', 
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>

                          {/* Colors */}
                          {getAvailableColors(item).length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                              {getAvailableColors(item).map((c, idx) => (
                                <div 
                                  key={idx}
                                  onClick={() => setSelectedQuickColor(prev => ({...prev, [item.id]: c.name}))}
                                  title={c.name}
                                  style={{
                                    width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer',
                                    border: selectedQuickColor[item.id] === c.name ? '2px solid var(--text-main)' : '1px solid var(--border-color)',
                                    backgroundImage: `url(${getImageUrl(c.image)})`,
                                    backgroundSize: 'cover', backgroundPosition: 'center',
                                    flexShrink: 0
                                  }}
                                />
                              ))}
                            </div>
                          )}

                          <button 
                            style={{ 
                              width: '100%', padding: '10px', 
                              backgroundColor: 'var(--text-main)', color: 'white', 
                              borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                              border: 'none', cursor: 'pointer',
                              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                            }}
                          >
                            <ShoppingBag size={16} /> Confirmar
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* INFO Y PRECIO */}
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '12px' }}>
                        <h3 
                          onClick={(e) => handleProductClick(e, item)}
                          style={{ fontSize: '15px', fontWeight: 400, color: 'var(--text-main)', lineHeight: '1.4', margin: 0, cursor: 'pointer' }}
                        >
                          {item.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {item.has_discount ? (
                            <>
                              <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-main)' }}>
                                Bs {parseFloat(item.discounted_price || 0).toFixed(2)}
                              </span>
                              <span style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                Bs {parseFloat(item.base_price || 0).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-main)' }}>
                              Bs {parseFloat(item.base_price || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {/* COLOR SWATCHES */}
                        {!item.is_bundle && getAvailableColors(item).length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                            {getAvailableColors(item).slice(0, 5).map((c, idx) => (
                              <div 
                                key={idx}
                                title={c.name}
                                style={{
                                  width: '14px', height: '14px', borderRadius: '50%',
                                  border: '1px solid var(--border-color)',
                                  backgroundImage: `url(${getImageUrl(c.image)})`,
                                  backgroundSize: 'cover', backgroundPosition: 'center',
                                }}
                              />
                            ))}
                            {getAvailableColors(item).length > 5 && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{getAvailableColors(item).length - 5}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* BOTON AÑADIR LATERAL */}
                      {!item.is_bundle && quickAddProductId !== item.id && (
                        <button
                          onClick={(e) => handleQuickAddClick(e, item.id)}
                          title="Añadir rápido"
                          style={{
                            background: 'var(--bg-input, #f3f4f6)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '50%',
                            width: '36px', height: '36px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-main)',
                            flexShrink: 0,
                            transition: 'all 0.2s ease',
                            marginTop: '2px'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--text-main)'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-input, #f3f4f6)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                        >
                          <ShoppingBag size={18} />
                        </button>
                      )}
                    </div>
                    {isExpanded && (
                      <div style={{
                        position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '12px solid transparent', borderRight: '12px solid transparent',
                        borderBottom: '12px solid var(--bg-card, #f0f0f0)',
                        zIndex: 2
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {expandedProduct && (
              <div
                ref={expandRef}
                className="catalog-expand-panel"
                style={{
                  marginBottom: '40px',
                  background: 'var(--bg-card, #f0f0f0)',
                  borderRadius: '12px',
                  padding: '32px',
                  position: 'relative',
                  animation: 'slideDown 0.3s ease-out'
                }}
              >
                <button
                  onClick={() => setExpandedProductId(null)}
                  style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex'
                  }}
                >
                  <X size={20} />
                </button>

                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                  {expandedProduct.name}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  Variantes disponibles
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                  {getVariantsForProduct(expandedProduct).map((variant) => (
                    <Link
                      key={variant.id}
                      to={`/shop/product/${expandedProduct.id}${variant.name ? `?color=${encodeURIComponent(variant.name)}` : ''}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="catalog-variant-card">
                        <div style={{ aspectRatio: '1/1', backgroundColor: '#f5f5f5', position: 'relative' }}>
                          {variant.has_discount && (
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              backgroundColor: 'var(--text-main)',
                              color: 'var(--bg-main, #fff)',
                              fontSize: '12px',
                              fontWeight: '600',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              zIndex: 2,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              letterSpacing: '0.05em'
                            }}>
                              {variant.discount_label}
                            </div>
                          )}
                          <img
                            src={getImageUrl(variant.image)}
                            alt={variant.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            loading="lazy"
                          />
                        </div>
                        <div style={{ padding: '12px' }}>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)', margin: '0 0 6px 0', lineHeight: '1.3' }}>
                            {variant.name}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {variant.has_discount ? (
                              <>
                                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                                  Bs {parseFloat(variant.discounted_price || 0).toFixed(2)}
                                </span>
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                  Bs {parseFloat(variant.base_price || variant.price || 0).toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                                Bs {parseFloat(variant.base_price || variant.price || 0).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
        </div>
      );
    }

    // Modo Prendas
    return (
      <div key={animationKey} className="catalog-grid-animate" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {displayItems.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron elementos.</p>
        ) : (
          displayItems.map((item) => {
            const isVividMode = imageMode === 'vivido';
            const imageUrl = isVividMode ? item.image2 : item.image;
            const linkUrl = item.is_bundle 
              ? `/shop/bundle/${item.slug}` 
              : `/shop/product/${item.slug}${item.color ? `?color=${encodeURIComponent(item.color)}` : ''}`;
            return (
              <div 
                key={item.id} 
                className="group relative block"
                style={{ position: 'relative' }}
              >
                <div
                  onClick={() => navigate(linkUrl)}
                  className="group-hover:opacity-90 transition-opacity"
                  style={{ cursor: 'pointer', backgroundColor: '#f5f5f5', aspectRatio: '1 / 1', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}
                >
                  {/* ETIQUETAS IZQUIERDA */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 2 }}>
                    {item.is_bundle && (
                      <div style={{ backgroundColor: '#111', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Conjunto
                      </div>
                    )}
                    {(item.is_new || (Math.random() < 0.15 && item.id % 2 === 0)) && (
                      <div style={{ backgroundColor: '#eab308', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Nuevo
                      </div>
                    )}
                    {(item.stock <= 0 || item.stock_quantity === 0 || item.in_stock === false) && (
                      <div style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Agotado
                      </div>
                    )}
                  </div>
                  {/* BOTÓN WISHLIST */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 3, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <ProductCardMenu 
                      productId={item.product_id || item.id} 
                      variantId={item.id.toString().startsWith('var-') ? item.id.replace('var-', '') : null} 
                    />
                    {item.has_discount && (
                      <div style={{ backgroundColor: 'var(--text-main)', color: 'var(--bg-main, #fff)', fontSize: '14px', fontWeight: '600', padding: '6px 12px', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', letterSpacing: '0.05em' }}>
                        {item.discount_label}
                      </div>
                    )}
                  </div>
                  {imageUrl ? (
                    <img
                      key={imageUrl}
                      src={getImageUrl(imageUrl)}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', animation: 'fadeIn 0.4s ease-in-out' }}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      Sin Imagen
                    </div>
                  )}

                  {/* QUICK ADD POPOVER PARA PRENDAS */}
                  {quickAddProductId === item.id && !item.is_bundle && (
                    <div 
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '16px',
                        borderTopLeftRadius: '12px',
                        borderTopRightRadius: '12px',
                        zIndex: 10,
                        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
                        animation: 'slideUp 0.2s ease-out',
                        backdropFilter: 'blur(4px)',
                        cursor: 'default'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>Añadir Rápido</p>
                        <button onClick={() => setQuickAddProductId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <X size={16} />
                        </button>
                      </div>
                      
                      {/* Sizes */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {getAvailableSizes(item).map(sz => (
                          <button 
                            key={sz}
                            onClick={() => setSelectedQuickSize(prev => ({...prev, [item.id]: sz}))}
                            style={{ 
                              border: selectedQuickSize[item.id] === sz ? '1px solid var(--text-main)' : '1px solid var(--border-color)', 
                              backgroundColor: selectedQuickSize[item.id] === sz ? 'var(--text-main)' : 'transparent',
                              color: selectedQuickSize[item.id] === sz ? 'white' : 'var(--text-main)',
                              padding: '4px 10px', 
                              borderRadius: '4px', 
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>

                      {/* Colors */}
                      {getAvailableColors(item).length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                          {getAvailableColors(item).map((c, idx) => (
                            <div 
                              key={idx}
                              onClick={() => setSelectedQuickColor(prev => ({...prev, [item.id]: c.name}))}
                              title={c.name}
                              style={{
                                width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer',
                                border: selectedQuickColor[item.id] === c.name ? '2px solid var(--text-main)' : '1px solid var(--border-color)',
                                backgroundImage: `url(${getImageUrl(c.image)})`,
                                backgroundSize: 'cover', backgroundPosition: 'center',
                                flexShrink: 0
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <button 
                        style={{ 
                          width: '100%', padding: '10px', 
                          backgroundColor: 'var(--text-main)', color: 'white', 
                          borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                          border: 'none', cursor: 'pointer',
                          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                        }}
                      >
                        <ShoppingBag size={16} /> Confirmar
                      </button>
                    </div>
                  )}
                </div>

                {/* INFO Y PRECIO */}
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '12px' }}>
                    <h3 
                      onClick={() => navigate(linkUrl)}
                      style={{ fontSize: '15px', fontWeight: 400, color: 'var(--text-main)', lineHeight: '1.4', margin: 0, cursor: 'pointer' }}
                    >
                      {item.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {item.has_discount ? (
                        <>
                          <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-main)' }}>
                            Bs {parseFloat(item.discounted_price || 0).toFixed(2)}
                          </span>
                          <span style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            Bs {parseFloat(item.base_price || item.price || 0).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-main)' }}>
                          Bs {parseFloat(item.base_price || item.price || 0).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {/* COLOR SWATCHES */}
                    {!item.is_bundle && getAvailableColors(item).length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                        {getAvailableColors(item).slice(0, 5).map((c, idx) => (
                          <div 
                            key={idx}
                            title={c.name}
                            style={{
                              width: '14px', height: '14px', borderRadius: '50%',
                              border: '1px solid var(--border-color)',
                              backgroundImage: `url(${getImageUrl(c.image)})`,
                              backgroundSize: 'cover', backgroundPosition: 'center',
                            }}
                          />
                        ))}
                        {getAvailableColors(item).length > 5 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{getAvailableColors(item).length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* BOTON AÑADIR LATERAL */}
                  {!item.is_bundle && quickAddProductId !== item.id && (
                    <button
                      onClick={(e) => handleQuickAddClick(e, item.id)}
                      title="Añadir rápido"
                      style={{
                        background: 'var(--bg-input, #f3f4f6)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '50%',
                        width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-main)',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                        marginTop: '2px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--text-main)'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-input, #f3f4f6)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                    >
                      <ShoppingBag size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 catalog-container" style={{ animation: 'pageEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {/* Mobile Filter Overlay */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 flex z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileFiltersOpen(false)} aria-hidden="true" />
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-12 shadow-xl" style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div className="flex items-center justify-between px-4">
              <h2 className="text-lg font-medium text-gray-900">Filtros</h2>
              <button
                type="button"
                className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400"
                onClick={() => setIsMobileFiltersOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            {/* Opciones de móvil copiadas del sidebar */}
            <div className="mt-4 border-t border-gray-200 px-4 py-6">
              {/* Buscador móvil */}
              <div style={{ marginBottom: '24px' }}>
                <input 
                  type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
              <h3 className="font-medium text-gray-900 mb-4">Categorías</h3>
              <ul className="space-y-4">
                <li>
                  <button onClick={() => { setSelectedCategory(null); setIsMobileFiltersOpen(false); }} className={selectedCategory === null ? 'font-bold' : ''}>Todas</button>
                </li>
                {categories.filter(c => !c.parent_id).map((parent) => {
                  const children = categories.filter(c => c.parent_id === parent.id);
                  return (
                    <React.Fragment key={parent.id}>
                      <li>
                        <button onClick={() => { setSelectedCategory(parent.id); setIsMobileFiltersOpen(false); }} className={selectedCategory === parent.id ? 'font-bold' : ''}>{parent.name}</button>
                      </li>
                      {children.map(child => (
                        <li key={child.id} className="ml-4 mt-2 text-sm text-gray-600">
                          <button onClick={() => { setSelectedCategory(child.id); setIsMobileFiltersOpen(false); }} className={selectedCategory === child.id ? 'font-bold text-black' : ''}>{child.name}</button>
                        </li>
                      ))}
                    </React.Fragment>
                  );
                })}
              </ul>
              <h3 className="font-medium text-gray-900 mt-8 mb-4">Precio (Bs)</h3>
              <div className="flex gap-2">
                <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min" className="w-1/2 p-2 border rounded" />
                <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max" className="w-1/2 p-2 border rounded" />
              </div>
              <h3 className="font-medium text-gray-900 mt-8 mb-4">Ordenar</h3>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full p-2 border rounded">
                <option value="recomendados">Recomendados</option>
                <option value="price_asc">Menor a Mayor</option>
                <option value="price_desc">Mayor a Menor</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between catalog-header-border pb-6 pt-24 flex-wrap gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight catalog-title">Catálogo</h1>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Botón Filtros Móvil */}
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setIsMobileFiltersOpen(true)}
            style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
          >
            Filtros
          </button>
          {viewMode === 'prendas' && (
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: 'var(--text-muted)' }}>
              <button
                onClick={() => setImageMode('presentacion')}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: imageMode === 'presentacion' ? 'var(--text-main)' : 'var(--text-muted)',
                  transition: 'color 0.2s ease', outline: 'none'
                }}
              >
                Presentación
              </button>
              <span>/</span>
              <button
                onClick={() => setImageMode('vivido')}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: imageMode === 'vivido' ? 'var(--text-main)' : 'var(--text-muted)',
                  transition: 'color 0.2s ease', outline: 'none'
                }}
              >
                Vívido
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '24px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
            <button
              onClick={() => { setViewMode('prendas'); setExpandedProductId(null); }}
              style={{
                background: 'none', border: 'none', padding: '0 0 4px 0', cursor: 'pointer',
                color: viewMode === 'prendas' ? 'var(--text-main)' : 'var(--text-muted)',
                borderBottom: viewMode === 'prendas' ? '1px solid var(--text-main)' : '1px solid transparent',
                transition: 'all 0.2s ease', outline: 'none'
              }}
            >
              Por Prendas
            </button>
            <button
              onClick={() => setViewMode('producto')}
              style={{
                background: 'none', border: 'none', padding: '0 0 4px 0', cursor: 'pointer',
                color: viewMode === 'producto' ? 'var(--text-main)' : 'var(--text-muted)',
                borderBottom: viewMode === 'producto' ? '1px solid var(--text-main)' : '1px solid transparent',
                transition: 'all 0.2s ease', outline: 'none'
              }}
            >
              Por Productos
            </button>
          </div>
        </div>
      </div>

      <section aria-labelledby="products-heading" className="pb-24 pt-6">
        <h2 id="products-heading" className="sr-only">Productos</h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4 relative items-start">
          <form className="hidden lg:block sticky top-28 self-start max-h-[calc(100vh-120px)] overflow-y-auto pr-4 custom-scrollbar">
            <h3 className="sr-only">Filtros</h3>
            
            {/* Buscador minimalista */}
            <div style={{ marginBottom: '24px' }}>
              <input 
                type="text" 
                placeholder="Buscar producto..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px 0', 
                  border: 'none',
                  borderBottom: '1px solid var(--border-color)', 
                  backgroundColor: 'transparent', 
                  color: 'var(--text-main)', 
                  fontSize: '14px', 
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderBottom = '1px solid var(--text-main)'}
                onBlur={(e) => e.target.style.borderBottom = '1px solid var(--border-color)'}
              />
            </div>

            {/* BREADCRUMBS */}
            <nav style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '32px' }}>
              <Link to="/" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>Inicio</Link>
              <span style={{ margin: '0 8px' }}>&gt;</span>
              <Link to="/shop/catalog" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>Catálogo</Link>
              {selectedCategory && (
                <>
                  <span style={{ margin: '0 8px' }}>&gt;</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {categories.find(c => c.id === selectedCategory)?.name || 'Categoría'}
                  </span>
                </>
              )}
            </nav>

            {/* Categorías */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-main)' }}>Categorías</h4>
              <ul role="list" className="space-y-3 catalog-filter-list pb-6 text-sm font-medium border-b border-gray-200">
                <li>
                  <button
                    type="button"
                    onClick={() => { setSelectedCategory(null); setExpandedProductId(null); }}
                    className={`catalog-filter-link ${selectedCategory === null ? 'active' : ''}`}
                    style={{ fontWeight: selectedCategory === null ? 700 : 400, color: selectedCategory === null ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '13px' }}
                  >
                    Todas las Categorías
                  </button>
                </li>
                {categories.filter(c => !c.parent_id).map((parent) => {
                  const children = categories.filter(c => c.parent_id === parent.id);
                  return (
                    <React.Fragment key={parent.id}>
                      <li style={{ marginTop: '12px' }}>
                        <button
                          type="button"
                          onClick={() => { setSelectedCategory(parent.id); setExpandedProductId(null); }}
                          className={`catalog-filter-link ${selectedCategory === parent.id ? 'active' : ''}`}
                          style={{ fontWeight: selectedCategory === parent.id ? 700 : 500, color: selectedCategory === parent.id ? 'var(--text-main)' : 'var(--text-main)', fontSize: '13px' }}
                        >
                          {parent.name}
                        </button>
                      </li>
                      {children.map(child => (
                        <li key={child.id} style={{ paddingLeft: '12px', marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => { setSelectedCategory(child.id); setExpandedProductId(null); }}
                            className={`catalog-filter-link ${selectedCategory === child.id ? 'active' : ''}`}
                            style={{ fontWeight: selectedCategory === child.id ? 600 : 400, color: selectedCategory === child.id ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '13px' }}
                          >
                            {child.name}
                          </button>
                        </li>
                      ))}
                    </React.Fragment>
                  );
                })}
              </ul>
            </div>

            {/* Filtro Precio minimalista */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-main)' }}>Precio (Bs)</h4>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min" 
                  style={{ width: '45%', padding: '6px 0', border: 'none', borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent', fontSize: '13px', outline: 'none' }}
                  onFocus={(e) => e.target.style.borderBottom = '1px solid var(--text-main)'}
                  onBlur={(e) => e.target.style.borderBottom = '1px solid var(--border-color)'}
                />
                <span style={{ color: 'var(--text-muted)' }}>-</span>
                <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max" 
                  style={{ width: '45%', padding: '6px 0', border: 'none', borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent', fontSize: '13px', outline: 'none' }}
                  onFocus={(e) => e.target.style.borderBottom = '1px solid var(--text-main)'}
                  onBlur={(e) => e.target.style.borderBottom = '1px solid var(--border-color)'}
                />
              </div>
            </div>

            {/* Ordenar por (CustomSelect) */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-main)' }}>Ordenar por</h4>
              <CustomSelect 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                style={{ backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', borderRadius: '0', padding: '0' }}
              >
                <option value="recomendados">Recomendados</option>
                <option value="price_asc">Precio: Menor a Mayor</option>
                <option value="price_desc">Precio: Mayor a Menor</option>
                <option value="name_asc">Nombre: A - Z</option>
              </CustomSelect>
            </div>
          </form>

          <div className="lg:col-span-3">
            {isLoading ? (
              <p style={{ color: 'var(--text-muted)' }}>Cargando catálogo...</p>
            ) : (
              <>
                {renderProductGrid()}
                {visibleCount < processedItems.length && (
                  <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 12)}
                      style={{ padding: '12px 32px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)', transition: 'all 0.2s' }}
                    >
                      Cargar Más
                    </button>
                    <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      Mostrando {visibleCount} de {processedItems.length} productos
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Catalog;
