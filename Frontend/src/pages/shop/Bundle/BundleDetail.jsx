import { getImageUrl } from '../../../utils/imageUtils';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProduct } from '../../../api/shop/products';
import useShopCartStore from '../../../store/shop/useShopCartStore';
import { API_BASE_URL } from '../../../config/api';
import { Check, Copy, Share2 } from 'lucide-react';
import './BundleDetail.css';

const BundleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bundle, setBundle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [addedBundle, setAddedBundle] = useState(false);
  const [addedItems, setAddedItems] = useState({});
  
  const addToCart = useShopCartStore((state) => state.addToCart);

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
      await addToCart(bundle.id, null, 1);
      setAddedBundle(true);
      setTimeout(() => setAddedBundle(false), 2000);
    } catch (e) {
      console.error("No se pudo añadir el conjunto:", e);
    }
  };

  const handleAddIndividualItem = async (itemId, variantId) => {
    try {
      await addToCart(itemId, variantId || null, 1);
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

                // Resolve Image
                let imgUrl = null;
                if (variant && variant.variant_images?.length > 0) {
                  imgUrl = variant.variant_images[0].url;
                }
                if (!imgUrl && variant && variant.variant_attribute_values) {
                  const colorAttrValue = variant.variant_attribute_values.find(vav => {
                    return prod.attribute_value_images?.some(img => img.attribute_value_id === vav.attribute_value_id);
                  });
                  if (colorAttrValue) {
                    const colorImg = prod.attribute_value_images.find(img => img.attribute_value_id === colorAttrValue.attribute_value_id);
                    if (colorImg) imgUrl = colorImg.url;
                  }
                }
                if (!imgUrl && prod.product_images?.length > 0) {
                  imgUrl = prod.product_images[0].url;
                }
                if (!imgUrl) {
                  imgUrl = prod.cover_image || 'https://via.placeholder.com/100';
                }

                // Gather attributes
                const attrs = [];
                if (variant) {
                  if (variant.size) attrs.push(`Talla: ${variant.size.name}`);
                  if (variant.variant_attribute_values) {
                    variant.variant_attribute_values.forEach(vav => {
                      attrs.push(`${vav.attribute_value.value}`);
                    });
                  }
                }

                return (
                  <div key={item.id || index} style={{ display: 'flex', gap: '16px', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '8px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '75px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#f9f9f9' }}>
                      <img src={getImageUrl(imgUrl)} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0', color: '#111' }}>{prod.name}</h4>
                      <div style={{ fontSize: '12px', color: '#666', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {attrs.map((attr, i) => (
                          <span key={i} style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>{attr}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#111', marginTop: '6px' }}>
                        Bs {parseFloat(variant?.price || prod.base_price).toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <button 
                        onClick={() => handleAddIndividualItem(prod.id, variant?.id)}
                        disabled={addedItems[prod.id]}
                        style={{ 
                          fontSize: '11px', 
                          fontWeight: '600',
                          padding: '6px 12px', 
                          borderRadius: '4px', 
                          backgroundColor: addedItems[prod.id] ? '#22c55e' : 'transparent',
                          color: addedItems[prod.id] ? 'white' : '#111',
                          border: addedItems[prod.id] ? '1px solid #22c55e' : '1px solid #ccc',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {addedItems[prod.id] ? <Check size={12} /> : 'Añadir'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add to Cart Bundle */}
          <div className="product-actions mt-8">
            <button 
              className={`add-to-cart-btn w-full ${addedBundle ? 'added' : ''}`}
              onClick={handleAddBundle}
              disabled={addedBundle}
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
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default BundleDetail;
