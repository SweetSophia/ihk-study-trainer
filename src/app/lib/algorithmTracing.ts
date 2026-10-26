export type ServerRecord = { readonly id: string; readonly freeGiB: number; readonly maintenance: boolean };
export const THRESHOLD = 20;
export const SERVERS: readonly ServerRecord[] = [
 {id:'A',freeGiB:20,maintenance:false}, {id:'B',freeGiB:5,maintenance:true},
 {id:'C',freeGiB:21,maintenance:false}, {id:'D',freeGiB:0,maintenance:false},
 {id:'E',freeGiB:10,maintenance:false},
];
export const PSEUDOCODE = `geprüft ← 0
warnungen ← 0
meldungen ← leere Liste
FÜR JEDEN server IN serverListe
    WENN server.wartung = FALSCH
        geprüft ← geprüft + 1
        WENN server.freiGiB ≤ grenze
            warnungen ← warnungen + 1
            meldungen ← meldungen mit server.id am Ende`;
export const BOUNDARY_CASES = [
 {id:'equal-active',label:'20 GiB frei, keine Wartung'},
 {id:'above-active',label:'21 GiB frei, keine Wartung'},
 {id:'equal-maintenance',label:'20 GiB frei, Wartung'},
 {id:'below-active',label:'19 GiB frei, keine Wartung'},
] as const;
/** Reference for supplied data only. Never parses or executes learner code. */
export function traceServers(servers:readonly ServerRecord[],threshold:number){
 let checked=0;let warnings=0;const output:string[]=[];
 const rows=servers.map(server=>{
  if(!server.maintenance){checked++;if(server.freeGiB<=threshold){warnings++;output.push(server.id);}}
  return {id:server.id,checked,warnings};
 });
 return {rows,output};
}
export type TraceAnswers={rows:Record<string,{checked:string;warnings:string}>;output:string};
export type Validation={valid:boolean;errors:Record<string,string>};
export function validateTrace(answers:TraceAnswers):Validation{
 const expected=traceServers(SERVERS,THRESHOLD);const errors:Record<string,string>={};
 for(const row of expected.rows)for(const key of ['checked','warnings'] as const){
  const value=answers.rows[row.id]?.[key]?.trim()??'';
  if(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value)))errors[`${row.id}.${key}`]='Bitte eine nichtnegative ganze Zahl eingeben.';
  else if(Number(value)!==row[key])errors[`${row.id}.${key}`]='Dieser Zählerstand stimmt nach dieser Iteration nicht.';
 }
 const output=answers.output.trim().split(',').map(id=>id.trim());
 if(output.length!==expected.output.length||output.some((id,i)=>id!==expected.output[i]))errors.output='Prüfe die gemeldeten IDs und ihre Reihenfolge. Jede Meldung bleibt in Eingabereihenfolge.';
 return {valid:Object.keys(errors).length===0,errors};
}
export function validateBoundary(comparator:string,testCase:string):Validation{
 const errors:Record<string,string>={};
 if(comparator!=='<=')errors.comparator='Die Bedingung muss „höchstens“ einschließlich Gleichheit abbilden.';
 if(testCase!=='equal-active')errors.testCase='Gesucht ist ein Fall, bei dem sich < und ≤ tatsächlich unterschiedlich verhalten.';
 return {valid:Object.keys(errors).length===0,errors};
}
