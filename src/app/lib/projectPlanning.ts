export type Activity = { id: string; label: string; duration: number; predecessors: readonly string[] };
export const ACTIVITIES: readonly Activity[] = [
 {id:'A',label:'Anforderungen und Abnahmekriterien',duration:2,predecessors:[]},
 {id:'B',label:'Geräte beschaffen',duration:4,predecessors:['A']},
 {id:'C',label:'Backup-Konzept vorbereiten',duration:3,predecessors:['A']},
 {id:'D',label:'System installieren',duration:2,predecessors:['B','C']},
 {id:'E',label:'Wiederherstellung testen',duration:2,predecessors:['D']},
 {id:'F',label:'Übergabe',duration:1,predecessors:['E']},
];
export const FIELDS = {es:'FAZ',ef:'FEZ',ls:'SAZ',lf:'SEZ',float:'Gesamtpuffer'} as const;
export type Timing = Record<keyof typeof FIELDS, number>;
export type ProjectAnswers = {rows:Record<string,Record<string,string>>;duration:string;critical:string[]};
export function calculateSchedule(activities: readonly Activity[]): {rows:Record<string,Timing>;duration:number;critical:string[]} {
 const ids=new Set(activities.map(a=>a.id));
 if(!activities.length || ids.size!==activities.length || activities.some(a=>!Number.isSafeInteger(a.duration)||a.duration<=0||a.predecessors.some(p=>!ids.has(p)))) throw new Error('Ungültige Vorgänge.');
 const rows:Record<string,Timing>={};const ordered:Activity[]=[];
 while(ordered.length<activities.length){
  const ready=activities.filter(a=>!rows[a.id]&&a.predecessors.every(p=>rows[p]));
  if(!ready.length) throw new Error('Zyklische Abhängigkeiten.');
  for(const a of ready){const es=Math.max(0,...a.predecessors.map(p=>rows[p].ef));rows[a.id]={es,ef:es+a.duration,ls:0,lf:0,float:0};ordered.push(a);}
 }
 const duration=Math.max(...Object.values(rows).map(r=>r.ef));
 if(!Number.isSafeInteger(duration)) throw new Error('Projektdauer zu groß.');
 for(const a of [...ordered].reverse()){
  const successors=activities.filter(b=>b.predecessors.includes(a.id));
  const lf=successors.length?Math.min(...successors.map(b=>rows[b.id].ls)):duration;
  Object.assign(rows[a.id],{lf,ls:lf-a.duration,float:lf-a.duration-rows[a.id].es});
 }
 return {rows,duration,critical:activities.filter(a=>rows[a.id].float===0).map(a=>a.id)};
}
export function validateProjectAnswers(answers:ProjectAnswers,changed:boolean):{valid:boolean;errors:Record<string,string>} {
 const expected=calculateSchedule(ACTIVITIES.map(a=>changed&&a.id==='C'?{...a,duration:5}:a));
 const errors:Record<string,string>={};
 function check(key:string,value:string|undefined,want:number){
  const text=value?.trim()??'';
  if(!/^\d+$/.test(text)||!Number.isSafeInteger(Number(text))) errors[key]='Bitte eine nichtnegative ganze Zahl in Arbeitstagen eingeben.';
  else if(Number(text)!==want) errors[key]='Dieser Wert stimmt für die angegebenen Abhängigkeiten nicht.';
 }
 if(!changed) for(const a of ACTIVITIES) for(const key of Object.keys(FIELDS) as (keyof Timing)[]) check(`${a.id}.${key}`,answers.rows[a.id]?.[key],expected.rows[a.id][key]);
 check('duration',answers.duration,expected.duration);
 if(answers.critical.length!==expected.critical.length||new Set(answers.critical).size!==answers.critical.length||expected.critical.some(id=>!answers.critical.includes(id))) errors.critical='Wähle alle und nur die Vorgänge mit Gesamtpuffer 0.';
 return {valid:Object.keys(errors).length===0,errors};
}
