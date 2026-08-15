import React from 'react';
import { API_BASE_URL } from '../config/api';

export const getVideoInfo = (url) => {
  if (!url) return { type: 'none', url: '' };

  // Local uploaded video
  if (url.startsWith('/storage/')) {
    return { type: 'html5', url: `${API_BASE_URL}${url}` };
  }

  // YouTube
  const ytShortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (ytShortsMatch) {
    return { type: 'youtube', id: ytShortsMatch[1] };
  }

  const ytWatchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (ytWatchMatch) {
    return { type: 'youtube', id: ytWatchMatch[1] };
  }

  const ytBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytBeMatch) {
    return { type: 'youtube', id: ytBeMatch[1] };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { type: 'vimeo', id: vimeoMatch[1] };
  }

  // Default to raw HTML5 video if it's an external link (mp4, etc)
  return { type: 'html5', url: url };
};

export const VideoPlayer = ({ url, autoPlay = true, style = {}, className = '', onMouseOver, onMouseOut }) => {
  const info = getVideoInfo(url);

  if (info.type === 'youtube') {
    // We use playlist={id} and loop=1 to make it loop
    // pointerEvents: 'none' is important so clicks pass through to the parent <Link>
    const ytUrl = `https://www.youtube.com/embed/${info.id}?autoplay=${autoPlay ? 1 : 0}&mute=1&loop=1&playlist=${info.id}&controls=0&modestbranding=1&rel=0`;
    return (
      <iframe
        src={ytUrl}
        style={{ ...style, border: 'none', pointerEvents: 'none' }}
        className={className}
        allow="autoplay; encrypted-media"
        title="YouTube Video"
      />
    );
  }

  if (info.type === 'vimeo') {
    const vimUrl = `https://player.vimeo.com/video/${info.id}?autoplay=${autoPlay ? 1 : 0}&loop=1&muted=1&background=1`;
    return (
      <iframe
        src={vimUrl}
        style={{ ...style, border: 'none', pointerEvents: 'none' }}
        className={className}
        allow="autoplay; encrypted-media"
        title="Vimeo Video"
      />
    );
  }

  // Fallback to HTML5 native video
  return (
    <video
      src={info.url}
      className={className}
      style={style}
      autoPlay={autoPlay}
      loop
      muted
      playsInline
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
    />
  );
};
