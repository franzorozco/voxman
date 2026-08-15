const fs = require('fs');

const fixImages = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');

    const regex = /let\s+imgUrl\s*=\s*mov\.variant\?\.variant_images\?\.\[0\]\?\.url;[\s\S]*?const\s+finalImgUrl\s*=\s*imgUrl\s*\?\s*\(imgUrl\.startsWith\("http"\)\s*\?\s*imgUrl\s*:\s*`\$\{API_BASE_URL\}\$\{imgUrl\}`\)\s*:\s*"\/placeholder\.png";/g;

    const replaceStr = `let imgUrl = mov.variant?.variant_images?.[0]?.url || mov.variant?.variant_images?.[0]?.image_path;
                
                if (!imgUrl) {
                  const attrIds = mov.variant?.variant_attribute_values?.map(vav => vav.attribute_value_id) || [];
                  const colorImgs = product?.attribute_value_images?.filter(img => attrIds.includes(img.attribute_value_id)) || [];
                  const colorImg = colorImgs.find(img => img.is_main) || colorImgs[0];
                  if (colorImg) {
                    imgUrl = colorImg.url || colorImg.image_path;
                  }
                }

                if (!imgUrl) {
                  const prodImg = product?.product_images?.find(img => img.is_main) || product?.product_images?.[0];
                  imgUrl = prodImg?.url || prodImg?.image_path;
                }

                let finalImgUrl = "/placeholder.png";
                if (imgUrl) {
                  if (imgUrl.startsWith("http")) {
                    finalImgUrl = imgUrl;
                  } else {
                    finalImgUrl = \`\${API_BASE_URL}\${imgUrl.startsWith('/') ? '' : '/'}\${imgUrl.replace('storage/', '')}\`;
                  }
                }`;

    if (regex.test(content)) {
        content = content.replace(regex, replaceStr);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`Could not find regex in ${filePath}`);
    }
};

fixImages('e:/Trabajo/Sistema de VOXman/Sistema/Frontend/src/pages/dashboard/pages/Inventory/InventoryMovements.jsx');
