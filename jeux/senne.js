(function(){
const cv=document.getElementById('sg-cv');if(!cv)return;
const ctx=cv.getContext('2d'),modal=document.getElementById('sg-modal');
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
function fmtT(t){t=Math.round(t);return Math.floor(t/60)+' h '+pad(t%60);}
function clk(t){t=Math.floor(t);return pad(Math.floor(t/60)%24)+':'+pad(t%60);}
const nf=n=>Math.round(n).toLocaleString('fr-FR');
function inR(p,r){return r&&p[0]>=r[0]&&p[0]<=r[0]+r[2]&&p[1]>=r[1]&&p[1]<=r[1]+r[3];}
function pip(x,y,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if(((a[1]>y)!=(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;}
function segD(px,py,a,b){const vx=b[0]-a[0],vy=b[1]-a[1];const t=clamp(((px-a[0])*vx+(py-a[1])*vy)/(vx*vx+vy*vy),0,1);return Math.hypot(px-a[0]-t*vx,py-a[1]-t*vy);}

/* ================= Baléares (milles nautiques) ================= */
const LAT0=39.5,LON0=2.9,KX=60*Math.cos(39.5*D2R);
const P=(lat,lon)=>[(lon-LON0)*KX,(lat-LAT0)*60];
const ISL=[
 {n:'Majorque',pts:[[39.96,3.21],[39.88,3.20],[39.80,3.15],[39.77,3.16],[39.75,3.35],[39.71,3.48],[39.60,3.39],[39.54,3.34],[39.42,3.27],[39.37,3.23],[39.26,3.05],[39.32,2.99],[39.36,2.78],[39.50,2.75],[39.56,2.64],[39.46,2.52],[39.55,2.38],[39.59,2.33],[39.66,2.47],[39.80,2.69],[39.86,2.80],[39.93,3.05]],lab:[39.63,2.95]},
 {n:'Minorque',pts:[[40.00,3.83],[39.92,3.82],[39.90,4.07],[39.83,4.21],[39.87,4.30],[39.99,4.27],[40.06,4.13],[40.09,4.09],[40.05,3.88]],lab:[39.96,4.05]},
 {n:'Ibiza',pts:[[39.11,1.52],[39.09,1.44],[38.98,1.30],[38.89,1.22],[38.84,1.38],[38.91,1.44],[38.98,1.53],[39.07,1.60]],lab:[38.98,1.41]},
 {n:'Formentera',pts:[[38.76,1.37],[38.73,1.44],[38.67,1.58],[38.64,1.53],[38.70,1.40]],lab:[38.70,1.48]},
 {n:'Cabrera',pts:[[39.16,2.92],[39.16,2.97],[39.13,2.98],[39.12,2.93]],lab:[39.10,2.95]}
].map(i=>({n:i.n,p:i.pts.map(a=>P(a[0],a[1])),l:P(i.lab[0],i.lab[1])}));
const PEAKS=[[39.81,2.79,1436,6],[39.80,2.87,1365,5],[39.63,2.48,1027,6],[39.51,2.93,543,5],[39.44,3.15,509,4],[39.98,4.11,358,6],[38.93,1.30,475,5],[39.14,2.95,172,3]].map(a=>{const p=P(a[0],a[1]);return{x:p[0],y:p[1],e:a[2],w:a[3],sd:Math.random()*9};});
const MX0=-78,MX1=66,MY0=-52,MY1=46,S0=[0,39];
function inLand(x,y){return ISL.some(i=>pip(x,y,i.p));}
function distCoast(x,y){let m=1e9;for(const i of ISL){const p=i.p;for(let k=0;k<p.length;k++){const d=segD(x,y,p[k],p[(k+1)%p.length]);if(d<m)m=d;}}return m;}
function placeName(x,y){let best=null,bd=1e9;for(const i of ISL){const d=Math.hypot(x-i.l[0],y-i.l[1]);if(d<bd){bd=d;best=i;}}if(bd<6)return'Près de '+best.n;
  const dx=x-best.l[0],dy=y-best.l[1],a=Math.atan2(dx,dy)/D2R;const dir=a>-45&&a<=45?'Nord':a>45&&a<=135?'Est':a<=-45&&a>-135?'Ouest':'Sud';return dir+' de '+(best.n==='Cabrera'?'Cabrera':best.n);}
const CS=[];for(const i of ISL){const p=i.p;for(let k=0;k<p.length;k++){const a=p[k],b=p[(k+1)%p.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.4));for(let j=0;j<n;j++)CS.push({x:a[0]+(b[0]-a[0])*j/n,y:a[1]+(b[1]-a[1])*j/n,e:28+((CS.length*37)%9)*4,brk:j===0&&k===0});}}
const CLOUDS=[];for(let i=0;i<9;i++)CLOUDS.push({az:Math.random()*TAU,el:rnd(.03,.16),w:rnd(.08,.22),h:rnd(.012,.03)});

/* ================= paramètres (fictifs) ================= */
const SPH=5,QUOTA=200,PRICE=8,FUEL_EUR=.7,MINKG=30,SEASON=30,T_DAWN=360,T_DUSK=1260,EYE=9;
const THR=[{n:'RECHERCHE',kn:9,lh:220},{n:'ROUTE',kn:12,lh:380},{n:'PLEIN',kn:14,lh:560}];
const SET_LH=500,IDLE_LH=40,NIGHT_LH=30,ID_MIN=20;
function dateLab(d){const x=d+25;return x<=31?x+' mai':(x-31)+' juin';}

/* ================= état ================= */
function seaPoint(){for(let k=0;k<500;k++){const x=rnd(-55,58),y=rnd(-46,40);if(inLand(x,y))continue;if(distCoast(x,y)<4)continue;return[x,y];}return[10,-20];}
function newBank(near){const young=Math.random()<.3;let p;if(near){for(let k=0;k<60;k++){p=[near[0]+rnd(-10,10),near[1]-rnd(5,8)];if(!inLand(p[0],p[1])&&distCoast(p[0],p[1])>3)break;}}else p=seaPoint();
  const small=!young&&Math.random()<.3;const kg=young?Math.round(rnd(12,24)):small?Math.round(rnd(38,88)):Math.round(rnd(130,240)),n=young?Math.round(rnd(900,2000)):small?Math.round(rnd(450,950)):Math.round(rnd(220,420));const a=rnd(0,TAU);
  const v0=rnd(.3,.8);return{x:p[0],y:p[1],vx:Math.sin(a)*v0,vy:Math.cos(a)*v0,young,kg,n,t:n*kg/1000,seen:false,det:false,id:null,alive:true,ox:rnd(-.7,.7),oy:rnd(-.7,.7),sd:Math.random()*9};}
function newGame(){
  G={scene:'sea',phase:'plan',day:1,t:T_DAWN,anim:0,fade:0,fadeDir:0,ui:{},boat:{x:S0[0],y:S0[1],h:180*D2R,spd:0},dest:null,thr:1,warp:1,
    fuel:0,tons:0,sets:[],released:0,refused:0,chase:null,pendingSet:null,escapedT:0,track:[],trackT:0,banks:[],identT:0,identB:null,msg:null,boats:[],dist:0};
  G.banks.push(newBank(S0));while(G.banks.filter(b=>!b.young).length<1)G.banks[0]=newBank(S0);
  for(let i=0;i<7;i++)G.banks.push(newBank());
  const ad=G.banks.filter(b=>!b.young&&b!==G.banks[0]);G.radio=ad.length?ad[0]:G.banks[0];
  for(let i=0;i<2;i++){const p=seaPoint();G.boats.push({x:p[0],y:p[1],h:rnd(0,TAU),tx:p[0],ty:p[1]});}
}

/* ================= dialogues ================= */
function say(lines,onDone,labels){talk={lines,i:0,onDone,labels:labels||{}};$('sg-talk').hidden=false;showLine();}
function showLine(){const t=talk;$('sg-txt').innerHTML=t.lines[t.i];
  $('sg-dots').innerHTML=t.lines.length>1?t.lines.map((_,k)=>'<i class="'+(k===t.i?'on':'')+'"></i>').join(''):'';
  $('sg-next').textContent=t.i<t.lines.length-1?'Suivant →':(t.labels.last||'C’est parti →');
  $('sg-skip').style.display=t.lines.length>1&&t.i<t.lines.length-1?'':'none';
  const a=$('sg-again');if(a)a.style.display=t.i===t.lines.length-1?'':'none';}
$('sg-next').onclick=()=>{if(!talk)return;if(talk.i>=talk.lines.length-1){const p=$('sg-pass');if(p)p.remove();}if(talk.i<talk.lines.length-1){talk.i++;showLine();}else{const f=talk.onDone;talk=null;$('sg-talk').hidden=true;f&&f();}};
$('sg-skip').onclick=()=>{if(!talk)return;talk.i=talk.lines.length-1;showLine();};
function toast(t,c){if(G)G.msg={t,c:c||'#0012B5',life:3.6};}
function introLines(){const rz=placeName(G.radio.x,G.radio.y);return[
 'Salut, moi c’est <b>Janvier</b> ! J’ai besoin d’un <b>second</b> pour la campagne de <b>thon rouge à la senne</b>. Tu embarques ?',
 'La saison est courte : du <b>26 mai au 24 juin</b>. On est aux <b>Baléares</b>, où le thon rouge vient se reproduire. Notre quota pour le jeu : <b>200 tonnes</b>, livrées vivantes à une ferme d’engraissement.',
 'D’abord, il faut <b>trouver les bancs</b>. Scrute l’horizon : les <b>oiseaux</b> qui tournent et plongent trahissent souvent une chasse. Ensuite, le <b>sonar</b> confirme.',
 'Les thons nagent avec <b>ceux de leur âge</b>. Avant de larguer, on <b>identifie</b> le banc : sous <b>30 kg</b> de moyenne, ce sont des jeunes, on n’y touche pas. Au-dessus, <b>c’est toi qui décides</b>… mais la ferme peut refuser des thons trop petits : ça lui coûte plus cher en nourriture. L’<b>observateur de l’ICCAT</b> à bord veille à tout.',
 'Quand on encercle, c’est toi qui prends le <b>semi-rigide</b> : tu tiens le bout de la senne pendant que je fais le tour du banc. Tiens ta position contre le courant, sinon les thons filent !',
 'À la radio, un collègue signale des oiseaux vers <b>'+rz+'</b>. Touche le traceur pour choisir ta route. On y va !'];}

/* ================= mise en page ================= */
function L(){return portrait?{win:[0,0,720,420],plot:[12,436,696,384],son:[12,830,342,160],gau:[366,830,342,160],tip:[12,1000,696,80],ctrl:[12,1088,696,82]}
 :{win:[0,0,1280,400],plot:[338,418,604,292],son:[16,418,306,176],tip:[16,604,306,106],gau:[958,418,306,118],ctrl:[958,546,306,164]};}
function mapRect(){const r=L().plot,iw=portrait?236:196;return[r[0]+8,r[1]+8,r[2]-iw-16,r[3]-16];}
function mapFit(){const m=mapRect(),s=Math.min(m[2]/(MX1-MX0),m[3]/(MY1-MY0));return{s,ox:m[0]+(m[2]-(MX1-MX0)*s)/2,oy:m[1]+(m[3]-(MY1-MY0)*s)/2};}
function m2p(x,y){const f=mapFit();return[f.ox+(x-MX0)*f.s,f.oy+(MY1-y)*f.s];}
function p2m(px,py){const f=mapFit();return[(px-f.ox)/f.s+MX0,MY1-(py-f.oy)/f.s];}

/* ================= logique en mer ================= */
function clearPath(x,y,a,len){for(let s=.25;s<=len;s+=.25){const px=x+Math.sin(a)*s,py=y+Math.cos(a)*s;if(inLand(px,py)||distCoast(px,py)<.5)return false;}return true;}
function freeHeading(x,y,brg){for(const o of [15,-15,30,-30,45,-45,60,-60,75,-75,90,-90,110,-110,130,-130,155,-155,180]){const a=brg+o*D2R;if(clearPath(x,y,a,1.6))return a;}return null;}
function turnTo(B,brg,maxd){let d=brg-B.h;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;B.h+=clamp(d,-maxd,maxd);}
function nearest(det){let best=null,bd=1e9;for(const b of G.banks){if(!b.alive||(det&&!b.det))continue;const d=Math.hypot(b.x-G.boat.x,b.y-G.boat.y);if(d<bd){bd=d;best=b;}}return best?{b:best,d:bd}:null;}
function act(){if(G.phase==='plan'){if(G.dest){G.phase='sea';toast('En route ! Ouvre l’œil.','#0E8A72');}else toast('Touche d’abord le traceur pour choisir ta route.','#C4613A');return;}
  if(G.phase!=='sea')return;const n=nearest(true);if(!n||n.d>1.2){toast('Aucun banc au sonar : continue à chercher.','#C4613A');return;}
  const b=n.b;if(!b.id){G.identT=ID_MIN;G.identB=b;G.chase=b;G.dest=null;toast('On s’approche pour identifier le banc…','#0E8A72');return;}
  b.pass=false;decide(b);}
function actLabel(){if(G.phase==='plan')return G.dest?['EN ROUTE','EN ROUTE',1]:['CHOISIS TA ROUTE','ROUTE ?',0];
  if(G.phase!=='sea')return['…','…',0];if(G.identT>0)return['IDENTIFICATION…','IDENT…',0];
  const n=nearest(true);if(!n||n.d>1.2)return['EN RECHERCHE…','CHERCHE',0];
  if(G.pendingSet)return['EN POSITION…','POSITION…',0];if(!n.b.id)return['IDENTIFIER LE BANC','IDENTIFIER',1];return['DÉCIDER : ON Y VA ?','DÉCIDER',1];}
function plotClick(pt){if(G.phase!=='sea'&&G.phase!=='plan')return;if(inLand(pt[0],pt[1])){toast('Terre ! Choisis un point en mer.','#C4613A');return;}
  if(pt[0]<MX0||pt[0]>MX1||pt[1]<MY0||pt[1]>MY1)return;
  let hit=null,hd=2.5;for(const b of G.banks){if(!b.alive||!b.seen)continue;const px=b.det?b.x:b.x+b.ox,py=b.det?b.y:b.y+b.oy,d=Math.hypot(pt[0]-px,pt[1]-py);if(d<hd){hd=d;hit=b;}}
  if(G.identT>0&&hit!==G.identB){G.identT=0;G.identB=null;toast('Identification abandonnée.');}G.pendingSet=null;
  if(hit&&G.phase==='sea'){G.chase=hit;hit.pass=false;G.dest=null;toast('Cap sur les oiseaux : on ralentira à l’approche.','#0E8A72');}else{G.chase=null;G.dest=pt.slice();}}
function update(dt){if(!G)return;G.anim+=dt;if(G.msg){G.msg.life-=dt;if(G.msg.life<=0)G.msg=null;}
  if(G.fadeDir){G.fade+=G.fadeDir*dt*1.8;if(G.fadeDir>0&&G.fade>=1){G.fade=1;G.fadeDir=-1;const f=G.fadeCb;G.fadeCb=null;f&&f();}else if(G.fadeDir<0&&G.fade<=0){G.fade=0;G.fadeDir=0;}}
  if(G.scene==='encer'){updEnc(dt);return;}if(G.scene==='transfert'){updTr(dt);return;}if(G.scene==='ferme'){G.fm.t+=dt;return;}
  if(talk||G.phase!=='sea'||G.fadeDir)return;
  const dm=dt*60/SPH*G.warp;G.t+=dm;const B=G.boat;let lh=IDLE_LH;
  if(G.chase&&!G.chase.alive)G.chase=null;
  const tg=G.chase?[G.chase.x,G.chase.y]:G.dest;
  if(tg){const dx=tg[0]-B.x,dy=tg[1]-B.y,dd=Math.hypot(dx,dy);let brg=Math.atan2(dx,dy);
    if(G.avoidT>0){G.avoidT-=dm;if(clearPath(B.x,B.y,brg,Math.min(dd,2.5)))G.avoidT=0;else brg=G.avoidA;}
    else if(!clearPath(B.x,B.y,brg,Math.min(dd,2.5))){const a=freeHeading(B.x,B.y,brg);if(a!=null){G.avoidA=a;G.avoidT=12;brg=a;if(!G.avoidMsg){G.avoidMsg=true;toast('Terre sur la route : on contourne la côte.','#0E8A72');}}}
    turnTo(B,brg,Math.max(dt*40*D2R,dm*30*D2R));
    let vmax=THR[G.thr].kn;if(G.chase)vmax=Math.min(vmax,dd>3?9:dd>1.2?6:dd>.55?3:0);if(G.identT>0)vmax=Math.min(vmax,4);
    B.spd=vmax;lh=vmax>0?THR[G.thr].lh*Math.pow(vmax/THR[G.thr].kn,2):IDLE_LH;const step=B.spd*dm/60;
    if(vmax<=0){B.spd=0;}
    else if(!G.chase&&dd<=step+.01){B.x=tg[0];B.y=tg[1];G.dest=null;B.spd=0;}else{const nx=B.x+Math.sin(B.h)*step,ny=B.y+Math.cos(B.h)*step;if(!inLand(nx,ny)&&(distCoast(nx,ny)>.35||distCoast(nx,ny)>distCoast(B.x,B.y))){B.x=nx;B.y=ny;G.dist+=step;}else{const a=freeHeading(B.x,B.y,B.h);G.avoidA=a!=null?a:B.h+Math.PI;G.avoidT=12;B.h+=clamp(G.avoidA-B.h,-.5,.5);}}}
  else B.spd=0;
  G.fuel+=lh*dm/60;
  if(G.identT>0){const b=G.identB;if(b&&b.alive){G.chase=b;G.identT-=dm;if(G.identT<=0){G.identT=0;b.id={kg:Math.round(b.kg*(1+rnd(-.1,.1))),t:Math.round(b.t*(1+rnd(-.15,.15)))};decide(b);return;}}else G.identT=0;}
  if(G.pendingSet){const b=G.pendingSet;if(!b.alive)G.pendingSet=null;else{G.chase=b;if(Math.hypot(b.x-B.x,b.y-B.y)<=.8){G.pendingSet=null;startSet(b);return;}}}
  for(const b of G.banks){if(!b.alive)continue;if(Math.random()<dm*.02){const a=rnd(0,TAU),v=rnd(.3,.8);b.vx=Math.sin(a)*v;b.vy=Math.cos(a)*v;}
    const nx=b.x+b.vx*dm/60,ny=b.y+b.vy*dm/60;if(!inLand(nx,ny)&&distCoast(nx,ny)>2.5&&nx>MX0+4&&nx<MX1-4&&ny>MY0+4&&ny<MY1-4){b.x=nx;b.y=ny;}else{b.vx*=-1;b.vy*=-1;}
    const d=Math.hypot(b.x-B.x,b.y-B.y);if(d<7&&!b.seen){b.seen=true;if(!G.chase&&!b.pass&&G.identT<=0){G.chase=b;G.dest=null;G.warp=1;toast('Des oiseaux ! On ralentit et on met le cap dessus.','#0E8A72');}else if(d>1.6)toast('Des oiseaux à l’horizon ! Peut-être une chasse…','#0E8A72');}if(d<1.6&&!b.det){b.det=true;toast(b.id?'Banc au sonar.':'Écho au sonar ! Identifie le banc.','#0E8A72');}}
  for(const o of G.boats){if(Math.hypot(o.tx-o.x,o.ty-o.y)<.5){const p=seaPoint();o.tx=p[0];o.ty=p[1];}turnTo(o,Math.atan2(o.tx-o.x,o.ty-o.y),dm*20*D2R);o.x+=Math.sin(o.h)*11*dm/60;o.y+=Math.cos(o.h)*11*dm/60;}
  G.trackT+=dm;if(G.trackT>=3){G.trackT=0;G.track.push([B.x,B.y]);if(G.track.length>900)G.track.shift();}
  if(G.t>=T_DUSK)night();}
function night(){G.phase='night';G.dest=null;G.identT=0;G.boat.spd=0;
  if(G.day>=SEASON){G.phase='end';toSeasonEnd();return;}
  toast('La nuit tombe : on dérive jusqu’à l’aube.','#0012B5');G.fadeDir=1;G.fadeCb=()=>{G.day++;G.t=T_DAWN;G.fuel+=NIGHT_LH*9;
    for(const b of G.banks){if(!b.alive)continue;for(let k=0;k<20;k++){const nx=b.x+rnd(-8,8),ny=b.y+rnd(-8,8);if(!inLand(nx,ny)&&distCoast(nx,ny)>3&&nx>MX0+4&&nx<MX1-4&&ny>MY0+4&&ny<MY1-4){b.x=nx;b.y=ny;break;}}b.seen=false;b.det=false;}
    while(G.banks.filter(b=>b.alive).length<8)G.banks.push(newBank());G.phase='sea';toast('Jour '+G.day+' · '+dateLab(G.day)+' : on reprend la recherche.','#0E8A72');};}

function decide(b){const young=b.kg<MINKG,small=!young&&b.id.kg<90;G.warp=1;
  const html='<b>Banc identifié</b> par le sonar et l’observateur :<div class="sg-sum"><div><b>~'+b.id.kg+' kg</b><span>poids moyen des thons</span></div><div><b>~'+b.id.t+' t</b><span>dans le banc (estimation)</span></div><div><b>'+G.tons+' / '+QUOTA+' t</b><span>quota déjà pêché</span></div><div class="'+(young?'neg':small?'':'pos')+'"><b>'+(young?'Jeunes':small?'Moyens':'Beaux')+'</b><span>'+(young?'sous 30 kg : interdit':small?'légal, mais…':'la ferme les attend')+'</span></div></div>'+
   (young?'Sous <b>30 kg</b>, ce sont des jeunes : les pêcher est <b>interdit</b>. L’observateur ferait tout relâcher.':small?'C’est <b>légal</b>, mais des thons de cette taille coûtent <b>plus cher en nourriture</b> à la ferme : elle peut <b>refuser</b> le banc. À toi de voir.':'De beaux thons : la ferme devrait être contente.')+' <b>On y va ?</b>';
  say([html],()=>{const p=$('sg-pass');if(p)p.remove();G.pendingSet=b;G.chase=b;toast('On se met en position pour larguer…','#0E8A72');},{last:'On y va : larguer la senne →'});
  setTimeout(()=>{const nav=$('sg-nav');if(nav&&!$('sg-pass')){const x=document.createElement('button');x.className='sg-btn alt';x.id='sg-pass';x.textContent='On passe notre chemin';x.onclick=()=>{x.remove();talk=null;$('sg-talk').hidden=true;b.pass=true;G.chase=null;G.pendingSet=null;toast('On laisse ce banc. Cap ailleurs !');};nav.insertBefore(x,$('sg-next'));}},20);}
/* ================= encerclement : le semi-rigide tient la senne ================= */
function startSet(b){G.phase='set';G.dest=null;G.boat.spd=0;const R=250,rb=clamp(40+Math.sqrt(b.t)*6,45,110);
  const fish=[];const nf=b.young?90:60;for(let i=0;i<nf;i++)fish.push({a:rnd(0,TAU),r:rnd(.1,1)*rb,w:rnd(.6,1.4)*(Math.random()<.5?1:-1),ph:rnd(0,TAU),out:false,ox:0,oy:0});
  G.enc={b,t:0,dur:16,R,rb,bank:{x:rnd(-20,20),y:rnd(-30,0)},sk:{x:0,y:R+20,vx:0,vy:0},H:[0,R+20],HR:26,dA:rnd(0,TAU),dM:rnd(14,22),hold:0,esc:0,fish,phase:'circle',close:0,ptr:null,keys:{}};
  G.fadeDir=1;G.fadeCb=()=>{G.scene='encer';};toast('On largue la senne !','#0E8A72');}
function updEnc(dt){const E=G.enc;if(!E||talk||G.fadeDir>0)return;
  if(E.phase==='circle'){E.t+=dt;const ph=Math.min(1,E.t/E.dur),K=E.sk,H=E.H;
    const ga=E.dA+.7*Math.sin(E.t*.45),gm=E.dM*(1+.45*Math.sin(E.t*1.7)+.25*Math.sin(E.t*3.1+1));
    let ax=Math.sin(ga)*gm,ay=Math.cos(ga)*gm;
    const pull=6+14*ph,dx=-K.x,dy=-K.y,dl=Math.hypot(dx,dy)||1;ax+=dx/dl*pull;ay+=dy/dl*pull;
    let tx=0,ty=0;if(E.ptr){const qx=E.ptr[0]-K.x,qy=E.ptr[1]-K.y,ql=Math.hypot(qx,qy);if(ql>4){const m=Math.min(48,ql*1.1);tx=qx/ql*m;ty=qy/ql*m;}}
    const kx=(E.keys.ArrowRight?1:0)-(E.keys.ArrowLeft?1:0),ky=(E.keys.ArrowDown?1:0)-(E.keys.ArrowUp?1:0);if(kx||ky){const kl=Math.hypot(kx,ky);tx=kx/kl*44;ty=ky/kl*44;}
    K.vx+=(ax+tx-K.vx*2.1)*dt;K.vy+=(ay+ty-K.vy*2.1)*dt;K.x+=K.vx*dt;K.y+=K.vy*dt;
    const dH=Math.hypot(K.x-H[0],K.y-H[1]),inside=dH<E.HR;if(inside)E.hold+=dt;
    E.slack=!inside&&Math.hypot(K.x,K.y)<Math.hypot(H[0],H[1]);E.gap=!inside&&ph>.08&&ph<.97;
    const gx=(K.x+0)/2,gy=(K.y+E.R)/2;const bt=E.gap?[gx*.8,gy*.8]:[Math.sin(E.t*.4)*40,Math.cos(E.t*.33)*40-20];
    E.bank.x+=(bt[0]-E.bank.x)*dt*(E.gap?.6:.25);E.bank.y+=(bt[1]-E.bank.y)*dt*(E.gap?.6:.25);
    if(E.gap){const k=clamp((dH-E.HR)/E.HR,0,1.5);E.esc=Math.min(.75,E.esc+dt*.05*k);}
    const want=Math.floor(E.fish.length*E.esc);let out=E.fish.filter(f=>f.out).length;for(const f of E.fish){if(out>=want)break;if(!f.out){f.out=true;f.ox=E.bank.x+Math.cos(f.a)*f.r;f.oy=E.bank.y+Math.sin(f.a)*f.r;f.vx=(gx-f.ox)*.6;f.vy=(gy+80-f.oy)*.6;out++;}}
    for(const f of E.fish){f.a+=f.w*dt*.9;if(f.out){f.ox+=f.vx*dt;f.oy+=f.vy*dt;f.vy+=30*dt;}}
    if(E.t>=E.dur){E.phase='close';E.close=0;}}
  else if(E.phase==='close'){E.close+=dt;for(const f of E.fish){f.a+=f.w*dt*1.3;if(f.out){f.ox+=f.vx*dt;f.oy+=f.vy*dt;}}E.bank.x*=1-dt;E.bank.y*=1-dt;
    if(E.close>=2.4&&!E.done){E.done=true;finishSet();}}}
function finishSet(){const E=G.enc,b=E.b,hf=E.hold/E.dur,frac=clamp((1-E.esc)*(.8+.2*hf),.25,1);G.t+=60;G.fuel+=SET_LH;
  b.alive=false;while(G.banks.filter(x=>x.alive).length<8)G.banks.push(newBank());
  const pct=Math.round(hf*100);
  if(b.young){G.released++;G.t+=90;G.fuel+=IDLE_LH*1.5;G.sets.push({young:true,kg:b.kg,pos:[b.x,b.y]});
    say(['Tu as tenu la senne <b>'+pct+' %</b> du temps. Mais c’est un <b>banc de jeunes</b> : ~'+b.kg+' kg de moyenne, sous les <b>30 kg</b>. L’observateur de l’ICCAT le confirme : on ouvre la senne et on les <b>relâche</b> tous. Deux heures et demie de perdues…'],backToSea,{last:'Retour à la passerelle →'});return;}
  const pRef=b.kg<90?.45:b.kg<140?.12:.04;if(Math.random()<pRef){G.refused++;G.t+=120;G.fuel+=IDLE_LH*2;G.sets.push({young:true,kg:b.kg,pos:[b.x,b.y]});
    say(['Senne refermée : tu as tenu ta position <b>'+pct+' %</b> du temps. Mais j’ai appelé la ferme, et elle <b>refuse le banc</b> : des thons de ~'+b.kg+' kg, c’est pour eux un <b>coût supplémentaire en nourriture</b>, même si c’est parfaitement légal. On ouvre la senne et on les <b>relâche</b>. Deux heures de perdues…'],backToSea,{last:'Retour à la passerelle →'});return;}
  let cap=Math.round(b.t*frac),trim=0;if(G.tons+cap>QUOTA){trim=G.tons+cap-QUOTA;cap=QUOTA-G.tons;}
  E.cap=cap;E.trim=trim;E.frac=frac;
  const lost=Math.round(b.t-cap-trim),com=pct>=75?'Superbe tenue de senne !':pct>=45?'Pas mal, mais le courant t’a fait lâcher du terrain.':'Le courant t’a emporté : la porte est restée ouverte.';
  say(['<b>Senne refermée !</b> Tu as tenu ta position <b>'+pct+' %</b> du temps. '+com+(lost>0?' ~'+lost+' t se sont échappées par la porte.':'')+(trim>0?' Le quota est presque plein : on relâche ~'+trim+' t en trop.':'')+' Dans la poche : <b>~'+cap+' t</b> de thons de ~'+b.kg+' kg. Place au <b>transfert</b> vers la cage.'],
    ()=>{G.tr={t:0,dur:9,cap,n:Math.round(cap*1000/b.kg),kg:b.kg,done:false,pos:[b.x,b.y]};G.fadeDir=1;G.fadeCb=()=>{G.scene='transfert';};},{last:'Transférer →'});}
function backToSea(){G.fadeDir=1;G.fadeCb=()=>{G.scene='sea';G.phase='sea';G.enc=null;if(G.t>=T_DUSK)night();};}
function drawEnc(){const E=G.enc;if(!E)return;const tt=G.anim;const sc=portrait?1.02:.98,cx=portrait?360:640,cy=portrait?600:380;
  const W=(x,y)=>[cx+x*sc,cy+y*sc];
  let g=ctx.createRadialGradient(cx,cy,60,cx,cy,LH);g.addColorStop(0,'#1F6FB8');g.addColorStop(1,'#0B3C78');ctx.fillStyle=g;ctx.fillRect(0,0,LW,LH);
  ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=2;for(let i=0;i<60;i++){const x=(i*211+tt*20)%(LW+60)-30,y=(i*137+tt*6)%LH;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+10,y-4,x+22,y);ctx.stroke();}
  const ph=E.phase==='circle'?Math.min(1,E.t/E.dur):1,R=E.R*(E.phase==='close'?1-.18*Math.min(1,E.close/2):1),K=E.sk;
  // zone de tenue
  const h=W(E.H[0],E.H[1]);ctx.strokeStyle=E.phase==='circle'?(Math.hypot(K.x-E.H[0],K.y-E.H[1])<E.HR?'#3BF0A0':'#FFB23A'):'rgba(59,240,160,.4)';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(h[0],h[1],E.HR*sc,0,TAU);ctx.stroke();ctx.setLineDash([]);
  // banc
  const bk=W(E.bank.x,E.bank.y);ctx.fillStyle='rgba(5,20,60,.25)';ctx.beginPath();ctx.ellipse(bk[0],bk[1],E.rb*sc*1.15,E.rb*sc*.95,0,0,TAU);ctx.fill();
  for(const f of E.fish){let x,y,a;if(f.out){x=f.ox;y=f.oy;a=Math.atan2(f.vy,f.vx);}else{x=E.bank.x+Math.cos(f.a)*f.r*(E.phase==='close'?1-.3*Math.min(1,E.close/2):1);y=E.bank.y+Math.sin(f.a)*f.r*.85;a=f.w>0?f.a+Math.PI:f.a;}
    const p=W(x,y);tunaTop(p[0],p[1],a,(E.b.young?7:13)*sc,f.out?.7:1);}
  // senne : ligne de flotteurs
  const pts=[[K.x,K.y]];const n=Math.max(2,Math.round(70*ph));for(let i=0;i<=n;i++){const a=ph*TAU*i/n;pts.push([Math.sin(a)*R,R*Math.cos(a)]);}
  ctx.strokeStyle='rgba(255,225,77,.9)';ctx.lineWidth=3;ctx.setLineDash([2,7]);ctx.lineCap='round';ctx.beginPath();pts.forEach((q,i)=>{const p=W(q[0],q[1]);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);});ctx.stroke();ctx.setLineDash([]);
  if(E.phase==='close'){ctx.strokeStyle='rgba(255,225,77,.95)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(cx,cy,R*sc,0,TAU);ctx.stroke();}
  // porte ouverte
  if(E.gap){const a=W(K.x,K.y),b=W(0,E.R);ctx.strokeStyle='rgba(255,77,61,'+(.5+.4*Math.sin(tt*8))+')';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}
  // thonier
  const a=ph*TAU,th=W(Math.sin(a)*R,R*Math.cos(a));seinerTop(th[0],th[1],Math.PI/2-a,sc);
  // semi-rigide
  const k=W(K.x,K.y);for(let i=0;i<6;i++){ctx.fillStyle='rgba(255,255,255,'+(.35-i*.05)+')';ctx.beginPath();ctx.arc(k[0]-K.vx*sc*.05*i,k[1]-K.vy*sc*.05*i,4+i*1.5,0,TAU);ctx.fill();}
  ctx.save();ctx.translate(k[0],k[1]);ctx.rotate(Math.atan2(K.vy,K.vx)+Math.PI/2);ctx.fillStyle='#FF7A1A';rr(-6*sc,-13*sc,12*sc,26*sc,6*sc);ctx.fill();ctx.fillStyle='#1C2B4A';ctx.fillRect(-3*sc,-2*sc,6*sc,7*sc);ctx.restore();
  if(E.ptr&&E.phase==='circle'){const q=W(E.ptr[0],E.ptr[1]);ctx.strokeStyle='rgba(0,255,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(q[0],q[1],10,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(k[0],k[1]);ctx.lineTo(q[0],q[1]);ctx.setLineDash([4,6]);ctx.stroke();ctx.setLineDash([]);}
  // HUD
  ctx.fillStyle='rgba(5,10,42,.78)';rr(16,16,portrait?520:380,portrait?96:66,14);ctx.fill();
  txt('ENCERCLEMENT · banc de ~'+(E.b.id?E.b.id.t:Math.round(E.b.t))+' t',30,portrait?52:42,'800 15px Mukta,sans-serif','#FFE9A8');
  txt('Tenue de la senne : '+Math.round(E.hold/Math.max(.1,Math.min(E.t,E.dur))*100)+' %',30,portrait?88:66,'700 14px Mukta,sans-serif','#00FFFF');
  const inside=Math.hypot(K.x-E.H[0],K.y-E.H[1])<E.HR;const msg=E.phase==='close'?'On ferme la coulisse : la poche se referme sous le banc':inside?'Senne tendue : tiens bon !':E.slack?'Senne molle : les thons passent dessous ! Recule':'Trop loin : la porte s’ouvre ! Reviens dans la zone';
  ctx.font=fs('800 17px Mukta,sans-serif');const tw=Math.min(LW-40,ctx.measureText(msg).width+44),th2=36*FS,ty=portrait?128:94;ctx.fillStyle=E.phase==='close'?'#0E8A72':inside?'#0E8A72':'#C4613A';rr(LW/2-tw/2,ty,tw,th2,th2/2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(msg,LW/2,ty+th2*.66,tw-24);
  // courant
  const ga=E.dA+.7*Math.sin(E.t*.45),ox=LW-(portrait?90:80),oy=portrait?230:170;ctx.fillStyle='rgba(5,10,42,.7)';ctx.beginPath();ctx.arc(ox,oy,38*FS*.8,0,TAU);ctx.fill();ctx.save();ctx.translate(ox,oy);ctx.rotate(-ga+Math.PI);ctx.strokeStyle='#00FFFF';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-18*FS*.8);ctx.lineTo(0,18*FS*.8);ctx.moveTo(-8,8*FS*.8);ctx.lineTo(0,18*FS*.8);ctx.lineTo(8,8*FS*.8);ctx.stroke();ctx.restore();txt('courant',ox,oy+46*FS*.8,'700 11px Mukta,sans-serif','#E7ECFF','center');
  // progression
  const pw=portrait?560:520,px=LW/2-pw/2,py=LH-(portrait?70:44);ctx.fillStyle='rgba(5,10,42,.6)';rr(px,py,pw,12,6);ctx.fill();ctx.fillStyle='#FFE14D';rr(px,py,pw*ph,12,6);ctx.fill();txt('Le thonier fait le tour du banc',LW/2,py-10,'700 12px Mukta,sans-serif','#fff','center');
  if(E.t<3&&E.phase==='circle')txt(portrait?'Glisse le doigt : le semi-rigide va vers ton doigt':'Souris ou flèches : tiens le semi-rigide dans la zone verte',LW/2,py-34*FS,'800 14px Mukta,sans-serif','#00FFFF','center');}
function tunaTop(x,y,a,s,al){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=al;ctx.fillStyle='#0E2A55';ctx.beginPath();ctx.ellipse(0,0,s*.3,s,0,0,TAU);ctx.fill();ctx.fillStyle='#8FB3D9';ctx.fillRect(-s*.07,-s*.6,s*.14,s*.9);ctx.fillStyle='#0E2A55';ctx.beginPath();ctx.moveTo(0,s*.85);ctx.lineTo(-s*.45,s*1.25);ctx.lineTo(s*.45,s*1.25);ctx.closePath();ctx.fill();ctx.restore();}
function seinerTop(x,y,a,sc){ctx.save();ctx.translate(x,y);ctx.rotate(a);const k=sc*1.5;ctx.fillStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.moveTo(-14*k,20*k);ctx.lineTo(-40*k,70*k);ctx.lineTo(40*k,70*k);ctx.lineTo(14*k,20*k);ctx.fill();
  ctx.fillStyle='#F4F7FB';ctx.beginPath();ctx.moveTo(0,-26*k);ctx.quadraticCurveTo(12*k,-18*k,12*k,0);ctx.lineTo(11*k,22*k);ctx.lineTo(-11*k,22*k);ctx.lineTo(-12*k,0);ctx.quadraticCurveTo(-12*k,-18*k,0,-26*k);ctx.fill();
  ctx.fillStyle='#0012B5';ctx.fillRect(-8*k,-12*k,16*k,12*k);ctx.fillStyle='#2F6B3F';ctx.fillRect(-9*k,6*k,18*k,14*k);ctx.fillStyle='#FF7A1A';ctx.beginPath();ctx.arc(0,-4*k,2.5*k,0,TAU);ctx.fill();ctx.restore();}

/* ================= transfert vers la cage (vue sous-marine) ================= */
function updTr(dt){const T=G.tr;if(!T||talk||G.fadeDir>0)return;T.t=Math.min(T.dur,T.t+dt);if(T.t>=T.dur&&!T.done){T.done=true;G.tons+=T.cap;G.t+=180;G.fuel+=IDLE_LH*3;G.sets.push({young:false,t:T.cap,kg:T.kg,pos:T.pos});
  const full=G.tons>=QUOTA;say(['<b>Transfert terminé.</b> La caméra stéréoscopique a compté <b>'+nf(T.n)+' thons</b>, ~'+T.kg+' kg de moyenne : <b>~'+T.cap+' t</b> dans la cage, sous l’œil de l’observateur de l’ICCAT. Un remorqueur l’emmène vers la ferme d’engraissement, à 1 ou 2 nœuds. Quota : <b>'+G.tons+' / '+QUOTA+' t</b>.'+(full?' <b>Le quota est rempli !</b>':' Nous, on continue la recherche.')],
    ()=>{if(full)toFarm();else backToSea();},{last:full?'Suivre la cage jusqu’à la ferme →':'Retour à la passerelle →'});}}
function tunaSide(x,y,s,flip,tt){ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.scale(s,s);const w=Math.sin(tt*9)*.12;
  ctx.fillStyle='#0E2A55';ctx.beginPath();ctx.moveTo(46,0);ctx.quadraticCurveTo(20,-18,-30,-6);ctx.lineTo(-40,0);ctx.lineTo(-30,6);ctx.quadraticCurveTo(20,18,46,0);ctx.fill();
  ctx.fillStyle='#C9D8E8';ctx.beginPath();ctx.moveTo(44,2);ctx.quadraticCurveTo(18,15,-30,5);ctx.lineTo(-30,1);ctx.quadraticCurveTo(10,6,44,2);ctx.fill();
  ctx.fillStyle='#0E2A55';ctx.save();ctx.translate(-38,0);ctx.rotate(w);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-12,-16);ctx.lineTo(-6,0);ctx.lineTo(-12,16);ctx.closePath();ctx.fill();ctx.restore();
  ctx.beginPath();ctx.moveTo(8,-12);ctx.lineTo(-2,-24);ctx.lineTo(-6,-10);ctx.fill();ctx.fillStyle='#F2C230';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-10-i*5,-6);ctx.lineTo(-13-i*5,-10);ctx.lineTo(-15-i*5,-5);ctx.fill();ctx.beginPath();ctx.moveTo(-10-i*5,6);ctx.lineTo(-13-i*5,10);ctx.lineTo(-15-i*5,5);ctx.fill();}
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(34,-3,2.4,0,TAU);ctx.fill();ctx.fillStyle='#0A0A1F';ctx.beginPath();ctx.arc(34.5,-3,1.2,0,TAU);ctx.fill();ctx.restore();}
function drawTr(){const T=G.tr;if(!T)return;const tt=G.anim,t=T.t,k=clamp((t-.8)/(T.dur-2),0,1);
  const sc=portrait?.62:1,cxo=portrait?0:0,oy=portrait?(LH-720*.62)/2:0;
  let g=ctx.createLinearGradient(0,0,0,LH);g.addColorStop(0,'#2C86C9');g.addColorStop(1,'#051C3E');ctx.fillStyle=g;ctx.fillRect(0,0,LW,LH);
  const fs0=FS;FS=1;ctx.save();ctx.translate(0,oy);ctx.scale(sc,sc);if(portrait)ctx.translate(-50,0);
  // surface
  ctx.fillStyle='#7CC3EE';ctx.fillRect(-200,0,1700,70);ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.beginPath();for(let x=-200;x<1500;x+=20)ctx.lineTo(x,70+Math.sin(x*.05+tt*2)*4);ctx.stroke();
  for(let i=0;i<7;i++){const x=120+i*180+Math.sin(tt*.3+i)*20;const lg=ctx.createLinearGradient(x,70,x+80,700);lg.addColorStop(0,'rgba(255,255,255,.12)');lg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=lg;ctx.beginPath();ctx.moveTo(x,70);ctx.lineTo(x+40,70);ctx.lineTo(x+160,720);ctx.lineTo(x+60,720);ctx.fill();}
  // remorqueur et observateur
  ctx.fillStyle='#F4F7FB';ctx.beginPath();ctx.moveTo(900,70);ctx.lineTo(1160,70);ctx.lineTo(1140,98);ctx.lineTo(920,98);ctx.fill();ctx.fillStyle='#0E8A72';ctx.fillRect(980,30,90,40);ctx.fillStyle='#F4F7FB';ctx.fillRect(1000,40,20,14);
  ctx.fillStyle='#E0B393';ctx.beginPath();ctx.arc(1110,40,8,0,TAU);ctx.fill();ctx.fillStyle='#FF7A1A';rr(1100,48,20,22,5);ctx.fill();ctx.fillStyle='#0A0A1F';ctx.font='800 8px Mukta,sans-serif';ctx.textAlign='center';ctx.fillText('ICCAT',1110,63);
  ctx.fillStyle='rgba(10,10,31,.72)';rr(1060,4,150,22,11);ctx.fill();txt('Observateur ICCAT',1135,20,'800 12px Mukta,sans-serif','#fff','center');
  // senne (gauche) et cage (droite)
  ctx.strokeStyle='rgba(180,220,190,.35)';ctx.lineWidth=1;for(let i=0;i<40;i++){ctx.beginPath();ctx.moveTo(40+i*12,80);ctx.lineTo(40+i*12+120,700);ctx.stroke();ctx.beginPath();ctx.moveTo(160+i*12,80);ctx.lineTo(40+i*12,700);ctx.stroke();}
  ctx.strokeStyle='rgba(255,225,77,.9)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(30,72);ctx.lineTo(560,72);ctx.stroke();
  ctx.strokeStyle='rgba(230,240,250,.45)';for(let i=0;i<36;i++){ctx.beginPath();ctx.moveTo(740+i*14,80);ctx.lineTo(740+i*14,700);ctx.stroke();}for(let j=0;j<22;j++){ctx.beginPath();ctx.moveTo(740,90+j*28);ctx.lineTo(1250,90+j*28);ctx.stroke();}
  ctx.strokeStyle='#E9EEF3';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(730,72);ctx.lineTo(1260,72);ctx.stroke();
  // porte
  ctx.fillStyle='rgba(0,255,255,.06)';ctx.fillRect(560,150,180,420);ctx.strokeStyle='#FFE14D';ctx.lineWidth=4;ctx.strokeRect(560,150,180,420);
  // caméra stéréo
  ctx.fillStyle='#0A0A1F';rr(612,120,76,34,6);ctx.fill();ctx.fillStyle='#00FFFF';ctx.beginPath();ctx.arc(632,137,7,0,TAU);ctx.arc(668,137,7,0,TAU);ctx.fill();
  ctx.fillStyle='rgba(0,255,255,.10)';ctx.beginPath();ctx.moveTo(620,154);ctx.lineTo(520,580);ctx.lineTo(780,580);ctx.lineTo(680,154);ctx.fill();
  ctx.fillStyle='rgba(10,10,31,.72)';rr(600,86,100,24,12);ctx.fill();txt('Caméra stéréo',650,103,'800 12px Mukta,sans-serif','#fff','center');
  // plongeur
  const dvx=820,dvy=560+Math.sin(tt)*6;ctx.fillStyle='#1C2B4A';ctx.beginPath();ctx.ellipse(dvx,dvy,40,11,-.2,0,TAU);ctx.fill();ctx.fillStyle='#FFB23A';ctx.fillRect(dvx-18,dvy-18,30,9);ctx.fillStyle='#1C2B4A';ctx.beginPath();ctx.arc(dvx+40,dvy-6,9,0,TAU);ctx.fill();ctx.fillStyle='#00FFFF';ctx.fillRect(dvx+42,dvy-10,8,5);
  ctx.beginPath();ctx.moveTo(dvx-38,dvy);ctx.lineTo(dvx-62,dvy-10+Math.sin(tt*5)*6);ctx.lineTo(dvx-60,dvy+6);ctx.fill();
  for(let i=0;i<5;i++){const ph=(tt*.6+i*.2)%1;ctx.strokeStyle='rgba(255,255,255,'+(.8-ph*.8)+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(dvx+44+Math.sin(ph*9)*4,dvy-18-ph*420,3+ph*4,0,TAU);ctx.stroke();}
  // thons
  const N=26,moved=Math.floor(N*k);
  for(let i=0;i<N;i++){const s=.9+((i*37)%10)/25,yy=190+((i*53)%360),ph=tt*.8+i;let x,flip=false;
    if(i<moved){x=860+((i*71+tt*40)%360);flip=Math.sin(ph*.3)>0;}else if(i===moved&&k<1){const f=(N*k)%1;x=300+f*540;}else{x=100+((i*83+tt*50)%380);flip=Math.cos(ph*.3)>0;}
    tunaSide(x,yy+Math.sin(ph)*8,s,flip,tt+i);}
  ctx.restore();FS=fs0;
  const cnt=Math.round(T.n*k);ctx.fillStyle='rgba(5,10,42,.8)';rr(16,16,portrait?560:420,portrait?128:88,14);ctx.fill();
  txt('TRANSFERT DANS LA CAGE',30,portrait?50:40,'800 14px Mukta,sans-serif','#FFE9A8');txt(nf(cnt)+' / '+nf(T.n)+' thons comptés',30,portrait?88:66,'800 20px Mukta,sans-serif','#00FFFF');
  txt('Poids moyen estimé : '+T.kg+' kg · ~'+Math.round(T.cap*k)+' t',30,portrait?118:86,'700 12px Mukta,sans-serif','#E7ECFF');
  const bw=portrait?170:120,bh=portrait?54:36;G.ui.skipT=T.done?null:[LW-bw-20,LH-bh-20,bw,bh];if(G.ui.skipT){ctx.fillStyle='rgba(5,10,42,.78)';rr(G.ui.skipT[0],G.ui.skipT[1],bw,bh,bh/2);ctx.fill();txt('Passer →',G.ui.skipT[0]+bw/2,G.ui.skipT[1]+bh*.66,'800 14px Mukta,sans-serif','#fff','center');}}

/* ================= ferme et bilan ================= */
function toFarm(){G.phase='end';G.fm={t:0};G.fadeDir=1;G.fadeCb=()=>{G.scene='ferme';setTimeout(()=>{if(G&&G.scene==='ferme')summary();},9000);};}
function toSeasonEnd(){if(G.tons>0)toFarm();else summary();}
function drawFarm(){const t=G.fm?G.fm.t:0,tt=G.anim;let g=ctx.createLinearGradient(0,0,0,LH);g.addColorStop(0,'#5FC4DE');g.addColorStop(1,'#1B7FB0');ctx.fillStyle=g;ctx.fillRect(0,0,LW,LH);
  ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=2;for(let i=0;i<40;i++){const x=(i*211+tt*16)%LW,y=(i*137)%LH;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+10,y-5,x+20,y);ctx.stroke();}
  const cols=portrait?2:3,rows=portrait?3:2,R=portrait?118:110,grow=Math.min(1,t/7);const cells=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)cells.push([LW*(c+.5)/cols,(portrait?190:150)+r*(portrait?270:240)]);
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.setLineDash([6,8]);for(let r=0;r<rows;r++){const y=cells[r*cols][1];ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(LW-20,y);ctx.stroke();}ctx.setLineDash([]);
  cells.forEach((p,i)=>{ctx.fillStyle='#1F6E9A';ctx.beginPath();ctx.arc(p[0],p[1],R,0,TAU);ctx.fill();ctx.strokeStyle='#F4F7FB';ctx.lineWidth=12;ctx.stroke();ctx.strokeStyle='#FFB23A';ctx.lineWidth=4;ctx.setLineDash([4,14]);ctx.stroke();ctx.setLineDash([]);
    for(let j=0;j<8;j++){const a=j*.8+tt*(.3+i*.03),r0=R*.55*((j*41%100)/100+.3);tunaTop(p[0]+Math.cos(a)*r0,p[1]+Math.sin(a)*r0,a+Math.PI,10+grow*6,1);}});
  const k=(t*.35)%cells.length,i0=Math.floor(k),f=k-i0,a=cells[i0],b=cells[(i0+1)%cells.length],bx=a[0]+(b[0]-a[0])*f,by=a[1]+(b[1]-a[1])*f-R-18;ctx.fillStyle='#fff';rr(bx-30,by-12,60,24,8);ctx.fill();ctx.fillStyle='#0E8A72';ctx.fillRect(bx-8,by-8,16,16);
  const months=['Juillet','Août','Septembre','Octobre','Novembre','Décembre'],m=months[Math.min(5,Math.floor(t/1.3))];
  const ph=portrait?250:128,pw=portrait?LW-40:640,px=portrait?20:LW/2-320,py=LH-ph-16;ctx.fillStyle='rgba(251,246,236,.96)';rr(px,py,pw,ph,16);ctx.fill();
  txt('À LA FERME D’ENGRAISSEMENT',px+20,py+30*FS,'800 13px Mukta,sans-serif','#C4613A');txt(t<7.8?m:'Surgelés à − 60 °C, direction le Japon',px+20,py+62*FS,'800 '+(portrait?19:26)+'px Mukta,sans-serif','#0012B5');
  wrap('Les thons grossissent plusieurs mois dans les cages, nourris de poissons gras sauvages, avant d’être abattus, surgelés et exportés, surtout vers le Japon.',px+20,py+88*FS,pw-40,18,'600 14px Mulish,sans-serif','#4A3B30');}
