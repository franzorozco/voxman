import { getImageUrl } from '../../../utils/imageUtils';
import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getProducts } from '../../../api/shop/products';
import { getCategories } from '../../../api/shop/categories';
import { API_BASE_URL } from '../../../config/api';
import { X, ShoppingBag } from 'lucide-react';
import CustomSelect from '../../../components/ui/CustomSelect';

import { useDebounce } from 'use-debounce';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';

import useShopWishlistStore from '../../../store/shop/useShopWishlistStore';
import useShopCartStore from '../../../store/shop/useShopCartStore';
import { useShopSettingsStore } from '../../../store/shop/useShopSettingsStore';
import './Catalog.css';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const addToCart = useShopCartStore(state => state.addItem);
  const [addedAnimationItems, setAddedAnimationItems] = useState({});
  // 🔒 Solo aceptar UUIDs válidos desde la URL (evita enviar basura al backend)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const rawCategory = searchParams.get('category');
  const initialCategory = rawCategory && UUID_RE.test(rawCategory) ? rawCategory : null;

  // ── Settings del Dashboard ──
  const { settings: shopSettings, fetchSettings: fetchShopSettings } = useShopSettingsStore();
  useEffect(() => { fetchShopSettings(); }, [fetchShopSettings]);

  // Helper para leer un setting con fallback
  const cfg = (key, fallback) => shopSettings?.[key] ?? fallback;

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
  const [viewMode, setViewMode] = useState(null);
  const [imageMode, setImageMode] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const expandRef = useRef(null);

  // Aplicar defaults del dashboard cuando los settings carguen
  useEffect(() => {
    if (shopSettings && Object.keys(shopSettings).length > 0) {
      setViewMode(prev => prev === null ? (shopSettings.catalog_default_view || 'prendas') : prev);
      setImageMode(prev => prev === null ? (shopSettings.catalog_default_image_mode || 'presentacion') : prev);
      setSortBy(prev => prev === null ? (shopSettings.catalog_default_sort || 'recomendados') : prev);
    }
  }, [shopSettings]);

  // Quick Add / Quick View state
  const [quickAddProductId, setQuickAddProductId] = useState(null);
  const hoverTimers = useRef({});
  const [selectedQuickSize, setSelectedQuickSize] = useState({});
  const [selectedQuickColor, setSelectedQuickColor] = useState({});

  // Nuevos estados para filtros y paginación
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300); // 300ms debounce
  const [minPrice, setMinPrice] = useState('');
  const [debouncedMinPrice] = useDebounce(minPrice, 300);
  const [maxPrice, setMaxPrice] = useState('');
  const [debouncedMaxPrice] = useDebounce(maxPrice, 300);
  const [sortBy, setSortBy] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);


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

  // Reiniciar la página y limpiar productos cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
    setHasMore(true);
  }, [selectedCategory, debouncedSearchQuery, debouncedMinPrice, debouncedMaxPrice, sortBy]);

  // Obtener productos desde el backend (paginación server-side)
  useEffect(() => {
    if (!categoriesLoaded) return;
    if (!hasMore && currentPage > 1) return;

    const fetchCatalogItems = async () => {
      if (currentPage === 1) setIsLoading(true);
      
      try {
        const perPage = parseInt(cfg('catalog_products_per_page', '12'), 10);
        const params = { page: currentPage, per_page: perPage };

        if (selectedCategory) {
          const children = categories.filter(c => c.parent_id === selectedCategory);
          const ids = [selectedCategory, ...children.map(c => c.id)];
          params.category_id = ids.join(',');
        }
        if (debouncedSearchQuery) params.search = debouncedSearchQuery;
        if (debouncedMinPrice) params.min_price = debouncedMinPrice;
        if (debouncedMaxPrice) params.max_price = debouncedMaxPrice;
        if (sortBy) params.list_type = sortBy;

        const response = await getProducts(params);
        const fetchedProducts = response.data?.data || response.data || [];

        setProducts(prev => {
          if (currentPage === 1) return fetchedProducts;
          // Evitar duplicados
          const newProducts = fetchedProducts.filter(fp => !prev.some(p => p.id === fp.id));
          return [...prev, ...newProducts];
        });

        if (fetchedProducts.length < perPage) {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error loading catalog items', error);
      } finally {
        if (currentPage === 1) setIsLoading(false);
      }
    };

    fetchCatalogItems();
  }, [categoriesLoaded, currentPage, selectedCategory, debouncedSearchQuery, debouncedMinPrice, debouncedMaxPrice, sortBy, categories]);

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
  // Extraer prendas (colores/variantes) con segunda imagen solo si estamos en modo prendas
  const prendasItems = React.useMemo(() => {
    if ((viewMode || 'prendas') === 'producto') return [];
    
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
            image2: secondImg?.url || mainImg.url,
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
                image2: secondImg?.url || variant.variant_images[0].url,
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
  }, [products, viewMode]);

  const baseItems = (viewMode || 'prendas') === 'producto' ? products : prendasItems;

  // 1. Procesar Bundle Pricing (Filtros ya aplicados por el backend)
  const processedItems = React.useMemo(() => {
    return [...baseItems].map(item => {
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
    });
  }, [baseItems, products]);

  // 4. Paginación / Cargar Más: Eliminamos el slice() ya que la paginación es por servidor
  const displayItems = processedItems;

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
    if ((viewMode || 'prendas') === 'producto') {
      // Agrupar en filas según columnas configuradas
      const colCount = parseInt(cfg('catalog_grid_cols_desktop', '3'), 10);
      const rows = [];
      for (let i = 0; i < displayItems.length; i += colCount) {
        rows.push(displayItems.slice(i, i + colCount));
      }

      return (
        <Virtuoso
          useWindowScroll
          data={rows}
          endReached={() => {
            if (hasMore && !isLoading) setCurrentPage(p => p + 1);
          }}
          itemContent={(rowIdx, row) => {
            const expandedProduct = row.find(p => p.id === expandedProductId);
            return (
              <div key={rowIdx}>
                <div className="catalog-products-row" style={{ marginBottom: expandedProduct ? '0' : `${cfg('catalog_grid_gap', '24')}px`,  }}>
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
                        backgroundColor: cfg('catalog_card_bg', '#f5f5f5'),
                        aspectRatio: cfg('catalog_card_aspect_ratio', '1 / 1'),
                        borderRadius: `${cfg('catalog_card_border_radius', '8')}px`,
                        overflow: 'hidden',
                        outline: isExpanded ? '2px solid var(--text-main)' : 'none',
                        transition: 'outline 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {/* BOTÓN WISHLIST */}
                      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 3, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        {item.has_discount && cfg('catalog_badge_show_discount', '1') !== '0' && (
                          <div style={{ backgroundColor: cfg('catalog_badge_discount_bg', 'var(--text-main)'), color: cfg('catalog_badge_discount_text', 'var(--bg-main, #fff)'), fontSize: `${cfg('catalog_badge_discount_size', '14')}px`, fontWeight: '600', padding: '6px 12px', borderRadius: `${cfg('catalog_badge_discount_radius', '4')}px`, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', letterSpacing: '0.05em' }}>
                            {item.discount_label}
                          </div>
                        )}
                      </div>

                      {/* ETIQUETAS IZQUIERDA */}
                      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 2 }}>
                        {item.is_bundle && cfg('catalog_badge_show_bundle', '1') !== '0' && (
                          <div style={{ backgroundColor: cfg('catalog_badge_bundle_bg', '#111'), color: cfg('catalog_badge_bundle_text_color', '#fff'), fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {cfg('catalog_badge_bundle_text', 'Conjunto')}
                          </div>
                        )}
                        {item.is_new && cfg('catalog_badge_show_new', '1') !== '0' && (
                          <div style={{ backgroundColor: cfg('catalog_badge_new_bg', '#eab308'), color: cfg('catalog_badge_new_text_color', '#fff'), fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {cfg('catalog_badge_new_text', 'Nuevo')}
                          </div>
                        )}
                        {(item.stock <= 0 || item.stock_quantity === 0 || item.in_stock === false) && cfg('catalog_badge_show_soldout', '1') !== '0' && (
                          <div style={{ backgroundColor: cfg('catalog_badge_soldout_bg', '#ef4444'), color: cfg('catalog_badge_soldout_text_color', '#fff'), fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {cfg('catalog_badge_soldout_text', 'Agotado')}
                          </div>
                        )}
                      </div>
                      {imageUrl ? (
                        <img
                          src={getImageUrl(imageUrl)}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: cfg('catalog_card_object_fit', 'contain'), objectPosition: 'center' }}
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
                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0, flex: 1 }}>
                        <h3
                          onClick={(e) => handleProductClick(e, item)}
                          style={{ fontSize: `${cfg('catalog_card_name_size', '13')}px`, fontWeight: parseInt(cfg('catalog_card_name_weight', '400')), color: cfg('catalog_card_name_color', 'var(--text-main)'), lineHeight: '1.4', margin: 0, cursor: 'pointer', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: cfg('catalog_card_name_lines', '2') === 'none' ? 'unset' : cfg('catalog_card_name_lines', '2'), WebkitBoxOrient: 'vertical' }}
                        >
                          {item.name}
                        </h3>
                        {/* PRECIOS — nowrap garantizado por clase CSS */}
                        <div className="catalog-card-price-row">
                          {item.has_discount ? (
                            <>
                              <span className="catalog-card-price" style={{ fontSize: `${cfg('catalog_card_price_size', '14')}px`, color: cfg('catalog_card_price_color', 'var(--text-main)') }}>
                                Bs {parseFloat(item.discounted_price || 0).toFixed(2)}
                              </span>
                              <span className="catalog-card-price-original" style={{ color: cfg('catalog_card_price_old_color', 'var(--text-muted)') }}>
                                Bs {parseFloat(item.base_price || 0).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="catalog-card-price" style={{ fontSize: `${cfg('catalog_card_price_size', '14')}px`, color: cfg('catalog_card_price_color', 'var(--text-main)') }}>
                              Bs {parseFloat(item.base_price || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {/* COLOR SWATCHES */}
                        {cfg('catalog_show_swatches', '1') !== '0' && !item.is_bundle && getAvailableColors(item).length > 0 && (
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {getAvailableColors(item).slice(0, parseInt(cfg('catalog_max_swatches', '5'))).map((c, idx) => (
                              <div
                                key={idx}
                                title={c.name}
                                style={{
                                  width: `${cfg('catalog_swatch_size', '13')}px`, height: `${cfg('catalog_swatch_size', '13')}px`, borderRadius: '50%',
                                  border: '1px solid var(--border-color)',
                                  backgroundImage: `url(${getImageUrl(c.image)})`,
                                  backgroundSize: 'cover', backgroundPosition: 'center',
                                }}
                              />
                            ))}
                            {getAvailableColors(item).length > parseInt(cfg('catalog_max_swatches', '5')) && (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{getAvailableColors(item).length - parseInt(cfg('catalog_max_swatches', '5'))}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* BOTÓN AÑADIR RÁPIDO con animación pop */}
                      {cfg('catalog_show_quick_add', '1') !== '0' && !item.is_bundle && quickAddProductId !== item.id && (
                        <button
                          className="catalog-card-add-btn"
                          onClick={(e) => {
                            const btn = e.currentTarget; // capturar ANTES de que React limpie currentTarget
                            btn.classList.add('pop');
                            setTimeout(() => {
                              if (btn.isConnected) btn.classList.remove('pop'); // solo si sigue en el DOM
                            }, 400);
                            handleQuickAddClick(e, item.id);
                          }}
                          title="Añadir rápido"
                        >
                          <ShoppingBag size={17} />
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
              </div>
            );
          }}
        />
      );
    }

    // Modo Prendas
    return (
      <VirtuosoGrid
        useWindowScroll
        data={displayItems}
        endReached={() => {
          if (hasMore && !isLoading) setCurrentPage(p => p + 1);
        }}
        components={{
          List: React.forwardRef(({ style, children, ...props }, ref) => (
            <div
              ref={ref}
              {...props}
              style={style}
              className="catalog-grid-animate catalog-products-grid"
            >
              {children}
            </div>
          )),
          Item: ({ children, ...props }) => (
            <div {...props}>
              {children}
            </div>
          )
        }}
        itemContent={(index, item) => {
          const isVividMode = (imageMode || 'presentacion') === 'vivido';
          const imageUrl = isVividMode ? item.image2 : item.image;
          const linkUrl = item.is_bundle 
            ? `/shop/bundle/${item.slug}` 
            : `/shop/product/${item.slug}${item.color ? `?color=${encodeURIComponent(item.color)}` : ''}`;
          return (
            <div 
              className="group relative block"
              style={{ position: 'relative' }}
            >
              <div
                onClick={() => navigate(linkUrl)}
                className="group-hover:opacity-90 transition-opacity"
                style={{ cursor: 'pointer', backgroundColor: cfg('catalog_card_bg', '#f5f5f5'), aspectRatio: cfg('catalog_card_aspect_ratio', '1 / 1'), borderRadius: `${cfg('catalog_card_border_radius', '8')}px`, overflow: 'hidden', position: 'relative' }}
              >
                  {/* ETIQUETAS IZQUIERDA */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 2 }}>
                    {item.is_bundle && cfg('catalog_badge_show_bundle', '1') !== '0' && (
                      <div style={{ backgroundColor: cfg('catalog_badge_bundle_bg', '#111'), color: cfg('catalog_badge_bundle_text_color', '#fff'), fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {cfg('catalog_badge_bundle_text', 'Conjunto')}
                      </div>
                    )}
                    {item.is_new && cfg('catalog_badge_show_new', '1') !== '0' && (
                      <div style={{ backgroundColor: cfg('catalog_badge_new_bg', '#eab308'), color: cfg('catalog_badge_new_text_color', '#fff'), fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {cfg('catalog_badge_new_text', 'Nuevo')}
                      </div>
                    )}
                    {(item.stock <= 0 || item.stock_quantity === 0 || item.in_stock === false) && cfg('catalog_badge_show_soldout', '1') !== '0' && (
                      <div style={{ backgroundColor: cfg('catalog_badge_soldout_bg', '#ef4444'), color: cfg('catalog_badge_soldout_text_color', '#fff'), fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {cfg('catalog_badge_soldout_text', 'Agotado')}
                      </div>
                    )}
                  </div>
                  {/* BOTÓN WISHLIST */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 3, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {item.has_discount && cfg('catalog_badge_show_discount', '1') !== '0' && (
                      <div style={{ backgroundColor: cfg('catalog_badge_discount_bg', 'var(--text-main)'), color: cfg('catalog_badge_discount_text', 'var(--bg-main, #fff)'), fontSize: `${cfg('catalog_badge_discount_size', '14')}px`, fontWeight: '600', padding: '6px 12px', borderRadius: `${cfg('catalog_badge_discount_radius', '4')}px`, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', letterSpacing: '0.05em' }}>
                        {item.discount_label}
                      </div>
                    )}
                  </div>
                  {imageUrl ? (
                    <img
                      key={imageUrl}
                      src={getImageUrl(imageUrl)}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: cfg('catalog_card_object_fit', 'contain'), objectPosition: 'center', animation: 'fadeIn 0.4s ease-in-out' }}
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
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                    <h3
                      onClick={() => navigate(linkUrl)}
                      style={{ fontSize: `${cfg('catalog_card_name_size', '13')}px`, fontWeight: parseInt(cfg('catalog_card_name_weight', '400')), color: cfg('catalog_card_name_color', 'var(--text-main)'), lineHeight: '1.4', margin: 0, cursor: 'pointer', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: cfg('catalog_card_name_lines', '2') === 'none' ? 'unset' : cfg('catalog_card_name_lines', '2'), WebkitBoxOrient: 'vertical' }}
                    >
                      {item.name}
                    </h3>
                    {/* PRECIOS — nowrap por clase CSS */}
                    <div className="catalog-card-price-row">
                      {item.has_discount ? (
                        <>
                          <span className="catalog-card-price" style={{ fontSize: `${cfg('catalog_card_price_size', '14')}px`, color: cfg('catalog_card_price_color', 'var(--text-main)') }}>
                            Bs {parseFloat(item.discounted_price || 0).toFixed(2)}
                          </span>
                          <span className="catalog-card-price-original" style={{ color: cfg('catalog_card_price_old_color', 'var(--text-muted)') }}>
                            Bs {parseFloat(item.base_price || item.price || 0).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="catalog-card-price" style={{ fontSize: `${cfg('catalog_card_price_size', '14')}px`, color: cfg('catalog_card_price_color', 'var(--text-main)') }}>
                          Bs {parseFloat(item.base_price || item.price || 0).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {/* COLOR SWATCHES */}
                    {cfg('catalog_show_swatches', '1') !== '0' && !item.is_bundle && getAvailableColors(item).length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {getAvailableColors(item).slice(0, parseInt(cfg('catalog_max_swatches', '5'))).map((c, idx) => (
                          <div
                            key={idx}
                            title={c.name}
                            style={{
                              width: `${cfg('catalog_swatch_size', '13')}px`, height: `${cfg('catalog_swatch_size', '13')}px`, borderRadius: '50%',
                              border: '1px solid var(--border-color)',
                              backgroundImage: `url(${getImageUrl(c.image)})`,
                              backgroundSize: 'cover', backgroundPosition: 'center',
                            }}
                          />
                        ))}
                        {getAvailableColors(item).length > parseInt(cfg('catalog_max_swatches', '5')) && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{getAvailableColors(item).length - parseInt(cfg('catalog_max_swatches', '5'))}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* BOTÓN AÑADIR RÁPIDO con animación pop */}
                  {cfg('catalog_show_quick_add', '1') !== '0' && !item.is_bundle && quickAddProductId !== item.id && (
                    <button
                      className="catalog-card-add-btn"
                      onClick={(e) => {
                        const btn = e.currentTarget; // capturar ANTES de que React limpie currentTarget
                        btn.classList.add('pop');
                        setTimeout(() => {
                          if (btn.isConnected) btn.classList.remove('pop'); // solo si sigue en el DOM
                        }, 400);
                        handleQuickAddClick(e, item.id);
                      }}
                      title="Añadir rápido"
                    >
                      <ShoppingBag size={17} />
                    </button>
                  )}
                </div>
              </div>
          );
        }}
      />
    );
  };

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  return (
    <div className="catalog-container" style={{
      maxWidth: `${cfg('catalog_max_width', '1280')}px`,
      margin: '0 auto',
      padding: '0 16px 80px',
      animation: 'pageEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      '--catalog-cols-desktop': cfg('catalog_grid_cols_desktop', '3'),
      '--catalog-cols-tablet': cfg('catalog_grid_cols_tablet', '2'),
      '--catalog-cols-mobile': cfg('catalog_grid_cols_mobile', '2'),
      '--catalog-grid-gap': `${cfg('catalog_grid_gap', '24')}px`,
    }}>
      {/* ── OVERLAY FILTROS MÓVIL ── */}
      {isMobileFiltersOpen && (
        <>
          <div className="catalog-mobile-overlay-backdrop" onClick={() => setIsMobileFiltersOpen(false)} />
          <div className="catalog-mobile-filter-panel">
            <div className="catalog-mobile-filter-header">
              <h2 className="catalog-mobile-filter-title">Filtros</h2>
              <button className="catalog-mobile-filter-close" onClick={() => setIsMobileFiltersOpen(false)}>
                <X size={22} />
              </button>
            </div>

            {/* Buscador */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text" placeholder="Buscar producto..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={100}
                className="catalog-filter-input"
              />
            </div>

            {/* Categorías */}
            <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-main)', marginBottom: '12px' }}>Categorías</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <button className="catalog-filter-link" style={{ fontWeight: selectedCategory === null ? 700 : 400, color: selectedCategory === null ? 'var(--text-main)' : 'var(--text-muted)' }}
                  onClick={() => { setSelectedCategory(null); setIsMobileFiltersOpen(false); }}>
                  Todas
                </button>
              </li>
              {categories.filter(c => !c.parent_id).map((parent) => {
                const children = categories.filter(c => c.parent_id === parent.id);
                return (
                  <React.Fragment key={parent.id}>
                    <li>
                      <button className="catalog-filter-link" style={{ fontWeight: selectedCategory === parent.id ? 700 : 500, color: 'var(--text-main)' }}
                        onClick={() => { setSelectedCategory(parent.id); setIsMobileFiltersOpen(false); }}>
                        {parent.name}
                      </button>
                    </li>
                    {children.map(child => (
                      <li key={child.id} style={{ paddingLeft: '14px' }}>
                        <button className="catalog-filter-link" style={{ fontWeight: selectedCategory === child.id ? 600 : 400, color: selectedCategory === child.id ? 'var(--text-main)' : 'var(--text-muted)' }}
                          onClick={() => { setSelectedCategory(child.id); setIsMobileFiltersOpen(false); }}>
                          {child.name}
                        </button>
                      </li>
                    ))}
                  </React.Fragment>
                );
              })}
            </ul>

            {/* Precio */}
            <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-main)', marginBottom: '12px' }}>Precio (Bs)</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min" className="catalog-filter-input" style={{ flex: 1 }} />
              <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>—</span>
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max" className="catalog-filter-input" style={{ flex: 1 }} />
            </div>

            {/* Ordenar */}
            <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-main)', marginBottom: '12px' }}>Ordenar</h3>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="catalog-filter-input">
              <option value="recomendados">Recomendados</option>
              <option value="price_asc">Menor a Mayor</option>
              <option value="price_desc">Mayor a Menor</option>
              <option value="name_asc">Nombre: A - Z</option>
            </select>
          </div>
        </>
      )}

      {/* ── HEADER: Título + Controles ── */}
      <div className="catalog-header">
        <h1 className="catalog-title" style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
          {cfg('catalog_title', 'Catálogo')}
        </h1>

        {/* Breadcrumbs — solo visibles en móvil, bajo el título */}
        <nav className="catalog-header-breadcrumb">
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{cfg('catalog_breadcrumb_home', 'Inicio')}</Link>
          <span className="catalog-breadcrumb-sep">›</span>
          <span style={{ color: 'var(--text-main)' }}>{cfg('catalog_title', 'Catálogo')}</span>
          {selectedCategory && (
            <>
              <span className="catalog-breadcrumb-sep">›</span>
              <span style={{ color: 'var(--text-muted)' }}>
                {categories.find(c => c.id === selectedCategory)?.name || 'Categoría'}
              </span>
            </>
          )}
        </nav>

        <div className="catalog-controls">
          {/* Botón Filtros — orden 1 en móvil */}
          <button
            type="button"
            className="catalog-btn-filters"
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            Filtros
          </button>

          {/* Vista: Por Prendas / Por Productos — orden 2 en móvil (sube al lado de Filtros) */}
          {cfg('catalog_show_view_toggle', '1') !== '0' && (
            <div className="catalog-view-controls">
              <button
                onClick={() => { setViewMode('prendas'); setExpandedProductId(null); }}
                style={{
                  background: 'none', border: 'none', padding: '0 0 3px 0', cursor: 'pointer',
                  color: (viewMode || 'prendas') === 'prendas' ? 'var(--text-main)' : 'var(--text-muted)',
                  borderBottom: (viewMode || 'prendas') === 'prendas' ? '1px solid var(--text-main)' : '1px solid transparent',
                  transition: 'all 0.2s ease', outline: 'none',
                  fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit'
                }}
              >
                {cfg('catalog_label_prendas', 'Por Prendas')}
              </button>
              <button
                onClick={() => setViewMode('producto')}
                style={{
                  background: 'none', border: 'none', padding: '0 0 3px 0', cursor: 'pointer',
                  color: (viewMode || 'prendas') === 'producto' ? 'var(--text-main)' : 'var(--text-muted)',
                  borderBottom: (viewMode || 'prendas') === 'producto' ? '1px solid var(--text-main)' : '1px solid transparent',
                  transition: 'all 0.2s ease', outline: 'none',
                  fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit'
                }}
              >
                {cfg('catalog_label_productos', 'Por Productos')}
              </button>
            </div>
          )}

          {/* Modo imagen: Presentación / Vívido — orden 3 en móvil (baja a su propia fila) */}
          {(viewMode || 'prendas') === 'prendas' && cfg('catalog_show_image_toggle', '1') !== '0' && (
            <div className="catalog-image-controls">
              <button
                onClick={() => setImageMode('presentacion')}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: (imageMode || 'presentacion') === 'presentacion' ? 'var(--text-main)' : 'var(--text-muted)',
                  transition: 'color 0.2s ease', outline: 'none', fontWeight: 'inherit',
                  fontSize: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit'
                }}
              >
                {cfg('catalog_label_presentacion', 'Presentación')}
              </button>
              <span style={{ color: 'var(--border-color)' }}>/</span>
              <button
                onClick={() => setImageMode('vivido')}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: (imageMode || 'presentacion') === 'vivido' ? 'var(--text-main)' : 'var(--text-muted)',
                  transition: 'color 0.2s ease', outline: 'none', fontWeight: 'inherit',
                  fontSize: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit'
                }}
              >
                {cfg('catalog_label_vivido', 'Vívido')}
              </button>
            </div>
          )}
        </div>
      </div>

      <section aria-labelledby="products-heading" style={{ paddingBottom: '60px', paddingTop: '24px' }}>
        <h2 id="products-heading" className="sr-only">Productos</h2>
        <div className="catalog-layout" style={{ "--sidebar-width": `${cfg("catalog_sidebar_width", "220")}px`, "--sidebar-gap": `${cfg("catalog_sidebar_gap", "40")}px` }}>

          {/* ── SIDEBAR FILTROS (solo desktop) ── */}
          <form style={{ display: 'block' }} className="catalog-sidebar">
            <h3 className="sr-only">Filtros</h3>

            {/* Buscador */}
            {cfg('catalog_show_search', '1') !== '0' && (
            <div style={{ marginBottom: '24px' }}>
              <input
                type="text"
                placeholder={cfg('catalog_search_placeholder', 'Buscar producto...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={100}
                style={{
                  width: '100%', padding: '8px 0', border: 'none',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'transparent', color: 'var(--text-main)',
                  fontSize: '14px', outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderBottom = '1px solid var(--text-main)'}
                onBlur={(e) => e.target.style.borderBottom = '1px solid var(--border-color)'}
              />
            </div>
            )}

            {/* Breadcrumbs */}
            {cfg('catalog_show_breadcrumbs', '1') !== '0' && (
            <nav style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '32px' }}>
              <Link to="/" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>{cfg('catalog_breadcrumb_home', 'Inicio')}</Link>
              <span style={{ margin: '0 8px' }}>&gt;</span>
              <Link to="/shop/catalog" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>{cfg('catalog_title', 'Catálogo')}</Link>
              {selectedCategory && (
                <>
                  <span style={{ margin: '0 8px' }}>&gt;</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {categories.find(c => c.id === selectedCategory)?.name || 'Categoría'}
                  </span>
                </>
              )}
            </nav>
            )}

            {/* Categorías */}
            {cfg('catalog_show_categories', '1') !== '0' && (
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-main)' }}>{cfg('catalog_sidebar_categories_title', 'Categorías')}</h4>
              <ul role="list" className="catalog-filter-list" style={{ listStyle: 'none', padding: 0, margin: 0, paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li>
                  <button type="button" className="catalog-filter-link"
                    onClick={() => { setSelectedCategory(null); setExpandedProductId(null); }}
                    style={{ fontWeight: selectedCategory === null ? 700 : 400, color: selectedCategory === null ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {cfg('catalog_sidebar_all_categories', 'Todas las Categorías')}
                  </button>
                </li>
                {categories.filter(c => !c.parent_id).map((parent) => {
                  const children = categories.filter(c => c.parent_id === parent.id);
                  return (
                    <React.Fragment key={parent.id}>
                      <li>
                        <button type="button" className="catalog-filter-link"
                          onClick={() => { setSelectedCategory(parent.id); setExpandedProductId(null); }}
                          style={{ fontWeight: selectedCategory === parent.id ? 700 : 500, color: 'var(--text-main)' }}>
                          {parent.name}
                        </button>
                      </li>
                      {children.map(child => (
                        <li key={child.id} style={{ paddingLeft: '12px' }}>
                          <button type="button" className="catalog-filter-link"
                            onClick={() => { setSelectedCategory(child.id); setExpandedProductId(null); }}
                            style={{ fontWeight: selectedCategory === child.id ? 600 : 400, color: selectedCategory === child.id ? 'var(--text-main)' : 'var(--text-muted)' }}>
                            {child.name}
                          </button>
                        </li>
                      ))}
                    </React.Fragment>
                  );
                })}
              </ul>
            </div>
            )}

            {/* Precio */}
            {cfg('catalog_show_price_filter', '1') !== '0' && (
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-main)' }}>{cfg('catalog_sidebar_price_title', 'Precio (Bs)')}</h4>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min"
                  style={{ width: '45%', padding: '6px 0', border: 'none', borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent', fontSize: '13px', outline: 'none', color: 'var(--text-main)' }}
                  onFocus={(e) => e.target.style.borderBottom = '1px solid var(--text-main)'}
                  onBlur={(e) => e.target.style.borderBottom = '1px solid var(--border-color)'}
                />
                <span style={{ color: 'var(--text-muted)' }}>—</span>
                <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max"
                  style={{ width: '45%', padding: '6px 0', border: 'none', borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent', fontSize: '13px', outline: 'none', color: 'var(--text-main)' }}
                  onFocus={(e) => e.target.style.borderBottom = '1px solid var(--text-main)'}
                  onBlur={(e) => e.target.style.borderBottom = '1px solid var(--border-color)'}
                />
              </div>
            </div>
            )}

            {/* Ordenar por */}
            {cfg('catalog_show_sort', '1') !== '0' && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-main)' }}>{cfg('catalog_sidebar_sort_title', 'Ordenar por')}</h4>
              <CustomSelect
                value={sortBy || 'recomendados'}
                onChange={e => setSortBy(e.target.value)}
                style={{ backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', borderRadius: '0', padding: '0' }}
              >
                {cfg('catalog_sort_show_recomendados', '1') !== '0' && <option value="recomendados">Recomendados</option>}
                {cfg('catalog_sort_show_price_asc', '1') !== '0' && <option value="price_asc">Precio: Menor a Mayor</option>}
                {cfg('catalog_sort_show_price_desc', '1') !== '0' && <option value="price_desc">Precio: Mayor a Menor</option>}
                {cfg('catalog_sort_show_name_asc', '1') !== '0' && <option value="name_asc">Nombre: A - Z</option>}
              </CustomSelect>
            </div>
            )}
          </form>

          {/* ── ÁREA DE PRODUCTOS ── */}
          <div>
            {isLoading ? (
              <p style={{ color: 'var(--text-muted)', paddingTop: '40px' }}>Cargando catálogo...</p>
            ) : (
              <>
                {renderProductGrid()}
                {isLoading && (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Cargando más productos...
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


