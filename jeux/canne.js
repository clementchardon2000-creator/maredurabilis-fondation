
(function(){
const cv=document.getElementById('cn-cv');if(!cv)return;
const ctx=cv.getContext('2d'),modal=document.getElementById('cn-modal');
const $=id=>document.getElementById(id);
const VIMG=new Image();VIMG.src='img/a2040e4292.svg';
let LW=1280,LH=720,portrait=false,DPR=1,running=false,raf=0,FS=1,mapCache=null,G=null,talk=null;
const fs=f=>FS===1?f:f.replace(/(\d+(?:\.\d+)?)px/,(m,n)=>Math.round(n*FS)+'px');
function resize(){const w=cv.parentElement.clientWidth||1280;portrait=w<640;LW=portrait?720:1280;LH=portrait?1180:720;FS=portrait?1.5:1;
  DPR=Math.min(2,window.devicePixelRatio||1)*(w/LW);cv.width=Math.round(LW*DPR);cv.height=Math.round(LH*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);mapCache=null;}
window.addEventListener('resize',()=>{if(running)resize()});
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),D2R=Math.PI/180,TAU=Math.PI*2;
function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function txt(t,x,y,f,c,al){ctx.font=fs(f);ctx.fillStyle=c;ctx.textAlign=al||'left';ctx.fillText(t,x,y);}
function wrap(t,x,y,maxw,lh,f,c){ctx.font=fs(f);lh*=FS;ctx.fillStyle=c;ctx.textAlign='left';const w=t.split(' ');let line='';for(const word of w){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxw&&line){ctx.fillText(line,x,y);y+=lh;line=word}else line=test}ctx.fillText(line,x,y);return y;}
const C=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const lerpC=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const S=(a,al)=>al==null?'rgb('+a.map(Math.round).join(',')+')':'rgba('+a.map(Math.round).join(',')+','+al+')';
const pad=n=>(n<10?'0':'')+n;
function fmtT(t){t=Math.round(t);return (Math.floor(t/60)%24)+' h '+pad(t%60);}
function clk(t){t=Math.floor(t);return pad(Math.floor(t/60)%24)+':'+pad(t%60);}
const nf=n=>Math.round(n).toLocaleString('fr-FR');
function inR(p,r){return r&&p[0]>=r[0]&&p[0]<=r[0]+r[2]&&p[1]>=r[1]&&p[1]<=r[1]+r[3];}

/* ================= géographie (milles nautiques, origine : Sète) ================= */
const LAT0=43.40,LON0=3.70,KX=60*Math.cos(43.2*D2R);
const P=(lat,lon)=>[(lon-LON0)*KX,(lat-LAT0)*60];
const COAST=[[42.43,3.17],[42.48,3.14],[42.52,3.11],[42.54,3.05],[42.62,3.04],[42.70,3.035],[42.80,3.035],[42.91,3.045],[42.97,3.05],[43.02,3.06],[43.07,3.09],[43.12,3.12],[43.17,3.18],[43.21,3.24],[43.25,3.30],[43.27,3.40],[43.275,3.46],[43.28,3.51],[43.30,3.53],[43.32,3.56],[43.35,3.61],[43.38,3.66],[43.395,3.69],[43.40,3.70],[43.405,3.72],[43.43,3.78],[43.46,3.82],[43.50,3.88],[43.53,3.93],[43.55,4.00],[43.56,4.07],[43.53,4.12],[43.50,4.13],[43.48,4.16],[43.45,4.25],[43.44,4.35],[43.45,4.43],[43.43,4.55],[43.40,4.65],[43.35,4.80],[43.33,4.85],[43.37,4.90],[43.40,4.95],[43.36,5.02],[43.33,5.10],[43.33,5.20],[43.30,5.34],[43.21,5.40],[43.21,5.54]].map(a=>P(a[0],a[1]));
const LAND=COAST.concat([P(44.6,5.6),P(44.6,2.4),P(42.3,2.4)]);
const THAU=[[43.425,3.695],[43.455,3.64],[43.46,3.60],[43.44,3.56],[43.40,3.53],[43.355,3.54],[43.37,3.60],[43.40,3.66]].map(a=>P(a[0],a[1]));
const EDGE=[[42.45,3.35],[42.6,3.55],[42.72,3.75],[42.8,3.95],[42.9,4.2],[43.0,4.45],[43.1,4.7],[43.15,5.0]].map(a=>P(a[0],a[1]));
const PEAKS=[[43.395,3.685,175,4],[43.29,3.49,115,6],[43.15,3.07,214,9],[42.52,2.46,2784,6],[42.47,2.95,1250,8],[43.78,3.81,658,4],[44.12,3.58,1567,10],[43.21,5.37,432,6],[43.75,4.85,498,8],[43.33,5.75,1148,10],[43.37,5.26,279,5]].map(a=>{const p=P(a[0],a[1]);return{x:p[0],y:p[1],e:a[2],w:a[3],sd:Math.random()*9};});
const TOWNS=[['Sète',43.40,3.69,1.6,1],['Frontignan',43.445,3.76,.8,0],['Marseillan',43.33,3.55,.5,0],['Agde',43.285,3.48,1,1],['Valras',43.25,3.29,.6,0],['Gruissan',43.105,3.10,.6,1],['Port-la-Nouvelle',43.02,3.06,.6,1],['Leucate',42.91,3.05,.5,1],['Palavas',43.53,3.93,.9,1],['La Grande-Motte',43.56,4.07,1,0],['Le Grau-du-Roi',43.535,4.135,.8,1],['Saintes-Maries',43.45,4.43,.5,1],['Port-Saint-Louis',43.39,4.80,.6,0],['Carro',43.33,5.04,.5,1],['Marseille',43.30,5.37,1.8,1]].map(a=>{const p=P(a[1],a[2]);return{n:a[0],x:p[0],y:p[1],s:a[3],lab:a[4]};});
const PHARES=[[43.397,3.699,32,5],[43.49,4.14,27,10],[43.263,3.505,19,4],[43.357,4.557,40,10],[43.199,5.230,68,5]].map(a=>{const p=P(a[0],a[1]);return{x:p[0],y:p[1],e:a[2],per:a[3]};});
const ZONES=[['Large de Sète',43.26,3.78],['Large des Saintes-Maries',43.33,4.42],['Large de Marseille',43.18,5.20]].map(a=>{const p=P(a[1],a[2]);return{n:a[0],x:p[0],y:p[1]};});
const EOL=(()=>{const p=P(43.07,3.28);return{x:p[0],y:p[1],r:1.6};})();
const PORT=[0.49,-0.25],S0=[0.49,-0.3],ENTRY=[0.49,-1.5],MX0=-16,MX1=86,MY0=-34,MY1=8;
const LIGHTS_PORT=[{x:.36,y:-.72,c:'#FF3B30',t:'#D8342A'},{x:.62,y:-.72,c:'#2EE66B',t:'#1F9E4A'}];
const JETS=[[[.36,-.72],[.12,-.6],[-.2,-.42]],[[.62,-.72],[.85,-.56],[1.05,-.3]]].map(j=>{const o=[];for(let i=0;i<j.length-1;i++){const a=j[i],b=j[i+1],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.02);for(let k=0;k<=n;k++)o.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}return o;});
function pip(x,y,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if(((a[1]>y)!=(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;}
function segD(px,py,a,b){const vx=b[0]-a[0],vy=b[1]-a[1];const t=clamp(((px-a[0])*vx+(py-a[1])*vy)/(vx*vx+vy*vy),0,1);return Math.hypot(px-a[0]-t*vx,py-a[1]-t*vy);}
function distCoast(x,y){let m=1e9;for(let i=0;i<COAST.length-1;i++){const d=segD(x,y,COAST[i],COAST[i+1]);if(d<m)m=d;}return m;}
function inLand(x,y){return pip(x,y,LAND)||pip(x,y,THAU);}
function edgeY(x){const E=EDGE,n=E.length;if(x<=E[0][0])return E[0][1]+(x-E[0][0])*(E[1][1]-E[0][1])/(E[1][0]-E[0][0]);for(let i=0;i<n-1;i++)if(x<=E[i+1][0]){const t=(x-E[i][0])/(E[i+1][0]-E[i][0]);return E[i][1]+t*(E[i+1][1]-E[i][1]);}return E[n-1][1]+(x-E[n-1][0])*(E[n-1][1]-E[n-2][1])/(E[n-1][0]-E[n-2][0]);}
function depthAt(x,y,dc){if(inLand(x,y))return -1;if(dc==null)dc=distCoast(x,y);const de=y-edgeY(x);if(de>0)return 3+197*Math.pow(dc/(dc+de),.9);return Math.min(2600,200+(-de)*140);}
function illegal(x,y){if(inLand(x,y))return'Terre ! On ne passe pas par là.';const dc=distCoast(x,y);if(dc<3)return'Bande des 3 milles : chalut interdit.';if(Math.hypot(x-EOL.x,y-EOL.y)<EOL.r)return'Parc éolien : zone fermée à la pêche.';if(depthAt(x,y,dc)>1000)return'Plus de 1 000 m de fond : chalut interdit.';return null;}
function placeName(x,y,d){let best=null,bd=6;for(const z of ZONES){const q=Math.hypot(x-z.x,y-z.y);if(q<bd){bd=q;best=z.n;}}if(best)return best;if(d<0)return'Terre';if(d<60)return'Petits fonds';if(d<150)return'Plateau';if(d<260)return'Accores';return'Talus et canyons';}
// coste échantillonnée pour la vue FPV
const CS=[];for(let i=0;i<COAST.length-1;i++){const a=COAST[i],b=COAST[i+1],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.12));for(let k=0;k<n;k++){const x=a[0]+(b[0]-a[0])*k/n,y=a[1]+(b[1]-a[1])*k/n;let e=7;for(const t of TOWNS){if(Math.hypot(x-t.x,y-t.y)<t.s*1.2)e=10+((CS.length*37)%11)*1.7;}CS.push({x,y,e});}}
const STARS=[];for(let i=0;i<170;i++)STARS.push({az:Math.random()*TAU,el:rnd(.02,.7),b:rnd(.3,1),s:Math.random()<.12?2:1.2});
const CLOUDS=[];for(let i=0;i<9;i++)CLOUDS.push({az:Math.random()*TAU,el:rnd(.03,.16),w:rnd(.08,.22),h:rnd(.012,.03)});


/* ================= paramètres (fictifs sauf mention) ================= */
const SPH=9,SPH_H=50,THR=[{n:'ÉCO',kn:8,lh:20},{n:'ROUTE',kn:10,lh:35},{n:'PLEIN',kn:13,lh:62}];
const TROLL_KN=7,TROLL_LH=24,DRIFT_LH=2,IDLE_LH=4,FUEL_EUR=.7,EYE=3.5,PRICE=14,CAISSE_EUR=20,CAISSES=5,MINW=8;
const T_START=300;
const BM=[{n:'ARRÊT',s:0,c:0},{n:'LÉGER',s:.5,c:.35},{n:'FORT',s:1,c:.8}]; // broumé : intensité, caisses de sardines par heure
const tod=()=>G.t%1440;

/* ================= état ================= */
function newGame(day){
  G={day:day||1,scene:'sea',phase:'plan',t:T_START,anim:0,fade:0,fadeDir:0,ui:{},boat:{x:S0[0],y:S0[1],h:180*D2R,spd:0},dest:null,via:null,thr:1,warp:1,
    fuel:0,kept:[],released:[],lost:0,caisses:0,track:[],trackT:0,sonar:[],sonT:0,birds:[],boats:[],wind:{k:0},msg:null,dist:0,
    chasses:[],chT:3,vivier:0,chaseC:null,atC:null,mine:0,hB:0,hC:0,br:null,fi:null,cast:null,seenMsg:0};
  G.zf=[rnd(.05,.9),rnd(.35,1.3),rnd(1,2)];G.zc=[rnd(.15,1.3),rnd(.2,1.3),rnd(.3,1.4)];
  G.rep=G.zf.map(v=>v*rnd(.75,1.25));G.repC=G.zc.map(v=>v*rnd(.75,1.25));
  for(let i=0;i<3;i++){const z=ZONES[i];G.boats.push({x:PORT[0]+rnd(-.1,.1),y:PORT[1]+rnd(-.1,.1),h:180*D2R,spd:0,st:'dock',dep:T_START+10+i*25,tx:z.x+rnd(-2,2),ty:z.y+rnd(-2,2)});}
}
function ab(arr,x,y){let f=.3;for(let i=0;i<ZONES.length;i++){const z=ZONES[i],d=Math.hypot(x-z.x,y-z.y);f=Math.max(f,arr[i]*Math.exp(-d*d/128));}return f;}
function zoneIdx(x,y){let b=-1,bd=9;for(let i=0;i<ZONES.length;i++){const d=Math.hypot(x-ZONES[i].x,y-ZONES[i].y);if(d<bd){bd=d;b=i;}}return b;}
function wB(){return Math.round(clamp(20+12*-Math.log(1-Math.random()*.99),20,150));}
function wC(){return Math.round(clamp(5+14*-Math.log(1-Math.random()*.98),5,80));}
function unitPrice(w){return Math.round(w*PRICE/5)*5;}
function zoneDist(x,y){let bd=1e9;for(const z of ZONES)bd=Math.min(bd,Math.hypot(x-z.x,y-z.y));return bd;}
function nearestZone(x,y){let b=null,bd=1e9;for(const z of ZONES){const d=Math.hypot(x-z.x,y-z.y);if(d<bd){bd=d;b=z;}}return b;}

/* ================= dialogues ================= */
function say(lines,onDone,labels){talk={lines,i:0,onDone,labels:labels||{}};$('cn-talk').hidden=false;showLine();}
function showLine(){const t=talk;$('cn-txt').innerHTML=t.lines[t.i];
  $('cn-dots').innerHTML=t.lines.length>1?t.lines.map((_,k)=>'<i class="'+(k===t.i?'on':'')+'"></i>').join(''):'';
  $('cn-next').textContent=t.i<t.lines.length-1?'Suivant →':(t.labels.last||'C’est parti →');
  $('cn-skip').style.display=t.lines.length>1&&t.i<t.lines.length-1?'':'none';
  const a=$('cn-again');if(a)a.style.display=t.i===t.lines.length-1?'':'none';}
$('cn-next').onclick=()=>{if(!talk)return;if(talk.i<talk.lines.length-1){talk.i++;showLine();}else{const f=talk.onDone;talk=null;$('cn-talk').hidden=true;f&&f();}};
$('cn-skip').onclick=()=>{if(!talk)return;talk.i=talk.lines.length-1;showLine();};
function toast(t,c){if(G)G.msg={t,c:c||'#0012B5',life:3.6};}
function repB(v){return v<.4?'rien au broumé depuis deux jours':v<.9?'quelques touches au broumé':v<1.4?'ça mord bien au broumé':'ça mord très fort au broumé';}
function repC(v){return v<.5?'pas de chasses':v<1?'quelques chasses':'des chasses un peu partout';}
function introLines(){return[
 'Salut, moi c’est <b>Vincent</b> ! Aujourd’hui on pêche le <b>thon rouge à la canne</b>, sur mon ligneur de 12 mètres. Il est <b>5 h</b> du matin, on est encore à quai à Sète.',
 'Première technique : le <b>broumé</b>. On s’arrête, on pêche d’abord des <b>maquereaux</b> pour servir de vifs, on les accroche sur <b>5 ou 6 cannes</b>, et on jette de la <b>sardine broyée</b> : l’odeur attire les thons. Puis on attend que ça morde. Moteur coupé, on consomme très peu… mais parfois, rien ne mord.',
 'Deuxième technique, plus <b>sportive</b> : on traîne des leurres en cherchant les <b>chasses</b>, là où les thons attaquent les sardines en surface, avec les oiseaux qui plongent au-dessus. Quand on en voit une, on fonce, et on lance un leurre dedans. Ça bouge… et ça <b>brûle du gasoil</b>.',
 'Le thon, on le vend <b>en direct</b> : on appelle un <b>restaurant partenaire</b>, qui vient le chercher à quai. Pas d’horaire de criée : on rentre quand on veut. Mais plus on va loin, plus ça coûte : aller pêcher vers <b>Marseille</b>, c’est environ <b>400 € de gasoil</b> dans la journée. Parfois, c’est là que sont les thons.',
 'Ce matin à la VHF, les collègues disent :<br>• <b>Large de Sète</b> : '+repB(G.rep[0])+', '+repC(G.repC[0])+'.<br>• <b>Saintes-Maries</b> : '+repB(G.rep[1])+', '+repC(G.repC[1])+'.<br>• <b>Marseille</b> : '+repB(G.rep[2])+', '+repC(G.repC[2])+'.<br>Ce ne sont que des pistes : on peut pêcher où on veut. Touche le traceur pour choisir où aller.'];}

/* ================= logique en mer ================= */
function legal(x,y){if(inLand(x,y))return'Terre !';if(distCoast(x,y)<1)return'Trop près de la côte pour pêcher.';if(Math.hypot(x-PORT[0],y-PORT[1])<2)return'On est encore dans l’entrée du port.';return null;}
function arrive(){const B=G.boat;B.spd=0;G.dest=null;
  if(G.phase==='return'){startArrival();return;}
  if(G.phase==='chase'){const c=G.chaseC;G.chaseC=null;G.phase='hunt';if(c&&G.chasses.includes(c)){G.atC=c;G.warp=1;startCast(c);}else toast('Trop tard, la chasse s’est éteinte…','#C4613A');return;}
  if(G.phase==='hunt')return;
  G.phase='idle';toast(legal(B.x,B.y)?legal(B.x,B.y):'On y est : broumé ou chasses, à toi de choisir.','#0E8A72');}
function goHome(){G.dest=PORT.slice();G.phase='return';G.chaseC=null;G.atC=null;G.via=Math.hypot(G.boat.x-ENTRY[0],G.boat.y-ENTRY[1])>.4?ENTRY.slice():null;G.warp=1;
  if(!G.called&&G.kept.length){G.called=1;toast('Vincent appelle le restaurant partenaire : « On rentre avec '+G.kept.length+' thon'+(G.kept.length>1?'s':'')+' ! »','#0E8A72');}}
function atSea(){return['transit','idle','hunt','chase'].includes(G.phase);}
function brg(c){const B=G.boat;return Math.round(((Math.atan2(c.x-B.x,c.y-B.y)/D2R)%360+360)%360);}
function goChasse(c){const B=G.boat,d=Math.hypot(c.x-B.x,c.y-B.y);G.chaseC=c;G.atC=null;G.dest=[c.x,c.y];G.via=null;G.phase='chase';G.warp=1;c.life=Math.max(c.life,c.age+d/THR[2].kn*60+12);toast('Des oiseaux au '+brg(c)+'° ! On y va, plein gaz.','#FF7A1A');}
function act(){const ph=G.phase,B=G.boat;
  if(ph==='plan'){if(G.dest){G.phase='transit';G.via=ENTRY.slice();toast('On largue les amarres !','#0E8A72');}else toast('Touche d’abord le traceur pour choisir où aller.','#C4613A');return;}
  if(ph==='transit'||ph==='idle'){const w=legal(B.x,B.y);if(w){toast(w,'#C4613A');return;}startBroume();return;}
  if(ph==='hunt'){G.phase='idle';G.dest=null;B.spd=0;toast('On remonte les leurres.','#0E8A72');return;}
  if(ph==='chase'){if(G.chaseC)G.chaseC.ign=1;G.phase='hunt';G.chaseC=null;G.dest=null;toast('On laisse tomber cette chasse.','#0E8A72');}}
function alt(){const ph=G.phase,B=G.boat;
  if(ph==='transit'||ph==='idle'){const w=legal(B.x,B.y);if(w){toast(w,'#C4613A');return;}G.phase='hunt';G.dest=null;toast('Leurres à la traîne : on cherche les oiseaux. Dès qu’on en voit, on y va !','#0E8A72');const c=G.chasses.find(c=>c.seen&&!c.ign);if(c)goChasse(c);return;}
  if(ph==='hunt'){const w=legal(B.x,B.y);if(w){toast(w,'#C4613A');return;}startBroume();}}
function actLabel(){const ph=G.phase,B=G.boat,w=legal(B.x,B.y);
  if(ph==='plan')return G.dest?['LARGUER LES AMARRES','LARGUER',1]:['CHOISIS OÙ ALLER','OÙ ?',0];
  if(ph==='transit'||ph==='idle')return w?['EN ROUTE','EN ROUTE',0]:['BROUMÉ ICI','BROUMÉ',1];
  if(ph==='hunt')return['ARRÊTER LA TRAÎNE','STOP',1];
  if(ph==='chase')return['ABANDONNER LA CHASSE','ANNULER',1];
  if(ph==='return')return['CAP SUR SÈTE','SÈTE',0];return['…','…',0];}
function altLabel(){const ph=G.phase,B=G.boat,w=legal(B.x,B.y);
  if(ph==='transit'||ph==='idle')return w?['🐦 Chasses','🐦',0]:['🐦 Chercher les chasses','🐦 Chasses',1];
  if(ph==='hunt')return['Broumé ici','Broumé',!w];return['🐦 Chasses','🐦',0];}
function plotClick(pt){if(!(G.phase==='plan'||atSea()))return;if(inLand(pt[0],pt[1])){toast('Terre ! Choisis un point en mer.','#C4613A');return;}
  if(pt[0]<MX0||pt[0]>MX1||pt[1]<MY0||pt[1]>MY1)return;
  if(G.phase!=='plan'){let best=null,bd=1.6;for(const c of G.chasses){if(!c.seen)continue;const d=Math.hypot(pt[0]-c.x,pt[1]-c.y);if(d<bd){bd=d;best=c;}}if(best){goChasse(best);return;}}
  let p=pt;for(const z of ZONES)if(Math.hypot(pt[0]-z.x,pt[1]-z.y)<2)p=[z.x,z.y];
  G.dest=p.slice();G.atC=null;
  if(G.phase==='hunt')return;
  if(G.phase!=='plan'){G.phase='transit';G.chaseC=null;if(G.boat.y>-1.4&&Math.abs(G.boat.x-PORT[0])<1)G.via=ENTRY.slice();else G.via=null;}}
function projReturn(){const B=G.boat;let t=G.t,x=B.x,y=B.y;if(G.dest&&G.phase==='transit'){t+=Math.hypot(G.dest[0]-x,G.dest[1]-y)/THR[G.thr].kn*60;x=G.dest[0];y=G.dest[1];}
  return t+Math.hypot(PORT[0]-x,PORT[1]-y)/THR[G.thr].kn*60;}
function spawnChasse(){const B=G.boat,k=ab(G.zc,B.x,B.y);const e=sunPos(tod()).el;if(e<-2)return;
  if(Math.random()>k*.5)return;for(let n=0;n<12;n++){const a=rnd(0,TAU),d=rnd(1.2,3.4),x=B.x+Math.sin(a)*d,y=B.y+Math.cos(a)*d;if(inLand(x,y)||distCoast(x,y)<1.5)continue;
    G.chasses.push({x,y,age:0,life:rnd(25,45),seed:rnd(0,9),vx:rnd(-.3,.3),vy:rnd(-.3,.3),seen:false});return;}}
function update(dt){
  if(!G)return;G.anim+=dt;if(G.msg){G.msg.life-=dt;if(G.msg.life<=0)G.msg=null;}
  if(G.fadeDir){G.fade+=G.fadeDir*dt*1.8;if(G.fadeDir>0&&G.fade>=1){G.fade=1;G.fadeDir=-1;const f=G.fadeCb;G.fadeCb=null;f&&f();}else if(G.fadeDir<0&&G.fade<=0){G.fade=0;G.fadeDir=0;}}
  if(G.scene==='broume'){updBroume(dt);return;}if(G.scene==='lancer'){updCast(dt);return;}if(G.scene==='combat'){updCombat(dt);return;}if(G.scene==='arrivee'){updArr(dt);return;}
  if(talk||G.phase==='plan'||G.phase==='end'||G.phase==='docked'||G.fadeDir)return;
  const sph=(G.phase==='hunt'||G.phase==='chase')?SPH_H:SPH,dm=dt*60/sph*G.warp;G.t+=dm;const B=G.boat;let lh=IDLE_LH;
  if(G.phase==='transit'||G.phase==='return'||G.phase==='chase'||(G.phase==='hunt'&&G.dest)){const tg=G.via||G.dest,dx=tg[0]-B.x,dy=tg[1]-B.y,dd=Math.hypot(dx,dy);turnTo(B,Math.atan2(dx,dy),Math.max(dt*50*D2R,dm*30*D2R));
    if(G.phase==='hunt'){B.spd=TROLL_KN;lh=TROLL_LH;}
    else if(G.phase==='chase'){const tgt=dd>1.2?THR[2].kn:Math.max(2,2+dd*9);B.spd+=(tgt-B.spd)*Math.min(1,dt*2);lh=IDLE_LH+THR[2].lh*Math.pow(B.spd/THR[2].kn,2);}
    else{B.spd=THR[G.thr].kn;lh=THR[G.thr].lh;}
    if(G.phase==='return'&&Math.hypot(PORT[0]-B.x,PORT[1]-B.y)<1.6){B.spd=Math.min(B.spd,5);if(!G.harbour){G.harbour=true;G.warp=1;toast('Entrée du port de Sète : on réduit l’allure.','#0E8A72');}}
    const step=B.spd*dm/60,near=G.phase==='chase'?.06:.01;if(dd<=step+near){B.x=tg[0];B.y=tg[1];G.dist+=dd;if(G.via)G.via=null;else if(G.phase==='hunt')G.dest=null;else arrive();}else{B.x+=Math.sin(B.h)*step;B.y+=Math.cos(B.h)*step;G.dist+=step;}}
  else if(G.phase==='hunt'){// traîne en rond en attendant de voir des oiseaux
    B.spd=TROLL_KN;lh=TROLL_LH;B.h+=dm*6*D2R;const step=B.spd*dm/60,nx=B.x+Math.sin(B.h)*step,ny=B.y+Math.cos(B.h)*step;if(!legal(nx,ny)){B.x=nx;B.y=ny;G.dist+=step;}else B.h+=dm*30*D2R;}
  else B.spd=0;
  if(G.fadeDir||G.scene!=='sea'){G.fuel+=lh*dm/60;return;}
  G.fuel+=lh*dm/60;if(G.phase==='hunt'||G.phase==='chase')G.hC+=dm/60;
  // traîne : parfois, un thon prend le leurre
  if(G.phase==='hunt'&&B.spd>0&&Math.random()<ab(G.zc,B.x,B.y)*.2*dm/60&&sunPos(tod()).el>-2){G.warp=1;toast('La traîne part ! Un thon sur le leurre !','#FF7A1A');startFight({w:wC(),src:'traine',back:'sea'});return;}
  // chasses : dès qu'on voit des oiseaux en traînant, on y va tout seul
  G.chT-=dm;if(G.chT<=0){G.chT=rnd(8,16);if(atSea()&&distCoast(B.x,B.y)>1.5)spawnChasse();}
  for(const c of G.chasses){c.age+=dm;if(G.chaseC!==c){c.x+=c.vx*dm/60;c.y+=c.vy*dm/60;}const d=Math.hypot(c.x-B.x,c.y-B.y);
    if(!c.seen&&d<4.2&&c.age>1){c.seen=true;if(G.phase==='hunt'&&!G.chaseC&&!G.atC&&!G.cast){goChasse(c);}else if(G.phase==='transit'||G.phase==='idle'){toast('Des oiseaux plongent au '+brg(c)+'° : une chasse ! Passe en mode chasses pour y aller.','#FF7A1A');if(G.warp>1)G.warp=1;}}}
  if(G.phase==='hunt'&&!G.chaseC&&!G.atC&&!G.cast&&!G.fadeDir&&G.scene==='sea'){const c=G.chasses.find(c=>c.seen&&!c.ign&&Math.hypot(c.x-B.x,c.y-B.y)<4.2);if(c)goChasse(c);}
  G.chasses=G.chasses.filter(c=>{if(c.age<c.life)return true;if(G.chaseC===c){G.chaseC=null;G.dest=null;G.phase='hunt';toast('La chasse s’est éteinte avant qu’on arrive…','#C4613A');}return false;});
  G.trackT+=dm;if(G.trackT>=2){G.trackT=0;G.track.push([B.x,B.y,G.phase==='hunt'||G.phase==='chase']);if(G.track.length>1400)G.track.shift();}
  G.sonT+=dm;if(G.sonT>=1){G.sonT=0;const d=depthAt(B.x,B.y);G.sonar.push({d:Math.max(5,d),f:clamp(ab(G.zf,B.x,B.y)*.45+rnd(-.1,.1),0,1.2),sd:Math.random()*999,tr:false});if(G.sonar.length>170)G.sonar.shift();}
  updBoats(dm);
  if(atSea()&&!G.warnN&&sunPos(tod()).el<-1&&G.t>900){G.warnN=true;toast('La nuit tombe… pense à rentrer à Sète quand tu veux.','#0E8A72');}}
function updBoats(dm){for(const b of G.boats){if(b.st==='dock'){if(G.t>=b.dep)b.st='go';continue;}const dx=b.tx-b.x,dy=b.ty-b.y;
  if(b.st==='go'){turnTo(b,Math.atan2(dx,dy),dm*20*D2R);if(Math.hypot(dx,dy)<.5)b.st='fish';b.spd=10;b.x+=Math.sin(b.h)*b.spd*dm/60;b.y+=Math.cos(b.h)*b.spd*dm/60;}else{b.spd=0;b.h+=dm*.5*D2R;}}}
/* ================= mise en page ================= */
function L(){return portrait?{win:[0,0,720,420],plot:[12,436,696,384],son:[12,830,342,160],gau:[366,830,342,160],tip:[12,1000,696,80],ctrl:[12,1088,696,82]}
 :{win:[0,0,1280,400],plot:[338,418,604,292],son:[16,418,306,176],tip:[16,604,306,106],gau:[958,418,306,118],ctrl:[958,546,306,164]};}
function mapRect(){const r=L().plot,iw=portrait?236:196;return[r[0]+8,r[1]+8,r[2]-iw-16,r[3]-16];}
function mapFit(){const m=mapRect(),s=Math.min(m[2]/(MX1-MX0),m[3]/(MY1-MY0));return{s,ox:m[0]+(m[2]-(MX1-MX0)*s)/2,oy:m[1]+(m[3]-(MY1-MY0)*s)/2};}
function m2p(x,y){const f=mapFit();return[f.ox+(x-MX0)*f.s,f.oy+(MY1-y)*f.s];}
function p2m(px,py){const f=mapFit();return[(px-f.ox)/f.s+MX0,MY1-(py-f.oy)/f.s];}

function turnTo(B,brg,maxd){let d=brg-B.h;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;B.h+=clamp(d,-maxd,maxd);}
function croix(x,y,h,lit,dark){const w=h*.56,lw=Math.max(1.4,h*.13);ctx.save();ctx.lineCap='square';
  if(lit){const g=ctx.createRadialGradient(x,y-h*.6,1,x,y-h*.6,h*1.4);g.addColorStop(0,'rgba(255,240,190,.55)');g.addColorStop(1,'rgba(255,240,190,0)');ctx.fillStyle=g;ctx.fillRect(x-h*1.4,y-h*2,h*2.8,h*2.8);}
  ctx.strokeStyle=lit?'#FFF2C2':dark?'#4F5A66':'#F1F3F5';ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x,y+lw*.3);ctx.lineTo(x,y-h);ctx.moveTo(x-w/2,y-h*.7);ctx.lineTo(x+w/2,y-h*.7);ctx.stroke();ctx.restore();}