function summary(){if(G.sumDone)return;G.sumDone=true;G.phase='end';const days=G.day,full=G.tons>=QUOTA;
  const head=full?'Quota rempli en <b>'+days+' jour'+(days>1?'s':'')+'</b> de mer ! Nos thons sont à la ferme : ils y grossissent plusieurs mois avant d’être vendus.':'Le <b>24 juin</b>, la saison est close : on rentre avec <b>'+G.tons+' t</b> sur '+QUOTA+'. La fenêtre est courte, et c’est voulu : c’est elle qui a permis au thon rouge de revenir.';
  const lines=[head,'<div class="sg-sum"><div><b>'+G.tons+' / '+QUOTA+' t</b><span>livrées vivantes à la ferme</span></div><div><b>'+days+'</b><span>jour'+(days>1?'s':'')+' de mer</span></div><div><b>'+nf(G.fuel)+' L</b><span>de gasoil</span></div><div><b>'+G.released+' · '+G.refused+'</b><span>bancs relâchés : jeunes · refusés par la ferme</span></div></div>'+
   'Le thon de senne ne passe pas par la criée : il est livré vivant à la ferme. Allons voir comment se vendent les poissons des autres flottilles.<div class="sg-fine">Quota, bancs et consommations : fictifs, pour le jeu. Taille minimale du thon rouge : 30 kg ou 115 cm (ICCAT).</div>'];
  say(lines,()=>{sgClose();const c=document.getElementById('criee');if(c)c.scrollIntoView({behavior:'smooth'});},{last:'Direction la criée →'});
  setTimeout(()=>{const nav=$('sg-nav');if(nav&&!$('sg-again')){const b=document.createElement('button');b.className='sg-btn alt';b.id='sg-again';b.textContent='Rejouer';b.onclick=()=>{b.remove();talk=null;$('sg-talk').hidden=true;start();};nav.insertBefore(b,$('sg-next'));showLine();}},30);}

