import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../../api/shop/products';
import { getActiveShorts } from '../../../api/shop/shorts';
import { formatCollageItems } from '../utils/collageHelpers';
import ShopCollageGrid from '../components/ShopCollageGrid';
import NewArrivalsCarousel from '../components/NewArrivalsCarousel';
import ShopFeaturedCategories from '../components/ShopFeaturedCategories';
import ShopErrorState from '../components/ShopErrorState';
import { useShopSettingsStore } from '../../../store/shop/useShopSettingsStore';
import './Home.css';

const Home = () => {
  const [images, setImages] = useState([]);
  const [carouselProducts, setCarouselProducts] = useState([]);
  const [collageLoading, setCollageLoading] = useState(true);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [collageError, setCollageError] = useState(false);
  const [carouselError, setCarouselError] = useState(false);
  
  const hasFetched = React.useRef(false);
  const { settings, fetched, fetchSettings, error: settingsError, loading: settingsLoading } = useShopSettingsStore();

  useEffect(() => {
    if (!fetched && !settingsError && !settingsLoading) {
      fetchSettings();
    } else if (fetched && !hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, [fetched, settingsError, settingsLoading, fetchSettings]);

  const fetchData = () => {
    setCollageError(false);
    setCarouselError(false);
    setCollageLoading(true);
    setCarouselLoading(true);

    const sortMap = {
      'newest': 'newest',
      'price_asc': 'price_asc',
      'price_desc': 'price_desc',
      'best_sellers': 'trending',
      'most_viewed': 'trending',
      'random': 'random'
    };

    // --- 1. Fetch Collage Items ---
    const collageSort = settings.shop_home_collage_sort || 'newest';
    let collageParams = {
      per_page: 24,
      list_type: sortMap[collageSort] || 'newest'
    };
    
    const collageFilterType = settings.shop_home_collage_category_filter || 'all';
    if (collageFilterType !== 'all') {
      let catIds = [];
      try { catIds = JSON.parse(settings.shop_home_collage_categories || '[]'); } catch {}
      if (catIds.length > 0) {
        if (collageFilterType === 'include') collageParams.category_id = catIds.join(',');
        else if (collageFilterType === 'exclude') collageParams.exclude_category_id = catIds.join(',');
      }
    }

    Promise.all([
      getProducts(collageParams),
      getActiveShorts()
    ]).then(([productsRes, shortsRes]) => {
      const products = productsRes.data?.data || productsRes.data || [];
      const shorts = shortsRes.data || [];
      const allFormattedItems = formatCollageItems(products, shorts);
      setImages(allFormattedItems);
      setCollageLoading(false);
    }).catch(err => {
      console.error('Error fetching collage items:', err);
      setCollageError(true);
      setCollageLoading(false);
    });

    // --- 2. Fetch New Arrivals ---
    const naSort = settings.shop_home_new_arrivals_sort || 'newest';
    let naParams = {
      per_page: parseInt(settings.shop_home_new_arrivals_limit || 8, 10),
      list_type: sortMap[naSort] || 'newest'
    };
    
    const naFilterType = settings.shop_home_new_arrivals_category_filter || 'all';
    if (naFilterType !== 'all') {
      let catIds = [];
      try { catIds = JSON.parse(settings.shop_home_new_arrivals_categories || '[]'); } catch {}
      if (catIds.length > 0) {
        if (naFilterType === 'include') naParams.category_id = catIds.join(',');
        else if (naFilterType === 'exclude') naParams.exclude_category_id = catIds.join(',');
      }
    }

    getProducts(naParams).then(naRes => {
      const naProducts = naRes.data?.data || naRes.data || [];
      const naFormattedItems = formatCollageItems(naProducts, []).filter(item => item.type === 'image');
      setCarouselProducts(naFormattedItems);
      setCarouselLoading(false);
    }).catch(err => {
      console.error('Error fetching new arrivals:', err);
      setCarouselError(true);
      setCarouselLoading(false);
    });
  };

  const showHero = settings.shop_home_show_hero === undefined || String(settings.shop_home_show_hero) !== "0";
  const showCategories = settings.shop_home_show_categories === undefined || String(settings.shop_home_show_categories) !== "0";
  const showCollage = settings.shop_home_show_collage === undefined || String(settings.shop_home_show_collage) !== "0";
  const showNewArrivals = settings.shop_home_show_new_arrivals === undefined || String(settings.shop_home_show_new_arrivals) !== "0";

  const hasGlobalError = settingsError || collageError || carouselError;

  return (
    <div className="shop-home">
      {showHero && (
        <div className="shop-home-hero">
          <h1 className="shop-home-title">{settings.shop_home_hero_title || "LO MÁS DESTACADO"}</h1>
          <p className="shop-home-subtitle">{settings.shop_home_hero_subtitle || "Descubre las tendencias en moda masculina"}</p>
          <Link to="/shop/catalog" className="shop-home-catalog-btn">
            {settings.shop_home_hero_btn_text || "Ver catálogo completo"}
            <span className="shop-home-catalog-btn__arrow">→</span>
          </Link>
        </div>
      )}

      {hasGlobalError ? (
        <ShopErrorState 
          title="Tienda no disponible" 
          message="No pudimos cargar los productos en este momento. Por favor, intenta de nuevo en unos minutos." 
          onRetry={fetchSettings}
        />
      ) : (
        <>
          {showCollage && (
            collageLoading ? (
              <div className="shop-home-loading"><div className="shop-home-loader" /></div>
            ) : (
              <ShopCollageGrid items={images} />
            )
          )}
          {showCategories && <ShopFeaturedCategories categories={settings.shop_home_featured_categories} />}
          {showNewArrivals && (
            carouselLoading ? (
              <div className="shop-home-loading"><div className="shop-home-loader" /></div>
            ) : (
              <NewArrivalsCarousel 
                products={carouselProducts} 
                title={settings.shop_home_new_arrivals_title}
                subtitle={settings.shop_home_new_arrivals_subtitle}
                cardBg={settings.shop_home_new_arrivals_card_bg}
                textColor={settings.shop_home_new_arrivals_text_color}
                cardRadius={settings.shop_home_new_arrivals_card_radius}
                cardShadow={settings.shop_home_new_arrivals_card_shadow}
              />
            )
          )}
        </>
      )}
    </div>
  );
};

export default Home;
