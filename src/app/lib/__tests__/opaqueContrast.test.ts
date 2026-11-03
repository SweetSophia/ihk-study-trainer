import { expect, it } from 'vitest';
import { opaqueContrastRatio } from '../../../../scripts/lib/contrast.mjs';
it('measures independently known opaque sRGB contrasts',()=>{
 expect(opaqueContrastRatio('#000000','#ffffff')).toBe(21);
 expect(opaqueContrastRatio('rgb(255, 255, 255)','#ffffff')).toBe(1);
 expect(opaqueContrastRatio('rgba(0, 0, 0, 1)','rgb(255, 255, 255)')).toBe(21);
 expect(opaqueContrastRatio('#777777','#ffffff')).toBeCloseTo(4.478,3);
});
it.each(['rgba(0,0,0,0)','rgba(0,0,0,0.5)','transparent','not-a-color'])('fails closed instead of crediting unsupported or transparent foreground %s',value=>{
 expect(opaqueContrastRatio(value,'#ffffff')).toBeNull();
});
it('fails closed for a transparent measurement background',()=>{
 expect(opaqueContrastRatio('#000000','rgba(255,255,255,0)')).toBeNull();
});
it('accepts shorthand opaque hex emitted by the production CSS minifier',()=>{
 expect(opaqueContrastRatio('#000','#fff')).toBe(21);
 expect(opaqueContrastRatio('#fff','#ffffff')).toBe(1);
});
