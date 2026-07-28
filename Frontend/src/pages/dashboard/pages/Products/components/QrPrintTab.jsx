import React, { useState, useRef, useEffect, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, RefreshCw } from "lucide-react";

import CustomSelect from '../../../../../components/ui/CustomSelect';
const LABEL_SIZES = {
  small:  { name: "Pequeño",  qr: 50,  width: 120, fontSize: { title: 8, attr: 7, price: 9, sku: 7 }, pad: 6 },
  medium: { name: "Mediano",  qr: 80,  width: 170, fontSize: { title: 10, attr: 9, price: 12, sku: 8 }, pad: 10 },
  large:  { name: "Grande",   qr: 110, width: 220, fontSize: { title: 12, attr: 10, price: 14, sku: 9 }, pad: 14 },
};

const PAPER_FORMATS = {
  a4:       { name: "Hoja A4 (210 × 297 mm)", width: "210mm", height: "297mm" },
  carta:    { name: "Carta (216 × 279 mm)",    width: "216mm", height: "279mm" },
  thermal:  { name: "Rollo Térmico (80mm)",     width: "80mm",  height: "auto" },
  custom:   { name: "Personalizada (ajustar en impresora)", width: "100%", height: "auto" },
};

export default function QrPrintTab({ product }) {
  const [paperFormat, setPaperFormat] = useState("a4");
  const [labelSize, setLabelSize] = useState("medium");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [variantQuantities, setVariantQuantities] = useState({});
  const printRef = useRef(null);

  const branches = useMemo(() => {
    const brMap = new Map();
    if (product?.product_variants) {
      product.product_variants.forEach(variant => {
        if (variant.inventories) {
          variant.inventories.forEach(inv => {
            if (inv.branch) {
              brMap.set(inv.branch.id, inv.branch);
            }
          });
        }
      });
    }
    return Array.from(brMap.values());
  }, [product]);

  useEffect(() => {
    const newQuantities = {};
    if (product?.product_variants && selectedWarehouseId) {
      product.product_variants.forEach(variant => {
        const inv = variant.inventories?.find(i => i.branch?.id == selectedWarehouseId || i.branch_id == selectedWarehouseId);
        newQuantities[variant.id] = inv ? Number(inv.stock || inv.quantity || 0) : 0;
      });
    }
    setVariantQuantities(newQuantities);
  }, [selectedWarehouseId, product]);

  const handleQuantityChange = (variantId, delta, maxStock) => {
    setVariantQuantities(prev => {
      const current = prev[variantId] || 0;
      let next = current + delta;
      if (next < 0) next = 0;
      if (next > maxStock) next = maxStock;
      return { ...prev, [variantId]: next };
    });
  };

  const sz = LABEL_SIZES[labelSize];

  const handlePrint = () => {
    if (labelsToPrint.length === 0) return;

    const paper = PAPER_FORMATS[paperFormat];
    const isThermal = paperFormat === "thermal";

    // Build each label card as raw HTML with QR rendered via an img (Google Charts API fallback) or inline SVG
    const cardsHtml = labelsToPrint.map(lbl => {
      // We grab the SVG directly from the preview DOM for perfect fidelity
      return `
        <div class="label-card">
          <div class="lbl-name">${lbl.name}</div>
          ${lbl.attributes ? `<div class="lbl-attr">${lbl.attributes}</div>` : ''}
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=${sz.qr}x${sz.qr}&data=${encodeURIComponent(lbl.url)}" 
               width="${sz.qr}" height="${sz.qr}" style="margin:4px 0;" />
          <div class="lbl-price">Bs. ${Number(lbl.price).toFixed(2)}</div>
          <div class="lbl-code">Cód: ${lbl.sku}</div>
        </div>`;
    }).join('\n');

    const windowPrint = window.open("", "", "width=900,height=700");

    const html = `<!DOCTYPE html>
<html><head><title>Imprimir Etiquetas QR</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; color: #000; }
  @page {
    size: ${paper.width} ${paper.height};
    margin: ${isThermal ? '2mm' : '8mm'};
  }
  .print-grid {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: ${isThermal ? '3mm' : '5mm'};
    justify-content: ${isThermal ? 'center' : 'flex-start'};
    padding: ${isThermal ? '2mm' : '4mm'};
  }
  .label-card {
    width: ${sz.width}px;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border: 1px dashed #ccc;
    border-radius: 4px;
    padding: ${sz.pad}px;
    page-break-inside: avoid;
    background: #fff;
  }
  .lbl-name { font-size: ${sz.fontSize.title}px; font-weight: bold; margin-bottom: 2px; max-width: ${sz.width - 16}px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lbl-attr { font-size: ${sz.fontSize.attr}px; color: #444; margin-bottom: 3px; line-height: 1.3; max-width: ${sz.width - 16}px; }
  .lbl-price { font-size: ${sz.fontSize.price}px; font-weight: bold; margin-top: 3px; }
  .lbl-code { font-size: ${sz.fontSize.sku}px; color: #555; margin-top: 2px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .label-card { border: 1px dashed #ddd; }
  }
</style>
</head><body>
<div class="print-grid">
  ${cardsHtml}
</div>
</body></html>`;

    windowPrint.document.write(html);
    windowPrint.document.close();

    // Wait for QR images to load before printing
    setTimeout(() => {
      windowPrint.focus();
      windowPrint.print();
      windowPrint.close();
    }, 800);
  };

  const labelsToPrint = useMemo(() => {
    const list = [];
    if (!product?.product_variants) return list;

    product.product_variants.forEach(variant => {
      const qty = variantQuantities[variant.id] || 0;
      if (qty > 0) {
        let attrText = [];
        if (variant.size) attrText.push(`Talla: ${variant.size.name}`);
        if (variant.fit) attrText.push(`Fit: ${variant.fit.name}`);
        variant.variant_attribute_values?.forEach(vav => {
          attrText.push(`${vav.attribute_value?.attribute?.name}: ${vav.attribute_value?.value}`);
        });

        const skuStr = variant.barcode || variant.sku || variant.id.substring(0, 8);
        const urlStr = `http://localhost:5173/p/${skuStr}`;
        const price = variant.price || product.base_price;

        for (let i = 0; i < qty; i++) {
          list.push({
            variantId: variant.id,
            name: product.name,
            attributes: attrText.join(' · '),
            sku: skuStr,
            url: urlStr,
            price: price
          });
        }
      }
    });
    return list;
  }, [product, variantQuantities]);

  // Compute preview grid columns based on label size
  const previewCols = paperFormat === "thermal" ? 1 : Math.max(1, Math.floor(500 / (sz.width + 10)));

  return (
    <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
      {/* LEFT: CONFIG */}
      <div style={{ flex: "0 0 340px", borderRight: "1px solid var(--border-color)", paddingRight: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>

        <div className="form-group">
          <label>Sucursal / Almacén</label>
          <CustomSelect  value={selectedWarehouseId} onChange={(e) => setSelectedWarehouseId(e.target.value)}>
            <option value="">Seleccionar Sucursal...</option>
            {branches.map(br => (
              <option key={br.id} value={br.id}>{br.name}</option>
            ))}
          </CustomSelect>
        </div>

        <div className="form-group">
          <label>Formato de Papel</label>
          <CustomSelect  value={paperFormat} onChange={(e) => setPaperFormat(e.target.value)}>
            {Object.entries(PAPER_FORMATS).map(([k, v]) => (
              <option key={k} value={k}>{v.name}</option>
            ))}
          </CustomSelect>
        </div>

        <div className="form-group">
          <label>Tamaño de Etiqueta</label>
          <div style={{ display: "flex", gap: "8px" }}>
            {Object.entries(LABEL_SIZES).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setLabelSize(k)}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  borderRadius: "8px",
                  border: labelSize === k ? "2px solid var(--color-primary)" : "1px solid var(--border-color)",
                  background: labelSize === k ? "var(--color-primary-alpha, rgba(99,102,241,0.15))" : "var(--bg-input)",
                  color: labelSize === k ? "var(--color-primary)" : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: labelSize === k ? "700" : "500",
                  transition: "all 0.15s"
                }}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "var(--text-main)" }}>Ajuste de Cantidades</h4>
          {selectedWarehouseId ? (
            <div style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "5px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {product?.product_variants?.map(variant => {
                const inv = variant.inventories?.find(i => i.branch?.id == selectedWarehouseId || i.branch_id == selectedWarehouseId);
                const stock = inv ? Number(inv.stock || inv.quantity || 0) : 0;

                let attrs = [];
                if (variant.size) attrs.push(`Talla: ${variant.size.name}`);
                if (variant.fit) attrs.push(`Fit: ${variant.fit.name}`);
                variant.variant_attribute_values?.forEach(vav => {
                  attrs.push(`${vav.attribute_value?.attribute?.name}: ${vav.attribute_value?.value}`);
                });

                return (
                  <div key={variant.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", background: "var(--bg-input)", borderRadius: "6px", border: "1px solid var(--border-color)", gap: "8px" }}>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                        <span style={{ fontWeight: "bold", color: "var(--text-main)", fontSize: "12px" }}>{variant.sku}</span>
                        <span style={{ fontSize: "10px", color: stock > 0 ? "var(--color-success)" : "var(--color-danger)" }}>(Stock: {stock})</span>
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "10px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {attrs.map((attr, idx) => (
                          <span key={idx} style={{ background: "var(--bg-overlay)", padding: "1px 4px", borderRadius: "3px" }}>{attr}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--bg-card)", padding: "2px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                      <button
                        onClick={() => handleQuantityChange(variant.id, -1, stock)}
                        style={{ width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "var(--bg-overlay)", color: "var(--text-main)", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                      >-</button>
                      <span style={{ width: "24px", textAlign: "center", fontWeight: "bold", color: "var(--text-main)", fontSize: "12px" }}>
                        {variantQuantities[variant.id] || 0}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(variant.id, 1, stock)}
                        style={{ width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "var(--bg-overlay)", color: "var(--text-main)", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Selecciona una sucursal para cargar el stock de cada variante automáticamente.</p>
          )}
        </div>

        <button
          className="btn-primary"
          style={{ width: "100%", marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          onClick={handlePrint}
          disabled={labelsToPrint.length === 0}
        >
          <Printer size={18} />
          Imprimir {labelsToPrint.length} Etiqueta{labelsToPrint.length !== 1 ? 's' : ''}
        </button>
      </div>

      {/* RIGHT: PREVIEW */}
      <div style={{ flex: 1, background: "var(--bg-body)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)", height: "60vh", overflowY: "auto" }}>

        {labelsToPrint.length === 0 ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column", gap: "10px" }}>
            <RefreshCw size={32} opacity={0.5} />
            <p>No hay etiquetas para previsualizar.</p>
          </div>
        ) : (
          <div
            ref={printRef}
            className="print-grid"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              justifyContent: paperFormat === "thermal" ? "center" : "flex-start",
            }}
          >
            {labelsToPrint.map((lbl, idx) => (
              <div
                key={idx}
                className="label-card"
                style={{
                  width: `${sz.width}px`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  border: "1px dashed rgba(150,150,150,0.5)",
                  borderRadius: "6px",
                  padding: `${sz.pad}px`,
                  background: "white",
                  color: "black",
                }}
              >
                <div className="lbl-name" style={{ fontSize: `${sz.fontSize.title}px`, fontWeight: "bold", marginBottom: "3px", maxWidth: `${sz.width - 20}px`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lbl.name}</div>
                {lbl.attributes && <div className="lbl-attr" style={{ fontSize: `${sz.fontSize.attr}px`, color: "#444", lineHeight: "1.3", marginBottom: "4px" }}>{lbl.attributes}</div>}
                <QRCodeSVG value={lbl.url} size={sz.qr} level="M" />
                <div className="lbl-price" style={{ fontSize: `${sz.fontSize.price}px`, fontWeight: "bold", marginTop: "4px" }}>Bs. {Number(lbl.price).toFixed(2)}</div>
                <div className="lbl-code" style={{ fontSize: `${sz.fontSize.sku}px`, color: "#666", marginTop: "2px" }}>Cód: {lbl.sku}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