/* ================= soleil, ciel, vue FPV ================= */
function sunPos(tm){const H=((tm/60)-13.8)*15*D2R,ph=39.5*D2R,dc=22*D2R;const el=Math.asin(Math.sin(ph)*Math.sin(dc)+Math.cos(ph)*Math.cos(dc)*Math.cos(H));
  const az=Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(ph)-Math.tan(dc)*Math.cos(ph))+Math.PI;return{el:el/D2R,az};}
const SKY=[[-18,'#02050F','#081230'],[-8,'#0A1640','#22346A'],[-3,'#233F82','#D98F66'],[2,'#4A7FC8','#F4C896'],[8,'#3F7FD0','#C9E2F5'],[90,'#2F6FC8','#BCDDF6']].map(a=>[a[0],C(a[1]),C(a[2])]);
const SEA=[[-18,'#081634','#02060F'],[-3,'#22406E','#0B1A38'],[8,'#2F86C8','#0B3F80'],[90,'#2F8ACF','#0A3F82']].map(a=>[a[0],C(a[1]),C(a[2])]);
function kf(T,e){if(e<=T[0][0])return[T[0][1],T[0][2]];for(let i=0;i<T.length-1;i++)if(e<=T[i+1][0]){const t=(e-T[i][0])/(T[i+1][0]-T[i][0]);return[lerpC(T[i][1],T[i+1][1],t),lerpC(T[i][2],T[i+1][2],t)];}const l=T[T.length-1];return[l[1],l[2]];}
const hidden=d=>d>6.2?Math.pow((d-6.2)/2.08,2):0;
function drawFPV(){
  const W=L().win,x0=W[0],y0=W[1],w=W[2],h=W[3],cx=x0+w/2,B=G.boat,hd=B.h,tt=G.anim;
  const hfov=(portrait?64:74)*D2R,foc=(w/2)/Math.tan(hfov/2),sun=sunPos(G.t),e=sun.el;
  const amp=.5+Math.min(1,B.spd/12)*.5,pitch=(Math.sin(tt*1.1)*3+Math.sin(tt*.5)*1.5)*amp,roll=Math.sin(tt*.8)*amp*.8*D2R;
  const rel=a=>{let d=a-hd;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d;},ax=a=>Math.tan(a)*foc,E=w*1.2;
  ctx.save();ctx.beginPath();ctx.rect(x0,y0,w,h);ctx.clip();ctx.translate(cx,y0+h*.46+pitch);ctx.rotate(roll);
  const [top,hor]=kf(SKY,e);let g=ctx.createLinearGradient(0,-h*.8,0,0);g.addColorStop(0,S(top));g.addColorStop(1,S(hor));ctx.fillStyle=g;ctx.fillRect(-E,-h*1.4,2*E,h*1.4+1);
  const sr=rel(sun.az);
  if(e>-6&&e<16&&Math.abs(sr)<1.45){const gx=ax(clamp(sr,-1.25,1.25)),k=Math.max(0,1-Math.abs(e-1)/14)*.55;const gl=ctx.createRadialGradient(gx,0,10,gx,0,w*.65);gl.addColorStop(0,'rgba(255,170,90,'+k+')');gl.addColorStop(1,'rgba(255,170,90,0)');ctx.fillStyle=gl;ctx.fillRect(-E,-h*1.4,2*E,h*1.4);}
  const cc=e<4?'rgba(255,190,160,.55)':'rgba(255,255,255,.78)';
  for(const c of CLOUDS){const r=rel(c.az);if(Math.abs(r)>hfov/2+c.w)continue;const px=ax(r),py=-Math.tan(c.el)*foc,cw=c.w*foc,ch=c.h*foc;ctx.fillStyle=cc;for(let k=0;k<4;k++){ctx.beginPath();ctx.ellipse(px+(k-1.5)*cw*.3,py-(k%2)*ch*.4,cw*.35,ch,0,0,TAU);ctx.fill();}}
  if(e>-2&&Math.abs(sr)<hfov/2+.15){const sx=ax(sr),sy=-Math.tan(e*D2R)*foc;const sg=ctx.createRadialGradient(sx,sy,4,sx,sy,90);sg.addColorStop(0,'rgba(255,240,200,.9)');sg.addColorStop(1,'rgba(255,220,150,0)');ctx.fillStyle=sg;ctx.fillRect(sx-90,sy-90,180,180);ctx.fillStyle=e<5?'#FFC27A':'#FFF7DE';ctx.beginPath();ctx.arc(sx,sy,12,0,TAU);ctx.fill();}
  const [sh,sb]=kf(SEA,e);g=ctx.createLinearGradient(0,0,0,h*.75);g.addColorStop(0,S(sh));g.addColorStop(1,S(sb));ctx.fillStyle=g;ctx.fillRect(-E,0,2*E,h*1.4);
  // reliefs
  const pk=PEAKS.map(p=>({p,d:Math.hypot(p.x-B.x,p.y-B.y)})).sort((a,b)=>b.d-a.d);
  for(const {p,d} of pk){const v=p.e-hidden(d);if(v<=0)continue;const dm=d*1852,r=rel(Math.atan2(p.x-B.x,p.y-B.y)),hw=Math.min(1.2,Math.atan(p.e*p.w/dm));
    if(Math.abs(r)-hw>hfov/2||Math.abs(r)>Math.PI/2)continue;const top_=-Math.atan(v*1.6/dm)*foc,hz=clamp(d/70,.15,.85),lc=lerpC([98,110,104],hor,hz);ctx.fillStyle=S(lc);ctx.beginPath();ctx.moveTo(ax(clamp(r-hw,-1.4,1.4)),0);
    for(let k=0;k<=28;k++){const t=-1+2*k/28,a=clamp(r+t*hw,-1.4,1.4);ctx.lineTo(ax(a),top_*Math.pow(Math.max(0,1-Math.pow(Math.abs(t),1.5)),1.3)*(1+.07*Math.sin(t*9+p.sd)));}
    ctx.lineTo(ax(clamp(r+hw,-1.4,1.4)),0);ctx.closePath();ctx.fill();}
  // côtes des îles
  let prev=null;for(const c of CS){if(c.brk)prev=null;const d=Math.hypot(c.x-B.x,c.y-B.y),v=c.e-hidden(d),r=rel(Math.atan2(c.x-B.x,c.y-B.y));
    if(v<=0||d>25||d<.3||Math.abs(r)>hfov/2+.35){prev=null;continue;}const dm=d*1852,tp=Math.max(-h*.2,-v*1.6/dm*foc),bs=EYE/dm*foc,px=ax(r);
    if(prev&&Math.abs(prev.r-r)<.6){ctx.fillStyle=S(lerpC([150,140,112],hor,clamp(d/26,0,.75)));ctx.beginPath();ctx.moveTo(prev.px,prev.bs);ctx.lineTo(prev.px,prev.tp);ctx.lineTo(px,tp);ctx.lineTo(px,bs);ctx.closePath();ctx.fill();}prev={r,px,tp,bs};}
  // vagues
  const bx=B.x*1852,by=B.y*1852,sn=Math.sin(hd),cs=Math.cos(hd),SPC=16,RAD=280;ctx.lineWidth=1.3;
  const i0=Math.floor((bx-RAD)/SPC),i1=Math.ceil((bx+RAD)/SPC),j0=Math.floor((by-RAD)/SPC),j1=Math.ceil((by+RAD)/SPC);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const hs=(Math.imul(i,73856093)^Math.imul(j,19349663))>>>0,jx=(hs%1000)/1000,jy=((hs>>>10)%1000)/1000;
    const wx=i*SPC+jx*SPC+Math.sin(tt*.8+jx*6)*2,wy=j*SPC+jy*SPC,dx=wx-bx,dy=wy-by,f=dx*sn+dy*cs;if(f<12||f>RAD)continue;const r=dx*cs-dy*sn,sx=r/f*foc;if(sx<-w/2-20||sx>w/2+20)continue;
    const sy=EYE/f*foc,ln=foc*1.5/f,a=(1-f/RAD)*(.24+.12*Math.sin(tt*2+jx*9));if(a<=.02)continue;ctx.strokeStyle='rgba(255,255,255,'+a.toFixed(3)+')';ctx.beginPath();ctx.moveTo(sx-ln,sy);ctx.quadraticCurveTo(sx,sy-ln*.35,sx+ln,sy);ctx.stroke();}
  // autres senneurs
  for(const o of G.boats){const d=Math.hypot(o.x-B.x,o.y-B.y);if(d>9||d<.05)continue;const r=rel(Math.atan2(o.x-B.x,o.y-B.y));if(Math.abs(r)>hfov/2)continue;const dm=d*1852,px=ax(r),base=Math.max(0,(EYE-hidden(d))/dm*foc),k=foc/dm,L_=40*k,H_=8*k;
    ctx.fillStyle='#E9EEF3';ctx.beginPath();ctx.moveTo(px-L_/2,base-H_*.4);ctx.lineTo(px+L_/2,base-H_*.5);ctx.lineTo(px+L_*.4,base);ctx.lineTo(px-L_*.45,base);ctx.fill();ctx.fillRect(px+L_*.05,base-H_*1.4,L_*.22,H_);ctx.fillStyle='#9AA3AE';ctx.fillRect(px+L_*.12,base-H_*3.2,Math.max(1,k*.6),H_*2);}
  // chasses : oiseaux et écume au-dessus des bancs
  for(const b of G.banks){if(!b.alive)continue;const d=Math.hypot(b.x-B.x,b.y-B.y);if(d>9)continue;const r=rel(Math.atan2(b.x-B.x,b.y-B.y));if(Math.abs(r)>hfov/2+.1)continue;const dm=d*1852,px=ax(r),k=foc/dm;
    if(d<3.5){for(let i=0;i<14;i++){const s=((i*37+Math.floor(tt*3))%100)/100,ox=(s-.5)*Math.max(8,120*k)+Math.sin(tt*5+i)*2,oy=(EYE/dm)*foc+((i*13)%5);ctx.fillStyle='rgba(255,255,255,'+(.4+.4*Math.sin(tt*7+i))+')';ctx.beginPath();ctx.ellipse(px+ox,oy,Math.max(1.5,6*k),Math.max(.8,2*k),0,0,TAU);ctx.fill();}}
    const nb=b.young?8:14,kk=Math.min(k,.9);for(let i=0;i<nb;i++){const a=tt*(1.2+i*.05)+i*.9,rad=Math.max(6,70*kk)*(.5+(i%5)*.15),alt=(12+(i%4)*10)*kk*1.6+(Math.sin(tt*2+i)>0.8?-8*k:0);const bx2=px+Math.cos(a)*rad,by2=-(alt)+Math.sin(a)*rad*.2-hidden(d)/dm*foc*0,s=clamp(5*k*3,2.2,13),fl=Math.sin(tt*9+i);
      ctx.strokeStyle='rgba(40,48,60,.85)';ctx.lineWidth=Math.max(1,s*.18);ctx.beginPath();ctx.moveTo(bx2-s,by2-s*fl*.5);ctx.quadraticCurveTo(bx2-s*.4,by2-s*(.4+fl*.4),bx2,by2);ctx.quadraticCurveTo(bx2+s*.4,by2-s*(.4+fl*.4),bx2+s,by2-s*fl*.5);ctx.stroke();}}
  ctx.restore();
  drawBow(x0,y0,w,h,tt);drawFrame(x0,y0,w,h);}
