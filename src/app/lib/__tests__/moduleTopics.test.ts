import { expect, it } from 'vitest';
import { ALL_MODULES } from '../modules';
import { MODULE_TOPICS, getModuleTopic } from '../moduleTopics';

it('assigns each selectable exercise exactly once, with the run outside the five topics', () => {
 const ids = MODULE_TOPICS.flatMap(topic => [...topic.modules]);
 expect(MODULE_TOPICS.map(topic=>topic.label)).toEqual(['Rechnen & Zahlensysteme','Netzwerke','Systeme & Sicherheit','Daten & Algorithmen','Wirtschaft & Projekt']);
 expect(ids).toHaveLength(29);
 expect(new Set(ids).size).toBe(29);
 expect(new Set(ids)).toEqual(new Set(ALL_MODULES.filter(module=>module.id!=='ap2TrainingRun').map(module=>module.id)));
 expect(ids).not.toContain('handelskalkulation');
 expect(getModuleTopic('handelskalkulationDifferenz')?.label).toBe('Wirtschaft & Projekt');
 expect(getModuleTopic('sql')?.label).toBe('Daten & Algorithmen');
 expect(getModuleTopic('ap2TrainingRun')).toBeUndefined();
 expect(getModuleTopic('toString')).toBeUndefined();
});
