export function createAudio() {
  let context=null, enabled=false, nextBeat=0, beat=0;
  function tone(freq, duration=.08, type='square', volume=.025, slide=0) {
    if(!enabled||!context||context.state!=='running')return;
    const osc=context.createOscillator(),gain=context.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,context.currentTime);
    if(slide)osc.frequency.exponentialRampToValueAtTime(slide,context.currentTime+duration);
    gain.gain.setValueAtTime(volume,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+duration);
    osc.connect(gain);gain.connect(context.destination);osc.start();osc.stop(context.currentTime+duration);
  }
  return {
    async toggle() {
      enabled=!enabled;
      if(enabled){try{context ||= new (window.AudioContext||window.webkitAudioContext)();await context.resume();nextBeat=0;}catch{enabled=false;}}
      return enabled;
    },
    tick(time, active) { if(!enabled||!active||time<nextBeat)return;nextBeat=time+.25;beat++;tone(beat%2?73.42:98,.12,'triangle',.045);if(beat%2===0)tone(800,.035,'triangle',.013,200); },
    event(type,blocked=false) {
      if(type==='parry'){tone(1100,.15,'sine',.04,1800);setTimeout(()=>tone(1400,.2,'triangle',.03),60);}
      if(type==='dodge')tone(350,.13,'triangle',.03,80);
      if(type==='guardBreak')tone(300,.25,'sawtooth',.035,45);
      if(type==='super'){tone(60,.5,'sawtooth',.045,550);setTimeout(()=>tone(880,.3,'square',.025,110),120);setTimeout(()=>tone(1320,.2,'triangle',.03,330),260);}
      if(type==='launch'){tone(90,.3,'sine',.06,950);setTimeout(()=>tone(520,.35,'triangle',.035,65),130);}
      if(type==='power'){tone(110,.3,'sawtooth',.045,650);setTimeout(()=>tone(880,.2,'triangle',.03,220),150);}
      if(type==='hit')tone(blocked?170:115,.12,'sawtooth',.04,45);
      if(type==='swing')tone(240,.06,'triangle',.02,100);
      if(type==='jump')tone(180,.14,'sine',.03,380);
      if(type==='start')tone(440,.22,'square',.025,880);
      if(type==='finish'){tone(523,.35,'triangle',.035);setTimeout(()=>tone(659,.35,'triangle',.03),140);setTimeout(()=>tone(784,.4,'triangle',.03),280);}
    },
  };
}
