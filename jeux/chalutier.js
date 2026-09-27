
(function(){
const cv=document.getElementById('tw-cv');if(!cv)return;
const ctx=cv.getContext('2d'),modal=document.getElementById('tw-modal');
const $=id=>document.getElementById(id);
const PIMG=new Image();PIMG.src='img/4413dbbc98.svg';
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
function fmtT(t){t=Math.round(t);return Math.floor(t/60)+' h '+pad(t%60);}
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
const ZONES=[['Petits fonds de Sète',43.28,3.70],['Large d’Agde',43.15,3.52],['Plateau central',43.05,3.90],['Les accores',42.86,3.85],['Large de l’Espiguette',43.32,4.18]].map(a=>{const p=P(a[1],a[2]);return{n:a[0],x:p[0],y:p[1]};});
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

/* ================= paramètres du jeu (fictifs) ================= */
const SPH=8; // secondes réelles par heure de jeu
const THR=[{n:'ÉCO',kn:8,lh:100},{n:'ROUTE',kn:10,lh:138},{n:'PLEIN',kn:12,lh:300}];
const TRAWL_KN=4.5,TRAWL_LH=138,IDLE_LH=12,FUEL_EUR=.7,TRAWL_MIN=180,HAUL_MIN=15,T_FIRST=360,T_CRIEE=1020,T_HARD=1140,EYE=6;
const SP=[['merlu','Merlu',5.5,'#9FB6D6'],['rouget','Rouget',6,'#E4574B'],['baudroie','Baudroie',7,'#8A6A4F'],['sole','Sole',12,'#D7B98E'],['poulpe','Poulpe',4.5,'#C77AA8'],['seiche','Seiche',4.5,'#B9A58C'],['calmar','Calmar',7,'#F0C9C0'],['grondin','Grondin',2.5,'#F08A3C'],['friture','Petite friture',2,'#C6D2DE']];
const M0={rouget:.22,seiche:.15,poulpe:.15,merlu:.12,grondin:.12,friture:.24},M1={merlu:.38,baudroie:.2,calmar:.14,grondin:.1,rouget:.08,poulpe:.05,friture:.05};
function mixAt(x,d){const sz=clamp((d-35)/150,0,1),ea=clamp((x-10)/10,0,1)*(1-sz);const w={};let s=0;for(const [k] of SP){w[k]=(M0[k]||0)*(1-sz)+(M1[k]||0)*sz+(k==='sole'?.14*ea:0);s+=w[k];}for(const k in w)w[k]/=s;return{w,sz};}
function rate(x,y,d){if(d<15||d>1000)return 0;const bg=d<60?80:d<120?80-(d-60)*.16:d<220?70-(d-120)*.05:34;let s=.6;for(const p of G.patches){const q=(x-p.x)**2+(y-p.y)**2;if(q<30)s+=p.a*Math.exp(-q/(2*1.3*1.3));}return bg*s;}
function randSea(dmin,dmax){for(let k=0;k<400;k++){const x=rnd(-34,40),y=rnd(-47,2);if(inLand(x,y))continue;const dc=distCoast(x,y);if(dc<3.2)continue;const d=depthAt(x,y,dc);if(d>=dmin&&d<=dmax&&Math.hypot(x-EOL.x,y-EOL.y)>EOL.r+.5)return[x,y];}return[5,-15];}

/* ================= état ================= */
function newGame(){
  const tram=Math.random()<.45;
  G={scene:'quai',phase:'quai',t:150,anim:0,fade:0,fadeDir:0,ui:{},
    boxes:{pile:8,done:0,drag:null,fly:[],fin:false},
    boat:{x:S0[0],y:S0[1],h:180*D2R,spd:0},dest:null,thr:1,warp:1,steer:0,trawlTarget:null,
    fuel:0,trawls:[],tr:null,traitN:0,track:[],trackT:0,haulT:0,dist:0,arr:null,
    wind:{on:tram,from:tram?Math.round(rnd(12,13.5)*60):9999,k:0},
    patches:[],croches:[],boats:[],sonar:[],sonT:0,birds:[],msg:null};
  for(const z of ZONES)for(let i=0;i<2;i++){const a=rnd(0,TAU),r=rnd(0,2.2);G.patches.push({x:z.x+Math.cos(a)*r,y:z.y+Math.sin(a)*r,a:rnd(.5,1.3)});}
  for(let i=0;i<16;i++){const p=randSea(25,230);G.patches.push({x:p[0],y:p[1],a:rnd(.3,1.1)});}
  G.radio=Math.floor(Math.random()*ZONES.length);const rz=ZONES[G.radio];G.patches.push({x:rz.x+rnd(-1,1),y:rz.y+rnd(-1,1),a:1.4});
  for(let i=0;i<5;i++){let p;if(i<2){const z=ZONES[Math.floor(Math.random()*ZONES.length)];p=[z.x+rnd(-2.6,2.6),z.y+rnd(-2.6,2.6)];if(illegal(p[0],p[1]))p=randSea(30,190);}else p=randSea(30,190);G.croches.push({x:p[0],y:p[1]});}
  for(let i=0;i<3;i++){const z=ZONES[(G.radio+1+i)%ZONES.length];G.boats.push({x:S0[0]+rnd(-.1,.1),y:S0[1]+rnd(-.1,.1),h:150*D2R,spd:0,st:'dock',dep:158+i*9,tx:z.x+rnd(-1.5,1.5),ty:z.y+rnd(-1.5,1.5)});}
}

/* ================= dialogues ================= */
function say(lines,onDone,labels){talk={lines,i:0,onDone,labels:labels||{}};$('tw-talk').hidden=false;showLine();}
function showLine(){const t=talk;$('tw-txt').innerHTML=t.lines[t.i];
  $('tw-dots').innerHTML=t.lines.length>1?t.lines.map((_,k)=>'<i class="'+(k===t.i?'on':'')+'"></i>').join(''):'';
  $('tw-next').textContent=t.i<t.lines.length-1?'Suivant →':(t.labels.last||'C’est parti →');
  $('tw-skip').style.display=t.lines.length>1&&t.i<t.lines.length-1?'':'none';
  const a=$('tw-again');if(a)a.style.display=t.i===t.lines.length-1?'':'none';}
$('tw-next').onclick=()=>{if(!talk)return;if(talk.i<talk.lines.length-1){talk.i++;showLine();}else{const f=talk.onDone;talk=null;$('tw-talk').hidden=true;f&&f();}};
$('tw-skip').onclick=()=>{if(!talk)return;talk.i=talk.lines.length-1;showLine();};
function toast(t,c){if(G)G.msg={t,c:c||'#0012B5',life:3.6};}
const INTRO=['Salut ! Moi c’est <b>Vincent</b>, le patron. Il est <b>2 h 30</b>, le port de Sète dort encore. Aujourd’hui, tu embarques avec moi sur un <b>chalutier</b> du golfe du Lion.',
 'Avant de partir, on range les <b>bacs à poisson</b> : ils sont empilés à l’arrière du pont. Mets-les à l’abri, dans la <b>partie couverte à l’avant</b>. Fais-les glisser un par un (ou touche la pile).'];
function cabinLines(){const rz=ZONES[G.radio].n;
  const meteo=G.wind.on?'Météo marine : beau le matin, mais <b>tramontane</b> qui se lève vers <b>'+fmtT(G.wind.from)+'</b>, forte au large. Au retour, on l’aura dans le nez : ça ralentit et ça consomme.':'Météo marine : <b>beau temps</b>, mer peu agitée toute la journée.';
  return['Bienvenue dans la <b>timonerie</b>. Les deux Vierges veillent sur nous : on ne part jamais sans elles.',
  'Sur le <b>traceur</b>, choisis où pêcher. <b>Plus on va loin, plus les poissons sont gros</b>, mais plus on brûle de gasoil. Près de la côte, on économise, mais le poisson est plus petit, et il y a beaucoup de juvéniles.',
  'Le premier trait se file à <b>6 h</b>. On en fait <b>trois de 3 heures</b>, et on doit être à quai pour la <b>criée à 17 h</b> au plus tard. Astuce : on peut chaluter en se rapprochant de Sète.',
  'Le chalut est interdit dans la <b>bande des 3 milles</b>, dans le <b>parc éolien</b> et <b>au-delà de 1 000 m</b> de fond. Et gare aux <b>croches</b> ⚠ : une épave, et le filet est déchiré.',
  meteo+' À la radio, un collègue dit que ça donne bien vers <b>'+rz+'</b>.'];}

/* ================= mise en page ================= */
function L(){return portrait?{win:[0,0,720,420],plot:[12,436,696,384],son:[12,830,342,160],gau:[366,830,342,160],tip:[12,1000,696,80],ctrl:[12,1088,696,82]}
 :{win:[0,0,1280,400],plot:[338,418,604,292],son:[16,418,306,176],tip:[16,604,306,106],gau:[958,418,306,118],ctrl:[958,546,306,164]};}
function mapRect(){const r=L().plot,iw=portrait?236:196;return[r[0]+8,r[1]+8,r[2]-iw-16,r[3]-16];}
function mapFit(){const m=mapRect(),s=Math.min(m[2]/(MX1-MX0),m[3]/(MY1-MY0));return{s,ox:m[0]+(m[2]-(MX1-MX0)*s)/2,oy:m[1]+(m[3]-(MY1-MY0)*s)/2};}
function m2p(x,y){const f=mapFit();return[f.ox+(x-MX0)*f.s,f.oy+(MY1-y)*f.s];}
function p2m(px,py){const f=mapFit();return[(px-f.ox)/f.s+MX0,MY1-(py-f.oy)/f.s];}

/* ================= logique ================= */
function turnTo(B,brg,maxd){let d=brg-B.h;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;B.h+=clamp(d,-maxd,maxd);}
function projReturn(){let t=G.t,x=G.boat.x,y=G.boat.y;const kn=THR[G.thr].kn;
  if(G.dest&&G.phase!=='return'){t+=Math.hypot(G.dest[0]-x,G.dest[1]-y)/kn*60;x=G.dest[0];y=G.dest[1];}
  let left=3-G.traitN;if(G.phase==='trawl'){left--;t+=TRAWL_MIN-G.tr.min+HAUL_MIN;}if(G.phase==='haul')t+=Math.max(0,HAUL_MIN-G.haulT);
  if(left>0&&G.phase!=='return')t=Math.max(t,T_FIRST)+left*(TRAWL_MIN+HAUL_MIN);
  return t+Math.hypot(PORT[0]-x,PORT[1]-y)/kn*60;}
function projFuel(){let f=G.fuel,x=G.boat.x,y=G.boat.y;const T=THR[G.thr];
  if(G.dest&&G.phase!=='return'){f+=Math.hypot(G.dest[0]-x,G.dest[1]-y)/T.kn*T.lh;x=G.dest[0];y=G.dest[1];}
  let left=3-G.traitN;if(G.phase==='trawl'){left--;f+=(TRAWL_MIN-G.tr.min)/60*TRAWL_LH;}if(G.phase!=='return')f+=Math.max(0,left)*TRAWL_MIN/60*TRAWL_LH;
  return f+Math.hypot(PORT[0]-x,PORT[1]-y)/T.kn*T.lh;}
function arrive(){const B=G.boat;B.spd=0;G.dest=null;
  if(G.phase==='return'){startArrival();return;}
  if(G.t<T_FIRST){G.phase='wait';toast('Sur zone. Le chalut se file à 6 h : on patiente.');}else{G.phase='idle';toast('Sur zone : file le chalut !');}}
function startTrawl(){const B=G.boat;const why=illegal(B.x,B.y);if(why){toast(why,'#C4613A');return;}
  G.phase='trawl';G.dest=null;G.trawlTarget=null;G.steer=0;const d=depthAt(B.x,B.y);
  G.tr={n:G.traitN+1,t0:G.t,min:0,kg:{},kgTot:0,under:0,waste:0,val:0,szw:0,torn:false,zone:placeName(B.x,B.y,d)};
  toast('Chalut à l’eau ! Trait n° '+G.tr.n+' · '+G.tr.zone,'#0E8A72');}
function startHaul(){G.phase='haul';G.haulT=0;G.boat.spd=0;G.traitN++;G.trawls.push(G.tr);G.steer=0;toast('Vincent descend sur le pont…','#0E8A72');
  G.vir={t:0,dur:10.4,boxFill:[0,0,0,0,0,0,0,0],sortI:0,sortT:0,T:G.tr,gm:HAUL_MIN+(G.tr.torn?30:0),fish:[],spawned:0,done:false};G.fadeDir=1;G.fadeCb=()=>{G.scene='virage';};}
function goHome(){if(G.phase==='trawl'){toast('Vire d’abord le chalut.','#C4613A');return;}G.dest=PORT.slice();G.phase='return';G.via=Math.hypot(G.boat.x-ENTRY[0],G.boat.y-ENTRY[1])>.4?ENTRY.slice():null;toast('Cap sur Sète et la criée !','#0E8A72');}
function act(){const ph=G.phase;
  if(ph==='plan'){if(G.dest){G.phase='transit';G.via=ENTRY.slice();toast('On largue les amarres !','#0E8A72');}else toast('Touche d’abord une zone sur le traceur.','#C4613A');return;}
  if(ph==='idle'||ph==='transit'||ph==='wait'){
    if(G.traitN>=3){goHome();return;}
    if(G.t<T_FIRST){if(ph==='idle'){G.phase='wait';}else toast('Le chalut se file à partir de 6 h.','#C4613A');return;}
    startTrawl();return;}
  if(ph==='trawl'){if(G.tr.min>=60)startHaul();else toast('Laisse travailler le chalut au moins une heure.','#C4613A');}}
function actLabel(){const ph=G.phase;
  if(ph==='plan')return G.dest?['LARGUER LES AMARRES','LARGUER',1]:['CHOISIS UNE ZONE','ZONE ?',0];
  if(ph==='trawl')return G.tr.min>=60?['VIRER LE CHALUT','VIRER',1]:['CHALUT À L’EAU…','PÊCHE…',0];
  if(ph==='haul')return['ON VIRE…','ON VIRE…',0];
  if(ph==='return')return['CAP SUR SÈTE','RETOUR',0];
  if(ph==='end')return['À QUAI','À QUAI',0];
  if(G.traitN>=3)return['RENTRER À LA CRIÉE','RENTRER',1];
  if(G.t<T_FIRST)return ph==='wait'?['FILER À 6 H…','6 H…',0]:['EN ROUTE…','EN ROUTE',0];
  return['FILER LE CHALUT · '+(G.traitN+1)+'/3','FILER',1];}
function plotClick(pt){if(G.phase==='haul'||G.phase==='end')return;
  if(inLand(pt[0],pt[1])){toast('Terre ! Choisis un point en mer.','#C4613A');return;}
  if(pt[0]<MX0||pt[0]>MX1||pt[1]<MY0||pt[1]>MY1)return;
  if(G.phase==='trawl'){G.trawlTarget=Math.atan2(pt[0]-G.boat.x,pt[1]-G.boat.y);G.steer=0;toast('Le chalut vire doucement vers ce point.');return;}
  let p=pt;for(const z of ZONES)if(Math.hypot(pt[0]-z.x,pt[1]-z.y)<1.4)p=[z.x,z.y];
  G.dest=p.slice();if(G.phase!=='plan'){G.phase='transit';if(G.boat.y>-1.4&&Math.abs(G.boat.x-PORT[0])<1)G.via=ENTRY.slice();else G.via=null;}}
function update(dt){
  if(!G)return;G.anim+=dt;if(G.msg){G.msg.life-=dt;if(G.msg.life<=0)G.msg=null;}
  if(G.fadeDir){G.fade+=G.fadeDir*dt*1.8;if(G.fadeDir>0&&G.fade>=1){G.fade=1;G.fadeDir=-1;const f=G.fadeCb;G.fadeCb=null;f&&f();}else if(G.fadeDir<0&&G.fade<=0){G.fade=0;G.fadeDir=0;}}
  if(G.scene==='quai'){updQuai(dt);return;}
  if(G.scene==='arrivee'){updArr(dt);return;}
  if(G.scene==='virage'){updVir(dt);return;}
  updBirds(dt);
  if(talk||G.phase==='plan'||G.phase==='end'||G.phase==='docked'||G.fadeDir)return;
  const warp=G.phase==='wait'?14:G.warp,dm=dt*60/SPH*warp;G.t+=dm;
  if(G.wind.on&&G.t>=G.wind.from)G.wind.k=Math.min(1,(G.t-G.wind.from)/60);
  const B=G.boat,dc=distCoast(B.x,B.y),wf=G.wind.k*clamp(dc/20,.3,1);let lh=IDLE_LH;
  if(G.phase==='transit'||G.phase==='return'){
    const tg=G.via||G.dest,dx=tg[0]-B.x,dy=tg[1]-B.y,dd=Math.hypot(dx,dy);turnTo(B,Math.atan2(dx,dy),Math.max(dt*40*D2R,dm*30*D2R));
    const into=Math.max(0,Math.cos(B.h-315*D2R));B.spd=THR[G.thr].kn*(1-.3*wf*into);lh=THR[G.thr].lh*(1+.35*wf);
    if(G.phase==='return'&&Math.hypot(PORT[0]-B.x,PORT[1]-B.y)<1.6){B.spd=Math.min(B.spd,5);lh=Math.min(lh,60);if(!G.harbour){G.harbour=true;G.warp=1;toast('Entrée du port de Sète : on réduit l’allure.','#0E8A72');}}
    const step=B.spd*dm/60;G.fuel+=lh*dm/60;
    if(dd<=step+.01){B.x=tg[0];B.y=tg[1];G.dist+=dd;if(G.via)G.via=null;else arrive();}else{B.x+=Math.sin(B.h)*step;B.y+=Math.cos(B.h)*step;G.dist+=step;}
  }else if(G.phase==='trawl'){
    if(G.steer){B.h+=G.steer*35*D2R*dt;G.trawlTarget=null;}else if(G.trawlTarget!=null)turnTo(B,G.trawlTarget,Math.min(dm*6*D2R,dt*60*D2R));
    const ax=B.x+Math.sin(B.h)*1.1,ay=B.y+Math.cos(B.h)*1.1,why=illegal(ax,ay);
    if(why&&G.trawlTarget==null){G.trawlTarget=B.h+Math.PI*.75;G.steer=0;toast(why+' On vire de bord.','#C4613A');}
    if(G.trawlTarget!=null){let d=G.trawlTarget-B.h;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;if(Math.abs(d)<.02&&!why)G.trawlTarget=null;}
    B.spd=TRAWL_KN;lh=TRAWL_LH*(1+.35*wf);const step=B.spd*dm/60;const nx=B.x+Math.sin(B.h)*step,ny=B.y+Math.cos(B.h)*step;
    if(!illegal(nx,ny)){B.x=nx;B.y=ny;G.dist+=step;}else{B.h+=dm*8*D2R;}
    G.fuel+=lh*dm/60;const T=G.tr;T.min+=dm;
    const d=depthAt(B.x,B.y,dc),kgh=rate(B.x,B.y,d),dk=kgh*dm/60,m=mixAt(B.x,d),u=.02+.2*Math.pow(1-m.sz,1.5),sm=.9+.35*m.sz;
    let pk=0;for(const [k,,pr] of SP){const q=dk*m.w[k]*(1-u);T.kg[k]=(T.kg[k]||0)+q;pk+=m.w[k]*pr;}
    T.kgTot+=dk*(1-u);T.under+=dk*u;T.waste+=dk*.012;T.szw+=dk*(1-u)*m.sz;T.val+=dk*(1-u)*pk*sm;
    for(const c of G.croches)if(!T.torn&&Math.hypot(c.x-B.x,c.y-B.y)<.3){T.torn=true;c.hit=true;for(const k in T.kg)T.kg[k]*=.4;T.kgTot*=.4;T.val*=.4;T.szw*=.4;toast('CROCHE ! Le chalut s’est accroché sur une épave.','#C4613A');startHaul();break;}
    if(G.phase==='trawl'&&T.min>=TRAWL_MIN)startHaul();
  }else if(G.phase==='haul'){B.spd=0;G.haulT+=dm;if(G.haulT>=HAUL_MIN+(G.tr.torn?30:0))showHaul();}
  else if(G.phase==='wait'){B.spd=0;if(G.t>=T_FIRST){G.phase='idle';toast('6 h : tu peux filer le chalut !','#0E8A72');}}
  else B.spd=0;
  if(G.phase!=='transit'&&G.phase!=='return'&&G.phase!=='trawl')G.fuel+=IDLE_LH*dm/60;
  G.trackT+=dm;if(G.trackT>=2){G.trackT=0;G.track.push([B.x,B.y,G.phase==='trawl']);if(G.track.length>900)G.track.shift();}
  G.sonT+=dm;if(G.sonT>=1){G.sonT=0;const d=depthAt(B.x,B.y,dc);G.sonar.push({d:Math.max(5,d),f:clamp(rate(B.x,B.y,d)/120,0,1.6),sd:Math.random()*999,tr:G.phase==='trawl'});if(G.sonar.length>170)G.sonar.shift();}
  updBoats(dm);
  if(G.t>=T_HARD&&G.phase!=='end')finish(true);
}
function updBoats(dm){for(const b of G.boats){let tx=null,ty=null,sp=0;
  if(b.st==='dock'){if(G.t>=b.dep)b.st='go';}
  else if(b.st==='go'){tx=b.tx;ty=b.ty;sp=10;if(Math.hypot(tx-b.x,ty-b.y)<.3){b.st=G.t>=T_FIRST?'trawl':'wait';}}
  else if(b.st==='wait'){if(G.t>=T_FIRST)b.st='trawl';}
  else if(b.st==='trawl'){sp=3;const hb=Math.atan2(PORT[0]-b.x,PORT[1]-b.y)+Math.sin(G.t/40+b.dep)*.9;turnTo(b,hb,dm*3*D2R);if(G.t>=935||distCoast(b.x,b.y)<3.6)b.st='back';}
  else if(b.st==='back'){tx=PORT[0];ty=PORT[1];sp=10;if(Math.hypot(tx-b.x,ty-b.y)<.35)b.st='home';}
  if(tx!=null)turnTo(b,Math.atan2(tx-b.x,ty-b.y),dm*20*D2R);
  b.spd=sp;const st=sp*dm/60;b.x+=Math.sin(b.h)*st;b.y+=Math.cos(b.h)*st;}}
function updBirds(dt){const day=sunPos(G.t).el>-2,want=(G.phase==='trawl'||G.phase==='haul')&&day?(G.phase==='haul'?12:6):0;
  while(G.birds.length<want)G.birds.push({x:rnd(-.6,.6),y:rnd(.05,.4),vx:rnd(-.08,.08),ph:rnd(0,6),s:rnd(.7,1.3),a:0});
  for(const b of G.birds){b.a=Math.min(1,b.a+dt*.5);b.ph+=dt*(6+b.s*2);b.x+=b.vx*dt;b.y+=Math.sin(b.ph*.2)*.004;if(Math.abs(b.x)>.55)b.vx*=-1;}
  if(G.birds.length>want)G.birds=G.birds.filter((b,i)=>i<want||(b.a-=dt*.8)>0);}
function sizeLab(sz){return sz<.33?'petits':sz<.66?'moyens':'gros';}
function showHaul(){const T=G.tr;G.phase='idle';G.haulT=0;const sz=T.kgTot?T.szw/T.kgTot:0;
  const rows=SP.map(([k,n,,c])=>[n,T.kg[k]||0,c]).filter(r=>r[1]>=1).sort((a,b)=>b[1]-a[1]).map(r=>'<div><i style="background:'+r[2]+'"></i>'+r[0]+'<span>'+nf(r[1])+' kg</span></div>').join('');
  let com;if(T.torn)com='<span class="tw-warn">La croche a déchiré le filet : une bonne partie du trait est perdue, et il a fallu 30 minutes pour réparer.</span>';
  else if(sz<.33)com='Beaucoup de <b>petits poissons</b> : les petits fonds côtiers sont des nurseries. Plus au large, le poisson est plus gros.';
  else if(sz>.66)com='De <b>beaux poissons</b> du large ! Mais on est loin : surveille le gasoil et l’heure de la criée.';
  else com='Un trait correct, du poisson de taille moyenne.';
  const eta=projReturn();const lines=['<b>Trait n° '+T.n+' · '+T.zone+'</b> — '+nf(T.kgTot)+' kg de poissons <b>'+sizeLab(sz)+'</b> à bord, soit ≈ '+Math.max(1,Math.round(T.kgTot/25))+' bacs'+(rows?'<div class="tw-catch">'+rows+'</div>':'')+
   '<div class="tw-sum"><div><b>'+nf(T.under)+' kg</b><span>sous la taille minimale : non vendables</span></div><div><b>'+nf(T.waste)+' kg</b><span>de déchets remontés, ramenés au port</span></div><div><b>≈ '+nf(T.val)+' €</b><span>valeur à la criée (≈ 5 €/kg en moyenne)</span></div><div class="'+(eta>T_CRIEE&&G.traitN<3?'neg':'')+'"><b>'+fmtT(eta)+'</b><span>retour estimé à quai</span></div></div>'+com+
   (G.traitN<3&&eta>T_CRIEE?' <span class="tw-warn">Attention : à ce rythme, on rate la criée. Rapproche-toi de Sète pour les prochains traits, ou vire plus tôt.</span>':'')+
   (G.traitN>=3?' Trois traits dans la cale : <b>cap sur la criée</b> !':' Touche le traceur pour changer de coin, puis file le trait suivant.')];
  say(lines,()=>{G.fadeDir=1;G.fadeCb=()=>{G.scene='sea';G.vir=null;if(G.traitN>=3)goHome();};},{last:G.traitN>=3?'Remonter · cap sur la criée →':'Remonter en timonerie →'});}
function finish(forced){if(G.phase==='end')return;const late=G.t>T_CRIEE;G.phase='end';G.arr=G.t;G.boat.spd=0;
  let kg=0,val=0,under=0,szw=0;for(const T of G.trawls){kg+=T.kgTot;val+=T.val;under+=T.under;szw+=T.szw;}
  const sz=kg?szw/kg:0,sale=forced?0:late?val*.6:val,fe=G.fuel*FUEL_EUR,res=sale-fe;
  const head=forced?'Il est <b>19 h</b> : la criée est fermée depuis longtemps. Le poisson ne sera pas vendu aujourd’hui.':late?'À quai à <b>'+fmtT(G.arr)+'</b> : <b>trop tard pour la criée</b>. Le poisson partira demain, moins frais : −40 % (règle du jeu).':'À quai à <b>'+fmtT(G.arr)+'</b>, à temps pour la <b>criée</b>. Bravo, matelot !';
  let tips=[];if(!G.trawls.length)tips.push('Aucun trait : pas de poisson, mais du gasoil brûlé.');
  if(G.trawls.length&&sz<.33)tips.push('Poisson surtout petit : on est resté près de la côte.');
  if(sz>.6)tips.push('De beaux poissons du large.');
  if(G.fuel>1800)tips.push('Gros budget gasoil : le large coûte cher.');
  if(G.trawls.some(t=>t.torn))tips.push('Une croche a coûté un trait.');
  if(G.wind.on&&G.wind.k>.5)tips.push('La tramontane a pesé sur le retour.');
  const lines=[head,'<div class="tw-sum"><div><b>'+nf(kg)+' kg</b><span>pêchés en '+G.trawls.length+' trait'+(G.trawls.length>1?'s':'')+'</span></div><div><b>'+nf(sale)+' €</b><span>vente estimée</span></div><div class="neg"><b>− '+nf(fe)+' €</b><span>'+nf(G.fuel)+' L de gasoil</span></div><div class="'+(res>=0?'pos':'neg')+'"><b>'+(res>=0?'':'− ')+nf(Math.abs(res))+' €</b><span>résultat de la journée</span></div></div>'+tips.join(' ')+
   ' Prochaine étape : la <b>criée</b>, où le poisson est vendu aux enchères.<div class="tw-fine">Prix moyen à la criée ≈ 5 €/kg, gasoil 0,70 €/L. Captures et fonds : fictifs, pour le jeu. Consommations : ordres de grandeur d’un chalutier (8 nœuds : 100 L/h ; 10 nœuds : 138 L/h ; 12 nœuds : 300 L/h ; en pêche à 4,5 nœuds : 138 L/h). Règles réelles : chalut interdit dans la bande des 3 milles et au-delà de 1 000 m de fond ; tailles minimales, par exemple merlu 20 cm, rouget 11 cm, sole 20 cm (règlement UE 1967/2006).</div>'];
  say(lines,()=>{twClose();const c=document.getElementById('criee');if(c)c.scrollIntoView({behavior:'smooth'});},{last:'Direction la criée →'});
  setTimeout(()=>{const nav=$('tw-nav');if(nav&&!$('tw-again')){const b=document.createElement('button');b.className='tw-btn alt';b.id='tw-again';b.textContent='Rejouer';b.onclick=()=>{b.remove();talk=null;$('tw-talk').hidden=true;start();};nav.insertBefore(b,$('tw-next'));showLine();}},30);}

/* ================= quai : les bacs ================= */
const QB={w:92,h:27,px:420,deck:455};
function qT(){const sc=portrait?.88:1,cx=portrait?300:0,oy=portrait?(LH-720*sc)/2:0;return{sc,cx,oy};}
function toScene(p){const q=qT();return[p[0]/q.sc+q.cx,(p[1]-q.oy)/q.sc];}
function slot(i){return[i<4?738:848,QB.deck-((i%4)+1)*QB.h];}
function quaiDown(p){const s=toScene(p),b=G.boxes;if(b.pile<=0||b.drag)return;const top=QB.deck-b.pile*QB.h;
  if(s[0]>QB.px-20&&s[0]<QB.px+QB.w+20&&s[1]>top-30&&s[1]<QB.deck+10){b.pile--;b.drag={x:QB.px,y:QB.deck-(b.pile+1)*QB.h,dx:s[0]-QB.px,dy:s[1]-(QB.deck-(b.pile+1)*QB.h),s0:s,mv:0};}}
function quaiMove(p){const b=G.boxes;if(!b.drag)return;const s=toScene(p);b.drag.mv=Math.max(b.drag.mv,Math.hypot(s[0]-b.drag.s0[0],s[1]-b.drag.s0[1]));b.drag.x=s[0]-b.drag.dx;b.drag.y=s[1]-b.drag.dy;}
function quaiUp(){const b=G.boxes,d=b.drag;if(!d)return;b.drag=null;const cxb=d.x+QB.w/2,cyb=d.y+QB.h/2;
  if(d.mv<12||(cxb>690&&cxb<1110&&cyb>300&&cyb<470))b.fly.push({x0:d.x,y0:d.y,to:slot(b.done+b.fly.length),t:0});else b.pile++;}
function updQuai(dt){const b=G.boxes;for(const f of b.fly)f.t+=dt*2.2;const land=b.fly.filter(f=>f.t>=1);if(land.length){b.done+=land.length;G.t+=2*land.length;b.fly=b.fly.filter(f=>f.t<1);}
  if(b.done>=8&&!b.fin&&!talk){b.fin=true;setTimeout(()=>{if(!G)return;say(['Parfait, les bacs sont à l’abri. On largue bientôt : monte avec moi dans la <b>timonerie</b>, en haut.'],()=>{G.fadeDir=1;G.fadeCb=toSea;},{last:'Monter en cabine →'});},500);}}
function toSea(){G.scene='sea';G.phase='plan';G.t=Math.max(G.t,170);G.boat={x:S0[0],y:S0[1],h:180*D2R,spd:0};setTimeout(()=>{if(G)say(cabinLines(),null,{last:'À toi de jouer →'});},700);}
function boxAt(x,y,a){ctx.save();ctx.globalAlpha=a==null?1:a;ctx.fillStyle='#7FA8D8';rr(x,y,QB.w,QB.h,4);ctx.fill();ctx.fillStyle='#5E88BD';ctx.fillRect(x+3,y+QB.h-7,QB.w-6,4);ctx.fillStyle='#2D4E80';rr(x+10,y+7,16,6,3);ctx.fill();rr(x+QB.w-26,y+7,16,6,3);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,QB.w-1,QB.h-1);ctx.restore();}
function trawlerSide(tt,night){
  // coque
  ctx.fillStyle='#0012B5';ctx.beginPath();ctx.moveTo(150,432);ctx.quadraticCurveTo(700,440,1215,392);ctx.lineTo(1185,500);ctx.quadraticCurveTo(1150,560,1040,562);ctx.lineTo(240,562);ctx.quadraticCurveTo(170,556,158,520);ctx.closePath();ctx.fill();
  ctx.fillStyle='#F2F5F9';ctx.beginPath();ctx.moveTo(150,432);ctx.quadraticCurveTo(700,440,1215,392);ctx.lineTo(1208,418);ctx.quadraticCurveTo(700,466,152,458);ctx.closePath();ctx.fill();
  ctx.fillStyle='#C4613A';ctx.fillRect(166,532,1004,10);
  // portique, enrouleur, panneau
  ctx.strokeStyle='#C9CFD8';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(172,440);ctx.lineTo(196,238);ctx.lineTo(238,238);ctx.lineTo(250,440);ctx.stroke();
  ctx.fillStyle='#8B3A22';rr(128,300,40,72,6);ctx.fill();ctx.fillStyle='#FFB23A';ctx.fillRect(204,232,8,8);
  if(night){const cone=ctx.createLinearGradient(0,240,0,455);cone.addColorStop(0,'rgba(255,236,170,.32)');cone.addColorStop(1,'rgba(255,236,170,.05)');ctx.fillStyle=cone;ctx.beginPath();ctx.moveTo(206,240);ctx.lineTo(560,455);ctx.lineTo(200,455);ctx.fill();}
  ctx.fillStyle='#2E6B3C';ctx.beginPath();ctx.arc(318,392,52,0,TAU);ctx.fill();ctx.strokeStyle='rgba(180,230,190,.4)';ctx.lineWidth=1;for(let i=0;i<9;i++){ctx.beginPath();ctx.arc(318,392,12+i*5,0,TAU);ctx.stroke();}ctx.fillStyle='#FF7A1A';for(let i=0;i<6;i++){const a=i*1.05+tt*.2;ctx.beginPath();ctx.arc(318+Math.cos(a)*44,392+Math.sin(a)*44,5,0,TAU);ctx.fill();}
  ctx.fillStyle='#5B6272';ctx.fillRect(312,392,12,64);
  // abri avant + timonerie
  ctx.fillStyle='#E9EEF3';ctx.beginPath();ctx.moveTo(690,338);ctx.lineTo(1125,322);ctx.lineTo(1125,452);ctx.lineTo(690,458);ctx.closePath();ctx.fill();
  const ig=ctx.createLinearGradient(0,345,0,458);ig.addColorStop(0,'#2A2418');ig.addColorStop(1,'#141009');ctx.fillStyle=ig;rr(708,350,398,108,10);ctx.fill();
  const lg=ctx.createRadialGradient(900,356,4,900,380,210);lg.addColorStop(0,'rgba(255,210,130,.5)');lg.addColorStop(1,'rgba(255,210,130,0)');ctx.fillStyle=lg;ctx.fillRect(708,350,398,108);
  ctx.fillStyle='#FFE2A6';ctx.fillRect(892,352,18,5);
  ctx.fillStyle='#F4F7FB';rr(810,212,250,122,10);ctx.fill();ctx.fillStyle='#0012B5';ctx.fillRect(810,300,250,8);
  for(let i=0;i<4;i++){ctx.fillStyle=night?'#FFD58A':'#A9CDEB';ctx.globalAlpha=.85;rr(826+i*58,232,48,40,5);ctx.fill();ctx.globalAlpha=1;}
  ctx.fillStyle='#D5DBE3';ctx.fillRect(800,204,270,10);ctx.fillStyle='#C9CFD8';ctx.fillRect(1000,110,7,96);ctx.fillRect(960,150,90,5);
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(1003,106,5,0,TAU);ctx.fill();if(night){const mg=ctx.createRadialGradient(1003,106,2,1003,106,26);mg.addColorStop(0,'rgba(255,255,255,.6)');mg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=mg;ctx.fillRect(977,80,52,52);}
}
function drawQuai(){const tt=G.anim,q=qT();
  let g=ctx.createLinearGradient(0,0,0,LH);g.addColorStop(0,'#030818');g.addColorStop(.6,'#0B1A40');g.addColorStop(1,'#030A1C');ctx.fillStyle=g;ctx.fillRect(0,0,LW,LH);
  ctx.save();ctx.translate(0,q.oy);ctx.scale(q.sc,q.sc);ctx.translate(-q.cx,0);
  for(let i=0;i<120;i++){const x=(i*211)%1300,y=(i*97)%330;ctx.fillStyle='rgba(255,255,255,'+(.25+.35*Math.abs(Math.sin(tt+i)))+')';ctx.fillRect(x,y,1.5,1.5);}
  // mont Saint-Clair et maisons
  ctx.fillStyle='#122044';ctx.beginPath();ctx.moveTo(300,480);ctx.quadraticCurveTo(620,300,900,210);ctx.quadraticCurveTo(1100,190,1300,300);ctx.lineTo(1300,480);ctx.fill();
  croix(1100,224,40,true);
  for(let i=0;i<70;i++){const x=380+(i*53)%900,y=300+((i*37)%150);if(y<560-(x-300)*.3&&y>235+Math.abs(x-950)*.25){ctx.fillStyle=i%3?'#FFCF7A':'#FFE7B0';ctx.globalAlpha=.55+.4*Math.sin(i);ctx.fillRect(x,y,4,5);ctx.globalAlpha=1;}}
  // quai
  ctx.fillStyle='#1B2233';ctx.fillRect(0,470,1300,80);ctx.fillStyle='#2A3348';ctx.fillRect(0,466,1300,8);
  for(const lx of [80,520,1000]){ctx.fillStyle='#39404F';ctx.fillRect(lx,330,5,140);ctx.fillRect(lx-2,330,26,4);const gl=ctx.createRadialGradient(lx+20,338,2,lx+20,338,120);gl.addColorStop(0,'rgba(255,190,90,.55)');gl.addColorStop(1,'rgba(255,190,90,0)');ctx.fillStyle=gl;ctx.fillRect(lx-110,220,260,260);ctx.fillStyle='#FFD48A';ctx.beginPath();ctx.arc(lx+20,338,5,0,TAU);ctx.fill();}
  ctx.fillStyle='#10151F';for(const bx of [240,1060]){rr(bx,452,18,16,4);ctx.fill();}
  ctx.strokeStyle='#8C7A5C';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(249,458);ctx.lineTo(200,442);ctx.moveTo(1069,458);ctx.lineTo(1150,418);ctx.stroke();
  trawlerSide(tt,true);
  // bacs
  const b=G.boxes;for(let i=0;i<b.pile;i++)boxAt(QB.px,QB.deck-(i+1)*QB.h);
  for(let i=0;i<b.done;i++){const s=slot(i);boxAt(s[0],s[1]);}
  // pavois devant les bacs posés
  ctx.fillStyle='#F2F5F9';ctx.beginPath();ctx.moveTo(152,458);ctx.quadraticCurveTo(700,466,1208,418);ctx.lineTo(1206,428);ctx.quadraticCurveTo(700,476,154,468);ctx.closePath();ctx.fill();
  for(const f of b.fly){const e=1-Math.pow(1-Math.min(1,f.t),3);const x=f.x0+(f.to[0]-f.x0)*e,y=f.y0+(f.to[1]-f.y0)*e-Math.sin(e*Math.PI)*90;boxAt(x,y);}
  if(b.drag)boxAt(b.drag.x,b.drag.y,.95);
  // eau
  g=ctx.createLinearGradient(0,540,0,900);g.addColorStop(0,'rgba(6,20,52,.94)');g.addColorStop(1,'#020814');ctx.fillStyle=g;ctx.fillRect(-400,540,2200,900);
  for(const lx of [100,540,1020,900]){for(let k=0;k<14;k++){const y=548+k*12,w=10+Math.sin(tt*2+k)*6;ctx.fillStyle='rgba(255,200,110,'+(.35-k*.022)+')';ctx.fillRect(lx+Math.sin(tt*1.5+k*.8)*6-w/2,y,w,3);}}
  // flèche d'aide
  if(b.done<8&&!b.drag){const p=.5+.5*Math.sin(tt*4);ctx.strokeStyle='rgba(0,255,255,'+(.5+.4*p)+')';ctx.lineWidth=4;ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(530,300);ctx.quadraticCurveTo(620,190,720,300);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(0,255,255,.9)';ctx.beginPath();ctx.moveTo(730,316);ctx.lineTo(706,302);ctx.lineTo(726,290);ctx.fill();
    txt('Glisse ou touche la pile',625,168,'800 17px Mukta,sans-serif','#00FFFF','center');txt('↓ abri à l’avant du pont',905,378,'800 14px Mukta,sans-serif','#FFE2A6','center');}
  ctx.restore();
  // HUD
  ctx.fillStyle='rgba(5,10,42,.75)';rr(16,16,portrait?420:300,portrait?96:66,14);ctx.fill();
  txt('PORT DE SÈTE · '+clk(G.t),30,portrait?52:42,'800 15px Mukta,sans-serif','#FFE9A8');
  txt('Bacs rangés : '+b.done+' / 8',30,portrait?88:66,'700 14px Mukta,sans-serif','#00FFFF');
}


function croix(x,y,h,lit,dark){const w=h*.56,lw=Math.max(1.4,h*.13);ctx.save();ctx.lineCap='square';
  if(lit){const g=ctx.createRadialGradient(x,y-h*.6,1,x,y-h*.6,h*1.4);g.addColorStop(0,'rgba(255,240,190,.55)');g.addColorStop(1,'rgba(255,240,190,0)');ctx.fillStyle=g;ctx.fillRect(x-h*1.4,y-h*2,h*2.8,h*2.8);}
  ctx.strokeStyle=lit?'#FFF2C2':dark?'#4F5A66':'#F1F3F5';ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x,y+lw*.3);ctx.lineTo(x,y-h);ctx.moveTo(x-w/2,y-h*.7);ctx.lineTo(x+w/2,y-h*.7);ctx.stroke();ctx.restore();}
