import React from 'react';
import InnerImageZoom from 'react-inner-image-zoom';
import 'react-inner-image-zoom/lib/styles.min.css';
import './ZoomImage.css';

function computeZoomSrc(url) {
  try {
    if (typeof url !== 'string') return url;
    // Cloudinary: insert higher width/quality transforms
    if (/res\.cloudinary\.com/.test(url) && /\/upload\//.test(url)) {
      return url.replace('/upload/', '/upload/w_1800,q_auto,f_auto/');
    }
    return url; // fallback to same src if not Cloudinary
  } catch (_) {
    return url;
  }
}

export default function ZoomImage({ src, alt, zoomSrc, className, zoomType = 'hover', fullscreenOnMobile = true }) {
  const actualZoomSrc = zoomSrc || computeZoomSrc(src);
  return (
    <InnerImageZoom
      src={src}
      zoomSrc={actualZoomSrc}
      alt={alt}
      zoomType={zoomType}
      zoomPreload
      fullscreenOnMobile={fullscreenOnMobile}
      className={className}
    />
  );
}