function person(x,y,h,jacket,back,t){const s=h/100;ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle='#1E2733';ctx.fillRect(-16,-40,13,40);ctx.fillRect(3,-40,13,40);
  ctx.fillStyle=jacket;ctx.beginPath();ctx.moveTo(-24,-40);ctx.lineTo(-20,-78);ctx.quadraticCurveTo(0,-86,20,-78);ctx.lineTo(24,-40);ctx.closePath();ctx.fill();
  ctx.fillRect(-30,-78,9,34);ctx.fillRect(21,-78,9,34);
  ctx.fillStyle=back?'#8E949B':'#E6B894';ctx.beginPath();ctx.arc(0,-92,12,0,TAU);ctx.fill();
  if(!back){ctx.fillStyle='#A7ACB2';ctx.beginPath();ctx.arc(0,-86,9,0,Math.PI);ctx.fill();}
  ctx.fillStyle='#0012B5';ctx.beginPath();ctx.arc(0,-96,12.5,Math.PI,0);ctx.fill();ctx.fillRect(back?-13:-4,-97,back?26:18,4);
  ctx.restore();}
/* ================= soleil, ciel ================= */
function sunPos(tm){const H=((tm/60)-13.75)*15*D2R,ph=43.4*D2R,dc=22*D2R;const el=Math.asin(Math.sin(ph)*Math.sin(dc)+Math.cos(ph)*Math.cos(dc)*Math.cos(H));
  const az=Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(ph)-Math.tan(dc)*Math.cos(ph))+Math.PI;return{el:el/D2R,az};}
const SKY=[[-18,'#02050F','#081230'],[-8,'#0A1640','#22346A'],[-3,'#233F82','#D98F66'],[2,'#4A7FC8','#F4C896'],[8,'#3F7FD0','#C9E2F5'],[90,'#2F6FC8','#BCDDF6']].map(a=>[a[0],C(a[1]),C(a[2])]);
const SEA=[[-18,'#081634','#02060F'],[-3,'#22406E','#0B1A38'],[8,'#3A7CBE','#0E3F7A'],[90,'#3B80C4','#0C3F7E']].map(a=>[a[0],C(a[1]),C(a[2])]);
function kf(T,e){if(e<=T[0][0])return[T[0][1],T[0][2]];for(let i=0;i<T.length-1;i++)if(e<=T[i+1][0]){const t=(e-T[i][0])/(T[i+1][0]-T[i][0]);return[lerpC(T[i][1],T[i+1][1],t),lerpC(T[i][2],T[i+1][2],t)];}const l=T[T.length-1];return[l[1],l[2]];}
const hidden=d=>d>4.9?Math.pow((d-4.9)/2.08,2):0;

