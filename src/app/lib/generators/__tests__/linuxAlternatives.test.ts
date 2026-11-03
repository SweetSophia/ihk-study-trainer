import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateStructuredAnswer } from '../../answerValidation';
import { COMMAND_DATABASE, generateLinuxQuestion } from '../linux';

afterEach(()=>vi.restoreAllMocks());
function questionFor(command:string,direction:'descriptionToCommand'|'commandToDescription'='descriptionToCommand',seed=1){
 const index=COMMAND_DATABASE.findIndex(entry=>entry.command===command);
 if(index<0)throw new Error(`Missing fixture command ${command}`);
 let state=Math.imul(seed,0x9e3779b9)>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/2**32};
 vi.spyOn(Math,'random').mockImplementation(random).mockReturnValueOnce(index/COMMAND_DATABASE.length).mockReturnValueOnce(direction==='descriptionToCommand'?0:1);
 return generateLinuxQuestion();
}
const additions=[
 ['ls',['dir','vdir'],['cd','pwd']],
 ['top',['htop'],['ps','free']],
 ['ps',['top','htop'],['nice','kill']],
 ['nano',['pico'],['ed','red','vim']],
 ['ss',['netstat'],['ping','ip']],
 ['wget',['curl'],['ssh','ping']],
 ['locate',['plocate'],['find','ls']],
 ['awk',['gawk','mawk'],['cut','wc']],
 ['who',['users','w'],['whoami','last']],
 ['apt',['apt-get'],['apt-cache','dnf']],
 ['nslookup',['host'],['ping','getent']],
 ['gzip',['pigz'],['bzip2','xz']],
 ['cut',['awk','gawk','mawk'],['wc','sort']],
 ['screen',['tmux'],['nohup','bg']],
] as const;
describe('curated Linux tool capabilities',()=>{
 it.each(additions)('%s accepts supported alternatives but not related wrong tools',(command,accepted,rejected)=>{
  const question=questionFor(command),inputs=question.answerInputs??[];
  for(const answer of accepted){
   expect(validateStructuredAnswer(inputs,question.expectedAnswers,{answer}),`${command}: ${answer}`).toBe(true);
   expect(validateStructuredAnswer(inputs,question.expectedAnswers,{answer:`  ${answer.toUpperCase()}  `})).toBe(true);
  }
  for(const answer of rejected)expect(validateStructuredAnswer(inputs,question.expectedAnswers,{answer}),`${command}: ${answer}`).toBe(false);
 });
 it.each([
  ['netstat',['ss']],['curl',['wget']],['dig',['host','nslookup']],['w',['who','users']],
  ['htop',['top']],['tmux',['screen']],['kill',['pkill','killall']],
  ['killall',['pkill']],['pkill',['killall']],['nice',['renice']],['renice',['nice']],
  ['systemctl enable',['systemctl start','systemctl']],['systemctl disable',['systemctl stop']],
  ['systemctl daemon-reload',['systemctl reload']],['tracepath',['traceroute']],['chown',['chgrp']],
 ] as const)('%s retains its more specific learning objective',(command,rejected)=>{
  const question=questionFor(command);
  for(const answer of rejected)expect(validateStructuredAnswer(question.answerInputs??[],question.expectedAnswers,{answer})).toBe(false);
 });
 it('retains explicit multiword/operator forms and never strips extra command syntax',()=>{
  for(const entry of COMMAND_DATABASE){
   const question=questionFor(entry.command),inputs=question.answerInputs??[];
   expect(validateStructuredAnswer(inputs,question.expectedAnswers,{answer:entry.command})).toBe(true);
   for(const answer of [`${entry.command} --unexpected`,`sudo ${entry.command}`,`/usr/bin/${entry.command}`,`${entry.command}; echo nope`,`${entry.command} | cat`,`${entry.command}\nwrong`]){
    expect(validateStructuredAnswer(inputs,question.expectedAnswers,{answer}),`${entry.command}: ${answer}`).toBe(false);
   }
  }
  const question=questionFor('systemctl enable');
  expect(validateStructuredAnswer(question.answerInputs??[],question.expectedAnswers,{answer:' SYSTEMCTL\t enable '})).toBe(true);
 });
});
describe('unambiguous command-to-description choices',()=>{
 it.each([
  ['htop','top'],['htop','ps'],['top','ps'],['dig','nslookup'],['tmux','screen'],
  ['curl','wget'],['w','who'],['netstat','ss'],['awk','cut'],
 ] as const)('%s does not offer the also-valid %s description as a wrong choice',(command,broad)=>{
  const description=COMMAND_DATABASE.find(entry=>entry.command===broad)!.description;
  const offeredSets=new Set<string>();
  for(let seed=1;seed<=64;seed++){
   const question=questionFor(command,'commandToDescription',seed);
   const options=question.answerInputs![0].valueOptions!;
   offeredSets.add([...options].sort().join('\n'));
   expect(options,`${command}/${broad}, seed ${seed}`).not.toContain(description);
   expect(validateStructuredAnswer(question.answerInputs??[],question.expectedAnswers,{answer:description})).toBe(true);
  }
  expect(offeredSets.size).toBeGreaterThan(1);
 });
 it('keeps five unique choices and rejects every offered wrong option for all entries',()=>{
  for(const entry of COMMAND_DATABASE){
   const question=questionFor(entry.command,'commandToDescription'),input=question.answerInputs![0],options=input.valueOptions!;
   expect(options).toHaveLength(5);expect(new Set(options).size).toBe(5);expect(options).toContain(entry.description);
   for(const answer of options)expect(validateStructuredAnswer([input],question.expectedAnswers,{answer})).toBe(answer===entry.description);
  }
 });
});
