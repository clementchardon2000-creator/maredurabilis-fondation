
(function(){
const cv=document.getElementById('pl-cv');if(!cv)return;
const ctx=cv.getContext('2d'),modal=document.getElementById('pl-modal');
const $=id=>document.getElementById(id);
const JIMG=new Image();JIMG.src='img/5149fd17d5.svg';
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
const PEAKS=[[43.395,3.685,175,4],[43.29,3.49,115,6],[43.15,3.07,214,9],[42.52,2.46,2784,6],[42.47,2.95,1250,8],[43.78,3.81,658,4],[44.12,3.58,1567,10],[43.21,5.37,432,6],[43.75,4.85,498,8],[43.33,5.75,1148,10]].map(a=>{const p=P(a[0],a[1]);return{x:p[0],y:p[1],e:a[2],w:a[3],sd:Math.random()*9};});
const TOWNS=[['Sète',43.40,3.69,1.6,1],['Frontignan',43.445,3.76,.8,0],['Marseillan',43.33,3.55,.5,0],['Agde',43.285,3.48,1,1],['Valras',43.25,3.29,.6,0],['Gruissan',43.105,3.10,.6,1],['Port-la-Nouvelle',43.02,3.06,.6,1],['Leucate',42.91,3.05,.5,1],['Palavas',43.53,3.93,.9,1],['La Grande-Motte',43.56,4.07,1,0],['Le Grau-du-Roi',43.535,4.135,.8,1],['Saintes-Maries',43.45,4.43,.5,1]].map(a=>{const p=P(a[1],a[2]);return{n:a[0],x:p[0],y:p[1],s:a[3],lab:a[4]};});
const PHARES=[[43.397,3.699,32,5],[43.49,4.14,27,10],[43.263,3.505,19,4]].map(a=>{const p=P(a[0],a[1]);return{x:p[0],y:p[1],e:a[2],per:a[3]};});
const ZONES=[['Large de Sète',43.30,3.72],['Large de Frontignan',43.33,3.92],['Large d’Agde',43.20,3.55],['Large de Palavas',43.41,4.06]].map(a=>{const p=P(a[1],a[2]);return{n:a[0],x:p[0],y:p[1]};});
const EOL=(()=>{const p=P(43.07,3.28);return{x:p[0],y:p[1],r:1.6};})();
const PORT=[0.49,-0.25],S0=[0.49,-0.3],ENTRY=[0.49,-1.5],MX0=-38,MX1=44,MY0=-50,MY1=6;
const LIGHTS_PORT=[{x:.36,y:-.72,c:'#FF3B30',t:'#D8342A'},{x:.62,y:-.72,c:'#2EE66B',t:'#1F9E4A'}];
const JETS=[[[.36,-.72],[.12,-.6],[-.2,-.42]],[[.62,-.72],[.85,-.56],[1.05,-.3]]].map(j=>{const o=[];for(let i=0;i<j.length-1;i++){const a=j[i],b=j[i+1],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.02);for(let k=0;k<=n;k++)o.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}return o;});
function pip(x,y,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if(((a[1]>y)!=(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;}
function segD(px,py,a,b){const vx=b[0]-a[0],vy=b[1]-a[1];const t=clamp(((px-a[0])*vx+(py-a[1])*vy)/(vx*vx+vy*vy),0,1);return Math.hypot(px-a[0]-t*vx,py-a[1]-t*vy);}
function distCoast(x,y){let m=1e9;for(let i=0;i<COAST.length-1;i++){const d=segD(x,y,COAST[i],COAST[i+1]);if(d<m)m=d;}return m;}
function inLand(x,y){return pip(x,y,LAND)||pip(x,y,THAU);}
function edgeY(x){const E=EDGE,n=E.length;if(x<=E[0][0])return E[0][1]+(x-E[0][0])*(E[1][1]-E[0][1])/(E[1][0]-E[0][0]);for(let i=0;i<n-1;i++)if(x<=E[i+1][0]){const t=(x-E[i][0])/(E[i+1][0]-E[i][0]);return E[i][1]+t*(E[i+1][1]-E[i][1]);}return E[n-1][1]+(x-E[n-1][0])*(E[n-1][1]-E[n-2][1])/(E[n-1][0]-E[n-2][0]);}
function depthAt(x,y,dc){if(inLand(x,y))return -1;if(dc==null)dc=distCoast(x,y);const de=y-edgeY(x);if(de>0)return 3+197*Math.pow(dc/(dc+de),.9);return Math.min(2600,200+(-de)*140);}
function illegal(x,y){if(inLand(x,y))return'Terre ! On ne passe pas par là.';const dc=distCoast(x,y);if(dc<3)return'Bande des 3 milles : chalut interdit.';if(Math.hypot(x-EOL.x,y-EOL.y)<EOL.r)return'Parc éolien : zone fermée à la pêche.';if(depthAt(x,y,dc)>1000)return'Plus de 1 000 m de fond : chalut interdit.';return null;}
function placeName(x,y,d){let best=null,bd=3.5;for(const z of ZONES){const q=Math.hypot(x-z.x,y-z.y);if(q<bd){bd=q;best=z.n;}}if(best)return best;if(d<0)return'Terre';if(d<60)return'Petits fonds';if(d<150)return'Plateau';if(d<260)return'Accores';return'Talus et canyons';}
// coste échantillonnée pour la vue FPV
const CS=[];for(let i=0;i<COAST.length-1;i++){const a=COAST[i],b=COAST[i+1],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.12));for(let k=0;k<n;k++){const x=a[0]+(b[0]-a[0])*k/n,y=a[1]+(b[1]-a[1])*k/n;let e=7;for(const t of TOWNS){if(Math.hypot(x-t.x,y-t.y)<t.s*1.2)e=10+((CS.length*37)%11)*1.7;}CS.push({x,y,e});}}
const STARS=[];for(let i=0;i<170;i++)STARS.push({az:Math.random()*TAU,el:rnd(.02,.7),b:rnd(.3,1),s:Math.random()<.12?2:1.2});
const CLOUDS=[];for(let i=0;i<9;i++)CLOUDS.push({az:Math.random()*TAU,el:rnd(.03,.16),w:rnd(.08,.22),h:rnd(.012,.03)});


/* ================= paramètres (fictifs sauf mention) ================= */
const SPH=6,THR=[{n:'ÉCO',kn:7,lh:30},{n:'ROUTE',kn:9,lh:45},{n:'PLEIN',kn:11,lh:80}];
const SET_MIN=160,SET_LH=30,HAUL_MIN=180,HAUL_LH=25,DRIFT_LH=5,IDLE_LH=5,FUEL_EUR=.7,EYE=4;
const T_START=930,T_TRAWL=1740,T_CRIEE=1800,T_LATE=1830,T_HARD=1980,LINE_NM=16,HOOKS=800,NH=16,NB=4;
const PRICE={thon:14,espadon:10},BAIT_EUR=60;
const tod=()=>G.t%1440;

/* ================= état ================= */
function newGame(){
  G={scene:'sea',phase:'plan',t:T_START,anim:0,fade:0,fadeDir:0,ui:{},boat:{x:S0[0],y:S0[1],h:180*D2R,spd:0},dest:null,via:null,thr:1,warp:1,
    fuel:0,line:null,soakT0:0,kept:[],released:[],lost:0,baitPct:0,buoyMiss:0,alignPct:0,sonar:[],sonT:0,track:[],trackT:0,birds:[],boats:[],wind:{k:0},msg:null,dist:0,forced:false};
  G.zf=ZONES.map(()=>rnd(.6,1.3));G.radio=Math.floor(Math.random()*ZONES.length);G.zf[G.radio]=rnd(1.35,1.6);
  for(let i=0;i<3;i++)G.boats.push({x:PORT[0]+rnd(-.1,.1),y:PORT[1]+rnd(-.1,.1),h:180*D2R,spd:0,st:'dock',dep:1650+i*14,tx:rnd(-14,16),ty:rnd(-26,-14)});
}
function zoneF(x,y){let f=.7;for(let i=0;i<ZONES.length;i++){const z=ZONES[i],d=Math.hypot(x-z.x,y-z.y);f=Math.max(f,.7+(G.zf[i]-.7)*Math.exp(-d*d/14));}return f;}

/* ================= dialogues ================= */
function say(lines,onDone,labels){talk={lines,i:0,onDone,labels:labels||{}};$('pl-talk').hidden=false;showLine();}
function showLine(){const t=talk;$('pl-txt').innerHTML=t.lines[t.i];
  $('pl-dots').innerHTML=t.lines.length>1?t.lines.map((_,k)=>'<i class="'+(k===t.i?'on':'')+'"></i>').join(''):'';
  $('pl-next').textContent=t.i<t.lines.length-1?'Suivant →':(t.labels.last||'C’est parti →');
  $('pl-skip').style.display=t.lines.length>1&&t.i<t.lines.length-1?'':'none';
  const a=$('pl-again');if(a)a.style.display=t.i===t.lines.length-1?'':'none';}
$('pl-next').onclick=()=>{if(!talk)return;if(talk.i<talk.lines.length-1){talk.i++;showLine();}else{const f=talk.onDone;talk=null;$('pl-talk').hidden=true;f&&f();}};
$('pl-skip').onclick=()=>{if(!talk)return;talk.i=talk.lines.length-1;showLine();};
function toast(t,c){if(G)G.msg={t,c:c||'#0012B5',life:3.6};}
function introLines(){return[
 'Re-salut, c’est encore moi, <b>Janvier</b> ! Ce soir, pas de senne : on embarque sur un petit <b>palangrier</b> de Sète, un catamaran de 15 mètres.',
 'Une partie du <b>quota de thon rouge des senneurs</b> est reversée aux <b>petits métiers</b>, qui pêchent à l’hameçon. Ça permet aux marins de <b>travailler toute l’année</b>, et d’<b>approvisionner le marché local</b> toute l’année.',
 'Le programme : on part en fin d’après-midi <b>caler</b> la palangre, <b>environ 800 hameçons sur 30 km</b>, entre 3 et 12 milles de la côte. Toi, tu <b>boëttes</b> : une sardine sur chaque hameçon.',
 'On la laisse pêcher quelques heures, puis on la <b>vire</b> dans la nuit. Règle d’or : tout doit être levé <b>avant 5 h</b>, quand les <b>chalutiers</b> commencent à pêcher, pour ne pas se gêner. Et la <b>criée</b>, c’est à <b>6 h</b>, pour la vente du matin.',
 'Choisis ta zone sur le traceur. À la radio, un collègue dit que les thons chassent vers <b>'+ZONES[G.radio].n+'</b>. On largue !'];}

/* ================= logique en mer ================= */
function legal(x,y){if(inLand(x,y))return'Terre !';const dc=distCoast(x,y);if(dc<3)return'Trop près : moins de 3 milles de la côte.';if(dc>12)return'Trop loin : plus de 12 milles.';if(Math.hypot(x-EOL.x,y-EOL.y)<EOL.r)return'Parc éolien : zone fermée à la pêche.';return null;}
function linePath(x,y,h){const pts=[[x,y]];let a=h,len=0;for(let k=0;k<400&&len<LINE_NM;k++){let ok=false;for(const o of [0,10,-10,20,-20,35,-35,50,-50,70,-70,90,-90,120,-120,150,-150,180]){const b=a+o*D2R,nx=x+Math.sin(b)*.2,ny=y+Math.cos(b)*.2;if(!legal(nx,ny)&&!legal(x+Math.sin(b)*.8,y+Math.cos(b)*.8)){a=b;x=nx;y=ny;ok=true;break;}}if(!ok)break;len+=.2;pts.push([x,y]);}return pts;}
function arrive(){const B=G.boat;B.spd=0;G.dest=null;if(G.phase==='return'){startArrival();return;}G.phase='idle';toast(legal(B.x,B.y)?'Arrivés. '+legal(B.x,B.y):'Sur zone : on peut caler la palangre.','#0E8A72');}
function goHome(){G.dest=PORT.slice();G.phase='return';G.via=Math.hypot(G.boat.x-ENTRY[0],G.boat.y-ENTRY[1])>.4?ENTRY.slice():null;G.warp=1;}
function act(){const ph=G.phase,B=G.boat;
  if(ph==='plan'){if(G.dest){G.phase='transit';G.via=ENTRY.slice();toast('On largue les amarres !','#0E8A72');}else toast('Touche d’abord une zone sur le traceur.','#C4613A');return;}
  if((ph==='transit'||ph==='idle')&&!G.line){const w=legal(B.x,B.y);if(w){toast(w,'#C4613A');return;}startSet();return;}
  if(ph==='soak'){if(G.t-G.soakT0<60){toast('Laisse pêcher la palangre au moins une heure.','#C4613A');return;}startHaul();}}
function actLabel(){const ph=G.phase,B=G.boat;
  if(ph==='plan')return G.dest?['LARGUER LES AMARRES','LARGUER',1]:['CHOISIS UNE ZONE','ZONE ?',0];
  if((ph==='transit'||ph==='idle')&&!G.line)return legal(B.x,B.y)?['ZONE : 3 À 12 MILLES','EN ROUTE',0]:['CALER LA PALANGRE','CALER',1];
  if(ph==='soak')return G.t-G.soakT0<60?['LA PALANGRE PÊCHE…','PÊCHE…',0]:['VIRER LA PALANGRE','VIRER',1];
  if(ph==='return')return['CAP SUR LA CRIÉE','CRIÉE',0];return['…','…',0];}
function plotClick(pt){if(!['plan','transit','idle'].includes(G.phase)||G.line)return;if(inLand(pt[0],pt[1])){toast('Terre ! Choisis un point en mer.','#C4613A');return;}
  if(pt[0]<MX0||pt[0]>MX1||pt[1]<MY0||pt[1]>MY1)return;let p=pt;for(const z of ZONES)if(Math.hypot(pt[0]-z.x,pt[1]-z.y)<1.4)p=[z.x,z.y];
  G.dest=p.slice();if(G.phase!=='plan'){G.phase='transit';if(G.boat.y>-1.4&&Math.abs(G.boat.x-PORT[0])<1)G.via=ENTRY.slice();else G.via=null;}}
function update(dt){
  if(!G)return;G.anim+=dt;if(G.msg){G.msg.life-=dt;if(G.msg.life<=0)G.msg=null;}
  if(G.fadeDir){G.fade+=G.fadeDir*dt*1.8;if(G.fadeDir>0&&G.fade>=1){G.fade=1;G.fadeDir=-1;const f=G.fadeCb;G.fadeCb=null;f&&f();}else if(G.fadeDir<0&&G.fade<=0){G.fade=0;G.fadeDir=0;}}
  if(G.scene==='filage'){updSet(dt);return;}if(G.scene==='virage'){updHaul(dt);return;}if(G.scene==='arrivee'){updArr(dt);return;}
  if(talk||G.phase==='plan'||G.phase==='end'||G.phase==='docked'||G.fadeDir)return;
  const dm=dt*60/SPH*G.warp;G.t+=dm;const B=G.boat;let lh=IDLE_LH;
  if(G.phase==='transit'||G.phase==='return'){const tg=G.via||G.dest,dx=tg[0]-B.x,dy=tg[1]-B.y,dd=Math.hypot(dx,dy);turnTo(B,Math.atan2(dx,dy),Math.max(dt*40*D2R,dm*30*D2R));
    B.spd=THR[G.thr].kn;lh=THR[G.thr].lh;if(G.phase==='return'&&Math.hypot(PORT[0]-B.x,PORT[1]-B.y)<1.6){B.spd=Math.min(B.spd,5);if(!G.harbour){G.harbour=true;G.warp=1;toast('Entrée du port de Sète : on réduit l’allure.','#0E8A72');}}
    const step=B.spd*dm/60;if(dd<=step+.01){B.x=tg[0];B.y=tg[1];G.dist+=dd;if(G.via)G.via=null;else arrive();}else{B.x+=Math.sin(B.h)*step;B.y+=Math.cos(B.h)*step;G.dist+=step;}}
  else if(G.phase==='soak'){B.spd=0;lh=DRIFT_LH;B.h+=Math.sin(G.anim*.2)*.0005;}
  else B.spd=0;
  G.fuel+=lh*dm/60;
  G.trackT+=dm;if(G.trackT>=2){G.trackT=0;G.track.push([B.x,B.y]);if(G.track.length>900)G.track.shift();}
  G.sonT+=dm;if(G.sonT>=1){G.sonT=0;const d=depthAt(B.x,B.y);G.sonar.push({d:Math.max(5,d),f:clamp(zoneF(B.x,B.y)*.35+rnd(-.1,.1),0,1.2),sd:Math.random()*999,tr:false});if(G.sonar.length>170)G.sonar.shift();}
  updBoats(dm);
  if(G.phase==='soak'&&G.t>=T_TRAWL-30&&!G.warnT){G.warnT=true;toast('Il est tard : vire vite, les chalutiers arrivent à 5 h !','#C4613A');}
  if(G.t>=T_HARD&&G.phase!=='end')finish(true);}
function updBoats(dm){for(const b of G.boats){if(b.st==='dock'){if(G.t>=b.dep)b.st='go';continue;}const dx=b.tx-b.x,dy=b.ty-b.y;
  if(b.st==='go'){turnTo(b,Math.atan2(dx,dy),dm*20*D2R);if(Math.hypot(dx,dy)<.5)b.st='trawl';}b.spd=b.st==='go'?10:4;b.x+=Math.sin(b.h)*b.spd*dm/60;b.y+=Math.cos(b.h)*b.spd*dm/60;}}

/* ================= calage : on boëtte et on file la palangre ================= */
function startSet(){const B=G.boat;G.phase='setting';G.dest=null;G.via=null;B.spd=0;G.line=linePath(B.x,B.y,B.h);G.setT0=G.t;
  const seq=[];for(let i=0;i<NH;i++){seq.push('h');if((i+1)%4===0)seq.push('b');}
  const tang=[];while(tang.length<2){const k=Math.floor(rnd(4,seq.length-3));if(!tang.includes(k))tang.push(k);}
  G.fl={t:0,seq,sp:0,items:[],next:.6,baited:0,hooks:0,buoys:0,buoysOK:0,tangIdx:tang,tang:null,lostH:0,done:false,shake:0};
  G.fadeDir=1;G.fadeCb=()=>{G.scene='filage';};toast('On cale la palangre !','#0E8A72');}
function flTap(){const F=G.fl;if(!F||F.done)return;
  if(F.tang){F.tang=null;toast('Démêlé ! Ça repart.','#0E8A72');return;}
  const it=F.items.find(i=>!i.res&&i.p>=.4&&i.p<=.66);if(it){it.res='ok';if(it.k==='h')F.baited++;else F.buoysOK++;return;}F.shake=.25;}
function updSet(dt){const F=G.fl;if(!F||talk||G.fadeDir>0||F.done)return;F.t+=dt;if(F.shake>0)F.shake-=dt;
  if(F.tang){F.tang.t+=dt;if(F.tang.t>2.2){F.tang=null;F.lostH+=2;G.t+=10;toast('Trop tard : deux hameçons perdus dans l’emmêlage.','#C4613A');}return;}
  F.next-=dt;if(F.next<=0&&F.sp<F.seq.length){if(F.tangIdx.includes(F.sp)&&!F.tangDone?.[F.sp]){F.tangDone=F.tangDone||{};F.tangDone[F.sp]=1;F.tang={t:0};return;}
    F.items.push({k:F.seq[F.sp],p:0,res:null});F.sp++;F.next=.78;}
  for(const it of F.items){it.p+=dt/1.5;if(!it.res&&it.p>.66){it.res='miss';if(it.k==='b')G.buoyMiss++;}if(it.k==='h'&&it.p>=1&&!it.cnt){it.cnt=1;F.hooks++;}if(it.k==='b'&&it.p>=1&&!it.cnt){it.cnt=1;F.buoys++;}}
  F.items=F.items.filter(i=>i.p<1.6);
  const prog=F.sp/F.seq.length;G.t=G.setT0+SET_MIN*prog+(F.lostH/2)*10;G.fuel=G.fuel;
  if(F.sp>=F.seq.length&&F.items.every(i=>i.p>=1)){F.done=true;G.fuel+=SET_LH*SET_MIN/60;G.t=Math.max(G.t,G.setT0+SET_MIN);const e=G.line[G.line.length-1];G.boat.x=e[0];G.boat.y=e[1];
    const hk=Math.max(0,F.baited-F.lostH);G.baitPct=hk/NH;const pct=Math.round(G.baitPct*100);
    say(['<b>Palangre calée</b> à '+clk(G.t)+' : 30 km de ligne, 800 hameçons. <div class="pl-sum"><div><b>'+pct+' %</b><span>hameçons boëttés</span></div><div><b>'+F.buoysOK+' / '+NB+'</b><span>bouées bien posées</span></div><div><b>'+nf(G.fuel)+' L</b><span>de gasoil depuis Sète</span></div><div><b>'+(G.baitPct>.8?'Top':'À revoir')+'</b><span>'+(G.baitPct>.8?'du beau travail':'un hameçon sans sardine ne pêche pas')+'</span></div></div>Maintenant, on la laisse <b>pêcher</b>. Plus on attend, plus il y a de chances qu’un thon morde… mais tout doit être levé <b>avant 5 h</b>, et le virage prend environ <b>3 heures</b>.'],
      ()=>{G.fadeDir=1;G.fadeCb=()=>{G.scene='sea';G.phase='soak';G.soakT0=G.t;G.warp=1;};},{last:'Laisser pêcher →'});}}
function sardine(x,y,s,a){ctx.save();ctx.translate(x,y);ctx.rotate(a||0);ctx.scale(s,s);ctx.fillStyle='#C9D6E3';ctx.beginPath();ctx.ellipse(0,0,14,4.2,0,0,TAU);ctx.fill();ctx.fillStyle='#4A6A8C';ctx.beginPath();ctx.ellipse(0,-1.6,13,1.8,0,0,TAU);ctx.fill();ctx.fillStyle='#C9D6E3';ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(-19,-5);ctx.lineTo(-19,5);ctx.closePath();ctx.fill();ctx.restore();}
function hookIcon(x,y,s,col){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle=col||'#D8DEE6';ctx.lineWidth=2.4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(0,4);ctx.arc(-5,4,5,0,Math.PI*.95);ctx.stroke();ctx.restore();}
function buoyIcon(x,y,s,lit){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.strokeStyle='#2A2F38';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,-34);ctx.stroke();ctx.fillStyle='#FF7A1A';ctx.beginPath();ctx.arc(0,0,11,0,TAU);ctx.fill();ctx.fillStyle='#FFE14D';ctx.beginPath();ctx.moveTo(0,-34);ctx.lineTo(14,-29);ctx.lineTo(0,-24);ctx.fill();
  if(lit){const g=ctx.createRadialGradient(0,-36,1,0,-36,16);g.addColorStop(0,'rgba(255,245,180,.95)');g.addColorStop(1,'rgba(255,245,180,0)');ctx.fillStyle=g;ctx.fillRect(-16,-52,32,32);}ctx.restore();}
function flPos(p){// tub rim -> boëtte -> rouleau arrière
  if(p<.5){const k=p/.5;return[380+(560-380)*k,560+(500-560)*k-Math.sin(k*Math.PI)*40];}const k=Math.min(1,(p-.5)/.5);return[560+(640-560)*k,500+(452-500)*k];}
function drawSet(){const F=G.fl;if(!F)return;const tt=G.anim,e=sunPos(tod()).el,[top,hor]=kf(SKY,e),[sh,sb]=kf(SEA,e);
  const sc=portrait?.8:1,cxo=portrait?110:0,oy=portrait?(LH-720*.8)/2-30:0;
  let g=ctx.createLinearGradient(0,0,0,LH*.45);g.addColorStop(0,S(top));g.addColorStop(1,S(hor));ctx.fillStyle=g;ctx.fillRect(0,0,LW,LH);if(portrait){ctx.fillStyle='#4A525E';ctx.fillRect(0,LH*.62,LW,LH*.38);}
  const fs0=FS;FS=1;ctx.save();ctx.translate(0,oy);ctx.scale(sc,sc);ctx.translate(-cxo,0);const sh_=F.shake>0?Math.sin(tt*80)*6:0;ctx.translate(sh_,0);
  const HY=250;g=ctx.createLinearGradient(0,-400,0,HY);g.addColorStop(0,S(top));g.addColorStop(1,S(hor));ctx.fillStyle=g;ctx.fillRect(-400,-400,2200,HY+400);
  if(e>-3){const sx=1000,sy=HY-Math.max(-10,e*8);const sg=ctx.createRadialGradient(sx,sy,6,sx,sy,150);sg.addColorStop(0,'rgba(255,220,160,.9)');sg.addColorStop(1,'rgba(255,190,120,0)');ctx.fillStyle=sg;ctx.fillRect(sx-160,sy-160,320,320);ctx.fillStyle='#FFE0A8';ctx.beginPath();ctx.arc(sx,sy,18,0,TAU);ctx.fill();}
  g=ctx.createLinearGradient(0,HY,0,480);g.addColorStop(0,S(sh));g.addColorStop(1,S(sb));ctx.fillStyle=g;ctx.fillRect(-400,HY,2200,420);
  for(let i=0;i<40;i++){const x=(i*173+tt*10)%1700-200,y=HY+6+(i*37)%200;ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+8,y-3,x+16+y*.02,y);ctx.stroke();}
  for(let i=0;i<60;i++){const k=(i*37%100)/100,y=HY+4+Math.pow(k,1.6)*200,sp=8+Math.pow(k,1.6)*110,x=640+(((i*53)%100)/100-.5)*2*sp+Math.sin(tt*2+i)*3;ctx.fillStyle='rgba(255,255,255,'+(.12+.22*k)+')';ctx.beginPath();ctx.ellipse(x,y,1.5+k*9,.8+k*2.4,0,0,TAU);ctx.fill();}
  // la ligne qui part dans le sillage, et les bouées déjà posées
  ctx.strokeStyle='rgba(20,24,32,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(640,452);for(let k=1;k<=20;k++){const y=452-(452-HY-4)*k/20,x=640+Math.sin(tt*1.2+k*.5)*k*.8;ctx.lineTo(x,y);}ctx.stroke();
  for(let i=0;i<F.buoys;i++){const k=clamp((F.buoys-i)*.18,0,.95),y=452-(452-HY-4)*k,s=1.1-k;buoyIcon(640+Math.sin(tt+i)*4,y,s*.9,e<-2);}
  // pont arrière du catamaran
  ctx.fillStyle='#4A525E';ctx.beginPath();ctx.moveTo(430,452);ctx.lineTo(850,452);ctx.lineTo(1500,760);ctx.lineTo(-220,760);ctx.closePath();ctx.fill();
  ctx.fillStyle='#EEF2F6';ctx.beginPath();ctx.moveTo(430,452);ctx.lineTo(430,428);ctx.lineTo(-220,610);ctx.lineTo(-220,760);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(850,452);ctx.lineTo(850,428);ctx.lineTo(1500,610);ctx.lineTo(1500,760);ctx.closePath();ctx.fill();
  ctx.fillStyle='#0012B5';ctx.beginPath();ctx.moveTo(430,428);ctx.lineTo(430,420);ctx.lineTo(-220,596);ctx.lineTo(-220,610);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(850,428);ctx.lineTo(850,420);ctx.lineTo(1500,596);ctx.lineTo(1500,610);ctx.closePath();ctx.fill();
  ctx.fillStyle='#8E99A5';rr(606,440,68,22,10);ctx.fill();ctx.fillStyle='#5B6272';ctx.fillRect(612,446,56,10);
  // bac à palangre (hameçons sur le bord) et seau de sardines
  ctx.fillStyle='#2F6FA8';ctx.beginPath();ctx.ellipse(300,600,190,78,0,0,TAU);ctx.fill();ctx.fillStyle='#173C5E';ctx.beginPath();ctx.ellipse(300,592,168,62,0,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(220,230,240,.35)';ctx.lineWidth=1.2;for(let i=0;i<9;i++){ctx.beginPath();ctx.ellipse(300,596,40+i*14,14+i*5,0,0,TAU);ctx.stroke();}
  const left=Math.max(0,NH-F.items.filter(i=>i.k==='h').length-(F.sp-F.items.length));for(let i=0;i<Math.round(28*(1-F.sp/F.seq.length));i++){const a=Math.PI*1.08+i*(.85*Math.PI/28);hookIcon(300+Math.cos(a)*186,590+Math.sin(a)*72,.9,'#D8DEE6');}
  ctx.fillStyle='#E0E6EE';ctx.beginPath();ctx.moveTo(900,560);ctx.lineTo(1100,560);ctx.lineTo(1080,700);ctx.lineTo(920,700);ctx.closePath();ctx.fill();ctx.fillStyle='#9AA7B6';ctx.fillRect(900,556,200,8);
  for(let i=0;i<14;i++)sardine(930+(i*37)%150,580+((i*23)%40),.9,(i%3-1)*.4);
  // zone de boëtte
  const zp=flPos(.53),pul=.5+.5*Math.sin(tt*5);ctx.strokeStyle='rgba(0,255,255,'+(.6+.4*pul)+')';ctx.lineWidth=4;ctx.beginPath();ctx.arc(zp[0],zp[1],44,0,TAU);ctx.stroke();ctx.fillStyle='rgba(0,255,255,.10)';ctx.fill();
  ctx.fillStyle='rgba(5,10,42,.7)';rr(zp[0]-52,zp[1]+50,104,22,11);ctx.fill();ctx.font='800 12px Mukta,sans-serif';ctx.fillStyle='#00FFFF';ctx.textAlign='center';ctx.fillText('BOËTTE',zp[0],zp[1]+66);
  // hameçons et bouées en route
  for(const it of F.items){const p=flPos(Math.min(1,it.p));if(it.p>=1){if(it.k==='b')continue;const k=Math.min(1,(it.p-1)/.6);hookIcon(640,452+k*30,1-k*.6,'#D8DEE6');continue;}
    if(it.k==='h'){hookIcon(p[0],p[1],1.4,it.res==='miss'?'#FF6B5A':'#E9EEF3');if(it.res==='ok')sardine(p[0]-4,p[1]+10,1,1.3);}else buoyIcon(p[0],p[1]+10,1.2,false);}
  // emmêlage
  if(F.tang){const k=F.tang.t/2.2;ctx.strokeStyle='#FF4D3D';ctx.lineWidth=3;for(let i=0;i<9;i++){ctx.beginPath();ctx.ellipse(380+Math.sin(i*2.1)*18,560+Math.cos(i*1.7)*12,24+i*2,10+i,i,0,TAU);ctx.stroke();}
    ctx.strokeStyle='#FFE14D';ctx.lineWidth=6;ctx.beginPath();ctx.arc(380,560,56,-Math.PI/2,-Math.PI/2+TAU*(1-k));ctx.stroke();}
  person(760,760,portrait?250:290,'#FF7A1A',true,tt);
  ctx.restore();FS=fs0;
  // HUD
  ctx.fillStyle='rgba(5,10,42,.8)';rr(16,16,portrait?560:420,portrait?128:88,14);ctx.fill();
  txt('CALAGE · '+clk(G.t),30,portrait?50:40,'800 14px Mukta,sans-serif','#FFE9A8');txt('Hameçons boëttés : '+nf(F.baited*HOOKS/NH)+' / '+nf(HOOKS),30,portrait?86:64,'800 17px Mukta,sans-serif','#00FFFF');
  txt('Bouées : '+F.buoysOK+' / '+NB+' · palangre filée : '+Math.round(30*F.sp/F.seq.length)+' / 30 km',30,portrait?116:84,'700 12px Mukta,sans-serif','#E7ECFF');
  const msg=F.tang?'Ça s’emmêle au bord du bac ! Touche vite pour démêler':F.sp<3?'Touche quand l’hameçon (ou la bouée) passe dans le cercle':'Une sardine par hameçon, et on jette les bouées au bon moment';
  ctx.font=fs('800 17px Mukta,sans-serif');const tw=Math.min(LW-40,ctx.measureText(msg).width+44),th=36*FS,ty=portrait?150:108;ctx.fillStyle=F.tang?'#C4613A':'#0E8A72';rr(LW/2-tw/2,ty,tw,th,th/2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(msg,LW/2,ty+th*.66,tw-24);}

/* ================= virage : on remonte la palangre, et parfois un thon ================= */
function startHaul(){G.phase='hauling';G.boat.spd=0;const soak=G.t-G.soakT0,E=.8+6.2*clamp(G.baitPct,0,1)*(1-.08*G.buoyMiss)*zoneF(G.boat.x,G.boat.y)*(1-Math.exp(-soak/170));
  const q=E/7;const n=clamp(Math.round(8+16*q+rnd(-2,2)),4,32),P=Math.min(n,Math.random()<.5?5:6),fish=[],ks=[];
  for(let j=0;j<P;j++){let k=clamp(Math.round((j+.5)*(NH-1)/P+rnd(-.7,.7)),1,NH-1);while(ks.includes(k))k=k<NH-1?k+1:1;ks.push(k);const esp=Math.random()<.12;fish.push({k,sp:esp?'espadon':'thon',w:esp?Math.round(rnd(20,55)):Math.round(Math.min(140,12+18*-Math.log(1-Math.random()*.97)))});}
  for(let j=P;j<n;j++){const esp=Math.random()<.12;fish.push({auto:1,pos:rnd(.3,NH-.2),sp:esp?'espadon':'thon',w:esp?Math.round(rnd(15,50)):Math.round(Math.min(140,8+15*-Math.log(1-Math.random()*.995)))});}
  G.vr={t:0,sp:0,items:[],next:.8,placed:0,aligned:0,fish,floats:[],fight:null,hold:false,done:false,t0:G.t,lastLand:null};
  G.fadeDir=1;G.fadeCb=()=>{G.scene='virage';};toast('On vire la palangre !','#0E8A72');}
const RIM={x0:330,x1:800,y:548};
function slotX(i){return RIM.x1-(i+.5)*(RIM.x1-RIM.x0)/NH;}
function hkPos(p,i){// vire-ligne -> bord du bac -> le long du bord
  if(p<.35){const k=p/.35;return[1080+(810-1080)*k,330+(RIM.y-330)*k];}const k=(p-.35)/.65;return[810-(810-300)*k,RIM.y];}
function vrTap(){const V=G.vr;if(!V||V.done)return;const Fi=V.fight;
  if(Fi){if(Fi.phase==='gaffe'&&Fi.cool<=0){if(gaffeOK(Fi)){Fi.phase='hisse';Fi.p=0;toast('Gaffé ! Maintenant, hisse-le à bord !','#0E8A72');}else{Fi.miss++;Fi.splash=.7;Fi.cool=.5;if(Fi.miss>=3){Fi.phase='lost';Fi.at=0;G.lost++;toast('Trois coups dans l’eau : le thon se décroche…','#C4613A');}else toast('Raté ! Attends que la houle le soulève ('+(3-Fi.miss)+' essai'+(3-Fi.miss>1?'s':'')+')','#C4613A');}}return;}
  const it=V.items.find(i=>!i.res);if(!it||it.p<.35)return;const x=hkPos(it.p)[0],sx=slotX(it.slot);it.res=Math.abs(x-sx)<28?'ok':'bad';it.px=Math.abs(x-sx)<28?sx:x;V.placed++;if(it.res==='ok')V.aligned++;}
function landFish(Fi,crew){const V=G.vr;if(!crew)G.mine=(G.mine||0)+1;const f={sp:Fi.sp,w:Fi.w};const small=f.sp==='thon'&&f.w<8;if(small)G.released.push(f);else G.kept.push(f);
  if(crew){V.floats.push({t:0,txt:small?'Thon de '+f.w+' kg relâché (< 8 kg)':'+1 '+(f.sp==='thon'?'thon':'espadon')+' · '+f.w+' kg',c:small?'#FF9A7A':'#3BF0A0'});return;}
  V.lastLand=small?{t:0,txt:'Thon de '+f.w+' kg : sous la taille minimale (8 kg). On le relâche.',c:'#C4613A'}:{t:0,txt:(f.sp==='thon'?'Thon rouge':'Espadon')+' de '+f.w+' kg à bord !',c:'#0E8A72'};}
const GAFFE_X=640,GAFFE_W=70;
function gaffeY(Fi){return 560+Math.sin(Fi.ph)*45;}
function gaffeOK(Fi){return gaffeY(Fi)<532;}
function updHaul(dt){const V=G.vr;if(!V||talk||G.fadeDir>0||V.done)return;V.t+=dt;if(V.lastLand){V.lastLand.t+=dt;if(V.lastLand.t>3)V.lastLand=null;}
  const Fi=V.fight;
  if(Fi){V.extra=(V.extra||0)+dt*1.4;G.t=V.t0+HAUL_MIN*V.sp/NH+V.extra;
    if(Fi.phase==='fight'){const hold=V.hold;
      if(Fi.surge>0){Fi.surge-=dt;if(hold){Fi.D+=26*dt;Fi.over+=dt;if(Fi.over>1.1){Fi.phase='lost';Fi.at=0;G.lost++;toast('Tu as tiré pendant qu’il fonçait : l’hameçon s’arrache…','#C4613A');}}else Fi.D+=14*dt;if(Fi.surge<=0){Fi.over=0;Fi.nextS=rnd(1.8,3.2);}}
      else{Fi.nextS-=dt;if(Fi.nextS<=0&&Fi.D>8){Fi.surge=rnd(.9,1.4);}Fi.D+=(hold?-(30-Fi.w*.07):2.5)*dt;}
      Fi.D=clamp(Fi.D,0,Fi.D0+20);Fi.T=hold?(Fi.surge>0?100:55):(Fi.surge>0?45:15);
      if(Fi.phase==='fight'&&Fi.D<=0){Fi.phase='gaffe';Fi.ph=rnd(0,TAU);Fi.miss=0;Fi.cool=.6;toast('Il est le long du bord ! Prends la gaffe','#FF7A1A');}}
    else if(Fi.phase==='gaffe'){Fi.ph+=dt*(2.3+Fi.miss*.15);Fi.cool-=dt;if(Fi.splash>0)Fi.splash-=dt;}
    else if(Fi.phase==='hisse'){Fi.p+=V.hold?dt/(1+Fi.w/80):-dt*.3;Fi.p=Math.max(0,Fi.p);if(Fi.p>=1){Fi.phase='aboard';Fi.at=0;}}
    else{Fi.at+=dt;if(Fi.at>1.4){if(Fi.phase==='aboard')landFish(Fi);V.fight=null;V.next=.6;}}
    return;}
  V.next-=dt;if(V.next<=0&&V.sp<NH){const f=V.fish.find(x=>!x.auto&&x.k===V.sp&&!x.used);if(f){f.used=1;V.fight={w:f.w,sp:f.sp,D:45+f.w*.2,D0:45+f.w*.2,T:15,nextS:1e9,surge:0,phase:'fight',over:0,ph:0,miss:0,p:0,at:0,splash:0,cool:0};V.hold=false;toast('Du poids sur la ligne ! Le bateau ralentit, on file au bord.','#FF7A1A');if(!G.deadMsg){G.deadMsg=1;say(['Du poids sur la ligne : un <b>thon</b> ! À la palangre, il remonte <b>déjà mort</b> : un thon respire en nageant, et accroché à l’hameçon il ne peut plus nager. On vire la ligne doucement, puis on le monte à bord à la <b>gaffe</b>.'],null,{last:'On y va →'});}return;}
    V.items.push({p:0,res:null,slot:V.sp});V.sp++;V.next=.95;}
  for(const f of V.fish)if(f.auto&&!f.used&&f.pos<V.sp){f.used=1;landFish(f,true);}
  for(const fl of V.floats)fl.t+=dt;V.floats=V.floats.filter(fl=>fl.t<2.4);
  for(const it of V.items){it.p+=dt/2.8;if(!it.res&&it.p>=1){it.res='bad';it.px=300;V.placed++;}}
  G.t=V.t0+HAUL_MIN*Math.min(NH,V.sp+(V.sp<NH?clamp(1-V.next/.95,0,1):0))/NH+(V.extra||0);
  if(G.t>=T_TRAWL&&!G.forced){G.forced=true;const left=NH-V.sp;for(const f of V.fish)if(!f.used){f.used=1;G.lost++;}V.sp=NH;for(let i=0;i<left;i++){V.placed++;}V.items.forEach(i=>{if(!i.res){i.res='bad';i.px=300;}});
    say(['<b>5 h !</b> Les chalutiers commencent à pêcher : on lève tout à toute vitesse, sans prendre le temps de ranger. Les poissons encore sur les hameçons se décrochent… La prochaine fois, on vire plus tôt !'],null,{last:'Compris →'});}
  if(V.sp>=NH&&V.items.every(i=>i.res)&&!V.done){V.done=true;G.fuel+=HAUL_LH*(G.t-V.t0)/60;G.alignPct=V.placed?V.aligned/V.placed:0;const kg=G.kept.reduce((a,f)=>a+f.w,0);
    say(['<b>Palangre levée</b> à '+clk(G.t)+'. <div class="pl-sum"><div><b>'+G.kept.length+'</b><span>poisson'+(G.kept.length>1?'s':'')+' à bord · '+kg+' kg</span></div><div><b>'+(G.mine||0)+'</b><span>remonté'+((G.mine||0)>1?'s':'')+' par toi</span></div><div><b>'+G.lost+'</b><span>perdu'+(G.lost>1?'s':'')+'</span></div><div><b>'+Math.round(G.alignPct*100)+' %</b><span>hameçons bien alignés</span></div></div>'+(G.forced?'On a débordé sur l’heure des chalutiers. ':'Tout est levé avant 5 h, les chalutiers ont la place. ')+'Cap sur Sète : la <b>criée</b> ouvre à <b>6 h</b>.'],
      ()=>{G.fadeDir=1;G.fadeCb=()=>{G.scene='sea';goHome();};},{last:'Cap sur la criée →'});}}
function tunaSide(x,y,s,flip,tt,esp){ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.scale(s,s);const w=Math.sin(tt*9)*.12;
  ctx.fillStyle=esp?'#3B4A63':'#0E2A55';ctx.beginPath();ctx.moveTo(46,0);ctx.quadraticCurveTo(20,-18,-30,-6);ctx.lineTo(-40,0);ctx.lineTo(-30,6);ctx.quadraticCurveTo(20,18,46,0);ctx.fill();
  if(esp){ctx.beginPath();ctx.moveTo(44,-2);ctx.lineTo(96,0);ctx.lineTo(44,2);ctx.fill();}
  ctx.fillStyle='#C9D8E8';ctx.beginPath();ctx.moveTo(44,2);ctx.quadraticCurveTo(18,15,-30,5);ctx.lineTo(-30,1);ctx.quadraticCurveTo(10,6,44,2);ctx.fill();
  ctx.fillStyle=esp?'#3B4A63':'#0E2A55';ctx.save();ctx.translate(-38,0);ctx.rotate(w);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-12,-16);ctx.lineTo(-6,0);ctx.lineTo(-12,16);ctx.closePath();ctx.fill();ctx.restore();
  ctx.beginPath();ctx.moveTo(8,-12);ctx.lineTo(-2,-24);ctx.lineTo(-6,-10);ctx.fill();if(!esp){ctx.fillStyle='#F2C230';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-10-i*5,-6);ctx.lineTo(-13-i*5,-10);ctx.lineTo(-15-i*5,-5);ctx.fill();ctx.beginPath();ctx.moveTo(-10-i*5,6);ctx.lineTo(-13-i*5,10);ctx.lineTo(-15-i*5,5);ctx.fill();}}
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(34,-3,2.4,0,TAU);ctx.fill();ctx.fillStyle='#0A0A1F';ctx.beginPath();ctx.arc(34.5,-3,1.2,0,TAU);ctx.fill();ctx.restore();}
/* --- au bord : remonter le thon, le gaffer, le hisser --- */
function drawFight(){const V=G.vr,Fi=V.fight,tt=G.anim,esp=Fi.sp==='espadon';
  const sc=portrait?.8:1,cxo=portrait?190:0,oy=portrait?LH-190-640*.8:0,SY=portrait?-800:170;
  ctx.fillStyle='#030817';ctx.fillRect(0,0,LW,LH);
  const fs0=FS;FS=1;ctx.save();ctx.translate(0,oy);ctx.scale(sc,sc);ctx.translate(-cxo,0);
  if(!portrait)for(let i=0;i<70;i++){const x=(i*211)%1500-100,y=(i*97)%150;ctx.fillStyle='rgba(255,255,255,'+(.2+.35*Math.abs(Math.sin(tt*.7+i)))+')';ctx.fillRect(x,y,1.5,1.5);}
  let g=ctx.createLinearGradient(0,SY,0,720);g.addColorStop(0,'#08162E');g.addColorStop(1,'#0B2A4A');ctx.fillStyle=g;ctx.fillRect(-300,SY,1900,900-SY);
  // lumière du pont sur l'eau, le long de la coque
  const lg=ctx.createRadialGradient(640,700,20,640,700,560);lg.addColorStop(0,'rgba(90,200,220,.38)');lg.addColorStop(1,'rgba(90,200,220,0)');ctx.fillStyle=lg;ctx.fillRect(-300,170,1900,700);
  for(let i=0;i<(portrait?70:46);i++){const k=(i*37%100)/100,y=(portrait?-500:180)+Math.pow(k,1.4)*(portrait?1160:480),x=((i*173+tt*(12+k*30))%1700)-200,w=10+k*40;ctx.strokeStyle='rgba(190,225,255,'+(.08+.18*k)+')';ctx.lineWidth=1+k*1.6;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+w/2,y-3-k*4,x+w,y);ctx.stroke();}
  // le poisson
  let fx,fy,fs_,al=1,flip=false,rot=0;const size=.8+Fi.w/110;
  if(Fi.phase==='fight'||Fi.phase==='lost'&&Fi.D>0){const q=clamp(1-Fi.D/(Fi.D0+10),0,1);fx=520+q*140+Math.sin(tt*.4)*30*(1-q);fy=260+q*290;fs_=(.45+q*1.4)*size;al=.25+.6*q;rot=-.55+q*.25+Math.sin(tt*.9)*.05;}
  else if(Fi.phase==='gaffe'||Fi.phase==='lost'){fx=GAFFE_X-10+Math.sin(tt*.5)*12;fy=gaffeY(Fi);fs_=2*size;al=1;rot=-.18+Math.cos(Fi.ph)*.08;}
  else if(Fi.phase==='hisse'){fx=GAFFE_X;fy=525-Fi.p*150;fs_=2*size;rot=-.2-.3*Fi.p;}
  else{const k=Math.min(1,Fi.at/.9);fx=GAFFE_X+k*80;fy=395+k*420-Math.sin(k*Math.PI)*90;fs_=2*size;rot=-.35+k*.9;}
  if(Fi.phase==='lost'){al*=Math.max(0,1-Fi.at/1.2);fy+=Fi.at*60;}
  const hx=fx+(flip?-1:1)*Math.cos(rot)*46*fs_,hy=fy+Math.sin(rot)*46*fs_*(flip?-1:1);
  // la ligne : du rouleau sur le pavois jusqu'à la gueule
  if(Fi.phase!=='aboard'){ctx.strokeStyle=Fi.surge>0&&Fi.phase==='fight'?'#FF4D3D':'#D8E2EC';ctx.lineWidth=Fi.phase==='fight'?2.4:1.6;ctx.beginPath();ctx.moveTo(900,640);ctx.quadraticCurveTo((900+hx)/2,Math.max(640,hy)-(Fi.phase==='fight'&&V.hold?0:30),hx,hy);ctx.stroke();}
  ctx.save();ctx.globalAlpha=al;ctx.translate(fx,fy);ctx.rotate(rot);if(Fi.phase==='fight'&&Fi.D>12){ctx.filter='blur('+Math.round(Fi.D/28)+'px)';}tunaSide(0,0,fs_,flip,0,esp);ctx.filter='none';ctx.restore();
  if(Fi.phase==='gaffe'&&(Fi.splash>0||Math.cos(Fi.ph)>.7)||Fi.phase==='hisse'&&V.hold){ctx.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<14;i++){const a=i*.45+tt*7,r=30+((i*13)%40);ctx.beginPath();ctx.arc(fx+Math.cos(a)*r*1.6,Math.max(fy,560)+8+Math.sin(a)*8-(Fi.splash>0?Math.abs(Math.sin(a*3))*30:0),2+(i%3),0,TAU);ctx.fill();}}
  // la cible de la gaffe
  if(Fi.phase==='gaffe'){const ok=gaffeOK(Fi),pul=.5+.5*Math.sin(tt*8);ctx.strokeStyle=ok?'rgba(59,240,160,'+(.7+.3*pul)+')':'rgba(255,255,255,.35)';ctx.lineWidth=ok?5:3;ctx.setLineDash(ok?[]:[10,8]);ctx.beginPath();ctx.ellipse(GAFFE_X,505,GAFFE_W+60,34,0,0,TAU);ctx.stroke();ctx.setLineDash([]);}
  // la gaffe (la perche)
  const tip=Fi.phase==='gaffe'?[GAFFE_X+18,470+Math.sin(tt*2)*6]:Fi.phase==='hisse'?[GAFFE_X+20,fy-10]:Fi.phase==='aboard'?[fx+20,fy-10]:[1010,560];
  // pavois du catamaran, rouleau, main courante
  ctx.fillStyle='#EEF2F6';ctx.beginPath();ctx.moveTo(-300,640);ctx.lineTo(1600,640);ctx.lineTo(1600,1300);ctx.lineTo(-300,1300);ctx.fill();ctx.fillStyle='#0012B5';ctx.fillRect(-300,662,1900,8);ctx.fillStyle='#C4613A';ctx.fillRect(-300,700,1900,4);
  ctx.fillStyle='#8E99A5';rr(870,626,60,26,12);ctx.fill();ctx.fillStyle='#5B6272';ctx.fillRect(880,634,40,10);
  ctx.strokeStyle='#C9CFD8';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-300,600);ctx.lineTo(560,600);ctx.moveTo(730,600);ctx.lineTo(1600,600);ctx.stroke();for(const x of [100,380,560,730,1100,1380]){ctx.beginPath();ctx.moveTo(x,600);ctx.lineTo(x,640);ctx.stroke();}
  // mains qui tiennent la gaffe
  const base=portrait?[1010,1000]:[1170,800];ctx.strokeStyle='#C8CFD8';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(base[0],base[1]);ctx.lineTo(tip[0],tip[1]);ctx.stroke();ctx.strokeStyle='#8E99A5';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(tip[0],tip[1]);ctx.lineTo(tip[0]-6,tip[1]+14);ctx.arc(tip[0]+4,tip[1]+16,10,Math.PI,Math.PI*.1,true);ctx.stroke();ctx.lineCap='butt';
  const arm=(x0,y0,x1,y1)=>{ctx.strokeStyle='#FF7A1A';ctx.lineWidth=40;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.fillStyle='#FFC247';ctx.beginPath();ctx.arc(x1,y1,17,0,TAU);ctx.fill();ctx.lineCap='butt';};
  if(Fi.phase==='fight'){const pull=V.hold&&Fi.surge<=0?Math.sin(tt*9)*10:0;arm(740,portrait?1000:800,858,650+pull);arm(1070,portrait?1000:800,944,652-pull);}
  else if(Fi.phase!=='lost'){const P=k=>[base[0]+(tip[0]-base[0])*k,base[1]+(tip[1]-base[1])*k];const a1=P(.45),a2=P(.22);arm(base[0]-170,base[1]+60,a1[0],a1[1]);arm(base[0]+110,base[1]+60,a2[0],a2[1]);}
  ctx.restore();FS=fs0;
  // HUD
  ctx.fillStyle='rgba(5,10,42,.8)';rr(16,16,portrait?560:440,portrait?128:88,14);ctx.fill();
  txt('AU BORD · '+clk(G.t),30,portrait?50:40,'800 14px Mukta,sans-serif','#FFE9A8');
  txt((esp?'Espadon':'Thon rouge')+' ~'+(Math.round(Fi.w/5)*5)+' kg',30,portrait?86:64,'800 17px Mukta,sans-serif','#00FFFF');
  txt('À bord : '+G.kept.length+' · hameçons levés : '+nf(V.sp*HOOKS/NH)+' / '+nf(HOOKS),30,portrait?116:84,'700 12px Mukta,sans-serif','#E7ECFF');
  let msg,col;
  if(Fi.phase==='fight'){msg='La ligne est lourde : maintiens appuyé pour la virer';col='#FF7A1A';}
  else if(Fi.phase==='gaffe'){msg='Touche quand la houle le soulève dans le cercle : coup de gaffe !';col='#FF7A1A';}
  else if(Fi.phase==='hisse'){msg=V.hold?'Oh hisse ! Continue…':'Maintiens appuyé pour le hisser par-dessus le bord';col='#0E8A72';}
  else if(Fi.phase==='aboard'){msg=(esp?'Espadon':'Thon')+' à bord !';col='#0E8A72';}else{msg='Perdu…';col='#C4613A';}
  ctx.font=fs('800 17px Mukta,sans-serif');const tw=Math.min(LW-40,ctx.measureText(msg).width+44),th=36*FS,ty=portrait?150:108;ctx.fillStyle=col;rr(LW/2-tw/2,ty,tw,th,th/2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(msg,LW/2,ty+th*.66,tw-24);
  // jauge : distance pendant la remontée, effort pendant le hissage
  if(Fi.phase==='fight'||Fi.phase==='hisse'){const k=Fi.phase==='fight'?clamp(1-Fi.D/Fi.D0,0,1):Fi.p,bw=portrait?560:460,bx=LW/2-bw/2,by=ty+th+(portrait?56:44);
    ctx.fillStyle='rgba(5,10,42,.85)';rr(bx-14,by-30,bw+28,64,14);ctx.fill();txt(Fi.phase==='fight'?'LIGNE REMONTÉE':'HISSAGE',bx,by-10,'800 11px Mukta,sans-serif','#E7ECFF');
    ctx.fillStyle='#1E2740';rr(bx,by,bw,16,8);ctx.fill();ctx.fillStyle=Fi.phase==='fight'?(Fi.surge>0?'#FF4D3D':'#00FFFF'):'#3BF0A0';rr(bx,by,Math.max(16,bw*k),16,8);ctx.fill();}
  if(Fi.phase==='gaffe'){for(let i=0;i<3;i++){ctx.fillStyle=i<Fi.miss?'#FF6B5A':'rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(LW/2-30+i*30,ty+th+(portrait?40:28),9,0,TAU);ctx.fill();}}}
function drawHaul(){const V=G.vr;if(!V)return;const tt=G.anim,Fi=V.fight;if(Fi){drawFight();return;}
  const sc=portrait?.8:1,cxo=portrait?260:0,oy=portrait?(LH-720*.8)/2-30:0;
  ctx.fillStyle='#030817';ctx.fillRect(0,0,LW,LH);
  const fs0=FS;FS=1;ctx.save();ctx.translate(0,oy);ctx.scale(sc,sc);ctx.translate(-cxo,0);
  for(let i=0;i<110;i++){const x=(i*211)%1400,y=(i*97)%300;ctx.fillStyle='rgba(255,255,255,'+(.2+.35*Math.abs(Math.sin(tt*.7+i)))+')';ctx.fillRect(x,y,1.5,1.5);}
  let g=ctx.createLinearGradient(0,330,0,760);g.addColorStop(0,'#0A1C3A');g.addColorStop(1,'#020814');ctx.fillStyle=g;ctx.fillRect(-200,330,1800,500);
  for(let i=0;i<30;i++){const x=(i*173+tt*14)%1500-100,y=345+(i*37)%120;ctx.strokeStyle='rgba(160,190,230,.12)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+8,y-3,x+16,y);ctx.stroke();}
  // feux de pont
  const lg=ctx.createRadialGradient(640,300,20,640,420,620);lg.addColorStop(0,'rgba(255,236,190,.28)');lg.addColorStop(1,'rgba(255,236,190,0)');ctx.fillStyle=lg;ctx.fillRect(-400,-400,2200,1400);
  // poisson sous l'eau et ligne tendue
  const hl=[1080,330];let fx=1180,fy=420;
  if(Fi&&(Fi.phase==='fight'||Fi.phase==='gaffe')){const d=Fi.phase==='gaffe'?0:Fi.D;fx=1010+d*2.2+Math.sin(tt*3)*10;fy=Fi.phase==='gaffe'?372+Math.sin(tt*9)*5:390+d*2.6+Math.sin(tt*2.2)*14;
    ctx.save();ctx.globalAlpha=Fi.phase==='gaffe'?1:clamp(1-d/120,.35,1);tunaSide(fx,fy,.9+Fi.w/180,true,tt*1.5,Fi.sp==='espadon');ctx.restore();
    if(d<25){for(let i=0;i<10;i++){const a=i*.63+tt*6;ctx.fillStyle='rgba(255,255,255,'+(.5+.4*Math.sin(tt*9+i))+')';ctx.beginPath();ctx.arc(fx+Math.cos(a)*40,356+Math.sin(a)*6,3,0,TAU);ctx.fill();}}}
  ctx.strokeStyle=Fi&&Fi.phase==='fight'&&Fi.T>80?'#FF4D3D':'#C9D2DC';ctx.lineWidth=Fi?2.6:1.8;ctx.beginPath();ctx.moveTo(hl[0],hl[1]);ctx.lineTo(fx,Fi?fy:420);ctx.stroke();
  // coque, pavois, pont
  ctx.fillStyle='#EEF2F6';ctx.fillRect(-200,340,1800,26);ctx.fillStyle='#0012B5';ctx.fillRect(-200,362,1800,6);
  ctx.fillStyle='#3E4652';ctx.fillRect(-200,368,1800,1200);ctx.strokeStyle='rgba(255,255,255,.05)';for(let y=390;y<760;y+=26){ctx.beginPath();ctx.moveTo(-200,y);ctx.lineTo(1600,y);ctx.stroke();}
  // vire-ligne
  ctx.fillStyle='#8E99A5';ctx.fillRect(1062,330,36,120);ctx.fillStyle='#C9CFD8';ctx.beginPath();ctx.arc(1080,330,30,0,TAU);ctx.fill();ctx.fillStyle='#5B6272';ctx.save();ctx.translate(1080,330);ctx.rotate(tt*(Fi?.8:4));for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.fillRect(-3,-26,6,14);}ctx.restore();
  // bac : la ligne se love dedans, les hameçons sur le bord
  ctx.strokeStyle='rgba(20,24,32,.9)';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(1080,330);ctx.quadraticCurveTo(900,420,640,590);ctx.stroke();
  ctx.fillStyle='#2F6FA8';ctx.beginPath();ctx.ellipse(565,610,270,88,0,0,TAU);ctx.fill();ctx.fillStyle='#173C5E';ctx.beginPath();ctx.ellipse(565,606,244,70,0,0,TAU);ctx.fill();
  const coil=Math.min(9,Math.floor(V.sp/4));ctx.strokeStyle='rgba(220,230,240,.4)';ctx.lineWidth=1.2;for(let i=0;i<coil;i++){ctx.beginPath();ctx.ellipse(565,612,40+i*20,12+i*6,0,0,TAU);ctx.stroke();}
  ctx.fillStyle='#D9E2EC';ctx.fillRect(RIM.x0-20,RIM.y-6,RIM.x1-RIM.x0+40,8);
  const nextSlot=V.items.find(i=>!i.res);const ns=nextSlot?nextSlot.slot:V.sp;
  for(let i=0;i<NH;i++){const x=slotX(i);ctx.fillStyle=i===ns&&!Fi?'#00FFFF':'rgba(255,255,255,.18)';ctx.fillRect(x-1.5,RIM.y-12,3,i===ns&&!Fi?16:8);}
  if(!Fi&&nextSlot){const x=slotX(ns),pul=.5+.5*Math.sin(tt*6);ctx.strokeStyle='rgba(0,255,255,'+(.5+.5*pul)+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,RIM.y,24,0,TAU);ctx.stroke();}
  for(const it of V.items){if(it.res){hookIcon(it.px,RIM.y+8,1,it.res==='ok'?'#3BF0A0':'#FF6B5A');}else{const p=hkPos(it.p);hookIcon(p[0],p[1]+8,1.3,'#E9EEF3');}}
  // matelots
  person(960,720,portrait?210:230,'#FF7A1A',false,tt);person(portrait?270:230,760,portrait?260:300,'#1C2B4A',true,tt);
  // thon à bord
  if(Fi&&Fi.phase==='aboard'){const k=Math.min(1,Fi.at/1),x=1000-k*300,y=372-Math.sin(k*Math.PI)*120+k*150;tunaSide(x,y,1+Fi.w/160,false,tt*2,Fi.sp==='espadon');}
  const nk=G.kept.length;for(let i=0;i<Math.min(6,nk);i++){const f=G.kept[i];tunaSide(700+i*60,690+(i%2)*14,.55+f.w/300,false,0,f.sp==='espadon');}
  ctx.restore();FS=fs0;
  // HUD
  ctx.fillStyle='rgba(5,10,42,.8)';rr(16,16,portrait?560:440,portrait?128:88,14);ctx.fill();
  txt('VIRAGE · '+clk(G.t),30,portrait?50:40,'800 14px Mukta,sans-serif',G.t>T_TRAWL-45?'#FF9A7A':'#FFE9A8');
  txt('Hameçons rangés : '+nf(V.sp*HOOKS/NH)+' / '+nf(HOOKS)+' · alignés '+(V.placed?Math.round(V.aligned/V.placed*100):100)+' %',30,portrait?86:64,'800 15px Mukta,sans-serif','#00FFFF');
  const left=Math.max(0,T_TRAWL-G.t);txt('À bord : '+G.kept.length+' · chalutiers dans '+fmtT(left).replace(' h ','h'),30,portrait?116:84,'700 12px Mukta,sans-serif',left<60?'#FF9A7A':'#E7ECFF');
  V.floats.forEach((fl,i)=>{ctx.globalAlpha=Math.min(1,2.4-fl.t);const y=(portrait?262:170)+i*26*FS-fl.t*8;ctx.font=fs('800 14px Mukta,sans-serif');const w=ctx.measureText(fl.txt).width+28;ctx.fillStyle='rgba(5,10,42,.8)';rr(LW-w-20,y-18*FS,w,26*FS,13*FS);ctx.fill();ctx.fillStyle=fl.c;ctx.textAlign='right';ctx.fillText(fl.txt,LW-34,y);ctx.globalAlpha=1;});
  if(V.floats.length){ctx.font=fs('700 11px Mukta,sans-serif');ctx.fillStyle='rgba(231,236,255,.7)';ctx.textAlign='right';ctx.fillText('L’équipage remonte les autres',LW-24,(portrait?226:148));}
  let msg,col='#0E8A72';
  if(Fi&&Fi.phase==='fight'){msg=Fi.surge>0?'Il tire ! Relâche, sinon la ligne casse !':'Appuie et maintiens pour remonter · relâche quand la tension monte';col=Fi.surge>0?'#C4613A':'#FF7A1A';}
  else if(Fi&&Fi.phase==='gaffe'){msg='En surface ! Touche quand l’aiguille est dans le vert pour le gaffer';col='#FF7A1A';}
  else if(V.lastLand){msg=V.lastLand.txt;col=V.lastLand.c;}
  else msg='Touche quand l’hameçon passe au-dessus du repère : bien alignés sur le bord du bac';
  ctx.font=fs('800 17px Mukta,sans-serif');const tw=Math.min(LW-40,ctx.measureText(msg).width+44),th=36*FS,ty=portrait?150:108;ctx.fillStyle=col;rr(LW/2-tw/2,ty,tw,th,th/2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(msg,LW/2,ty+th*.66,tw-24);
  if(Fi&&Fi.phase==='fight'){const gx=LW-(portrait?120:110),gy=portrait?260:190,gh=portrait?360:300;ctx.fillStyle='rgba(5,10,42,.8)';rr(gx-16,gy-40,portrait?100:84,gh+80,14);ctx.fill();
    ctx.fillStyle='#1E2740';rr(gx,gy,22,gh,11);ctx.fill();const tc=Fi.T>85?'#FF4D3D':Fi.T>60?'#FFB23A':'#3BF0A0';ctx.fillStyle=tc;rr(gx,gy+gh*(1-Math.min(1,Fi.T/100)),22,gh*Math.min(1,Fi.T/100),11);ctx.fill();
    txt('TENSION',gx+11,gy-14,'800 10px Mukta,sans-serif','#E7ECFF','center');ctx.fillStyle='#1E2740';rr(gx+34,gy,14,gh,7);ctx.fill();ctx.fillStyle='#00FFFF';rr(gx+34,gy+gh*(1-clamp(1-Fi.D/110,0,1)),14,gh*clamp(1-Fi.D/110,0,1),7);ctx.fill();txt('PROCHE',gx+41,gy+gh+22,'800 9px Mukta,sans-serif','#00FFFF','center');
    txt((Fi.sp==='thon'?'Thon':'Espadon')+' ~'+(Math.round(Fi.w/10)*10)+' kg',LW/2,LH-(portrait?40:26),'800 14px Mukta,sans-serif','#FFE9A8','center');}
  if(Fi&&Fi.phase==='gaffe'){const bw=portrait?560:520,bx=LW/2-bw/2,by=LH-(portrait?120:90);ctx.fillStyle='rgba(5,10,42,.85)';rr(bx-10,by-14,bw+20,48,14);ctx.fill();ctx.fillStyle='#FF6B5A';rr(bx,by,bw,20,10);ctx.fill();ctx.fillStyle='#3BF0A0';rr(bx+bw*.4,by,bw*.2,20,6);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(bx+bw*Fi.g-3,by-8,6,36);}}

/* ================= retour à la criée ================= */
function startArrival(){const B=G.boat;B.spd=0;G.dest=null;G.via=null;G.phase='docked';G.arr=G.t;G.fadeDir=1;G.fadeCb=()=>{G.scene='arrivee';G.unl={n:G.kept.length,done:0,cur:null,tm:0,fin:false};};}
function updArr(dt){const U=G.unl;if(!U||G.fadeDir)return;U.tm+=dt;
  if(!U.cur&&U.done<U.n&&U.tm>1){U.cur={t:0};}if(U.cur){U.cur.t+=dt/(U.n>8?.7:2.1);if(U.cur.t>=1){U.cur=null;U.done++;U.tm=U.n>8?.85:.6;}}
  if(U.done>=U.n&&!U.fin&&!talk&&U.tm>1.2){U.fin=true;setTimeout(()=>{if(G&&G.scene==='arrivee')finish(false);},700);}}
function catamaranSide(tt){ctx.fillStyle='#F4F7FB';ctx.beginPath();ctx.moveTo(40,520);ctx.lineTo(600,520);ctx.quadraticCurveTo(640,520,650,500);ctx.lineTo(650,540);ctx.lineTo(60,560);ctx.closePath();ctx.fill();
  ctx.fillStyle='#0012B5';ctx.fillRect(48,528,590,9);ctx.fillStyle='#C4613A';ctx.fillRect(56,552,560,6);
  ctx.fillStyle='#E9EEF3';rr(360,420,200,100,10);ctx.fill();ctx.fillStyle='#A9CDEB';for(let i=0;i<4;i++)rr(372+i*46,438,38,30,4),ctx.fill();ctx.fillStyle='#D5DBE3';ctx.fillRect(350,412,220,10);
  ctx.strokeStyle='#C9CFD8';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(420,412);ctx.lineTo(420,360);ctx.lineTo(520,360);ctx.lineTo(520,412);ctx.stroke();
  ctx.fillStyle='#2F6FA8';ctx.beginPath();ctx.ellipse(250,512,60,14,0,0,TAU);ctx.fill();
  ctx.fillStyle='#8E99A5';ctx.fillRect(600,470,20,50);ctx.beginPath();ctx.arc(610,466,14,0,TAU);ctx.fill();}
function drawArrivee(){const tt=G.anim,U=G.unl||{n:0,done:0},late=G.arr>T_LATE,sc=portrait?.65:1,cxo=portrait?180:0,oy=portrait?(LH-720*.65)/2-40:0;
  const e=sunPos(Math.max(G.arr,T_CRIEE)%1440).el,[top,hor]=kf(SKY,Math.max(e,-2));let g=ctx.createLinearGradient(0,0,0,LH);g.addColorStop(0,S(top));g.addColorStop(.55,S(lerpC(hor,[255,190,140],.4)));g.addColorStop(1,S(hor));ctx.fillStyle=g;ctx.fillRect(0,0,LW,LH);
  const fs0=FS;FS=1;ctx.save();ctx.translate(0,oy);ctx.scale(sc,sc);ctx.translate(-cxo,0);
  if(portrait){const gw=ctx.createLinearGradient(0,600,0,1400);gw.addColorStop(0,'#2C5E8C');gw.addColorStop(1,'#0B2440');ctx.fillStyle=gw;ctx.fillRect(-400,600,2200,1200);}
  const sg=ctx.createRadialGradient(1150,430,6,1150,430,200);sg.addColorStop(0,'rgba(255,220,170,.95)');sg.addColorStop(1,'rgba(255,190,140,0)');ctx.fillStyle=sg;ctx.fillRect(950,230,400,400);ctx.fillStyle='#FFE6B8';ctx.beginPath();ctx.arc(1150,440,18,0,TAU);ctx.fill();
  ctx.fillStyle='#6F7C63';ctx.beginPath();ctx.moveTo(-60,470);ctx.quadraticCurveTo(250,260,560,196);ctx.quadraticCurveTo(760,168,980,250);ctx.quadraticCurveTo(1150,300,1340,330);ctx.lineTo(1340,480);ctx.lineTo(-60,480);ctx.fill();
  const HC=['#E3C29C','#EEDDBE','#D5946E','#E8D2AA','#C77E62','#E6DECE'];for(let i=0;i<60;i++){const x=40+(i*41)%1200,y=300+((i*67)%120);const hy=x<560?470-(x+60)*.49:x<980?196+Math.pow((x-690)/300,2)*55:250+(x-980)*.28;if(y<hy+22)continue;ctx.fillStyle=HC[i%6];ctx.fillRect(x,y,22,14);ctx.fillStyle='#B4553A';ctx.fillRect(x-1,y-3,24,4);if(i%3===0){ctx.fillStyle='#FFD58A';ctx.fillRect(x+8,y+4,5,5);}}
  croix(690,190,44,e<0,false);
  for(let i=0;i<12;i++){const x=i*62-10,w=60,h=78+((i*29)%40);ctx.fillStyle=HC[(i*5)%6];ctx.fillRect(x,470-h,w,h);ctx.fillStyle='#B4553A';ctx.fillRect(x-2,470-h-5,w+4,6);for(let r=0;r<Math.floor(h/26);r++)for(let c=0;c<3;c++){ctx.fillStyle=(r+c+i)%3?'#3A4A5C':'#FFD58A';ctx.fillRect(x+8+c*17,470-h+10+r*26,9,13);}}
  ctx.fillStyle='#CFC4AE';ctx.fillRect(-20,468,1340,12);
  g=ctx.createLinearGradient(0,480,0,900);g.addColorStop(0,'#2C5E8C');g.addColorStop(1,'#0B2440');ctx.fillStyle=g;ctx.fillRect(-400,480,2200,900);
  for(let k=0;k<22;k++){const y=490+k*10,w=18+Math.sin(tt*2+k)*8;ctx.fillStyle='rgba(255,210,160,'+(.45-k*.02)+')';ctx.fillRect(1150+Math.sin(tt*1.4+k*.7)*10-w/2,y,w,3);}
  ctx.fillStyle='#D9D0BD';ctx.fillRect(700,480,640,16);ctx.fillStyle='#B6AB95';ctx.fillRect(700,496,640,110);
  // criée, vente du matin
  ctx.fillStyle='#C9D1DA';ctx.fillRect(786,244,500,20);ctx.fillStyle='#F2F4F6';ctx.fillRect(800,262,474,222);ctx.fillStyle='#0012B5';ctx.fillRect(800,272,474,48);txt('CRIÉE DE SÈTE',1037,306,'800 30px Mukta,sans-serif','#FFFFFF','center');
  for(let i=0;i<3;i++){const dx=822+i*146;if(!late){ctx.fillStyle='#2A2F3A';ctx.fillRect(dx,384,122,100);const l2=ctx.createRadialGradient(dx+61,400,4,dx+61,420,110);l2.addColorStop(0,'rgba(255,214,150,.6)');l2.addColorStop(1,'rgba(255,214,150,0)');ctx.fillStyle=l2;ctx.fillRect(dx,384,122,100);
      if(i===1){ctx.fillStyle='#0B0F18';ctx.fillRect(dx+16,394,90,34);txt((14+Math.sin(tt*2)*.6).toFixed(2).replace('.',',')+' €',dx+61,418,'800 18px "Courier New",monospace','#FF4D3D','center');}
      for(let k=0;k<6;k++){ctx.fillStyle='#15181F';ctx.beginPath();ctx.arc(dx+12+k*20,462+Math.sin(tt*3+k+i)*1.5,7,0,TAU);ctx.fill();ctx.fillRect(dx+5+k*20,468,14,16);}}
    else{ctx.fillStyle='#A8B1BB';ctx.fillRect(dx,384,122,100);}}
  if(late){ctx.fillStyle='#C4613A';rr(930,410,176,40,8);ctx.fill();txt('VENTE TERMINÉE',1018,436,'800 16px Mukta,sans-serif','#fff','center');}
  txt('Vente du matin · 06:00',1037,356,'700 14px Mukta,sans-serif','#0012B5','center');
  // catamaran et treuil arrière
  catamaranSide(tt);const dav=[120,380];ctx.strokeStyle='#C9CFD8';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(90,520);ctx.lineTo(90,370);ctx.lineTo(170,360);ctx.stroke();ctx.fillStyle='#FFB23A';ctx.beginPath();ctx.arc(170,362,7,0,TAU);ctx.fill();ctx.fillStyle='#5B6272';ctx.beginPath();ctx.arc(90,470,14,0,TAU);ctx.fill();
  const left=Math.max(0,U.n-U.done-(U.cur?1:0));for(let i=0;i<Math.min(5,left);i++){const f=G.kept[U.done+(U.cur?1:0)+i];if(f)tunaSide(230+i*70,505,.5+f.w/360,false,0,f.sp==='espadon');}
  if(U.cur){const f=G.kept[U.done],k=U.cur.t;let x,y;if(k<.4){x=200;y=505-(k/.4)*130;}else if(k<.8){const q=(k-.4)/.4;x=200+q*620;y=375-Math.sin(q*Math.PI)*40;}else{const q=(k-.8)/.2;x=820;y=375+q*100;}
    const tipx=k<.4?170:Math.min(740,170+(x-200)),tipy=k<.4?362:330;ctx.strokeStyle='#C9CFD8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(170,362);ctx.quadraticCurveTo((170+x)/2,330,x,y-30);ctx.stroke();
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/2);tunaSide(0,0,.6+f.w/300,false,tt,f.sp==='espadon');ctx.restore();}
  for(let i=0;i<U.done;i++){const f=G.kept[i],r=Math.floor(i/7),c=i%7,x=760+c*62+r*14,y=494-r*14;ctx.fillStyle='#B98A55';ctx.fillRect(x,y,58,6);tunaSide(x+30,y-12,.4+f.w/400,false,0,f.sp==='espadon');}
  ctx.restore();FS=fs0;
  ctx.fillStyle='rgba(5,10,42,.78)';rr(16,16,portrait?470:340,portrait?96:66,14);ctx.fill();
  txt('CRIÉE DE SÈTE · '+clk(Math.max(G.arr,T_CRIEE)),30,portrait?52:42,'800 15px Mukta,sans-serif',late?'#FF9A7A':'#FFE9A8');txt('Poissons débarqués : '+U.done+' / '+U.n,30,portrait?88:66,'700 14px Mukta,sans-serif','#00FFFF');
  const bw=portrait?170:120,bh=portrait?54:36;G.ui.skip=U.fin?null:[LW-bw-20,LH-bh-20,bw,bh];if(G.ui.skip){ctx.fillStyle='rgba(5,10,42,.78)';rr(G.ui.skip[0],G.ui.skip[1],bw,bh,bh/2);ctx.fill();txt('Passer →',G.ui.skip[0]+bw/2,G.ui.skip[1]+bh*.66,'800 14px Mukta,sans-serif','#fff','center');}}
function finish(forced){if(G.phase==='end')return;G.phase='end';const late=!forced&&G.arr>T_LATE;
  const kgT=G.kept.filter(f=>f.sp==='thon').reduce((a,f)=>a+f.w,0),kgE=G.kept.filter(f=>f.sp==='espadon').reduce((a,f)=>a+f.w,0);
  let sale=kgT*PRICE.thon+kgE*PRICE.espadon;if(forced)sale=0;else if(late)sale*=.7;const fe=G.fuel*FUEL_EUR,res=sale-fe-BAIT_EUR;
  const head=forced?'Il est trop tard : la vente du matin est passée depuis longtemps.':late?'À quai à <b>'+fmtT(G.arr)+'</b> : la vente du matin est terminée. Le poisson partira plus tard, moins bien valorisé : −30 % (règle du jeu).':G.kept.length?'À quai pour la <b>vente de 6 h</b>. Le treuil arrière débarque nos poissons sur le quai de la criée.':'À quai pour la vente de 6 h… mais les cales sont vides cette nuit. Ça arrive, c’est la pêche.';
  const lines=[head,'<div class="pl-sum"><div><b>'+G.kept.length+' · '+nf(kgT+kgE)+' kg</b><span>thon rouge'+(kgE?' et espadon':'')+' débarqués</span></div><div class="pos"><b>'+nf(sale)+' €</b><span>vente estimée (prix fictifs)</span></div><div class="neg"><b>− '+nf(fe+BAIT_EUR)+' €</b><span>gasoil ('+nf(G.fuel)+' L) et sardines</span></div><div class="'+(res>=0?'pos':'neg')+'"><b>'+(res>=0?'':'− ')+nf(Math.abs(res))+' €</b><span>résultat de la nuit</span></div></div>'+
   'Ces <b>'+nf(kgT)+' kg</b> de thon rouge sont décomptés du quota du bateau. '+'Prochaine étape : la <b>criée</b>, où ce poisson est vendu aux enchères.'+
   '<div class="pl-fine">Prix, consommations et poids des poissons : fictifs, pour le jeu. Palangre d’environ 800 hameçons sur 30 km, levée avant 5 h pour ne pas gêner les chalutiers, vente à la criée à 6 h : d’après les pêcheurs de Sète. Taille minimale du thon rouge : 30 kg ou 115 cm, abaissée à 8 kg ou 75 cm pour les palangriers côtiers de Méditerranée qui vendent en frais (règlement UE 2023/2053, art. 19).</div>'];
  say(lines,()=>{plClose();const c=document.getElementById('criee');if(c)c.scrollIntoView({behavior:'smooth'});},{last:'Direction la criée →'});
  setTimeout(()=>{const nav=$('pl-nav');if(nav&&!$('pl-again')){const b=document.createElement('button');b.className='pl-btn alt';b.id='pl-again';b.textContent='Rejouer';b.onclick=()=>{b.remove();talk=null;$('pl-talk').hidden=true;start();};nav.insertBefore(b,$('pl-next'));showLine();}},30);}
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
  const hfov=(portrait?64:74)*D2R,foc=(w/2)/Math.tan(hfov/2),sun=sunPos(tod()),e=sun.el,night=clamp((-e-2)/8,0,1);
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
  // bouées de la palangre
  for(const bq of lineBuoys()){const d=Math.hypot(bq[0]-B.x,bq[1]-B.y);if(d>4||d<.03)continue;const r=rel(Math.atan2(bq[0]-B.x,bq[1]-B.y));if(Math.abs(r)>hfov/2)continue;const dm=d*1852,px=ax(r),by=EYE/dm*foc;
    if(night>.3){if((tt%3)<.45){const lg=ctx.createRadialGradient(px,by-6,1,px,by-6,16);lg.addColorStop(0,'rgba(255,240,150,1)');lg.addColorStop(1,'rgba(255,240,150,0)');ctx.fillStyle=lg;ctx.fillRect(px-16,by-22,32,32);}}else{const k=Math.max(1.5,foc*4/dm);ctx.fillStyle='#FF7A1A';ctx.beginPath();ctx.arc(px,by-k,k,0,TAU);ctx.fill();}}
  // mouettes
  for(const b of G.birds){const px=b.x*w,py=-h*.46+b.y*h+Math.sin(b.ph*.3)*6,s=10*b.s,fl=Math.sin(b.ph)*.6;ctx.strokeStyle=night>.5?'rgba(20,20,30,'+b.a+')':'rgba(245,247,250,'+b.a+')';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px-s,py-s*fl*.5);ctx.quadraticCurveTo(px-s*.4,py-s*(.4+fl*.4),px,py);ctx.quadraticCurveTo(px+s*.4,py-s*(.4+fl*.4),px+s,py-s*fl*.5);ctx.stroke();}
  ctx.restore();
  drawBow(x0,y0,w,h,night,tt);drawFrame(x0,y0,w,h,night);
}
function panel(r,title){ctx.fillStyle='#07090E';rr(r[0]-4,r[1]-4,r[2]+8,r[3]+8,14);ctx.fill();ctx.fillStyle='#0F1522';rr(r[0],r[1],r[2],r[3],10);ctx.fill();if(title)txt(title,r[0]+12,r[1]+(portrait?25:19),'700 11px "Courier New",monospace','#6FA8FF');}
function buildMap(){const m=mapRect();const oc=document.createElement('canvas');const dp=Math.min(2,window.devicePixelRatio||1)*(cv.width/LW)/(DPR)*DPR;oc.width=Math.ceil(m[2]*DPR);oc.height=Math.ceil(m[3]*DPR);const c=oc.getContext('2d');c.setTransform(DPR,0,0,DPR,-m[0]*DPR,-m[1]*DPR);
  const st=portrait?4:3;for(let py=m[1];py<m[1]+m[3];py+=st)for(let px=m[0];px<m[0]+m[2];px+=st){const q=p2m(px+st/2,py+st/2);let col;
    if(pip(q[0],q[1],THAU))col='#A9D6EE';else if(pip(q[0],q[1],LAND))col='#E8DFC6';else{const dc=distCoast(q[0],q[1]),d=depthAt(q[0],q[1],dc);col=d<50?'#CFEAF8':d<100?'#A5D4F0':d<200?'#78B6E4':d<1000?'#3F82C4':'#23579A';if(dc<3)col=d<50?'#F4CFC6':'#EDB8AE';if(Math.abs(dc-12)<.25)col='#0A2A5A';}
    c.fillStyle=col;c.fillRect(px,py,st+.5,st+.5);}
  c.strokeStyle='#6E6250';c.lineWidth=1.2;c.beginPath();COAST.forEach((p,i)=>{const q=m2p(p[0],p[1]);i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]);});c.stroke();
  c.strokeStyle='rgba(255,255,255,.75)';c.setLineDash([4,3]);c.beginPath();EDGE.forEach((p,i)=>{const q=m2p(p[0],p[1]);i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]);});c.stroke();c.setLineDash([]);
  const fz=f=>fs(f);c.textAlign='left';
  const eq=m2p(EOL.x,EOL.y),er=EOL.r*mapFit().s;c.fillStyle='rgba(255,77,61,.28)';c.beginPath();c.arc(eq[0],eq[1],er,0,TAU);c.fill();c.strokeStyle='#E0321F';c.setLineDash([3,2]);c.lineWidth=1.3;c.stroke();c.setLineDash([]);
  c.fillStyle='#7A1E12';c.font=fz('700 8px Mukta,sans-serif');c.fillText('parc éolien',eq[0]+er+2,eq[1]-1);c.fillText('fermé à la pêche',eq[0]+er+2,eq[1]+8);
  c.fillStyle='rgba(255,255,255,.9)';c.font=fz('700 8px Mukta,sans-serif');const aq=m2p(-4,-45.5);c.fillText('accores ≈ 200 m',aq[0],aq[1]);
  const dq=m2p(22,-46.5);c.fillStyle='#fff';
  const bq=m2p(-33,-10);c.fillStyle='#9C3B2C';c.fillText('moins de 3 milles',bq[0],bq[1]);const tq=m2p(-24,-22);c.fillStyle='#0A2A5A';c.fillText('limite des 12 milles',tq[0],tq[1]);
  for(const t of TOWNS){if(!t.lab&&t.n!=='Sète')continue;const q=m2p(t.x,t.y);c.fillStyle='#3B3226';c.beginPath();c.arc(q[0],q[1],2,0,TAU);c.fill();c.font=fz((t.n==='Sète'?'800 10px':'600 8px')+' Mukta,sans-serif');const west=t.x<-5;c.textAlign=west?'right':'left';c.fillText(t.n,q[0]+(west?-4:4),q[1]+(t.y>0?-3:3));}
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
  if(last&&(G.phase==='trawl'||G.phase==='transit'||G.phase==='idle'||G.phase==='wait')){const f=last.f;txt(f>.9?'Échos forts':f>.55?'Échos moyens':'Échos faibles',x+w-6,y+h-6,'800 10px Mukta,sans-serif',f>.9?'#FF4D3D':f>.55?'#FFD23F':'#3BF0A0','right');}}
