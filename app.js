(() => {
  const solvedKey = 'casezero-solved';
  const settingsKey = 'casezero-settings';
  const solved = new Set(JSON.parse(localStorage.getItem(solvedKey) || '[]'));
  const gameModal = document.getElementById('game-modal');
  const settingsModal = document.getElementById('settings-modal');
  const gameContent = document.getElementById('game-content');
  const toast = document.getElementById('toast');
  let phase = 'intro';
  let discovered = new Set();
  let selectedSuspect = '';
  let toastTimer;

  const evidence = [
    {id:'ledger',title:'The library ledger',text:'The return column is empty for the night of the disappearance. The ink is still wet beside one name: Eleanor Vale.'},
    {id:'dust',title:'The dust line',text:'A clean rectangle on the reference shelf suggests a heavy volume was removed after the room was supposedly locked.'},
    {id:'note',title:'The torn note',text:'Recovered beneath the reading desk: “north stair, after the bell.” The paper matches the librarian’s stationery.'}
  ];
  const suspects = [
    {name:'Eleanor Vale',role:'Head librarian · last person on the floor',detail:'Her initials appear in the ledger, and the note points to a route only staff use.'},
    {name:'Dr. Adrian Finch',role:'Visiting scholar · searching for a rare atlas',detail:'He had a reason to want the missing volume, but no access to the staff stair.'},
    {name:'Mara Quinn',role:'Night porter · found the reading room empty',detail:'She found the room after the bell, but her shift log places her downstairs.'}
  ];

  function openModal(modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    const close = modal.querySelector('.dialog-close');
    if (close) close.focus();
  }
  function closeModal(modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    if (!document.querySelector('.modal-backdrop.open')) document.body.classList.remove('modal-open');
  }
  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }
  function renderProgress() {
    const count = solved.size;
    const copy = document.getElementById('progress-copy');
    const fill = document.getElementById('progress-fill');
    const bar = document.querySelector('[role="progressbar"]');
    const caption = document.getElementById('progress-caption');
    const ranks = ['Rookie Detective','Field Investigator','Senior Detective','Master Investigator'];
    copy.innerHTML = `${count} ${count === 1 ? 'Case' : 'Cases'} Solved <span>|</span> ${ranks[Math.min(count,3)]}`;
    fill.style.width = `${Math.min(count,3) / 3 * 100}%`;
    bar.setAttribute('aria-valuenow', String(count));
    caption.textContent = count >= 3 ? 'All currently available files solved' : `${3-count} ${3-count === 1 ? 'file' : 'files'} remain on record`;
  }
  function renderIntro() {
    phase = 'intro';
    gameContent.innerHTML = `<p class="game-kicker">CASE 001 / OPEN FILE</p><h2 id="game-title">The Silent Library</h2><p class="game-lede">A locked room. A missing scholar. A story that does not add up.</p><div class="game-rule"></div><p class="game-body">At closing time, renowned historian Professor Alden was gone from the reading room. The doors were locked from within. No forced entry. Three small details in the scene may tell you how he left—and who helped him.</p><div class="result-box"><b>YOUR BRIEF:</b> Inspect the evidence, question the people connected to the room, then name the person responsible.</div><div class="game-footer"><span class="step-label">ESTIMATED TIME · 5 MIN</span><button class="game-next" data-action="begin">Examine the scene&nbsp; →</button></div>`;
  }
  function renderEvidence() {
    phase = 'evidence';
    const cards = evidence.map(item => `<button class="option-card ${discovered.has(item.id)?'selected':''}" data-evidence="${item.id}" type="button"><strong>${discovered.has(item.id)?'✓ ':''}${item.title}</strong><small>${discovered.has(item.id)?item.text:'Inspect this evidence to add it to your case notes.'}</small></button>`).join('');
    gameContent.innerHTML = `<p class="game-kicker">CASE 001 / EVIDENCE REVIEW</p><h2 id="game-title">Read the room.</h2><p class="game-lede">Inspect all three pieces of evidence to continue.</p><div class="game-rule"></div><p class="game-body">The reading room was found undisturbed. Take your time: the overlooked details are usually the ones that matter.</p><div class="game-options">${cards}</div><div class="game-footer"><span class="step-label">EVIDENCE LOG · ${discovered.size}/3 REVIEWED</span><button class="game-next" data-action="suspects" ${discovered.size<3?'disabled':''}>Question suspects&nbsp; →</button></div>`;
  }
  function renderSuspects() {
    phase = 'suspects';
    const cards = suspects.map(person => `<button class="option-card ${selectedSuspect===person.name?'selected':''}" data-suspect="${person.name}" type="button"><strong>${person.name}</strong><small>${person.role}<br>${selectedSuspect===person.name?person.detail:'Select to review their statement.'}</small></button>`).join('');
    gameContent.innerHTML = `<p class="game-kicker">CASE 001 / INTERVIEWS</p><h2 id="game-title">Who had the means?</h2><p class="game-lede">Compare each account with what you found in the room.</p><div class="game-rule"></div><div class="game-options">${cards}</div><div class="game-footer"><span class="step-label">PERSON OF INTEREST</span><button class="game-next" data-action="accuse" ${selectedSuspect?'':'disabled'}>Present your theory&nbsp; →</button></div>`;
  }
  function renderAccusation() {
    phase = 'accusation';
    gameContent.innerHTML = `<p class="game-kicker">CASE 001 / FINAL DEDUCTION</p><h2 id="game-title">Make the call.</h2><p class="game-lede">Your evidence points to ${selectedSuspect || 'someone'}. Are you ready to submit?</p><div class="game-rule"></div><p class="game-body">The ledger records Eleanor Vale on the night Alden vanished. The torn note points to a staff-only stair, and the missing book left a clean space on the reference shelf. The pieces fit one person’s access and movements.</p><div class="game-options"><button class="option-card selected" type="button"><strong>${selectedSuspect}</strong><small>Confirm this suspect as responsible for Professor Alden’s disappearance.</small></button></div><div class="game-footer"><button class="text-action" data-action="back-suspects" type="button">← Reconsider</button><button class="game-next" data-action="submit">Submit deduction&nbsp; →</button></div>`;
  }
  function renderResult(correct) {
    phase = 'result';
    if (correct) {
      solved.add(1);
      localStorage.setItem(solvedKey, JSON.stringify([...solved]));
      renderProgress();
    }
    gameContent.innerHTML = `<p class="game-kicker">CASE 001 / ${correct?'CASE CLOSED':'A LEAD, NOT A CONCLUSION'}</p><h2 id="game-title">${correct?'A quiet confession.':'The trail goes cold.'}</h2><p class="game-lede">${correct?'Your deduction brought Professor Alden home.':'The evidence did not support that accusation.'}</p><div class="game-rule"></div><div class="result-box">${correct?'<b>CASE SOLVED.</b> Eleanor Vale had moved the atlas to conceal a forged provenance record. Alden discovered the alteration; she slipped him out through the north stair before the final bell. Your careful reading of the ledger, dust line, and note revealed the truth.':'The clues point to Eleanor Vale: her name in the ledger, the staff-only route in the note, and the missing reference volume. Revisit the interviews and follow the evidence.'}</div><div class="game-footer"><span class="step-label">${correct?'PROGRESS SAVED ON THIS DEVICE':'YOUR NOTES ARE STILL HERE'}</span><button class="game-next" data-action="${correct?'finish':'retry'}">${correct?'Return to bureau':'Review the evidence'}&nbsp; →</button></div>`;
  }
  function startCase() {
    discovered = new Set(); selectedSuspect = '';
    renderIntro(); openModal(gameModal);
  }
  document.getElementById('start-investigation').addEventListener('click', startCase);
  document.querySelectorAll('.case-play,.case-image.image-library').forEach(button => button.addEventListener('click', startCase));
  document.querySelectorAll('.locked-action,.case-locked .case-image').forEach(button => button.addEventListener('click', () => notify('This file is classified. Solve Case 001 to open the next lead.')));
  gameContent.addEventListener('click', event => {
    const evidenceButton = event.target.closest('[data-evidence]');
    const suspectButton = event.target.closest('[data-suspect]');
    const actionButton = event.target.closest('[data-action]');
    if (evidenceButton) { discovered.add(evidenceButton.dataset.evidence); renderEvidence(); }
    if (suspectButton) { selectedSuspect = suspectButton.dataset.suspect; renderSuspects(); }
    if (!actionButton) return;
    switch (actionButton.dataset.action) {
      case 'begin': renderEvidence(); break;
      case 'suspects': renderSuspects(); break;
      case 'accuse': renderAccusation(); break;
      case 'back-suspects': renderSuspects(); break;
      case 'submit': renderResult(selectedSuspect === 'Eleanor Vale'); break;
      case 'retry': renderSuspects(); break;
      case 'finish': closeModal(gameModal); break;
    }
  });

  document.querySelectorAll('.settings-trigger').forEach(button => button.addEventListener('click', () => openModal(settingsModal)));
  document.querySelectorAll('.dialog-close').forEach(button => button.addEventListener('click', () => closeModal(button.closest('.modal-backdrop'))));
  [gameModal,settingsModal].forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) closeModal(modal); }));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') [gameModal,settingsModal].forEach(modal => { if (modal.classList.contains('open')) closeModal(modal); }); });
  const savedSettings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
  const motionSetting = document.getElementById('motion-setting');
  const contrastSetting = document.getElementById('contrast-setting');
  motionSetting.checked = Boolean(savedSettings.reducedMotion);
  contrastSetting.checked = Boolean(savedSettings.highContrast);
  function applySettings() {
    document.body.classList.toggle('reduced-motion', motionSetting.checked);
    document.body.classList.toggle('high-contrast', contrastSetting.checked);
    localStorage.setItem(settingsKey, JSON.stringify({reducedMotion:motionSetting.checked,highContrast:contrastSetting.checked}));
  }
  motionSetting.addEventListener('change', applySettings);
  contrastSetting.addEventListener('change', applySettings);
  applySettings();
  renderProgress();
})();