function drawBow(x0,y0,w,h,tt){const cx=x0+w/2,by=y0+h,sy=y0+h*.62;
  if(G.boat.spd>2){for(let k=0;k<26;k++){const s=(k*37%100)/100,ph=(tt*1.6+s)%1,x=cx+(s-.5)*w*.4*(1-ph*.2),y=sy+6+ph*40;ctx.fillStyle='rgba(255,255,255,'+(.55*(1-ph))*(G.boat.spd/14)+')';ctx.beginPath();ctx.arc(x,y,2+ph*5,0,TAU);ctx.fill();}}
  ctx.fillStyle='#EEF2F6';ctx.beginPath();ctx.moveTo(x0+w*.02,by);ctx.lineTo(cx-10,sy-8);ctx.lineTo(cx+10,sy-8);ctx.lineTo(x0+w*.98,by);ctx.closePath();ctx.fill();
  ctx.fillStyle='#5E6B78';ctx.beginPath();ctx.moveTo(x0+w*.09,by);ctx.lineTo(cx-5,sy+4);ctx.lineTo(cx+5,sy+4);ctx.lineTo(x0+w*.91,by);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#0012B5';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x0+w*.06,by-h*.05);ctx.lineTo(cx-8,sy-12);ctx.lineTo(cx+8,sy-12);ctx.lineTo(x0+w*.94,by-h*.05);ctx.stroke();
  // mât et nid de pie
  const mx=cx+w*.14;ctx.fillStyle='#C9CFD8';ctx.fillRect(mx-4,y0,8,by-y0-h*.12);ctx.fillStyle='#8E99A5';ctx.fillRect(mx-4,y0,8,h*.02);
  ctx.fillStyle='#E9EEF3';rr(mx-26,y0+h*.12,52,24,6);ctx.fill();ctx.fillStyle='#0012B5';ctx.fillRect(mx-26,y0+h*.12+16,52,5);
  ctx.strokeStyle='#C9CFD8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(mx,y0+h*.2);ctx.lineTo(x0+w*.2,by-h*.08);ctx.moveTo(mx,y0+h*.2);ctx.lineTo(x0+w*.82,by-h*.06);ctx.stroke();}
function drawFrame(x0,y0,w,h){const pc='#11151D';ctx.fillStyle=pc;ctx.fillRect(x0,y0,w,14);const n=3;for(let i=0;i<=n;i++){const x=x0+i*w/n;ctx.fillRect(x-(i===0||i===n?0:12),y0,i===0||i===n?14:24,h);}
  const dg=ctx.createLinearGradient(0,y0+h,0,LH);dg.addColorStop(0,'#2B3240');dg.addColorStop(1,'#12151C');ctx.fillStyle=dg;ctx.fillRect(0,y0+h,LW,LH-y0-h);
  ctx.fillStyle='#3A4252';ctx.fillRect(0,y0+h-4,LW,12);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(0,y0+h-4,LW,2);}

/* ================= tableau de bord ================= */
function panel(r,title){ctx.fillStyle='#07090E';rr(r[0]-4,r[1]-4,r[2]+8,r[3]+8,14);ctx.fill();ctx.fillStyle='#0F1522';rr(r[0],r[1],r[2],r[3],10);ctx.fill();if(title)txt(title,r[0]+12,r[1]+(portrait?25:19),'700 11px "Courier New",monospace','#6FA8FF');}
function buildMap(){const m=mapRect();const oc=document.createElement('canvas');oc.width=Math.ceil(m[2]*DPR);oc.height=Math.ceil(m[3]*DPR);const c=oc.getContext('2d');c.setTransform(DPR,0,0,DPR,-m[0]*DPR,-m[1]*DPR);
  const st=portrait?4:3;for(let py=m[1];py<m[1]+m[3];py+=st)for(let px=m[0];px<m[0]+m[2];px+=st){const q=p2m(px+st/2,py+st/2);let col;if(inLand(q[0],q[1]))col='#E8DFC6';else{const dc=distCoast(q[0],q[1]);col=dc<3?'#CFEAF8':dc<8?'#9ED0EE':dc<18?'#6FAEE0':'#3F82C4';}c.fillStyle=col;c.fillRect(px,py,st+.5,st+.5);}
  c.strokeStyle='#6E6250';c.lineWidth=1.2;for(const i of ISL){c.beginPath();i.p.forEach((p,k)=>{const q=m2p(p[0],p[1]);k?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]);});c.closePath();c.stroke();}
  c.fillStyle='#3B3226';c.textAlign='center';for(const i of ISL){const q=m2p(i.l[0],i.l[1]);c.font=fs((i.n==='Majorque'?'800 11px':'700 9px')+' Mukta,sans-serif');c.fillText(i.n,q[0],q[1]+(i.n==='Cabrera'?12:0));}
  const s=mapFit().s,sq=[m[0]+m[2]-20*s-12,m[1]+m[3]-10];c.strokeStyle='#0A2A5A';c.lineWidth=2;c.beginPath();c.moveTo(sq[0],sq[1]);c.lineTo(sq[0]+20*s,sq[1]);c.stroke();c.font=fs('700 8px Mukta,sans-serif');c.fillStyle='#0A2A5A';c.fillText('20 milles',sq[0]+10*s,sq[1]-4);
  c.textAlign='left';c.font=fs('800 10px Mukta,sans-serif');c.fillText('N ↑ · BALÉARES',m[0]+6,m[1]+14*FS);return oc;}