function btn(rc,label,on,col,sel){ctx.fillStyle=sel?'#00FFFF':on?(col||'#1E2A44'):'#1A1F2B';rr(rc[0],rc[1],rc[2],rc[3],10);ctx.fill();if(sel){ctx.strokeStyle='#00FFFF';ctx.lineWidth=2;ctx.stroke();}
  ctx.font=fs('800 12px Mukta,sans-serif');ctx.fillStyle=sel?'#0012B5':on?'#fff':'#5A6478';ctx.textAlign='center';ctx.fillText(label,rc[0]+rc[2]/2,rc[1]+rc[3]/2+4*FS);}
function drawToast(){if(!G.msg)return;const W=L().win,a=Math.min(1,G.msg.life*2);ctx.save();ctx.globalAlpha=a;ctx.font=fs('800 16px Mukta,sans-serif');const tw=Math.min(W[2]-60,ctx.measureText(G.msg.t).width+40),th=34*FS;
  ctx.fillStyle=G.msg.c;rr(W[0]+W[2]/2-tw/2,W[1]+26,tw,th,th/2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(G.msg.t,W[0]+W[2]/2,W[1]+26+th*.66,tw-24);ctx.restore();}


/* ================= catamaran : proues vues de la timonerie ================= */
function drawBow(x0,y0,w,h,night,tt){const cx=x0+w/2,by=y0+h,sy=y0+h*.7;
  if(G.boat.spd>2){for(let k=0;k<30;k++){const s=(k*37%100)/100,ph=(tt*1.6+s)%1,side=k%2?1:-1,x=cx+side*w*.22+(s-.5)*w*.12,y=sy+ph*40;ctx.fillStyle='rgba(255,255,255,'+(.5*(1-ph))*(G.boat.spd/11)+')';ctx.beginPath();ctx.arc(x,y,2+ph*5,0,TAU);ctx.fill();}}
  const hull=night>.5?'#2C323C':'#EEF2F6',deck=night>.5?'#1A1E26':'#6E7885';
  for(const s of [-1,1]){const tip=cx+s*w*.2;ctx.fillStyle=hull;ctx.beginPath();ctx.moveTo(cx+s*w*.02,by);ctx.lineTo(tip-8*s,sy-4);ctx.lineTo(tip+8*s,sy-4);ctx.lineTo(cx+s*w*.48,by);ctx.closePath();ctx.fill();
    ctx.fillStyle=deck;ctx.beginPath();ctx.moveTo(cx+s*w*.06,by);ctx.lineTo(tip-4*s,sy+6);ctx.lineTo(tip+4*s,sy+6);ctx.lineTo(cx+s*w*.44,by);ctx.closePath();ctx.fill();}
  ctx.fillStyle=night>.5?'#2A3040':'#C9CFD8';ctx.fillRect(cx-w*.26,by-h*.13,w*.52,h*.035);
  ctx.fillStyle=night>.5?'rgba(20,24,32,.9)':'rgba(40,60,90,.35)';ctx.beginPath();ctx.moveTo(cx-w*.16,by-h*.095);ctx.lineTo(cx+w*.16,by-h*.095);ctx.lineTo(cx+w*.12,by);ctx.lineTo(cx-w*.12,by);ctx.closePath();ctx.fill();
  if(night>.3){for(const s of [-1,1]){const x=cx+s*w*.2,c=s<0?'#FF3B30':'#2EE66B';const lg=ctx.createRadialGradient(x,sy-10,1,x,sy-10,10);lg.addColorStop(0,c);lg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=lg;ctx.fillRect(x-10,sy-20,20,20);}}}
function drawFrame(x0,y0,w,h,night){const pc='#11151D';ctx.fillStyle=pc;ctx.fillRect(x0,y0,w,14);const n=3;for(let i=0;i<=n;i++){const x=x0+i*w/n;ctx.fillRect(x-(i===0||i===n?0:12),y0,i===0||i===n?14:24,h);}
  const dg=ctx.createLinearGradient(0,y0+h,0,LH);dg.addColorStop(0,'#2B3240');dg.addColorStop(1,'#12151C');ctx.fillStyle=dg;ctx.fillRect(0,y0+h,LW,LH-y0-h);
  ctx.fillStyle='#3A4252';ctx.fillRect(0,y0+h-4,LW,12);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(0,y0+h-4,LW,2);
  if(night>.3){const lg=ctx.createRadialGradient(LW/2,y0+h+30,10,LW/2,y0+h+30,LW*.6);lg.addColorStop(0,'rgba(255,90,60,.10)');lg.addColorStop(1,'rgba(255,90,60,0)');ctx.fillStyle=lg;ctx.fillRect(0,y0+h,LW,LH);}}
function lineBuoys(){if(!G.line)return[];const L_=G.line,out=[];for(let i=0;i<=NB;i++){const k=Math.min(L_.length-1,Math.round(i*(L_.length-1)/NB));out.push(L_[k]);}return out;}

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
  for(let i=0;i<ZONES.length;i++){const z=ZONES[i],q=m2p(z.x,z.y);const pul=G.phase==='plan'?.5+.5*Math.sin(tt*4):0;ctx.strokeStyle='rgba(10,42,90,'+(.45+.4*pul)+')';ctx.setLineDash([3,3]);ctx.lineWidth=1.3+pul;ctx.beginPath();ctx.arc(q[0],q[1],2*s,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.font=fs('800 9px Mukta,sans-serif');const tw=ctx.measureText(z.n).width+8;ctx.fillStyle='rgba(255,255,255,.82)';rr(q[0]-tw/2,q[1]-2*s-14*FS,tw,12*FS,4);ctx.fill();ctx.fillStyle='#0A2A5A';ctx.textAlign='center';ctx.fillText(z.n,q[0],q[1]-2*s-5*FS);}
  ctx.lineCap='round';ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1.5;ctx.beginPath();G.track.forEach((a,i)=>{const p=m2p(a[0],a[1]);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);});ctx.stroke();
  if(G.line){ctx.strokeStyle='#FF7A1A';ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.beginPath();G.line.forEach((a,i)=>{const p=m2p(a[0],a[1]);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);});ctx.stroke();ctx.setLineDash([]);
    for(const b of lineBuoys()){const q=m2p(b[0],b[1]);ctx.fillStyle='#FFE14D';ctx.beginPath();ctx.arc(q[0],q[1],3.2,0,TAU);ctx.fill();}}
  for(const b of G.boats){if(b.st==='dock')continue;const q=m2p(b.x,b.y);ctx.save();ctx.translate(q[0],q[1]);ctx.rotate(b.h);ctx.fillStyle='#5A6576';ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(3.5,4);ctx.lineTo(-3.5,4);ctx.closePath();ctx.fill();ctx.restore();}
  const B=G.boat,bq=m2p(B.x,B.y);
  if(G.dest){const q=m2p(G.dest[0],G.dest[1]);ctx.strokeStyle='#E0321F';ctx.setLineDash([6,4]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bq[0],bq[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(q[0],q[1],6,0,TAU);ctx.stroke();}
  ctx.save();ctx.translate(bq[0],bq[1]);ctx.rotate(B.h);ctx.fillStyle='#00FFFF';ctx.strokeStyle='#0A0A1F';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(0,4);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  if(G.phase==='plan'&&!G.dest){ctx.fillStyle='rgba(10,10,31,.78)';const tw=portrait?330:250;rr(m[0]+m[2]/2-tw/2,m[1]+m[3]-40*FS,tw,26*FS,13*FS);ctx.fill();txt('Touche une zone pour tracer la route',m[0]+m[2]/2,m[1]+m[3]-22*FS,'800 12px Mukta,sans-serif','#00FFFF','center');}
  compass(m,G.boat.h,(G.dest?[[brgA(G.dest[0],G.dest[1]),'#E0321F']]:[]));ctx.restore();drawInfo(r);}
function drawInfo(r){const iw=portrait?236:196,x=r[0]+r[2]-iw-2,y=r[1]+6,w=iw-8;ctx.fillStyle='#0A0F1A';rr(x,y,w,r[3]-12,8);ctx.fill();
  const B=G.boat,dc=distCoast(B.x,B.y),d=depthAt(B.x,B.y,dc),lx=x+10,lh=portrait?25:17;let yy=y+(portrait?26:18);
  const L1=(a,b,c)=>{txt(a,lx,yy,'700 10px Mukta,sans-serif','#7F93B8');if(b)txt(b,x+w-10,yy,'800 11px Mukta,sans-serif',c||'#E7ECFF','right');yy+=lh;};
  txt('CAP '+pad(Math.round(((B.h/D2R)%360+360)%360))+'°',lx,yy,'800 12px Mukta,sans-serif','#00FFFF');txt((B.spd.toFixed(1)).replace('.',',')+' nds',x+w-10,yy,'800 12px Mukta,sans-serif','#00FFFF','right');yy+=lh;
  L1('Fond',Math.round(d)+' m');L1('Côte à',(dc.toFixed(1)).replace('.',',')+' M');
  const why=legal(B.x,B.y);txt(why?'● Palangre : pas ici':'● Palangre autorisée',lx,yy,'800 10px Mukta,sans-serif',why?'#FF6B5A':'#3BF0A0');yy+=lh+3;
  if(G.dest){const dd=Math.hypot(G.dest[0]-B.x,G.dest[1]-B.y);L1('Distance',(dd.toFixed(1)).replace('.',',')+' M');L1('Arrivée',fmtT(G.t+dd/Math.max(1,B.spd||THR[G.thr].kn)*60),'#FFE9A8');}
  else if(G.phase==='soak'){L1('Palangre à l’eau',fmtT(G.t-G.soakT0).replace(' h ','h'),'#FFE9A8');L1('Virage','≈ 3 h');}else yy+=lh*2;
  yy+=portrait?4:3;txt('HORAIRES',lx,yy,'800 9px Mukta,sans-serif','#7F93B8');yy+=lh;
  L1('Chalutiers','05:00',G.t>T_TRAWL-60?'#FF6B5A':'#E7ECFF');L1('Criée','06:00',G.t>T_CRIEE-60?'#FFB23A':'#E7ECFF');
  if(G.phase==='soak'){const eta=G.t+HAUL_MIN;txt('Fin du virage si on vire maintenant : '+clk(eta),lx,y+r[3]-22,'700 10px Mukta,sans-serif',eta>T_TRAWL?'#FF6B5A':'#3BF0A0');}miniCmp(x,y,w,r[3]-12,G.phase==='soak'?20:0);}
function drawGauges(){const r=L().gau;panel(r,null);const x=r[0]+12,y=r[1];const n=clamp((-sunPos(tod()).el-2)/8,0,1);
  txt(clk(G.t),x,y+(portrait?64:48),'800 38px "Courier New",monospace',G.t>T_TRAWL?'#FF6B5A':'#FFE9A8');txt(n>.5?'nuit':sunPos(tod()).el<8?'crépuscule':'jour',x,y+(portrait?92:68),'700 10px Mukta,sans-serif','#7F93B8');
  const rx=portrait?x+250:x+168,rw=r[0]+r[2]-12,lh=portrait?25:19;let yy=y+(portrait?30:22);
  const L1=(a,b,c)=>{txt(a,portrait?x:rx,yy,'700 10px Mukta,sans-serif','#7F93B8');txt(b,rw,yy,'800 12px Mukta,sans-serif',c||'#E7ECFF','right');yy+=lh;};
  if(portrait){yy=y+122;txt('Boëttés '+Math.round(G.baitPct*100)+' %',x,yy,'800 12px Mukta,sans-serif','#00FFFF');txt('Gasoil '+nf(G.fuel)+' L · '+nf(G.fuel*FUEL_EUR)+' €',rw,yy,'800 12px Mukta,sans-serif','#FFB23A','right');if(G.warp>1)txt('temps ×4',rw,y+64,'700 10px Mukta,sans-serif','#00FFFF','right');return;}
  L1('Boëttés',G.line?Math.round(G.baitPct*100)+' %':'0 / 800','#00FFFF');L1('Gasoil',nf(G.fuel)+' L','#FFB23A');L1('Coût',nf(G.fuel*FUEL_EUR)+' €','#FFB23A');L1('À bord',G.kept.length+' poisson'+(G.kept.length>1?'s':''),'#3BF0A0');
  if(G.warp>1)txt('temps ×4',x,y+104,'800 10px Mukta,sans-serif','#00FFFF');}
function drawCtrl(){const r=L().ctrl;panel(r,null);const u=G.ui,pul=(Math.sin(G.anim*4)+1)/2,[lab,short,on]=actLabel();
  if(portrait){const y=r[1]+8,h=r[3]-16;u.thr=[0,1,2].map(i=>[r[0]+8+i*96,y,90,h]);u.act=[r[0]+300,y,300,h];u.warp=[r[0]+608,y,80,h];}
  else{u.thr=[0,1,2].map(i=>[r[0]+8+i*98,r[1]+8,92,38]);u.act=[r[0]+8,r[1]+54,290,60];u.warp=[r[0]+8,r[1]+122,290,34];}
  THR.forEach((T,i)=>btn(u.thr[i],portrait?T.n:T.n+' '+T.kn+' nds',true,null,G.thr===i));
  const a=u.act;ctx.fillStyle=on?'#FF4D3D':'#3A2A2A';ctx.shadowColor='#FF4D3D';ctx.shadowBlur=on?14+10*pul:0;rr(a[0],a[1],a[2],a[3],14);ctx.fill();ctx.shadowBlur=0;
  txt(portrait?short:lab,a[0]+a[2]/2,a[1]+a[3]/2+6,'800 '+(portrait?16:18)+'px Mukta,sans-serif',on?'#fff':'#9A8A8A','center');
  btn(u.warp,portrait?'×4':(G.warp>1?'⏩ Temps ×4':'⏩ Accélérer'),G.phase!=='plan',null,G.warp>1);}
function drawTip(){const r=L().tip;panel(r,null);const fsz=portrait?62:64,cx=r[0]+12+fsz/2,cy=r[1]+r[3]/2;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,fsz/2,0,TAU);ctx.clip();if(JIMG.complete)ctx.drawImage(JIMG,cx-fsz/2,cy-fsz/2,fsz,fsz);ctx.restore();ctx.strokeStyle='#00FFFF';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,fsz/2,0,TAU);ctx.stroke();
  const ph=G.phase,B=G.boat;let t;
  if(ph==='plan')t=G.dest?'Bonne route ! Largue les amarres. On cale entre 3 et 12 milles.':'Touche une zone sur le traceur. Le collègue a vu des thons chasser, on y va ?';
  else if((ph==='transit'||ph==='idle')&&!G.line)t=legal(B.x,B.y)?'On fait route. On pourra caler dès qu’on sera entre 3 et 12 milles de la côte.':'On est dans la bonne zone : cale la palangre quand tu veux.';
  else if(ph==='soak'){const eta=G.t+HAUL_MIN;t=G.t-G.soakT0<60?'La palangre pêche. Patience, les thons chassent au crépuscule…':eta>T_TRAWL-20?'Il faut virer maintenant, sinon on ne finira pas avant 5 h !':'Plus on attend, plus il y a de touches… mais le virage prend ~3 h. À toi de choisir.';}
  else if(ph==='return')t=G.t<T_CRIEE?'Cap sur Sète : la criée ouvre à 6 h, pour la vente du matin.':'On est en retard pour la criée, pousse un peu le moteur !';
  else t='';
  wrap(t,r[0]+fsz+26,r[1]+(portrait?30:24),r[2]-fsz-36,portrait?15:16,'600 13px Mulish,sans-serif','#E7ECFF');}

