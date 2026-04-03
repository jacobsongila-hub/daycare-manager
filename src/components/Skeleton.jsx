import React from 'react';

export default function Skeleton({ width, height, borderRadius, style, className = "" }) {
  const baseStyle = {
    width: width || '100%',
    height: height || '20px',
    borderRadius: borderRadius || 'var(--radius-sm)',
    ...style
  };

  return <div className={`skeleton ${className}`} style={baseStyle} aria-hidden="true" />;
}
