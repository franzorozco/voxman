const fs = require('fs');

const path = 'e:/Trabajo/Sistema de VOXman/Sistema/Frontend/src/pages/dashboard/pages/HomeConfig/HomeConfig.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

lines.splice(868, 7, 
  '                  </div>',
  '                </div>',
  '              </div>}',
  '          </div>}',
  '',
  '        {/* ══════════════════════════════',
  '             TAB: CARRUSEL',
  '         ══════════════════════════════ */}',
  '        {activeTab === "carousel" && <div className="hc-style-14">',
  '            <h3 className="hc-style-15">Configuración del Carrusel</h3>',
  '            <div className="hc-style-16">',
  '              <label className="hc-style-17">',
  '                <span className="hc-style-18">Título del Carrusel</span>',
  '                <input type="text" value={settings.home_carousel_title || ""} placeholder="Ej: LO MÁS VENDIDO" onChange={e => setSetting("home_carousel_title", e.target.value)} onFocus={e => e.target.style.borderColor = "var(--color-primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} className="hc-style-19" />',
  '              </label>',
  '              ',
  '              <label className="hc-style-17">',
  '                <span className="hc-style-18">Tipo de lista a mostrar</span>',
  '                <CustomSelect value={settings.home_carousel_type || "newest"} onChange={e => setSetting("home_carousel_type", e.target.value)}>',
  '                  <option value="newest">Lo más nuevo (Lanzamientos)</option>',
  '                  <option value="trending">Lo más visto / destacado (Best Sellers)</option>',
  '                  <option value="random">Aleatorio</option>',
  '                </CustomSelect>',
  '              </label>',
  '            </div>',
  '          </div>}',
  '',
  '        {/* ══════════════════════════════',
  '             TAB: BENEFICIOS',
  '         ══════════════════════════════ */}',
  '        {activeTab === "value_props" && <div className="hc-style-14">',
  '            <div className="hc-style-82">',
  '              <div>',
  '                <h3 className="hc-style-21">Barra de Beneficios</h3>',
  '                <p className="hc-style-22">Máximo 4 iconos que se mostrarán bajo el hero principal.</p>',
  '              </div>',
  '              <button onClick={addValueProp} className="hc-style-83">',
  '                + Añadir Beneficio',
  '              </button>',
  '            </div>'
);

fs.writeFileSync(path, lines.join('\n'));