function startArrival(){const B=G.boat;B.spd=0;G.dest=null;G.via=null;G.phase='docked';G.arr=G.t;let kg=0;for(const T of G.trawls)kg+=T.kgTot;
  G.fadeDir=1;G.fadeCb=()=>{G.scene='arrivee';G.unl={n:Math.max(1,Math.round(kg/25)),launched:0,done:0,fly:[],tm:0,fin:false};};}
function updArr(dt){const U=G.unl;if(!U||G.fadeDir)return;U.tm+=dt;
  if(U.tm>1.2&&U.launched<U.n&&U.tm-1.2>U.launched*.32){U.fly.push({t:0,i:U.launched});U.launched++;}
  for(const f of U.fly)f.t+=dt*1.5;const l=U.fly.filter(f=>f.t>=1).length;if(l){U.done+=l;U.fly=U.fly.filter(f=>f.t<1);}
  if(U.done>=U.n&&!U.fin&&!talk){U.fin=true;setTimeout(()=>{if(G&&G.scene==='arrivee')finish(false);},900);}}
function boxS(x,y,s,fish){ctx.save();ctx.translate(x,y);ctx.scale(s,s);boxAt(0,0);if(fish){ctx.fillStyle='#DDE6F0';for(let k=0;k<5;k++){ctx.beginPath();ctx.ellipse(12+k*17,2,9,4,-.2+k*.1,0,TAU);ctx.fill();}ctx.fillStyle='#E9EFF5';ctx.fillRect(4,-1,QB.w-8,3);}ctx.restore();}
const PAL={x0:752,dx:78,cols:6,base:494,bh:16,bs:.58};
function palSlot(i){const c=i%PAL.cols,r=Math.floor(i/PAL.cols);return[PAL.x0+c*PAL.dx,PAL.base-(r+1)*PAL.bh];}
function drawArrivee(){const tt=G.anim,U=G.unl||{n:0,launched:0,done:0,fly:[]},late=G.arr>T_CRIEE,sc=portrait?.65:1,cxo=portrait?180:0,oy=portrait?(LH-720*.65)/2-40:0;
  const e=sunPos(G.arr).el,[top,hor]=kf(SKY,Math.max(e,4));let g=ctx.createLinearGradient(0,0,0,LH);g.addColorStop(0,S(top));g.addColorStop(.55,S(lerpC(hor,[255,200,140],.35)));g.addColorStop(1,S(hor));ctx.fillStyle=g;ctx.fillRect(0,0,LW,LH);
  const fs0=FS;FS=1;ctx.save();ctx.translate(0,oy);ctx.scale(sc,sc);ctx.translate(-cxo,0);
  if(portrait){const gw=ctx.createLinearGradient(0,600,0,1400);gw.addColorStop(0,'#3F7FB0');gw.addColorStop(1,'#0B2E55');ctx.fillStyle=gw;ctx.fillRect(-400,600,2200,1200);}
  // soleil bas sur l'étang, à l'ouest
  const sy=420-e*6;const sg=ctx.createRadialGradient(150,sy,6,150,sy,160);sg.addColorStop(0,'rgba(255,236,190,.95)');sg.addColorStop(1,'rgba(255,200,140,0)');ctx.fillStyle=sg;ctx.fillRect(-20,sy-170,340,340);ctx.fillStyle='#FFF1D0';ctx.beginPath();ctx.arc(150,sy,20,0,TAU);ctx.fill();
  // mont Saint-Clair, pins, maisons, croix
  ctx.fillStyle='#7E8C66';ctx.beginPath();ctx.moveTo(-60,470);ctx.quadraticCurveTo(250,260,560,196);ctx.quadraticCurveTo(760,168,980,250);ctx.quadraticCurveTo(1150,300,1340,330);ctx.lineTo(1340,480);ctx.lineTo(-60,480);ctx.fill();
  for(let i=0;i<46;i++){const x=(i*97)%1300,y=250+((i*53)%150);const hy=x<560?470-(x+60)*.49:x<980?196+Math.pow((x-690)/300,2)*55:250+(x-980)*.28;if(y<hy+8)continue;ctx.fillStyle='#4E6A3E';ctx.beginPath();ctx.ellipse(x,y,16,9,0,0,TAU);ctx.fill();}
  const HC=['#EBC9A0','#F4E3C4','#DE9A72','#F1D9B0','#CF8466','#EEE6D6'];for(let i=0;i<60;i++){const x=40+(i*41)%1200,y=300+((i*67)%120);const hy=x<560?470-(x+60)*.49:x<980?196+Math.pow((x-690)/300,2)*55:250+(x-980)*.28;if(y<hy+22)continue;ctx.fillStyle=HC[i%6];ctx.fillRect(x,y,22,14);ctx.fillStyle='#B4553A';ctx.fillRect(x-1,y-3,24,4);}
  croix(690,190,44,false);
  // façades du quai, en fond
  for(let i=0;i<12;i++){const x=i*62-10,w=60,h=78+((i*29)%40);ctx.fillStyle=HC[(i*5)%6];ctx.fillRect(x,470-h,w,h);ctx.fillStyle='#B4553A';ctx.fillRect(x-2,470-h-5,w+4,6);
    for(let r=0;r<Math.floor(h/26);r++)for(let c=0;c<3;c++){ctx.fillStyle='#3A4A5C';ctx.fillRect(x+8+c*17,470-h+10+r*26,9,13);ctx.fillStyle=(i%2)?'#2F7D6A':'#3C6FB0';ctx.fillRect(x+5+c*17,470-h+10+r*26,3,13);ctx.fillRect(x+17+c*17,470-h+10+r*26,3,13);}}
  ctx.fillStyle='#CFC4AE';ctx.fillRect(-20,468,1340,12);
  // eau
  g=ctx.createLinearGradient(0,480,0,900);g.addColorStop(0,'#3F7FB0');g.addColorStop(1,'#123E6E');ctx.fillStyle=g;ctx.fillRect(-400,480,2200,900);
  for(let k=0;k<22;k++){const y=490+k*10,w=18+Math.sin(tt*2+k)*8;ctx.fillStyle='rgba(255,226,170,'+(.5-k*.02)+')';ctx.fillRect(150+Math.sin(tt*1.4+k*.7)*10-w/2,y,w,3);}
  for(let i=0;i<30;i++){const x=(i*173+tt*8)%1300,y=500+(i*37)%260;ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+9,y-3,x+18,y);ctx.stroke();}
  // quai de la criée
  ctx.fillStyle='#D9D0BD';ctx.fillRect(700,480,640,16);ctx.fillStyle='#B6AB95';ctx.fillRect(700,496,640,110);ctx.strokeStyle='rgba(90,80,60,.25)';ctx.lineWidth=1;for(let y=512;y<606;y+=18){ctx.beginPath();ctx.moveTo(700,y);ctx.lineTo(1340,y);ctx.stroke();}for(let x=720;x<1340;x+=46){ctx.beginPath();ctx.moveTo(x,496);ctx.lineTo(x,606);ctx.stroke();}
  ctx.fillStyle='#2A2F38';rr(716,470,16,14,4);ctx.fill();
  // la criée
  ctx.fillStyle='#C9D1DA';ctx.fillRect(786,244,500,20);ctx.fillStyle='#F2F4F6';ctx.fillRect(800,262,474,222);
  ctx.fillStyle='#0012B5';ctx.fillRect(800,272,474,48);txt('CRIÉE DE SÈTE',1037,306,'800 30px Mukta,sans-serif','#FFFFFF','center');
  const t=G.arr||0,hh=(t/60)%12,mm=t%60;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(1037,352,22,0,TAU);ctx.fill();ctx.strokeStyle='#0012B5';ctx.lineWidth=3;ctx.stroke();ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(1037,352);ctx.lineTo(1037+Math.sin(hh/12*TAU)*11,352-Math.cos(hh/12*TAU)*11);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(1037,352);ctx.lineTo(1037+Math.sin(mm/60*TAU)*17,352-Math.cos(mm/60*TAU)*17);ctx.stroke();
  for(let i=0;i<3;i++){const dx=822+i*146;if(!late){ctx.fillStyle='#2A2F3A';ctx.fillRect(dx,384,122,100);const lg=ctx.createRadialGradient(dx+61,400,4,dx+61,420,110);lg.addColorStop(0,'rgba(255,214,150,.55)');lg.addColorStop(1,'rgba(255,214,150,0)');ctx.fillStyle=lg;ctx.fillRect(dx,384,122,100);
      if(i===1){ctx.fillStyle='#0B0F18';ctx.fillRect(dx+16,394,90,34);txt((8+Math.sin(tt*2)*.4).toFixed(2).replace('.',',')+' €',dx+61,418,'800 18px "Courier New",monospace','#FF4D3D','center');}
      for(let k=0;k<6;k++){ctx.fillStyle='#15181F';ctx.beginPath();ctx.arc(dx+12+k*20,462+Math.sin(tt*3+k+i)*1.5,7,0,TAU);ctx.fill();ctx.fillRect(dx+5+k*20,468,14,16);}}
    else{ctx.fillStyle='#A8B1BB';ctx.fillRect(dx,384,122,100);ctx.strokeStyle='rgba(60,70,80,.35)';for(let y=390;y<484;y+=7){ctx.beginPath();ctx.moveTo(dx,y);ctx.lineTo(dx+122,y);ctx.stroke();}}}
  if(late){ctx.fillStyle='#C4613A';rr(930,410,176,40,8);ctx.fill();txt('VENTE TERMINÉE',1018,436,'800 16px Mukta,sans-serif','#fff','center');}
  // bateau à quai (réduit)
  ctx.save();ctx.translate(-57,287);ctx.scale(.58,.58);trawlerSide(tt,false);
  const left=Math.max(0,U.n-U.launched);for(let i=0;i<Math.min(8,left);i++)boxS(QB.px,QB.deck-(i+1)*QB.h,1,true);
  ctx.fillStyle='#F2F5F9';ctx.beginPath();ctx.moveTo(152,458);ctx.quadraticCurveTo(700,466,1208,418);ctx.lineTo(1206,428);ctx.quadraticCurveTo(700,476,154,468);ctx.closePath();ctx.fill();ctx.restore();
  ctx.strokeStyle='#8C7A5C';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(640,520);ctx.lineTo(722,474);ctx.stroke();
  // palettes et bacs débarqués
  for(let c=0;c<PAL.cols;c++){ctx.fillStyle='#B98A55';ctx.fillRect(PAL.x0+c*PAL.dx-4,PAL.base,62,6);}
  for(let i=0;i<U.done;i++){const p=palSlot(i);boxS(p[0],p[1],PAL.bs,true);}
  const src=[-57+(QB.px)*.58,287+(QB.deck-QB.h*Math.min(8,left+1))*.58];
  for(const f of U.fly){const e2=1-Math.pow(1-Math.min(1,f.t),3),p=palSlot(U.done+U.fly.indexOf(f));const x=src[0]+(p[0]-src[0])*e2,y=src[1]+(p[1]-src[1])*e2-Math.sin(e2*Math.PI)*110;boxS(x,y,PAL.bs,true);}
  // mouettes
  for(let i=0;i<6;i++){const x=(i*230+tt*(30+i*6))%1400-60,y=120+i*28+Math.sin(tt+i)*10,s=10,fl=Math.sin(tt*6+i);ctx.strokeStyle='rgba(250,250,250,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-s,y-s*fl*.5);ctx.quadraticCurveTo(x-s*.4,y-s*(.4+fl*.4),x,y);ctx.quadraticCurveTo(x+s*.4,y-s*(.4+fl*.4),x+s,y-s*fl*.5);ctx.stroke();}
  ctx.restore();FS=fs0;
  // HUD
  ctx.fillStyle='rgba(5,10,42,.78)';rr(16,16,portrait?470:340,portrait?96:66,14);ctx.fill();
  txt('CRIÉE DE SÈTE · '+clk(G.arr),30,portrait?52:42,'800 15px Mukta,sans-serif',late?'#FF9A7A':'#FFE9A8');
  txt((late?'Bacs en chambre froide : ':'Bacs débarqués : ')+U.done+' / '+U.n,30,portrait?88:66,'700 14px Mukta,sans-serif','#00FFFF');
  const bw=portrait?170:120,bh=portrait?54:36;G.ui.skip=U.fin?null:[LW-bw-20,LH-bh-20,bw,bh];if(G.ui.skip){ctx.fillStyle='rgba(5,10,42,.78)';rr(G.ui.skip[0],G.ui.skip[1],bw,bh,bh/2);ctx.fill();txt('Passer →',G.ui.skip[0]+bw/2,G.ui.skip[1]+bh*.66,'800 14px Mukta,sans-serif','#fff','center');}}


