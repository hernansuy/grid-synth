(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const NAMES=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const LAYERS=['arp','bass','strings','staccato','brass'];
const LABELS={arp:'ARP',bass:'BASS',strings:'STRINGS',staccato:'STACCATO',brass:'BRASS'};
const CHORDS=[['G3','Bb3','D4','G4','Bb4','D5'],['F3','A3','D4','F4','A4','D5'],['Eb3','G3','C4','Eb4','G4','C5'],['F3','A3','D4','F4','A4','D5']];
const VERIDIS_VOICINGS={
 Dm7:['D3','F3','A3','C4','D4','F4'],G:['G2','B2','D3','G3','B3','D4'],Am:['A2','C3','E3','A3','C4','E4'],F:['F2','A2','C3','F3','A3','C4'],
 Fmaj7:['F2','A2','C3','E3','A3','C4'],Dm:['D3','F3','A3','D4','F4','A4'],Am7:['A2','C3','E3','G3','C4','E4'],D7:['D3','Gb3','A3','C4','Gb4','A4']
};
// Primeros 32 compases de la introducción publicada por Lamucal (un acorde por compás).
const VERIDIS_SEQUENCE=['Dm7','G','Am','F','Fmaj7','Am','Dm','G','Am','F','Am','Dm','G','Am','F','Am','Dm','G','Am','Fmaj7','Dm','G','Am','F','Fmaj7','Dm','G','Am','Fmaj7','Am','Dm','G'];
const VERIDIS_CHORDS=VERIDIS_SEQUENCE.map(name=>VERIDIS_VOICINGS[name]);
const VERIDIS_BASS=VERIDIS_SEQUENCE.map(name=>({Dm7:'D2',Dm:'D2',G:'G2',Am:'A2',Am7:'A2',F:'F2',Fmaj7:'F2',D7:'D2'})[name]);
const BASS_DEFAULT=['G2','F2','Eb2','F2'];
const ROOTS=['G','F','Eb','F'];
const triad16=ch=>[...ch,...ch,...ch.slice(0,4)];
const short16=ch=>Array(4).fill([ch[0],ch[1],ch[2],ch[1]]).flat();
const up16=ch=>Array.from({length:16},(_,i)=>ch[i%ch.length]);
const upDown16=ch=>{const p=[...ch,...ch.slice(1,-1).reverse()];return Array.from({length:16},(_,i)=>p[i%p.length])};
const defaultPatterns=CHORDS.map(triad16);
const clone=o=>JSON.parse(JSON.stringify(o));
const baseState={
  bpm:106,division:'16',gate:55,swing:0,arpMode:'triad',progression:clone(CHORDS),progressionRoots:['G','F','Eb','F'],customPatterns:clone(defaultPatterns),bassPattern:[...BASS_DEFAULT],bassChange:'1 BAR',
  staccato:[true,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false],
  layers:{arp:{level:80,mute:false,solo:false,enabled:true},bass:{level:45,mute:false,solo:false,enabled:true},strings:{level:22,mute:false,solo:false,enabled:true},staccato:{level:12,mute:false,solo:false,enabled:true},brass:{level:10,mute:false,solo:false,enabled:true}},
  autoArrangement:true,master:75,transpose:0,deform:0,fine:0,deformMode:'CLEAN',deformTargets:{arp:true,bass:false,strings:true,staccato:false,brass:false},deformLfo:false,lfoRate:0.18,lfoDepth:8,
  sound:{saw:60,triangle:30,upper:18,sub:14,cutoff:3100,resonance:2.1,width:80},
  fx:{chorus:18,flanger:8,phaser:7,delay:11,reverb:31},fxEnabled:{chorus:true,flanger:true,phaser:true,delay:true,reverb:true},
  currentPatch:'builtin-grid',manualOctave:3,playWith:'arp'
};
const builtins=[
 {id:'builtin-grid',name:'GRID TRIAD',tag:'GRID',overrides:{}},
 {id:'builtin-soft',name:'SOFT GRID',tag:'SOFT',overrides:{sound:{saw:42,triangle:46,upper:12,sub:16,cutoff:2500,resonance:1.8,width:76},fx:{chorus:20,flanger:4,phaser:6,delay:9,reverb:39},layers:{strings:{level:30}}}},
 {id:'builtin-glass',name:'GLASS GRID',tag:'WIDE',overrides:{sound:{saw:50,triangle:24,upper:30,sub:7,cutoff:4300,resonance:2.3,width:92},fx:{chorus:21,flanger:6,phaser:8,delay:19,reverb:28}}},
 {id:'builtin-cinematic',name:'CINEMATIC',tag:'FILM',overrides:{layers:{arp:{level:68},strings:{level:38},brass:{level:17}},sound:{cutoff:2850,width:86},fx:{reverb:43,delay:13}}},
 {id:'builtin-veridis',name:'VERIDIS QUO — LAMUCAL INTRO',tag:'107 BPM',overrides:{bpm:107,division:'16',gate:88,arpMode:'veridis',rhythmStyle:'lamucal-chords',voiceModel:'organ',progression:clone(VERIDIS_CHORDS),progressionRoots:clone(VERIDIS_SEQUENCE),customPatterns:VERIDIS_CHORDS.map(triad16),bassPattern:clone(VERIDIS_BASS),bassChange:'1 BAR',loopBars:32,sourceLabel:'LAMUCAL / KEY C / 107 BPM / 32-BAR INTRO',sectionBlocks:[['01–08','INTRO A'],['09–16','INTRO B'],['17–24','INTRO C'],['25–32','INTRO D']],autoArrangement:false,layers:{arp:{level:34},bass:{level:25},strings:{level:68},staccato:{level:0,enabled:false},brass:{level:0,enabled:false}},sound:{saw:4,triangle:64,upper:10,sub:12,cutoff:2200,resonance:1.1,width:62},fx:{chorus:11,flanger:0,phaser:2,delay:3,reverb:24}}}
];
function deepMerge(target,source){for(const k in source){if(source[k]&&typeof source[k]==='object'&&!Array.isArray(source[k]))target[k]=deepMerge(target[k]||{},source[k]);else target[k]=clone(source[k])}return target}
function loadSaved(){try{return JSON.parse(localStorage.getItem('grid01-v2'))||{}}catch{return {}}}
let saved=loadSaved(), userPatches=saved.userPatches||[], state=deepMerge(clone(baseState),saved.state||{}), selectedPatch=state.currentPatch||'builtin-grid';
let playing=false,currentStep=0,totalBar=0,nextNoteTime=0,schedulerTimer=null,barClipboard=null,displayTimer=null,editor={type:null,index:0,note:'G'};
let currentView='synth';
const ORGAN_PRESETS=[
 {id:'warm',name:'WARM DRAWBARS',detail:'8′ + 4′ / SOFT',bars:[8,7,4,2],cutoff:2600,tones:[['sine',1,.54,0],['triangle',2,.27,-3],['sine',.5,.18,2]]},
 {id:'discovery',name:'DISCOVERY ORGAN',detail:'ROUND / SCORE VOICE',bars:[8,8,5,3],cutoff:2200,tones:[['triangle',1,.48,-4],['sine',1,.32,3],['sine',2,.21,0],['sine',.5,.12,0]]},
 {id:'cathedral',name:'CATHEDRAL',detail:'16′ + 8′ / WIDE',bars:[8,6,7,5],cutoff:3100,tones:[['sine',.5,.32,-4],['triangle',1,.43,4],['sine',2,.24,0],['sine',3,.09,0]]},
 {id:'reed',name:'REED & AIR',detail:'BRIGHT / NARROW',bars:[3,8,6,1],cutoff:4400,tones:[['sawtooth',1,.23,-5],['triangle',1,.48,5],['square',2,.08,0]]},
 {id:'electric',name:'ELECTRIC 73',detail:'BELL / TREMOLO',bars:[5,8,3,6],cutoff:5200,tones:[['sine',1,.5,-3],['sine',2,.29,3],['triangle',3,.12,0]]},
 {id:'glass',name:'GLASS FLUTES',detail:'4′ + 2′ / CLEAR',bars:[2,5,8,7],cutoff:6800,tones:[['sine',1,.38,0],['sine',2,.34,0],['sine',4,.18,0]]}
];
function loadOrganData(){try{return Object.assign({preset:'warm',volume:72,reverb:28,take:[],takeBpm:null,loop:false,clip:null},JSON.parse(localStorage.getItem('grid01-organ-v1'))||{})}catch{return {preset:'warm',volume:72,reverb:28,take:[],takeBpm:null,loop:false,clip:null}}}
let organData=loadOrganData(),organRecording=false,organPlaying=false,organRecordStarted=0,organTimer=null,organClockTimer=null,organHeld=new Map(),organVoices=new Set();
if(organData.clip)state.organClip=clone(organData.clip);
function persistOrgan(){localStorage.setItem('grid01-organ-v1',JSON.stringify(organData))}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),1100)}
function persist(){localStorage.setItem('grid01-v2',JSON.stringify({state,userPatches}))}
function patchState(p){let next=clone(baseState);deepMerge(next,p.overrides||p.state||{});next.currentPatch=p.id;return next}
function allPatches(){return [...builtins,...userPatches]}
function harmonicChords(){return state.progression?.length?state.progression:CHORDS}
function harmonicIndex(bar=totalBar){return bar%harmonicChords().length}
function currentPattern(bar=harmonicIndex()){const ch=harmonicChords()[bar];if(state.arpMode==='veridis'){const upper=[ch[3]||ch[0],ch[2],ch[1],ch[2],ch[3]||ch[0],ch[2],ch[1],ch[2]];return Array.from({length:16},(_,i)=>i%2?'-':upper[i/2])}if(state.arpMode==='short')return short16(ch);if(state.arpMode==='up')return up16(ch);if(state.arpMode==='updown')return upDown16(ch);if(state.arpMode==='custom')return state.customPatterns[bar]||triad16(ch);return triad16(ch)}
function activeByArrangement(layer,bar=totalBar){if(!state.layers[layer].enabled)return false;if(!state.autoArrangement)return true;const threshold={arp:0,bass:4,strings:8,staccato:12,brass:16}[layer];return bar>=threshold}
function audible(layer,bar=totalBar){const anySolo=LAYERS.some(l=>state.layers[l].solo);return activeByArrangement(layer,bar)&&!state.layers[layer].mute&&(!anySolo||state.layers[layer].solo)}
function activeLayerNames(){const names=LAYERS.filter(l=>activeByArrangement(l)).map(l=>LABELS[l]);if(state.organClip?.enabled)names.push('ORGAN');return names}
function getPatch(){return allPatches().find(p=>p.id===selectedPatch)||builtins[0]}
if(selectedPatch.startsWith('builtin-'))state=patchState(getPatch());

