import { fireEvent, screen, within } from '@testing-library/react';
import { ALL_MODULES, type ModuleId } from '../app/lib/modules';
import { getModuleTopic } from '../app/lib/moduleTopics';

/** Exercise real disclosures instead of reaching through hidden topic panels. */
export async function chooseModule(module:ModuleId) {
 const nav=within(await screen.findByRole('navigation',{name:'Lernmodule'}));
 if(!nav.queryByRole('button',{name:/^AP2-Trainingslauf/})) fireEvent.click(nav.getByRole('button',{name:/^Aufgabe wechseln/}));
 const topic=getModuleTopic(module);
 if(topic) {
  const group=nav.getByRole('button',{name:new RegExp(`^${topic.label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`)});
  if(group.getAttribute('aria-expanded')!=='true') fireEvent.click(group);
 }
 const name=ALL_MODULES.find(item=>item.id===module)!.name;
 fireEvent.click(nav.getByRole('button',{name:module==='ap2TrainingRun'?/^AP2-Trainingslauf/:name}));
}