function birdIcon(x,y,s,c){ctx.strokeStyle=c;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x-s,y-s*.3);ctx.quadraticCurveTo(x-s*.4,y-s*.8,x,y);ctx.quadraticCurveTo(x+s*.4,y-s*.8,x+s,y-s*.3);ctx.stroke();}
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
  ctx.save();ctx.beginPath();ctx.rect(m[0],m[1],m[2],m[3]);ctx.clip();
  ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.5;ctx.beginPath();G.track.forEach((a,i)=>{const p=m2p(a[0],a[1]);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);});ctx.stroke();
  for(const s of G.sets.filter(x=>x.pos)){const q=m2p(s.pos[0],s.pos[1]);ctx.fillStyle=s.young?'#C4613A':'#0E8A72';ctx.beginPath();ctx.arc(q[0],q[1],4,0,TAU);ctx.fill();}
  for(const o of G.boats){const q=m2p(o.x,o.y);ctx.save();ctx.translate(q[0],q[1]);ctx.rotate(o.h);ctx.fillStyle='#5A6576';ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(3.5,4);ctx.lineTo(-3.5,4);ctx.closePath();ctx.fill();ctx.restore();}
  for(const b of G.banks){if(!b.alive||!b.seen)continue;if(b.det){const q=m2p(b.x,b.y),rad=3+Math.sqrt(b.t)*.5;ctx.fillStyle=b.id&&b.kg<MINKG?'rgba(255,178,58,.9)':'rgba(255,77,61,.9)';ctx.beginPath();ctx.arc(q[0],q[1],rad,0,TAU);ctx.fill();
      if(b.id){const lb=b.kg<MINKG?'JEUNES · ~'+b.id.kg+' kg':'~'+b.id.t+' t · '+b.id.kg+' kg';ctx.font=fs('800 9px Mukta,sans-serif');const tw=ctx.measureText(lb).width+10;ctx.fillStyle=b.kg<MINKG?'#FFB23A':'#fff';rr(q[0]-tw/2,q[1]-rad-16*FS,tw,13*FS,6);ctx.fill();ctx.fillStyle='#0A0A1F';ctx.textAlign='center';ctx.fillText(lb,q[0],q[1]-rad-6*FS);}}
    else{const q=m2p(b.x+b.ox,b.y+b.oy);birdIcon(q[0],q[1],5,'#0A2A5A');birdIcon(q[0]+6,q[1]-4,4,'#0A2A5A');ctx.font=fs('800 9px Mukta,sans-serif');ctx.fillStyle='#0A2A5A';ctx.textAlign='center';ctx.fillText('?',q[0]+2,q[1]+10*FS);}}
  const B=G.boat,bq=m2p(B.x,B.y);
  if(G.dest){const q=m2p(G.dest[0],G.dest[1]);ctx.strokeStyle='#E0321F';ctx.setLineDash([6,4]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bq[0],bq[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(q[0],q[1],6,0,TAU);ctx.stroke();}
  ctx.strokeStyle='rgba(0,255,255,.35)';ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(bq[0],bq[1],7*mapFit().s,0,TAU);ctx.stroke();ctx.setLineDash([]);
  ctx.save();ctx.translate(bq[0],bq[1]);ctx.rotate(B.h);ctx.fillStyle='#00FFFF';ctx.strokeStyle='#0A0A1F';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(0,4);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  if(G.phase==='plan'&&!G.dest){ctx.fillStyle='rgba(10,10,31,.78)';const tw=portrait?330:250;rr(m[0]+m[2]/2-tw/2,m[1]+m[3]-40*FS,tw,26*FS,13*FS);ctx.fill();txt('Touche le traceur pour choisir ta route',m[0]+m[2]/2,m[1]+m[3]-22*FS,'800 12px Mukta,sans-serif','#00FFFF','center');}
  compass(m,G.boat.h,(G.dest?[[brgA(G.dest[0],G.dest[1]),'#E0321F']]:[]).concat(G.banks.filter(b=>b.alive&&b.seen).map(b=>[brgA(b.x,b.y),G.chase===b?'#FF4D3D':'#FF7A1A'])),'br');ctx.restore();drawInfo(r);}
function drawInfo(r){const iw=portrait?236:196,x=r[0]+r[2]-iw-2,y=r[1]+6,w=iw-8;ctx.fillStyle='#0A0F1A';rr(x,y,w,r[3]-12,8);ctx.fill();
  const B=G.boat,lx=x+10,lh=portrait?25:17;let yy=y+(portrait?26:18);const L1=(a,b,c)=>{txt(a,lx,yy,'700 10px Mukta,sans-serif','#7F93B8');if(b)txt(b,x+w-10,yy,'800 11px Mukta,sans-serif',c||'#E7ECFF','right');yy+=lh;};
  txt('CAP '+pad(Math.round(((B.h/D2R)%360+360)%360))+'°',lx,yy,'800 12px Mukta,sans-serif','#00FFFF');txt((B.spd.toFixed(1)).replace('.',',')+' nds',x+w-10,yy,'800 12px Mukta,sans-serif','#00FFFF','right');yy+=lh;
  L1('Lieu',placeName(B.x,B.y));
  if(G.dest){const dd=Math.hypot(G.dest[0]-B.x,G.dest[1]-B.y);L1('Distance',(dd.toFixed(1)).replace('.',',')+' M');L1('Arrivée',fmtT(G.t+dd/THR[G.thr].kn*60),'#FFE9A8');}else yy+=lh*2;
  yy+=portrait?4:3;txt('BANCS',lx,yy,'800 9px Mukta,sans-serif','#7F93B8');yy+=lh;
  const seen=G.banks.filter(b=>b.alive&&b.seen).length,det=G.banks.filter(b=>b.alive&&b.det).length;L1('Oiseaux repérés',String(seen));L1('Échos au sonar',String(det));
  const n=nearest(true);if(n&&n.d<3){const b=n.b;L1('Le plus proche',(n.d.toFixed(1)).replace('.',',')+' M');L1('Identification',b.id?(b.kg<MINKG?'jeunes · ~'+b.id.kg+' kg':'~'+b.id.t+' t · ~'+b.id.kg+' kg'):'à faire',b.id?(b.kg<MINKG?'#FFB23A':'#3BF0A0'):'#FFE9A8');}
  const k=Math.max(0,(T_DUSK-G.t)/60);txt('Nuit dans '+fmtT(Math.max(0,T_DUSK-G.t)),lx,y+r[3]-22,'700 10px Mukta,sans-serif',k<1.5?'#FF9A7A':'#7F93B8');miniCmp(x,y,w,r[3]-12,0);}
function drawSonar(){const r=L().son;panel(r,'SONAR 360°');const R=Math.min(r[2]-24,r[3]-(portrait?44:36))/2,cx=r[0]+r[2]/2,cy=r[1]+(portrait?34:26)+R,RANGE=1.6,B=G.boat,tt=G.anim;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.clip();ctx.fillStyle='#03182F';ctx.fillRect(cx-R,cy-R,2*R,2*R);
  ctx.strokeStyle='rgba(0,255,255,.18)';ctx.lineWidth=1;for(let i=1;i<=3;i++){ctx.beginPath();ctx.arc(cx,cy,R*i/3,0,TAU);ctx.stroke();}ctx.beginPath();ctx.moveTo(cx-R,cy);ctx.lineTo(cx+R,cy);ctx.moveTo(cx,cy-R);ctx.lineTo(cx,cy+R);ctx.stroke();
  const sw=(tt*1.8)%TAU;const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,R);gr.addColorStop(0,'rgba(0,255,160,.25)');gr.addColorStop(1,'rgba(0,255,160,.05)');ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,sw-.5,sw);ctx.closePath();ctx.fill();
  for(const b of G.banks){if(!b.alive)continue;const dx=b.x-B.x,dy=b.y-B.y,d=Math.hypot(dx,dy);if(d>RANGE)continue;const f=dx*Math.sin(B.h)+dy*Math.cos(B.h),s=dx*Math.cos(B.h)-dy*Math.sin(B.h);const px=cx+s/RANGE*R,py=cy-f/RANGE*R,rad=4+Math.sqrt(b.t)*.9;
    for(let i=0;i<14;i++){const a=i*2.4+b.sd,rr0=rad*((i*37%100)/100);ctx.fillStyle=i%3?'rgba(255,77,61,.85)':'rgba(255,210,63,.9)';ctx.beginPath();ctx.arc(px+Math.cos(a)*rr0,py+Math.sin(a)*rr0,2.2,0,TAU);ctx.fill();}}
  ctx.restore();ctx.strokeStyle='#1E3A5A';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.stroke();
  ctx.fillStyle='#00FFFF';ctx.beginPath();ctx.moveTo(cx,cy-6);ctx.lineTo(cx+4,cy+5);ctx.lineTo(cx-4,cy+5);ctx.closePath();ctx.fill();
  txt('1,6 M',r[0]+r[2]-10,r[1]+r[3]-8,'700 9px Mukta,sans-serif','#7F93B8','right');}
