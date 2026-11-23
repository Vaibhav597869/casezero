(() => {
  'use strict';

  function initCasezero() {
    const byId = (id) => document.getElementById(id);
    const gameModal = byId('game-modal');
    const settingsModal = byId('settings-modal');
    const gameContent = byId('game-content');
    const toast = byId('toast');
    if (!gameModal || !settingsModal || !gameContent || !toast) {
      console.error('CASEZERO: required modal elements are missing; check index.html.');
      return;
    }

    const solvedKey = 'casezero-solved';
    const settingsKey = 'casezero-settings';
    const safeRead = (key, fallback) => {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch (error) {
        console.warn(`CASEZERO: could not read ${key}; using defaults.`, error);
        return fallback;
      }
    };
    const safeWrite = (key, value) => {
      try { localStorage.setItem(key, JSON.stringify(value)); }
      catch (error) { console.warn(`CASEZERO: could not save ${key}.`, error); }
    };
    const storedSolved = safeRead(solvedKey, []);
    const solved = new Set(Array.isArray(storedSolved) ? storedSolved : []);
    const evidence = [
      { id: 'ledger', title: 'The library ledger', text: 'The return column is empty for the night of the disappearance. The ink is still wet beside one name: Eleanor Vale.' },
      { id: 'dust', title: 'The dust line', text: 'A clean rectangle on the reference shelf suggests a heavy volume was removed after the room was supposedly locked.' },
      { id: 'note', title: 'The torn note', text: 'Recovered beneath the reading desk: “north stair, after the bell.” The paper matches the librarian’s stationery.' }
    ];
    const suspects = [
      { name: 'Eleanor Vale', role: 'Head librarian · last person on the floor', detail: 'Her initials appear in the ledger, and the note points to a route only staff use.' },
      { name: 'Dr. Adrian Finch', role: 'Visiting scholar · searching for a rare atlas', detail: 'He had a reason to want the missing volume, but no access to the staff stair.' },
      { name: 'Mara Quinn', role: 'Night porter · found the reading room empty', detail: 'She found the room after the bell, but her shift log places her downstairs.' }
    ];
    let discovered = new Set();
    let selectedSuspect = '';
    let toastTimer;
    let lastFocused = null;

    function openModal(modal) {
      if (!modal) return;
      lastFocused = document.activeElement;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      const close = modal.querySelector('.dialog-close');
      if (close) close.focus({ preventScroll: true });
    }
    function closeModal(modal) {
      if (!modal) return;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      if (!document.querySelector('.modal-backdrop.open')) {
        document.body.classList.remove('modal-open');
        if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({ preventScroll: true });
      }
    }
    function notify(message) {
      toast.textContent = message;
      toast.classList.add('show');
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2800);
    }
    function renderProgress() {
      const count = solved.size;
      const copy = byId('progress-copy');
      const fill = byId('progress-fill');
      const bar = document.querySelector('[role="progressbar"]');
      const caption = byId('progress-caption');
      const ranks = ['Rookie Detective', 'Field Investigator', 'Senior Detective', 'Master Investigator'];
      if (copy) copy.innerHTML = `${count} ${count === 1 ? 'Case' : 'Cases'} Solved <span>|</span> ${ranks[Math.min(count, 3)]}`;
      if (fill) fill.style.width = `${Math.min(count, 3) / 3 * 100}%`;
      if (bar) bar.setAttribute('aria-valuenow', String(count));
      if (caption) caption.textContent = count >= 3 ? 'All currently available files solved' : `${3 - count} ${3 - count === 1 ? 'file' : 'files'} remain on record`;
    }
    function showProgress() {
      const count = solved.size;
      gameContent.innerHTML = `<p class="game-kicker">BUREAU RECORD / DETECTIVE PROFILE</p><h2 id="game-title">Your Progress</h2><p class="game-lede">Every solved case leaves a mark.</p><div class="game-rule"></div><div class="result-box"><b>${count} ${count === 1 ? 'CASE' : 'CASES'} SOLVED</b><br>${['Rookie Detective', 'Field Investigator', 'Senior Detective', 'Master Investigator'][Math.min(count, 3)]}<br><br>${count ? 'Your case notes and progress are saved on this device.' : 'No cases solved yet. Case 001 is open and waiting for you.'}</div><div class="game-footer"><span class="step-label">BUREAU RECORD</span><button class="game-next" type="button" data-action="open-cases">Browse case files&nbsp; →</button></div>`;
      openModal(gameModal);
    }
    function renderIntro() {
      gameContent.innerHTML = `<p class="game-kicker">CASE 001 / OPEN FILE</p><h2 id="game-title">The Silent Library</h2><p class="game-lede">A locked room. A missing scholar. A story that does not add up.</p><div class="game-rule"></div><p class="game-body">At closing time, renowned historian Professor Alden was gone from the reading room. The doors were locked from within. No forced entry. Three small details in the scene may tell you how he left—and who helped him.</p><div class="result-box"><b>YOUR BRIEF:</b> Inspect the evidence, question the people connected to the room, then name the person responsible.</div><div class="game-footer"><span class="step-label">ESTIMATED TIME · 5 MIN</span><button class="game-next" type="button" data-action="begin">Examine the scene&nbsp; →</button></div>`;
    }
    function renderEvidence() {
      const cards = evidence.map(item => `<button class="option-card ${discovered.has(item.id) ? 'selected' : ''}" data-evidence="${item.id}" type="button"><strong>${discovered.has(item.id) ? '✓ ' : ''}${item.title}</strong><small>${discovered.has(item.id) ? item.text : 'Inspect this evidence to add it to your case notes.'}</small></button>`).join('');
      gameContent.innerHTML = `<p class="game-kicker">CASE 001 / EVIDENCE REVIEW</p><h2 id="game-title">Read the room.</h2><p class="game-lede">Inspect all three pieces of evidence to continue.</p><div class="game-rule"></div><p class="game-body">The reading room was found undisturbed. Take your time: the overlooked details are usually the ones that matter.</p><div class="game-options">${cards}</div><div class="game-footer"><span class="step-label">EVIDENCE LOG · ${discovered.size}/3 REVIEWED</span><button class="game-next" type="button" data-action="suspects" ${discovered.size < 3 ? 'disabled' : ''}>Question suspects&nbsp; →</button></div>`;
    }
    function renderSuspects() {
      const cards = suspects.map(person => `<button class="option-card ${selectedSuspect === person.name ? 'selected' : ''}" data-suspect="${person.name}" type="button"><strong>${person.name}</strong><small>${person.role}<br>${selectedSuspect === person.name ? person.detail : 'Select to review their statement.'}</small></button>`).join('');
      gameContent.innerHTML = `<p class="game-kicker">CASE 001 / INTERVIEWS</p><h2 id="game-title">Who had the means?</h2><p class="game-lede">Compare each account with what you found in the room.</p><div class="game-rule"></div><div class="game-options">${cards}</div><div class="game-footer"><span class="step-label">PERSON OF INTEREST</span><button class="game-next" type="button" data-action="accuse" ${selectedSuspect ? '' : 'disabled'}>Present your theory&nbsp; →</button></div>`;
    }
    function renderAccusation() {
      gameContent.innerHTML = `<p class="game-kicker">CASE 001 / FINAL DEDUCTION</p><h2 id="game-title">Make the call.</h2><p class="game-lede">Your evidence points to ${selectedSuspect}. Are you ready to submit?</p><div class="game-rule"></div><p class="game-body">The ledger records Eleanor Vale on the night Alden vanished. The torn note points to a staff-only stair, and the missing book left a clean space on the reference shelf. The pieces fit one person’s access and movements.</p><div class="game-options"><div class="option-card selected"><strong>${selectedSuspect}</strong><small>Confirm this suspect as responsible for Professor Alden’s disappearance.</small></div></div><div class="game-footer"><button class="text-action" type="button" data-action="back-suspects">← Reconsider</button><button class="game-next" type="button" data-action="submit">Submit deduction&nbsp; →</button></div>`;
    }
    function renderResult(correct) {
      if (correct) {
        solved.add(1);
        safeWrite(solvedKey, [...solved]);
        renderProgress();
      }
      gameContent.innerHTML = `<p class="game-kicker">CASE 001 / ${correct ? 'CASE CLOSED' : 'A LEAD, NOT A CONCLUSION'}</p><h2 id="game-title">${correct ? 'A quiet confession.' : 'The trail goes cold.'}</h2><p class="game-lede">${correct ? 'Your deduction brought Professor Alden home.' : 'The evidence did not support that accusation.'}</p><div class="game-rule"></div><div class="result-box">${correct ? '<b>CASE SOLVED.</b> Eleanor Vale had moved the atlas to conceal a forged provenance record. Alden discovered the alteration; she slipped him out through the north stair before the final bell. Your careful reading of the ledger, dust line, and note revealed the truth.' : 'The clues point to Eleanor Vale: her name in the ledger, the staff-only route in the note, and the missing reference volume. Revisit the interviews and follow the evidence.'}</div><div class="game-footer"><span class="step-label">${correct ? 'PROGRESS SAVED ON THIS DEVICE' : 'YOUR NOTES ARE STILL HERE'}</span><button class="game-next" type="button" data-action="${correct ? 'finish' : 'retry'}">${correct ? 'Return to bureau' : 'Review the evidence'}&nbsp; →</button></div>`;
    }
    function startCase() {
      discovered = new Set();
      selectedSuspect = '';
      renderIntro();
      openModal(gameModal);
    }
    function scrollToSection(id) {
      const target = byId(id);
      if (!target) return;
      target.scrollIntoView({ behavior: document.body.classList.contains('reduced-motion') ? 'auto' : 'smooth', block: 'start' });
      if (window.location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
    }

    // One delegated handler keeps dynamically rendered game controls working on touch and mouse.
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : event.target.parentElement;
      if (!target) return;

      const nav = target.closest('a[href^="#"]');
      if (nav && !nav.hasAttribute('data-open-progress')) {
        const id = nav.getAttribute('href').slice(1);
        if (byId(id)) {
          event.preventDefault();
          scrollToSection(id);
          document.querySelectorAll('.main-nav .nav-link').forEach(link => link.classList.toggle('active', link === nav));
          return;
        }
      }
      if (target.closest('[data-open-progress]')) {
        event.preventDefault();
        showProgress();
        return;
      }
      if (target.closest('#start-investigation, .case-play, .case-image.image-library')) {
        event.preventDefault();
        startCase();
        return;
      }
      if (target.closest('.locked-action, .case-locked .case-image')) {
        event.preventDefault();
        notify('This file is classified. Solve Case 001 to open the next lead.');
        return;
      }
      if (target.closest('.settings-trigger')) {
        event.preventDefault();
        openModal(settingsModal);
        return;
      }
      const closeButton = target.closest('.dialog-close');
      if (closeButton) {
        closeModal(closeButton.closest('.modal-backdrop'));
        return;
      }
      if (target.classList.contains('modal-backdrop')) {
        closeModal(target);
        return;
      }
      const gameAction = target.closest('[data-action]');
      if (!gameAction || !gameContent.contains(gameAction)) return;
      switch (gameAction.dataset.action) {
        case 'begin': renderEvidence(); break;
        case 'suspects': if (discovered.size === evidence.length) renderSuspects(); break;
        case 'accuse': if (selectedSuspect) renderAccusation(); break;
        case 'back-suspects': renderSuspects(); break;
        case 'submit': renderResult(selectedSuspect === 'Eleanor Vale'); break;
        case 'retry': renderSuspects(); break;
        case 'finish': closeModal(gameModal); break;
        case 'open-cases': closeModal(gameModal); scrollToSection('cases'); break;
      }
      const evidenceButton = target.closest('[data-evidence]');
      if (evidenceButton && gameContent.contains(evidenceButton)) {
        discovered.add(evidenceButton.dataset.evidence);
        renderEvidence();
        return;
      }
      const suspectButton = target.closest('[data-suspect]');
      if (suspectButton && gameContent.contains(suspectButton)) {
        selectedSuspect = suspectButton.dataset.suspect;
        renderSuspects();
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') [gameModal, settingsModal].forEach(modal => { if (modal.classList.contains('open')) closeModal(modal); });
    });

    const storedSettings = safeRead(settingsKey, {});
    const settings = storedSettings && typeof storedSettings === 'object' ? storedSettings : {};
    const motionSetting = byId('motion-setting');
    const contrastSetting = byId('contrast-setting');
    if (motionSetting) motionSetting.checked = Boolean(settings.reducedMotion);
    if (contrastSetting) contrastSetting.checked = Boolean(settings.highContrast);
    function applySettings() {
      if (motionSetting) document.body.classList.toggle('reduced-motion', motionSetting.checked);
      if (contrastSetting) document.body.classList.toggle('high-contrast', contrastSetting.checked);
      safeWrite(settingsKey, { reducedMotion: Boolean(motionSetting && motionSetting.checked), highContrast: Boolean(contrastSetting && contrastSetting.checked) });
    }
    if (motionSetting) motionSetting.addEventListener('change', applySettings);
    if (contrastSetting) contrastSetting.addEventListener('change', applySettings);
    applySettings();
    renderProgress();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCasezero, { once: true });
  else initCasezero();
})();
