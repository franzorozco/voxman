import React, { useState, useEffect } from 'react';
import { getProducts } from '../../../api/shop/products';
import { getActiveShorts } from '../../../api/shop/shorts';
import { formatCollageItems } from '../utils/collageHelpers';
import ShopCollageGrid from '../components/ShopCollageGrid';
import './Home.css';

const Home = () => {
  const [images, setImages] = useState([]);
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
      
      const collageItems = formatCollageItems(products, shorts);
      setImages(collageItems);
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
      <ShopCollageGrid items={images} />
    </div>
  );
};

export default Home;
