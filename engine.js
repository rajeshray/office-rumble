export const CONTROLS = [
  { left: 'KeyA', right: 'KeyD', jump: 'KeyW', block: 'KeyS', punch: 'KeyF', power: 'KeyG', dodge: 'KeyE' },
  { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', block: 'ArrowDown', punch: 'Enter', power: 'ShiftRight', dodge: 'Period' },
];
export const POWER_COOLDOWN = 5;
export const DODGE_COOLDOWN = 1.3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function createMatch() {
  return { phase: 'lobby', time: 60, countdown: 3, winner: null, resultAge: 0, wins: [0, 0], events: [], projectiles: [], players: makePlayers() };
}
function makePlayers() {
  return [320, 960].map((x, i) => ({ x, y: 0, vx: 0, vy: 0, hp: 100, facing: i ? -1 : 1, blocking: false, cooldown: 0, attack: null, hurt: 0, knockback: 0, powerCooldown: 0, powerFlash: 0, dizzy: 0, chaos: 50, bigHead: 0, tumble: 0, combo: 0, comboTimer: 0, guard: 100, guardBreak: 0, guardDelay: 0, parry: 0, parryCooldown: 0, dodge: 0, dodgeCooldown: 0, dodgeDirection: 0 }));
}
export function startMatch(s) {
  s.players = makePlayers(); s.time = 60; s.countdown = 3; s.winner = null; s.resultAge = 0; s.phase = 'countdown'; s.events = []; s.projectiles = [];
}
export function pauseMatch(s) {
  if (s.phase !== 'playing' && s.phase !== 'countdown') return;
  s.beforePause = s.phase; s.phase = 'paused';
}
export function resumeMatch(s) { if (s.phase === 'paused') s.phase = s.beforePause || 'playing'; }
function finish(s) {
  const [a, b] = s.players;
  s.winner = a.hp === b.hp ? null : a.hp > b.hp ? 0 : 1;
  s.phase = 'result';
  s.resultAge = 0;
  if (s.winner !== null) s.wins[s.winner]++;
  for (const player of s.players) Object.assign(player, { attack: null, hurt: 0, dizzy: 0, powerFlash: 0, powerCooldown: 0, vx: 0, vy: 0, y: 0, knockback: 0, blocking: false, tumble: 0, combo: 0, comboTimer: 0, guardBreak: 0, parry: 0, dodge: 0, dodgeCooldown: 0 });
  s.events.push({ type: 'finish', winner: s.winner });
}
export function step(s, dt, held = new Set(), pressed = new Set()) {
  s.events = [];
  if (s.phase === 'result') { s.resultAge += dt; return; }
  if (s.phase === 'countdown') {
    s.countdown = Math.max(0, s.countdown - dt);
    if (s.countdown === 0) { s.phase = 'playing'; s.events.push({ type: 'start' }); }
    return;
  }
  if (s.phase !== 'playing') return;
  s.time = Math.max(0, s.time - dt);
  const startingX = s.players.map(player => player.x);
  for (let i = 0; i < 2; i++) {
    const p = s.players[i], key = CONTROLS[i];
    p.cooldown = Math.max(0, p.cooldown - dt); p.hurt = Math.max(0, p.hurt - dt);
    p.powerCooldown = Math.max(0, p.powerCooldown - dt); p.powerFlash = Math.max(0, p.powerFlash - dt); p.dizzy = Math.max(0, p.dizzy - dt);
    p.bigHead = Math.max(0, p.bigHead - dt); p.tumble = Math.max(0, p.tumble - dt); p.comboTimer = Math.max(0, p.comboTimer - dt);
    for(const timer of ['guardBreak','guardDelay','parry','parryCooldown','dodge','dodgeCooldown']) p[timer]=Math.max(0,p[timer]-dt);
    if (p.comboTimer === 0) p.combo = 0;
    if (!p.attack) p.facing = startingX[1-i] >= startingX[i] ? 1 : -1;
    const axis = Number(held.has(key.right)) - Number(held.has(key.left));
    if(pressed.has(key.dodge)&&p.dodgeCooldown===0&&p.y===0&&p.hurt===0&&p.guardBreak===0){
      p.dodge=.26;p.dodgeCooldown=DODGE_COOLDOWN;p.dodgeDirection=axis||-p.facing;p.attack=null;p.parry=0;p.knockback=0;
      s.events.push({type:'dodge',player:i,x:p.x,y:453-p.y-230});
    }
    const canGuard = p.y === 0 && !p.attack && p.hurt === 0 && p.guardBreak===0 && p.dodge===0 && p.guard>=(p.blocking?1:15);
    p.blocking = held.has(key.block) && canGuard;
    if(canGuard&&pressed.has(key.block)&&p.parryCooldown===0){p.parry=.16;p.parryCooldown=.75;}
    if(!canGuard)p.parry=0;
    if(!p.blocking&&p.guardDelay===0&&p.guardBreak===0)p.guard=Math.min(100,p.guard+18*dt);
    if (pressed.has(key.jump) && p.y === 0 && !p.blocking && p.hurt === 0 && p.dodge===0) { p.parry=0;p.vy = 640; s.events.push({ type: 'jump', player: i }); }
    if (pressed.has(key.punch) && p.cooldown === 0 && p.hurt === 0 && !p.blocking && p.dodge===0) {
      p.parry=0;p.attack = { elapsed: 0, connected: false, facing: p.facing }; p.cooldown = .48;
      s.events.push({ type: 'swing', player: i });
    }
    if (pressed.has(key.power) && p.powerCooldown === 0 && p.hurt === 0 && !p.blocking && p.dodge===0) {
      const superPower = p.chaos >= 100;
      p.parry=0;
      if (superPower) p.chaos = 0;
      p.powerCooldown = POWER_COOLDOWN; p.powerFlash = superPower ? .9 : .55;
      const count = superPower || i === 0 ? 1 : 5;
      for (let n = 0; n < count; n++) s.projectiles.push({ owner: i, kind: i ? 'email' : 'coffee', superPower, x: p.x + p.facing * 60, y: p.y + 112 + (count>1 ? (n-2)*9 : 0), direction: p.facing, speed: superPower ? 820 : i ? 720 : 790, age: 0, delay: n * .07, life: 2.2, damage: superPower ? 55 : i ? 6 : 30 });
      s.events.push({ type: 'power', superPower, player: i, x: p.x, y: 453-p.y-224 });
    }
    p.vx = p.dodge>0?p.dodgeDirection*670:axis * (p.blocking ? 70 : 285) * (p.hurt ? .3 : p.attack ? .55 : 1) * (p.dizzy > 0 ? .55 : 1);
    p.x = clamp(p.x + (p.vx + p.knockback) * dt, 65, 1215);
    p.knockback *= Math.exp(-dt * 9);
    if (p.y > 0 || p.vy > 0) { p.y += p.vy * dt; p.vy -= 1650 * dt; if (p.y <= 0) { p.y = 0; p.vy = 0; } }
    if (p.attack) { p.attack.elapsed += dt; if (p.attack.elapsed >= .31) p.attack = null; }
  }
  const [a, b] = s.players;
  // Only separate bodies while their heights overlap; jumping can cross the opponent.
  if (Math.abs(a.y - b.y) < 95 && Math.abs(a.x-b.x) < 76) {
    const sign = a.x <= b.x ? 1 : -1, middle = clamp((a.x+b.x)/2, 103, 1177);
    a.x = middle - sign * 38; b.x = middle + sign * 38;
  }
  const hits = [];
  function parry(defenderId, projectile=false){
    const defender=s.players[defenderId];defender.guard=Math.min(100,defender.guard+8);defender.chaos=Math.min(100,defender.chaos+10);
    s.events.push({type:'parry',player:defenderId,reflected:projectile,x:defender.x,y:453-defender.y-230});
  }
  // Collect before applying damage so both fighters can land a punch in the same tick.
  for (let i = 0; i < 2; i++) {
    const p=s.players[i], target=s.players[1-i], attack=p.attack;
    if (!attack || attack.connected || attack.elapsed < .075 || attack.elapsed > .19) continue;
    const distance=(target.x-p.x)*attack.facing;
    if (distance < 0 || distance > 147 || Math.abs(p.y-target.y) > 76) continue;
    if(target.dodge>0)continue;
    attack.connected = true;
    const blocked = target.blocking && target.facing === -attack.facing;
    if(target.parry>0&&target.facing===-attack.facing){parry(1-i);p.hurt=.22;p.knockback=-attack.facing*200;continue;}
    if (!blocked) { p.combo = p.comboTimer > 0 ? p.combo % 3 + 1 : 1; p.comboTimer = .95; }
    hits.push({ attacker: i, target: 1-i, damage: blocked ? 3 : p.combo===3 ? 18 : 10, blocked, combo: blocked ? 0 : p.combo, direction: attack.facing });
  }
  for (const projectile of s.projectiles) {
    if (projectile.delay > 0) { projectile.delay -= dt; continue; }
    const target = s.players[1-projectile.owner];
    const previousX = projectile.x;
    projectile.x += projectile.direction * projectile.speed * dt;
    projectile.age += dt; projectile.life -= dt;
    const radius = projectile.superPower ? 65 : projectile.kind === 'coffee' ? 40 : 25;
    const crossed = Math.min(previousX,projectile.x)-radius <= target.x+25 && Math.max(previousX,projectile.x)+radius >= target.x-25;
    if (crossed && Math.abs(projectile.y - (target.y+110)) < 67 && target.dodge===0) {
      const blocked = target.blocking && target.facing === -projectile.direction;
      if(target.parry>0&&target.facing===-projectile.direction){
        parry(1-projectile.owner,true);projectile.owner=1-projectile.owner;projectile.direction*=-1;projectile.x=target.x+projectile.direction*(radius+40);projectile.speed=Math.min(1100,projectile.speed*1.1);projectile.life=2;projectile.age=0;projectile.reflected=true;continue;
      }
      hits.push({ attacker: projectile.owner, target: 1-projectile.owner, damage: blocked ? (projectile.superPower ? 12 : projectile.kind==='coffee'?5:1) : projectile.damage, blocked, direction: projectile.direction, power: projectile.kind, superPower: projectile.superPower });
      projectile.life = 0;
    }
  }
  s.projectiles = s.projectiles.filter(p=>p.life>0 && p.x>-80 && p.x<1360);
  for (const hit of hits) {
    const target=s.players[hit.target], attacker=s.players[hit.attacker];
    if(hit.blocked){
      target.guard=Math.max(0,target.guard-(hit.superPower?58:hit.power?(hit.power==='coffee'?32:6.4):18));target.guardDelay=.7;
      if(target.guard===0&&target.guardBreak===0){target.guardBreak=.65;target.blocking=false;target.parry=0;s.events.push({type:'guardBreak',player:hit.target,x:target.x,y:453-target.y-220});}
    }
    const damage=Math.min(target.hp,hit.damage);target.hp-=damage;
    // Reward actual damage only; a super cannot recharge itself with its own hit.
    if (!hit.superPower) attacker.chaos=clamp(attacker.chaos+damage*1.2,0,100);
    target.chaos=clamp(target.chaos+damage*.7,0,100);
    target.knockback=hit.direction*(hit.blocked?100:hit.superPower?680:hit.combo===3?420:hit.power?360:270);target.hurt=target.guardBreak>0?Math.max(target.hurt,target.guardBreak):hit.blocked?0:.16;
    const ballooned=target.bigHead===0 && !!hit.power && !hit.blocked;
    if (hit.power && !hit.blocked) { target.dizzy=hit.superPower?2.3:1.4; target.bigHead=hit.superPower?3:2; }
    if ((hit.superPower || hit.combo===3) && !hit.blocked) { target.vy=hit.superPower?630:370; target.tumble=hit.superPower ? .8 : .4; target.tumbleDuration=target.tumble; }
    s.events.push({ type: 'hit', ...hit, damage, ballooned, x: target.x, y: 453-target.y-175 });
  }
  if (a.hp === 0 || b.hp === 0 || s.time === 0) { finish(s); s.projectiles = []; }
}
