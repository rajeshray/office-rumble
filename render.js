const W = 1280, H = 550, GROUND = 453;
const colors = ['#75edd0', '#ff92b9'];
const rr = (c, x, y, w, h, r, fill) => { c.fillStyle = fill; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
function line(c, points, width, color) { c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.stroke(); }
function circle(c, x, y, r, fill) { c.fillStyle=fill; c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill(); }
export function createRenderer(canvas) {
  const c = canvas.getContext('2d');
  const backdrop = document.createElement('canvas');backdrop.width=W;backdrop.height=H;
  const b=backdrop.getContext('2d');
  const sky=b.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#30204f');sky.addColorStop(1,'#67418d');b.fillStyle=sky;b.fillRect(0,0,W,H);
  // Background is part of the playable canvas, drawn once to keep animation light.
  for(let i=0;i<5;i++){
    const x=75+i*254;rr(b,x,87,211,268,4,'#24163e');
    const sunset=b.createLinearGradient(0,110,0,340);sunset.addColorStop(0,'#745091');sunset.addColorStop(.55,'#bb799b');sunset.addColorStop(1,'#674079');b.fillStyle=sunset;b.fillRect(x+7,94,197,254);
    b.fillStyle='#694978';for(let j=0;j<6;j++){const height=35+((i*67+j*43)%101);b.fillRect(x+7+j*34,348-height,28,height);}
    b.fillStyle='#332048';b.fillRect(x+102,94,7,254);b.fillRect(x+7,214,197,7);
    b.fillStyle='#a67bb522';b.fillRect(x+16,104,70,100);
  }
  b.fillStyle='#3e295c';b.fillRect(0,347,W,51);b.fillStyle='#9364ab';b.fillRect(0,351,W,5);
  // Breakroom furniture lives behind the fighters.
  rr(b,462,289,360,96,5,'#412957');rr(b,451,282,382,13,4,'#9d77b6');
  for(let i=0;i<3;i++){rr(b,476+i*113,303,99,68,2,'#52336d');rr(b,511+i*113,312,30,4,2,'#9475a9');}
  rr(b,554,226,57,55,6,'#261b40');rr(b,562,235,41,18,2,'#69527d');rr(b,566,257,18,18,2,'#bda2c7');
  rr(b,660,256,26,26,3,'#d5b6dc');rr(b,685,262,9,12,3,'#d5b6dc');rr(b,687,265,4,6,1,'#60417b');
  b.save();b.translate(641,137);b.rotate(-.04);rr(b,-84,-15,168,54,3,'#debbdf');b.fillStyle='#523362';b.textAlign='center';b.font='bold 12px sans-serif';b.fillText('THIS COULD HAVE',0,7);b.fillText('BEEN AN EMAIL.',0,25);b.restore();
  // Plants and floor grid establish readable depth without a large image download.
  for(const x of [41,1239]){line(b,[[x,366],[x,265]],7,'#574170');for(let i=0;i<4;i++){b.save();b.translate(x,290+i*17);b.rotate((i%2?1:-1)*.85);rr(b,-9,-37,18,47,10,'#81679a');b.restore();}rr(b,x-24,350,48,48,[3,3,16,16],'#ac7eaa');}
  const floor=b.createLinearGradient(0,397,0,H);floor.addColorStop(0,'#573573');floor.addColorStop(1,'#30204c');b.fillStyle=floor;b.fillRect(0,397,W,H-397);line(b,[[0,397],[W,397]],3,'#9b6bb0');
  b.strokeStyle='#9260af35';b.lineWidth=1;for(let i=-6;i<15;i++){b.beginPath();b.moveTo(640+(i-4)*71,398);b.lineTo(640+(i-4)*188,H);b.stroke();}for(const y of [414,440,478,533]){b.beginPath();b.moveTo(0,y);b.lineTo(W,y);b.stroke();}
  b.globalAlpha=.1;b.fillStyle='white';for(let i=0;i<1200;i++){const x=(i*197)%W,y=(i*83)%H;b.fillRect(x,y,1,1);}b.globalAlpha=1;
  let lastWidth=0,lastHeight=0;
  function resize(){const dpr=Math.min(window.devicePixelRatio||1,2);const width=Math.round(canvas.clientWidth*dpr),height=Math.round(canvas.clientHeight*dpr);if(width!==lastWidth||height!==lastHeight){canvas.width=width;canvas.height=height;lastWidth=width;lastHeight=height;}}
  function fighter(p, id, t, face, winner, reduced, resultAge=null) {
    const x=resultAge===null?p.x:Math.max(195,Math.min(W-195,p.x)), y=GROUND-p.y;const facing=p.facing;
    const dizzy=p.dizzy>0;const beat=dizzy?17:7;
    const dance=reduced?0:Math.sin(t*beat+id*2.2);const dance2=reduced?0:Math.cos(t*beat+id*2.2);
    const moving=Math.abs(p.vx||0)>1;const duck=p.blocking?36:0;const hit=p.hurt>0;const punch=p.attack!=null;const elapsed=p.attack?.elapsed||0;
    const reach=punch?Math.sin(Math.min(1,elapsed/.23)*Math.PI):0;
    const stride=moving&&!reduced?Math.sin(t*19)*23:dance*12;const bounce=Math.abs(dance)*5;
    c.save();c.globalAlpha=.25;c.fillStyle='#140e25';c.beginPath();c.ellipse(x,GROUND+6,59-Math.min(p.y/12,20),10,0,0,Math.PI*2);c.fill();c.restore();
    if(p.dodge>0&&!reduced){for(let k=1;k<=3;k++){c.save();c.globalAlpha=.22/k;c.fillStyle=colors[id];c.beginPath();c.ellipse(x-p.dodgeDirection*k*22,y-78,28,70,-p.dodgeDirection*.3,0,Math.PI*2);c.fill();c.restore();}}
    if(p.powerFlash>0){c.save();c.globalAlpha=p.powerFlash*.55;c.strokeStyle=colors[id];c.lineWidth=6;c.beginPath();c.ellipse(x,y-95,60+(1-p.powerFlash)*28,100,0,0,Math.PI*2);c.stroke();c.restore();}
    c.save();c.translate(x,y);c.scale(facing,1);if(hit)c.rotate(-.1);if(winner)c.rotate(dance*.055);if(dizzy)c.rotate(dance*.10);
    if(p.dodge>0){c.translate(0,10);c.rotate(-.32*p.dodgeDirection*facing);c.globalAlpha=.62;}
    if(p.tumble>0&&!reduced){c.translate(0,-80);c.rotate((1-p.tumble/p.tumbleDuration)*Math.PI*2);c.translate(0,80);}
    if(resultAge!==null&&!winner){const fall=reduced?1:Math.min(1,resultAge/.85);c.translate(0,-70+20*fall-Math.sin(fall*Math.PI)*105);c.rotate(-1.43*fall);c.translate(0,70);}
    const hipY=-62+duck*.3, neckY=-139+duck+bounce;
    // Springy trousers, absurdly large sneakers, shirt, tie and boxing gloves.
    const kneeL=[-26-stride*.5,-32],kneeR=[26+stride*.5,-34];
    const footL=[-31+stride,-3],footR=[30-stride,-3];if(p.y>1){footL[1]-=18;footR[0]+=12;footR[1]-=26;}
    line(c,[[-13,hipY],kneeL,footL],19,'#1e1734');line(c,[[13,hipY],kneeR,footR],19,'#1e1734');
    rr(c,footL[0]-19,footL[1]-9,39,15,7,'#f5edf3');rr(c,footR[0]-15,footR[1]-9,40,15,7,'#f5edf3');
    line(c,[[footL[0]-17,footL[1]+5],[footL[0]+18,footL[1]+5]],4,'#a79cbc');line(c,[[footR[0]-13,footR[1]+5],[footR[0]+22,footR[1]+5]],4,'#a79cbc');
    const hipX=dance*4; c.fillStyle=colors[id];c.strokeStyle='#261a3e';c.lineWidth=3;c.beginPath();c.moveTo(-27,neckY+12);c.quadraticCurveTo(0,neckY+2,26,neckY+12);c.lineTo(30+hipX,hipY+4);c.quadraticCurveTo(0,hipY+15,-29+hipX,hipY+4);c.closePath();c.fill();c.stroke();
    c.fillStyle='#fff4ee';c.beginPath();c.moveTo(-13,neckY+10);c.lineTo(0,neckY+28);c.lineTo(13,neckY+10);c.fill();
    c.fillStyle=id?'#9b335c':'#288679';c.beginPath();c.moveTo(0,neckY+22);c.lineTo(8+dance*3,hipY-7);c.lineTo(0+dance*3,hipY+2);c.lineTo(-6+dance*3,hipY-9);c.closePath();c.fill();
    let backHand=[-49+dance*8,neckY+34-dance2*15],frontHand=[49+dance*8,neckY+29+dance2*15];
    if(p.blocking){backHand=[17,neckY+3];frontHand=[38,neckY-3];}
    if(punch){frontHand=[40+reach*77,neckY+24-reach*5];backHand=[-28,neckY+30];}
    if(winner){backHand=[-52,neckY-36-dance2*12];frontHand=[52,neckY-36+dance2*12];}
    if(p.powerFlash>0){frontHand=[72,neckY+12];backHand=[-37,neckY-17];}
    line(c,[[-23,neckY+24],[-43,neckY+45],backHand],16,colors[id]);line(c,[[23,neckY+24],[44+reach*20,neckY+46-reach*22],frontHand],17,colors[id]);
    for(const hand of [backHand,frontHand]){circle(c,hand[0],hand[1],16,'#241833');circle(c,hand[0],hand[1]-1,13,id?'#ff649c':'#c8ff66');line(c,[[hand[0]-6,hand[1]+7],[hand[0]+6,hand[1]+7]],3,id?'#c83f74':'#83b749');}
    const headX=dance*4,headY=neckY-34; c.save();c.translate(headX,headY);c.rotate(dance*.09);c.scale(facing,1);
    const headScale=p.bigHead>0?1+Math.min(1,p.bigHead/.25)*(.62+(reduced?0:Math.sin(t*14)*.08)):1;
    c.scale(headScale,headScale);
    circle(c,0,0,43,'#211832');circle(c,0,-1,39,face?'#f0dbc7':id?'#f6c3ae':'#efc895');
    if(face){c.save();c.beginPath();c.arc(0,-1,38,0,Math.PI*2);c.clip();c.drawImage(face,-38,-39,76,76);c.restore();}
    else{c.fillStyle=id?'#4b2746':'#423039';c.beginPath();c.arc(0,-2,38,Math.PI,Math.PI*2);c.lineTo(36,-4);c.quadraticCurveTo(18,-22,7,-22);c.quadraticCurveTo(-8,-8,-35,-10);c.fill();circle(c,-13,0,3,'#38283a');circle(c,13,0,3,'#38283a');line(c,[[-11,16],[0,20],[12,14]],3,'#38283a');circle(c,-24,12,5,id?'#ee9e9d':'#e7ad8e');circle(c,24,12,5,id?'#ee9e9d':'#e7ad8e');if(!id){line(c,[[-25,-5],[-3,-5],[-3,7],[-25,7],[-25,-5]],2,'#38283a');line(c,[[3,-5],[25,-5],[25,7],[3,7],[3,-5]],2,'#38283a');line(c,[[-3,0],[3,0]],2,'#38283a');}}
    if(winner){c.fillStyle='#dfff69';c.strokeStyle='#382139';c.lineWidth=2;c.beginPath();c.moveTo(-23,-44);c.lineTo(-28,-66);c.lineTo(-10,-57);c.lineTo(0,-74);c.lineTo(11,-57);c.lineTo(29,-66);c.lineTo(23,-44);c.closePath();c.fill();c.stroke();}
    c.restore();c.restore();
    if(dizzy){c.save();c.font='bold 23px sans-serif';c.textAlign='center';for(let k=0;k<3;k++){const angle=t*5+k*Math.PI*2/3;c.fillStyle=k%2?'#ff92b9':'#dfff69';c.fillText('✦',x+Math.cos(angle)*42,y-210+Math.sin(angle)*12);}c.restore();}
    if(p.blocking||p.parry>0){c.save();c.translate(x+facing*22,y-108);c.scale(facing,1);c.strokeStyle=p.parry>0?'#f5ff8e':'#7edff4';c.fillStyle=p.parry>0?'#f5ff8e33':'#7edff419';c.lineWidth=p.parry>0?6:3;c.beginPath();c.moveTo(8,-81);c.quadraticCurveTo(80,-67,75,1);c.quadraticCurveTo(70,48,8,76);c.lineTo(8,-81);c.closePath();c.fill();c.stroke();if(p.parry>0){c.font='900 27px sans-serif';c.fillStyle='#f5ff8e';c.textAlign='center';c.fillText('✦',40,0);}c.restore();}
    if(p.guardBreak>0){c.save();c.fillStyle='#ffb66e';c.font='bold 14px sans-serif';c.textAlign='center';c.fillText('GUARD BROKEN',x,y-220);c.restore();}
  }
  return { draw(state, time, faces, effects=[], reduced=false) {
    resize();c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);c.clearRect(0,0,W,H);c.drawImage(backdrop,0,0);
    const superActive=(state.projectiles||[]).some(p=>p.superPower);
    if(superActive){c.fillStyle='#20103666';c.fillRect(0,0,W,H);if(!reduced){c.strokeStyle='#efd5ff26';c.lineWidth=2;for(let i=0;i<24;i++){const a=i*Math.PI/12+time*.2;line(c,[[640+Math.cos(a)*160,270+Math.sin(a)*100],[640+Math.cos(a)*830,270+Math.sin(a)*580]],2,'#efd5ff26');}}}
    const force=effects.reduce((max,e)=>e.type==='burst'&&e.life>.25?Math.max(max,e.superPower?8:4):max,0);
    const shake=reduced?0:Math.sin(time*85)*force;c.save();c.translate(shake,0);
    for(let i=0;i<2;i++)fighter(state.players[i],i,time,faces[i],state.phase==='result'&&state.winner===i,reduced,state.phase==='result'?state.resultAge:null);
    for(const p of state.projectiles||[]){
      if(p.delay>0)continue;
      c.save();c.translate(p.x,GROUND-p.y);c.scale(p.direction,1);c.rotate(reduced?0:Math.sin(p.age*17)*.15);
      const size=p.superPower?2.8:p.kind==='coffee'?1.4:1.08;c.scale(size,size);
      if(p.reflected){c.strokeStyle='#7ef4ff';c.lineWidth=3;c.beginPath();c.arc(0,0,43,0,Math.PI*2);c.stroke();}
      if(p.superPower){c.save();c.globalAlpha=.7;c.fillStyle=p.kind==='coffee'?'#ffb348':'#ed70ff';c.beginPath();c.moveTo(20,-22);c.lineTo(-50,-41);c.lineTo(-39,-19);c.lineTo(-89,-16);c.lineTo(-62,0);c.lineTo(-95,23);c.lineTo(-44,18);c.lineTo(-61,41);c.lineTo(21,25);c.closePath();c.fill();c.restore();}
      for(let n=1;n<=3;n++){c.globalAlpha=.23/n;line(c,[[-25-n*19,-12+n*7],[-52-n*24,-12+n*7]],6,colors[p.owner]);}c.globalAlpha=1;
      if(p.kind==='coffee'){
        c.strokeStyle='#211832';c.lineWidth=5;c.fillStyle='#dfff69';c.beginPath();c.roundRect(13,-16,23,30,8);c.fill();c.stroke();
        c.fillStyle='#dfff69';c.beginPath();c.roundRect(-27,-29,49,55,[4,4,15,15]);c.fill();c.stroke();rr(c,-23,-27,41,9,3,'#7a4931');
        c.fillStyle='#332143';c.textAlign='center';c.font='900 14px sans-serif';c.fillText(p.superPower?'RIP':'NO. 1',-3,4);c.font='bold 9px sans-serif';c.fillText(p.superPower?'DECAF':'FUEL',-3,16);
        for(let k=0;k<3;k++)line(c,[[-17+k*15,-39],[-22+k*15,-49-Math.sin(time*9+k)*5]],4,'#f5efdb');
      }else{
        c.fillStyle='#fff2dc';c.strokeStyle='#251838';c.lineWidth=3;c.beginPath();c.roundRect(-26,-19,52,38,4);c.fill();c.stroke();line(c,[[-24,-17],[0,3],[24,-17]],3,'#cf729e');line(c,[[-23,16],[-7,1]],2,'#cf729e');line(c,[[23,16],[7,1]],2,'#cf729e');circle(c,24,-19,12,'#ff639b');c.fillStyle='white';c.font='900 16px sans-serif';c.textAlign='center';c.fillText('!',24,-13);
      }
      c.restore();
    }
    c.restore();
    for(const e of effects){
      if(e.type==='burst'){
        if(reduced)continue;
        c.save();c.translate(e.x,e.y+60);c.globalAlpha=Math.min(1,e.life*3);const progress=1-e.life/e.maxLife;
        for(let i=0;i<14;i++){const a=i*Math.PI/7;const distance=progress*(e.superPower?160:90);c.save();c.translate(Math.cos(a)*distance,Math.sin(a)*distance+progress*progress*60);c.rotate(a+progress*5);rr(c,-4,-6,8,12,2,['#dfff69','#ff92b9','#75edd0','#fff4de'][i%4]);c.restore();}c.restore();continue;
      }
      c.save();c.globalAlpha=Math.min(1,e.life*3);c.translate(e.x,e.y-(.65-e.life)*(reduced?0:60));c.rotate(e.rotation||-.13);c.font=`900 ${e.superPower?(e.type==='power'?49:38):e.combo===3?43:32}px 'Barlow Condensed', Impact, sans-serif`;c.textAlign='center';c.lineWidth=6;c.strokeStyle='#251635';c.strokeText(e.text,0,0);c.fillStyle=e.color||'#dfff69';c.fillText(e.text,0,0);c.restore();
    }
    if(state.phase==='result'&&!reduced&&state.resultAge<4){for(let i=0;i<75;i++){const x=(i*179+Math.sin(time*2+i)*22)%W,y=-40+((state.resultAge*160+i*47)%630);c.save();c.translate(x,y);c.rotate(time*3+i);rr(c,-3,-6,6,12,1,['#dfff69','#ff92b9','#75edd0'][i%3]);c.restore();}}
    if(!reduced){c.fillStyle='#d7a4ed44';for(let i=0;i<7;i++){const x=100+i*180+Math.sin(time*.4+i)*17,y=150+(i*49)%230+Math.sin(time+i)*10;c.fillRect(x,y,2,2);}}
  }};
}