function drawGauges(){const r=L().gau;panel(r,null);const x=r[0]+12,y=r[1];
  txt(clk(G.t),x,y+(portrait?62:46),'800 34px "Courier New",monospace','#FFE9A8');txt('Jour '+G.day+' · '+dateLab(G.day),x,y+(portrait?92:66),'700 10px Mukta,sans-serif','#7F93B8');
  const bx=portrait?x:x+160,bw=portrait?r[2]-24:r[2]-184,by=portrait?y+112:y+30;txt('QUOTA',bx,by,'700 10px Mukta,sans-serif','#7F93B8');txt(G.tons+' / '+QUOTA+' t',bx+bw,by,'800 12px Mukta,sans-serif','#3BF0A0','right');
  ctx.fillStyle='#1E2740';rr(bx,by+6,bw,10,5);ctx.fill();ctx.fillStyle='#3BF0A0';rr(bx,by+6,bw*Math.min(1,G.tons/QUOTA),10,5);ctx.fill();
  const y2=by+(portrait?38:36);txt('Gasoil',bx,y2,'700 10px Mukta,sans-serif','#7F93B8');txt(nf(G.fuel)+' L',bx+bw,y2,'800 11px Mukta,sans-serif','#FFB23A','right');
  if(!portrait){txt('Bancs relâchés',bx,y2+18,'700 10px Mukta,sans-serif','#7F93B8');txt(String(G.released),bx+bw,y2+18,'800 11px Mukta,sans-serif','#E7ECFF','right');txt('Refusés par la ferme',bx,y2+36,'700 10px Mukta,sans-serif','#7F93B8');txt(String(G.refused),bx+bw,y2+36,'800 11px Mukta,sans-serif','#E7ECFF','right');}
  if(G.warp>1)txt('temps ×4',portrait?r[0]+r[2]-12:x,portrait?y+30:y+104,'800 10px Mukta,sans-serif','#00FFFF',portrait?'right':'left');}
