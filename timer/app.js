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
    perSets: []
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

  function beep(frequency = 800, duration = 0.12) {
    if (!state.soundOn) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = frequency;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  }

  function boxingBellSingle() {
    // One clear ding at work start
    beep(900, 0.18);
  }

  function boxingBellTriple() {
    // Three fast dings when work ends and rest begins
    boxingBellSingle();
    setTimeout(function () { boxingBellSingle(); }, 250);
    setTimeout(function () { boxingBellSingle(); }, 500);
  }

  function workoutCompleteBell() {
    // Slightly lower double ding for workout complete
    if (!state.soundOn) return;
    beep(650, 0.2);
    setTimeout(function () { beep(900, 0.22); }, 250);
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
          workoutCompleteBell();
        } else {
          state.phase = PHASE.REST;
          state.remainingSeconds = getCurrentRestSeconds();
          boxingBellTriple();
        }
      } else if (state.phase === PHASE.REST) {
        state.currentRound += 1;
        if (state.currentRound > state.totalRounds) {
          state.phase = PHASE.DONE;
          state.remainingSeconds = 0;
          workoutCompleteBell();
        } else {
          state.phase = PHASE.WORK;
          state.remainingSeconds = getCurrentWorkSeconds();
          boxingBellSingle();
        }
      }
      applyPhaseUI(state.phase);
    }

    updateDisplay();

    if (state.phase === PHASE.DONE) {
      stopInterval();
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
    // Unlock audio on mobile (iOS/Android require user gesture before playing)
    if (state.soundOn) {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    }
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
      boxingBellSingle();
    }
    els.btnStart.disabled = true;
    els.btnPause.disabled = false;
    updateDisplay();
    startInterval();
  }

  function pause() {
    stopInterval();
    els.btnStart.disabled = false;
    els.btnPause.disabled = true;
    els.btnStart.textContent = 'Resume';
    els.hint.textContent = 'Paused. Press Resume to continue.';
  }

  function reset() {
    stopInterval();
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