/* ================= vue FPV ================= */
function drawFPV(){
  const W=L().win,x0=W[0],y0=W[1],w=W[2],h=W[3],cx=x0+w/2,B=G.boat,hd=B.h,tt=G.anim;
  const hfov=(portrait?64:74)*D2R,foc=(w/2)/Math.tan(hfov/2),sun=sunPos(G.t),e=sun.el,night=clamp((-e-2)/8,0,1);
  const amp=.5+G.wind.k*1.6+Math.min(1,B.spd/10)*.5;
  const pitch=(Math.sin(tt*1.25)*3+Math.sin(tt*.55)*1.5)*amp,roll=Math.sin(tt*.85)*amp*.9*D2R;
  const rel=a=>{let d=a-hd;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d;},ax=a=>Math.tan(a)*foc,E=w*1.2;
  ctx.save();ctx.beginPath();ctx.rect(x0,y0,w,h);ctx.clip();ctx.translate(cx,y0+h*.46+pitch);ctx.rotate(roll);
  const [top,hor]=kf(SKY,e);let g=ctx.createLinearGradient(0,-h*.8,0,0);g.addColorStop(0,S(top));g.addColorStop(1,S(hor));ctx.fillStyle=g;ctx.fillRect(-E,-h*1.4,2*E,h*1.4+1);
  const sr=rel(sun.az);
  if(e>-12&&e<16&&Math.abs(sr)<1.45){const gx=ax(clamp(sr,-1.25,1.25)),k=Math.max(0,1-Math.abs(e-1)/14)*.6;const gl=ctx.createRadialGradient(gx,0,10,gx,0,w*.65);gl.addColorStop(0,'rgba(255,170,90,'+k+')');gl.addColorStop(1,'rgba(255,170,90,0)');ctx.fillStyle=gl;ctx.fillRect(-E,-h*1.4,2*E,h*1.4);}
  if(night>0){for(const s of STARS){const r=rel(s.az);if(Math.abs(r)>hfov/2+.1)continue;ctx.fillStyle='rgba(255,255,255,'+(night*s.b*(.75+.25*Math.sin(tt*3+s.az*9)))+')';ctx.fillRect(ax(r),-Math.tan(s.el)*foc,s.s,s.s);}}
  const cc=e<-6?S(lerpC(hor,[20,30,60],.5),.5):e<4?'rgba(255,190,160,.55)':'rgba(255,255,255,.75)';
  for(const c of CLOUDS){const r=rel(c.az);if(Math.abs(r)>hfov/2+c.w)continue;const px=ax(r),py=-Math.tan(c.el)*foc,cw=c.w*foc,ch=c.h*foc;ctx.fillStyle=cc;for(let k=0;k<4;k++){ctx.beginPath();ctx.ellipse(px+(k-1.5)*cw*.3,py-(k%2)*ch*.4,cw*.35,ch,0,0,TAU);ctx.fill();}}
  if(e>-2&&Math.abs(sr)<hfov/2+.15){const sx=ax(sr),sy=-Math.tan(e*D2R)*foc;const sg=ctx.createRadialGradient(sx,sy,4,sx,sy,90);sg.addColorStop(0,'rgba(255,240,200,.9)');sg.addColorStop(1,'rgba(255,220,150,0)');ctx.fillStyle=sg;ctx.fillRect(sx-90,sy-90,180,180);ctx.fillStyle=e<5?'#FFC27A':'#FFF7DE';ctx.beginPath();ctx.arc(sx,sy,12,0,TAU);ctx.fill();}
  // mer (fond)
  const [sh,sb]=kf(SEA,e);g=ctx.createLinearGradient(0,0,0,h*.75);g.addColorStop(0,S(sh));g.addColorStop(1,S(sb));ctx.fillStyle=g;ctx.fillRect(-E,0,2*E,h*1.4);
  // reliefs lointains
  const pk=PEAKS.map(p=>({p,d:Math.hypot(p.x-B.x,p.y-B.y)})).sort((a,b)=>b.d-a.d);
  for(const {p,d} of pk){const v=p.e-hidden(d);if(v<=0)continue;const dm=d*1852,r=rel(Math.atan2(p.x-B.x,p.y-B.y)),hw=Math.min(1.2,Math.atan(p.e*p.w/dm));
    if(Math.abs(r)-hw>hfov/2||Math.abs(r)>Math.PI/2)continue;const top_=-Math.atan(v*2.2/dm)*foc,base=d<4.9?EYE/dm*foc:0;
    const hz=clamp(d/70,.15,.85),lc=night>.5?lerpC([4,7,14],hor,hz*.5):lerpC([92,104,112],hor,hz);ctx.fillStyle=S(lc);ctx.beginPath();ctx.moveTo(ax(clamp(r-hw,-1.4,1.4)),base);
    for(let k=0;k<=28;k++){const t=-1+2*k/28,a=clamp(r+t*hw,-1.4,1.4);const y=top_*Math.pow(Math.max(0,1-Math.pow(Math.abs(t),1.5)),1.3)*(1+.07*Math.sin(t*9+p.sd));ctx.lineTo(ax(a),Math.min(base,y+base*0));}
    ctx.lineTo(ax(clamp(r+hw,-1.4,1.4)),base);ctx.closePath();ctx.fill();
    if(p===PEAKS[0]&&Math.abs(r)<hfov/2){const cy=top_*(1+.07*Math.sin(p.sd)),hc=Math.max(6,30*2.2/dm*foc);croix(ax(r),cy,hc,night>.4,true);}}
  // côte
  let prev=null;const lc0=night>.5?[3,6,12]:[120,118,96];
  const HC=[[236,214,178],[222,160,122],[244,232,206],[205,120,96],[232,200,140]];let ci=0;
  for(const c of CS){ci++;const d=Math.hypot(c.x-B.x,c.y-B.y);const v=c.e-hidden(d);const r=rel(Math.atan2(c.x-B.x,c.y-B.y));
    if(v<=0||d>13||d<.3||Math.abs(r)>hfov/2+.35){prev=null;continue;}const dm=d*1852,tp=Math.max(-h*.22,-v*2.2/dm*foc),bs=EYE/dm*foc,px=ax(r);
    if(prev&&Math.abs(prev.r-r)<.6){ctx.fillStyle=S(lerpC(c.e>9&&night<.5?HC[ci%5]:lc0,hor,clamp(d/14,0,.7)));ctx.beginPath();ctx.moveTo(prev.px,prev.bs);ctx.lineTo(prev.px,prev.tp);ctx.lineTo(px,tp);ctx.lineTo(px,bs);ctx.closePath();ctx.fill();}
    prev={r,px,tp,bs};}
  // jetées et musoirs du port de Sète
  for(const J of JETS){let pv=null;for(const q of J){const d=Math.hypot(q[0]-B.x,q[1]-B.y),r=rel(Math.atan2(q[0]-B.x,q[1]-B.y));if(d>3||d<.02||Math.abs(r)>hfov/2+.3){pv=null;continue;}const dm=d*1852,px=ax(r),tp=-4*2.2/dm*foc,bs=EYE/dm*foc;
    if(pv&&Math.abs(pv.r-r)<.8){ctx.fillStyle=night>.5?'#161A22':S(lerpC([150,144,130],hor,clamp(d/4,0,.5)));ctx.beginPath();ctx.moveTo(pv.px,pv.bs);ctx.lineTo(pv.px,pv.tp);ctx.lineTo(px,tp);ctx.lineTo(px,bs);ctx.closePath();ctx.fill();}pv={r,px,tp,bs};}}
  for(const p of LIGHTS_PORT){const d=Math.hypot(p.x-B.x,p.y-B.y);if(d>3||d<.02)continue;const r=rel(Math.atan2(p.x-B.x,p.y-B.y));if(Math.abs(r)>hfov/2+.05)continue;const dm=d*1852,px=ax(r),bs=EYE/dm*foc,tp=-10*2.2/dm*foc,tw=Math.max(2,4*2.2/dm*foc);
    ctx.fillStyle=night>.5?'#20242C':p.t;ctx.fillRect(px-tw/2,tp,tw,bs-tp);ctx.fillStyle=night>.5?'#2A2F38':'#F4F6F8';ctx.fillRect(px-tw/2,tp+(bs-tp)*.45,tw,(bs-tp)*.15);}
  // lumières des villes, phares, feux du port
  if(night>0){for(const t of TOWNS){const d=Math.hypot(t.x-B.x,t.y-B.y);if(d>30)continue;const r=rel(Math.atan2(t.x-B.x,t.y-B.y));if(Math.abs(r)>hfov/2+.2)continue;const px=ax(r);
      const gw=ctx.createRadialGradient(px,0,2,px,0,Math.min(160,1600*t.s/d));gw.addColorStop(0,'rgba(255,170,80,'+(.28*night*t.s)+')');gw.addColorStop(1,'rgba(255,170,80,0)');ctx.fillStyle=gw;ctx.fillRect(px-170,-170,340,190);
      if(hidden(d)<15){const n=Math.round(t.s*16),sp=Math.min(.5,t.s*.9/d);for(let k=0;k<n;k++){const a=r+((k*37%100)/100-.5)*2*sp;const hh=(8+((k*53)%12))-hidden(d);if(hh<=0)continue;ctx.fillStyle='rgba(255,'+(200+(k%3)*20)+',120,'+(night*(.6+.4*Math.sin(tt*2+k)))+')';ctx.fillRect(ax(a),-hh/(d*1852)*foc,2,2);}}}}
  for(const p of PHARES){const d=Math.hypot(p.x-B.x,p.y-B.y);if(d>22||hidden(d)>p.e)continue;const r=rel(Math.atan2(p.x-B.x,p.y-B.y));if(Math.abs(r)>hfov/2)continue;if((tt%p.per)<.35){const px=ax(r),py=-(p.e-hidden(d))/(d*1852)*foc;const lg=ctx.createRadialGradient(px,py,1,px,py,24);lg.addColorStop(0,'rgba(255,250,220,1)');lg.addColorStop(1,'rgba(255,250,220,0)');ctx.fillStyle=lg;ctx.fillRect(px-24,py-24,48,48);}}
  for(const p of LIGHTS_PORT){const d=Math.hypot(p.x-B.x,p.y-B.y);if(d>3)continue;const r=rel(Math.atan2(p.x-B.x,p.y-B.y));if(Math.abs(r)>hfov/2)continue;if((tt%4)<2.4){const px=ax(r),py=-10*2.2/(d*1852)*foc;ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(px,py,4,0,TAU);ctx.fill();const lg=ctx.createRadialGradient(px,py,1,px,py,18);lg.addColorStop(0,p.c);lg.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=.6;ctx.fillStyle=lg;ctx.fillRect(px-18,py-18,36,36);ctx.globalAlpha=1;}}
  // reflet du soleil
  if(e>0&&e<40&&Math.abs(sr)<hfov/2){const sx=ax(sr);for(let k=0;k<60;k++){const y=3+((k*37)%100)/100*h*.5,spread=8+y*.9,x=sx+(((k*53)%100)/100-.5)*spread;ctx.fillStyle='rgba(255,240,200,'+(.5*(.5+.5*Math.sin(tt*4+k)))*(1-y/(h*.55))+')';ctx.fillRect(x,y,6+y*.05,1.5);}}
  // vagues : points fixes du monde projetés
  const bx=B.x*1852,by=B.y*1852,sn=Math.sin(hd),cs=Math.cos(hd),SPC=14,RAD=240,wc=night>.5?'170,190,230':'255,255,255',ws=.22+G.wind.k*.2;
  ctx.lineWidth=1.3;const i0=Math.floor((bx-RAD)/SPC),i1=Math.ceil((bx+RAD)/SPC),j0=Math.floor((by-RAD)/SPC),j1=Math.ceil((by+RAD)/SPC);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const hs=(Math.imul(i,73856093)^Math.imul(j,19349663))>>>0,jx=(hs%1000)/1000,jy=((hs>>>10)%1000)/1000;
    const wx=i*SPC+jx*SPC+Math.sin(tt*.8+jx*6)*2,wy=j*SPC+jy*SPC,dx=wx-bx,dy=wy-by,f=dx*sn+dy*cs;if(f<9||f>RAD)continue;const r=dx*cs-dy*sn,sx=r/f*foc;if(sx<-w/2-20||sx>w/2+20)continue;
    const sy=EYE/f*foc,ln=foc*1.5/f,a=(1-f/RAD)*(ws+.12*Math.sin(tt*2+jx*9));if(a<=.02)continue;ctx.strokeStyle='rgba('+wc+','+a.toFixed(3)+')';ctx.beginPath();ctx.moveTo(sx-ln,sy);ctx.quadraticCurveTo(sx,sy-ln*.35,sx+ln,sy);ctx.stroke();}
  // autres chalutiers
  const vis=G.boats.filter(b=>b.st!=='dock'&&b.st!=='home').map(b=>({b,d:Math.hypot(b.x-B.x,b.y-B.y)})).filter(o=>o.d>.05&&o.d<8).sort((a,b)=>b.d-a.d);
  for(const {b,d} of vis){const r=rel(Math.atan2(b.x-B.x,b.y-B.y));if(Math.abs(r)>hfov/2+.05)continue;const dm=d*1852,px=ax(r),base=Math.max(0,EYE/dm*foc-hidden(d)/dm*foc),k=foc/dm;
    if(night<.6){const L_=24*k*.9,H=6*k;ctx.fillStyle='#E9EEF3';ctx.beginPath();ctx.moveTo(px-L_/2,base-H*.4);ctx.lineTo(px+L_/2,base-H*.5);ctx.lineTo(px+L_*.4,base);ctx.lineTo(px-L_*.45,base);ctx.fill();ctx.fillRect(px-L_*.05,base-H*1.3,L_*.28,H*.9);ctx.fillStyle='#0012B5';ctx.fillRect(px-L_/2,base-H*.25,L_,Math.max(1,H*.12));ctx.fillStyle='#9AA3AE';ctx.fillRect(px+L_*.08,base-H*2.4,Math.max(1,k*.4),H*1.2);}
    const lt=(hh,c,rad)=>{const py=base-hh*k;ctx.fillStyle=c;ctx.beginPath();ctx.arc(px,py,rad,0,TAU);ctx.fill();if(night>.3){const lg=ctx.createRadialGradient(px,py,1,px,py,rad*5);lg.addColorStop(0,c);lg.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=.5*night;ctx.fillStyle=lg;ctx.fillRect(px-rad*5,py-rad*5,rad*10,rad*10);ctx.globalAlpha=1;}};
    if(night>.3){const rs=Math.max(1.5,3.5-d*.3);if(b.st==='trawl'){lt(12,'#2EE66B',rs);lt(9,'#FFFFFF',rs);}else{lt(12,'#FFFFFF',rs);const a2=((Math.atan2(B.x-b.x,B.y-b.y)-b.h)%TAU+TAU)%TAU;if(a2<1.96)lt(4,'#2EE66B',rs);else if(a2>TAU-1.96)lt(4,'#FF3B30',rs);}}}
  // chasses : oiseaux qui plongent, eau qui bouillonne
  for(const c of G.chasses){const d=Math.hypot(c.x-B.x,c.y-B.y);if(d>6||d<.02)continue;const r=rel(Math.atan2(c.x-B.x,c.y-B.y));if(Math.abs(r)>hfov/2+.1)continue;
    const dm=d*1852,px=ax(r),base=EYE/dm*foc,k=foc/dm,fa=clamp(Math.min(c.age/2,(c.life-c.age)/3),0,1);if(fa<=0)continue;
    const bw=Math.max(8,40*k);ctx.fillStyle='rgba(255,255,255,'+(.6*fa)+')';for(let i=0;i<8;i++){ctx.beginPath();ctx.ellipse(px+Math.sin(tt*3+i*1.7+c.seed)*bw*.6,base-Math.abs(Math.sin(tt*5+i))*Math.max(1,bw*.12),Math.max(2,bw*.22),Math.max(.8,bw*.05),0,0,TAU);ctx.fill();}
    const bc=night>.5?'rgba(200,210,230,'+fa+')':'rgba(35,40,52,'+fa+')';for(let i=0;i<14;i++){const ph=tt*(1.2+(i%4)*.25)+i*1.3+c.seed,dive=(i%4===0)?((tt*.8+i*.37)%1):0;
      const kk=Math.max(k,.9),bx_=px+Math.sin(ph*.6+i)*Math.max(14,50*k)*(1+(i%3)*.4),by_=base-(8+(i*7%22))*kk*(1-dive)-3-Math.cos(ph)*2,s=Math.max(3.6,1.6*k);
      const fl=Math.sin(ph*6)*.6;ctx.strokeStyle=bc;ctx.lineWidth=Math.max(1,s*.25);ctx.beginPath();ctx.moveTo(bx_-s,by_-s*fl*.5);ctx.quadraticCurveTo(bx_-s*.4,by_-s*(.4+fl*.4),bx_,by_);ctx.quadraticCurveTo(bx_+s*.4,by_-s*(.4+fl*.4),bx_+s,by_-s*fl*.5);ctx.stroke();}}
  // mouettes
  for(const b of G.birds){const px=b.x*w,py=-h*.46+b.y*h+Math.sin(b.ph*.3)*6,s=10*b.s,fl=Math.sin(b.ph)*.6;ctx.strokeStyle=night>.5?'rgba(20,20,30,'+b.a+')':'rgba(245,247,250,'+b.a+')';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px-s,py-s*fl*.5);ctx.quadraticCurveTo(px-s*.4,py-s*(.4+fl*.4),px,py);ctx.quadraticCurveTo(px+s*.4,py-s*(.4+fl*.4),px+s,py-s*fl*.5);ctx.stroke();}
  ctx.restore();
  drawBow(x0,y0,w,h,night,tt);drawRods(x0,y0,w,h,night,tt);drawFrame(x0,y0,w,h,night);
}
function drawBow(x0,y0,w,h,night,tt){const cx=x0+w/2,by=y0+h,sy=y0+h*.66;
  if(G.boat.spd>2){for(let k=0;k<26;k++){const s=(k*37%100)/100,ph=(tt*1.6+s)%1,x=cx+(s-.5)*w*.36*(1-ph*.2),y=sy+6+ph*38;ctx.fillStyle='rgba(255,255,255,'+(.55*(1-ph))*(G.boat.spd/11)+')';ctx.beginPath();ctx.arc(x,y,2+ph*5,0,TAU);ctx.fill();}}
  const dk=night>.5?'#1A1E26':'#6E7885',bw=night>.5?'#2C323C':'#EEF2F6';
  ctx.fillStyle=bw;ctx.beginPath();ctx.moveTo(x0+w*.06,by);ctx.lineTo(cx-8,sy-6);ctx.lineTo(cx+8,sy-6);ctx.lineTo(x0+w*.94,by);ctx.closePath();ctx.fill();
  ctx.fillStyle=dk;ctx.beginPath();ctx.moveTo(x0+w*.12,by);ctx.lineTo(cx-4,sy+4);ctx.lineTo(cx+4,sy+4);ctx.lineTo(x0+w*.88,by);ctx.closePath();ctx.fill();
  const wy=by-h*.13,ww=w*.1;ctx.fillStyle=night>.5?'#23282F':'#4A535E';rr(cx-ww*.8,wy+h*.02,ww*1.6,h*.05,4);ctx.fill();ctx.fillStyle=night>.5?'#343B47':'#AEB6C0';rr(cx-ww/2,wy-h*.03,ww,h*.06,h*.03);ctx.fill();ctx.fillStyle=night>.5?'#2A3040':'#0012B5';ctx.fillRect(cx-ww*.62,wy-h*.045,ww*.1,h*.09);ctx.fillRect(cx+ww*.52,wy-h*.045,ww*.1,h*.09);
  ctx.strokeStyle=night>.5?'#3A4254':'#FFFFFF';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0+w*.1,by-h*.05);ctx.lineTo(cx-6,sy-10);ctx.lineTo(cx+6,sy-10);ctx.lineTo(x0+w*.9,by-h*.05);ctx.stroke();
  if(night>.3){const lg=ctx.createRadialGradient(cx,sy-12,1,cx,sy-12,12);lg.addColorStop(0,'rgba(255,255,255,.9)');lg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=lg;ctx.fillRect(cx-12,sy-24,24,24);}}

/* ================= petits dessins ================= */
function tunaSide(x,y,s,flip,tt,esp){ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.scale(s,s);const w=Math.sin(tt*9)*.12;
  ctx.fillStyle='#0E2A55';ctx.beginPath();ctx.moveTo(46,0);ctx.quadraticCurveTo(20,-18,-30,-6);ctx.lineTo(-40,0);ctx.lineTo(-30,6);ctx.quadraticCurveTo(20,18,46,0);ctx.fill();
  ctx.fillStyle='#C9D8E8';ctx.beginPath();ctx.moveTo(44,2);ctx.quadraticCurveTo(18,15,-30,5);ctx.lineTo(-30,1);ctx.quadraticCurveTo(10,6,44,2);ctx.fill();
  ctx.fillStyle='#0E2A55';ctx.save();ctx.translate(-38,0);ctx.rotate(w);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-12,-16);ctx.lineTo(-6,0);ctx.lineTo(-12,16);ctx.closePath();ctx.fill();ctx.restore();
  ctx.beginPath();ctx.moveTo(8,-12);ctx.lineTo(-2,-24);ctx.lineTo(-6,-10);ctx.fill();ctx.fillStyle='#F2C230';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-10-i*5,-6);ctx.lineTo(-13-i*5,-10);ctx.lineTo(-15-i*5,-5);ctx.fill();ctx.beginPath();ctx.moveTo(-10-i*5,6);ctx.lineTo(-13-i*5,10);ctx.lineTo(-15-i*5,5);ctx.fill();}
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(34,-3,2.4,0,TAU);ctx.fill();ctx.fillStyle='#0A0A1F';ctx.beginPath();ctx.arc(34.5,-3,1.2,0,TAU);ctx.fill();ctx.restore();}
function mackerel(x,y,s,flip,tt){ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.scale(s,s);const w=Math.sin(tt*14)*.25;
  ctx.fillStyle='#3E7C6E';ctx.beginPath();ctx.moveTo(14,0);ctx.quadraticCurveTo(4,-5,-10,-2);ctx.lineTo(-10,2);ctx.quadraticCurveTo(4,5,14,0);ctx.fill();
  ctx.fillStyle='#DDE8EE';ctx.beginPath();ctx.moveTo(13,1);ctx.quadraticCurveTo(4,4.5,-10,1.6);ctx.lineTo(-10,.5);ctx.quadraticCurveTo(4,2,13,1);ctx.fill();
  ctx.strokeStyle='#1C3B34';ctx.lineWidth=.8;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(6-i*4,-3.2);ctx.lineTo(3-i*4,-.6);ctx.stroke();}
  ctx.fillStyle='#3E7C6E';ctx.save();ctx.translate(-10,0);ctx.rotate(w);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-5,-5);ctx.lineTo(-3,0);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();ctx.restore();ctx.restore();}
