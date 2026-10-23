import React from 'react';

interface WorkplaceLogoProps {
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'icon-only';
  theme?: 'light' | 'dark';
  height?: number | string;
  showSubtitle?: boolean;
}

/**
 * Official Workplace Arquitetura Logo
 * Faithful vector reproduction of the origami WP monogram & architectural typography.
 */
export const WorkplaceLogo: React.FC<WorkplaceLogoProps> = ({
  className = '',
  variant = 'horizontal',
  theme = 'light',
  height,
  showSubtitle = true,
}) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#171717';
  const subtitleColor = isDark ? '#F5B800' : '#525252';
  const goldColor = '#F5B800';

  // The standalone geometric golden-yellow WP origami icon
  const renderIcon = (size: number = 36) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-label="Workplace Origami Monogram"
    >
      {/* Golden Origami WP Mark */}
      <defs>
        <linearGradient id="wpGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFC700" />
          <stop offset="100%" stopColor="#E5A800" />
        </linearGradient>
      </defs>

      {/* Left chevron and center fold (W structure) */}
      <path
        d="M 0 0 L 22 0 L 48 54 L 48 55 L 72 6 L 94 6 L 56 86 L 40 86 Z"
        fill="url(#wpGoldGrad)"
      />

      {/* Upper Loop triangle (P counter & loop) */}
      <path
        d="M 44 14 L 98 14 L 68 70 L 52 70 L 76 28 L 50 28 Z"
        fill="url(#wpGoldGrad)"
      />
    </svg>
  );

  if (variant === 'icon-only') {
    const size = typeof height === 'number' ? height : 36;
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderIcon(size)}</div>;
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        {/* Yellow Origami Icon */}
        <div className="mb-2">
          {renderIcon(typeof height === 'number' ? height * 0.5 : 48)}
        </div>

        {/* WORKPLACE wordmark */}
        <div className="flex items-center tracking-tight font-black font-sans leading-none text-xl sm:text-2xl" style={{ color: textColor }}>
          <span>WORKPL</span>
          {/* Custom Chevron A without horizontal crossbar */}
          <svg viewBox="0 0 20 22" className="w-[0.72em] h-[0.84em] mx-[0.02em] inline-block fill-current">
            <path d="M 10 0 L 20 22 L 14.5 22 L 10 11 L 5.5 22 L 0 22 Z" />
          </svg>
          <span>CE</span>
        </div>

        {/* ARQUITETURA CORPORATIVA */}
        {showSubtitle && (
          <span
            className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.28em] mt-1.5"
            style={{ color: subtitleColor }}
          >
            Arquitetura Corporativa
          </span>
        )}
      </div>
    );
  }

  // Default: Horizontal layout (Perfect for Header, Cards, Modals)
  const defaultHeight = height || 36;
  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      style={{ height: defaultHeight }}
    >
      {/* Icon on left */}
      <div className="shrink-0">
        {renderIcon(typeof defaultHeight === 'number' ? Math.round(defaultHeight * 0.95) : 34)}
      </div>

      {/* Typography on right */}
      <div className="flex flex-col justify-center leading-none">
        <div
          className="flex items-baseline font-black tracking-[-0.03em] font-sans text-lg sm:text-xl leading-none"
          style={{ color: textColor }}
        >
          <span>WORKPL</span>
          {/* Custom Chevron A without horizontal crossbar */}
          <svg viewBox="0 0 20 22" className="w-[0.72em] h-[0.82em] mx-[0.02em] inline-block fill-current">
            <path d="M 10 0 L 20 22 L 14.5 22 L 10 11 L 5.5 22 L 0 22 Z" />
          </svg>
          <span>CE</span>
        </div>

        {showSubtitle && (
          <span
            className="text-[8px] sm:text-[9px] uppercase font-bold tracking-[0.24em] mt-1 shrink-0"
            style={{ color: subtitleColor }}
          >
            Arquitetura Corporativa
          </span>
        )}
      </div>
    </div>
  );
};