/* ================= virage du chalut : le patron descend sur le pont ================= */
function updVir(dt){const V=G.vir;if(!V||talk)return;const t0=V.t;V.t=Math.min(V.dur,V.t+dt);const k=(V.t-t0)/V.dur;G.t+=V.gm*k;G.fuel+=IDLE_LH*V.gm*k/60;
  const T=V.T,nF=Math.round(clamp(T.kgTot*.55,T.torn?10:24,150)),nW=T.waste>=1?Math.min(4,Math.round(T.waste)):0;
  if(!V.skipped&&V.t>5.4&&V.t<7.3){const want=Math.round((nF+nW)*clamp((V.t-5.4)/1.6,0,1));while(V.spawned<want){const i=V.spawned++,w=i>=nF;
    let col='#C6D2DE';if(!w){let r=Math.random()*T.kgTot,acc=0;for(const [k2,,,c] of SP){acc+=T.kg[k2]||0;if(r<=acc){col=c;break;}}}
    V.fish.push({x:640+rnd(-22,22),y:452,vx:rnd(-150,150),vy:rnd(-40,40),a:rnd(0,6.3),va:rnd(-8,8),c:w?(i%2?'#2F8FE0':'#F2F4F6'):col,w,st:false,ly:rnd(588,640),s:rnd(.8,1.25)});}}
  if(!V.skipped&&V.t>7.5){V.sortT+=dt;const nb=clamp(Math.round(T.kgTot/25),1,8),st=V.fish.filter(f=>f.st&&!f.fly&&!f.gone);const per=Math.max(1,Math.ceil(V.fish.length/nb));
    while(V.sortT>.04&&st.length){V.sortT-=.04;const f=st.shift();const j=V.sortI++;f.fly={t:0,x0:f.x,y0:f.y,b:Math.min(nb-1,Math.floor(j/per))};}}
  for(const f of V.fish){if(f.fly&&!f.gone){f.fly.t+=dt*2.4;if(f.fly.t>=1){f.gone=true;V.boxFill[f.fly.b]++;}}}
  for(const f of V.fish){if(f.st)continue;f.vy+=1100*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.a+=f.va*dt;f.x=clamp(f.x,500,780);if(f.y>=f.ly){f.y=f.ly;f.st=true;}}
  if(V.t>=V.dur&&!V.done){V.done=true;if(V.skipped){V.fish=[];const n=nF+nW;for(let i=0;i<n;i++){const w=i>=nF;V.fish.push({x:rnd(510,770),y:rnd(588,640),a:rnd(0,6.3),c:w?'#2F8FE0':SP[i%SP.length][3],w,st:true,s:1});}}if(V.skipped){const nb=clamp(Math.round(T.kgTot/25),1,8);for(let b=0;b<nb;b++)V.boxFill[b]=9;V.fish=[];}setTimeout(()=>{if(G&&G.scene==='virage')showHaul();},500);}}
