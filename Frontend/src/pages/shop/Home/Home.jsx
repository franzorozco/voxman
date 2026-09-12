import React, { useState, useEffect } from 'react';
import { getProducts } from '../../../api/shop/products';
import { getActiveShorts } from '../../../api/shop/shorts';
import { formatCollageItems } from '../utils/collageHelpers';
import ShopCollageGrid from '../components/ShopCollageGrid';
import NewArrivalsCarousel from '../components/NewArrivalsCarousel';
import './Home.css';

const Home = () => {
  const [images, setImages] = useState([]);
  const [carouselProducts, setCarouselProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchCollageItems();
  }, []);

  const fetchCollageItems = async () => {
    try {
      const [productsRes, shortsRes] = await Promise.all([
        getProducts({ per_page: 50 }),
        getActiveShorts()
      ]);
      
      const products = productsRes.data?.data || productsRes.data || [];
      const shorts = shortsRes.data || [];
      
      const allFormattedItems = formatCollageItems(products, shorts);
      
      // Carousel only gets images
      const imageItems = allFormattedItems.filter(item => item.type === 'image');
      setCarouselProducts(imageItems.slice(0, 8));

      // Collage gets everything
      setImages(allFormattedItems);

    } catch (err) {
      console.error('Error fetching collage items:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="shop-home-loading">
        <div className="shop-home-loader" />
      </div>
    );
  }

  return (
    <div className="shop-home">
      <div className="shop-home-hero">
        <h1 className="shop-home-title">LO MÁS DESTACADO</h1>
        <p className="shop-home-subtitle">Descubre las tendencias en moda masculina</p>
      </div>
      
      <ShopCollageGrid items={images} />

      <NewArrivalsCarousel products={carouselProducts} />
    </div>
  );
};

export default Home;
