import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Printer } from "lucide-react";

import CustomSelect from '../../../../../components/ui/CustomSelect';
export default function QrPrintModal({ isOpen, onClose, selectedProducts = [] }) {
  const [printFormat, setPrintFormat] = useState("a4"); // a4 | thermal
  const printRef = useRef(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open("", "", "width=800,height=600");
    
    let style = `
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .print-container { width: 100%; }
        .page-a4 { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 10mm; 
          padding: 10mm; 
        }
        .page-thermal { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          gap: 5mm;
          padding: 5mm; 
        }
        .label-box { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          text-align: center;
          border: 1px dashed #ccc;
          padding: 10px;
          page-break-inside: avoid;
        }
        .label-title { font-size: 12px; font-weight: bold; margin-bottom: 5px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .label-price { font-size: 14px; font-weight: bold; margin-top: 5px; }
        .label-sku { font-size: 10px; color: #555; margin-top: 3px; }
        @media print {
          .label-box { border: none; }
        }
      </style>
    `;

    windowPrint.document.write("<html><head><title>Imprimir QRs</title>");
    windowPrint.document.write(style);
    windowPrint.document.write("</head><body>");
    windowPrint.document.write(printContent.innerHTML);
    windowPrint.document.write("</body></html>");
    windowPrint.document.close();
    
    // Wait for images/SVGs to render
    setTimeout(() => {
      windowPrint.focus();
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  const labels = selectedProducts.map(prod => ({
    id: prod.id,
    name: prod.name,
    price: prod.price || prod.base_price,
    sku: prod.sku || prod.reference_number || prod.id.substring(0,8),
    url: `${window.location.origin}/p/${prod.sku || prod.id}`
  }));

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="modal" style={{ width: "900px", maxWidth: "95vw" }}>
        <div className="modal-header">
          <h2>Generar Etiquetas QR</h2>
          <button className="close-btn" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-content" style={{ display: "flex", gap: "20px", height: "60vh" }}>
          
          <div className="qr-config-panel" style={{ flex: "0 0 250px", borderRight: "1px solid var(--border-color)", paddingRight: "20px" }}>
            <div className="form-group">
              <label>Formato de Impresión</label>
              <CustomSelect 
                 
                value={printFormat} 
                onChange={(e) => setPrintFormat(e.target.value)}
              >
                <option value="a4">Hoja A4 (Cuadrícula)</option>
                <option value="thermal">Rollo Térmico (Continua)</option>
              </CustomSelect>
            </div>
            
            <div className="info-box" style={{ marginTop: "20px", padding: "10px", background: "var(--bg-input)", borderRadius: "8px", fontSize: "13px" }}>
              <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>URL Base</p>
              <p style={{ margin: 0, color: "var(--text-muted)", wordBreak: "break-all" }}>
                {window.location.origin}/p/
              </p>
            </div>
            
            <button 
              className="btn-primary" 
              style={{ width: "100%", marginTop: "30px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              onClick={handlePrint}
            >
              <Printer size={18} />
              Imprimir {labels.length} QRs
            </button>
          </div>

          <div className="qr-preview-panel" style={{ flex: 1, overflowY: "auto", background: "var(--bg-body)", padding: "20px", borderRadius: "8px", border: '1px solid var(--border-color)' }}>
            <div 
              ref={printRef} 
              className={`print-container page-${printFormat}`}
            >
              {labels.map((lbl, idx) => (
                <div key={idx} className="label-box" style={{ background: "white", color: "black", borderRadius: "8px" }}>
                  <div className="label-title">{lbl.name}</div>
                  <QRCodeSVG value={lbl.url} size={100} level="M" />
                  <div className="label-price">Bs. {Number(lbl.price).toFixed(2)}</div>
                  <div className="label-sku">SKU: {lbl.sku}</div>
                </div>
              ))}
              {labels.length === 0 && (
                <div style={{ color: "var(--text-muted)", textAlign: "center", width: "100%", gridColumn: "1 / -1" }}>
                  No hay productos seleccionados.
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
