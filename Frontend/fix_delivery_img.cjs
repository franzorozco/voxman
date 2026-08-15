const fs = require('fs');

const fixImages = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');

    const regex = /const\s+colorId\s*=\s*variant\?\.variant_attribute_values\?\.\[0\]\?\.attribute_value_id;[\s\S]*?if\s*\(!imageUrl\.startsWith\('http'\)\)\s*\{\s*imageUrl\s*=\s*`\$\{import\.meta\.env\.VITE_API_URL\?\.replace\('\/api\/v1',\s*''\)\s*\|\|\s*import\.meta\.env\.VITE_API_URL\?\.replace\('\/api',\s*''\)\s*\|\|\s*API_BASE_URL\}\$\{imageUrl\}`;\s*\}/g;

    const replaceStr = `const variantAttrIds = variant?.variant_attribute_values?.map(v => v.attribute_value_id) || [];
                      const colorImgs = product?.attribute_value_images?.filter(img => variantAttrIds.includes(img.attribute_value_id)) || [];
                      const colorImg = colorImgs.find(img => img.is_main) || colorImgs[0];
                      
                      let imageUrl = variant?.variant_images?.[0]?.url || colorImg?.url || product?.product_images?.find(img => img.is_main)?.url || product?.product_images?.[0]?.url;
                      
                      if (!imageUrl) {
                        const fallbackPath = variant?.variant_images?.[0]?.image_path || colorImg?.image_path || product?.product_images?.find(img => img.is_main)?.image_path || product?.product_images?.[0]?.image_path;
                        if (fallbackPath) {
                          imageUrl = \`/storage/\${fallbackPath}\`;
                        }
                      }

                      if (imageUrl && !imageUrl.startsWith('http')) {
                        imageUrl = \`\${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || import.meta.env.VITE_API_URL?.replace('/api', '') || API_BASE_URL}\${imageUrl.startsWith('/') ? '' : '/'}\${imageUrl.replace('storage/', '')}\`;
                      }`;

    if (regex.test(content)) {
        content = content.replace(regex, replaceStr);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`Could not find regex in ${filePath}`);
    }
};

fixImages('e:/Trabajo/Sistema de VOXman/Sistema/Frontend/src/pages/dashboard/pages/Orders/DeliveryDetailsModal.jsx');