/* ================= boucle et commandes ================= */
let last=0;
function loop(ts){if(!running)return;const dt=Math.min(.05,(ts-last)/1000||0);last=ts;
  if(cv.parentElement.clientWidth&&Math.abs(cv.width/DPR-LW)>1)resize();
  update(dt);
  if(G){if(G.scene==='filage')drawSet();else if(G.scene==='virage')drawHaul();else if(G.scene==='arrivee')drawArrivee();else{drawFPV();drawSonar();drawTip();drawPlot();drawGauges();drawCtrl();drawToast();}
    if(G.fade>0){ctx.fillStyle='rgba(2,5,15,'+G.fade+')';ctx.fillRect(0,0,LW,LH);}}
  raf=requestAnimationFrame(loop);}
function ptr(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*LW/r.width,(e.clientY-r.top)*LH/r.height];}
cv.addEventListener('pointerdown',e=>{if(!G||talk)return;e.preventDefault();const p=ptr(e);
  if(G.scene==='filage'){flTap();return;}
  if(G.scene==='virage'){const V=G.vr;if(V&&V.fight&&(V.fight.phase==='fight'||V.fight.phase==='hisse')){V.hold=true;return;}vrTap();return;}
  if(G.scene==='arrivee'){if(inR(p,G.ui.skip)&&G.unl&&!G.unl.fin){G.unl.done=G.unl.n;G.unl.cur=null;G.unl.tm=2;}return;}
  if(G.phase==='end')return;const u=G.ui;
  for(let i=0;i<3;i++)if(inR(p,u.thr&&u.thr[i])){G.thr=i;return;}
  if(inR(p,u.act)){act();return;}if(inR(p,u.warp)){if(G.phase!=='plan')G.warp=G.warp===1?4:1;return;}
  if(inR(p,mapRect())){plotClick(p2m(p[0],p[1]));return;}});
