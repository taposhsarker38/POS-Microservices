function hexToRgb(hex: string) {
  hex = hex.replace('#','');
  if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
  const n = parseInt(hex,16);
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}
function rgbToHsl(r:number,g:number,b:number){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){
    const d=max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h = (g-b)/d + (g<b?6:0); break;
      case g: h = (b-r)/d + 2; break;
      case b: h = (r-g)/d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}
function hslToCss(h:number,s:number,l:number){ return `hsl(${h} ${s}% ${l}%)`; }

export function adjustColorForTime(hex:string, slot:'morning'|'afternoon'|'evening'|'night') {
  try {
    const { r,g,b } = hexToRgb(hex);
    const { h,s,l } = rgbToHsl(r,g,b);
    let newL = l;
    if (slot === 'morning') newL = Math.min(95, l + 8);
    if (slot === 'afternoon') newL = Math.min(92, l + 4);
    if (slot === 'evening') newL = Math.max(10, l - 6);
    if (slot === 'night') newL = Math.max(6, l - 18);
    return hslToCss(h, Math.min(100, s+2), newL);
  } catch {
    // fallback
    return hex;
  }
}