class AudioEngine{
 constructor(){this.ctx=null;this.voices=[];this.buses={};this.sends={};this.effects={}}
 init(){
  if(this.ctx)return;
  const C=window.AudioContext||window.webkitAudioContext;this.ctx=new C();
  const c=this.ctx;this.master=c.createGain();this.master.gain.value=.55;
  this.comp=c.createDynamicsCompressor();this.comp.threshold.value=-18;this.comp.knee.value=20;this.comp.ratio.value=4;this.comp.attack.value=.005;this.comp.release.value=.25;
  this.limiter=c.createDynamicsCompressor();this.limiter.threshold.value=-3;this.limiter.knee.value=0;this.limiter.ratio.value=20;this.limiter.attack.value=.001;this.limiter.release.value=.08;
  this.analyser=c.createAnalyser();this.analyser.fftSize=256;this.master.connect(this.comp).connect(this.limiter).connect(this.analyser).connect(c.destination);
  this.buildEffects();
  LAYERS.forEach(layer=>{const bus=c.createGain();bus.gain.value=0;bus.connect(this.master);this.buses[layer]=bus;this.sends[layer]={};Object.keys(this.effects).forEach(fx=>{const s=c.createGain();s.gain.value=0;s.connect(this.effects[fx].input);bus.connect(s);this.sends[layer][fx]=s})});
  this.updateAll();
 }
 buildEffects(){
  const c=this.ctx, finish=(input,output)=>({input,output});
  let chorusIn=c.createGain(),chorus=c.createDelay(.1),clfo=c.createOscillator(),clfoG=c.createGain(),chorusOut=c.createGain();chorus.delayTime.value=.02;clfo.frequency.value=.3;clfoG.gain.value=.005;clfo.connect(clfoG).connect(chorus.delayTime);chorusIn.connect(chorus).connect(chorusOut).connect(this.master);clfo.start();this.effects.chorus=finish(chorusIn,chorusOut);
  let flIn=c.createGain(),fl=c.createDelay(.02),flfo=c.createOscillator(),flfoG=c.createGain(),flFb=c.createGain(),flOut=c.createGain();fl.delayTime.value=.004;flfo.frequency.value=.15;flfoG.gain.value=.002;flFb.gain.value=.12;flfo.connect(flfoG).connect(fl.delayTime);flIn.connect(fl);fl.connect(flFb).connect(fl);fl.connect(flOut).connect(this.master);flfo.start();this.effects.flanger=finish(flIn,flOut);
  let phIn=c.createGain(),prev=phIn,phOut=c.createGain();for(let i=0;i<4;i++){let ap=c.createBiquadFilter();ap.type='allpass';ap.frequency.value=500+i*260;ap.Q.value=.8;prev.connect(ap);prev=ap}prev.connect(phOut).connect(this.master);this.effects.phaser=finish(phIn,phOut);
  let dIn=c.createGain(),dl=c.createDelay(1),dr=c.createDelay(1),pl=c.createStereoPanner(),pr=c.createStereoPanner(),fb=c.createGain(),dOut=c.createGain();dl.delayTime.value=.23;dr.delayTime.value=.31;pl.pan.value=-.75;pr.pan.value=.75;fb.gain.value=.2;dIn.connect(dl).connect(pl).connect(dOut);dIn.connect(dr).connect(pr).connect(dOut);dOut.connect(fb).connect(dl);dOut.connect(this.master);this.effects.delay=finish(dIn,dOut);
  let rIn=c.createGain(),conv=c.createConvolver(),rOut=c.createGain(),ir=c.createBuffer(2,c.sampleRate*3,c.sampleRate);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2.7)}conv.buffer=ir;rIn.connect(conv).connect(rOut).connect(this.master);this.effects.reverb=finish(rIn,rOut);
 }
 async resume(){this.init();await this.ctx.resume()}
 smooth(param,value,time=.035){const t=this.ctx.currentTime;param.cancelScheduledValues(t);param.setTargetAtTime(value,t,time)}
 updateAll(){if(!this.ctx)return;this.smooth(this.master.gain,state.master/100*.72);const anySolo=LAYERS.some(l=>state.layers[l].solo);LAYERS.forEach(l=>{const on=state.layers[l].enabled&&!state.layers[l].mute&&(!anySolo||state.layers[l].solo);this.smooth(this.buses[l].gain,on?state.layers[l].level/100:0);this.updateSends(l)});this.updatePitch()}
 updateSends(layer){
  if(!this.ctx)return;const scale={
   arp:{chorus:1,flanger:1,phaser:1,delay:1,reverb:1},
   bass:{chorus:0,flanger:0,phaser:0,delay:0,reverb:.04},
   strings:{chorus:.75,flanger:0,phaser:.12,delay:.08,reverb:.8},
   staccato:{chorus:0,flanger:0,phaser:0,delay:.28,reverb:.22},
   brass:{chorus:.12,flanger:0,phaser:0,delay:.04,reverb:.9}
  }[layer];Object.keys(this.sends[layer]).forEach(f=>this.smooth(this.sends[layer][f].gain,state.fxEnabled[f]?state.fx[f]/100*scale[f]:0))
 }
 pitchFor(layer){let semis=state.transpose+(state.deformTargets[layer]?state.deform:0),cents=state.fine;if(state.deformLfo)cents+=Math.sin(this.ctx.currentTime*Math.PI*2*state.lfoRate)*state.lfoDepth;return {semis,cents}}
 freq(note,layer){const m=note.match(/^([A-G](?:b)?)(\d)$/);if(!m)return 440;const n={C:0,Db:1,D:2,Eb:3,E:4,F:5,Gb:6,G:7,Ab:8,A:9,Bb:10,B:11}[m[1]]+(+m[2]+1)*12,p=this.pitchFor(layer);return 440*Math.pow(2,(n-69+p.semis)/12)*Math.pow(2,p.cents/1200)}
 cutoff(layer){let v=layer==='bass'?800:layer==='strings'?2500:layer==='staccato'?3200:layer==='brass'?2100:state.sound.cutoff;if(state.deformMode==='TAPE'&&state.deformTargets[layer])v*=Math.pow(2,state.deform/36);return Math.max(350,Math.min(9000,v))}
 width(layer){let w=state.sound.width/100;if(state.deformMode==='WIDE'&&state.deformTargets[layer])w=Math.min(1.15,w+Math.abs(state.deform)/12*.15);return w}
 voice(note,time,duration,layer='arp'){
  if(!this.ctx)return;const c=this.ctx,g=c.createGain(),filter=c.createBiquadFilter(),baseEnd=time+duration;filter.type='lowpass';filter.frequency.setValueAtTime(this.cutoff(layer),time);filter.Q.value=layer==='arp'?state.sound.resonance:.8;g.connect(filter).connect(this.buses[layer]);
  let env,oscDefs;if(layer==='arp'&&state.voiceModel==='organ'){env={a:.018,s:.62,r:.52,peak:.07};oscDefs=[['triangle',.54,-3,-.18,1],['sine',.42,2,.16,1],['sine',.2,0,.32,2],['sine',.13,0,-.1,.5]]}
  else if(layer==='arp'){env={a:.01,s:.12,r:1.4,peak:.12};oscDefs=[['sawtooth',state.sound.saw/100,-4,-.35,1],['triangle',state.sound.triangle/100,2,.2,1],['sawtooth',state.sound.upper/100,4,.45,2],['sine',state.sound.sub/100,0,-.08,.5]]}
  else if(layer==='bass'){env={a:.02,s:.48,r:1.7,peak:.18};oscDefs=[['sine',.7,0,0,1],['sawtooth',.25,-5,0,1]]}
  else if(layer==='strings'&&state.rhythmStyle==='lamucal-chords'){env={a:.025,s:.58,r:.65,peak:.055};oscDefs=[['triangle',.5,-4,-.22,1],['sine',.42,3,.2,1],['sine',.18,0,.32,2]]}
  else if(layer==='strings'){env={a:.36,s:.78,r:2.8,peak:.085};oscDefs=[['sawtooth',.28,-8,-.3,1],['sawtooth',.28,8,.3,1],['triangle',.34,0,0,1]]}
  else if(layer==='staccato'){env={a:.005,s:.02,r:.18,peak:.11};oscDefs=[['triangle',.7,0,-.1,1],['sawtooth',.22,3,.1,1]]}
  else{env={a:.32,s:.68,r:3,peak:.075};oscDefs=[['sawtooth',.42,-5,-.18,1],['triangle',.5,3,.18,1]]}
  g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(env.peak,time+env.a);g.gain.setValueAtTime(env.peak*env.s,Math.max(time+env.a,baseEnd));g.gain.linearRampToValueAtTime(0,baseEnd+env.r);
  const record={layer,note,oscs:[],ends:baseEnd+env.r};oscDefs.forEach(([wave,level,det,pan,mul])=>{const o=c.createOscillator(),og=c.createGain(),p=c.createStereoPanner();o.type=wave;o.frequency.setValueAtTime(this.freq(note,layer)*mul*Math.pow(2,det/1200),time);o._mul=mul*Math.pow(2,det/1200);og.gain.value=level;p.pan.value=pan*this.width(layer);o.connect(og).connect(p).connect(g);o.start(time);o.stop(record.ends+.05);record.oscs.push(o)});this.voices.push(record);setTimeout(()=>this.voices=this.voices.filter(v=>v!==record),Math.max(0,(record.ends-c.currentTime+1)*1000))
 }
 chord(notes,time,duration,layer){notes.forEach(n=>this.voice(n,time,duration,layer))}
 updatePitch(){if(!this.ctx)return;const now=this.ctx.currentTime;this.voices.forEach(v=>v.oscs.forEach(o=>o.frequency.setTargetAtTime(this.freq(v.note,v.layer)*o._mul,now,.035)))}
 stopAll(){if(!this.ctx)return;const now=this.ctx.currentTime;this.voices.forEach(v=>v.oscs.forEach(o=>{try{o.stop(now+.03)}catch{}}));this.voices=[];LAYERS.forEach(l=>this.buses[l].gain.cancelScheduledValues(now))}
}
const engine=new AudioEngine();

