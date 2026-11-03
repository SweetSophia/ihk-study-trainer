import type { ModuleId } from './modules';

/** Presentation only: stable module/progress identities live in modules.ts. */
export const MODULE_TOPICS = [
 {id:'numbers',label:'Rechnen & Zahlensysteme',modules:['bandwidth','imageCalc','imageTransferCombo','overhead','unitConversion','binary','hex','hexBinary']},
 {id:'networks',label:'Netzwerke',modules:['subnetting','subnetMask','aggregation','ports','osi','cables','ap2NetworkPlanning','ap2Troubleshooting']},
 {id:'systems',label:'Systeme & Sicherheit',modules:['linux','cloud','raid','ap2AccessControl','ap2BackupRecovery']},
 {id:'data',label:'Daten & Algorithmen',modules:['sql','ap2DatabaseDesign','ap2AlgorithmTracing']},
 {id:'business',label:'Wirtschaft & Projekt',modules:['handelskalkulationVorwaerts','handelskalkulationRueckwaerts','handelskalkulationDifferenz','ap2CostComparison','ap2ProjectPlanning']},
] as const satisfies readonly {id:string;label:string;modules:readonly ModuleId[]}[];

export function getModuleTopic(module:string|null) {
 return MODULE_TOPICS.find(topic=>(topic.modules as readonly string[]).includes(module??''));
}
