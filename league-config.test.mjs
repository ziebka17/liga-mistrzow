import test from 'node:test';
import assert from 'node:assert/strict';
import {SEASONS,seasonFor,seasonPlayer,tradingDays,dataPath,monthData,mergeSystems,seasonDay} from './league-config.mjs';
test('Firebase day arrays with null gaps preserve manual entries and merge source',()=>{
 const raw={obrot:[null,{antek_klif:99,michal_klif:333},null,{michal_klif:444}],systems:{version:1,month:'2026-10',players:{antek_klif:{}},obrot:[null,{antek_klif:4430},null,{antek_klif:200}]}};
 const before=structuredClone(raw),result=mergeSystems(raw);
 assert.deepEqual(result.obrot,{'1':{michal_klif:333,antek_klif:4430},'3':{michal_klif:444,antek_klif:200}});
 assert.deepEqual(raw,before);assert.deepEqual(mergeSystems(result),result);
});
test('months never mix historical values or write paths',()=>{
 const sep=SEASONS['2026-09'],oct=seasonFor('2026-10');
 const root={obrot:{1:{x:99}},miesiace:{'2026-10':{obrot:{1:{x:12}}}}};
 assert.equal(monthData(root,sep).obrot[1].x,99);assert.equal(monthData(root,oct).obrot[1].x,12);assert.deepEqual(monthData({},oct),{});
 for(const key of ['obrot','podejscia','godziny','log','cele','podejscia_lok','przypomnienia','sms_kolejka']){
  assert.equal(dataPath(key+'/1/x',sep),key+'/1/x');assert.equal(dataPath(key+'/1/x',oct),'miesiace/2026-10/'+key+'/1/x');
 }
 for(const key of ['admin','uzytkownicy','zawodnicy','logowania','telefony','wykluczenia','/'])assert.equal(dataPath(key,oct),key);
 assert.equal(seasonFor('invalid'),oct);
});
test('September remains original; October includes Klif and excludes Kraków and Antek Riviera',()=>{
 const sep=SEASONS['2026-09'],oct=SEASONS['2026-10'];
 for(const id of ['michal_klif','szymon_klif']){const p={id,lok:'Klif',klif:true};assert.equal(seasonPlayer(p,sep).pozaKonkursem,true);assert.equal(seasonPlayer(p,oct).pozaKonkursem,false);}
 const p={id:'antek_klif',n:'Antek (Klif)',lok:'Klif',klif:true};
 assert.equal(seasonPlayer(p,sep).n,'Antek (Klif)');assert.equal(seasonPlayer(p,oct).n,'Antek Riviera');assert.equal(seasonPlayer(p,oct).id,p.id);assert.equal(seasonPlayer(p,oct).lok,'Riviera');assert.equal(seasonPlayer(p,oct).pozaKonkursem,true);
 assert.equal(seasonPlayer({id:'krk',lok:'Kraków'},oct).pozaKonkursem,true);
 assert.equal(seasonPlayer({id:'dawid',lok:'Riviera'},oct).pozaKonkursem,false);
});
test('October has 27 trading days including 31, month boundary uses Warsaw',()=>{
 const oct=SEASONS['2026-10'];assert.equal(tradingDays(oct).length,27);assert.ok(tradingDays(oct).includes(31));assert.ok(!tradingDays(oct).includes(4));
 assert.equal(seasonDay(oct,new Date('2026-09-30T22:01:00Z')),1);assert.equal(seasonDay(oct,new Date('2026-10-31T12:00:00Z')),31);assert.equal(seasonDay(oct,new Date('2026-11-01T12:00:00Z')),32);
});
test('Systems overrides only connected sellers, corrections and deletions replace instead of adding',()=>{
 const raw={obrot:{1:{antek_klif:99,michal_klif:1000},2:{antek_klif:500}},podejscia:{1:{michal_klif:20}},systems:{version:1,month:'2026-10',players:{antek_klif:{}},obrot:{1:{antek_klif:12.34}},podejscia:{1:{antek_klif:7}},godziny:{1:{antek_klif:8}}}};
 const before=structuredClone(raw),a=mergeSystems(raw),b=mergeSystems(raw);assert.deepEqual(a,b);assert.deepEqual(raw,before);
 assert.equal(a.obrot[1].antek_klif,12.34);assert.equal(a.obrot[1].michal_klif,1000);assert.equal(a.obrot[2].antek_klif,undefined);assert.equal(a.podejscia[1].michal_klif,20);
 raw.systems.obrot[1].antek_klif=-10;assert.equal(mergeSystems(raw).obrot[1].antek_klif,-10);
});
