import React from "react";
import * as Icons from "lucide-react";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";
import { URL_BASE_VIDEOS } from "../../../../config/api";

const sizeMapTitle = {
  sm: 'clamp(1.5rem, 4vw, 3rem)',
  md: 'clamp(2rem, 5vw, 4rem)',
  lg: 'clamp(3rem, 6vw, 5.5rem)',
  xl: 'clamp(4rem, 8vw, 7rem)'
};

const sizeMapSubtitle = {
  sm: 'clamp(0.875rem, 1.5vw, 1rem)',
  md: 'clamp(1rem, 2vw, 1.25rem)',
  lg: 'clamp(1.25rem, 2.5vw, 1.5rem)'
};

const alignMap = {
  'flex-start': 'left',
  'center': 'center',
  'flex-end': 'right'
};

export default function EntregasHero() {
  const { settings } = useShopSettingsStore();

  const iconName = settings.shipping_hero_icon;
  const IconCmp = iconName ? Icons[iconName] : null;

  // Design values
  const opacity = settings.shipping_hero_overlay_opacity !== undefined ? parseInt(settings.shipping_hero_overlay_opacity) / 100 : 0.5;
  const hexOpacity = Math.round(opacity * 255).toString(16).padStart(2, '0');
  const overlayColor = (settings.shipping_hero_overlay_color || "#000000") + hexOpacity;
  const textColor = settings.shipping_hero_text_color || "#ffffff";
  
  const alignV = settings.shipping_hero_align_v || "center";
  const alignH = settings.shipping_hero_align_h || "center";
  const titleSize = sizeMapTitle[settings.shipping_hero_title_size || "md"];
  const subtitleSize = sizeMapSubtitle[settings.shipping_hero_subtitle_size || "md"];
  const textAlign = alignMap[alignH];

  return (
    <section 
      className="vox-entregas-hero"
      style={{
        alignItems: alignV,
        justifyContent: alignH,
        paddingTop: alignV === 'flex-start' ? '120px' : '0',
        paddingBottom: alignV === 'flex-end' ? '60px' : '0',
        color: textColor
      }}
    >
      {settings.shipping_hero_video && (
        <video 
          className="vox-hero-video-bg"
          src={settings.shipping_hero_video.startsWith('http') ? settings.shipping_hero_video : `${URL_BASE_VIDEOS}/${settings.shipping_hero_video}`}
          autoPlay 
          loop 
          muted 
          playsInline
        />
      )}
      <div className="vox-hero-overlay" style={{ background: overlayColor }}></div>
      <div className="vox-hero-content vox-reveal" style={{ textAlign: textAlign, width: '100%', maxWidth: 1200, padding: '0 20px', color: textColor }}>
        {IconCmp && (
          <div className="vox-icon-container" style={{ justifyContent: alignH, color: textColor }}>
            <IconCmp strokeWidth={1} size={80} className="vox-hero-icon" />
          </div>
        )}
        {settings.shipping_hero_title && (
          <h1 className="vox-hero-title" style={{ fontSize: titleSize, textAlign: textAlign, margin: alignH === 'center' ? '0 auto 1.5rem' : '0 0 1.5rem' }}>
            {settings.shipping_hero_title}
          </h1>
        )}
        {settings.shipping_hero_subtitle && (
          <p className="vox-hero-subtitle" style={{ fontSize: subtitleSize, color: textColor, opacity: 0.8, textAlign: textAlign, margin: alignH === 'center' ? '0 auto' : '0' }}>
            {settings.shipping_hero_subtitle}
          </p>
        )}
      </div>

      {/* Indicador de Scroll */}
      {String(settings.shipping_hero_scroll_show) !== "0" && (
        <div 
          className="vox-scroll-indicator" 
          style={{ 
            ...getScrollPosition(settings.shipping_hero_scroll_pos),
            transform: `scale(${getScrollScale(settings.shipping_hero_scroll_size)}) ${getScrollPosition(settings.shipping_hero_scroll_pos).transform || ''}`,
            '--scroll-color': settings.shipping_hero_scroll_color || '#ffffff'
          }}
        >
          <div className={`vox-scroll-${(settings.shipping_hero_scroll_type || 'mouse').replace('_bounce', '').replace('pulse_', '')}`}></div>
        </div>
      )}
    </section>
  );
}

// Helpers para el scroll
function getScrollPosition(pos = 'bottom_center') {
  const base = { top: 'auto', bottom: 'auto', left: 'auto', right: 'auto', transform: '' };
  switch (pos) {
    case 'bottom_left': return { ...base, bottom: '40px', left: '40px' };
    case 'bottom_right': return { ...base, bottom: '40px', right: '40px' };
    case 'center_left': return { ...base, top: '50%', left: '40px', transform: 'translateY(-50%)' };
    case 'center_right': return { ...base, top: '50%', right: '40px', transform: 'translateY(-50%)' };
    case 'top_center': return { ...base, top: '40px', left: '50%', transform: 'translateX(-50%)' };
    case 'bottom_center':
    default: return { ...base, bottom: '40px', left: '50%', transform: 'translateX(-50%)' };
  }
}

function getScrollScale(size = 'md') {
  switch (size) {
    case 'sm': return 0.7;
    case 'lg': return 1.3;
    case 'md':
    default: return 1;
  }
}