function fishSide(x,y,a,s,c){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.scale(s,s);ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,13,4.6,0,0,TAU);ctx.fill();ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(-19,-6);ctx.lineTo(-19,6);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillRect(-6,-2.5,12,1.4);ctx.fillStyle='#0A0A1F';ctx.beginPath();ctx.arc(8,-1,1.1,0,TAU);ctx.fill();ctx.restore();}
function mesh(x,y,w,h,off,col){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.strokeStyle=col;ctx.lineWidth=1.2;for(let i=-h;i<w+h;i+=9){ctx.beginPath();ctx.moveTo(x+i+off%9,y);ctx.lineTo(x+i+off%9+h,y+h);ctx.moveTo(x+i-off%9+h,y);ctx.lineTo(x+i-off%9,y+h);ctx.stroke();}ctx.restore();}
function bag(cx,cy,s,fill,t,torn){ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);
  ctx.fillStyle='#2F6B3F';ctx.beginPath();ctx.moveTo(-18,-70);ctx.bezierCurveTo(-30,-40,-62*fill-10,-10,-58*fill-8,30);ctx.bezierCurveTo(-50*fill-8,70,50*fill+8,70,58*fill+8,30);ctx.bezierCurveTo(62*fill+10,-10,30,-40,18,-70);ctx.closePath();ctx.fill();
  if(fill>.25){for(let i=0;i<Math.round(26*fill);i++){const a=i*2.4,r=(i*13%40)/40*48*fill;ctx.fillStyle=i%3?'rgba(220,230,240,.8)':'rgba(190,205,220,.8)';ctx.beginPath();ctx.ellipse(Math.cos(a)*r,18+Math.sin(a)*r*.55,7,2.6,a,0,TAU);ctx.fill();}}
  ctx.save();ctx.beginPath();ctx.moveTo(-18,-70);ctx.bezierCurveTo(-30,-40,-62*fill-10,-10,-58*fill-8,30);ctx.bezierCurveTo(-50*fill-8,70,50*fill+8,70,58*fill+8,30);ctx.bezierCurveTo(62*fill+10,-10,30,-40,18,-70);ctx.closePath();ctx.clip();
  ctx.strokeStyle='rgba(150,220,160,.55)';ctx.lineWidth=1;for(let i=-90;i<90;i+=8){ctx.beginPath();ctx.moveTo(i,-80);ctx.lineTo(i+60,80);ctx.moveTo(i+60,-80);ctx.lineTo(i,80);ctx.stroke();}ctx.restore();
  if(torn){ctx.fillStyle='rgba(20,40,60,.9)';ctx.beginPath();ctx.ellipse(18,20,14,20,.4,0,TAU);ctx.fill();ctx.strokeStyle='#2F6B3F';ctx.lineWidth=2;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(10+i*4,4);ctx.lineTo(8+i*5,-4+(i%2)*6);ctx.stroke();}}
  ctx.fillStyle='#FF7A1A';ctx.beginPath();ctx.ellipse(0,58*Math.max(.55,fill)+10,10,5,0,0,TAU);ctx.fill();
  for(let i=0;i<4;i++){const ph=(t*1.7+i*.27)%1;ctx.fillStyle='rgba(200,230,255,'+(.7*(1-ph))+')';ctx.beginPath();ctx.arc(-20+i*13,62+ph*60,2,0,TAU);ctx.fill();}
  ctx.restore();}
