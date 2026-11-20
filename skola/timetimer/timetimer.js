(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const durationInput = byId('duration');
  const elapsedInput = byId('elapsed');
  const maximum = 24 * 60 * 60 * 1000;
  let duration = 45 * 60 * 1000;
  let remaining = duration;
  let deadline = null;
  let finished = false;
  let audio = null;

  function formatTime(milliseconds) {
    const seconds = Math.ceil(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const tail = String(seconds % 60).padStart(2, '0');

    return hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${tail}`
      : `${minutes}:${tail}`;
  }

  function render() {
    const ratio = Math.max(0, Math.min(1, remaining / duration));
    let path = '';

    if (ratio >= 1) {
      path = 'M 100 4 A 96 96 0 1 1 100 196 A 96 96 0 1 1 100 4 Z';
    } else if (ratio > 0) {
      const angle = -Math.PI / 2 - ratio * 2 * Math.PI;
      const x = 100 + 96 * Math.cos(angle);
      const y = 100 + 96 * Math.sin(angle);
      path = `M 100 100 L 100 4 A 96 96 0 ${ratio > 0.5 ? 1 : 0} 0 ${x} ${y} Z`;
    }

    byId('sector').setAttribute('d', path);
    byId('time').textContent = formatTime(remaining);
    byId('total').textContent = `Z celkových ${formatTime(duration)}`;
    byId('status').textContent = finished
      ? 'Čas vypršel.'
      : deadline !== null ? 'Odpočet běží' : 'Připraveno / pozastaveno';
    byId('start').disabled = deadline !== null || remaining <= 0;
    byId('pause').disabled = deadline === null;
    document.body.classList.toggle('finished', finished);
  }

  function unlockSound() {
    if (!byId('sound').checked) {
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        return;
      }
      audio = audio || new AudioContext();
      audio.resume().catch(() => {});
    } catch {
      audio = null;
    }
  }

  function ring() {
    if (!byId('sound').checked || !audio || audio.state !== 'running') {
      return;
    }

    for (let index = 0; index < 3; index += 1) {
      const start = audio.currentTime + index * 0.35;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(start);
      oscillator.stop(start + 0.22);
    }
  }

  function tick() {
    if (deadline !== null) {
      remaining = Math.max(0, deadline - Date.now());
      if (remaining === 0) {
        deadline = null;
        finished = true;
        ring();
      }
    }
    render();
  }

  function syncInputs() {
    durationInput.value = String(Number((duration / 60000).toFixed(6)));
    elapsedInput.value = String(Number(((duration - remaining) / 60000).toFixed(6)));
  }

  function setRound(total, elapsed = 0) {
    deadline = null;
    duration = total;
    remaining = Math.max(0, duration - elapsed);
    finished = remaining === 0;
    elapsedInput.setCustomValidity('');
    syncInputs();
    render();
  }

  byId('settings').addEventListener('submit', (event) => {
    event.preventDefault();
    const total = Math.round(Number(durationInput.value) * 60000);
    const elapsed = Math.round(Number(elapsedInput.value) * 60000);

    if (!Number.isFinite(total) || !Number.isFinite(elapsed)
      || total < 1000 || total > maximum || elapsed < 0 || elapsed > total) {
      elapsedInput.setCustomValidity('Celé kolo musí mít 1 sekundu až 24 hodin a uplynulý čas nesmí být delší než celé kolo.');
      elapsedInput.reportValidity();
      return;
    }

    setRound(total, elapsed);
  });

  for (const input of [durationInput, elapsedInput]) {
    input.addEventListener('input', () => elapsedInput.setCustomValidity(''));
  }

  function addButton(container, label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', action);
    byId(container).append(button);
  }

  const presets = [
    [30, '30 s'], [300, '5 min'], [900, '15 min'],
    [1800, '30 min'], [2700, '45 min'], [3600, '1 hod'],
    [7200, '2 hod'], [14400, '4 hod'], [28800, '8 hod'],
    [86400, '24 hod']
  ];

  for (const [seconds, label] of presets) {
    addButton('presets', label, () => setRound(seconds * 1000));
  }

  const adjustments = [
    [1, '1 s'], [10, '10 s'], [60, '1 min'],
    [600, '10 min'], [3600, '1 hod'], [36000, '10 hod']
  ];

  for (const [seconds, label] of adjustments) {
    for (const direction of [1, -1]) {
      addButton('adjustments', `${direction > 0 ? '+' : '−'}${label}`, () => {
        tick();
        const running = deadline !== null;
        const elapsed = duration - remaining;
        const total = Math.max(1000, elapsed, Math.min(maximum, duration + direction * seconds * 1000));
        setRound(total, elapsed);
        if (running && remaining > 0) {
          deadline = Date.now() + remaining;
        } else if (running && remaining === 0) {
          ring();
        }
        render();
      });
    }
  }

  byId('start').addEventListener('click', () => {
    if (deadline !== null || remaining <= 0) {
      return;
    }
    unlockSound();
    deadline = Date.now() + remaining;
    tick();
  });

  byId('pause').addEventListener('click', () => {
    tick();
    deadline = null;
    syncInputs();
    render();
  });

  byId('reset').addEventListener('click', () => setRound(duration));
  byId('sound').addEventListener('change', unlockSound);
  document.addEventListener('visibilitychange', tick);
  window.setInterval(tick, 100);
  render();
})();