function bird(x,y,s,ph,col){const fl=Math.sin(ph)*.6;ctx.strokeStyle=col;ctx.lineWidth=Math.max(1.2,s*.18);ctx.beginPath();ctx.moveTo(x-s,y-s*fl*.5);ctx.quadraticCurveTo(x-s*.4,y-s*(.4+fl*.4),x,y);ctx.quadraticCurveTo(x+s*.4,y-s*(.4+fl*.4),x+s,y-s*fl*.5);ctx.stroke();}
function pill(msg,col,ty,cx){cx=cx||LW/2;ctx.font=fs('800 17px Mukta,sans-serif');const mw=cx===LW/2?LW-40:(LW-cx-40)*2,tw=Math.min(mw,ctx.measureText(msg).width+44),th=36*FS;ctx.fillStyle=col;rr(cx-tw/2,ty,tw,th,th/2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(msg,cx,ty+th*.66,tw-24);}
function hud(l1,l2,l3,c1){ctx.fillStyle='rgba(5,10,42,.8)';rr(16,16,portrait?560:440,portrait?128:88,14);ctx.fill();txt(l1,30,portrait?50:40,'800 14px Mukta,sans-serif',c1||'#FFE9A8');txt(l2,30,portrait?86:64,'800 16px Mukta,sans-serif','#00FFFF');if(l3)txt(l3,30,portrait?116:84,'700 12px Mukta,sans-serif','#E7ECFF');}
function uiBtn(rc,label,on,sel,col){if(!rc)return;ctx.fillStyle=sel?'#00FFFF':on?(col||'#1E2A44'):'#1A1F2B';rr(rc[0],rc[1],rc[2],rc[3],10);ctx.fill();ctx.font=fs('800 13px Mukta,sans-serif');ctx.fillStyle=sel?'#0012B5':on?'#fff':'#5A6478';ctx.textAlign='center';ctx.fillText(label,rc[0]+rc[2]/2,rc[1]+rc[3]/2+5*FS,rc[2]-8);}
function skyBox(e,top0,bottom){const [top,hor]=kf(SKY,e);const g=ctx.createLinearGradient(0,top0,0,bottom);g.addColorStop(0,S(top));g.addColorStop(1,S(hor));return g;}

/* ================= broumé ================= */
const SURF=250,yD=m=>SURF+m*(440/Math.max(50,SBOT+6));
let SBOT=50;
function sideBegin(bot){const tt=G.anim,e=sunPos(tod()).el,night=e<-3,B=G.boat;
  const sc=portrait?.92:1,cxo=portrait?190:0,oy=portrait?180:0;
  ctx.fillStyle='#041B33';ctx.fillRect(0,0,LW,LH);
  const fs0=FS;FS=1;SBOT=bot;ctx.save();ctx.translate(0,oy);ctx.scale(sc,sc);ctx.translate(-cxo,0);
  ctx.fillStyle=skyBox(e,-300,SURF);ctx.fillRect(-300,-300,1900,SURF+300);
  if(e>-3){const sx=1050,sy=SURF-30-Math.max(0,e)*6;const sg=ctx.createRadialGradient(sx,sy,6,sx,sy,140);sg.addColorStop(0,'rgba(255,230,180,.9)');sg.addColorStop(1,'rgba(255,200,140,0)');ctx.fillStyle=sg;ctx.fillRect(sx-150,sy-150,300,300);ctx.fillStyle='#FFF1C8';ctx.beginPath();ctx.arc(sx,sy,16,0,TAU);ctx.fill();}
  else for(let i=0;i<60;i++){ctx.fillStyle='rgba(255,255,255,'+(.3+.4*Math.abs(Math.sin(tt+i)))+')';ctx.fillRect((i*211)%1500-100,(i*97)%200-40,1.5,1.5);}
  const zi=zoneIdx(B.x,B.y);if(zi===2){ctx.fillStyle=night?'#0B1224':'rgba(110,120,120,.8)';ctx.beginPath();ctx.moveTo(700,SURF);ctx.quadraticCurveTo(820,196,940,214);ctx.quadraticCurveTo(1050,180,1200,206);ctx.lineTo(1400,SURF);ctx.fill();}
  // eau
  let g=ctx.createLinearGradient(0,SURF,0,760);g.addColorStop(0,night?'#0E2F52':'#1E6FA8');g.addColorStop(1,'#031426');ctx.fillStyle=g;ctx.fillRect(-300,SURF,1900,1200);
  if(!night)for(let i=0;i<7;i++){const x=200+i*170+Math.sin(tt*.3+i)*20;const lg=ctx.createLinearGradient(x,SURF,x+80,640);lg.addColorStop(0,'rgba(255,255,255,.10)');lg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=lg;ctx.beginPath();ctx.moveTo(x,SURF);ctx.lineTo(x+40,SURF);ctx.lineTo(x+140,640);ctx.lineTo(x+60,640);ctx.fill();}
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.beginPath();for(let x=-300;x<1600;x+=20)ctx.lineTo(x,SURF+Math.sin(x*.05+tt*2)*2.5);ctx.stroke();
  {const fy=yD(bot);ctx.fillStyle='#4A3F31';ctx.beginPath();ctx.moveTo(-300,fy+6);for(let x=-300;x<=1600;x+=40)ctx.lineTo(x,fy+Math.sin(x*.013)*6+Math.sin(x*.041)*3);ctx.lineTo(1600,fy+400);ctx.lineTo(-300,fy+400);ctx.fill();ctx.fillStyle='#6B5B45';for(let i=0;i<40;i++){const x=(i*97)%1900-300;ctx.beginPath();ctx.ellipse(x,fy+8+(i%5)*3,6+(i%4)*5,3+(i%3),0,0,TAU);ctx.fill();}
    ctx.font='800 12px Mukta,sans-serif';ctx.fillStyle='rgba(255,230,190,.8)';ctx.textAlign='left';ctx.fillText('fond : '+bot+' m',cxo+30,fy-8);}
  const stp=bot>70?20:10;for(let m=stp;m<bot-4;m+=stp){ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(cxo+12,yD(m),14,1.5);ctx.font='700 12px Mukta,sans-serif';ctx.textAlign='left';ctx.fillText(m+' m',cxo+30,yD(m)+4);}
  return fs0;}

function startBroume(){const B=G.boat;G.phase='broume';G.dest=null;G.via=null;G.atC=null;G.chaseC=null;B.spd=0;G.warp=1;
  const bot=Math.round(clamp(depthAt(B.x,B.y),25,110));G.br={bot,step:G.vivier>=3?'cannes':'vifs',t:0,md:3,hold:false,sd:bot-3,sdv:0,sdT:0,line:0,fishT:0,rods:[],S:0,A:0,parts:[],tunas:[],bite:null,bm:1,place:placeName(B.x,B.y,depthAt(B.x,B.y)),anim:0,catchT:0};
  if(G.br.step==='cannes')setupRods();
  G.fadeDir=1;G.fadeCb=()=>{G.scene='broume';};
  if(G.br.step==='vifs')toast('D’abord, les vifs : on pêche des maquereaux à la mitraillette.','#0E8A72');}
function setupRods(){const b=G.br;const D=[6,12,18,26,34,42];let n=Math.min(6,G.vivier),bait='vif';if(n===0){n=4;bait='sard';}
  const kd=Math.min(1,(b.bot-6)/44);b.rods=[];for(let i=0;i<6;i++)b.rods.push({d:Math.round(D[i]*kd),bait:i<n?bait:null,bend:0,on:i<n});G.vivier-=bait==='vif'?n:0;b.step='cannes';b.t=0;
  if(bait==='sard')toast('Pas de vifs : on boëtte à la sardine morte, c’est moins efficace.','#C4613A');}
function rebait(){const b=G.br;if(!b)return;for(const r of b.rods)if(r.on&&!r.bait&&G.vivier>0){r.bait='vif';G.vivier--;}}
function leaveBroume(home){const b=G.br;for(const r of b.rods)if(r.bait==='vif')G.vivier++;G.br=null;G.phase='idle';G.warp=1;G.fadeDir=1;G.fadeCb=()=>{G.scene='sea';if(home)goHome();};}
function updBroume(dt){const b=G.br;if(!b||talk||G.fadeDir>0)return;b.t+=dt;b.anim+=dt;const B=G.boat;
  // particules de broumé et thons (décor)
  const emit=b.step==='attente'?b.S:0;b.pe=(b.pe||0)+emit*dt*22;while(b.pe>1){b.pe--;b.parts.push({x:600+rnd(-8,8),y:SURF+2,vx:rnd(18,40),vy:rnd(5,13),l:0});}
  for(const p of b.parts){p.x+=p.vx*dt*(G.warp>1?2:1);p.y+=p.vy*dt*(G.warp>1?2:1);p.l+=dt;}b.parts=b.parts.filter(p=>p.l<16&&p.y<720);
  const want=b.step==='attente'?Math.min(6,Math.round(b.A*clamp(ab(G.zf,B.x,B.y),0,1.8)*3.2)):0;
  while(b.tunas.length<want)b.tunas.push({x:rnd(1150,1300),y:rnd(8,Math.min(44,b.bot-6)),vx:-rnd(40,80),ph:rnd(0,9),s:rnd(.9,1.5),a:0});
  for(const u of b.tunas){u.x+=u.vx*dt;u.ph+=dt;u.y+=Math.sin(u.ph*.7)*dt*2;if(u.x<660&&u.vx<0)u.vx=-u.vx;if(u.x>1260&&u.vx>0)u.vx=-u.vx;u.a=Math.min(1,u.a+dt*.4);}
  if(b.tunas.length>want)b.tunas=b.tunas.filter((u,i)=>i<want||(u.a-=dt*.6)>0);
  if(b.step==='vifs'){G.t+=dt;b.md+=(b.hold?-Math.max(9,b.bot/5):Math.max(6.5,b.bot/7))*dt;b.md=clamp(b.md,1.5,b.bot-.5);
    b.sdT-=dt;if(b.sdT<=0){b.sdT=rnd(1.5,3.5);b.sdv=rnd(-1.5,1.5);}b.sd=clamp(b.sd+b.sdv*dt,b.bot-5,b.bot-1);if(b.sd<=b.bot-5||b.sd>=b.bot-1)b.sdv=-b.sdv;
    if(Math.abs(b.md-b.sd)<3.5&&b.line<6){b.fishT-=dt;if(b.fishT<=0){b.fishT=rnd(.2,.5);if(Math.random()<.7)b.line++;}}
    if(b.md<3.2&&b.line>0){G.vivier+=b.line;toast('+'+b.line+' maquereau'+(b.line>1?'x':'')+' au vivier','#0E8A72');b.line=0;}
    if(G.vivier>=8||b.t>75){if(b.t>75&&G.vivier<8)toast('On n’a plus le temps : on fait avec ce qu’on a.','#0E8A72');setupRods();}return;}
  if(b.step==='cannes'){G.t+=dt*2;if(b.t>2.6){b.step='attente';b.t=0;if(!G.bmMsg){G.bmMsg=1;say(['Les cannes sont prêtes, chacune à une profondeur différente. Maintenant, le <b>broumé</b> : on broie la sardine et on la jette petit à petit. L’odeur fait une traînée dans le courant… et les thons remontent la piste.','<b>Broumé léger</b> : ça économise la sardine. <b>Broumé fort</b> : les thons arrivent plus vite, mais les caisses partent vite. Quand une canne part, <b>touche-la vite</b> ! Tu peux accélérer le temps.'],null,{last:'On attend →'});}}return;}
  // attente
  const dm=dt*60/SPH*G.warp;G.t+=dm;G.fuel+=DRIFT_LH*dm/60;G.hB+=dm/60;
  const lvl=BM[b.bm];let s=lvl.s;if(G.caisses>=CAISSES-.001){s=0;if(!b.empty){b.empty=1;toast('Plus de sardines pour le broumé !','#C4613A');}}
  if(s>0)G.caisses=Math.min(CAISSES,G.caisses+lvl.c*dm/60);
  b.S+=(s-b.S)*Math.min(1,dm/20);
  if(b.S>.05)b.A=Math.min(1,b.A+b.S*.9*dm/60);else b.A=Math.max(0,b.A-.6*dm/60);
  for(const r of b.rods)r.bend+=((b.bite&&b.bite.r===r?1:0)-r.bend)*Math.min(1,dt*6);
  const baited=b.rods.filter(r=>r.bait),q=baited.reduce((a,r)=>a+(r.bait==='vif'?1:.5),0)/6,day=sunPos(tod()).el>-3?1:.35;
  const lam=.9*ab(G.zf,B.x,B.y)*b.A*Math.pow(Math.max(q,.01),.7)*day;
  if(!b.bite&&baited.length&&Math.random()<lam*dm/60){b.bite={r:baited[Math.floor(Math.random()*baited.length)],t:0};G.warp=1;}
  if(b.bite){b.bite.t+=dt;if(b.bite.t>4){b.bite.r.bait=null;b.bite=null;toast('Trop tard : il a arraché le vif et il est reparti…','#C4613A');rebait();}}
  B.x+=.25*dm/60;
}
function broumeTap(p){const b=G.br;if(!b)return;const u=G.ui;
  if(b.step==='vifs'){if(inR(p,u.enough)&&G.vivier>=2){setupRods();return;}b.hold=true;return;}
  if(b.step!=='attente')return;
  if(b.bite){const r=b.bite.r;r.bait=null;b.bite=null;startFight({w:wB(),src:'broume',back:'broume'});return;}
  for(let i=0;i<3;i++)if(inR(p,u.bm&&u.bm[i])){b.bm=i;return;}
  if(inR(p,u.bw)){G.warp=G.warp===1?4:1;return;}if(inR(p,u.leave)){leaveBroume(false);return;}if(inR(p,u.bhome)){leaveBroume(true);return;}}
function boatSide(tt,night,rodsFn){// ligneur de 12 m vu de côté, proue à gauche
  const bob=Math.sin(tt*1.3)*3;ctx.save();ctx.translate(0,bob);
  ctx.fillStyle='rgba(120,30,20,.55)';ctx.beginPath();ctx.moveTo(150,SURF);ctx.quadraticCurveTo(200,SURF+44,330,SURF+46);ctx.lineTo(560,SURF+34);ctx.lineTo(600,SURF);ctx.closePath();ctx.fill();
  ctx.fillStyle=night?'#C9CFD8':'#F4F7FB';ctx.beginPath();ctx.moveTo(120,196);ctx.quadraticCurveTo(140,SURF,170,SURF);ctx.lineTo(598,SURF);ctx.lineTo(606,212);ctx.lineTo(606,206);ctx.lineTo(130,190);ctx.closePath();ctx.fill();
  ctx.fillStyle='#0012B5';ctx.beginPath();ctx.moveTo(126,206);ctx.lineTo(606,220);ctx.lineTo(606,229);ctx.lineTo(132,216);ctx.closePath();ctx.fill();
  ctx.fillStyle='#E0321F';ctx.fillRect(160,SURF-6,438,5);
  ctx.fillStyle=night?'#AEB6C0':'#E9EEF3';rr(210,136,140,72,8);ctx.fill();ctx.fillStyle=night?'#FFD58A':'#9CC3E6';for(let i=0;i<3;i++){rr(222+i*42,150,34,26,4);ctx.fill();}
  ctx.fillStyle='#C9CFD8';ctx.fillRect(200,130,160,8);ctx.strokeStyle='#8E99A5';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(300,130);ctx.lineTo(300,70);ctx.stroke();ctx.fillStyle=night?'#FFF6D0':'#fff';ctx.beginPath();ctx.arc(300,68,4,0,TAU);ctx.fill();
  ctx.strokeStyle='#C9CFD8';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(380,200);ctx.lineTo(606,206);ctx.stroke();for(let x=390;x<606;x+=36){ctx.beginPath();ctx.moveTo(x,200+(x-380)*.027);ctx.lineTo(x,210+(x-380)*.027);ctx.stroke();}
  rodsFn&&rodsFn();ctx.restore();}
function drawBroume(){const b=G.br;if(!b)return;const tt=G.anim,e=sunPos(tod()).el,night=e<-3,B=G.boat;
  const fs0=sideBegin(b.bot);
  // broumé
  for(const p of b.parts){ctx.fillStyle='rgba(230,210,190,'+(.55*(1-p.l/16))+')';ctx.fillRect(p.x,p.y,3,2);}
  // thons attirés
  for(const u of b.tunas){ctx.save();ctx.globalAlpha=u.a*.8;tunaSide(u.x,yD(u.y),u.s,u.vx<0,tt*1.2+u.ph,false);ctx.restore();}
  // bateau, cannes, matelots
  const rods=()=>{if(b.step==='vifs'){const rx=600,ry=190;ctx.strokeStyle='#2A2F38';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(575,205);ctx.lineTo(650,150);ctx.stroke();return;}
    const shown=b.step==='cannes'?Math.min(6,Math.floor(b.t/.35)):6;for(let i=0;i<shown;i++){const r=b.rods[i];if(!r.on)continue;const hx=420+i*30,hy=203+i*.8,bend=r.bend,L=230;
      const tx=hx+L*Math.cos(-.55+i*.06)+bend*30,ty=hy-L*Math.sin(.55-i*.06)+bend*(70+Math.sin(tt*30)*8);
      ctx.strokeStyle='#1C2B4A';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(hx,hy+14);ctx.quadraticCurveTo(hx+L*.5,hy-L*.35+bend*20,tx,ty);ctx.stroke();ctx.fillStyle='#C9CFD8';ctx.beginPath();ctx.arc(hx+14,hy,5,0,TAU);ctx.fill();
      r.tip=[tx,ty];}};
  boatSide(tt,night,rods);
  person(560,222,104,'#FF7A1A',false,tt);person(478,222,110,'#1C2B4A',false,tt);
  if(b.step==='attente'&&b.S>.05&&Math.sin(tt*2)>.2){ctx.fillStyle='rgba(230,210,190,.9)';for(let i=0;i<6;i++){const k=(tt*2+i*.3)%1;ctx.fillRect(590+k*40,160+k*k*80+i*2,3,3);}}
  // lignes et vifs
  if(b.step!=='vifs'){for(let i=0;i<6;i++){const r=b.rods[i];if(!r.on||!r.tip)continue;if(b.step==='cannes'&&i>=Math.floor(b.t/.35))continue;const [tx,ty]=r.tip,bite=b.bite&&b.bite.r===r;
      const wx=tx+26,ex=tx+70+r.d*2+(bite?Math.sin(tt*20)*14:0),ey=yD(r.d);ctx.strokeStyle=bite?'#FF4D3D':'rgba(230,236,244,.75)';ctx.lineWidth=bite?2.4:1.2;ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo(wx,ty+30,wx,SURF);ctx.lineTo(ex,ey);ctx.stroke();
      if(r.bait==='vif')mackerel(ex+10,ey+4,1.5,false,tt+i);else if(r.bait==='sard'){ctx.fillStyle='#C9D6E3';ctx.beginPath();ctx.ellipse(ex+8,ey+4,12,3.5,0,0,TAU);ctx.fill();}else hookIcon(ex,ey+6,1,'#8E99A5');
      if(bite){ctx.strokeStyle='rgba(255,77,61,'+(.5+.5*Math.sin(tt*12))+')';ctx.lineWidth=4;ctx.beginPath();ctx.arc(tx,ty,26,0,TAU);ctx.stroke();tunaSide(ex+50,ey+10,1.4,true,tt*3,false);}}}
  else{// mitraillette et banc de maquereaux
    const sx=650,sy=150,lx=680,my=yD(b.md);ctx.strokeStyle='rgba(230,236,244,.85)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(lx,180,lx,SURF);ctx.lineTo(lx,my);ctx.stroke();
    const cols=['#FF4D3D','#FFE14D','#00FFFF','#FF7A1A','#3BF0A0','#FF9ADF'];for(let i=0;i<6;i++){const hy=my-i*11;ctx.strokeStyle='rgba(230,236,244,.7)';ctx.beginPath();ctx.moveTo(lx,hy);ctx.lineTo(lx+10,hy+3);ctx.stroke();ctx.fillStyle=cols[i];ctx.beginPath();ctx.ellipse(lx+13,hy+4,4,1.8,.4,0,TAU);ctx.fill();if(i<b.line)mackerel(lx+22,hy+6,1.2,false,tt*2+i);}
    ctx.fillStyle='#8E99A5';ctx.beginPath();ctx.arc(lx,my+8,4,0,TAU);ctx.fill();
    const y0=yD(b.bot-5),y1=yD(b.bot-.8);for(let i=0;i<30;i++){const x=1250-((tt*60+i*47)%700),y=y0+((i*37)%100)/100*(y1-y0)+Math.sin(i*1.7+tt)*3+(yD(b.sd)-yD(b.bot-3));mackerel(x,clamp(y,y0,y1),1.3,true,tt+i);}}
  ctx.restore();FS=fs0;
  // HUD et commandes
  const u=G.ui;u.bm=null;u.bw=null;u.leave=null;u.bhome=null;u.enough=null;
  if(b.step==='vifs'){hud('LES VIFS · '+clk(G.t),'Maquereaux au vivier : '+G.vivier+' / 8','Sur la mitraillette : '+b.line+' / 6');
    pill(b.line>=6?'Mitraillette pleine : remonte-la pour décrocher les maquereaux !':'Les maquereaux sont près du fond : relâche pour descendre, maintiens pour remonter','#0E8A72',portrait?150:30,portrait?0:880);
    if(G.vivier>=2){const w=portrait?300:220,h=portrait?64:44;u.enough=[LW-w-20,LH-h-20,w,h];uiBtn(u.enough,'Ça suffit, on boëtte →',true,false,'#0E8A72');}return;}
  if(b.step==='cannes'){hud('BROUMÉ · '+b.place,'On boëtte les cannes…','Un maquereau vivant par canne');return;}
  const lvl=b.S<.1?'aucun':b.S<.6?'léger':'fort',att=b.A<.25?'pas encore là':b.A<.7?'ils arrivent':'ils sont là';
  hud('BROUMÉ · '+b.place+' · '+clk(G.t),'Thons : '+att+' · à bord : '+G.kept.length,'Sardines : '+(CAISSES-G.caisses).toFixed(1).replace('.',',')+' caisses · vivier : '+G.vivier+' · retour à quai vers '+clk(projReturn()));
  if(b.bite)pill('DÉPART ! Une canne part : touche vite pour la prendre !','#C4613A',portrait?150:30,portrait?0:880);
  else pill(b.A<.25?'Le broumé fait son effet… patience':'Surveille les cannes : quand une canne se plie, touche vite !','#0E8A72',portrait?150:30,portrait?0:880);
  const P=portrait?[16,LH-250,LW-32,234]:[LW-436,LH-146,420,130];ctx.fillStyle='rgba(5,10,42,.85)';rr(P[0],P[1],P[2],P[3],14);ctx.fill();
  txt('BROUMÉ',P[0]+14,P[1]+(portrait?34:26),'800 11px Mukta,sans-serif','#7F93B8');
  const bw=portrait?(P[2]-150)/3:(P[2]-100)/3,bh=portrait?64:40;u.bm=[0,1,2].map(i=>[P[0]+(portrait?140:90)+i*(bw+4),P[1]+10,bw-4,bh]);BM.forEach((m,i)=>uiBtn(u.bm[i],m.n,true,b.bm===i));
  const y2=P[1]+(portrait?90:60),bw2=(P[2]-28)/3;u.bw=[P[0]+10,y2,bw2-4,bh];u.leave=[P[0]+10+bw2,y2,bw2-4,bh];u.bhome=[P[0]+10+bw2*2,y2,bw2-4,bh];
  uiBtn(u.bw,G.warp>1?'⏩ ×4':'⏩ Accélérer',true,G.warp>1);uiBtn(u.leave,'Changer de coin',true,false);uiBtn(u.bhome,'⚓ Rentrer',true,false,'#3A2A2A');
  const k=b.A;txt('Attraction',P[0]+14,P[1]+P[3]-(portrait?40:14),'700 10px Mukta,sans-serif','#7F93B8');ctx.fillStyle='#1E2740';rr(P[0]+90,P[1]+P[3]-(portrait?50:22),P[2]-110,10,5);ctx.fill();ctx.fillStyle='#3BF0A0';rr(P[0]+90,P[1]+P[3]-(portrait?50:22),Math.max(10,(P[2]-110)*k),10,5);ctx.fill();}

/* ================= la chasse : vue de côté, comme au broumé ================= */
function startCast(c){const B=G.boat,X0=portrait?640:660,X1=portrait?970:1240;
  const K={c,st:'aim',p:0,pd:1,hold:false,t:0,bot:Math.round(clamp(depthAt(B.x,B.y),25,110)),X0,X1,R:portrait?52:75,bv:rnd(-22,22),Lx:0,fly:0,wait:0,msg:null,casts:0,life:rnd(28,40),sard:[],tun:[],birds:[],jump:[]};
  K.lo=X0+(portrait?110:180);K.hi=X1-(portrait?55:80);K.bx=rnd(K.lo,K.hi);
  for(let i=0;i<55;i++)K.sard.push({a:rnd(0,TAU),r:Math.sqrt(Math.random()),s:rnd(.6,1),v:rnd(1.4,2.6)});
  for(let i=0;i<5;i++)K.tun.push({ph:rnd(0,TAU),sp:rnd(1,1.8)*(Math.random()<.5?1:-1),r:rnd(.7,1.3),s:rnd(1.1,1.5),dy:rnd(-10,20)});
  for(let i=0;i<16;i++)K.birds.push({ph:rnd(0,TAU),r:rnd(30,170),h:rnd(70,200),dive:-1,s:rnd(.8,1.25),sp:rnd(.5,1)*(Math.random()<.5?1:-1)});
  G.cast=K;G.atC=c;G.phase='hunt';G.msg=null;G.warp=1;G.fadeDir=1;G.fadeCb=()=>{G.scene='lancer';};}
function castRelease(){const K=G.cast;if(!K||K.st!=='aim'||!K.hold)return;K.hold=false;K.st='fly';K.fly=0;K.Lx=K.X0+K.p*(K.X1-K.X0);K.casts++;}
function leaveCast(){const K=G.cast;if(K)G.chasses=G.chasses.filter(x=>x!==K.c);G.cast=null;G.atC=null;G.phase='hunt';G.fadeDir=1;G.fadeCb=()=>{G.scene='sea';};}
function updCast(dt){const K=G.cast;if(!K||talk||G.fadeDir>0)return;K.t+=dt;G.t+=dt*.4;G.fuel+=IDLE_LH*dt*.4/60;G.hC+=dt*.4/60;
  K.bx+=K.bv*dt;if(K.bx<K.lo&&K.bv<0||K.bx>K.hi&&K.bv>0)K.bv=-K.bv;if(Math.random()<dt*.3)K.bv=rnd(-24,24);
  for(const b of K.birds){if(b.dive<0){if(Math.random()<dt*.22)b.dive=0;}else{b.dive+=dt/1.1;if(b.dive>1){b.dive=-1;}}}
  if(Math.random()<dt*1.4)K.jump.push({x:rnd(-1,1),t:0,s:rnd(.7,1.2),f:Math.random()<.5});for(const j of K.jump)j.t+=dt;K.jump=K.jump.filter(j=>j.t<1.4);
  if(K.st!=='over'){K.life-=dt;if(K.life<=0){K.st='over';K.wait=0;K.msg='La chasse s’éteint : les sardines plongent, les thons sondent…';}}
  if(K.st==='over'){K.wait+=dt;if(K.wait>2.4)leaveCast();return;}
  if(K.st==='aim'){if(K.hold){K.p+=K.pd*dt*.75;if(K.p>1){K.p=1;K.pd=-1;}if(K.p<0){K.p=0;K.pd=1;}}return;}
  if(K.st==='fly'){K.fly+=dt/.9;if(K.fly>=1){const d=K.Lx-K.bx;if(Math.abs(d)<K.R){K.st='work';K.wait=0;K.msg='En plein dans le banc ! Le leurre travaille…';}else{K.st='back';K.wait=0;K.msg=d<0?'Trop court ! Relance.':'Trop long ! Relance.';}}return;}
  if(K.st==='work'){K.wait+=dt;if(K.wait>1.3){if(Math.random()<.75){K.st='hooked';K.msg=null;startFight({w:wC(),src:'chasse',back:'lancer'});}else{K.st='back';K.wait=0;K.msg='Pas de touche cette fois… Relance !';}}return;}
  if(K.st==='back'){K.wait+=dt;if(K.wait>1.1){K.st='aim';K.p=0;K.pd=1;K.msg=null;}}}
function castTap(p){const K=G.cast;if(!K)return;if(inR(p,G.ui.cback)){K.st='over';K.wait=1.6;K.msg='On laisse cette chasse.';return;}if(K.st==='aim')K.hold=true;}
function drawCast(){const K=G.cast;if(!K)return;const tt=G.anim,e=sunPos(tod()).el,night=e<-3;
  const fs0=sideBegin(K.bot);const lf=K.st==='over'?Math.max(0,1-K.wait/2):clamp(K.life/3,0,1),bx=K.bx,R=K.R,sink=(1-lf)*160;
  // eau blanche en surface
  ctx.fillStyle='rgba(255,255,255,'+(.7*lf)+')';for(let i=0;i<22;i++){const x=bx+Math.sin(i*2.1+tt*3)*R*1.1,w=8+Math.abs(Math.sin(tt*5+i))*14;ctx.beginPath();ctx.ellipse(x,SURF+Math.sin(tt*6+i)*2,w,3,0,0,TAU);ctx.fill();}
  // la boule de sardines
  for(const s of K.sard){const a=s.a+tt*s.v,x=bx+Math.cos(a)*s.r*R,y=SURF+44+Math.sin(a)*s.r*R*.5+sink;ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/2);ctx.fillStyle='rgba(215,228,240,'+(.85)+')';ctx.beginPath();ctx.ellipse(0,0,7*s.s,2*s.s,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(60,90,130,.9)';ctx.beginPath();ctx.ellipse(0,-.8*s.s,6*s.s,.9*s.s,0,0,TAU);ctx.fill();ctx.restore();}
  for(let i=0;i<10&&lf>.3;i++){const k=((tt*1.6+i*.37)%1),x=bx+((i*53)%100/100-.5)*R*1.6,y=SURF-Math.sin(k*Math.PI)*22;ctx.fillStyle='rgba(225,236,246,.9)';ctx.fillRect(x,y,5,2);}
  // les thons qui chassent dans la boule
  for(const u of K.tun){const a=u.ph+tt*u.sp,x=bx+Math.cos(a)*R*1.35*u.r,y=SURF+48+u.dy+Math.sin(a)*R*.55*u.r+sink*1.3;ctx.save();ctx.globalAlpha=.95*Math.max(.2,lf);tunaSide(x,y,u.s,Math.sin(a)*u.sp>0,tt*2.4+u.ph,false);ctx.restore();}
  for(const j of K.jump){if(lf<.3)continue;const k=j.t/1.4,x=bx+j.x*R+(j.f?-1:1)*(k-.5)*90,y=SURF+10-Math.sin(k*Math.PI)*70;ctx.save();ctx.translate(x,y);ctx.rotate((j.f?1:-1)*(-.9+k*1.8));tunaSide(0,0,j.s,j.f,tt*3,false);ctx.restore();if(k>.85){ctx.fillStyle='rgba(255,255,255,.8)';for(let q=0;q<6;q++){ctx.beginPath();ctx.arc(x+Math.cos(q)*14,SURF-Math.abs(Math.sin(q*2))*12,3,0,TAU);ctx.fill();}}}
  // les oiseaux à l'affût
  const bc=night?'rgba(210,220,235,.9)':'#2A2F38';for(const b of K.birds){const ang=b.ph+tt*b.sp;let x=bx+Math.cos(ang)*b.r,y=SURF-b.h+Math.sin(tt*1.3+b.ph)*10;
    if(b.dive>=0&&lf>.3){const k=b.dive;x+= (bx+Math.cos(b.ph)*R*.6-x)*k;y+=(SURF-y)*Math.min(1,k*1.15);if(k>.85){ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.ellipse(x,SURF,12,4,0,0,TAU);ctx.fill();}}
    else if(lf<1)y-=(1-lf)*120;
    const s=13*b.s;if(b.dive>=0&&b.dive<1&&lf>.3){ctx.strokeStyle=bc;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(x-s*.35,y-s*.9);ctx.lineTo(x,y);ctx.lineTo(x+s*.35,y-s*.9);ctx.stroke();}else bird(x,y,s,tt*7+b.ph*3,bc);}
  // bateau : Vincent lance depuis l'arrière
  const hold=K.st==='aim'&&K.hold,tip=hold?[640-K.p*70,120+K.p*30]:[700,110];
  boatSide(tt,night,()=>{ctx.strokeStyle='#1C2B4A';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(566,196);ctx.quadraticCurveTo((566+tip[0])/2,(196+tip[1])/2-10,tip[0],tip[1]);ctx.stroke();ctx.lineCap='butt';});
  person(478,222,110,'#1C2B4A',false,tt);person(556,222,104,'#FF7A1A',false,tt);
  let lure=null;if(K.st==='fly'){const k=K.fly;lure=[tip[0]+(K.Lx-tip[0])*k,tip[1]+(SURF-tip[1])*k-Math.sin(k*Math.PI)*170];}
  else if(K.st==='work')lure=[K.Lx+Math.sin(tt*12)*5,SURF+2];else if(K.st==='back'){const k=Math.min(1,K.wait/1.1);lure=[K.Lx+(tip[0]+30-K.Lx)*k,SURF+2-(k>.8?(k-.8)*300:0)];}
  if(lure){ctx.strokeStyle='rgba(240,244,250,.9)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(tip[0],tip[1]);ctx.quadraticCurveTo((tip[0]+lure[0])/2,Math.min(tip[1],lure[1])-30,lure[0],lure[1]);ctx.stroke();ctx.fillStyle='#FFE14D';ctx.beginPath();ctx.ellipse(lure[0],lure[1],6,3,0,0,TAU);ctx.fill();if(K.st==='work'){ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.ellipse(lure[0],SURF+1,10+Math.sin(tt*20)*4,3,0,0,TAU);ctx.fill();}}
  ctx.restore();FS=fs0;
  // jauge de lancer
  const gw=portrait?440:480,gx=portrait?(LW-440)/2:40,gy=LH-(portrait?90:60),P2X=v=>gx+v*gw,lo=clamp((bx-R-K.X0)/(K.X1-K.X0),0,1),hi=clamp((bx+R-K.X0)/(K.X1-K.X0),0,1);
  ctx.fillStyle='rgba(5,10,42,.85)';rr(gx-14,gy-34,gw+28,70,14);ctx.fill();ctx.fillStyle='#1E2740';rr(gx,gy,gw,16,8);ctx.fill();ctx.fillStyle='rgba(59,240,160,.9)';rr(P2X(lo),gy,Math.max(8,P2X(hi)-P2X(lo)),16,6);ctx.fill();
  txt('PUISSANCE DU LANCER',gx,gy-12,'800 11px Mukta,sans-serif','#E7ECFF');txt('en vert : le banc',gx+gw,gy-12,'800 11px Mukta,sans-serif','#3BF0A0','right');
  const cur=K.st==='aim'?K.p:(K.Lx-K.X0)/(K.X1-K.X0);ctx.fillStyle='#fff';ctx.fillRect(P2X(clamp(cur,0,1))-3,gy-6,6,28);
  hud('CHASSE · '+clk(G.t),'Thons à bord : '+G.kept.length,(K.life<8?'La chasse faiblit…':'La chasse bat son plein')+' · lancers : '+K.casts,K.life<8?'#FF9A7A':'#FFE9A8');
  const msg=K.msg||(K.st==='fly'?'Le leurre vole…':K.hold?'Relâche quand le curseur blanc est dans le vert !':'Maintiens pour armer le lancer, relâche pour lancer dans le banc');
  pill(msg,K.st==='work'?'#0E8A72':K.st==='back'||K.st==='over'?'#C4613A':'#FF7A1A',portrait?150:30,portrait?0:880);
  const bw=portrait?220:160,bh=portrait?56:36;G.ui.cback=K.st==='over'?null:[LW-bw-20,portrait?262:84,bw,bh];if(G.ui.cback)uiBtn(G.ui.cback,'Laisser la chasse',true,false);}

/* ================= le combat : remonter le thon à la canne ================= */
const GAFFE_X=640,GAFFE_W=70;
function gaffeX(Fi){return 640+Math.sin(Fi.ph)*250;}
function startFight(o){const w=o.w;const nS=2+Math.floor(Math.random()*4);G.fi={nS,sDone:0,esc:Math.random()<.2?1+Math.floor(Math.random()*nS):0,escT:-1,w,src:o.src,back:o.back,D:40+Math.min(w,160)*.3,D0:40+Math.min(w,160)*.3,T:20,nextS:rnd(.8,1.5),surge:0,phase:'fight',over:0,slack:0,ph:0,miss:0,p:0,at:0,splash:0,cool:0,hold:false};
  G.warp=1;G.fadeDir=1;G.fadeCb=()=>{G.scene='combat';};}
function endFight(){const Fi=G.fi,back=Fi.back;G.fi=null;
  if(Fi.phase==='aboard'){G.kept.push({sp:'thon',w:Fi.w,src:Fi.src});G.mine++;}
  G.fadeDir=1;G.fadeCb=()=>{if(back==='broume'&&G.br){G.scene='broume';rebait();}else if(back==='lancer'&&G.cast&&G.cast.life>3){G.scene='lancer';const K=G.cast;K.st='aim';K.p=0;K.pd=1;K.msg=null;}else{if(G.cast)G.chasses=G.chasses.filter(x=>x!==G.cast.c);G.cast=null;G.atC=null;G.scene='sea';G.phase='hunt';}
    if(Fi.phase==='aboard'&&!G.bleedMsg){G.bleedMsg=1;say(['Thon de <b>'+Fi.w+' kg</b> à bord ! On le <b>saigne</b> tout de suite et direct dans la <b>glace</b> : c’est ce qui fait la qualité du thon de ligne.'],null,{last:'On continue →'});}};}
function combatTap(){const Fi=G.fi;if(!Fi)return;
  if(Fi.phase==='gaffe'&&Fi.cool<=0){if(Math.abs(gaffeX(Fi)-GAFFE_X)<GAFFE_W){Fi.phase='hisse';Fi.p=0;toast('Gaffé ! Hisse-le à bord !','#0E8A72');}else{Fi.miss++;Fi.splash=.7;Fi.cool=.5;if(Fi.miss>=3){Fi.phase='lost';Fi.at=0;G.lost++;toast('Trois coups dans l’eau : il se décroche…','#C4613A');}else toast('Raté ! Attends qu’il passe dans le cercle','#C4613A');}return;}
  if(Fi.phase==='fight'||Fi.phase==='hisse')Fi.hold=true;}
function updCombat(dt){const Fi=G.fi;if(!Fi||talk||G.fadeDir>0)return;G.t+=dt*1.5;G.fuel+=IDLE_LH*dt*1.5/60;const hold=Fi.hold;
  if(Fi.phase==='fight'){
    if(Fi.surge>0){Fi.surge-=dt;if(Fi.escT>0){Fi.escT-=dt;if(Fi.escT<=0){Fi.phase='lost';Fi.at=0;G.lost++;toast('Dans son rush, il arrache l’hameçon et s’échappe… Ça arrive, c’est la pêche !','#C4613A');}}
      if(Fi.phase==='fight'){if(hold){Fi.D+=12*dt;Fi.over+=dt;if(Fi.over>1.2){Fi.phase='lost';Fi.at=0;G.lost++;toast('Tu as mouliné pendant qu’il rushait : la ligne casse !','#C4613A');}}else Fi.D+=13*dt*(.8+Math.min(Fi.w,150)/250);}
      if(Fi.surge<=0){Fi.surge=0;Fi.over=0;Fi.nextS=rnd(1.2,2.2);}}
    else{Fi.nextS-=dt;if(Fi.sDone<Fi.nS&&(Fi.nextS<=0||Fi.D<8)){Fi.surge=rnd(1.1,1.8);Fi.sDone++;Fi.slack=0;if(Fi.esc===Fi.sDone)Fi.escT=Fi.surge*rnd(.4,.8);}
      Fi.D+=(hold?-(28-Math.min(Fi.w,150)*.06):1.5)*dt;if(Fi.sDone<Fi.nS)Fi.D=Math.max(Fi.D,4);
      if(!hold){Fi.slack+=dt;if(Fi.slack>4.5){Fi.phase='lost';Fi.at=0;G.lost++;toast('Ligne trop molle : il s’est décroché…','#C4613A');}}else Fi.slack=0;}
    Fi.D=clamp(Fi.D,0,Fi.D0+25);Fi.T=hold?(Fi.surge>0?100:55):(Fi.surge>0?45:12);
    if(Fi.phase==='fight'&&Fi.D<=0){if(Fi.w<MINW){Fi.phase='release';Fi.at=0;G.released.push({sp:'thon',w:Fi.w});toast('Moins de 8 kg : on le relâche vivant.','#0E8A72');}else{Fi.phase='gaffe';Fi.ph=rnd(0,TAU);Fi.miss=0;Fi.cool=.6;toast('Il est le long du bord ! Prends la gaffe','#FF7A1A');}}}
  else if(Fi.phase==='gaffe'){Fi.ph+=dt*(1.9+Fi.miss*.15);Fi.cool-=dt;if(Fi.splash>0)Fi.splash-=dt;}
  else if(Fi.phase==='hisse'){Fi.p+=hold?dt/(1+Fi.w/80):-dt*.3;Fi.p=Math.max(0,Fi.p);if(Fi.p>=1){Fi.phase='aboard';Fi.at=0;}}
  else{Fi.at+=dt;if(Fi.at>1.4)endFight();}}
function drawCombat(){const Fi=G.fi;if(!Fi)return;const tt=G.anim,e=sunPos(tod()).el,night=e<-3;
  const sc=portrait?.8:1,cxo=portrait?190:0,oy=portrait?LH-190-640*.8:0,SY=portrait?-800:170;
  ctx.fillStyle='#030817';ctx.fillRect(0,0,LW,LH);
  const fs0=FS;FS=1;ctx.save();ctx.translate(0,oy);ctx.scale(sc,sc);ctx.translate(-cxo,0);
  if(!portrait){ctx.fillStyle=skyBox(e,0,170);ctx.fillRect(-300,0,1900,170);}
  const [sh,sb]=kf(SEA,e);let g=ctx.createLinearGradient(0,SY,0,720);g.addColorStop(0,S(sh));g.addColorStop(1,S(sb));ctx.fillStyle=g;ctx.fillRect(-300,SY,1900,900-SY);
  if(!night){const lg=ctx.createRadialGradient(640,700,20,640,700,560);lg.addColorStop(0,'rgba(120,210,230,.25)');lg.addColorStop(1,'rgba(120,210,230,0)');ctx.fillStyle=lg;ctx.fillRect(-300,SY,1900,900-SY);}
  for(let i=0;i<(portrait?70:46);i++){const k=(i*37%100)/100,y=(portrait?-500:180)+Math.pow(k,1.4)*(portrait?1160:480),x=((i*173+tt*(12+k*30))%1700)-200,w=10+k*40;ctx.strokeStyle='rgba(220,235,255,'+(.08+.18*k)+')';ctx.lineWidth=1+k*1.6;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+w/2,y-3-k*4,x+w,y);ctx.stroke();}
  let fx,fy,fs_,al=1,flip=false,rot=0;const size=.7+Math.min(Fi.w,160)/110;
  if(Fi.phase==='fight'||(Fi.phase==='lost'&&Fi.D>0)||Fi.phase==='release'){const q=clamp(1-Fi.D/(Fi.D0+10),0,1);fx=640+Math.sin(tt*.8)*260*(1-q*.35)+(Fi.surge>0?Math.sin(tt*14)*12:0);fy=250+q*300;fs_=(.45+q*1.25)*size;al=.25+.6*q;flip=Math.cos(tt*.8)<0;
    if(Fi.phase==='release'){fy+=Fi.at*120;al*=Math.max(0,1-Fi.at/1.3);}}
  else if(Fi.phase==='gaffe'||Fi.phase==='lost'){fx=gaffeX(Fi);fy=585+Math.sin(tt*3)*4;fs_=2*size;flip=Math.cos(Fi.ph)<0;}
  else if(Fi.phase==='hisse'){fx=GAFFE_X;fy=585-Fi.p*190;fs_=2*size;rot=-.35*Fi.p;}
  else{const k=Math.min(1,Fi.at/.9);fx=GAFFE_X+k*80;fy=395+k*420-Math.sin(k*Math.PI)*90;fs_=2*size;rot=-.35+k*.9;}
  if(Fi.phase==='lost'){al*=Math.max(0,1-Fi.at/1.2);fy+=Fi.at*60;}
  const hx=fx+(flip?-1:1)*Math.cos(rot)*46*fs_,hy=fy+Math.sin(rot)*46*fs_*(flip?-1:1);
  // canne : le scion plie vers le poisson selon la tension
  const base=portrait?[1000,1000]:[1150,800],k=Fi.phase==='fight'?Fi.T/100:Fi.phase==='gaffe'||Fi.phase==='hisse'?.25:0,tip0=portrait?[820,420]:[930,390];
  const tip=[tip0[0]+(hx-tip0[0])*k*.35,tip0[1]+(Math.max(hy,640)-tip0[1])*k*.55];
  if(Fi.phase!=='aboard'&&Fi.phase!=='release'||Fi.at<.3){ctx.strokeStyle=Fi.surge>0&&Fi.phase==='fight'?'#FF4D3D':'#D8E2EC';ctx.lineWidth=Fi.phase==='fight'?2.2:1.5;ctx.beginPath();ctx.moveTo(tip[0],tip[1]);ctx.quadraticCurveTo((tip[0]+hx)/2,Math.max(tip[1],hy)-(Fi.phase==='fight'&&Fi.hold?0:40),hx,hy);ctx.stroke();}
  ctx.save();ctx.globalAlpha=al;ctx.translate(fx,fy);ctx.rotate(rot);if(Fi.phase==='fight'&&Fi.D>12)ctx.filter='blur('+Math.round(Fi.D/28)+'px)';tunaSide(0,0,fs_,flip,tt*(Fi.surge>0?2.6:1.2),false);ctx.filter='none';ctx.restore();
  if(Fi.phase==='fight'&&Fi.surge>0||Fi.phase==='gaffe'&&(Fi.splash>0||Math.sin(tt*5)>.6)||Fi.phase==='hisse'&&Fi.hold){ctx.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<14;i++){const a=i*.45+tt*7,r=30+((i*13)%40);ctx.beginPath();ctx.arc(fx+Math.cos(a)*r*1.6,Math.max(fy,560)+8+Math.sin(a)*8-(Fi.splash>0?Math.abs(Math.sin(a*3))*30:0),2+(i%3),0,TAU);ctx.fill();}}
  if(Fi.phase==='gaffe'){const ok=Math.abs(gaffeX(Fi)-GAFFE_X)<GAFFE_W,pul=.5+.5*Math.sin(tt*8);ctx.strokeStyle=ok?'rgba(59,240,160,'+(.7+.3*pul)+')':'rgba(255,255,255,.35)';ctx.lineWidth=ok?5:3;ctx.setLineDash(ok?[]:[10,8]);ctx.beginPath();ctx.ellipse(GAFFE_X,592,GAFFE_W+10,26,0,0,TAU);ctx.stroke();ctx.setLineDash([]);}
  // pavois
  ctx.fillStyle='#EEF2F6';ctx.fillRect(-300,640,1900,700);ctx.fillStyle='#0012B5';ctx.fillRect(-300,662,1900,8);ctx.fillStyle='#E0321F';ctx.fillRect(-300,700,1900,4);
  ctx.strokeStyle='#C9CFD8';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-300,600);ctx.lineTo(1600,600);ctx.stroke();for(const x of [100,380,560,730,1100,1380]){ctx.beginPath();ctx.moveTo(x,600);ctx.lineTo(x,640);ctx.stroke();}
  const arm=(x0,y0,x1,y1,col)=>{ctx.strokeStyle=col||'#FF7A1A';ctx.lineWidth=40;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.fillStyle='#FFC247';ctx.beginPath();ctx.arc(x1,y1,17,0,TAU);ctx.fill();ctx.lineCap='butt';};
  if(Fi.phase==='fight'||Fi.phase==='release'||Fi.phase==='lost'&&Fi.D>0){// la canne
    ctx.strokeStyle='#1C2B4A';ctx.lineWidth=12;ctx.lineCap='round';const mid=[(base[0]+tip[0])/2+30*k,(base[1]+tip[1])/2-20+60*k];ctx.beginPath();ctx.moveTo(base[0],base[1]);ctx.quadraticCurveTo(mid[0],mid[1],tip[0],tip[1]);ctx.stroke();ctx.lineWidth=5;ctx.strokeStyle='#2E3F66';ctx.beginPath();ctx.moveTo(mid[0],mid[1]);ctx.quadraticCurveTo((mid[0]+tip[0])/2+10*k,(mid[1]+tip[1])/2+20*k,tip[0],tip[1]);ctx.stroke();ctx.lineCap='butt';
    const rx=base[0]-60,ry=base[1]-120;ctx.fillStyle='#8E99A5';ctx.beginPath();ctx.arc(rx,ry,30,0,TAU);ctx.fill();ctx.fillStyle='#5B6272';ctx.save();ctx.translate(rx,ry);ctx.rotate(Fi.hold&&Fi.surge<=0?tt*14:Fi.surge>0?-tt*20:0);ctx.fillRect(-4,-26,8,52);ctx.restore();
    arm(base[0]+140,base[1]+140,rx+30,ry-10);arm(base[0]-160,base[1]+160,base[0]-90,base[1]-60,'#E86A12');}
  else if(Fi.phase!=='lost'){const tipG=Fi.phase==='gaffe'?[GAFFE_X+18,540+Math.sin(tt*2)*6]:Fi.phase==='hisse'?[GAFFE_X+20,fy-10]:[fx+20,fy-10],b2=portrait?[1010,1000]:[1170,800];
    ctx.strokeStyle='#C8CFD8';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b2[0],b2[1]);ctx.lineTo(tipG[0],tipG[1]);ctx.stroke();ctx.strokeStyle='#8E99A5';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(tipG[0],tipG[1]);ctx.lineTo(tipG[0]-6,tipG[1]+14);ctx.arc(tipG[0]+4,tipG[1]+16,10,Math.PI,Math.PI*.1,true);ctx.stroke();ctx.lineCap='butt';
    const P=q=>[b2[0]+(tipG[0]-b2[0])*q,b2[1]+(tipG[1]-b2[1])*q];const a1=P(.45),a2=P(.22);arm(b2[0]-170,b2[1]+60,a1[0],a1[1]);arm(b2[0]+110,b2[1]+60,a2[0],a2[1]);}
  ctx.restore();FS=fs0;
  hud('À LA CANNE · '+clk(G.t),'Thon rouge ~'+(Math.round(Fi.w/5)*5)+' kg','À bord : '+G.kept.length+(Fi.src==='broume'?' · au broumé':Fi.src==='traine'?' · à la traîne':' · sur une chasse'));
  const ty=portrait?150:108;let msg,col;
  if(Fi.phase==='fight'){if(Fi.surge>0){msg='Il rushe ! Lâche, laisse filer le frein !';col='#C4613A';}else if(Fi.slack>2.5){msg='Ta ligne est molle : mouline, sinon il se décroche !';col='#C4613A';}else{msg='Maintiens pour mouliner · lâche quand il rushe';col='#FF7A1A';}}
  else if(Fi.phase==='gaffe'){msg='Touche quand le thon passe dans le cercle : coup de gaffe !';col='#FF7A1A';}
  else if(Fi.phase==='hisse'){msg=Fi.hold?'Oh hisse ! Continue…':'Maintiens pour le hisser par-dessus le bord';col='#0E8A72';}
  else if(Fi.phase==='aboard'){msg='Thon à bord !';col='#0E8A72';}else if(Fi.phase==='release'){msg='Trop petit : il repart vivant';col='#0E8A72';}else{msg='Perdu…';col='#C4613A';}
  pill(msg,col,ty);
  if(Fi.phase==='fight'||Fi.phase==='hisse'){const kk=Fi.phase==='fight'?clamp(1-Fi.D/Fi.D0,0,1):Fi.p,bw=portrait?560:460,bx=LW/2-bw/2,by=ty+36*FS+(portrait?56:44);
    ctx.fillStyle='rgba(5,10,42,.85)';rr(bx-14,by-30,bw+28,64,14);ctx.fill();txt(Fi.phase==='fight'?'LIGNE RÉCUPÉRÉE':'HISSAGE',bx,by-10,'800 11px Mukta,sans-serif','#E7ECFF');
    ctx.fillStyle='#1E2740';rr(bx,by,bw,16,8);ctx.fill();ctx.fillStyle=Fi.phase==='fight'?(Fi.surge>0?'#FF4D3D':'#00FFFF'):'#3BF0A0';rr(bx,by,Math.max(16,bw*kk),16,8);ctx.fill();}
  if(Fi.phase==='fight'){const gx=LW-(portrait?90:80),gy=portrait?300:200,gh=portrait?300:260;ctx.fillStyle='rgba(5,10,42,.8)';rr(gx-16,gy-36,56,gh+56,14);ctx.fill();ctx.fillStyle='#1E2740';rr(gx,gy,24,gh,12);ctx.fill();const tc=Fi.T>85?'#FF4D3D':Fi.T>40?'#FFB23A':'#3BF0A0';ctx.fillStyle=tc;rr(gx,gy+gh*(1-Fi.T/100),24,gh*Fi.T/100,12);ctx.fill();txt('TENSION',gx+12,gy-14,'800 9px Mukta,sans-serif','#E7ECFF','center');}
  if(Fi.phase==='gaffe'){for(let i=0;i<3;i++){ctx.fillStyle=i<Fi.miss?'#FF6B5A':'rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(LW/2-30+i*30,ty+36*FS+(portrait?40:28),9,0,TAU);ctx.fill();}}}

/* ================= retour à quai : vente au restaurant partenaire ================= */
function startArrival(){const B=G.boat;B.spd=0;G.dest=null;G.via=null;G.phase='docked';G.arr=G.t;G.fadeDir=1;G.fadeCb=()=>{G.scene='arrivee';G.unl={n:G.kept.length,done:0,cur:null,tm:0,fin:false};};}
function updArr(dt){const U=G.unl;if(!U||G.fadeDir)return;U.tm+=dt;
  if(!U.cur&&U.done<U.n&&U.tm>1){U.cur={t:0};}if(U.cur){U.cur.t+=dt/(U.n>6?1.1:1.8);if(U.cur.t>=1){U.cur=null;const f=G.kept[U.done];U.last={w:f.w,p:unitPrice(f.w),t:0};U.sum=(U.sum||0)+U.last.p;U.done++;U.tm=U.n>6?.6:.3;}}if(U.last)U.last.t+=dt;
  if(U.done>=U.n&&!U.fin&&!talk&&U.tm>1.2){U.fin=true;setTimeout(()=>{if(G&&G.scene==='arrivee')finish();},700);}}
function drawArrivee(){const tt=G.anim,U=G.unl||{n:0,done:0},sc=portrait?.65:1,cxo=portrait?180:0,oy=portrait?(LH-720*.65)/2-40:0;
  const e=sunPos(G.arr%1440).el,[top,hor]=kf(SKY,Math.max(e,-2));let g=ctx.createLinearGradient(0,0,0,LH);g.addColorStop(0,S(top));g.addColorStop(.55,S(lerpC(hor,[255,200,150],.3)));g.addColorStop(1,S(hor));ctx.fillStyle=g;ctx.fillRect(0,0,LW,LH);
  const fs0=FS;FS=1;ctx.save();ctx.translate(0,oy);ctx.scale(sc,sc);ctx.translate(-cxo,0);
  if(portrait){const gw=ctx.createLinearGradient(0,600,0,1400);gw.addColorStop(0,'#2C5E8C');gw.addColorStop(1,'#0B2440');ctx.fillStyle=gw;ctx.fillRect(-400,600,2200,1200);}
  const sx=180,sy=300-Math.max(0,e)*4;const sg=ctx.createRadialGradient(sx,sy,6,sx,sy,200);sg.addColorStop(0,'rgba(255,230,180,.9)');sg.addColorStop(1,'rgba(255,200,150,0)');ctx.fillStyle=sg;ctx.fillRect(sx-200,sy-200,400,400);
  ctx.fillStyle='#6F7C63';ctx.beginPath();ctx.moveTo(-60,470);ctx.quadraticCurveTo(250,260,560,196);ctx.quadraticCurveTo(760,168,980,250);ctx.quadraticCurveTo(1150,300,1340,330);ctx.lineTo(1340,480);ctx.lineTo(-60,480);ctx.fill();
  const HC=['#E3C29C','#EEDDBE','#D5946E','#E8D2AA','#C77E62','#E6DECE'];for(let i=0;i<60;i++){const x=40+(i*41)%1200,y=300+((i*67)%120);const hy=x<560?470-(x+60)*.49:x<980?196+Math.pow((x-690)/300,2)*55:250+(x-980)*.28;if(y<hy+22)continue;ctx.fillStyle=HC[i%6];ctx.fillRect(x,y,22,14);ctx.fillStyle='#B4553A';ctx.fillRect(x-1,y-3,24,4);}
  croix(690,190,44,false,false);
  for(let i=0;i<12;i++){const x=i*62-10,w=60,h=78+((i*29)%40);ctx.fillStyle=HC[(i*5)%6];ctx.fillRect(x,470-h,w,h);ctx.fillStyle='#B4553A';ctx.fillRect(x-2,470-h-5,w+4,6);for(let r=0;r<Math.floor(h/26);r++)for(let c=0;c<3;c++){ctx.fillStyle=(r+c+i)%4?'#3A4A5C':'#8FB3D6';ctx.fillRect(x+8+c*17,470-h+10+r*26,9,13);}}
  ctx.fillStyle='#CFC4AE';ctx.fillRect(-20,468,1340,12);
  g=ctx.createLinearGradient(0,480,0,900);g.addColorStop(0,'#2C5E8C');g.addColorStop(1,'#0B2440');ctx.fillStyle=g;ctx.fillRect(-400,480,2200,900);
  for(let k=0;k<22;k++){const y=490+k*10,w=18+Math.sin(tt*2+k)*8;ctx.fillStyle='rgba(255,220,170,'+(.4-k*.017)+')';ctx.fillRect(180+Math.sin(tt*1.4+k*.7)*10-w/2,y,w,3);}
  ctx.fillStyle='#D9D0BD';ctx.fillRect(700,480,640,16);ctx.fillStyle='#B6AB95';ctx.fillRect(700,496,640,110);
  // la camionnette frigorifique du restaurant partenaire, portes arrière ouvertes vers le bateau
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(870,478,400,8);
  ctx.fillStyle='#F4F7FB';rr(880,340,300,138,10);ctx.fill();ctx.fillStyle='#0012B5';ctx.fillRect(880,420,300,10);
  txt('RESTAURANT',1030,378,'800 22px Mukta,sans-serif','#0012B5','center');txt('PARTENAIRE',1030,404,'800 22px Mukta,sans-serif','#0012B5','center');
  ctx.fillStyle='#E9EEF3';ctx.beginPath();ctx.moveTo(1180,382);ctx.lineTo(1236,382);ctx.lineTo(1266,428);ctx.lineTo(1266,478);ctx.lineTo(1180,478);ctx.fill();ctx.fillStyle='#9CC3E6';ctx.beginPath();ctx.moveTo(1190,392);ctx.lineTo(1230,392);ctx.lineTo(1252,426);ctx.lineTo(1190,426);ctx.fill();
  ctx.fillStyle='#1C2230';for(const wx of [940,1210]){ctx.beginPath();ctx.arc(wx,480,20,0,TAU);ctx.fill();}ctx.fillStyle='#8E99A5';for(const wx of [940,1210]){ctx.beginPath();ctx.arc(wx,480,8,0,TAU);ctx.fill();}
  ctx.fillStyle='#1E2430';ctx.fillRect(884,346,54,128);ctx.fillStyle='#D9E4EE';ctx.fillRect(846,346,36,128);ctx.strokeStyle='#B8C4D0';ctx.lineWidth=2;ctx.strokeRect(846,346,36,128);
  for(let i=0;i<U.done;i++){const f=G.kept[i],r=i%6,c=Math.floor(i/6);ctx.save();ctx.translate(911,462-r*18-c*4);tunaSide(0,0,.28+f.w/700,false,0,false);ctx.restore();}
  person(800,480,120,'#F4F6F8',false,tt);ctx.fillStyle='#F4F6F8';rr(786,346,28,14,6);ctx.fill();
  if(U.n&&U.done<U.n){ctx.fillStyle='rgba(255,255,255,.95)';rr(730,286,150,40,12);ctx.fill();ctx.beginPath();ctx.moveTo(790,326);ctx.lineTo(800,340);ctx.lineTo(806,326);ctx.fill();txt('Beaux thons !',805,312,'800 14px Mukta,sans-serif','#0012B5','center');}
  // le ligneur à quai
  ctx.save();ctx.translate(-100,212);ctx.scale(1.15,1.15);boatSide(tt,false,null);ctx.restore();
  ctx.strokeStyle='#C9CFD8';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(700,480);ctx.lineTo(700,330);ctx.lineTo(610,318);ctx.stroke();ctx.fillStyle='#FFB23A';ctx.beginPath();ctx.arc(610,320,7,0,TAU);ctx.fill();
  const left=Math.max(0,U.n-U.done-(U.cur?1:0));for(let i=0;i<Math.min(4,left);i++){const f=G.kept[U.done+(U.cur?1:0)+i];if(f)tunaSide(430+i*46,436,.35+f.w/400,false,0,false);}
  if(U.cur){const f=G.kept[U.done],k=U.cur.t;let x,y;if(k<.4){x=580;y=436-(k/.4)*90;}else if(k<.8){const q=(k-.4)/.4;x=580+q*300;y=346-Math.sin(q*Math.PI)*24;}else{const q=(k-.8)/.2;x=880;y=346+q*90;}
    ctx.strokeStyle='#C9CFD8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(610,320);ctx.lineTo(x,y-30);ctx.stroke();ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/2);tunaSide(0,0,.45+f.w/300,false,0,false);ctx.restore();}
  if(U.last&&U.last.t<2.4){const x=900,y=300-U.last.t*14;ctx.globalAlpha=Math.min(1,2.4-U.last.t);ctx.fillStyle='rgba(5,10,42,.88)';rr(x-62,y-26,124,34,10);ctx.fill();txt(U.last.w+' kg · '+nf(U.last.p)+' €',x,y-4,'800 15px Mukta,sans-serif','#3BF0A0','center');ctx.globalAlpha=1;}
  ctx.restore();FS=fs0;
  ctx.fillStyle='rgba(5,10,42,.78)';rr(16,16,portrait?560:420,portrait?96:66,14);ctx.fill();
  txt('QUAI DE SÈTE · '+clk(G.arr),30,portrait?52:42,'800 15px Mukta,sans-serif','#FFE9A8');txt('Vendus au restaurant, à l’unité : '+U.done+' / '+U.n+(U.sum?' · '+nf(U.sum)+' €':''),30,portrait?88:66,'700 14px Mukta,sans-serif','#00FFFF');
  const bw=portrait?170:120,bh=portrait?54:36;G.ui.skip=U.fin?null:[LW-bw-20,LH-bh-20,bw,bh];if(G.ui.skip){ctx.fillStyle='rgba(5,10,42,.78)';rr(G.ui.skip[0],G.ui.skip[1],bw,bh,bh/2);ctx.fill();txt('Passer →',G.ui.skip[0]+bw/2,G.ui.skip[1]+bh*.66,'800 14px Mukta,sans-serif','#fff','center');}}
function finish(){if(G.phase==='end')return;G.phase='end';
  const kg=G.kept.reduce((a,f)=>a+f.w,0),nB=G.kept.filter(f=>f.src==='broume').length,nC=G.kept.length-nB;
  const sale=G.kept.reduce((a,f)=>a+unitPrice(f.w),0);const fe=G.fuel*FUEL_EUR,se=G.caisses*CAISSE_EUR,res=sale-fe-se;
  const tech=G.hB>.3&&G.hC>.3?'Tu as mixé les deux techniques : '+fmtT(G.hB*60).replace(' h ','h')+' au broumé, '+fmtT(G.hC*60).replace(' h ','h')+' à chercher les chasses.':G.hB>.3?'Journée au <b>broumé</b> : '+fmtT(G.hB*60).replace(' h ','h')+' à attendre que ça morde.':G.hC>.3?'Journée <b>sportive</b> : '+fmtT(G.hC*60).replace(' h ','h')+' à traîner et à courir après les chasses.':'';
  const head=G.kept.length?'À quai à <b>'+fmtT(G.arr)+'</b>. Vincent a appelé le <b>restaurant partenaire</b> : ils sont venus chercher les thons, saignés et sous glace, achetés <b>à l’unité</b>.':'À quai… mais pas un thon aujourd’hui. Ça arrive, c’est la pêche : c’est aussi ça, le métier.';
  const lines=[head+' '+tech,'<div class="cn-sum"><div><b>'+G.kept.length+' · '+nf(kg)+' kg</b><span>thon rouge vendu'+(G.kept.length?' ('+nB+' au broumé, '+nC+' aux leurres)':'')+'</span></div><div class="pos"><b>'+nf(sale)+' €</b><span>vendus à l’unité au restaurant (fictif)</span></div><div class="neg"><b>− '+nf(fe+se)+' €</b><span>gasoil ('+nf(G.fuel)+' L) et sardines ('+G.caisses.toFixed(1).replace('.',',')+' caisses)</span></div><div class="'+(res>=0?'pos':'neg')+'"><b>'+(res>=0?'':'− ')+nf(Math.abs(res))+' €</b><span>résultat de la journée</span></div></div>'+
   (G.kept.length?'<div class="cn-catch">'+G.kept.map((f,i)=>'<div><i style="background:'+(f.src==='broume'?'#0012B5':'#FF7A1A')+'"></i>Thon '+(i+1)+' · '+f.w+' kg<span>'+nf(unitPrice(f.w))+' €</span></div>').join('')+'</div>':'')+
   (kg?'Ces <b>'+nf(kg)+' kg</b> de thon rouge sont décomptés du quota du bateau. ':'')+(G.released.length?G.released.length+' thon'+(G.released.length>1?'s':'')+' de moins de 8 kg relâché'+(G.released.length>1?'s':'')+' vivant'+(G.released.length>1?'s':'')+'. ':'')+'La VHF change chaque jour : demain, essaie une autre zone ou l’autre technique !'+
   '<div class="cn-fine">Prix à l’unité, consommations, prix des sardines, nombre et poids des poissons : fictifs, pour le jeu. Environ 400 € de gasoil par jour pour aller pêcher vers Marseille depuis Sète : d’après les pêcheurs de Sète. Taille minimale du thon rouge : 30 kg ou 115 cm, abaissée à 8 kg ou 75 cm pour la petite pêche côtière de Méditerranée qui vend en frais (règlement UE 2023/2053, art. 19).</div>'];
  const day=G.day;
  if(!G.kept.length){lines[lines.length-1]=lines[lines.length-1].replace('La VHF change chaque jour : demain, essaie une autre zone ou l’autre technique !','Pas grave : on repart demain matin. La VHF aura d’autres nouvelles…');say(lines,()=>{start(day+1);},{last:'Nouvelle journée →'});return;}
  say(lines,()=>{cnClose();},{last:'Terminer →'});
  setTimeout(()=>{const nav=$('cn-nav');if(nav&&!$('cn-again')){const b=document.createElement('button');b.className='cn-btn alt';b.id='cn-again';b.textContent='Nouvelle journée';b.onclick=()=>{b.remove();talk=null;$('cn-talk').hidden=true;start(day+1);};nav.insertBefore(b,$('cn-next'));showLine();}},30);}
function sardine(x,y,s,a){ctx.save();ctx.translate(x,y);ctx.rotate(a||0);ctx.scale(s,s);ctx.fillStyle='#C9D6E3';ctx.beginPath();ctx.ellipse(0,0,14,4.2,0,0,TAU);ctx.fill();ctx.fillStyle='#4A6A8C';ctx.beginPath();ctx.ellipse(0,-1.6,13,1.8,0,0,TAU);ctx.fill();ctx.restore();}
function hookIcon(x,y,s,col){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle=col||'#D8DEE6';ctx.lineWidth=2.4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(0,4);ctx.arc(-5,4,5,0,Math.PI*.95);ctx.stroke();ctx.restore();}
function panel(r,title){ctx.fillStyle='#07090E';rr(r[0]-4,r[1]-4,r[2]+8,r[3]+8,14);ctx.fill();ctx.fillStyle='#0F1522';rr(r[0],r[1],r[2],r[3],10);ctx.fill();if(title)txt(title,r[0]+12,r[1]+(portrait?25:19),'700 11px "Courier New",monospace','#6FA8FF');}
function buildMap(){const m=mapRect();const oc=document.createElement('canvas');const dp=Math.min(2,window.devicePixelRatio||1)*(cv.width/LW)/(DPR)*DPR;oc.width=Math.ceil(m[2]*DPR);oc.height=Math.ceil(m[3]*DPR);const c=oc.getContext('2d');c.setTransform(DPR,0,0,DPR,-m[0]*DPR,-m[1]*DPR);
  const st=portrait?4:3;for(let py=m[1];py<m[1]+m[3];py+=st)for(let px=m[0];px<m[0]+m[2];px+=st){const q=p2m(px+st/2,py+st/2);let col;
    if(pip(q[0],q[1],THAU))col='#A9D6EE';else if(pip(q[0],q[1],LAND))col='#E8DFC6';else{const dc=distCoast(q[0],q[1]),d=depthAt(q[0],q[1],dc);col=d<50?'#CFEAF8':d<100?'#A5D4F0':d<200?'#78B6E4':d<1000?'#3F82C4':'#23579A';}
    c.fillStyle=col;c.fillRect(px,py,st+.5,st+.5);}
  c.strokeStyle='#6E6250';c.lineWidth=1.2;c.beginPath();COAST.forEach((p,i)=>{const q=m2p(p[0],p[1]);i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]);});c.stroke();
  c.strokeStyle='rgba(255,255,255,.75)';c.setLineDash([4,3]);c.beginPath();EDGE.forEach((p,i)=>{const q=m2p(p[0],p[1]);i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]);});c.stroke();c.setLineDash([]);
  const fz=f=>fs(f);c.textAlign='left';
  c.fillStyle='rgba(255,255,255,.9)';c.font=fz('700 8px Mukta,sans-serif');const aq=m2p(40,-25);c.fillText('accores ≈ 200 m',aq[0],aq[1]);
  for(const t of TOWNS){if(!t.lab&&t.n!=='Sète')continue;const q=m2p(t.x,t.y);c.fillStyle='#3B3226';c.beginPath();c.arc(q[0],q[1],2,0,TAU);c.fill();c.font=fz((t.n==='Sète'?'800 10px':'600 8px')+' Mukta,sans-serif');const west=t.x<-5||t.x>60;c.textAlign=west?'right':'left';c.fillText(t.n,q[0]+(west?-4:4),q[1]+(t.y>0?-3:3));}
  c.textAlign='left';c.font=fz('700 9px Mukta,sans-serif');c.fillStyle='#0A2A5A';
  const s=mapFit().s,sb=m2p(24,-47.8);c.fillStyle='#0A2A5A';c.fillRect(sb[0]-10*s-40,sb[1]+6-40,0,0);
  const sq=[m[0]+m[2]-10*s-12,m[1]+m[3]-10];c.strokeStyle='#0A2A5A';c.lineWidth=2;c.beginPath();c.moveTo(sq[0],sq[1]);c.lineTo(sq[0]+10*s,sq[1]);c.stroke();c.font=fz('700 8px Mukta,sans-serif');c.fillStyle='#0A2A5A';c.textAlign='center';c.fillText('10 milles',sq[0]+5*s,sq[1]-4);
  c.textAlign='left';c.font=fz('800 10px Mukta,sans-serif');c.fillStyle='#0A2A5A';c.fillText('N ↑',m[0]+6,m[1]+14*FS);
  return oc;}
