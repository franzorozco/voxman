import { getImageUrl } from '../../../utils/imageUtils';
import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getProducts } from '../../../api/shop/products';
import { getCategories } from '../../../api/shop/categories';
import { API_BASE_URL } from '../../../config/api';
import { X } from 'lucide-react';
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

  useEffect(() => {
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

  useEffect(() => {
    if (!categoriesLoaded) return; // Evitar doble carga esperando a las categorías

    const fetchCatalogItems = async () => {
      setIsLoading(true);
      try {
        const params = { per_page: 50 };
        if (selectedCategory) {
          // Obtener la categoría y sus posibles hijos
          const children = categories.filter(c => c.parent_id === selectedCategory);
          const ids = [selectedCategory, ...children.map(c => c.id)];
          params.category_id = ids.join(',');
        }
        const response = await getProducts(params);
        setProducts(response.data?.data || response.data || []);
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
          variants.push({
            id: `img-${mainImg.id}`,
            name: mainImg.attribute_value.value,
            image: mainImg.url,
            price: product.base_price,
            color: mainImg.attribute_value.value
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
              price: variant.price || product.base_price
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
          price: product.base_price
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
          prendas.push({
            id: `img-${mainImg.id}`,
            product_id: product.id,
            slug: product.id,
            name: `${product.name} - ${mainImg.attribute_value?.value || ''}`,
            color: mainImg.attribute_value?.value || '',
            price: product.base_price,
            image: mainImg.url,
            image2: secondImg.url,
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
                id: `var-${variant.variant_images[0].id}`,
                product_id: product.id,
                slug: product.id,
                name: `${product.name} ${attrKey ? '- ' + attrKey : ''}`,
                color: attrKey,
                price: variant.price || product.base_price,
                image: variant.variant_images[0].url,
                image2: secondImg.url,
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
  const displayItems = viewMode === 'producto' ? products : prendasItems;
  const animationKey = `${viewMode}-${imageMode}-${selectedCategory}`;

  const handleProductClick = (e, product) => {
    e.preventDefault();
    if (product.is_bundle) {
      navigate(`/shop/bundle/${product.id}`);
    } else {
      setExpandedProductId(expandedProductId === product.id ? null : product.id);
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
                    onClick={(e) => handleProductClick(e, item)}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    <div
                      style={{
                        backgroundColor: '#f5f5f5',
                        aspectRatio: '1 / 1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        outline: isExpanded ? '2px solid var(--text-main)' : 'none',
                        transition: 'outline 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {item.is_bundle && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          backgroundColor: '#111',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          zIndex: 2
                        }}>
                          Conjunto
                        </div>
                      )}
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
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)', paddingRight: '8px' }}>
                        {item.name}
                      </h3>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                        Bs {parseFloat(item.base_price || 0).toFixed(2)}
                      </p>
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
                        <div style={{ aspectRatio: '1/1', backgroundColor: '#f5f5f5' }}>
                          <img
                            src={getImageUrl(variant.image)}
                            alt={variant.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            loading="lazy"
                          />
                        </div>
                        <div style={{ padding: '10px 12px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                            {variant.name}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                            Bs {parseFloat(variant.price || 0).toFixed(2)}
                          </p>
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
              <Link key={item.id} to={linkUrl} className="group relative block">
                <div
                  className="group-hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: '#f5f5f5', aspectRatio: '1 / 1', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}
                >
                  {item.is_bundle && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: '#111',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      zIndex: 2
                    }}>
                      Conjunto
                    </div>
                  )}
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
                </div>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)', paddingRight: '8px' }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                    Bs {parseFloat(item.price || 0).toFixed(2)}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 catalog-container" style={{ animation: 'pageEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="flex items-center justify-between catalog-header-border pb-6 pt-24 flex-wrap gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight catalog-title">Catálogo</h1>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
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
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
          <form className="hidden lg:block">
            <h3 className="sr-only">Categorías</h3>
            <ul role="list" className="space-y-4 catalog-filter-list pb-6 text-sm font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => { setSelectedCategory(null); setExpandedProductId(null); }}
                  className={`catalog-filter-link ${selectedCategory === null ? 'active' : ''}`}
                  style={{ fontWeight: selectedCategory === null ? 700 : 500, color: selectedCategory === null ? 'var(--text-main)' : 'var(--text-muted)' }}
                >
                  Todas las Categorías
                </button>
              </li>
              {categories.filter(c => !c.parent_id).map((parent) => {
                const children = categories.filter(c => c.parent_id === parent.id);
                return (
                  <React.Fragment key={parent.id}>
                    <li>
                      <button
                        type="button"
                        onClick={() => { setSelectedCategory(parent.id); setExpandedProductId(null); }}
                        className={`catalog-filter-link ${selectedCategory === parent.id ? 'active' : ''}`}
                        style={{ fontWeight: selectedCategory === parent.id ? 700 : 500, color: selectedCategory === parent.id ? 'var(--text-main)' : 'var(--text-muted)' }}
                      >
                        {parent.name}
                      </button>
                    </li>
                    {children.map(child => (
                      <li key={child.id} style={{ paddingLeft: '16px', marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => { setSelectedCategory(child.id); setExpandedProductId(null); }}
                          className={`catalog-filter-link ${selectedCategory === child.id ? 'active' : ''}`}
                          style={{ fontWeight: selectedCategory === child.id ? 600 : 400, color: selectedCategory === child.id ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.9em' }}
                        >
                          {child.name}
                        </button>
                      </li>
                    ))}
                  </React.Fragment>
                );
              })}
            </ul>
          </form>
          <div className="lg:col-span-3">
            {isLoading ? (
              <p style={{ color: 'var(--text-muted)' }}>Cargando catálogo...</p>
            ) : (
              renderProductGrid()
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Catalog;