function person(x,y,h,jacket,back,t){const s=h/100;ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle='#1E2733';ctx.fillRect(-16,-40,13,40);ctx.fillRect(3,-40,13,40);
  ctx.fillStyle=jacket;ctx.beginPath();ctx.moveTo(-24,-40);ctx.lineTo(-20,-78);ctx.quadraticCurveTo(0,-86,20,-78);ctx.lineTo(24,-40);ctx.closePath();ctx.fill();
  ctx.fillRect(-30,-78,9,34);ctx.fillRect(21,-78,9,34);
  ctx.fillStyle=back?'#8E949B':'#E6B894';ctx.beginPath();ctx.arc(0,-92,12,0,TAU);ctx.fill();
  if(!back){ctx.fillStyle='#A7ACB2';ctx.beginPath();ctx.arc(0,-86,9,0,Math.PI);ctx.fill();}
  ctx.fillStyle='#0012B5';ctx.beginPath();ctx.arc(0,-96,12.5,Math.PI,0);ctx.fill();ctx.fillRect(back?-13:-4,-97,back?26:18,4);
  ctx.restore();}
function drawVirage(){const V=G.vir;if(!V)return;const tt=G.anim,t=V.t,T=V.T,e=sunPos(G.t).el,[top,hor]=kf(SKY,Math.max(e,3)),[sh,sb]=kf(SEA,Math.max(e,3));
  const sc=portrait?.8:1,cxo=portrait?190:0,oy=portrait?(LH-720*.8)/2-40:0;
  let g=ctx.createLinearGradient(0,0,0,LH*.45);g.addColorStop(0,S(top));g.addColorStop(1,S(hor));ctx.fillStyle=g;ctx.fillRect(0,0,LW,LH);
  if(portrait){ctx.fillStyle='#6D7A82';ctx.fillRect(0,LH*.6,LW,LH*.4);}
  const fs0=FS;FS=1;ctx.save();ctx.translate(0,oy);ctx.scale(sc,sc);ctx.translate(-cxo,0);
  const HY=232;g=ctx.createLinearGradient(0,-400,0,HY);g.addColorStop(0,S(top));g.addColorStop(1,S(hor));ctx.fillStyle=g;ctx.fillRect(-400,-400,2200,HY+400);
  for(const c of CLOUDS.slice(0,5)){const x=((c.az/TAU)*1600+tt*4)%1600-160,y=70+c.el*500;ctx.fillStyle='rgba(255,255,255,.8)';for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse(x+k*38,y-(k%2)*10,52,16,0,0,TAU);ctx.fill();}}
  g=ctx.createLinearGradient(0,HY,0,470);g.addColorStop(0,S(sh));g.addColorStop(1,S(sb));ctx.fillStyle=g;ctx.fillRect(-400,HY,2200,420);
  for(let i=0;i<50;i++){const x=(i*173+tt*12)%1700-200,y=HY+6+(i*37)%200;ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+8,y-3,x+16+y*.02,y);ctx.stroke();}
  // sillage
  for(let i=0;i<60;i++){const k=(i*37%100)/100,y=HY+4+Math.pow(k,1.6)*200,sp=8+Math.pow(k,1.6)*110,x=640+(((i*53)%100)/100-.5)*2*sp+Math.sin(tt*2+i)*3;ctx.fillStyle='rgba(255,255,255,'+(.12+.22*k)+')';ctx.beginPath();ctx.ellipse(x,y,1.5+k*9,.8+k*2.4,0,0,TAU);ctx.fill();}
  // funes vers la mer
  const winding=t<2.4;ctx.strokeStyle='#3A3F48';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(470,130);ctx.lineTo(600,HY+30);ctx.moveTo(810,130);ctx.lineTo(680,HY+30);ctx.stroke();
  // portique
  ctx.fillStyle='#C9CFD8';ctx.fillRect(392,112,20,330);ctx.fillRect(868,112,20,330);ctx.fillRect(392,100,496,22);ctx.fillStyle='#FFB23A';ctx.fillRect(630,96,20,8);
  ctx.fillStyle='#5B6272';for(const px of [470,810]){ctx.beginPath();ctx.arc(px,130,14,0,TAU);ctx.fill();}
  // pont
  ctx.fillStyle='#6D7A82';ctx.beginPath();ctx.moveTo(360,432);ctx.lineTo(920,432);ctx.lineTo(1500,760);ctx.lineTo(-220,760);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=2;for(let i=0;i<9;i++){const y=450+i*34;ctx.beginPath();ctx.moveTo(360-(y-432)*1.7,y);ctx.lineTo(920+(y-432)*1.7,y);ctx.stroke();}
  ctx.fillStyle='#EEF2F6';ctx.beginPath();ctx.moveTo(360,432);ctx.lineTo(360,404);ctx.lineTo(-220,600);ctx.lineTo(-220,760);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(920,432);ctx.lineTo(920,404);ctx.lineTo(1500,600);ctx.lineTo(1500,760);ctx.closePath();ctx.fill();
  ctx.fillStyle='#0012B5';ctx.beginPath();ctx.moveTo(360,404);ctx.lineTo(360,396);ctx.lineTo(-220,586);ctx.lineTo(-220,600);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(920,404);ctx.lineTo(920,396);ctx.lineTo(1500,586);ctx.lineTo(1500,600);ctx.closePath();ctx.fill();
  // filet qui monte sur l'enrouleur
  const rot=tt*(winding?60:t<4.4?25:0);
  if(t<2.6){const top_=418,bot=HY+26;ctx.save();ctx.fillStyle='rgba(47,107,63,.92)';ctx.beginPath();ctx.moveTo(600,bot);ctx.lineTo(680,bot);ctx.lineTo(760,top_);ctx.lineTo(520,top_);ctx.closePath();ctx.fill();ctx.clip();mesh(520,bot,240,top_-bot,rot,'rgba(160,230,170,.5)');ctx.restore();}
  // enrouleur
  ctx.fillStyle='#5B6272';ctx.beginPath();ctx.ellipse(452,478,14,62,0,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(828,478,14,62,0,0,TAU);ctx.fill();
  ctx.fillStyle='#2F6B3F';ctx.fillRect(452,420,376,116);mesh(452,420,376,116,rot,'rgba(160,230,170,.45)');ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(452,500,376,36);
  ctx.fillStyle='#FF7A1A';for(let i=0;i<7;i++){const x=470+((i*53+rot*2)%350);ctx.beginPath();ctx.ellipse(x,424,6,4,0,0,TAU);ctx.fill();}
  // matelot au treuil
  person(930,470,62,'#FF7A1A',false,tt);
  // bac de tri
  ctx.fillStyle='#B8C2CC';ctx.beginPath();ctx.moveTo(470,572);ctx.lineTo(810,572);ctx.lineTo(840,660);ctx.lineTo(440,660);ctx.closePath();ctx.fill();ctx.fillStyle='#8E99A5';ctx.fillRect(440,660,400,12);ctx.fillStyle='#D5DCE3';ctx.fillRect(470,568,340,6);
  // bacs de criée, remplis au fur et à mesure
  if(t>7.2||V.done){const nb=clamp(Math.round(T.kgTot/25),1,8);for(let b=0;b<nb;b++){const c=b%4,r=Math.floor(b/4),bx2=868+c*70-r*14,by2=606+r*44;boxS(bx2,by2,.66,V.boxFill[b]>0);}}
  // poisson déversé
  for(const f of V.fish){if(f.gone||f.fly)continue;if(f.st)(f.w?(ctx.fillStyle=f.c,ctx.fillRect(f.x-8,f.y-5,16,10)):fishSide(f.x,f.y,f.a,f.s,f.c));}
  // le cul du chalut
  let bx=640,by=330,bs=.9,fill=clamp(T.kgTot/260,.35,1.05);
  if(t>=2.4&&t<4.4){const k=(t-2.4)/2;by=330-160*k;}else if(t>=4.4&&t<5.4){const k=(t-4.4);by=170+220*k*k*(3-2*k);bs=.9+.4*k*k;}else if(t>=5.4){by=390;bs=1.3;fill=Math.max(.12,fill*(1-clamp((t-5.4)/1.7,0,1)));}
  if(t>=2.4&&!(V.skipped&&V.done)){ctx.strokeStyle='#3A3F48';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(640,108);ctx.lineTo(bx,by-70*bs);ctx.stroke();bag(bx,by,bs,fill,tt,T.torn);}
  else if(t<2.4){ctx.save();ctx.beginPath();ctx.rect(0,0,1280,HY+20);ctx.clip();bag(640,HY+70,.6,fill,tt,false);ctx.restore();}
  for(const f of V.fish){if(f.fly&&!f.gone){const nb=clamp(Math.round(T.kgTot/25),1,8),b=f.fly.b,c=b%4,r=Math.floor(b/4),tx=868+c*70-r*14+30,ty=606+r*44,e2=f.fly.t,x=f.fly.x0+(tx-f.fly.x0)*e2,y=f.fly.y0+(ty-f.fly.y0)*e2-Math.sin(e2*Math.PI)*60;f.w?(ctx.fillStyle=f.c,ctx.fillRect(x-8,y-5,16,10)):fishSide(x,y,f.a+e2*3,f.s*.9,f.c);}}
  for(const f of V.fish){if(f.gone||f.fly)continue;if(!f.st)(f.w?(ctx.fillStyle=f.c,ctx.fillRect(f.x-8,f.y-5,16,10)):fishSide(f.x,f.y,f.a,f.s,f.c));}
  // mouettes
  const nb=t>2?14:6;for(let i=0;i<nb;i++){const x=640+Math.cos(tt*(.5+i*.07)+i)*(260+i*18),y=150+Math.sin(tt*(.7+i*.05)+i*2)*70+i*6,s=9+i%3*2,fl=Math.sin(tt*7+i);ctx.strokeStyle='rgba(250,250,250,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-s,y-s*fl*.5);ctx.quadraticCurveTo(x-s*.4,y-s*(.4+fl*.4),x,y);ctx.quadraticCurveTo(x+s*.4,y-s*(.4+fl*.4),x+s,y-s*fl*.5);ctx.stroke();}
  // le patron, de dos, au premier plan
  person(portrait?330:220,760+Math.sin(tt*1.4)*2,portrait?260:300,'#1C2B4A',true,tt);
  ctx.restore();FS=fs0;
  // HUD
  const stage=T.torn&&t>=2.4?'Le filet est déchiré : une partie du poisson est perdue':t<2.4?'On vire les funes : le filet remonte sur l’enrouleur':t<4.4?'Le cul du chalut sort de l’eau':t<5.4?'On le ramène au-dessus du bac de tri':t<7.3?'On ouvre le cul : le poisson se vide':t<9.9&&!V.done?'On trie et on met en bacs · ≈ '+Math.max(1,Math.round(T.kgTot/25))+' bacs':'Vincent contrôle la pêche';
  ctx.fillStyle='rgba(5,10,42,.78)';rr(16,16,portrait?520:360,portrait?96:66,14);ctx.fill();
  txt('TRAIT N° '+T.n+' · VIRAGE · '+clk(G.t),30,portrait?52:42,'800 15px Mukta,sans-serif','#FFE9A8');txt(T.zone,30,portrait?88:66,'700 14px Mukta,sans-serif','#00FFFF');
  ctx.font=fs('800 17px Mukta,sans-serif');const tw=Math.min(LW-40,ctx.measureText(stage).width+44),th=36*FS,ty=portrait?128:94;ctx.fillStyle=T.torn&&t>=2.4?'#C4613A':'#0E8A72';rr(LW/2-tw/2,ty,tw,th,th/2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(stage,LW/2,ty+th*.66,tw-24);
  const bw=portrait?170:120,bh=portrait?54:36;G.ui.skipV=V.done?null:[LW-bw-20,LH-bh-20,bw,bh];if(G.ui.skipV){ctx.fillStyle='rgba(5,10,42,.78)';rr(G.ui.skipV[0],G.ui.skipV[1],bw,bh,bh/2);ctx.fill();txt('Passer →',G.ui.skipV[0]+bw/2,G.ui.skipV[1]+bh*.66,'800 14px Mukta,sans-serif','#fff','center');}}

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
  // mouettes
  for(const b of G.birds){const px=b.x*w,py=-h*.46+b.y*h+Math.sin(b.ph*.3)*6,s=10*b.s,fl=Math.sin(b.ph)*.6;ctx.strokeStyle=night>.5?'rgba(20,20,30,'+b.a+')':'rgba(245,247,250,'+b.a+')';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px-s,py-s*fl*.5);ctx.quadraticCurveTo(px-s*.4,py-s*(.4+fl*.4),px,py);ctx.quadraticCurveTo(px+s*.4,py-s*(.4+fl*.4),px+s,py-s*fl*.5);ctx.stroke();}
  ctx.restore();
  drawBow(x0,y0,w,h,night,tt);drawFrame(x0,y0,w,h,night);
}
function drawBow(x0,y0,w,h,night,tt){const cx=x0+w/2,by=y0+h,sy=y0+h*.66;
  if(G.boat.spd>2){for(let k=0;k<26;k++){const s=(k*37%100)/100,ph=(tt*1.6+s)%1,x=cx+(s-.5)*w*.36*(1-ph*.2),y=sy+6+ph*38;ctx.fillStyle='rgba(255,255,255,'+(.55*(1-ph))*(G.boat.spd/11)+')';ctx.beginPath();ctx.arc(x,y,2+ph*5,0,TAU);ctx.fill();}}
  const dk=night>.5?'#1A1E26':'#6E7885',bw=night>.5?'#2C323C':'#EEF2F6';
  ctx.fillStyle=bw;ctx.beginPath();ctx.moveTo(x0+w*.06,by);ctx.lineTo(cx-8,sy-6);ctx.lineTo(cx+8,sy-6);ctx.lineTo(x0+w*.94,by);ctx.closePath();ctx.fill();
  ctx.fillStyle=dk;ctx.beginPath();ctx.moveTo(x0+w*.12,by);ctx.lineTo(cx-4,sy+4);ctx.lineTo(cx+4,sy+4);ctx.lineTo(x0+w*.88,by);ctx.closePath();ctx.fill();
  const wy=by-h*.13,ww=w*.1;ctx.fillStyle=night>.5?'#23282F':'#4A535E';rr(cx-ww*.8,wy+h*.02,ww*1.6,h*.05,4);ctx.fill();ctx.fillStyle=night>.5?'#343B47':'#AEB6C0';rr(cx-ww/2,wy-h*.03,ww,h*.06,h*.03);ctx.fill();ctx.fillStyle=night>.5?'#2A3040':'#0012B5';ctx.fillRect(cx-ww*.62,wy-h*.045,ww*.1,h*.09);ctx.fillRect(cx+ww*.52,wy-h*.045,ww*.1,h*.09);
  ctx.strokeStyle=night>.5?'#3A4254':'#FFFFFF';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0+w*.1,by-h*.05);ctx.lineTo(cx-6,sy-10);ctx.lineTo(cx+6,sy-10);ctx.lineTo(x0+w*.9,by-h*.05);ctx.stroke();
  if(night>.3){const lg=ctx.createRadialGradient(cx,sy-12,1,cx,sy-12,12);lg.addColorStop(0,'rgba(255,255,255,.9)');lg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=lg;ctx.fillRect(cx-12,sy-24,24,24);}}
