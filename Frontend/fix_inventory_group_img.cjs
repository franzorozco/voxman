const fs = require('fs');

const fixImages = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');

    const regexGroup = /const\s+groupImgUrl\s*=\s*group\.product\?\.product_images\?\.find\(img\s*=>\s*img\.is_main\)\?\.url\s*\|\|\s*group\.product\?\.product_images\?\.\[0\]\?\.url;[\s\S]*?const\s+groupFinalImgUrl\s*=\s*groupImgUrl\s*\?\s*\(groupImgUrl\.startsWith\("http"\)\s*\?\s*groupImgUrl\s*:\s*`\$\{API_BASE_URL\}\$\{groupImgUrl\}`\)\s*:\s*"\/placeholder\.png";/g;

    const replaceGroupStr = `const groupProdImg = group.product?.product_images?.find(img => img.is_main) || group.product?.product_images?.[0];
                        const groupImgUrl = groupProdImg?.url || groupProdImg?.image_path;
                        let groupFinalImgUrl = "/placeholder.png";
                        if (groupImgUrl) {
                          if (groupImgUrl.startsWith("http")) {
                            groupFinalImgUrl = groupImgUrl;
                          } else {
                            groupFinalImgUrl = \`\${API_BASE_URL}\${groupImgUrl.startsWith('/') ? '' : '/'}\${groupImgUrl.replace('storage/', '')}\`;
                          }
                        }`;

    if (regexGroup.test(content)) {
        content = content.replace(regexGroup, replaceGroupStr);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated group in ${filePath}`);
    } else {
        console.log(`Could not find group regex in ${filePath}`);
    }
};

fixImages('e:/Trabajo/Sistema de VOXman/Sistema/Frontend/src/pages/dashboard/pages/Inventory/Inventory.jsx');
