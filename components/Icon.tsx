import React from 'react';
import { SVG_ICONS } from './svg-icons';

export type IconName = string;

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: IconName;
  className?: string;
  solid?: boolean;
}

const Icon: React.FC<IconProps> = ({ name, className = '', solid = false, ...props }) => {
  let svgString = SVG_ICONS[name] || SVG_ICONS['default'] || '';
  
  if (!svgString) return null;

  // Strip hardcoded width and height to make responsive
  svgString = svgString.replace(/width="[^"]+"/, '').replace(/height="[^"]+"/, '');

  if (svgString.includes('fill="currentColor"')) {
    svgString = svgString.replace(/<svg /, '<svg width="100%" height="100%" stroke="none" ');
  } else {
    svgString = svgString.replace(/<svg /, '<svg width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ');
  }

  // Define default sizing if no w- or h- or text- classes are passed
  const hasSize = /\b(w-\d+|w-\[.*?\]|w-auto|w-full|w-screen|w-min|w-max|w-fit|size-\d+|size-\[.*?\]|h-\d+|h-\[.*?\]|h-auto|h-full|h-screen|h-min|h-max|h-fit|text-(xs|sm|base|lg|[2-9]xl|\[.*?\]))\b/.test(className);
  
  // If no size class exists at all, fallback to w-5 h-5
  const finalClass = hasSize ? className : `${className} w-5 h-5`.trim();

  // Determine if we need to inject the [1em] sizing. We only inject it if there are NO specific width/height/size classes in finalClass.
  // We should match actual w- classes, not things like 'yellow-500'
  const hasWidthClass = /\b(w-\d+|w-\[.*?\]|w-auto|w-full|w-screen|w-min|w-max|w-fit|size-\d+|size-\[.*?\])\b/.test(finalClass);

  return (
    <span 
      className={`inline-flex shrink-0 items-center justify-center [&>svg]:w-full [&>svg]:h-full ${hasWidthClass ? '' : 'w-[1em] h-[1em]'} ${finalClass}`}
      dangerouslySetInnerHTML={{ __html: svgString }}
      {...props}
    />
  );
};

export default Icon;