function drawSonar(){const r=L().son;panel(r,'SONDEUR');const x=r[0]+8,y=r[1]+(portrait?34:26),w=r[2]-16,h=r[3]-(portrait?42:34);ctx.fillStyle='#061A45';ctx.fillRect(x,y,w,h);
  const D=G.sonar;let md=40;for(const s of D)md=Math.max(md,s.d);md=Math.min(300,Math.ceil(md*1.3/20)*20);const N=160,cw=w/N;
  for(let i=0;i<D.length&&i<N;i++){const s=D[D.length-1-i],cx=x+w-(i+1)*cw,by=y+Math.min(1,s.d/md)*h;ctx.fillStyle='#6E2A18';ctx.fillRect(cx,by,cw+.6,y+h-by);ctx.fillStyle='#F04A2C';ctx.fillRect(cx,by-1,cw+.6,3);
    const n=Math.round(s.f*5);for(let k=0;k<n;k++){const hs=(s.sd*7+k*131)%100/100;const fy=by-5-hs*h*.26;if(fy<y)continue;ctx.fillStyle=s.f>.9?'#FF4D3D':s.f>.55?'#FFD23F':'#3BF0A0';ctx.fillRect(cx,fy,cw+.8,2.2);}}
  const last=D[D.length-1];txt(last?Math.round(last.d)+' m':'—',x+w-6,y+16*FS,'800 13px Mukta,sans-serif','#fff','right');txt('0',x+4,y+11*FS,'700 9px Mukta,sans-serif','#7F93B8');txt(md+' m',x+4,y+h-4,'700 9px Mukta,sans-serif','#7F93B8');
  if(last&&(G.phase==='hunt'||G.phase==='transit'||G.phase==='idle')){const f=last.f;txt(f>.9?'Échos forts':f>.55?'Échos moyens':'Échos faibles',x+w-6,y+h-6,'800 10px Mukta,sans-serif',f>.9?'#FF4D3D':f>.55?'#FFD23F':'#3BF0A0','right');}}