function statue(x,base,hh,night){const s=hh/100;ctx.save();ctx.translate(x,base);ctx.scale(s,s);
  const dim=night>.5;ctx.fillStyle=dim?'#4A3522':'#7A5634';rr(-22,-14,44,14,3);ctx.fill();
  ctx.fillStyle=dim?'#B8B2A6':'#F4F1EA';ctx.beginPath();ctx.moveTo(-16,-14);ctx.quadraticCurveTo(-14,-60,-8,-74);ctx.lineTo(8,-74);ctx.quadraticCurveTo(14,-60,16,-14);ctx.closePath();ctx.fill();
  ctx.fillStyle=dim?'#26437A':'#2F66D0';ctx.beginPath();ctx.moveTo(-10,-86);ctx.quadraticCurveTo(-24,-60,-20,-14);ctx.lineTo(-11,-14);ctx.quadraticCurveTo(-12,-55,-5,-72);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(10,-86);ctx.quadraticCurveTo(24,-60,20,-14);ctx.lineTo(11,-14);ctx.quadraticCurveTo(12,-55,5,-72);ctx.closePath();ctx.fill();
  ctx.strokeStyle=dim?'#A88A3A':'#E8C45A';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,-88,12,5,0,0,TAU);ctx.stroke();
  ctx.fillStyle=dim?'#B89C86':'#F1D6BE';ctx.beginPath();ctx.arc(0,-80,7,0,TAU);ctx.fill();
  ctx.fillStyle=dim?'#B8B2A6':'#F4F1EA';ctx.beginPath();ctx.arc(0,-83,8,Math.PI,0);ctx.fill();
  ctx.fillStyle=dim?'#B89C86':'#F1D6BE';ctx.beginPath();ctx.moveTo(-4,-50);ctx.lineTo(0,-62);ctx.lineTo(4,-50);ctx.fill();
  if(!dim){ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(-12,-60,3,40);}
  ctx.restore();}
function drawFrame(x0,y0,w,h,night){const n=portrait?3:3,pc='#11151D';
  ctx.fillStyle=pc;ctx.fillRect(x0,y0,w,14);for(let i=0;i<=n;i++){const x=x0+i*w/n;ctx.fillRect(x-(i===0||i===n?0:12),y0,i===0||i===n?14:24,h);}
  ctx.strokeStyle='rgba(20,24,32,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0+w/2+w/6,y0+h);ctx.lineTo(x0+w/2+w/6-60,y0+h-150);ctx.stroke();
  const dg=ctx.createLinearGradient(0,y0+h,0,LH);dg.addColorStop(0,'#3B2A1E');dg.addColorStop(.08,'#2A1E16');dg.addColorStop(1,'#120D0A');ctx.fillStyle=dg;ctx.fillRect(0,y0+h,LW,LH-y0-h);
  ctx.strokeStyle='rgba(255,220,180,.04)';ctx.lineWidth=1;for(let y=y0+h+20;y<LH;y+=9){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(LW,y+Math.sin(y)*3);ctx.stroke();}
  ctx.fillStyle='#4A3526';ctx.fillRect(0,y0+h-4,LW,12);ctx.fillStyle='rgba(255,230,190,.15)';ctx.fillRect(0,y0+h-4,LW,2);
  if(night>.3){const lg=ctx.createRadialGradient(LW/2,y0+h+30,10,LW/2,y0+h+30,LW*.6);lg.addColorStop(0,'rgba(255,120,60,.10)');lg.addColorStop(1,'rgba(255,120,60,0)');ctx.fillStyle=lg;ctx.fillRect(0,y0+h,LW,LH);}
  if(portrait){statue(72,y0+h+2,96,night);statue(648,y0+h+2,80,night);}else{statue(226,y0+h+2,108,night);statue(1054,y0+h+2,88,night);}}