function btn(rc,label,on,col,sel){ctx.fillStyle=sel?'#00FFFF':on?(col||'#1E2A44'):'#1A1F2B';rr(rc[0],rc[1],rc[2],rc[3],10);ctx.fill();ctx.font=fs('800 12px Mukta,sans-serif');ctx.fillStyle=sel?'#0012B5':on?'#fff':'#5A6478';ctx.textAlign='center';ctx.fillText(label,rc[0]+rc[2]/2,rc[1]+rc[3]/2+4*FS);}
function drawCtrl(){const r=L().ctrl;panel(r,null);const u=G.ui,pul=(Math.sin(G.anim*4)+1)/2,[lab,short,on]=actLabel();
  if(portrait){const y=r[1]+8,h=r[3]-16;u.thr=[0,1,2].map(i=>[r[0]+8+i*96,y,90,h]);u.act=[r[0]+300,y,300,h];u.warp=[r[0]+608,y,80,h];}
  else{u.thr=[0,1,2].map(i=>[r[0]+8+i*98,r[1]+8,92,38]);u.act=[r[0]+8,r[1]+54,290,60];u.warp=[r[0]+8,r[1]+122,290,34];}
  THR.forEach((T,i)=>btn(u.thr[i],portrait?['CHERCHE','ROUTE','PLEIN'][i]:T.n+' '+T.kn+' nds',true,null,G.thr===i));
  const a=u.act;ctx.fillStyle=on?'#FF4D3D':'#3A2A2A';ctx.shadowColor='#FF4D3D';ctx.shadowBlur=on?14+10*pul:0;rr(a[0],a[1],a[2],a[3],14);ctx.fill();ctx.shadowBlur=0;
  txt(portrait?short:lab,a[0]+a[2]/2,a[1]+a[3]/2+6,'800 '+(portrait?16:17)+'px Mukta,sans-serif',on?'#fff':'#9A8A8A','center');
  btn(u.warp,portrait?'×4':(G.warp>1?'⏩ Temps ×4':'⏩ Accélérer'),G.phase==='sea',null,G.warp>1);}
