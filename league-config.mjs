export const SEASONS = {
 '2026-09': {key:'2026-09',year:2026,month:8,label:'Wrzesień 2026',name:'wrzesień',genitive:'września',prefix:'',excludedLocations:['Klif']},
 '2026-10': {key:'2026-10',year:2026,month:9,label:'Październik 2026',name:'październik',genitive:'października',prefix:'miesiace/2026-10/',excludedLocations:['Kraków']},
};
export const seasonFor=key=>SEASONS[key]||SEASONS['2026-10'];
export function tradingDays(season){return Array.from({length:new Date(Date.UTC(season.year,season.month+1,0)).getUTCDate()},(_,i)=>i+1).filter(d=>new Date(Date.UTC(season.year,season.month,d)).getUTCDay()!==0);}
export function seasonPlayer(p,season){
 const moved=season.month===9&&p.id==='antek_klif';
 const result={...p,...(moved?{n:'Antek Riviera',lok:'Riviera'}:{})};
 result.pozaKonkursem=season.excludedLocations.includes(result.lok)||moved||Boolean(p.pozaKonkursem??(p.klif&&!(season.month===9&&p.lok==='Klif')));
 return result;
}
const MONTHLY_KEYS=new Set(['obrot','podejscia','godziny','log','cele','podejscia_lok','przypomnienia','sms_kolejka']);
export const dataPath=(path,season)=>MONTHLY_KEYS.has(path.split('/')[0])?season.prefix+path:path;
export const monthData=(root,season)=>season.prefix?root.miesiace?.[season.key]||{}:root;
export function warsawNow(date=new Date()){
 return Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Warsaw',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',hourCycle:'h23'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
}
export function seasonDay(season,date=new Date()){
 const now=warsawNow(date),current=now.year*12+now.month-1,selected=season.year*12+season.month;
 return current<selected?0:current>selected?32:now.day;
}
// Automatic values replace only the linked seller's month, never manual islands.
export function mergeSystems(month){
 const result={...month};const source=month.systems;
 if(!source||source.month!=='2026-10'||source.version!==1)return result;
 for(const key of ['obrot','podejscia','godziny']){
  // Firebase serializes dense numeric day keys as arrays, with null gaps.
  result[key]=Object.fromEntries(Object.entries(month[key]||{}).filter(([,rows])=>rows&&typeof rows==='object').map(([day,rows])=>[day,{...rows}]));
  for(const rows of Object.values(result[key]))for(const id of Object.keys(source.players||{}))delete rows[id];
  for(const [day,rows]of Object.entries(source[key]||{}))if(rows&&typeof rows==='object')result[key][day]={...(result[key][day]||{}),...rows};
 }
 return result;
}
