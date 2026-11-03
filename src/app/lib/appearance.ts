export type AppearancePreference = 'system' | 'light' | 'dark';
export const APPEARANCE_KEY = 'ihk_theme_preference';
export const APPEARANCE_EVENT = 'ihk-appearance-change';
export function readAppearance():AppearancePreference {
 try {
  const value=localStorage.getItem(APPEARANCE_KEY);
  return value==='light'||value==='dark'?value:'system';
 } catch {return 'system'}
}
export function applyAppearance(preference:AppearancePreference) {
 const dark=preference==='dark'||(preference==='system'&&window.matchMedia?.('(prefers-color-scheme: dark)').matches);
 document.documentElement.dataset.appearancePreference=preference;
 document.documentElement.dataset.theme=dark?'dark':'light';
 document.documentElement.style.colorScheme=dark?'dark':'light';
}
/** Runs before body paint; self-contained so no module/runtime/CSP change is needed. */
function bootstrapAppearance() {
 let preference='system';
 try {const value=localStorage.getItem('ihk_theme_preference');if(value==='light'||value==='dark') preference=value;} catch {}
 const dark=preference==='dark'||(preference==='system'&&window.matchMedia?.('(prefers-color-scheme: dark)').matches);
 document.documentElement.dataset.appearancePreference=preference;
 document.documentElement.dataset.theme=dark?'dark':'light';
 document.documentElement.style.colorScheme=dark?'dark':'light';
}
export const APPEARANCE_BOOTSTRAP=`(${bootstrapAppearance.toString()})();`;