function organPreset(){return ORGAN_PRESETS.find(p=>p.id===organData.preset)||ORGAN_PRESETS[0]}
function releaseOrganVoice(v,when=engine.ctx?.currentTime||0){if(!v||v.released)return;v.released=true;try{v.gain.gain.cancelScheduledValues(when);v.gain.gain.setTargetAtTime(0,when,.09);v.oscs.forEach(o=>o.stop(when+.65))}catch{}setTimeout(()=>organVoices.delete(v),800)}
function stopOrganVoices(){[...organVoices].forEach(v=>releaseOrganVoice(v));organHeld.clear();$$('.organ-key.down').forEach(k=>k.classList.remove('down'))}
function organTone(note,time,duration=null,presetId=organData.preset){
 if(!engine.ctx)return null;const c=engine.ctx,p=ORGAN_PRESETS.find(x=>x.id===presetId)||ORGAN_PRESETS[0],gain=c.createGain(),filter=c.createBiquadFilter(),dry=c.createGain(),wet=c.createGain(),oscs=[];filter.type='lowpass';filter.frequency.setValueAtTime(p.cutoff,time);filter.Q.value=.75;gain.connect(filter);filter.connect(dry).connect(engine.master);filter.connect(wet).connect(engine.effects.reverb.input);dry.gain.value=organData.volume/100*.68;wet.gain.value=organData.reverb/100*.34;gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.16,time+.018);gain.gain.setTargetAtTime(.105,time+.025,.08);
 p.tones.forEach(([wave,mul,level,det])=>{const o=c.createOscillator(),g=c.createGain(),pan=c.createStereoPanner();o.type=wave;o.frequency.setValueAtTime(engine.freq(note,'arp')*mul*Math.pow(2,det/1200),time);g.gain.value=level;pan.pan.value=(mul===.5?-.12:mul>1?.14:0);o.connect(g).connect(pan).connect(gain);o.start(time);oscs.push(o)});
 const voice={note,gain,oscs,released:false};organVoices.add(voice);if(duration!==null)releaseOrganVoice(voice,time+Math.max(.06,duration));return voice
}
function midiNote(midi){const names=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];return names[midi%12]+(Math.floor(midi/12)-1)}
const ORGAN_KEYS={z:'C3',s:'Db3',x:'D3',d:'Eb3',c:'E3',v:'F3',g:'Gb3',b:'G3',h:'Ab3',n:'A3',j:'Bb3',m:'B3',q:'C4','2':'Db4',w:'D4','3':'Eb4',e:'E4',r:'F4','5':'Gb4',t:'G4','6':'Ab4',y:'A4','7':'Bb4',u:'B4',i:'C5'};
const ORGAN_KEY_LABELS=Object.fromEntries(Object.entries(ORGAN_KEYS).map(([k,n])=>[n,k.toUpperCase()]));
function renderOrganKeyboard(){const el=$('#organKeyboard');el.innerHTML='';let whites=0;for(let midi=48;midi<=72;midi++){const note=midiNote(midi),black=note.includes('b'),b=document.createElement('button');b.className='organ-key '+(black?'black':'white');b.dataset.note=note;b.setAttribute('aria-label',note);b.innerHTML='<span>'+note+'<small>'+(ORGAN_KEY_LABELS[note]||'')+'</small></span>';if(black)b.style.left=(whites/15*100)+'%';else whites++;b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);organNoteOn(note,b)};b.onpointerup=()=>organNoteOff(note);b.onlostpointercapture=()=>organNoteOff(note);el.append(b)}}
function renderOrganPresets(){const el=$('#organPresets');el.innerHTML='';ORGAN_PRESETS.forEach((p,i)=>{const b=document.createElement('button');b.className='organ-preset '+(p.id===organData.preset?'active':'');b.innerHTML='<i></i><span>'+p.name+'<small>'+p.detail+'</small></span>';b.onclick=()=>{organData.preset=p.id;persistOrgan();renderOrgan();toast('REGISTER '+p.name)};el.append(b)});const p=organPreset();$('#organVoiceName').textContent=p.name;$('#organPresetNumber').textContent=String(ORGAN_PRESETS.indexOf(p)+1).padStart(2,'0');$('#organDrawbars').innerHTML=p.bars.map((h,i)=>'<i style="--h:'+(10+h*5)+'px;--bar:'+["#f17f3d","#f2eee4","#36b979","#3978f6"][i%4]+'"></i>').join('')}
function takeLength(){return organData.take.reduce((m,e)=>Math.max(m,e.start+e.duration),0)}
function renderOrganRoll(){const roll=$('#organRoll');roll.innerHTML='';if(!organData.take.length){roll.innerHTML='<div class="empty-take">PRESS RECORD, THEN PLAY</div>';$('#organTakeCount').textContent='EMPTY'}else{const len=Math.max(8,takeLength());organData.take.forEach(e=>{const d=document.createElement('i'),oct=+(e.note.match(/\d/)||[3])[0],pitch=NAMES.indexOf(e.note.replace(/\d/,''));d.className='take-note';d.title=e.note+' / '+e.duration.toFixed(2)+'s';d.style.left=(e.start/len*100)+'%';d.style.width=(e.duration/len*100)+'%';d.style.top=(112-((oct-3)*12+pitch)*3.4)+'px';roll.append(d)});$('#organTakeCount').textContent=organData.take.length+' NOTES'}$('#organClipStatus').textContent=organData.clip?'MOUNTED / '+organData.clip.events.length+' NOTES':'NOT MOUNTED';$('#organClipStatus').classList.toggle('organ-clip-mounted',!!organData.clip)}
function renderOrgan(){renderOrganPresets();renderOrganKeyboard();renderOrganRoll();$('#organVolume').value=organData.volume;$('#organVolumeOutput').textContent=organData.volume+'%';$('#organReverb').value=organData.reverb;$('#organReverbOutput').textContent=organData.reverb+'%';$('#organLoop').checked=organData.loop}
function setOrganStatus(text,mode='ready'){$('#organStatus').textContent=text;$('#organStatus').parentElement.classList.toggle('recording',mode==='recording')}
function updateOrganClock(){const elapsed=organRecording?(performance.now()-organRecordStarted)/1000:0;$('#organClock').textContent=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+(elapsed%60).toFixed(1).padStart(4,'0')}
async function organNoteOn(note,keyEl){if(organHeld.has(note))return;await engine.resume();const voice=organTone(note,engine.ctx.currentTime);const held={voice,pending:null};if(organRecording)held.pending={note,start:(performance.now()-organRecordStarted)/1000};organHeld.set(note,held);keyEl?.classList.add('down');$('#organLastNote').textContent=note}
function organNoteOff(note){const held=organHeld.get(note);if(!held)return;releaseOrganVoice(held.voice);organHeld.delete(note);$$('.organ-key[data-note="'+note+'"]').forEach(k=>k.classList.remove('down'));if(organRecording&&held.pending){held.pending.duration=Math.max(.06,(performance.now()-organRecordStarted)/1000-held.pending.start);organData.take.push(held.pending);organData.take.sort((a,b)=>a.start-b.start);renderOrganRoll()}}
function stopOrganRecording(){if(!organRecording)return;organRecording=false;for(const held of organHeld.values())if(held.pending){held.pending.duration=Math.max(.06,(performance.now()-organRecordStarted)/1000-held.pending.start);organData.take.push(held.pending);held.pending=null}organData.take.sort((a,b)=>a.start-b.start);clearInterval(organClockTimer);$('#organRecord').classList.remove('active');setOrganStatus('TAKE READY');persistOrgan();renderOrganRoll()}
function startOrganRecording(){stopOrganTake();organData.take=[];organData.takeBpm=state.bpm;organData.clip=null;state.organClip=null;organRecording=true;organRecordStarted=performance.now();$('#organRecord').classList.add('active');setOrganStatus('RECORDING','recording');organClockTimer=setInterval(updateOrganClock,50);updateOrganClock();renderOrganRoll()}
async function playOrganTake(){if(!organData.take.length)return toast('EMPTY TAKE');stopOrganTake();await engine.resume();organPlaying=true;setOrganStatus('PLAYING');const start=engine.ctx.currentTime+.04,len=Math.max(.12,takeLength());organData.take.forEach(e=>organTone(e.note,start+e.start,e.duration,organData.preset));const playhead=document.createElement('i');playhead.className='organ-playhead';$('#organRoll').append(playhead);playhead.animate([{left:'0%'},{left:'100%'}],{duration:len*1000,easing:'linear'});organTimer=setTimeout(()=>{if(organData.loop&&organPlaying)playOrganTake();else{organPlaying=false;setOrganStatus('READY')}},len*1000+80)}
function stopOrganTake(){organPlaying=false;clearTimeout(organTimer);stopOrganVoices();setOrganStatus(organRecording?'RECORDING':'READY');$('#organRoll .organ-playhead')?.remove()}
function mountOrganTake(){if(!organData.take.length)return toast('RECORD A TAKE FIRST');const div=+$('#organQuantize').value,sourceBpm=organData.takeBpm||state.bpm,baseStep=60/sourceBpm/4,grid=div?60/sourceBpm/(div===8?2:4):baseStep,events=organData.take.map(e=>{const raw=e.start/baseStep,step=div?Math.round(e.start/grid)*(div===8?2:1):Math.floor(raw);return{note:e.note,step,offset:div?0:(raw-step)*baseStep,duration:div?Math.max(grid,Math.round(e.duration/grid)*grid):e.duration}}),last=Math.max(...events.map(e=>e.step+Math.ceil(e.duration/baseStep)),16),lengthSteps=Math.ceil(last/16)*16,clip={enabled:true,preset:organData.preset,events,lengthSteps,sourceBpm};organData.clip=clip;state.organClip=clone(clip);persistOrgan();persist();renderOrganRoll();toast('ORGAN ADDED TO ARRANGEMENT')}
function loadScoreChords(){stopOrganTake();const secondsPerBar=3,score=[['D3','F3','A3','D4'],['G2','B2','D3','F3','A3'],['A2','C3','E3','A3'],['F2','A2','C3','F3'],['E2','C3','E3','G3']];organData.preset='discovery';organData.takeBpm=80;organData.take=score.flatMap((chord,bar)=>chord.map(note=>({note,start:bar*secondsPerBar,duration:secondsPerBar*.94})));organData.clip=null;state.organClip=null;persistOrgan();persist();renderOrgan();setOrganStatus('SCORE CHORDS / 80 BPM');toast('SCORE LOADED / GRID UNCHANGED')}

