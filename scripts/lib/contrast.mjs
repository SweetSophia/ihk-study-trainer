/** Narrow acceptance gate for opaque sRGB tokens. Unknown or translucent
 * colours fail closed; they must never masquerade as high-contrast black. */
function opaqueRgb(value) {
 let text=value.trim();
 if(/^#[\da-f]{3}$/i.test(text))text="#"+[...text.slice(1)].map(value=>value+value).join("");
 if(/^#[\da-f]{6}$/i.test(text))return [0,2,4].map(index=>parseInt(text.slice(1+index,3+index),16)/255);
 const match=text.match(/^rgba?\(([^)]+)\)$/i);if(!match)return null;
 const values=match[1].split(',').map(part=>Number(part.trim()));
 if(values.length<3||values.length>4||values.some(value=>!Number.isFinite(value)))return null;
 if(values.length===4&&values[3]!==1)return null;
 if(values.slice(0,3).some(value=>value<0||value>255))return null;
 return values.slice(0,3).map(value=>value/255);
}
/** @returns {number|null} Null means this gate cannot safely measure the pair. */
export function opaqueContrastRatio(foreground,background) {
 const first=opaqueRgb(foreground),second=opaqueRgb(background);if(!first||!second)return null;
 const luminance=rgb=>{const c=rgb.map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
 const a=luminance(first),b=luminance(second);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
