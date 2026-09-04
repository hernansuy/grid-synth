/* Grid Synth sampler: WAV zones, polyphonic voices and MIDI input. */
(() => {
  'use strict';

  class Sample {
    constructor(buffer, name = 'sample.wav') { this.buffer = buffer; this.name = name; this.duration = buffer.duration; }
    static async fromFile(ctx, file) {
      if (!file || !/\.wav$/i.test(file.name)) throw new Error('WAV only');
      return new Sample(await ctx.decodeAudioData(await file.arrayBuffer()), file.name);
    }
  }

  function crossfadeLoopBuffer(buffer, start, end, milliseconds) {
    if (!milliseconds || end <= start) return buffer;
    const frames = Math.min(Math.floor(milliseconds * buffer.sampleRate / 1000), Math.floor((end - start) * buffer.sampleRate / 2));
    if (frames < 2) return buffer;
    const copy = new AudioBuffer({ length: buffer.length, numberOfChannels: buffer.numberOfChannels, sampleRate: buffer.sampleRate });
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) copy.getChannelData(channel).set(buffer.getChannelData(channel));
    const loopStart = Math.floor(start * buffer.sampleRate), loopEnd = Math.floor(end * buffer.sampleRate);
    for (let i = 0; i < frames; i++) {
      const fade = i / frames;
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const source = buffer.getChannelData(channel), target = copy.getChannelData(channel);
        const tail = source[Math.max(0, loopEnd - frames + i)], head = source[Math.min(buffer.length - 1, loopStart + i)];
        target[loopEnd - frames + i] = tail * (1 - fade) + head * fade;
      }
    }
    return copy;
  }

  class SampleZone {
    constructor({ sample, rootKey = 60, lowKey = 0, highKey = 127, loop = false, loopStart = 0, loopEnd = 0, crossfade = 0.015, interpolation = 'linear', velocityMin = 0, velocityMax = 127 } = {}) {
      Object.assign(this, { sample, rootKey, lowKey, highKey, loop, loopStart, loopEnd, crossfade, interpolation, velocityMin, velocityMax });
      this.buffer = loop ? crossfadeLoopBuffer(sample.buffer, loopStart, loopEnd || sample.duration, crossfade) : sample.buffer;
    }
    contains(note, velocity = 127) { return note >= this.lowKey && note <= this.highKey && velocity >= this.velocityMin && velocity <= this.velocityMax; }
    distance(note) { return Math.abs(note - this.rootKey); }
  }

  class ADSR {
    constructor({ attack = .01, decay = .2, sustain = .85, release = .5 } = {}) { Object.assign(this, { attack, decay, sustain, release }); }
    start(param, time, peak = 1) {
      param.cancelScheduledValues(time); param.setValueAtTime(.0001, time);
      param.linearRampToValueAtTime(peak, time + Math.max(.001, this.attack));
      param.setTargetAtTime(Math.max(.0001, peak * this.sustain), time + Math.max(.001, this.attack), Math.max(.001, this.decay));
    }
    releaseAt(param, time, value, duration = this.release) {
      param.cancelScheduledValues(time); param.setValueAtTime(Math.max(.0001, value), time);
      param.exponentialRampToValueAtTime(.0001, time + Math.max(.01, duration));
    }
  }

  class SamplerVoice {
    constructor(engine, zone, note, velocity, time, adsr) {
      this.engine = engine; this.zone = zone; this.note = note; this.velocity = velocity; this.started = time; this.released = false;
      const c = engine.context, source = c.createBufferSource(), gain = c.createGain();
      source.buffer = zone.buffer || zone.sample.buffer; source.playbackRate.value = engine.pitchRatio(note, zone.rootKey);
      source.loop = !!zone.loop; source.loopStart = Math.max(0, Math.min(zone.sample.duration, zone.loopStart));
      source.loopEnd = Math.max(source.loopStart + .001, Math.min(zone.sample.duration, zone.loopEnd || zone.sample.duration));
      source.connect(gain).connect(engine.output); this.source = source; this.gain = gain; this.adsr = adsr;
      adsr.start(gain.gain, time, Math.max(.001, velocity / 127)); source.start(time); source.onended = () => engine.voices.delete(this);
    }
    noteOff(time) { if (this.released) return; this.released = true; const now = Math.max(time, this.engine.context.currentTime), value = this.gain.gain.value; this.adsr.releaseAt(this.gain.gain, now, value); this.source.stop(now + Math.max(.02, this.adsr.release + .04)); }
    setPitchBend(semitones, time) { if (!this.released) this.source.playbackRate.setTargetAtTime(this.engine.pitchRatio(this.note, this.zone.rootKey) * Math.pow(2, semitones / 12), time, .008); }
    stop(time) { try { this.source.stop(time); } catch {} }
  }

  class SamplerEngine {
    constructor(context = null) {
      this.context = context || new (window.AudioContext || window.webkitAudioContext)(); this.output = this.context.createGain(); this.output.gain.value = .8; this.output.connect(this.context.destination);
      this.zones = []; this.voices = new Set(); this.adsr = new ADSR(); this.bendRange = 2; this.pitchBend = 0; this.interpolation = 'linear'; this.master = 1;
    }
    async resume() { if (this.context.state !== 'running') await this.context.resume(); }
    addZone(zone) { if (!(zone instanceof SampleZone)) zone = new SampleZone(zone); this.zones.push(zone); return zone; }
    removeZone(index) { this.zones.splice(index, 1); }
    clearZones() { this.allNotesOff(); this.zones.length = 0; }
    setVolume(value) { this.master = Math.max(0, Math.min(1, value)); this.output.gain.setTargetAtTime(this.master, this.context.currentTime, .015); }
    setADSR(values) { this.adsr = new ADSR(values); }
    pitchRatio(note, rootKey) { return Math.pow(2, (note - rootKey) / 12); }
    selectZone(note, velocity = 127) { return this.zones.filter(z => z.contains(note, velocity)).sort((a, b) => a.distance(note) - b.distance(note))[0] || null; }
    noteOn(note, velocity = 127, time = this.context.currentTime) { const zone = this.selectZone(note, velocity); if (!zone) return null; const voice = new SamplerVoice(this, zone, note, velocity, time, this.adsr); this.voices.add(voice); return voice; }
    noteOff(note, time = this.context.currentTime) { for (const voice of this.voices) if (voice.note === note) voice.noteOff(time); }
    allNotesOff() { for (const voice of this.voices) voice.stop(this.context.currentTime); this.voices.clear(); }
    setPitchBend(value, time = this.context.currentTime) { this.pitchBend = Math.max(-1, Math.min(1, value)); const semitones = this.pitchBend * this.bendRange; for (const voice of this.voices) voice.setPitchBend(semitones, time); }
    async loadWav(file) { await this.resume(); return Sample.fromFile(this.context, file); }
  }

  class MidiHandler {
    constructor(engine) { this.engine = engine; this.access = null; this.input = null; this.onStatus = () => {}; }
    async connect(inputId = '') { if (!navigator.requestMIDIAccess) throw new Error('Web MIDI no disponible'); this.access = this.access || await navigator.requestMIDIAccess(); const inputs = [...this.access.inputs.values()]; this.input = inputs.find(x => !inputId || x.id === inputId) || inputs[0] || null; if (this.input) this.input.onmidimessage = e => this.message(e.data); this.onStatus(this.input ? 'MIDI / ' + this.input.name : 'NO MIDI INPUT'); return this.input; }
    disconnect() { if (this.input) this.input.onmidimessage = null; this.input = null; this.onStatus('MIDI DISCONNECTED'); }
    message(data) { const [status, data1, data2 = 0] = data, kind = status & 240; if (kind === 144 && data2) this.engine.noteOn(data1, data2 / 127); else if (kind === 128 || (kind === 144 && !data2)) this.engine.noteOff(data1); else if (kind === 224) this.engine.setPitchBend(((data2 << 7) | data1) - 8192 > 0 ? (((data2 << 7) | data1) - 8192) / 8191 : (((data2 << 7) | data1) - 8192) / 8192); }
  }

  window.GridSampler = { Sample, SampleZone, ADSR, SamplerVoice, SamplerEngine, MidiHandler };

  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], midiName = n => ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][n % 12] + (Math.floor(n / 12) - 1);
  let engine, midi, pendingSample = null, held = new Map(), rootKey = 60;
  const status = text => { const el = $('#samplerStatus'); if (el) el.textContent = text; };
  const num = id => +(('#' + id) && $(('#' + id)).value);
  function renderZones() { const el = $('#samplerZones'); if (!el) return; el.innerHTML = engine.zones.length ? engine.zones.map((z, i) => '<div class="sampler-zone-row"><b>'+z.sample.name+'</b><span>ROOT '+midiName(z.rootKey)+'</span><span>'+midiName(z.lowKey)+'–'+midiName(z.highKey)+'</span><span>'+ (z.loop ? 'LOOP '+z.loopStart.toFixed(2)+'–'+z.loopEnd.toFixed(2)+'s' : 'ONE SHOT') +'</span><button data-remove-zone="'+i+'">×</button></div>').join('') : '<div class="sampler-empty">LOAD A WAV AND ADD A ZONE</div>'; $$('[data-remove-zone]').forEach(b => b.onclick = () => { engine.removeZone(+b.dataset.removeZone); renderZones(); }); $('#samplerZoneCount').textContent = engine.zones.length + ' ZONES'; }
  function renderKeys() { const el = $('#samplerKeyboard'); if (!el) return; el.innerHTML = ''; for (let n = 48; n <= 72; n++) { const b = document.createElement('button'); b.className = 'sampler-key '+([1,3,6,8,10].includes(n % 12) ? 'black' : 'white'); b.dataset.note = n; b.innerHTML = '<span>'+midiName(n)+'</span>'; b.onpointerdown = e => { e.preventDefault(); engine.resume(); held.set(n, engine.noteOn(n, 100)); b.classList.add('down'); }; b.onpointerup = b.onpointercancel = () => { engine.noteOff(n); held.delete(n); b.classList.remove('down'); }; el.append(b); } }
  function bind() {
    engine = new SamplerEngine(); midi = new MidiHandler(engine); midi.onStatus = status;
    $('#samplerWav')?.addEventListener('change', async e => { try { pendingSample = await engine.loadWav(e.target.files[0]); $('#samplerFileName').textContent = pendingSample.name + ' / ' + pendingSample.duration.toFixed(2) + 's'; $('#samplerLoopEnd').value = pendingSample.duration.toFixed(2); status('WAV READY / CONFIGURE ZONE'); } catch { status('WAV ERROR / USE A PCM WAV'); } });
    $('#samplerAddZone')?.addEventListener('click', () => { if (!pendingSample) return status('LOAD A WAV FIRST'); const loop = $('#samplerLoop').checked, end = Math.min(pendingSample.duration, +$('#samplerLoopEnd').value || pendingSample.duration); engine.addZone({ sample: pendingSample, rootKey: +$('#samplerRootKey').value, lowKey: +$('#samplerLowKey').value, highKey: +$('#samplerHighKey').value, loop, loopStart: Math.max(0, +$('#samplerLoopStart').value || 0), loopEnd: end, crossfade: (+$('#samplerCrossfade').value || 15) / 1000 }); renderZones(); status('ZONE ADDED / '+midiName(+$('#samplerRootKey').value)); });
    $('#samplerClear')?.addEventListener('click', () => { engine.clearZones(); renderZones(); status('ZONES CLEARED'); });
    $('#samplerVolume')?.addEventListener('input', e => { engine.setVolume(+e.target.value / 100); $('#samplerVolumeOutput').textContent = e.target.value + '%'; });
    ['samplerAttack','samplerDecay','samplerSustain','samplerRelease'].forEach(id => $('#'+id)?.addEventListener('input', () => { engine.setADSR({ attack:num('samplerAttack')/1000, decay:num('samplerDecay')/1000, sustain:num('samplerSustain')/100, release:num('samplerRelease')/1000 }); }));
    $('#samplerMidiConnect')?.addEventListener('click', async () => { try { await midi.connect($('#samplerMidiInput')?.value || ''); status('MIDI CONNECTED'); } catch { status('MIDI NOT AVAILABLE / USE KEYBOARD'); } });
    $('#samplerMidiDisconnect')?.addEventListener('click', () => midi.disconnect());
    document.addEventListener('keydown', e => { if ($('#samplerView')?.getAttribute('aria-hidden') === 'true' || e.repeat || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; const map = {z:48,s:49,x:50,d:51,c:52,v:53,g:54,b:55,h:56,n:57,j:58,m:59,q:60,'2':61,w:62,'3':63,e:64,r:65,'5':66,t:67,'6':68,y:69,'7':70,u:71,i:72}, n = map[e.key.toLowerCase()]; if (n !== undefined) { e.preventDefault(); held.set(n, engine.noteOn(n, 100)); $('#samplerKeyboard [data-note="'+n+'"]')?.classList.add('down'); } });
    document.addEventListener('keyup', e => { const map = {z:48,s:49,x:50,d:51,c:52,v:53,g:54,b:55,h:56,n:57,j:58,m:59,q:60,'2':61,w:62,'3':63,e:64,r:65,'5':66,t:67,'6':68,y:69,'7':70,u:71,i:72}, n = map[e.key.toLowerCase()]; if (n !== undefined) { engine.noteOff(n); held.delete(n); $('#samplerKeyboard [data-note="'+n+'"]')?.classList.remove('down'); } });
    $('#samplerNav')?.addEventListener('click', () => { $('#samplerView').setAttribute('aria-hidden','false'); $('#samplerView').classList.add('sampler-visible'); $('.workspace')?.style.setProperty('display','none'); $('.sidebar')?.style.setProperty('display','none'); });
    $('#samplerBack')?.addEventListener('click', () => { $('#samplerView').setAttribute('aria-hidden','true'); $('#samplerView').classList.remove('sampler-visible'); $('.workspace')?.style.removeProperty('display'); $('.sidebar')?.style.removeProperty('display'); });
    renderKeys(); renderZones(); engine.setADSR({ attack:.01, decay:.2, sustain:.85, release:.5 });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();