function renderPatches(filter=''){
 const list=$('#patchList');list.innerHTML='';allPatches().filter(p=>p.name.toLowerCase().includes(filter.toLowerCase())).forEach((p,i)=>{const b=document.createElement('button');b.className='patch-item '+(p.id===selectedPatch?'active':'');b.innerHTML='<span>'+String(i+1).padStart(3,'0')+'</span><span class="patch-name">'+p.name+'</span><span class="more">•••</span>';b.onclick=()=>selectPatch(p.id);list.append(b)})
 const p=getPatch();$('#patchTitle').textContent=p.name;$('#patchIndex').textContent=String(allPatches().indexOf(p)+1).padStart(3,'0');$('#displayPatch').textContent='PATTERN '+String(allPatches().indexOf(p)+1).padStart(2,'0')
}
function selectPatch(id){const p=allPatches().find(x=>x.id===id);if(!p)return;selectedPatch=id;state=patchState(p);state.currentPatch=id;if(organData.clip)state.organClip=clone(organData.clip);persist();renderAll();engine.updateAll();toast('PATCH LOADED')}
function renderDeform(){
 const val=(state.deform>0?'+':'')+state.deform+' ST';$('#deformValue').textContent=val;const k=$('[data-param="deform"]');k.dataset.value=state.deform;setKnobVisual(k,state.deform);$('#deformMode').value=state.deformMode;const row=$('#deformTargets');row.innerHTML='';LAYERS.forEach(l=>{const b=document.createElement('button');b.textContent=LABELS[l];b.className=state.deformTargets[l]?'on':'';b.onclick=()=>{state.deformTargets[l]=!state.deformTargets[l];persist();renderDeform();engine.updatePitch();showDeformDisplay()};row.append(b)})
}
function renderSequencer(){
 const p=currentPattern(),nums=$('#stepNumbers'),steps=$('#arpSteps');nums.innerHTML='';steps.innerHTML='';p.forEach((n,i)=>{let x=document.createElement('span');x.textContent=i+1;nums.append(x);let b=document.createElement('button');b.className='arp-step '+(n==='-'?'rest ':'')+(playing&&i===currentStep?'active':'');b.dataset.note=n;b.style.setProperty('--height',n==='-'?'2px':(22+(parseInt(n.slice(-1))||3)*10)+'%');b.onclick=e=>openEditor('arp',i,e);steps.append(b)});
 const bb=$('#bassBlocks');bb.innerHTML='';const bassStart=state.bassPattern.length>8?Math.floor(harmonicIndex()/8)*8:0,bassView=state.bassPattern.slice(bassStart,bassStart+8);bb.style.gridTemplateColumns='repeat('+bassView.length+',1fr)';bassView.forEach((n,j)=>{const i=bassStart+j;let b=document.createElement('button');b.className='bass-block '+(playing&&i===harmonicIndex()?'active':'');b.textContent=n;b.title=(state.progressionRoots?.[i]||n)+' / bar '+(i+1);b.onclick=e=>openEditor('bass',i,e);bb.append(b)});
 const ss=$('#staccatoSteps');ss.innerHTML='';state.staccato.forEach((on,i)=>{let b=document.createElement('button');b.className='staccato-step '+(on?'on ':'')+(playing&&i===currentStep?'active':'');b.title='Staccato step '+(i+1);b.onclick=()=>{state.staccato[i]=!state.staccato[i];persist();renderSequencer()};ss.append(b)})
}
function renderArrangement(){
 const el=$('#arrangementTimeline');el.innerHTML='';const blocks=state.sectionBlocks||[['01–04','ARP'],['05–08','ARP + BASS'],['09–12','+ STRINGS'],['13–16','+ STACCATO'],['17–20','+ BRASS']],span=state.sectionBlocks?8:4;el.style.gridTemplateColumns='repeat('+blocks.length+',1fr)';$('.arrangement-module .subline').textContent=state.sectionBlocks?'32 BAR LAMUCAL INTRO':'20 BAR PROGRESSIVE ENTRY';blocks.forEach((x,i)=>{let b=document.createElement('div');b.className='arr-block '+(Math.floor(totalBar/span)===i?'current ':(Math.floor(totalBar/span)>i?'past':''));b.innerHTML='<b>'+x[0]+'</b>'+x[1];el.append(b)});$('#autoArrangement').checked=state.autoArrangement
}
function layerStatus(l){if(!state.layers[l].enabled)return'OFF';if(state.layers[l].mute)return'MUTED';if(state.layers[l].solo)return'SOLO';return activeByArrangement(l)?'ACTIVE':'WAITING'}
function renderMixer(){
 const el=$('#channels');el.innerHTML='';LAYERS.forEach(l=>{const s=state.layers[l],d=document.createElement('div');d.className='channel '+layerStatus(l).toLowerCase();d.innerHTML='<div class="channel-head"><b>'+LABELS[l]+'</b><i class="channel-led"></i></div><div class="channel-meter"><i style="width:'+s.level+'%"></i></div><input type="range" min="0" max="100" value="'+s.level+'" aria-label="'+LABELS[l]+' level"><span class="channel-status">'+layerStatus(l)+'</span><div class="channel-actions"><button class="enable '+(s.enabled?'on':'')+'">ON</button><button class="mute '+(s.mute?'on':'')+'">MUTE</button><button class="solo '+(s.solo?'on':'')+'">SOLO</button></div>';d.querySelector('input').oninput=e=>{s.level=+e.target.value;d.querySelector('.channel-meter i').style.width=s.level+'%';persist();engine.updateAll()};d.querySelector('.enable').onclick=()=>{s.enabled=!s.enabled;persist();renderMixer();engine.updateAll()};d.querySelector('.mute').onclick=()=>{s.mute=!s.mute;persist();renderMixer();engine.updateAll()};d.querySelector('.solo').onclick=()=>{s.solo=!s.solo;persist();renderMixer();engine.updateAll()};el.append(d)});$('#masterSlider').value=state.master;$('#masterOutput').value=state.master+'%'
}
const soundDefs=[['saw','SAW',0,100,1,v=>v+'%'],['triangle','TRIANGLE',0,100,1,v=>v+'%'],['upper','UPPER',0,100,1,v=>v+'%'],['sub','SUB',0,100,1,v=>v+'%'],['cutoff','CUTOFF',500,8000,25,v=>(v/1000).toFixed(1)+' kHz'],['resonance','RESONANCE',0,10,.1,v=>v.toFixed(1)],['width','WIDTH',0,100,1,v=>v+'%'],['transpose','TRANSPOSE',-12,12,1,v=>(v>0?'+':'')+v+' ST']];
const fxDefs=[['chorus','CHORUS',0,100,1,v=>v+'%'],['flanger','FLANGER',0,100,1,v=>v+'%'],['phaser','PHASER',0,100,1,v=>v+'%'],['delay','DELAY',0,100,1,v=>v+'%'],['reverb','REVERB',0,100,1,v=>v+'%']];
function knobValue(id,group){return group==='sound'?(id==='transpose'?state.transpose:state.sound[id]):state.fx[id]}
function createKnob(def,group){const [id,label,min,max,step,fmt]=def,d=document.createElement('div');d.className='knob-control';d.innerHTML='<div class="knob" tabindex="0" data-param="'+id+'" data-group="'+group+'" data-min="'+min+'" data-max="'+max+'" data-step="'+step+'" data-value="'+knobValue(id,group)+'"></div><span class="knob-label">'+label+'</span><span class="knob-value"></span>';const k=d.querySelector('.knob');k._format=fmt;bindKnob(k);updateKnobLabel(k);return d}
function renderKnobs(){const s=$('#soundKnobs'),f=$('#fxKnobs');s.innerHTML='';f.innerHTML='';soundDefs.forEach(d=>s.append(createKnob(d,'sound')));fxDefs.forEach(d=>f.append(createKnob(d,'fx')))}
function setKnobVisual(k,value){const min=+k.dataset.min,max=+k.dataset.max;k.style.setProperty('--pct',((value-min)/(max-min))*100)}
function updateKnobLabel(k){const v=+k.dataset.value;setKnobVisual(k,v);const out=k.parentElement.querySelector('.knob-value');if(out)out.textContent=k._format?k._format(v):v}
function commitKnob(k,value){
 const min=+k.dataset.min,max=+k.dataset.max,step=+k.dataset.step;value=Math.max(min,Math.min(max,Math.round(value/step)*step));k.dataset.value=value;
 if(k.dataset.param==='deform'){state.deform=value;renderDeform();engine.updatePitch();showDeformDisplay()}
 else if(k.dataset.group==='fx')state.fx[k.dataset.param]=value;
 else if(k.dataset.param==='transpose'){state.transpose=value;engine.updatePitch()}
 else state.sound[k.dataset.param]=value;
 updateKnobLabel(k);persist();engine.updateAll()
}
function bindKnob(k){let sy=0,sv=0;k.onpointerdown=e=>{sy=e.clientY;sv=+k.dataset.value;k.setPointerCapture(e.pointerId)};k.onpointermove=e=>{if(k.hasPointerCapture(e.pointerId)){const range=+k.dataset.max-+k.dataset.min;commitKnob(k,sv-(e.clientY-sy)*range/180)}};k.onwheel=e=>{e.preventDefault();commitKnob(k,+k.dataset.value-(e.deltaY>0?1:-1)*+k.dataset.step)};k.onkeydown=e=>{if(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].includes(e.key)){e.preventDefault();commitKnob(k,+k.dataset.value+(['ArrowUp','ArrowRight'].includes(e.key)?1:-1)*+k.dataset.step)}};k.ondblclick=()=>commitKnob(k,k.dataset.param==='deform'?0:(+k.dataset.min+(+k.dataset.max-+k.dataset.min)/2))}
function openEditor(type,index,e){
 editor={type,index,note:type==='bass'?state.bassPattern[index]:(currentPattern()[index]==='-'?'G3':currentPattern()[index])};const p=$('#notePopover');p.innerHTML='<div class="note-grid">'+NAMES.map(n=>'<button data-note="'+n+'">'+n+'</button>').join('')+(type==='arp'?'<button data-rest="1">REST</button>':'')+'</div><div class="octave-row">'+[2,3,4,5,6].map(o=>'<button data-oct="'+o+'">'+o+'</button>').join('')+'</div>';p.style.left=Math.min(innerWidth-245,e.clientX)+'px';p.style.top=Math.min(innerHeight-115,e.clientY+8)+'px';p.classList.remove('hidden');let pitch=editor.note.replace(/\d/,'');p.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>{pitch=b.dataset.note});p.querySelectorAll('[data-oct]').forEach(b=>b.onclick=()=>{const value=pitch+b.dataset.oct;if(type==='bass')state.bassPattern[index]=value;else{state.arpMode='custom';const bar=harmonicIndex();state.customPatterns[bar]=state.customPatterns[bar]||triad16(harmonicChords()[bar]);state.customPatterns[bar][index]=value}p.classList.add('hidden');persist();syncInputs();renderSequencer()});const rest=p.querySelector('[data-rest]');if(rest)rest.onclick=()=>{state.arpMode='custom';const bar=harmonicIndex();state.customPatterns[bar]=state.customPatterns[bar]||triad16(harmonicChords()[bar]);state.customPatterns[bar][index]='-';p.classList.add('hidden');persist();syncInputs();renderSequencer()}}
