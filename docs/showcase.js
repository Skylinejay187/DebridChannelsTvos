/* Curated, original-quality app footage. No account or backup screens are included. */
(() => {
  'use strict';
  const root = document.documentElement;
  const deck = document.querySelector('#signal-showcase');
  const slot = document.querySelector('#showcase-slot');
  const dialog = document.querySelector('#video-dialog');
  const section = document.querySelector('#catalog-previews');
  if (!deck || !slot || !dialog || !section) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const still = section.querySelector('[data-main-still]');
  const mainModes = [...section.querySelectorAll('[data-main-mode]')];
  const videos = [...deck.querySelectorAll('video')];
  const frame = deck.querySelector('.main-capture');
  const start = deck.querySelector('[data-main-start]');
  const toggle = deck.querySelector('[data-main-toggle]');
  const seek = deck.querySelector('.tour-seek');
  const elapsed = deck.querySelector('[data-main-elapsed]');
  const totalLabel = deck.querySelector('[data-main-total]');
  const loading = deck.querySelector('.tour-loading');
  const chapterList = section.querySelector('.tour-chapters');
  const error = section.querySelector('.tour-error');
  const lightbox = document.querySelector('#lightbox');
  const loops = [...document.querySelectorAll('[data-feature-loop]')].map(element => ({
    element, video: element.querySelector('video'), still: element.querySelector('[data-clip-still]'),
    panel: element.querySelector('.clip-panel'), toggle: element.querySelector('[data-loop-toggle]'),
    mode: 'still', visible: false, userPaused: false, failed: false
  }));
  let entries = [], chapters = [], chapterButtons = [], duration = 0;
  let active = 0, current = 0, mode = 'still', initialized = false;
  let wantsPlay = true, visible = false, changing = false, generation = 0, scrubbing = false;
  let autoStarted = false;
  let failed = false, lastChapter = -1;
  const format = seconds => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, '0')}`;
  const viewerOpen = () => Boolean(lightbox && lightbox.open);
  const canPlayMain = () => !failed && mode === 'motion' && wantsPlay && !document.hidden && !viewerOpen() && (visible || dialog.open);
  const isMainPlaying = () => !videos[active].paused && !videos[active].ended;

  function syncLoop(item) {
    const allowed = item.mode === 'motion' && item.visible && !item.userPaused && !item.failed &&
      !document.hidden && !viewerOpen() && !dialog.open && !isMainPlaying() && !changing;
    if (!allowed) {
      item.video.pause();
      return;
    }
    if (!item.video.getAttribute('src')) item.video.src = item.video.dataset.src;
    item.video.play().catch(() => {
      // Autoplay can be disabled by the visitor; keep a working play control.
      item.userPaused = true;
      item.toggle.textContent = 'Play loop';
      item.toggle.setAttribute('aria-pressed', 'true');
    });
  }
  function syncLoops() { loops.forEach(syncLoop); }
  function updateState() {
    const playing = isMainPlaying();
    deck.classList.toggle('is-playing', playing);
    toggle.textContent = playing ? 'Pause' : 'Play';
    toggle.setAttribute('aria-label', playing ? 'Pause showcase' : 'Play showcase');
    if (!changing) loading.hidden = true;
    syncLoops();
  }
  function syncPlayback() {
    if (changing) {
      if (!canPlayMain()) videos.forEach(video => video.pause());
      syncLoops();
      return;
    }
    const video = videos[active];
    if (canPlayMain() && initialized && video.paused && !video.ended) {
      video.play().catch(() => { wantsPlay = false; updateState(); });
    } else if (!canPlayMain()) video.pause();
    updateState();
  }
  function progress() {
    if (!entries[current]) return;
    const time = Math.min(duration, entries[current].start + videos[active].currentTime);
    if (!scrubbing) {
      seek.value = String(time);
      elapsed.textContent = format(time);
      seek.setAttribute('aria-valuetext', `${format(time)} of ${format(duration)}`);
    }
  }
  function narration(index) {
    const chapterIndex = entries[index].chapterIndex;
    if (chapterIndex === lastChapter) return;
    lastChapter = chapterIndex;
    const chapter = chapters[chapterIndex];
    deck.querySelector('[data-chapter-number]').textContent = `${String(chapterIndex + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`;
    deck.querySelector('[data-chapter-title]').textContent = chapter.title;
    deck.querySelector('[data-chapter-description]').textContent = chapter.description;
    chapterButtons.forEach((button, i) => button.setAttribute('aria-current', String(i === chapterIndex)));
  }
  function load(index, video) {
    if (video.dataset.entry !== String(index)) {
      video.pause();
      video.dataset.entry = String(index);
      video.preload = 'auto';
      video.src = entries[index].src;
      video.load();
    }
    if (video.readyState >= 2) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeout);
        video.removeEventListener('loadeddata', ready);
        video.removeEventListener('error', broken);
      };
      const ready = () => { cleanup(); resolve(); };
      const broken = () => { cleanup(); reject(new Error('Unable to load selected scene')); };
      const timeout = setTimeout(broken, 25000);
      video.addEventListener('loadeddata', ready, {once: true});
      video.addEventListener('error', broken, {once: true});
    });
  }
  function fallback() {
    failed = true;
    wantsPlay = false;
    changing = false;
    videos.forEach(video => video.pause());
    if (dialog.open) dialog.close();
    setMainMode('still');
    error.hidden = false;
    mainModes.find(button => button.dataset.mainMode === 'motion').disabled = true;
    updateState();
  }
  async function jump(index, offset = 0, play = true) {
    if (failed || !entries[index]) return;
    const token = ++generation;
    const previous = active;
    const target = initialized && current === index ? active : 1 - active;
    const oldChapter = entries[current].chapterIndex;
    wantsPlay = play;
    changing = true;
    loading.hidden = false;
    videos[previous].pause();
    syncLoops();
    try {
      const video = videos[target];
      await load(index, video);
      if (token !== generation) return;
      const localTime = Math.max(0, Math.min(offset, Math.max(0, video.duration - .04)));
      if (Math.abs(video.currentTime - localTime) > .04) video.currentTime = localTime;
      if (canPlayMain()) {
        try { await video.play(); }
        catch (_) { if (token === generation) wantsPlay = false; }
      }
      if (token !== generation) { video.pause(); return; }
      frame.classList.toggle('is-continuing', initialized && oldChapter === entries[index].chapterIndex);
      videos.forEach((element, i) => element.classList.toggle('is-front', i === target));
      active = target;
      current = index;
      initialized = true;
      changing = false;
      loading.hidden = true;
      narration(index);
      progress();
      updateState();
      // Let the last decoded frame fade away before reusing the spare element.
      const spare = 1 - active;
      if (index + 1 < entries.length) setTimeout(() => {
        if (generation === token && active !== spare) load(index + 1, videos[spare]).catch(() => {});
      }, reduced.matches ? 0 : oldChapter === entries[index].chapterIndex ? 150 : 550);
      syncPlayback();
    } catch (_) { if (token === generation) fallback(); }
  }
  function playPause() {
    if (failed || !entries.length) return;
    if (wantsPlay && (isMainPlaying() || changing)) {
      wantsPlay = false;
      videos.forEach(video => video.pause());
      updateState();
      return;
    }
    wantsPlay = true;
    if (!initialized || videos[active].ended) jump(videos[active].ended && current === entries.length - 1 ? 0 : current, 0, true);
    else syncPlayback();
  }
  function setMainMode(value) {
    mode = value;
    const motion = value === 'motion';
    still.hidden = motion;
    deck.hidden = !motion;
    chapterList.hidden = !motion;
    mainModes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mainMode === value)));
    syncPlayback();
  }
  function setLoopMode(item, value) {
    item.mode = item.failed ? 'still' : value;
    const motion = item.mode === 'motion';
    item.panel.hidden = !motion;
    item.still.hidden = motion;
    item.element.querySelectorAll('[data-clip-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.clipMode === item.mode));
    });
    syncLoop(item);
  }
  loops.forEach(item => {
    item.element.querySelectorAll('[data-clip-mode]').forEach(button => button.addEventListener('click', () => {
      setLoopMode(item, button.dataset.clipMode);
    }));
    item.toggle.addEventListener('click', () => {
      item.userPaused = !item.userPaused;
      item.toggle.textContent = item.userPaused ? 'Play loop' : 'Pause loop';
      item.toggle.setAttribute('aria-pressed', String(item.userPaused));
      syncLoop(item);
    });
    item.video.addEventListener('error', () => {
      item.failed = true;
      setLoopMode(item, 'still');
      item.element.querySelector('[data-clip-mode="motion"]').disabled = true;
    });
  });
  videos.forEach((video, index) => {
    video.muted = true;
    video.playbackRate = 1;
    video.addEventListener('timeupdate', () => { if (index === active) progress(); });
    video.addEventListener('play', updateState);
    video.addEventListener('pause', updateState);
    video.addEventListener('waiting', () => { if (index === active && wantsPlay) loading.hidden = false; });
    video.addEventListener('playing', () => { if (index === active) loading.hidden = true; });
    video.addEventListener('ended', () => {
      if (index !== active || changing) return;
      if (current + 1 < entries.length && wantsPlay) jump(current + 1, 0, true);
      else {
        wantsPlay = false;
        elapsed.textContent = format(duration);
        seek.value = String(duration);
        start.querySelector('strong').textContent = 'Watch again';
        updateState();
      }
    });
  });
  start.addEventListener('click', playPause);
  toggle.addEventListener('click', playPause);
  seek.addEventListener('input', () => { scrubbing = true; elapsed.textContent = format(Number(seek.value)); });
  seek.addEventListener('change', () => {
    scrubbing = false;
    const time = Number(seek.value);
    const index = entries.findIndex(entry => time < entry.start + entry.duration);
    const target = index < 0 ? entries.length - 1 : index;
    jump(target, time - entries[target].start, wantsPlay);
  });
  mainModes.forEach(button => button.addEventListener('click', () => {
    setMainMode(button.dataset.mainMode);
    if (mode === 'motion' && !isMainPlaying()) playPause();
  }));
  deck.querySelector('[data-main-expand]').addEventListener('click', () => {
    slot.style.minHeight = `${deck.getBoundingClientRect().height}px`;
    dialog.querySelector('#video-dialog-body').append(deck);
    root.classList.add('video-viewing');
    dialog.showModal();
    syncPlayback();
  });
  document.querySelector('#close-video').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    slot.append(deck);
    slot.style.minHeight = '';
    root.classList.remove('video-viewing');
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  if (lightbox) new MutationObserver(syncPlayback).observe(lightbox, {attributes: true, attributeFilter: ['open']});
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(changes => {
      changes.forEach(change => {
        if (change.target === slot) visible = change.isIntersecting;
        else {
          const item = loops.find(loop => loop.element === change.target);
          if (item) item.visible = change.isIntersecting;
        }
      });
      if (visible && mode === 'motion' && !autoStarted && entries.length && !reduced.matches && !saveData) {
        autoStarted = true;
        jump(0, 0, true);
      } else syncPlayback();
    }, {threshold: .1});
    observer.observe(slot);
    loops.forEach(item => observer.observe(item.element));
  } else visible = true;
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      wantsPlay = false;
      setMainMode('still');
      loops.forEach(item => setLoopMode(item, 'still'));
    }
  });
  fetch('assets/tour/tour.json?v=20261023-two-scenes', {cache: 'no-store'}).then(response => {
    if (!response.ok) throw new Error('Showcase unavailable');
    return response.json();
  }).then(manifest => {
    chapters = manifest.chapters;
    chapters.forEach((chapter, chapterIndex) => {
      const first = entries.length;
      const time = duration;
      chapter.clips.forEach(clip => {
        entries.push({...clip, chapterIndex, start: duration});
        duration += clip.duration;
      });
      const button = document.createElement('button');
      button.type = 'button';
      const timestamp = document.createElement('span');
      timestamp.textContent = format(time);
      button.append(timestamp, document.createTextNode(chapter.title));
      button.addEventListener('click', () => { setMainMode('motion'); jump(first, 0, true); });
      chapterList.append(button);
      chapterButtons.push(button);
    });
    if (!entries.length) throw new Error('No scenes');
    seek.max = String(duration);
    totalLabel.textContent = format(duration);
    narration(0);
    root.classList.add('showcase-ready');
    setMainMode(reduced.matches || saveData ? 'still' : 'motion');
    if (visible && mode === 'motion' && !autoStarted) { autoStarted = true; jump(0, 0, true); }
    loops.forEach(item => setLoopMode(item, reduced.matches || saveData || !('IntersectionObserver' in window) ? 'still' : 'motion'));
  }).catch(fallback);
})();