function btn(rc,label,on,col,sel){ctx.fillStyle=sel?'#00FFFF':on?(col||'#1E2A44'):'#1A1F2B';rr(rc[0],rc[1],rc[2],rc[3],10);ctx.fill();if(sel){ctx.strokeStyle='#00FFFF';ctx.lineWidth=2;ctx.stroke();}
  ctx.font=fs('800 12px Mukta,sans-serif');ctx.fillStyle=sel?'#0012B5':on?'#fff':'#5A6478';ctx.textAlign='center';ctx.fillText(label,rc[0]+rc[2]/2,rc[1]+rc[3]/2+4*FS);}
function drawToast(){if(!G.msg)return;const W=L().win,a=Math.min(1,G.msg.life*2);ctx.save();ctx.globalAlpha=a;ctx.font=fs('800 16px Mukta,sans-serif');const tw=Math.min(W[2]-60,ctx.measureText(G.msg.t).width+40),th=34*FS;
  ctx.fillStyle=G.msg.c;rr(W[0]+W[2]/2-tw/2,W[1]+26,tw,th,th/2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(G.msg.t,W[0]+W[2]/2,W[1]+26+th*.66,tw-24);ctx.restore();}


function drawFrame(x0,y0,w,h,night){const pc='#11151D';ctx.fillStyle=pc;ctx.fillRect(x0,y0,w,14);const n=3;for(let i=0;i<=n;i++){const x=x0+i*w/n;ctx.fillRect(x-(i===0||i===n?0:12),y0,i===0||i===n?14:24,h);}
  const dg=ctx.createLinearGradient(0,y0+h,0,LH);dg.addColorStop(0,'#2B3240');dg.addColorStop(1,'#12151C');ctx.fillStyle=dg;ctx.fillRect(0,y0+h,LW,LH-y0-h);
  ctx.fillStyle='#3A4252';ctx.fillRect(0,y0+h-4,LW,12);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(0,y0+h-4,LW,2);
  if(night>.3){const lg=ctx.createRadialGradient(LW/2,y0+h+30,10,LW/2,y0+h+30,LW*.6);lg.addColorStop(0,'rgba(255,90,60,.10)');lg.addColorStop(1,'rgba(255,90,60,0)');ctx.fillStyle=lg;ctx.fillRect(0,y0+h,LW,LH);}}
function drawRods(x0,y0,w,h,night,tt){// cannes et leurres à la traîne, sur l'arrière… vues depuis la timonerie : deux tangons de part et d'autre
  if(G.phase!=='hunt'&&G.phase!=='chase')return;const by=y0+h;ctx.strokeStyle=night>.5?'#3A4254':'#1C2B4A';ctx.lineWidth=5;ctx.lineCap='round';
  ctx.lineWidth=3;ctx.strokeStyle=night>.5?'#3A4254':'#9AA5B2';for(const s of [-1,1]){const bx=x0+w/2+s*w*.3;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+s*w*.2,by-h*.78+Math.sin(tt*2+s)*3);ctx.stroke();}
  ctx.lineCap='butt';}

