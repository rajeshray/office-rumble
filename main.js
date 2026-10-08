import { createRenderer } from './render.js';
import { CONTROLS, POWER_COOLDOWN, DODGE_COOLDOWN, createMatch, startMatch, pauseMatch, resumeMatch, step } from './engine.js';
import { createCamera } from './camera.js';
import { createAudio } from './audio.js';
const $=selector=>document.querySelector(selector);
const canvas=$('#game'),renderer=createRenderer(canvas),state=createMatch(),audio=createAudio();
const faces=[null,null],names=['The Overachiever','The Reply-All'];
const held=new Set(),pressed=new Set(),effects=[];
const gameKeys=new Set(CONTROLS.flatMap(Object.values));
const dialog=$('#camera-dialog');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let previousPhase='',lastTime=0,accumulator=0,fightBanner=0,hitNumber=0,visualTime=0;
const normalPowers=['ESPRESSO EXPRESS','REPLY-ALL APOCALYPSE'];
const superPowers=['DECAF DOOM','INBOX INFERNO'];
const heckles=['HR HAS LEFT THE CHAT.','TEAM BUILDING IS GOING GREAT.','THIS IS YOUR PERFORMANCE REVIEW.','PLEASE CIRCLE BACK TO REALITY.','THE PRINTER IS JUDGING YOU.','PER MY LAST UPPERCUT.'];
const camera=createCamera({dialog,video:$('#camera-video'),status:$('#camera-status'),capture:$('#capture'),retry:$('#retry-camera'),zoom:$('#zoom'),
  onCapture(id,photo){
    faces[id]=photo;
    const image=new Image();image.src=photo.toDataURL('image/png');image.alt=`${names[id]}'s captured face`;
    $(`#portrait-${id}`).replaceChildren(image);
    $(`[data-camera="${id}"]`).textContent='▣ Retake face';
    $('#announcement').textContent=`Face added for ${names[id]}.`;
  }
});
function clearInput(){held.clear();pressed.clear();}
function pause(){pauseMatch(state);clearInput();syncUI();}
function focusArena(){canvas.focus({preventScroll:true});}
function start(){clearInput();effects.length=0;fightBanner=0;$('#banter').textContent='HR HAS LEFT THE CHAT.';startMatch(state);syncUI();focusArena();}
$('#play').addEventListener('click',()=>{if(state.phase==='paused'){resumeMatch(state);clearInput();syncUI();focusArena();}else start();});
$('#pause').addEventListener('click',()=>{if(state.phase==='paused'){resumeMatch(state);clearInput();syncUI();focusArena();}else pause();});
$('#sound').addEventListener('click',async()=>{const enabled=await audio.toggle();$('#sound').textContent=enabled?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(enabled));if(state.phase==='playing')focusArena();});
for(let id=0;id<2;id++){
  $(`#dodge-${id}`).addEventListener('click',()=>{if(state.phase==='playing'){pressed.add(CONTROLS[id].dodge);focusArena();}});
  $(`#power-${id}`).addEventListener('click',()=>{if(state.phase==='playing'){pressed.add(CONTROLS[id].power);focusArena();}});
  $(`#name-${id}`).addEventListener('input',e=>{names[id]=e.target.value.trim()||(id?'The Reply-All':'The Overachiever');$(`#hud-name-${id}`).textContent=names[id].toUpperCase();});
  $(`#name-${id}`).addEventListener('focus',()=>{if(state.phase==='playing'||state.phase==='countdown')pause();});
  $(`[data-camera="${id}"]`).addEventListener('click',()=>{pause();$('#camera-player').textContent=id?'PLAYER TWO':'PLAYER ONE';$('#zoom-value').textContent='1×';camera.open(id);});
}
$('#close-camera').addEventListener('click',()=>camera.close());
$('#zoom').addEventListener('input',e=>{$('#camera-video').style.transform=`scale(${-e.target.value}, ${e.target.value})`;$('#zoom-value').textContent=`${Number(e.target.value).toFixed(1)}×`;});
window.addEventListener('keydown',e=>{
  if(dialog.open||e.target.matches('input, textarea, select, [contenteditable="true"]'))return;
  if(e.code==='Escape'&&!e.repeat){e.preventDefault();if(state.phase==='paused'){resumeMatch(state);clearInput();syncUI();focusArena();}else pause();return;}
  if(!gameKeys.has(e.code)||!['playing','countdown'].includes(state.phase))return;
  // Preserve modified browser shortcuts. A physical press triggers each punch once.
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  e.preventDefault();if(!held.has(e.code)&&!e.repeat)pressed.add(e.code);held.add(e.code);
});
window.addEventListener('keyup',e=>held.delete(e.code));
window.addEventListener('blur',pause);
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();camera.stop();if(dialog.open){$('#camera-status').hidden=false;$('#camera-status').textContent='Camera stopped while this tab was away. Try again when ready.';$('#retry-camera').hidden=false;}}});
window.addEventListener('pagehide',()=>camera.stop());
function syncUI(){
  for(let id=0;id<2;id++){$(`#health-${id}`).style.width=`${state.players[id].hp}%`;$(`#health-text-${id}`).textContent=`${state.players[id].hp} HP`;$(`#wins-${id}`).textContent=`${state.wins[id]} ${state.wins[id]===1?'WIN':'WINS'}`;}
  for(let id=0;id<2;id++){
    const player=state.players[id],cooldown=player.powerCooldown,charged=player.chaos>=100;
    $(`#power-${id}`).disabled=state.phase!=='playing'||cooldown>0;
    $(`#power-${id}`).style.setProperty('--charge',`${100*(1-cooldown/POWER_COOLDOWN)}%`);
    $(`#power-status-${id}`).textContent=cooldown>0?`${cooldown.toFixed(1)}s`:charged?'SUPER!':'READY';
    $(`#power-${id}`).classList.toggle('super-ready',charged);
    $(`#power-name-${id}`).textContent=charged?superPowers[id]:normalPowers[id];
    $(`#power-detail-${id}`).textContent=charged?'55 damage. Launch them into next week.':id?'Five emails. Absolutely no unsubscribe.':'Bigger coffee. Much bigger problems.';
    $(`#power-${id}`).title=charged?'Super charged: 55 damage. Use your power key!':'30 damage. 5-second cooldown. Fight to charge a super.';
    $(`#chaos-fill-${id}`).style.width=`${player.chaos}%`;
    $(`#chaos-label-${id}`).textContent=charged?`SUPER READY · ${id?'R SHIFT':'G'}`:`CHAOS ${Math.floor(player.chaos)}%`;
    $(`#chaos-${id}`).classList.toggle('charged',charged);
    $(`#guard-fill-${id}`).style.width=`${player.guard}%`;
    $(`#guard-label-${id}`).textContent=player.guardBreak>0?'GUARD BROKEN':player.parry>0?'PARRY WINDOW':`GUARD ${Math.floor(player.guard)}%`;
    $(`#guard-fill-${id}`).classList.toggle('low-guard',player.guard<25);
    $(`#dodge-${id}`).disabled=state.phase!=='playing'||player.dodgeCooldown>0||player.hurt>0||player.y>0||player.guardBreak>0;
    $(`#dodge-status-${id}`).textContent=player.dodgeCooldown>0?`${player.dodgeCooldown.toFixed(1)}s`:'READY';
    $(`#dodge-${id}`).style.setProperty('--dodge-charge',`${100*(1-player.dodgeCooldown/DODGE_COOLDOWN)}%`);
  }
  $('#timer').textContent=String(Math.ceil(state.time)).padStart(2,'0');
  $('#countdown').textContent=state.phase==='countdown'?Math.ceil(state.countdown):state.phase==='playing'&&fightBanner>0?'FIGHT!':'';
  if(previousPhase===state.phase)return;previousPhase=state.phase;
  $('#stage-message').hidden=state.phase==='playing'||state.phase==='countdown';
  $('#pause').disabled=state.phase==='lobby'||state.phase==='result';
  $('#pause').innerHTML=state.phase==='paused'?'Resume <kbd>Esc</kbd>':'Pause <kbd>Esc</kbd>';
  $('#match-label').textContent={lobby:'EXHIBITION MATCH',countdown:'GET READY',playing:'LUNCH BREAK BRAWL',paused:'ON A COFFEE BREAK',result:'MEETING ADJOURNED'}[state.phase];
  if(state.phase==='paused'){$('#message-tag').textContent='TAKE A BREATHER.';$('#message-title').textContent='COFFEE BREAK.';$('#message-copy').textContent='Your match is paused. Both fighters can catch their breath.';$('#play').textContent='BACK TO THE BRAWL';}
  if(state.phase==='result'){
    const draw=state.winner===null;$('#message-tag').textContent=draw?'A PERFECTLY POINTLESS MEETING.':`${names[state.winner].toUpperCase()} WINS!`;
    $('#message-title').textContent=draw?'IT’S A DRAW.':state.players.some(p=>p.hp===0)?'KNOCKOUT!':'TIME’S UP!';
    $('#message-copy').textContent=draw?'Equally ridiculous. Settle it in the rematch.':'One promotion. Zero professionalism. An absolutely unnecessary victory dance.';
    $('#play').textContent='RUN IT BACK';$('#announcement').textContent=draw?'The match is a draw.':`${names[state.winner]} wins the match.`;
  }
}
function processEvents(){
  for(const event of state.events){
    audio.event(event.type==='power'&&event.superPower?'super':event.type==='hit'&&!event.blocked&&(event.superPower||event.combo===3)?'launch':event.type,event.blocked);
    if(['parry','dodge','guardBreak'].includes(event.type)){
      const text=event.type==='parry'?(event.reflected?'RETURN TO SENDER!':'NICE TRY!'):event.type==='dodge'?'NOT TODAY!':'SHIELD ON LUNCH BREAK!';
      effects.push({...event,x:Math.max(200,Math.min(1080,event.x)),text,color:event.type==='guardBreak'?'#ffb66e':'#7cf4ff',life:.65,rotation:-.08});
      if(event.type==='parry'){$('#banter').textContent=event.reflected?'YOUR EMAIL HAS BEEN RETURNED UNREAD.':'REJECTED. PLEASE RESUBMIT.';effects.push({...event,type:'burst',life:.6,maxLife:.6});}
    }
    if(event.type==='start'){fightBanner=.7;$('#announcement').textContent='Fight! Land hits to charge a super.';}
    if(event.type==='power'){
      $('#banter').textContent=event.superPower?'THIS ESCALATED BEYOND THE AGENDA.':heckles[hitNumber%heckles.length];
      effects.push({...event,x:event.superPower?(event.player?940:340):Math.max(205,Math.min(1075,event.x)),y:event.superPower?168:event.y,text:event.superPower?superPowers[event.player]+'!':event.player?'REPLY ALL FIVE!':'EXTRA SHOT!',color:event.player?'#ff92b9':'#dfff69',life:event.superPower?1.15:.8,rotation:-.05});
      if(event.superPower)$('#announcement').textContent=`${names[event.player]} uses ${superPowers[event.player]}!`;
    }
    if(event.type==='hit'){
      hitNumber++;
      const text=event.blocked?'DENIED!':event.superPower?'NEXT WEEK DELIVERY!':event.combo===3?'3-HIT: PROMOTED!':event.ballooned?'BIG HEAD ENERGY!':event.power==='email'?['CC’D!','RE: RE: RE:','UNSUBSCRIBE!'][hitNumber%3]:event.power?'DECAF? NEVER.':['BONK!','BUDGET CUT!','OOF!','BOOP!'][hitNumber%4];
      effects.push({...event,x:Math.max(185,Math.min(1095,event.x)),y:event.y-(event.ballooned?38:0),text,color:event.blocked?'#c4b2eb':event.attacker?'#ff92b9':'#dfff69',life:event.superPower?.85:.65,rotation:(hitNumber%2?1:-1)*.10});
      if(!event.blocked){effects.push({...event,type:'burst',life:.6,maxLife:.6});if(event.combo===3||event.superPower)$('#banter').textContent=heckles[hitNumber%heckles.length];}
    }
    if(event.type==='finish')$('#banter').textContent='PLEASE RATE THIS TEAM-BUILDING EXERCISE.';
  }
}
function frame(milliseconds){
  const time=milliseconds/1000,dt=lastTime?Math.min(time-lastTime,.05):0;lastTime=time;accumulator+=dt;
  while(accumulator>=1/120){step(state,1/120,held,pressed);pressed.clear();processEvents();accumulator-=1/120;}
  if(state.phase!=='paused'){visualTime+=dt;for(let i=effects.length-1;i>=0;i--){effects[i].life-=dt;if(effects[i].life<=0)effects.splice(i,1);}fightBanner=Math.max(0,fightBanner-dt);}
  syncUI();renderer.draw(state,visualTime,faces,effects,reduced);audio.tick(time,state.phase==='playing');requestAnimationFrame(frame);
}
syncUI();requestAnimationFrame(frame);

import { registerMatchTools } from './webmcp.js';
const unregisterTools=registerMatchTools(document.modelContext,{
  getStatus:()=>({phase:state.phase,secondsRemaining:Math.ceil(state.time),winner:state.winner===null?null:names[state.winner],players:state.players.map((p,i)=>({name:names[i],health:p.hp,wins:state.wins[i],powerCooldown:Math.ceil(p.powerCooldown),chaos:Math.floor(p.chaos),superReady:p.chaos>=100,guard:Math.floor(p.guard),dodgeCooldown:Number(p.dodgeCooldown.toFixed(1))}))}),
  control(action){
    if(dialog.open)throw new Error('Close the camera dialog first.');
    if(action==='start'){if(!['lobby','result'].includes(state.phase))throw new Error('A round is already active.');start();}
    if(action==='pause'){if(!['playing','countdown'].includes(state.phase))throw new Error('No active round to pause.');pause();}
    if(action==='resume'){if(state.phase!=='paused')throw new Error('The round is not paused.');resumeMatch(state);clearInput();syncUI();focusArena();}
  }
});
window.addEventListener('pagehide',unregisterTools,{once:true});