function renderKeyboard(){const el=$('#keyboard');el.innerHTML='';'ASDFGHJK'.split('').forEach(k=>{const b=document.createElement('button');b.className='key';b.dataset.key=k.toLowerCase();b.textContent=k;b.onpointerdown=()=>manualDown(k.toLowerCase());b.onpointerup=()=>b.classList.remove('down');el.append(b)});$('#manualOctave').textContent=state.manualOctave}
function syncInputs(){
 const arpSelect=$('#arpMode');if(!arpSelect.querySelector('[value="veridis"]'))arpSelect.insertAdjacentHTML('afterbegin','<option value="veridis">ORGAN PULSE</option>');$('#bpmInput').value=state.bpm;$('#division').value=state.division;$('#gateSlider').value=state.gate;$('#gateOutput').value=state.gate+'%';$('#swingSlider').value=state.swing;$('#swingOutput').value=state.swing+'%';arpSelect.value=state.arpMode;$('#bassChange').value=state.bassChange;$('#deformMode').value=state.deformMode;$('#fineSlider').value=state.fine;$('#fineOutput').value=(state.fine>0?'+':'')+state.fine+' ¢';$('#deformLfo').checked=state.deformLfo;$('#lfoRate').value=Math.round(state.lfoRate*100);$('#lfoRateOutput').value=state.lfoRate.toFixed(2)+' Hz';$('#lfoDepth').value=state.lfoDepth;$('#lfoDepthOutput').value=state.lfoDepth+' ¢';$('#playWith').value=state.playWith;$('#displayBpm').textContent=state.bpm;$('.sequencer-module .subline').textContent=state.sourceLabel||('HARMONIC GRID / '+harmonicChords().length+' BAR LOOP')
}
function updateTransportUI(){
 const bar=harmonicIndex(),beat=Math.floor(currentStep/4)+1,root=state.progressionRoots?.[bar]||harmonicChords()[bar][0].replace(/\d/,'');$('#displayBar').textContent=String(totalBar+1).padStart(2,'0');$('#displayBeat').textContent=String(beat).padStart(2,'0');$('#displayStep').textContent=String(currentStep+1).padStart(2,'0');$('#displayRoot').textContent=root;$('#displayLayers').textContent=activeLayerNames().join(' + ');$('#transportState').textContent=playing?'RUNNING':'READY';$('#playButton').classList.toggle('active',playing);renderSequencer();renderArrangement();renderMixer()
}
function showDeformDisplay(){clearTimeout(displayTimer);$('#displayLayers').textContent='DEFORM '+(state.deform>0?'+':'')+state.deform+' ST / '+LAYERS.filter(l=>state.deformTargets[l]).map(l=>LABELS[l]).join(' + ');displayTimer=setTimeout(()=>$('#displayLayers').textContent=activeLayerNames().join(' + '),1100)}
function scheduleStep(step,time,bar){
 const h=harmonicIndex(bar),dur=60/state.bpm/(state.division==='8'?2:4),pat=currentPattern(h),swing=step%2?dur*(state.swing/100)*.45:0,t=time+swing;
 if(state.organClip?.enabled){const absolute=bar*16+step,clip=state.organClip;clip.events.filter(e=>e.step%clip.lengthSteps===absolute%clip.lengthSteps).forEach(e=>organTone(e.note,t+(e.offset||0),e.duration,clip.preset))}
 if(audible('arp',bar)&&state.rhythmStyle==='lamucal-chords'){
  if(step%2===0&&pat[step]!=='-')engine.voice(pat[step],t,h===3&&step===0?dur*8:dur*1.72,'arp');
 }else if(audible('arp',bar)&&pat[step]!=='-')engine.voice(pat[step],t,dur*state.gate/100,'arp');
 if(step===0){
  const bassLong=state.bassChange==='2 BARS'?dur*32*.93:state.bassChange==='1/2 BAR'?dur*8*.93:dur*16*.93,long=dur*16*.93;if(audible('bass',bar)&&!(state.bassChange==='2 BARS'&&bar%2))engine.voice(state.bassPattern[state.bassChange==='2 BARS'?Math.floor(bar/2)%state.bassPattern.length:h],t,bassLong,'bass');
  if(audible('strings',bar)){const c=harmonicChords()[h];engine.chord(c.slice(0,state.rhythmStyle==='lamucal-chords'?4:3),t,long,'strings')}
  if(audible('brass',bar)&&bar%2===0){const c=harmonicChords()[h];engine.chord([c[0],c[2]],t,long,'brass')}
 }
 if(step===8&&state.bassChange==='1/2 BAR'&&audible('bass',bar))engine.voice(state.bassPattern[(bar*2+1)%state.bassPattern.length],t,dur*8*.93,'bass');
 if(state.staccato[step]&&audible('staccato',bar))engine.voice(harmonicChords()[h][step%3],t,dur*.48,'staccato')
}
function scheduler(){
 if(!playing||!engine.ctx)return;const ahead=.1;while(nextNoteTime<engine.ctx.currentTime+ahead){scheduleStep(currentStep,nextNoteTime,totalBar);const dur=60/state.bpm/(state.division==='8'?2:4);nextNoteTime+=dur;currentStep++;if(currentStep>=16){currentStep=0;totalBar=(totalBar+1)%(state.loopBars||20)}}if(state.deformLfo)engine.updatePitch();requestAnimationFrame(updateTransportUI)
}
async function play(){await engine.resume();if(playing)return;playing=true;currentStep=0;totalBar=0;nextNoteTime=engine.ctx.currentTime+.06;schedulerTimer=setInterval(scheduler,25);scheduler();updateTransportUI()}
function stop(){playing=false;clearInterval(schedulerTimer);schedulerTimer=null;engine.stopAll();stopOrganVoices();currentStep=0;totalBar=0;updateTransportUI()}
function drawScope(){
 const canvas=$('#scope'),g=canvas.getContext('2d'),w=canvas.width,h=canvas.height;g.clearRect(0,0,w,h);g.strokeStyle='#797b76';g.lineWidth=1;g.beginPath();
 if(engine.analyser){const d=new Uint8Array(engine.analyser.fftSize);engine.analyser.getByteTimeDomainData(d);d.forEach((v,i)=>{const x=i/(d.length-1)*w,y=v/255*h;i?g.lineTo(x,y):g.moveTo(x,y)})}else{for(let x=0;x<w;x++){const y=h/2+Math.sin(x*.045)*7+Math.sin(x*.11)*3;x?g.lineTo(x,y):g.moveTo(x,y)}}g.stroke();requestAnimationFrame(drawScope)
}
function savePatch(){
 const current=getPatch(),name=current.name+(current.id.startsWith('user-')?'':' EDIT');let p={id:'user-'+Date.now(),name,tag:'CUSTOM',state:clone(state)};userPatches.push(p);selectedPatch=p.id;state.currentPatch=p.id;persist();renderPatches();toast('PATCH SAVED')
}
function duplicatePatch(){const p=getPatch(),copy={id:'user-'+Date.now(),name:p.name+' COPY',tag:'CUSTOM',state:clone(state)};userPatches.push(copy);selectedPatch=copy.id;state.currentPatch=copy.id;persist();renderPatches();toast('PATCH DUPLICATED')}
function deletePatch(){if(!selectedPatch.startsWith('user-')){toast('BUILT-IN PATCH');return}userPatches=userPatches.filter(p=>p.id!==selectedPatch);selectPatch('builtin-grid');toast('PATCH DELETED')}
function renderAll(){renderPatches();renderDeform();renderSequencer();renderArrangement();renderMixer();renderKnobs();renderKeyboard();syncInputs();updateTransportUI()}
function switchView(view,scrollId='instrument'){currentView=view;document.body.classList.toggle('organ-mode',view==='organ');$('#organView').setAttribute('aria-hidden',view==='organ'?'false':'true');$$('.nav-link').forEach(x=>x.classList.toggle('active',view==='organ'?x.dataset.view==='organ':x.dataset.scroll===scrollId));if(view==='synth')requestAnimationFrame(()=>document.getElementById(scrollId)?.scrollIntoView())}