/* ================= tableau de bord ================= */
function panel(r,title){ctx.fillStyle='#07090E';rr(r[0]-4,r[1]-4,r[2]+8,r[3]+8,14);ctx.fill();ctx.fillStyle='#0F1522';rr(r[0],r[1],r[2],r[3],10);ctx.fill();if(title)txt(title,r[0]+12,r[1]+(portrait?25:19),'700 11px "Courier New",monospace','#6FA8FF');}
function buildMap(){const m=mapRect();const oc=document.createElement('canvas');const dp=Math.min(2,window.devicePixelRatio||1)*(cv.width/LW)/(DPR)*DPR;oc.width=Math.ceil(m[2]*DPR);oc.height=Math.ceil(m[3]*DPR);const c=oc.getContext('2d');c.setTransform(DPR,0,0,DPR,-m[0]*DPR,-m[1]*DPR);
  const st=portrait?4:3;for(let py=m[1];py<m[1]+m[3];py+=st)for(let px=m[0];px<m[0]+m[2];px+=st){const q=p2m(px+st/2,py+st/2);let col;
    if(pip(q[0],q[1],THAU))col='#A9D6EE';else if(pip(q[0],q[1],LAND))col='#E8DFC6';else{const dc=distCoast(q[0],q[1]),d=depthAt(q[0],q[1],dc);col=d<50?'#CFEAF8':d<100?'#A5D4F0':d<200?'#78B6E4':d<1000?'#3F82C4':'#23579A';if(dc<3)col=d<50?'#F4CFC6':'#EDB8AE';}
    c.fillStyle=col;c.fillRect(px,py,st+.5,st+.5);}
  c.strokeStyle='#6E6250';c.lineWidth=1.2;c.beginPath();COAST.forEach((p,i)=>{const q=m2p(p[0],p[1]);i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]);});c.stroke();
  c.strokeStyle='rgba(255,255,255,.75)';c.setLineDash([4,3]);c.beginPath();EDGE.forEach((p,i)=>{const q=m2p(p[0],p[1]);i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]);});c.stroke();c.setLineDash([]);
  const fz=f=>fs(f);c.textAlign='left';
  const eq=m2p(EOL.x,EOL.y),er=EOL.r*mapFit().s;c.fillStyle='rgba(255,77,61,.28)';c.beginPath();c.arc(eq[0],eq[1],er,0,TAU);c.fill();c.strokeStyle='#E0321F';c.setLineDash([3,2]);c.lineWidth=1.3;c.stroke();c.setLineDash([]);
  c.fillStyle='#7A1E12';c.font=fz('700 8px Mukta,sans-serif');c.fillText('parc éolien',eq[0]+er+2,eq[1]-1);c.fillText('fermé à la pêche',eq[0]+er+2,eq[1]+8);
  c.fillStyle='rgba(255,255,255,.9)';c.font=fz('700 8px Mukta,sans-serif');const aq=m2p(-4,-45.5);c.fillText('accores ≈ 200 m',aq[0],aq[1]);
  const dq=m2p(22,-46.5);c.fillStyle='#fff';c.fillText('> 1 000 m : chalut interdit',dq[0],dq[1]);
  const bq=m2p(-33,-10);c.fillStyle='#9C3B2C';c.fillText('bande des 3 milles',bq[0],bq[1]);c.fillText('chalut interdit',bq[0],bq[1]+9*FS);
  for(const t of TOWNS){if(!t.lab&&t.n!=='Sète')continue;const q=m2p(t.x,t.y);c.fillStyle='#3B3226';c.beginPath();c.arc(q[0],q[1],2,0,TAU);c.fill();c.font=fz((t.n==='Sète'?'800 10px':'600 8px')+' Mukta,sans-serif');const west=t.x<-5;c.textAlign=west?'right':'left';c.fillText(t.n,q[0]+(west?-4:4),q[1]+(t.y>0?-3:3));}
  c.textAlign='left';c.font=fz('700 9px Mukta,sans-serif');c.fillStyle='#0A2A5A';
  const s=mapFit().s,sb=m2p(24,-47.8);c.fillStyle='#0A2A5A';c.fillRect(sb[0]-10*s-40,sb[1]+6-40,0,0);
  const sq=[m[0]+m[2]-10*s-12,m[1]+m[3]-10];c.strokeStyle='#0A2A5A';c.lineWidth=2;c.beginPath();c.moveTo(sq[0],sq[1]);c.lineTo(sq[0]+10*s,sq[1]);c.stroke();c.font=fz('700 8px Mukta,sans-serif');c.fillStyle='#0A2A5A';c.textAlign='center';c.fillText('10 milles',sq[0]+5*s,sq[1]-4);
  c.textAlign='left';c.font=fz('800 10px Mukta,sans-serif');c.fillStyle='#0A2A5A';c.fillText('N ↑',m[0]+6,m[1]+14*FS);
  return oc;}
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
  // zones
  for(const z of ZONES){const q=m2p(z.x,z.y);const pul=G.phase==='plan'?.5+.5*Math.sin(tt*4):0;ctx.strokeStyle='rgba(10,42,90,'+(.45+.4*pul)+')';ctx.setLineDash([3,3]);ctx.lineWidth=1.3+pul;ctx.beginPath();ctx.arc(q[0],q[1],2.2*s,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.font=fs('800 9px Mukta,sans-serif');const tw=ctx.measureText(z.n).width+8;ctx.fillStyle='rgba(255,255,255,.82)';rr(q[0]-tw/2,q[1]-2.2*s-14*FS,tw,12*FS,4);ctx.fill();ctx.fillStyle='#0A2A5A';ctx.textAlign='center';ctx.fillText(z.n,q[0],q[1]-2.2*s-5*FS);}
  // croches
  for(const c of G.croches){const q=m2p(c.x,c.y);ctx.fillStyle=c.hit?'#E0321F':'#FFB23A';ctx.beginPath();ctx.moveTo(q[0],q[1]-6);ctx.lineTo(q[0]+5.5,q[1]+4);ctx.lineTo(q[0]-5.5,q[1]+4);ctx.closePath();ctx.fill();ctx.fillStyle='#0A0A1F';ctx.font=fs('800 7px Mukta,sans-serif');ctx.textAlign='center';ctx.fillText('!',q[0],q[1]+3);}
  // traces
  ctx.lineCap='round';for(let i=1;i<G.track.length;i++){const a=G.track[i-1],b=G.track[i];const p=m2p(a[0],a[1]),q=m2p(b[0],b[1]);ctx.strokeStyle=b[2]?'#FF7A1A':'rgba(255,255,255,.85)';ctx.lineWidth=b[2]?3:1.5;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();}
  // autres bateaux
  for(const b of G.boats){if(b.st==='dock'||b.st==='home')continue;const q=m2p(b.x,b.y);ctx.save();ctx.translate(q[0],q[1]);ctx.rotate(b.h);ctx.fillStyle='#5A6576';ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(3.5,4);ctx.lineTo(-3.5,4);ctx.closePath();ctx.fill();ctx.restore();}
  // destination
  const B=G.boat,bq=m2p(B.x,B.y);
  if(G.dest){const q=m2p(G.dest[0],G.dest[1]);ctx.strokeStyle='#E0321F';ctx.setLineDash([6,4]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bq[0],bq[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(q[0],q[1],6,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(q[0]-9,q[1]);ctx.lineTo(q[0]+9,q[1]);ctx.moveTo(q[0],q[1]-9);ctx.lineTo(q[0],q[1]+9);ctx.stroke();}
  if(G.phase==='trawl'&&G.trawlTarget!=null){ctx.strokeStyle='rgba(255,122,26,.8)';ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(bq[0],bq[1]);ctx.lineTo(bq[0]+Math.sin(G.trawlTarget)*40,bq[1]-Math.cos(G.trawlTarget)*40);ctx.stroke();ctx.setLineDash([]);}
  ctx.save();ctx.translate(bq[0],bq[1]);ctx.rotate(B.h);ctx.fillStyle='#00FFFF';ctx.strokeStyle='#0A0A1F';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(0,4);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  if(G.phase==='plan'&&!G.dest){ctx.fillStyle='rgba(10,10,31,.78)';const tw=portrait?330:250;rr(m[0]+m[2]/2-tw/2,m[1]+m[3]-40*FS,tw,26*FS,13*FS);ctx.fill();txt('Touche une zone pour tracer la route',m[0]+m[2]/2,m[1]+m[3]-22*FS,'800 12px Mukta,sans-serif','#00FFFF','center');}
  compass(m,G.boat.h,(G.dest?[[brgA(G.dest[0],G.dest[1]),'#E0321F']]:[]));ctx.restore();
  drawInfo(r);}
function drawInfo(r){const iw=portrait?236:196,x=r[0]+r[2]-iw-2,y=r[1]+6,w=iw-8;ctx.fillStyle='#0A0F1A';rr(x,y,w,r[3]-12,8);ctx.fill();
  const B=G.boat,dc=distCoast(B.x,B.y),d=depthAt(B.x,B.y,dc),lx=x+10,lh=portrait?25:17;let yy=y+(portrait?26:18);
  const L1=(a,b,c)=>{txt(a,lx,yy,'700 10px Mukta,sans-serif','#7F93B8');if(b)txt(b,x+w-10,yy,'800 11px Mukta,sans-serif',c||'#E7ECFF','right');yy+=lh;};
  txt('CAP '+pad(Math.round(((B.h/D2R)%360+360)%360))+'°',lx,yy,'800 12px Mukta,sans-serif','#00FFFF');txt((B.spd.toFixed(1)).replace('.',',')+' nds',x+w-10,yy,'800 12px Mukta,sans-serif','#00FFFF','right');yy+=lh;
  L1('Fond',Math.round(d)+' m');L1('Lieu',placeName(B.x,B.y,d));
  const why=illegal(B.x,B.y);txt(why?(dc<3?'● Chalut interdit (3 milles)':why.includes('éolien')?'● Zone fermée':'● Chalut interdit'):'● Chalut autorisé',lx,yy,'800 10px Mukta,sans-serif',why?'#FF6B5A':'#3BF0A0');yy+=lh+(portrait?4:3);
  if(G.dest&&G.phase!=='return'){const dd=Math.hypot(G.dest[0]-B.x,G.dest[1]-B.y);L1('Vers',placeName(G.dest[0],G.dest[1],depthAt(G.dest[0],G.dest[1])));L1('Distance',(dd.toFixed(1)).replace('.',',')+' M');L1('Arrivée',fmtT(G.t+dd/THR[G.thr].kn*60),'#FFE9A8');}
  else if(G.phase==='return'){const dd=Math.hypot(PORT[0]-B.x,PORT[1]-B.y);L1('Vers','Sète');L1('Distance',(dd.toFixed(1)).replace('.',',')+' M');L1('Arrivée',fmtT(G.t+dd/Math.max(1,B.spd)*60),'#FFE9A8');}
  else if(G.phase==='trawl'){L1('Trait',G.tr.n+' / 3');L1('Durée',fmtT(G.tr.min).replace(' h ','h')+' / 3h');L1('Dans le sac',nf(G.tr.kgTot)+' kg','#FFE9A8');}
  else yy+=lh*3;
  yy+=portrait?2:0;const eta=G.phase==='return'?G.t+Math.hypot(PORT[0]-B.x,PORT[1]-B.y)/Math.max(1,B.spd||THR[G.thr].kn)*60:projReturn();
  txt('RETOUR CRIÉE ESTIMÉ',lx,yy,'800 9px Mukta,sans-serif','#7F93B8');yy+=portrait?24:17;txt(fmtT(eta),lx,yy,'800 17px Mukta,sans-serif',eta>T_CRIEE?'#FF6B5A':'#3BF0A0');txt(eta>T_CRIEE?'trop tard !':'avant 17 h',x+w-10,yy,'700 10px Mukta,sans-serif',eta>T_CRIEE?'#FF6B5A':'#3BF0A0','right');yy+=lh;
  if(G.phase!=='return'&&G.phase!=='end'){const pf=projFuel();L1('Gasoil prévu','≈ '+nf(Math.round(pf/10)*10)+' L');}
  G.ui.home=null;if(G.traitN>=1&&G.phase!=='trawl'&&G.phase!=='return'&&G.phase!=='haul'&&G.phase!=='end'&&G.traitN<3){const bh=portrait?34:24,by=y+r[3]-12-bh-6;G.ui.home=[lx-4,by,w-12,bh];ctx.fillStyle='#1E2A44';rr(lx-4,by,w-12,bh,bh/2);ctx.fill();txt('⚓ Rentrer à la criée',lx-4+(w-12)/2,by+bh*.68,'800 11px Mukta,sans-serif','#FFE9A8','center');}miniCmp(x,y,w,r[3]-12,G.ui.home?G.ui.home[3]+8:0);}
function drawSonar(){const r=L().son;panel(r,'SONDEUR');const x=r[0]+8,y=r[1]+(portrait?34:26),w=r[2]-16,h=r[3]-(portrait?42:34);ctx.fillStyle='#061A45';ctx.fillRect(x,y,w,h);
  const D=G.sonar;let md=40;for(const s of D)md=Math.max(md,s.d);md=Math.min(300,Math.ceil(md*1.3/20)*20);const N=160,cw=w/N;
  for(let i=0;i<D.length&&i<N;i++){const s=D[D.length-1-i],cx=x+w-(i+1)*cw,by=y+Math.min(1,s.d/md)*h;ctx.fillStyle='#6E2A18';ctx.fillRect(cx,by,cw+.6,y+h-by);ctx.fillStyle='#F04A2C';ctx.fillRect(cx,by-1,cw+.6,3);
    const n=Math.round(s.f*5);for(let k=0;k<n;k++){const hs=(s.sd*7+k*131)%100/100;const fy=by-5-hs*h*.26;if(fy<y)continue;ctx.fillStyle=s.f>.9?'#FF4D3D':s.f>.55?'#FFD23F':'#3BF0A0';ctx.fillRect(cx,fy,cw+.8,2.2);}}
  const last=D[D.length-1];txt(last?Math.round(last.d)+' m':'—',x+w-6,y+16*FS,'800 13px Mukta,sans-serif','#fff','right');txt('0',x+4,y+11*FS,'700 9px Mukta,sans-serif','#7F93B8');txt(md+' m',x+4,y+h-4,'700 9px Mukta,sans-serif','#7F93B8');
  if(last&&(G.phase==='trawl'||G.phase==='transit'||G.phase==='idle'||G.phase==='wait')){const f=last.f;txt(f>.9?'Échos forts':f>.55?'Échos moyens':'Échos faibles',x+w-6,y+h-6,'800 10px Mukta,sans-serif',f>.9?'#FF4D3D':f>.55?'#FFD23F':'#3BF0A0','right');}}
function drawGauges(){const r=L().gau;panel(r,null);const x=r[0]+12,y=r[1];const late=G.t>T_CRIEE;
  txt(clk(G.t),x,y+(portrait?64:48),'800 38px "Courier New",monospace',late?'#FF6B5A':'#FFE9A8');txt('criée : 17:00',x,y+(portrait?92:68),'700 10px Mukta,sans-serif','#7F93B8');
  const rx=portrait?x+250:x+168,rw=r[0]+r[2]-12,lh=portrait?25:19;let yy=y+(portrait?30:22);
  const L1=(a,b,c)=>{txt(a,portrait?x:rx,yy,'700 10px Mukta,sans-serif','#7F93B8');txt(b,rw,yy,'800 12px Mukta,sans-serif',c||'#E7ECFF','right');yy+=lh;};
  if(portrait)yy=y+122;
  if(portrait){txt('Trait '+Math.min(3,G.traitN+(G.phase==='trawl'?1:0))+'/3',x,yy,'800 12px Mukta,sans-serif','#00FFFF');txt('Gasoil '+nf(G.fuel)+' L · '+nf(G.fuel*FUEL_EUR)+' €',rw,yy,'800 12px Mukta,sans-serif','#FFB23A','right');
    txt(G.wind.k>.2?'Tramontane':'Vent faible',rw,y+64,'800 12px Mukta,sans-serif',G.wind.k>.2?'#FF6B5A':'#3BF0A0','right');txt(G.warp>1?'temps ×4':'',rw,y+92,'700 10px Mukta,sans-serif','#00FFFF','right');return;}
  L1('Traits',Math.min(3,G.traitN+(G.phase==='trawl'?1:0))+' / 3','#00FFFF');L1('Gasoil',nf(G.fuel)+' L','#FFB23A');L1('Coût',nf(G.fuel*FUEL_EUR)+' €','#FFB23A');L1('Vent',G.wind.k>.2?'Tramontane':'faible',G.wind.k>.2?'#FF6B5A':'#3BF0A0');
  const ng=clamp((-sunPos(G.t).el-2)/8,0,1);txt(ng>.5?'nuit':sunPos(G.t).el<8?'aube':'jour',x,y+(portrait?92:88),'700 10px Mukta,sans-serif','#7F93B8');
  if(G.warp>1)txt('temps ×4',x,y+104,'800 10px Mukta,sans-serif','#00FFFF');}
function btn(rc,label,on,col,sel){ctx.fillStyle=sel?'#00FFFF':on?(col||'#1E2A44'):'#1A1F2B';rr(rc[0],rc[1],rc[2],rc[3],10);ctx.fill();if(sel){ctx.strokeStyle='#00FFFF';ctx.lineWidth=2;ctx.stroke();}
  ctx.font=fs('800 12px Mukta,sans-serif');ctx.fillStyle=sel?'#0012B5':on?'#fff':'#5A6478';ctx.textAlign='center';ctx.fillText(label,rc[0]+rc[2]/2,rc[1]+rc[3]/2+4*FS);}
function drawCtrl(){const r=L().ctrl;panel(r,null);const u=G.ui,pul=(Math.sin(G.anim*4)+1)/2,[lab,short,on]=actLabel();
  if(portrait){const y=r[1]+8,h=r[3]-16;u.thr=[0,1,2].map(i=>[r[0]+8+i*82,y,76,h]);u.act=[r[0]+256,y,250,h];u.left=[r[0]+512,y,52,h];u.right=[r[0]+568,y,52,h];u.warp=[r[0]+626,y,62,h];}
  else{u.thr=[0,1,2].map(i=>[r[0]+8+i*98,r[1]+8,92,38]);u.act=[r[0]+8,r[1]+54,290,60];u.left=[r[0]+8,r[1]+122,62,34];u.right=[r[0]+76,r[1]+122,62,34];u.warp=[r[0]+144,r[1]+122,154,34];}
  if(G.phase==='trawl'){const a0=u.thr[0],a2=u.thr[2],bx=a0[0],bw=a2[0]+a2[2]-a0[0];ctx.fillStyle='#FF7A1A';ctx.shadowColor='#FF7A1A';ctx.shadowBlur=8+6*pul;rr(bx,a0[1],bw,a0[3],12);ctx.fill();ctx.shadowBlur=0;txt(portrait?'PÊCHE · 4,5 nds':'EN PÊCHE · CHALUT À '+String(TRAWL_KN).replace('.',',')+' nds',bx+bw/2,a0[1]+a0[3]/2+5,'800 '+(portrait?15:14)+'px Mukta,sans-serif','#0A0F1A','center');}else THR.forEach((T,i)=>{btn(u.thr[i],portrait?T.n:T.n+' '+String(T.kn).replace('.',',')+' nds',true,null,G.thr===i);});
  const a=u.act;ctx.fillStyle=on?'#FF4D3D':'#3A2A2A';ctx.shadowColor='#FF4D3D';ctx.shadowBlur=on?14+10*pul:0;rr(a[0],a[1],a[2],a[3],14);ctx.fill();ctx.shadowBlur=0;
  txt(portrait?short:lab,a[0]+a[2]/2,a[1]+a[3]/2+(portrait?6:6),'800 '+(portrait?16:18)+'px Mukta,sans-serif',on?'#fff':'#9A8A8A','center');
  const tr=G.phase==='trawl';btn(u.left,'◀',tr,'#1E2A44',G.steer<0);btn(u.right,'▶',tr,'#1E2A44',G.steer>0);btn(u.warp,portrait?'×4':(G.warp>1?'⏩ Temps ×4':'⏩ Accélérer'),G.phase!=='plan',null,G.warp>1);}
function drawTip(){const r=L().tip;panel(r,null);const fsz=portrait?62:64,cx=r[0]+12+fsz/2,cy=r[1]+r[3]/2;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,fsz/2,0,TAU);ctx.clip();if(PIMG.complete)ctx.drawImage(PIMG,cx-fsz/2,cy-fsz/2,fsz,fsz);ctx.restore();ctx.strokeStyle='#00FFFF';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,fsz/2,0,TAU);ctx.stroke();
  const B=G.boat,ph=G.phase,eta=projReturn();let t;
  if(ph==='plan')t=G.dest?'Bonne route. Choisis l’allure : plein gaz arrive plus tôt mais consomme bien plus. Puis largue les amarres.':'Touche une zone sur le traceur. Regarde l’heure d’arrivée et le retour estimé.';
  else if(ph==='wait')t='On est sur zone avant 6 h : on patiente, moteur au ralenti.';
  else if(ph==='transit')t=G.t<T_FIRST?'On fait route de nuit. En éco on consomme moins, mais on arrive plus tard.':'Il est plus de 6 h : tu peux filer le chalut ici, ou continuer.';
  else if(ph==='trawl')t=G.tr.min<60?'Le chalut travaille à 4,5 nœuds. Suis les échos du sondeur, évite les croches ⚠. ◀ ▶ pour barrer.':eta>T_CRIEE?'Oriente le trait vers Sète : tu gagneras du temps pour la criée.':'Beau travail. Tu peux virer quand tu veux, ou laisser finir les 3 heures.';
  else if(ph==='haul')t='On vire : le cul du chalut remonte, et les mouettes arrivent !';
  else if(ph==='return')t=G.wind.k>.3?'La tramontane nous freine. Tiens bon, cap sur Sète.':'Cap sur Sète. Pendant la route, l’équipage trie et met en glace.';
  else if(ph==='idle')t=G.traitN>=3?'Trois traits : rentre à la criée !':G.t<T_FIRST?'Attends 6 h pour filer le chalut.':'File le trait suivant ici, ou touche le traceur pour changer de coin.';
  else t='';
  wrap(t,r[0]+fsz+26,r[1]+(portrait?30:24),r[2]-fsz-36,portrait?15:16,'600 13px Mulish,sans-serif','#E7ECFF');}
function drawToast(){if(!G.msg)return;const W=L().win,a=Math.min(1,G.msg.life*2);ctx.save();ctx.globalAlpha=a;ctx.font=fs('800 16px Mukta,sans-serif');const tw=Math.min(W[2]-60,ctx.measureText(G.msg.t).width+40),th=34*FS;
  ctx.fillStyle=G.msg.c;rr(W[0]+W[2]/2-tw/2,W[1]+26,tw,th,th/2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(G.msg.t,W[0]+W[2]/2,W[1]+26+th*.66,tw-24);ctx.restore();}

/* ================= boucle ================= */
let last=0;
function loop(ts){if(!running)return;const dt=Math.min(.05,(ts-last)/1000||0);last=ts;
  if(cv.parentElement.clientWidth&&Math.abs(cv.width/DPR-LW)>1)resize();
  update(dt);
  if(G){if(G.scene==='quai')drawQuai();else if(G.scene==='arrivee')drawArrivee();else if(G.scene==='virage')drawVirage();else{drawFPV();drawSonar();drawTip();drawPlot();drawGauges();drawCtrl();drawToast();}
    if(G.fade>0){ctx.fillStyle='rgba(2,5,15,'+G.fade+')';ctx.fillRect(0,0,LW,LH);}}
  raf=requestAnimationFrame(loop);}
function ptr(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*LW/r.width,(e.clientY-r.top)*LH/r.height];}
cv.addEventListener('pointerdown',e=>{if(!G||talk)return;e.preventDefault();const p=ptr(e);
  if(G.scene==='quai'){quaiDown(p);return;}
  if(G.scene==='virage'){const V=G.vir;if(V&&!V.done&&inR(p,G.ui.skipV)){G.t+=V.gm*Math.max(0,1-V.t/V.dur);V.t=V.dur;V.skipped=true;}return;}
  if(G.scene==='arrivee'){if(inR(p,G.ui.skip)&&G.unl&&!G.unl.fin){G.unl.launched=G.unl.n;G.unl.fly=[];G.unl.done=G.unl.n;}return;}if(G.phase==='end')return;const u=G.ui;
  for(let i=0;i<3;i++)if(inR(p,u.thr&&u.thr[i])){G.thr=i;return;}
  if(inR(p,u.act)){act();return;}
  if(inR(p,u.warp)){if(G.phase!=='plan')G.warp=G.warp===1?4:1;return;}
  if(G.phase==='trawl'&&inR(p,u.left)){G.steer=-1;return;}if(G.phase==='trawl'&&inR(p,u.right)){G.steer=1;return;}
  if(inR(p,u.home)){goHome();return;}
  if(inR(p,mapRect())){plotClick(p2m(p[0],p[1]));return;}
  const W=L().win;if(G.phase==='trawl'&&inR(p,W))G.steer=p[0]<W[0]+W[2]/2?-1:1;});
cv.addEventListener('pointermove',e=>{if(G&&G.scene==='quai')quaiMove(ptr(e));});
window.addEventListener('pointerup',()=>{if(!G)return;G.steer=0;if(G.scene==='quai')quaiUp();});
window.addEventListener('keydown',e=>{if(!running||!G)return;if(e.code==='Escape'){twClose();return;}if(talk)return;
  if(e.code==='Space'){e.preventDefault();if(G.scene==='sea')act();}
  if(G.phase==='trawl'){if(e.code==='ArrowLeft'){G.steer=-1;e.preventDefault();}if(e.code==='ArrowRight'){G.steer=1;e.preventDefault();}}});
window.addEventListener('keyup',e=>{if(G&&(e.code==='ArrowLeft'||e.code==='ArrowRight'))G.steer=0;});
function start(){newGame();say(INTRO,null,{last:'Ranger les bacs →'});}
window.twOpen=function(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.documentElement.style.overflow='hidden';running=true;resize();start();last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);};
window.twClose=function(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.documentElement.style.overflow='';running=false;cancelAnimationFrame(raf);talk=null;$('tw-talk').hidden=true;G=null;const a=$('tw-again');if(a)a.remove();};
window.__TW={get G(){return G},get talk(){return talk},next(){$('tw-next').click();},boxes(){const b=G.boxes;b.done=8;b.pile=0;G.t=166;},go(x,y){G.dest=[x,y];G.phase='transit';},act,goHome,plot(x,y){plotClick([x,y]);}};
})();