window.addEventListener('pointerup',()=>{if(G&&G.vr)G.vr.hold=false;});
window.addEventListener('keydown',e=>{if(!running||!G)return;if(e.code==='Escape'){plClose();return;}if(talk)return;
  if(e.code==='Space'){e.preventDefault();if(e.repeat)return;if(G.scene==='filage')flTap();else if(G.scene==='virage'){const V=G.vr;if(V&&V.fight&&(V.fight.phase==='fight'||V.fight.phase==='hisse'))V.hold=true;else vrTap();}else if(G.scene==='sea')act();}});
window.addEventListener('keyup',e=>{if(G&&G.vr&&e.code==='Space')G.vr.hold=false;});
function start(){newGame();say(introLines(),null,{last:'On y va →'});}
window.plOpen=function(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.documentElement.style.overflow='hidden';running=true;resize();start();last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);};
window.plClose=function(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.documentElement.style.overflow='';running=false;cancelAnimationFrame(raf);talk=null;$('pl-talk').hidden=true;G=null;const a=$('pl-again');if(a)a.remove();};
window.__PL={get G(){return G},get talk(){return talk},next(){$('pl-next').click();},act,plot(x,y){plotClick([x,y]);},flTap,vrTap,haul(){G.baitPct=.9;G.soakT0=G.t-200;G.t=1300;startHaul();}};
})();