$('#playButton').onclick=play;$('#stopButton').onclick=stop;
$('#bpmInput').onchange=e=>{state.bpm=Math.max(60,Math.min(160,+e.target.value||106));persist();syncInputs()};
$('#division').onchange=e=>{state.division=e.target.value;persist()};$('#gateSlider').oninput=e=>{state.gate=+e.target.value;$('#gateOutput').value=state.gate+'%';persist()};$('#swingSlider').oninput=e=>{state.swing=+e.target.value;$('#swingOutput').value=state.swing+'%';persist()};
$('#arpMode').onchange=e=>{state.arpMode=e.target.value;state.rhythmStyle=e.target.value==='veridis'?'lamucal-chords':'grid';persist();renderSequencer()};$('#bassChange').onchange=e=>{state.bassChange=e.target.value;persist()};
$('#autoArrangement').onchange=e=>{state.autoArrangement=e.target.checked;persist();updateTransportUI()};$('#masterSlider').oninput=e=>{state.master=+e.target.value;$('#masterOutput').value=state.master+'%';persist();engine.updateAll()};
$('#deformMode').onchange=e=>{state.deformMode=e.target.value;persist();engine.updatePitch()};$('#targetAll').onclick=()=>{LAYERS.forEach(l=>state.deformTargets[l]=true);persist();renderDeform();engine.updatePitch()};$('#targetNone').onclick=()=>{LAYERS.forEach(l=>state.deformTargets[l]=false);persist();renderDeform();engine.updatePitch()};
$('#fineSlider').oninput=e=>{state.fine=+e.target.value;$('#fineOutput').value=(state.fine>0?'+':'')+state.fine+' ¢';persist();engine.updatePitch()};$('#deformLfo').onchange=e=>{state.deformLfo=e.target.checked;persist()};$('#lfoRate').oninput=e=>{state.lfoRate=+e.target.value/100;$('#lfoRateOutput').value=state.lfoRate.toFixed(2)+' Hz';persist()};$('#lfoDepth').oninput=e=>{state.lfoDepth=+e.target.value;$('#lfoDepthOutput').value=state.lfoDepth+' ¢';persist()};
$$('[data-fx-enabled]').forEach(x=>x.onchange=()=>{state.fxEnabled[x.dataset.fxEnabled]=x.checked;persist();engine.updateAll()});
$('#copyBar').onclick=()=>{barClipboard=[...currentPattern()];toast('BAR COPIED')};$('#pasteBar').onclick=()=>{if(!barClipboard)return toast('CLIPBOARD EMPTY');const bar=harmonicIndex();state.arpMode='custom';state.customPatterns[bar]=[...barClipboard];persist();syncInputs();renderSequencer();toast('BAR PASTED')};$('#clearBar').onclick=()=>{const bar=harmonicIndex();state.arpMode='custom';state.customPatterns[bar]=Array(16).fill('-');persist();syncInputs();renderSequencer()};$('#resetBar').onclick=()=>{const bar=harmonicIndex();state.customPatterns[bar]=triad16(harmonicChords()[bar]);state.arpMode='triad';persist();syncInputs();renderSequencer()};
$('#savePatchTop').onclick=savePatch;$('#duplicatePatch').onclick=duplicatePatch;$('#duplicatePatch2').onclick=duplicatePatch;$('#newPatch').onclick=savePatch;$('#deletePatch').onclick=deletePatch;$('#deletePatch2').onclick=deletePatch;$('#loadPatch').onclick=()=>selectPatch(selectedPatch);$('#resetPatch').onclick=()=>selectPatch('builtin-grid');$('#resetTop').onclick=()=>selectPatch('builtin-grid');
$('#patchSearch').oninput=e=>renderPatches(e.target.value);$('.patch-filters').onclick=e=>{if(e.target.tagName!=='BUTTON')return;$$('.patch-filters button').forEach(x=>x.classList.toggle('active',x===e.target));renderPatches(e.target.textContent==='ALL'?'':e.target.textContent)};
$('#advancedToggle').onclick=()=>{const c=$('#advancedContent'),on=c.classList.toggle('open');$('#advancedToggle').textContent=on?'CLOSE':'OPEN'};
$$('[data-scroll]').forEach(b=>b.onclick=()=>switchView('synth',b.dataset.scroll));$('[data-view="organ"]').onclick=()=>switchView('organ');$('#organLaunch').onclick=()=>currentView==='organ'?switchView('synth','instrument'):switchView('organ');$('#backToGrid').onclick=()=>switchView('synth','instrument');$('.brand').onclick=e=>{e.preventDefault();switchView('synth','instrument')};
document.addEventListener('click',e=>{if(!e.target.closest('#notePopover,.arp-step,.bass-block'))$('#notePopover').classList.add('hidden')});
const keyNotes={a:'G',s:'Bb',d:'D',f:'F',g:'G',h:'Bb',j:'D',k:'F'};
async function manualDown(k){if(!keyNotes[k])return;await engine.resume();const offset=['g','h','j','k'].includes(k)?1:0,n=keyNotes[k]+(state.manualOctave+offset);engine.voice(n,engine.ctx.currentTime,.5,state.playWith);$('[data-key="'+k+'"]')?.classList.add('down')}
document.addEventListener('keydown',e=>{if(currentView!=='synth'||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const k=e.key.toLowerCase();if(k==='z'){$('#octDown').click();return}if(k==='x'){$('#octUp').click();return}if(keyNotes[k]&&!e.repeat)manualDown(k)});
document.addEventListener('keyup',e=>{if(currentView==='synth')$('[data-key="'+e.key.toLowerCase()+'"]')?.classList.remove('down')});$('#octDown').onclick=()=>{state.manualOctave=Math.max(1,state.manualOctave-1);persist();renderKeyboard()};$('#octUp').onclick=()=>{state.manualOctave=Math.min(6,state.manualOctave+1);persist();renderKeyboard()};$('#playWith').onchange=e=>{state.playWith=e.target.value;persist()};
document.addEventListener('keydown',e=>{if(currentView!=='organ'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const note=ORGAN_KEYS[e.key.toLowerCase()];if(note){e.preventDefault();organNoteOn(note,$('.organ-key[data-note="'+note+'"]'))}});
document.addEventListener('keyup',e=>{if(currentView!=='organ')return;const note=ORGAN_KEYS[e.key.toLowerCase()];if(note){e.preventDefault();organNoteOff(note)}});
$('#organLoadScore').onclick=loadScoreChords;$('#organRecord').onclick=()=>organRecording?stopOrganRecording():startOrganRecording();$('#organPlayTake').onclick=playOrganTake;$('#organStopTake').onclick=()=>{stopOrganRecording();stopOrganTake()};$('#organClearTake').onclick=()=>{stopOrganRecording();stopOrganTake();organData.take=[];organData.takeBpm=null;organData.clip=null;state.organClip=null;persistOrgan();persist();renderOrganRoll();$('#organClock').textContent='00:00.0';toast('TAKE CLEARED')};$('#organMount').onclick=mountOrganTake;$('#organLoop').onchange=e=>{organData.loop=e.target.checked;persistOrgan()};$('#organVolume').oninput=e=>{organData.volume=+e.target.value;$('#organVolumeOutput').textContent=organData.volume+'%';persistOrgan()};$('#organReverb').oninput=e=>{organData.reverb=+e.target.value;$('#organReverbOutput').textContent=organData.reverb+'%';persistOrgan()};
bindKnob($('[data-param="deform"]'));renderAll();renderOrgan();drawScope();
})();

