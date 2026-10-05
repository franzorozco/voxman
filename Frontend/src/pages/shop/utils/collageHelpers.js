export const formatCollageItems = (products, shorts) => {
  const collageItems = [];

  // 1. Procesar Productos
  products.forEach((product) => {
    const categoryId = product.category_id || (product.category ? product.category.id : '');
    const catalogUrl = `/shop/catalog?category=${categoryId}`;

    // Imágenes por color (attribute_value_images) — las principales
    const colorImages = (product.attribute_value_images || [])
      .filter(img => img.is_main)
      .map(img => ({
        id: img.id,
        productId: product.id,
        url: img.url,
        productName: product.name,
        targetUrl: catalogUrl,
        colorName: img.attribute_value?.value || '',
        price: product.base_price,
        type: 'image'
      }));

    if (colorImages.length > 0) {
      collageItems.push(...colorImages);
    } else {
      // Imágenes por variante única (variant_images) — primera de cada variante deduped by attrs
      const variantImages = [];
      const seenAttrs = new Set();
      (product.product_variants || []).forEach(variant => {
        if (variant.variant_images && variant.variant_images.length > 0) {
          const attrKey = (variant.variant_attribute_values || [])
            .map(va => va.attribute_value?.value || '')
            .sort()
            .join('|') || variant.id;

          if (!seenAttrs.has(attrKey)) {
            seenAttrs.add(attrKey);
            const firstImg = variant.variant_images[0];
            variantImages.push({
              id: firstImg.id,
              productId: product.id,
              url: firstImg.url,
              productName: product.name,
              targetUrl: catalogUrl,
              colorName: '',
              price: variant.price || product.base_price,
              type: 'image'
            });
          }
        }
      });

      if (variantImages.length > 0) {
        collageItems.push(...variantImages);
      } else {
        // Imágenes generales del producto (product_images) — la principal
        const mainImg = (product.product_images || []).find(img => img.is_main);
        if (mainImg) {
          collageItems.push({
            id: mainImg.id,
            productId: product.id,
            url: mainImg.url,
            productName: product.name,
            targetUrl: catalogUrl,
            colorName: '',
            price: product.base_price,
            type: 'image'
          });
        } else if (product.product_images?.length > 0) {
          // Fallback: primera imagen disponible
          collageItems.push({
            id: product.product_images[0].id,
            productId: product.id,
            url: product.product_images[0].url,
            productName: product.name,
            targetUrl: catalogUrl,
            colorName: '',
            price: product.base_price,
            type: 'image'
          });
        }
      }
    }
  });

  // 2. Mezclar productos aleatoriamente (Fisher-Yates)
  for (let i = collageItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [collageItems[i], collageItems[j]] = [collageItems[j], collageItems[i]];
  }

  // 2b. Separar variantes del mismo producto para que no queden juntas
  for (let i = 1; i < collageItems.length; i++) {
    if (
      collageItems[i].targetUrl === collageItems[i - 1].targetUrl ||
      (i > 1 && collageItems[i].targetUrl === collageItems[i - 2].targetUrl)
    ) {
      let swapIdx = -1;
      for (let j = i + 1; j < collageItems.length; j++) {
        if (
          collageItems[j].targetUrl !== collageItems[i - 1].targetUrl &&
          (i > 1 ? collageItems[j].targetUrl !== collageItems[i - 2].targetUrl : true) &&
          (j < collageItems.length - 1 ? collageItems[i].targetUrl !== collageItems[j + 1].targetUrl : true)
        ) {
          swapIdx = j;
          break;
        }
      }
      if (swapIdx !== -1) {
        [collageItems[i], collageItems[swapIdx]] = [collageItems[swapIdx], collageItems[i]];
      }
    }
  }

  if (!shorts || shorts.length === 0) {
    return collageItems;
  }

  // 3. Procesar e insertar Shorts basados en su prioridad y mantenerlos separados
  const formattedShorts = shorts.map(s => {
    let targetUrl = '/shop';
    if (s.product) {
      const catId = s.product.category_id || (s.product.category ? s.product.category.id : '');
      targetUrl = `/shop/catalog?category=${catId}`;
    } else if (s.category) {
      targetUrl = `/shop/catalog?category=${s.category.id}`;
    }

    return {
      id: s.id,
      productId: s.product ? s.product.id : '',
      url: s.video_url,
      productName: s.title || '',
      targetUrl: targetUrl,
      colorName: '',
      price: s.product ? s.product.base_price : null,
      type: 'video',
      priority: s.priority
    };
  });

  // Ordenar de mayor a menor prioridad para insertar los mejores primero
  formattedShorts.sort((a, b) => b.priority - a.priority);

  const videoIndices = [];
  const MIN_VIDEO_GAP = 5; // Distancia mínima de 5 items entre videos

  formattedShorts.forEach((short) => {
    let insertIndex;
    let attempts = 0;
    let maxPos = short.priority > 0 
      ? Math.max(1, Math.floor(collageItems.length / Math.max(1, short.priority))) 
      : collageItems.length;

    do {
      insertIndex = Math.floor(Math.random() * maxPos);
      let isValid = true;
      for (let vIdx of videoIndices) {
         if (Math.abs(vIdx - insertIndex) < MIN_VIDEO_GAP) {
            isValid = false;
            break;
         }
      }
      if (isValid) break;
      attempts++;
      if (attempts > 5) maxPos = Math.min(collageItems.length, maxPos + 3);
    } while (attempts < 20);

    collageItems.splice(insertIndex, 0, short);
    
    for (let i = 0; i < videoIndices.length; i++) {
       if (videoIndices[i] >= insertIndex) videoIndices[i]++;
    }
    videoIndices.push(insertIndex);
  });

  return collageItems;
};