function drawTip(){const r=L().tip;panel(r,null);const fsz=portrait?62:64,cx=r[0]+12+fsz/2,cy=r[1]+r[3]/2;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,fsz/2,0,TAU);ctx.clip();if(JIMG.complete)ctx.drawImage(JIMG,cx-fsz/2,cy-fsz/2,fsz,fsz);ctx.restore();ctx.strokeStyle='#00FFFF';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,fsz/2,0,TAU);ctx.stroke();
  let t;const n=nearest(true);
  if(G.phase==='plan')t=G.dest?'Bonne route ! Choisis l’allure : plein gaz arrive plus vite mais consomme beaucoup plus.':'Touche le traceur pour choisir ta route. Le collègue a vu des oiseaux, on commence par là ?';
  else if(G.identT>0)t='On s’approche doucement. L’observateur et le sonar estiment la taille des thons…';
  else if(n&&n.d<1.2&&n.b.id&&n.b.kg<MINKG)t='Ce sont des jeunes, sous 30 kg : on les laisse grandir. Cherche un autre banc.';
  else if(G.pendingSet)t='On se met en position : dès qu’on est à 0,8 mille, on largue. Prépare le semi-rigide !';
  else if(G.chase&&!(n&&n.d<1.2))t='Cap sur les oiseaux : je ralentis à l’approche pour ne pas effrayer le banc.';
  else if(n&&n.d<1.2&&n.b.id)t='Banc identifié : à toi de décider si on y va.';
  else if(n&&n.d<1.2)t='Un écho au sonar ! Identifie le banc avant de larguer.';
  else if(G.banks.some(b=>b.alive&&b.seen&&!b.det))t='Des oiseaux sur le traceur (?) : fais route dessus, le sonar confirmera.';
  else t=G.t>T_DUSK-120?'La nuit approche. Profite de la dernière lumière pour chercher.':'Scrute l’horizon : les oiseaux qui plongent trahissent une chasse de thons.';
  wrap(t,r[0]+fsz+26,r[1]+(portrait?30:24),r[2]-fsz-36,portrait?15:16,'600 13px Mulish,sans-serif','#E7ECFF');}
function drawToast(){if(!G.msg)return;const W=L().win,a=Math.min(1,G.msg.life*2);ctx.save();ctx.globalAlpha=a;ctx.font=fs('800 16px Mukta,sans-serif');const tw=Math.min(W[2]-60,ctx.measureText(G.msg.t).width+40),th=34*FS;
  ctx.fillStyle=G.msg.c;rr(W[0]+W[2]/2-tw/2,W[1]+26,tw,th,th/2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(G.msg.t,W[0]+W[2]/2,W[1]+26+th*.66,tw-24);ctx.restore();}

/* ================= boucle et commandes ================= */
let last=0;
function loop(ts){if(!running)return;const dt=Math.min(.05,(ts-last)/1000||0);last=ts;
  if(cv.parentElement.clientWidth&&Math.abs(cv.width/DPR-LW)>1)resize();
  update(dt);
  if(G){if(G.scene==='encer')drawEnc();else if(G.scene==='transfert')drawTr();else if(G.scene==='ferme')drawFarm();else{drawFPV();drawSonar();drawTip();drawPlot();drawGauges();drawCtrl();drawToast();}
    if(G.fade>0){ctx.fillStyle='rgba(2,5,15,'+G.fade+')';ctx.fillRect(0,0,LW,LH);}}
  raf=requestAnimationFrame(loop);}
function ptr(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*LW/r.width,(e.clientY-r.top)*LH/r.height];}
function encW(p){const sc=portrait?1.02:.98,cx=portrait?360:640,cy=portrait?600:380;return[(p[0]-cx)/sc,(p[1]-cy)/sc];}
cv.addEventListener('pointerdown',e=>{if(!G||talk)return;e.preventDefault();const p=ptr(e);
  if(G.scene==='encer'){if(G.enc)G.enc.ptr=encW(p);G.drag=true;return;}
  if(G.scene==='transfert'){const T=G.tr;if(T&&!T.done&&inR(p,G.ui.skipT))T.t=T.dur;return;}
  if(G.scene!=='sea')return;const u=G.ui;
  for(let i=0;i<3;i++)if(inR(p,u.thr&&u.thr[i])){G.thr=i;return;}
  if(inR(p,u.act)){act();return;}if(inR(p,u.warp)){if(G.phase==='sea')G.warp=G.warp===1?4:1;return;}
  if(inR(p,mapRect())){plotClick(p2m(p[0],p[1]));return;}});
cv.addEventListener('pointermove',e=>{if(G&&G.scene==='encer'&&G.enc&&(G.drag||e.pointerType==='mouse'))G.enc.ptr=encW(ptr(e));});
window.addEventListener('pointerup',()=>{if(!G)return;G.drag=false;if(G.scene==='encer'&&G.enc&&!matchMedia('(pointer:fine)').matches)G.enc.ptr=null;});
window.addEventListener('keydown',e=>{if(!running||!G)return;if(e.code==='Escape'){sgClose();return;}if(talk)return;
  if(G.scene==='encer'&&G.enc&&e.code.startsWith('Arrow')){G.enc.keys[e.code]=true;G.enc.ptr=null;e.preventDefault();return;}
  if(e.code==='Space'&&G.scene==='sea'){e.preventDefault();act();}});
window.addEventListener('keyup',e=>{if(G&&G.enc)G.enc.keys[e.code]=false;});
function start(){newGame();say(introLines(),null,{last:'On y va →'});}
window.sgOpen=function(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.documentElement.style.overflow='hidden';running=true;resize();start();last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);};
window.sgClose=function(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.documentElement.style.overflow='';running=false;cancelAnimationFrame(raf);talk=null;$('sg-talk').hidden=true;G=null;const a=$('sg-again');if(a)a.remove();};
window.__SG={get G(){return G},get talk(){return talk},next(){$('sg-next').click();},act,plot(x,y){plotClick([x,y]);},nearest};
})();