/* ================= tableau de bord ================= */
let CMP=[];function compass(m,h,tg){CMP=tg;}
function miniCmp(x,y,w,H,res){const R=portrait?24:17,cx=x+w-12-R,cy=y+H-10-res-R-2,h=G.boat.h;ctx.save();
  ctx.fillStyle='#050A14';ctx.beginPath();ctx.arc(cx,cy,R+3,0,TAU);ctx.fill();ctx.strokeStyle='rgba(0,255,255,.45)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.stroke();
  for(let i=0;i<8;i++){const a=i*TAU/8,r1=R-(i%2?2.5:4.5);ctx.strokeStyle=i%2?'rgba(231,236,255,.3)':'rgba(231,236,255,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx+Math.sin(a)*r1,cy-Math.cos(a)*r1);ctx.lineTo(cx+Math.sin(a)*R,cy-Math.cos(a)*R);ctx.stroke();}
  txt('N',cx,cy-R-(portrait?6:5),'800 '+(portrait?10:8)+'px Mukta,sans-serif','#FF6B5A','center');
  for(const t of CMP){const a=t[0];ctx.save();ctx.translate(cx+Math.sin(a)*(R+1),cy-Math.cos(a)*(R+1));ctx.rotate(a);ctx.fillStyle=t[1];ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(3.6,2.5);ctx.lineTo(-3.6,2.5);ctx.closePath();ctx.fill();ctx.restore();}
  const L=R-3;ctx.save();ctx.translate(cx,cy);ctx.rotate(h);ctx.strokeStyle='rgba(231,236,255,.35)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,L*.4);ctx.stroke();
  ctx.fillStyle='#00FFFF';ctx.beginPath();ctx.moveTo(0,-L);ctx.lineTo(3.2,-L+7);ctx.lineTo(1,-L+6.5);ctx.lineTo(1,0);ctx.lineTo(-1,0);ctx.lineTo(-1,-L+6.5);ctx.lineTo(-3.2,-L+7);ctx.closePath();ctx.fill();ctx.restore();
  ctx.fillStyle='#E7ECFF';ctx.beginPath();ctx.arc(cx,cy,1.8,0,TAU);ctx.fill();ctx.restore();}
function brgA(x,y){const B=G.boat;return Math.atan2(x-B.x,y-B.y);}
function drawPlot(){const r=L().plot,m=mapRect(),tt=G.anim;panel(r,null);if(!mapCache)mapCache=buildMap();ctx.drawImage(mapCache,m[0],m[1],m[2],m[3]);
  ctx.save();ctx.beginPath();ctx.rect(m[0],m[1],m[2],m[3]);ctx.clip();const s=mapFit().s;
  for(let i=0;i<ZONES.length;i++){const z=ZONES[i],q=m2p(z.x,z.y);const pul=G.phase==='plan'?.5+.5*Math.sin(tt*4):0;ctx.strokeStyle='rgba(10,42,90,'+(.45+.4*pul)+')';ctx.setLineDash([3,3]);ctx.lineWidth=1.3+pul;ctx.beginPath();ctx.arc(q[0],q[1],5*s,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.font=fs('800 9px Mukta,sans-serif');const tw=ctx.measureText(z.n).width+8;ctx.fillStyle='rgba(255,255,255,.85)';rr(q[0]-tw/2,q[1]-5*s-14*FS,tw,12*FS,4);ctx.fill();ctx.fillStyle='#0A2A5A';ctx.textAlign='center';ctx.fillText(z.n,q[0],q[1]-5*s-5*FS);}
  ctx.lineCap='round';for(let i=1;i<G.track.length;i++){const a=G.track[i-1],b=G.track[i];const p=m2p(a[0],a[1]),q=m2p(b[0],b[1]);ctx.strokeStyle=b[2]?'#FF7A1A':'rgba(255,255,255,.85)';ctx.lineWidth=b[2]?2.4:1.5;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();}
  for(const b of G.boats){if(b.st==='dock')continue;const q=m2p(b.x,b.y);ctx.save();ctx.translate(q[0],q[1]);ctx.rotate(b.h);ctx.fillStyle='#5A6576';ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(3.5,4);ctx.lineTo(-3.5,4);ctx.closePath();ctx.fill();ctx.restore();}
  for(const c of G.chasses){if(!c.seen)continue;const q=m2p(c.x,c.y),a=clamp(Math.min(c.age/2,(c.life-c.age)/3),0,1),pul=.5+.5*Math.sin(tt*6);ctx.globalAlpha=a;ctx.fillStyle=G.chaseC===c||G.atC===c?'#FF4D3D':'#FF7A1A';ctx.beginPath();ctx.arc(q[0],q[1],6+pul*2,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(q[0]-4,q[1]-1);ctx.quadraticCurveTo(q[0]-2,q[1]-4,q[0],q[1]);ctx.quadraticCurveTo(q[0]+2,q[1]-4,q[0]+4,q[1]-1);ctx.stroke();ctx.strokeStyle='rgba(255,122,26,'+(.6*(1-pul))+')';ctx.beginPath();ctx.arc(q[0],q[1],10+pul*8,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
  const B=G.boat,bq=m2p(B.x,B.y);
  if(G.dest&&G.phase!=='hunt'||G.phase==='hunt'&&G.dest){const q=m2p(G.dest[0],G.dest[1]);ctx.strokeStyle=G.phase==='chase'?'#FF7A1A':'#E0321F';ctx.setLineDash([6,4]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bq[0],bq[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(q[0],q[1],6,0,TAU);ctx.stroke();}
  if(G.phase==='hunt'||G.phase==='chase'){ctx.strokeStyle='rgba(255,122,26,.35)';ctx.setLineDash([2,4]);ctx.beginPath();ctx.arc(bq[0],bq[1],4.2*s,0,TAU);ctx.stroke();ctx.setLineDash([]);}
  ctx.save();ctx.translate(bq[0],bq[1]);ctx.rotate(B.h);ctx.fillStyle='#00FFFF';ctx.strokeStyle='#0A0A1F';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(0,4);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  let tip=null;if(G.phase==='plan'&&!G.dest)tip='Touche le traceur pour tracer la route';
  if(tip){ctx.fillStyle='rgba(10,10,31,.8)';ctx.font=fs('800 12px Mukta,sans-serif');const tw=ctx.measureText(tip).width+30;rr(m[0]+m[2]/2-tw/2,m[1]+m[3]-40*FS,tw,26*FS,13*FS);ctx.fill();txt(tip,m[0]+m[2]/2,m[1]+m[3]-22*FS,'800 12px Mukta,sans-serif','#00FFFF','center');}
  compass(m,G.boat.h,(G.dest?[[brgA(G.dest[0],G.dest[1]),'#E0321F']]:[]).concat(G.chasses.filter(c=>c.seen).map(c=>[brgA(c.x,c.y),G.chaseC===c||G.atC===c?'#FF4D3D':'#FF7A1A'])));ctx.restore();drawInfo(r);}
function drawInfo(r){const iw=portrait?236:196,x=r[0]+r[2]-iw-2,y=r[1]+6,w=iw-8;ctx.fillStyle='#0A0F1A';rr(x,y,w,r[3]-12,8);ctx.fill();
  const B=G.boat,dc=distCoast(B.x,B.y),d=depthAt(B.x,B.y,dc),lx=x+10,lh=portrait?25:17;let yy=y+(portrait?26:18);
  const L1=(a,b,c)=>{txt(a,lx,yy,'700 10px Mukta,sans-serif','#7F93B8');if(b)txt(b,x+w-10,yy,'800 11px Mukta,sans-serif',c||'#E7ECFF','right');yy+=lh;};
  txt('CAP '+pad(Math.round(((B.h/D2R)%360+360)%360))+'°',lx,yy,'800 12px Mukta,sans-serif','#00FFFF');txt((B.spd.toFixed(1)).replace('.',',')+' nds',x+w-10,yy,'800 12px Mukta,sans-serif','#00FFFF','right');yy+=lh;
  L1('Fond',Math.round(Math.max(0,d))+' m');L1('Lieu',placeName(B.x,B.y,d));
  const mode=G.phase==='hunt'?(G.atC?'● Sur la chasse':'● Traîne · '+TROLL_KN+' nds'):G.phase==='chase'?'● Vers la chasse !':G.phase==='return'?'● Retour à Sète':G.phase==='transit'?'● En route':'● À l’arrêt';txt(mode,lx,yy,'800 10px Mukta,sans-serif',G.phase==='hunt'||G.phase==='chase'?'#FF9A4A':'#3BF0A0');yy+=lh+3;
  if(G.dest&&G.phase!=='hunt'){const dd=Math.hypot(G.dest[0]-B.x,G.dest[1]-B.y),kn=G.phase==='return'?Math.max(1,B.spd||THR[G.thr].kn):THR[G.thr].kn;L1('Distance',(dd.toFixed(1)).replace('.',',')+' M');L1('Arrivée',fmtT(G.t+dd/kn*60),'#FFE9A8');}else yy+=lh*2;
  const eta=G.phase==='return'?G.t+Math.hypot(PORT[0]-B.x,PORT[1]-B.y)/Math.max(1,B.spd||THR[G.thr].kn)*60:projReturn();
  txt('RETOUR À QUAI ESTIMÉ',lx,yy,'800 9px Mukta,sans-serif','#7F93B8');yy+=portrait?24:17;txt(fmtT(eta),lx,yy,'800 17px Mukta,sans-serif','#3BF0A0');yy+=lh;
  G.ui.home=null;if(atSea()&&G.t>T_START+30){const bh=portrait?34:24,by=y+r[3]-12-bh-6;G.ui.home=[lx-4,by,w-12,bh];ctx.fillStyle='#1E2A44';rr(lx-4,by,w-12,bh,bh/2);ctx.fill();txt('⚓ Rentrer à Sète',lx-4+(w-12)/2,by+bh*.68,'800 11px Mukta,sans-serif','#FFE9A8','center');}miniCmp(x,y,w,r[3]-12,G.ui.home?G.ui.home[3]+8:0);}
function drawGauges(){const r=L().gau;panel(r,null);const x=r[0]+12,y=r[1],late=false;const ng=clamp((-sunPos(tod()).el-2)/8,0,1);
  txt(clk(G.t),x,y+(portrait?64:48),'800 38px "Courier New",monospace',late?'#FF6B5A':'#FFE9A8');txt((ng>.5?'nuit':sunPos(tod()).el<8?'aube':'jour')+(G.day>1?' · jour '+G.day:''),x,y+(portrait?92:68),'700 10px Mukta,sans-serif','#7F93B8');
  const rx=portrait?x+250:x+168,rw=r[0]+r[2]-12,lh=portrait?25:19;let yy=y+(portrait?30:22);const kg=G.kept.reduce((a,f)=>a+f.w,0);
  const L1=(a,b,c)=>{txt(a,portrait?x:rx,yy,'700 10px Mukta,sans-serif','#7F93B8');txt(b,rw,yy,'800 12px Mukta,sans-serif',c||'#E7ECFF','right');yy+=lh;};
  if(portrait){yy=y+122;txt('À bord '+G.kept.length+' thon'+(G.kept.length>1?'s':'')+' · '+nf(kg)+' kg',x,yy,'800 12px Mukta,sans-serif','#3BF0A0');txt('Gasoil '+nf(G.fuel)+' L · '+nf(G.fuel*FUEL_EUR)+' €',rw,yy,'800 12px Mukta,sans-serif','#FFB23A','right');if(G.warp>1)txt('temps ×4',rw,y+64,'700 10px Mukta,sans-serif','#00FFFF','right');return;}
  L1('À bord',G.kept.length+' · '+nf(kg)+' kg','#3BF0A0');L1('Gasoil',nf(G.fuel)+' L','#FFB23A');L1('Coût',nf(G.fuel*FUEL_EUR)+' €','#FFB23A');L1('Vivier',G.vivier+' maquereaux','#00FFFF');
  if(G.warp>1)txt('temps ×4',x,y+104,'800 10px Mukta,sans-serif','#00FFFF');}
function drawCtrl(){const r=L().ctrl;panel(r,null);const u=G.ui,pul=(Math.sin(G.anim*4)+1)/2,[lab,short,on]=actLabel(),[al,as,aon]=altLabel();
  if(portrait){const y=r[1]+8,h=r[3]-16;u.thr=[0,1,2].map(i=>[r[0]+8+i*70,y,64,h]);u.act=[r[0]+220,y,210,h];u.alt=[r[0]+436,y,170,h];u.warp=[r[0]+612,y,76,h];}
  else{u.thr=[0,1,2].map(i=>[r[0]+8+i*98,r[1]+8,92,38]);u.act=[r[0]+8,r[1]+54,290,60];u.alt=[r[0]+8,r[1]+122,170,34];u.warp=[r[0]+184,r[1]+122,114,34];}
  THR.forEach((T,i)=>btn(u.thr[i],portrait?T.n:T.n+' '+T.kn+' nds',G.phase!=='hunt',null,G.thr===i&&G.phase!=='hunt'));
  const a=u.act;ctx.fillStyle=on?'#FF4D3D':'#3A2A2A';ctx.shadowColor='#FF4D3D';ctx.shadowBlur=on?14+10*pul:0;rr(a[0],a[1],a[2],a[3],14);ctx.fill();ctx.shadowBlur=0;
  txt(portrait?short:lab,a[0]+a[2]/2,a[1]+a[3]/2+6,'800 '+(portrait?16:18)+'px Mukta,sans-serif',on?'#fff':'#9A8A8A','center');
  btn(u.alt,portrait?as:al,aon,'#0E6A58',false);
  btn(u.warp,portrait?'×4':(G.warp>1?'⏩ ×4':'⏩ Accélérer'),G.phase!=='plan',null,G.warp>1);}
function drawTip(){const r=L().tip;panel(r,null);const fsz=portrait?62:64,cx=r[0]+12+fsz/2,cy=r[1]+r[3]/2;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,fsz/2,0,TAU);ctx.clip();if(VIMG.complete)ctx.drawImage(VIMG,cx-fsz/2,cy-fsz/2,fsz,fsz);ctx.restore();ctx.strokeStyle='#00FFFF';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,fsz/2,0,TAU);ctx.stroke();
  const ph=G.phase,B=G.boat;let t;
  if(ph==='plan')t=G.dest?'Choisis l’allure : plein gaz, on arrive plus tôt mais on brûle bien plus. Puis largue les amarres.':'Touche le traceur pour choisir où aller. Les zones de la VHF, ce ne sont que des pistes.';
  else if(ph==='transit')t=legal(B.x,B.y)?'On fait route. On pourra pêcher dès qu’on sera au large.':'On peut pêcher ici : broumé (on s’arrête) ou chasses (on traîne des leurres).';
  else if(ph==='idle')t='Broumé ici, ou on met les leurres à la traîne pour chercher les chasses ?';
  else if(ph==='hunt')t='On traîne les leurres et on ouvre l’œil. Dès qu’on voit des oiseaux plonger, on y va tout seul !';
  else if(ph==='chase')t='Des oiseaux ! On fonce, et on ralentit en arrivant pour ne pas effrayer le banc.';
  else if(ph==='return')t=G.kept.length?'Cap sur Sète. Le restaurant partenaire viendra chercher les thons à quai.':'Cap sur Sète. On fera mieux la prochaine fois !';
  else t='';
  wrap(t,r[0]+fsz+26,r[1]+(portrait?30:24),r[2]-fsz-36,portrait?15:16,'600 13px Mulish,sans-serif','#E7ECFF');}

/* ================= boucle et commandes ================= */
let last=0;
function loop(ts){if(!running)return;const dt=Math.min(.05,(ts-last)/1000||0);last=ts;
  if(cv.parentElement.clientWidth&&Math.abs(cv.width/DPR-LW)>1)resize();
  try{update(dt);
  if(G){if(G.scene==='broume')drawBroume();else if(G.scene==='lancer')drawCast();else if(G.scene==='combat')drawCombat();else if(G.scene==='arrivee')drawArrivee();else{drawFPV();drawSonar();drawTip();drawPlot();drawGauges();drawCtrl();drawToast();}
    if(G.scene!=='sea'&&G.msg)drawToast2();
    if(G.fade>0){ctx.fillStyle='rgba(2,5,15,'+G.fade+')';ctx.fillRect(0,0,LW,LH);}}}catch(err){console.error(err);try{ctx.restore();}catch(e){}}
  raf=requestAnimationFrame(loop);}
function drawToast2(){const a=Math.min(1,G.msg.life*2);ctx.save();ctx.globalAlpha=a;ctx.font=fs('800 15px Mukta,sans-serif');const side=!portrait&&(G.scene==='broume'||G.scene==='lancer'),cx=side?880:LW/2,tw=Math.min(side?760:LW-60,ctx.measureText(G.msg.t).width+40),th=32*FS,ty=portrait?210:(side?76:156);
  ctx.fillStyle=G.msg.c;rr(cx-tw/2,ty,tw,th,th/2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(G.msg.t,cx,ty+th*.66,tw-24);ctx.restore();}
function ptr(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*LW/r.width,(e.clientY-r.top)*LH/r.height];}
function holdOn(){if(!G)return;if(G.scene==='broume'&&G.br)G.br.hold=true;if(G.scene==='combat'&&G.fi&&(G.fi.phase==='fight'||G.fi.phase==='hisse'))G.fi.hold=true;if(G.scene==='lancer'&&G.cast&&G.cast.st==='aim')G.cast.hold=true;}
function holdOff(){if(!G)return;if(G.br)G.br.hold=false;if(G.fi)G.fi.hold=false;if(G.cast&&G.cast.hold)castRelease();}
cv.addEventListener('pointerdown',e=>{if(!G||talk)return;e.preventDefault();const p=ptr(e);
  if(G.scene==='broume'){broumeTap(p);return;}
  if(G.scene==='lancer'){castTap(p);return;}
  if(G.scene==='combat'){combatTap();return;}
  if(G.scene==='arrivee'){if(inR(p,G.ui.skip)&&G.unl&&!G.unl.fin){G.unl.done=G.unl.n;G.unl.cur=null;G.unl.tm=2;}return;}
  if(G.phase==='end')return;const u=G.ui;
  for(let i=0;i<3;i++)if(inR(p,u.thr&&u.thr[i])){if(G.phase!=='hunt')G.thr=i;return;}
  if(inR(p,u.act)){act();return;}if(inR(p,u.alt)){alt();return;}if(inR(p,u.warp)){if(G.phase!=='plan')G.warp=G.warp===1?4:1;return;}
  if(inR(p,u.home)){goHome();return;}
  if(inR(p,mapRect())){plotClick(p2m(p[0],p[1]));return;}});
window.addEventListener('pointerup',()=>{if(running)holdOff();});
window.addEventListener('pointercancel',()=>{if(running)holdOff();});
window.addEventListener('keydown',e=>{if(!running||!G)return;if(e.code==='Escape'){cnClose();return;}if(talk)return;
  if(e.code==='Space'){e.preventDefault();if(e.repeat)return;
    if(G.scene==='broume'){const b=G.br;if(b&&b.step==='vifs')b.hold=true;else if(b&&b.bite)broumeTap([-1,-1]);return;}
    if(G.scene==='lancer'){if(G.cast&&G.cast.st==='aim')G.cast.hold=true;return;}
    if(G.scene==='combat'){combatTap();return;}
    if(G.scene==='sea')act();}});
window.addEventListener('keyup',e=>{if(running&&e.code==='Space')holdOff();});
function start(day){day=day||1;newGame(day);mapCache=null;G.scene='sea';const a=$('cn-again');if(a)a.remove();
  if(day>1){const L_=introLines();say(['<b>Jour '+day+'</b> : nouvelle journée ! Il est <b>5 h</b>, on est à quai à Sète, le vivier est vide et les caisses de sardines sont pleines.',L_[L_.length-1]],null,{last:'On y va →'});}
  else say(introLines(),null,{last:'On y va →'});}
window.cnOpen=function(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.documentElement.style.overflow='hidden';running=true;resize();start();last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);};
window.cnClose=function(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.documentElement.style.overflow='';running=false;cancelAnimationFrame(raf);talk=null;$('cn-talk').hidden=true;G=null;const a=$('cn-again');if(a)a.remove();};
window.__CN={get G(){return G},get talk(){return talk},next(){$('cn-next').click();},act,alt,plot(x,y){plotClick([x,y]);},broumeTap,castTap,castRelease,combatTap,startFight,startBroume,startCast,goHome,finish};
})();

