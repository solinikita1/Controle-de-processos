import React from 'react';
interface WorkplaceLogoProps {
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'icon-only';
  theme?: 'light' | 'dark';
  height?: number | string;
  showSubtitle?: boolean;
}
/** Original artwork supplied by Workplace. Keep the complete signature and proportions. */
export const WorkplaceLogo: React.FC<WorkplaceLogoProps> = ({className = '', theme = 'light', height}) => (
  <img
    src={theme === 'dark' ? '/brand/workplace-dark.png' : '/brand/workplace-horizontal.png'}
    alt="Workplace Arquitetura Corporativa"
    className={`block max-w-full object-contain ${className}`}
    style={{height: height ?? (theme === 'dark' ? 100 : 36), width: 'auto'}}
  />
);
