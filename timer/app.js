(function () {
  'use strict';

  const PHASE = { READY: 'ready', WORK: 'work', REST: 'rest', DONE: 'done' };

  const state = {
    phase: PHASE.READY,
    currentRound: 0,
    totalRounds: 8,
    workSeconds: 30,
    restSeconds: 15,
    remainingSeconds: 30,
    intervalId: null,
    configLocked: false,
    soundOn: true,
    mode: 'simple',
    perSets: [],
    useScheduledBeeps: false
  };

  const els = {
    modeSimple: document.getElementById('mode-simple'),
    modeAdvanced: document.getElementById('mode-advanced'),
    configSimple: document.getElementById('config-simple'),
    configAdvanced: document.getElementById('config-advanced'),
    work: document.getElementById('work'),
    rest: document.getElementById('rest'),
    rounds: document.getElementById('rounds'),
    advSets: document.getElementById('adv-sets'),
    advSetsContainer: document.getElementById('adv-sets-container'),
    phaseBadge: document.getElementById('phase-badge'),
    time: document.getElementById('time'),
    currentRound: document.getElementById('current-round'),
    totalRounds: document.getElementById('total-rounds'),
    display: document.querySelector('.display'),
    btnStart: document.getElementById('btn-start'),
    btnPause: document.getElementById('btn-pause'),
    btnReset: document.getElementById('btn-reset'),
    hint: document.getElementById('hint'),
    soundEnabled: document.getElementById('sound-enabled')
  };

  let audioCtx = null;
  let dingAudio = null;
  let silentChannel = null;
  let scheduledTimeouts = [];

  function makeSilentWavDataUrl() {
    var sampleRate = 44100;
    var duration = 0.5;
    var numSamples = Math.round(sampleRate * duration);
    var numChannels = 1;
    var bitsPerSample = 16;
    var byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    var dataSize = numSamples * numChannels * (bitsPerSample / 8);
    var buffer = new ArrayBuffer(44 + dataSize);
    var view = new DataView(buffer);
    var pos = 0;
    function writeStr(s) { for (var i = 0; i < s.length; i++) view.setUint8(pos++, s.charCodeAt(i)); }
    function write16(v) { view.setUint16(pos, v, true); pos += 2; }
    function write32(v) { view.setUint32(pos, v, true); pos += 4; }
    writeStr('RIFF');
    write32(36 + dataSize);
    writeStr('WAVE');
    writeStr('fmt ');
    write32(16);
    write16(1);
    write16(numChannels);
    write32(sampleRate);
    write32(byteRate);
    write16(numChannels * (bitsPerSample / 8));
    write16(bitsPerSample);
    writeStr('data');
    write32(dataSize);
    for (var i = 0; i < numSamples; i++) {
      view.setInt16(pos, 0, true);
      pos += 2;
    }
    var b64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
    return 'data:audio/wav;base64,' + b64;
  }

  function startSilentChannel() {
    try {
      if (silentChannel) return;
      silentChannel = new Audio(makeSilentWavDataUrl());
      silentChannel.setAttribute('x-webkit-airplay', 'deny');
      silentChannel.preload = 'auto';
      silentChannel.loop = true;
      silentChannel.volume = 0;
      silentChannel.play();
    } catch (e) {}
  }

  function stopSilentChannel() {
    try {
      if (silentChannel) {
        silentChannel.pause();
        silentChannel.removeAttribute('src');
        silentChannel.load();
        silentChannel = null;
      }
    } catch (e) {}
  }

  function makeDingWavDataUrl() {
    var sampleRate = 44100;
    var freq = 900;
    var duration = 0.18;
    var numSamples = Math.round(sampleRate * duration);
    var numChannels = 1;
    var bitsPerSample = 16;
    var byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    var dataSize = numSamples * numChannels * (bitsPerSample / 8);
    var buffer = new ArrayBuffer(44 + dataSize);
    var view = new DataView(buffer);
    var pos = 0;
    function writeStr(s) { for (var i = 0; i < s.length; i++) view.setUint8(pos++, s.charCodeAt(i)); }
    function write16(v) { view.setUint16(pos, v, true); pos += 2; }
    function write32(v) { view.setUint32(pos, v, true); pos += 4; }
    writeStr('RIFF');
    write32(36 + dataSize);
    writeStr('WAVE');
    writeStr('fmt ');
    write32(16);
    write16(1);
    write16(numChannels);
    write32(sampleRate);
    write32(byteRate);
    write16(numChannels * (bitsPerSample / 8));
    write16(bitsPerSample);
    writeStr('data');
    write32(dataSize);
    for (var i = 0; i < numSamples; i++) {
      var t = i / sampleRate;
      var sample = Math.sin(2 * Math.PI * freq * t) * 0.3;
      if (i < numSamples * 0.1) sample *= i / (numSamples * 0.1);
      if (i > numSamples * 0.8) sample *= (numSamples - i) / (numSamples * 0.2);
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      pos += 2;
    }
    var b64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
    return 'data:audio/wav;base64,' + b64;
  }

  function playDingAudio() {
    if (!dingAudio || !state.soundOn) return;
    try {
      dingAudio.currentTime = 0;
      dingAudio.play();
    } catch (e) {}
  }

  function beep(frequency, duration) {
    frequency = frequency || 800;
    duration = duration || 0.12;
    if (!state.soundOn) return;
    if (dingAudio) { playDingAudio(); return; }
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      function play() {
        try {
          var osc = audioCtx.createOscillator();
          var gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.value = frequency;
          osc.type = 'sine';
          var t = audioCtx.currentTime;
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
          osc.start(t);
          osc.stop(t + duration);
        } catch (e) {}
      }
      if (audioCtx.state === 'suspended' && audioCtx.resume) {
        audioCtx.resume().then(play);
      } else {
        play();
      }
    } catch (_) {}
  }

  function boxingBellSingle() {
    if (dingAudio) playDingAudio();
    else beep(900, 0.18);
  }

  function boxingBellTriple() {
    if (dingAudio) {
      playDingAudio();
      setTimeout(function () { playDingAudio(); }, 250);
      setTimeout(function () { playDingAudio(); }, 500);
    } else {
      boxingBellSingle();
      setTimeout(function () { boxingBellSingle(); }, 250);
      setTimeout(function () { boxingBellSingle(); }, 500);
    }
  }

  function workoutCompleteBell() {
    if (!state.soundOn) return;
    if (dingAudio) {
      playDingAudio();
      setTimeout(function () { playDingAudio(); }, 250);
    } else {
      beep(650, 0.2);
      setTimeout(function () { beep(900, 0.22); }, 250);
    }
  }

  function scheduleWorkoutBeeps() {
    if (!dingAudio || !state.soundOn) return;
    scheduledTimeouts.forEach(function (id) { clearTimeout(id); });
    scheduledTimeouts = [];
    var offset = 0;
    var n = state.totalRounds;
    function dingAt(ms) {
      scheduledTimeouts.push(setTimeout(playDingAudio, ms));
    }
    if (state.mode === 'simple') {
      var work = state.workSeconds;
      var rest = state.restSeconds;
      var cycle = work + 0.75 + rest;
      for (var i = 0; i < n - 1; i++) {
        var t = (offset + work) * 1000;
        dingAt(t); dingAt(t + 250); dingAt(t + 500);
        offset += cycle;
        dingAt(offset * 1000);
      }
      var endT = (offset + work) * 1000;
      dingAt(endT);
      dingAt(endT + 250);
    } else {
      for (var j = 0; j < n; j++) {
        var w = state.perSets[j].work;
        var r = state.perSets[j].rest;
        if (j < n - 1) {
          var t = (offset + w) * 1000;
          dingAt(t); dingAt(t + 250); dingAt(t + 500);
          offset += w + 0.75 + r;
          dingAt(offset * 1000);
        } else {
          var endT = (offset + w) * 1000;
          dingAt(endT);
          dingAt(endT + 250);
        }
      }
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function readSimpleConfig() {
    return {
      workSeconds: Math.max(5, Math.min(300, parseInt(els.work.value, 10) || 30)),
      restSeconds: Math.max(5, Math.min(120, parseInt(els.rest.value, 10) || 15)),
      totalRounds: Math.max(1, Math.min(50, parseInt(els.rounds.value, 10) || 8))
    };
  }

  function buildAdvancedRows(count) {
    const sets = Math.max(1, Math.min(50, count || 1));
    els.advSets.value = sets;
    els.advSetsContainer.innerHTML = '';
    for (let i = 0; i < sets; i += 1) {
      const row = document.createElement('div');
      row.className = 'set-row';

      const label = document.createElement('div');
      label.className = 'set-row-label';
      label.textContent = 'Set ' + (i + 1);

      const workInput = document.createElement('input');
      workInput.type = 'number';
      workInput.min = '5';
      workInput.max = '300';
      workInput.step = '5';
      workInput.value = state.workSeconds;
      workInput.className = 'set-work';
      workInput.setAttribute('aria-label', 'Work seconds for set ' + (i + 1));

      const restInput = document.createElement('input');
      restInput.type = 'number';
      restInput.min = '5';
      restInput.max = '120';
      restInput.step = '5';
      restInput.value = state.restSeconds;
      restInput.className = 'set-rest';
      restInput.setAttribute('aria-label', 'Rest seconds for set ' + (i + 1));

      row.appendChild(label);
      row.appendChild(workInput);
      row.appendChild(restInput);
      els.advSetsContainer.appendChild(row);
    }
  }

  function readAdvancedConfig() {
    const sets = Math.max(1, Math.min(50, parseInt(els.advSets.value, 10) || 1));
    const rows = els.advSetsContainer.querySelectorAll('.set-row');
    const perSets = [];
    for (let i = 0; i < sets; i += 1) {
      const row = rows[i];
      let work = state.workSeconds;
      let rest = state.restSeconds;
      if (row) {
        const workInput = row.querySelector('.set-work');
        const restInput = row.querySelector('.set-rest');
        work = Math.max(5, Math.min(300, parseInt(workInput.value, 10) || state.workSeconds));
        rest = Math.max(5, Math.min(120, parseInt(restInput.value, 10) || state.restSeconds));
      }
      perSets.push({ work: work, rest: rest });
    }
    return {
      totalRounds: perSets.length,
      perSets: perSets
    };
  }

  function getCurrentWorkSeconds() {
    if (state.mode === 'advanced' && state.perSets.length) {
      const idx = Math.min(state.currentRound - 1, state.perSets.length - 1);
      return state.perSets[idx].work;
    }
    return state.workSeconds;
  }

  function getCurrentRestSeconds() {
    if (state.mode === 'advanced' && state.perSets.length) {
      const idx = Math.min(state.currentRound - 1, state.perSets.length - 1);
      return state.perSets[idx].rest;
    }
    return state.restSeconds;
  }

  function applyPhaseUI(phase) {
    els.display.classList.remove('phase-ready', 'phase-work', 'phase-rest');
    els.display.classList.add('phase-' + phase);
    if (phase === PHASE.WORK) els.phaseBadge.textContent = 'WORK';
    else if (phase === PHASE.REST) els.phaseBadge.textContent = 'REST';
    else if (phase === PHASE.DONE) els.phaseBadge.textContent = 'DONE';
    else els.phaseBadge.textContent = 'READY';
  }

  function updateDisplay() {
    els.time.textContent = formatTime(state.remainingSeconds);
    els.currentRound.textContent = state.currentRound;
    if (state.mode === 'advanced') {
      const sets = state.configLocked
        ? state.totalRounds
        : Math.max(1, Math.min(50, parseInt(els.advSets.value, 10) || state.totalRounds));
      els.totalRounds.textContent = sets;
    } else {
      els.totalRounds.textContent = state.configLocked
        ? state.totalRounds
        : (parseInt(els.rounds.value, 10) || state.totalRounds);
    }
    applyPhaseUI(state.phase);
  }

  function lockConfig(lock) {
    state.configLocked = lock;
    const disableSimple = lock || state.mode !== 'simple';
    const disableAdvanced = lock || state.mode !== 'advanced';
    els.work.disabled = disableSimple;
    els.rest.disabled = disableSimple;
    els.rounds.disabled = disableSimple;
    els.advSets.disabled = disableAdvanced;
    const setInputs = els.advSetsContainer.querySelectorAll('input');
    setInputs.forEach(function (input) {
      input.disabled = disableAdvanced;
    });
  }

  function tick() {
    if (state.phase === PHASE.DONE) {
      stopInterval();
      return;
    }

    state.remainingSeconds -= 1;

    if (state.remainingSeconds <= 0) {
      if (state.phase === PHASE.WORK) {
        if (state.currentRound >= state.totalRounds) {
          state.phase = PHASE.DONE;
          state.remainingSeconds = 0;
          if (!state.useScheduledBeeps) workoutCompleteBell();
        } else {
          state.phase = PHASE.REST;
          state.remainingSeconds = getCurrentRestSeconds();
          if (!state.useScheduledBeeps) boxingBellTriple();
        }
      } else if (state.phase === PHASE.REST) {
        state.currentRound += 1;
        if (state.currentRound > state.totalRounds) {
          state.phase = PHASE.DONE;
          state.remainingSeconds = 0;
          if (!state.useScheduledBeeps) workoutCompleteBell();
        } else {
          state.phase = PHASE.WORK;
          state.remainingSeconds = getCurrentWorkSeconds();
          if (!state.useScheduledBeeps) boxingBellSingle();
        }
      }
      applyPhaseUI(state.phase);
    }

    updateDisplay();

    if (state.phase === PHASE.DONE) {
      stopInterval();
      stopSilentChannel();
      els.btnStart.textContent = 'Start';
      els.btnStart.disabled = false;
      els.btnPause.disabled = true;
      lockConfig(false);
      els.hint.textContent = 'Workout complete. Adjust settings and press Start to go again.';
    }
  }

  function startInterval() {
    if (state.intervalId) return;
    state.intervalId = setInterval(tick, 1000);
  }

  function stopInterval() {
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
  }

  function start() {
    if (state.phase === PHASE.DONE || state.phase === PHASE.READY) {
      if (state.mode === 'advanced') {
        const cfgAdv = readAdvancedConfig();
        state.perSets = cfgAdv.perSets;
        state.totalRounds = cfgAdv.totalRounds;
        state.currentRound = 1;
        state.phase = PHASE.WORK;
        state.remainingSeconds = getCurrentWorkSeconds();
      } else {
        const cfg = readSimpleConfig();
        state.workSeconds = cfg.workSeconds;
        state.restSeconds = cfg.restSeconds;
        state.totalRounds = cfg.totalRounds;
        state.currentRound = 1;
        state.phase = PHASE.WORK;
        state.remainingSeconds = state.workSeconds;
      }
      state.currentRound = 1;
      lockConfig(true);
      els.btnStart.textContent = 'Resume';
      els.hint.textContent = 'Work hard during WORK, recover during REST.';
      // iOS: silent looping channel can allow dings to play with silent switch on; then unlock + schedule dings
      if (state.soundOn) {
        startSilentChannel();
        if (!dingAudio) {
          dingAudio = new Audio(makeDingWavDataUrl());
          dingAudio.volume = 1;
        }
        playDingAudio();
        scheduleWorkoutBeeps();
        state.useScheduledBeeps = true;
      }
    } else {
      state.useScheduledBeeps = false;
    }
    els.btnStart.disabled = true;
    els.btnPause.disabled = false;
    updateDisplay();
    startInterval();
  }

  function pause() {
    stopInterval();
    state.useScheduledBeeps = false;
    scheduledTimeouts.forEach(function (id) { clearTimeout(id); });
    scheduledTimeouts = [];
    els.btnStart.disabled = false;
    els.btnPause.disabled = true;
    els.btnStart.textContent = 'Resume';
    els.hint.textContent = 'Paused. Press Resume to continue.';
  }

  function reset() {
    stopInterval();
    scheduledTimeouts.forEach(function (id) { clearTimeout(id); });
    scheduledTimeouts = [];
    stopSilentChannel();
    state.phase = PHASE.READY;
    state.currentRound = 0;
    if (state.mode === 'advanced') {
      const cfgAdv = readAdvancedConfig();
      state.perSets = cfgAdv.perSets;
      state.totalRounds = cfgAdv.totalRounds;
      state.remainingSeconds = cfgAdv.perSets[0] ? cfgAdv.perSets[0].work : state.workSeconds;
    } else {
      const cfg = readSimpleConfig();
      state.workSeconds = cfg.workSeconds;
      state.restSeconds = cfg.restSeconds;
      state.totalRounds = cfg.totalRounds;
      state.remainingSeconds = state.workSeconds;
    }
    lockConfig(false);
    els.btnStart.textContent = 'Start';
    els.btnStart.disabled = false;
    els.btnPause.disabled = true;
    els.hint.textContent = 'Set work, rest, and rounds above, then press Start.';
    updateDisplay();
  }

  els.btnStart.addEventListener('click', start);
  els.btnPause.addEventListener('click', pause);
  els.btnReset.addEventListener('click', reset);

  els.soundEnabled.addEventListener('change', function () {
    state.soundOn = !!els.soundEnabled.checked;
  });

  function setMode(mode) {
    if (state.configLocked) {
      reset();
    }
    state.mode = mode;
    if (mode === 'advanced') {
      els.modeSimple.classList.remove('mode-tab-active');
      els.modeAdvanced.classList.add('mode-tab-active');
      els.configSimple.style.display = 'none';
      els.configAdvanced.style.display = '';
      els.hint.textContent = 'Advanced: set work and rest for every set.';
    } else {
      els.modeAdvanced.classList.remove('mode-tab-active');
      els.modeSimple.classList.add('mode-tab-active');
      els.configAdvanced.style.display = 'none';
      els.configSimple.style.display = '';
      els.hint.textContent = 'Set work, rest, and rounds above, then press Start.';
    }
    lockConfig(false);
    updateDisplay();
  }

  els.modeSimple.addEventListener('click', function () {
    setMode('simple');
  });

  els.modeAdvanced.addEventListener('click', function () {
    setMode('advanced');
  });

  els.work.addEventListener('change', function () {
    if (state.mode !== 'simple') return;
    if (!state.configLocked) state.remainingSeconds = readSimpleConfig().workSeconds;
    updateDisplay();
  });
  els.rest.addEventListener('change', function () {
    if (state.mode !== 'simple') return;
    updateDisplay();
  });
  els.rounds.addEventListener('change', function () {
    if (state.mode !== 'simple') return;
    updateDisplay();
  });

  els.advSets.addEventListener('change', function () {
    if (state.mode !== 'advanced') return;
    buildAdvancedRows(parseInt(els.advSets.value, 10) || 1);
    if (!state.configLocked) {
      const cfgAdv = readAdvancedConfig();
      state.perSets = cfgAdv.perSets;
      state.totalRounds = cfgAdv.totalRounds;
      state.remainingSeconds = cfgAdv.perSets[0] ? cfgAdv.perSets[0].work : state.remainingSeconds;
    }
    updateDisplay();
  });

  els.work.addEventListener('input', function () {
    if (state.mode !== 'simple') return;
    if (!state.configLocked) {
      state.workSeconds = readSimpleConfig().workSeconds;
      state.remainingSeconds = state.workSeconds;
    }
    updateDisplay();
  });

  // Initial mode & display
  els.configAdvanced.style.display = 'none';
  els.configSimple.style.display = '';

  // Sync initial display from inputs
  state.workSeconds = readSimpleConfig().workSeconds;
  state.restSeconds = readSimpleConfig().restSeconds;
  state.totalRounds = readSimpleConfig().totalRounds;
  state.remainingSeconds = state.workSeconds;
  buildAdvancedRows(parseInt(els.advSets.value, 10) || 4);
  updateDisplay();
})();
