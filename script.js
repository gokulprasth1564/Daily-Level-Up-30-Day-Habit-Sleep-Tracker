const KEY = 'dailyLevelUp_habits_v1';
const $ = id => document.getElementById(id);

const COLORS = [
  '#12a36b',
  '#1f6feb',
  '#0ea5e9',
  '#f59e0b',
  '#8b5cf6',
  '#14b8a6',
  '#ec4899',
  '#65a30d',
  '#64748b',
  '#a855f7'
];

const DEFAULTS = [
  ['💪', 'Workout / Exercise'],
  ['😴', 'Sleep 8+ hours'],
  ['💧', 'Drink Water (3L)'],
  ['📚', 'Study / Work'],
  ['📖', 'Read (Book)'],
  ['🚶', 'Walk / Steps (8k+)'],
  ['🤸', 'Stretch / Mobility'],
  ['🥗', 'Healthy Eating'],
  ['📵', 'No Social Media (limit)'],
  ['🧘', 'Meditation / Mindfulness']
];

const SLEEP_TARGET = 8;

let S = null;
let wk = 0;

/* ---------- HELPERS ---------- */

const esc = s =>
  String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

const iso = d =>
  d.getFullYear() +
  '-' +
  String(d.getMonth() + 1).padStart(2, '0') +
  '-' +
  String(d.getDate()).padStart(2, '0');

const parse = s => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const addDays = (s, n) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return d;
};

const long = d =>
  d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

const sh = d =>
  d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

const rangeTxt = s =>
  long(parse(s)) + ' → ' + long(addDays(s, 29));

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {
    console.error('Could not save data:', e);
  }
};

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch (e) {
    return null;
  }
};

/* ---------- DATE ---------- */

function todayIdx() {
  const a = parse(iso(new Date()));
  const b = parse(S.start);

  return Math.round(
    (
      Date.UTC(
        a.getFullYear(),
        a.getMonth(),
        a.getDate()
      ) -
      Date.UTC(
        b.getFullYear(),
        b.getMonth(),
        b.getDate()
      )
    ) / 864e5
  ) + 1;
}

const curDay = () =>
  Math.min(30, Math.max(1, todayIdx()));

const isOn = (h, n) =>
  !!(S.checks[h] && S.checks[h][n]);

const sleepOf = n =>
  S.sleep[n] || {};

/* FIXED: w7 → w * 7 */
const wkDays = w => {
  const a = [];

  for (
    let n = w * 7 + 1;
    n <= Math.min(30, w * 7 + 7);
    n++
  ) {
    a.push(n);
  }

  return a;
};

/* ---------- STREAKS ---------- */

function streaks(fn, upTo) {
  let best = 0;
  let run = 0;

  for (let n = 1; n <= 30; n++) {
    if (fn(n)) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  let cur = 0;
  let n = upTo;

  if (!fn(n)) {
    n--;
  }

  while (n >= 1 && fn(n)) {
    cur++;
    n--;
  }

  return {
    cur,
    best
  };
}

/* ---------- SETUP ---------- */

$('sDate').value = iso(new Date());

const upRange = () => {
  $('sRange').textContent =
    $('sDate').value
      ? rangeTxt($('sDate').value)
      : '';
};

$('sDate').oninput = upRange;

$('sGo').onclick = () => {
  const name = $('sName').value.trim();
  const date = $('sDate').value;

  if (!name) {
    $('sName').focus();
    return;
  }

  if (!date) {
    $('sDate').focus();
    return;
  }

  S = {
    name,
    start: date,

    habits: DEFAULTS.map((h, i) => ({
      id: 'h' + i,
      icon: h[0],
      name: h[1],
      color: COLORS[i]
    })),

    checks: {},
    sleep: {},
    notes: ''
  };

  save();
  boot();
};

/* ---------- BOOT ---------- */

function boot() {
  if (!S) {
    $('app').classList.add('hide');
    $('setup').classList.remove('hide');

    upRange();
    return;
  }

  $('setup').classList.add('hide');
  $('app').classList.remove('hide');

  wk = Math.floor((curDay() - 1) / 7);

  $('notes').value = S.notes || '';

  render();

  const t = curDay();

  $('scroll').scrollLeft =
    Math.max(0, (t - 4) * 34);
}

/* ---------- MAIN RENDER ---------- */

function render() {
  const t = todayIdx();
  const H = S.habits;

  $('pName').textContent = S.name;
  $('period').textContent = rangeTxt(S.start);

  if (t < 1) {
    $('curLbl').textContent = 'STARTS IN';

    $('curDay').innerHTML =
      (1 - t) +
      ' <em>day' +
      (1 - t > 1 ? 's' : '') +
      '</em>';

  } else if (t > 30) {
    $('curLbl').textContent = 'PERIOD ENDED';

    $('curDay').innerHTML =
      'DAY 30 <em>/ 30</em>';

  } else {
    $('curLbl').textContent = 'CURRENT DAY';

    $('curDay').innerHTML =
      'DAY ' +
      t +
      ' <em>/ 30</em>';
  }

  /* ---------- COMPLETED DAYS ---------- */

  let doneDays = 0;

  for (let n = 1; n <= 30; n++) {
    if (
      H.every(h =>
        isOn(h.id, n)
      )
    ) {
      doneDays++;
    }
  }

  const p = Math.round(
    doneDays / 30 * 100
  );

  $('pct').textContent = p + '%';
  $('fill').style.width = p + '%';

  $('doneTxt').textContent =
    doneDays +
    ' day' +
    (doneDays === 1 ? '' : 's') +
    ' completed';

  $('leftTxt').textContent =
    (30 - doneDays) +
    ' days remaining';

  /* ---------- HABIT GRID ---------- */

  let h =
    '<thead><tr>' +
    '<th class="no">No.</th>' +
    '<th class="name">HABITS / DAYS</th>';

  for (let n = 1; n <= 30; n++) {
    const d = addDays(S.start, n - 1);

    h += `
      <th class="${n === t ? 'today' : ''}">
        ${n}
        <small>
          ${d.toLocaleDateString('en-US', {
            weekday: 'short'
          })}
        </small>
        <small>${sh(d)}</small>
      </th>
    `;
  }

  h += '</tr></thead><tbody>';

  H.forEach((hb, i) => {
    h += `
      <tr>
        <td class="no">${i + 1}.</td>
        <td class="name">
          ${esc(hb.icon)} ${esc(hb.name)}
        </td>
    `;

    for (let n = 1; n <= 30; n++) {
      const on = isOn(hb.id, n);
      const lock = n > t;

      h += `
        <td class="${n === t ? 'today' : ''}">
          <button
            class="dot${on ? ' on' : ''}"
            ${on ? `style="background:${hb.color}"` : ''}
            data-h="${hb.id}"
            data-d="${n}"
            ${lock ? 'disabled' : ''}
            aria-label="${esc(hb.name)} day ${n}"
          >
            ${on ? '✓' : ''}
          </button>
        </td>
      `;
    }

    h += '</tr>';
  });

  /* ---------- SLEEP TRACKER ---------- */

  h += `
    <tr class="sec">
      <td
        class="no"
        style="background:var(--soft)"
      >
        🌙
      </td>

      <td
        class="name"
        style="
          background:var(--soft);
          color:var(--acc);
          font-weight:600
        "
      >
        Sleep Tracker
      </td>

      <td colspan="30"></td>
    </tr>
  `;

  h += `
    <tr>
      <td class="no"></td>
      <td class="name">
        🛏 Hours Slept
      </td>
  `;

  for (let n = 1; n <= 30; n++) {
    const v = sleepOf(n).h;

    h += `
      <td class="${n === t ? 'today' : ''}">
        <input
          class="sl"
          type="number"
          step="0.5"
          min="0"
          max="24"
          data-sh="${n}"
          value="${v ?? ''}"
          placeholder="–"
          ${n > t ? 'disabled' : ''}
          aria-label="Hours slept day ${n}"
        >
      </td>
    `;
  }

  h += '</tr>';

  h += `
    <tr>
      <td class="no"></td>
      <td class="name">
        ⭐ Sleep Quality (1-5)
      </td>
  `;

  for (let n = 1; n <= 30; n++) {
    const v = sleepOf(n).q;

    h += `
      <td class="${n === t ? 'today' : ''}">
        <input
          class="sl"
          type="number"
          min="1"
          max="5"
          data-sq="${n}"
          value="${v ?? ''}"
          placeholder="–"
          ${n > t ? 'disabled' : ''}
          aria-label="Sleep quality day ${n}"
        >
      </td>
    `;
  }

  h += '</tr></tbody>';

  $('grid').innerHTML = h;

  renderWeek(t);
}

/* ---------- WEEK RENDER ---------- */

function renderWeek(t) {
  const H = S.habits;
  const days = wkDays(wk);

  const a = days[0];
  const b = days[days.length - 1];

  $('wLabel').textContent =
    `Week ${wk + 1} · Day ${a}–${b} ` +
    `(${sh(addDays(S.start, a - 1))} – ` +
    `${sh(addDays(S.start, b - 1))})`;

  $('wPrev').disabled = wk <= 0;
  $('wNext').disabled = wk >= 4;

  const elapsed =
    days.filter(n => n <= t).length || 0;

  /* ---------- WEEKLY HABITS ---------- */

  $('weekList').innerHTML =
    H.map(hb => {
      const c =
        days.filter(n =>
          isOn(hb.id, n)
        ).length;

      const pc =
        Math.round(
          c / days.length * 100
        );

      return `
        <div class="wk">
          <span class="ic">
            ${esc(hb.icon)}
          </span>

          <span class="nm">
            ${esc(hb.name)}
          </span>

          <b>${pc}%</b>

          <div class="bar">
            <i
              style="
                width:${pc}%;
                background:${hb.color}
              "
            ></i>
          </div>
        </div>
      `;
    }).join('') +

    `
      <p
        class="mute"
        style="margin-top:12px"
      >
        ${elapsed} of ${days.length}
        days elapsed this week
      </p>
    `;

  /* ---------- SLEEP OVERVIEW ---------- */

  const vals = days
    .map(n =>
      parseFloat(
        sleepOf(n).h
      )
    )
    .filter(v => !isNaN(v));

  $('avgSleep').textContent =
    vals.length
      ? (
          vals.reduce(
            (x, y) => x + y,
            0
          ) / vals.length
        ).toFixed(1) + ' hrs'
      : '– hrs';

  const mx =
    vals.length
      ? Math.max(...vals)
      : null;

  $('bestSleep').textContent =
    mx !== null
      ? mx + ' hrs'
      : '– hrs';

  $('chart').innerHTML =
    days.map(n => {
      const v =
        parseFloat(
          sleepOf(n).h
        );

      if (isNaN(v)) {
        return '<div></div>';
      }

      return `
        <div>
          ${v}
          <i
            style="
              height:${Math.min(
                100,
                v / 12 * 100
              )}%
            "
          ></i>
        </div>
      `;
    }).join('');

  $('xl').innerHTML =
    days
      .map(n => `<span>${n}</span>`)
      .join('');

  /* ---------- STREAKS ---------- */

  let best = 0;

  H.forEach(hb => {
    best = Math.max(
      best,
      streaks(
        n => isOn(hb.id, n),
        curDay()
      ).best
    );
  });

  const sl = streaks(
    n =>
      parseFloat(
        sleepOf(n).h
      ) >= SLEEP_TARGET,
    curDay()
  );

  const list =
    H.map(hb => ({
      hb,
      s: streaks(
        n => isOn(hb.id, n),
        curDay()
      ).cur
    }))
    .sort((x, y) => y.s - x.s)
    .slice(0, 4);

  const u = n =>
    n +
    ' day' +
    (n === 1 ? '' : 's');

  $('streaks').innerHTML =
    `
      <div class="kv">
        <span>
          Best streak (any habit)
        </span>

        <b>${u(best)}</b>
      </div>

      <div class="kv">
        <span>
          😴 Sleep ${SLEEP_TARGET}+ hrs streak
        </span>

        <b>${u(sl.cur)}</b>
      </div>
    ` +

    list.map(x => `
      <div class="kv">
        <span>
          ${esc(x.hb.icon)}
          ${esc(x.hb.name)}
        </span>

        <b style="color:${x.hb.color}">
          ${u(x.s)}
        </b>
      </div>
    `).join('');

  /* ---------- ACHIEVEMENTS ---------- */

  const A = [];

  const full =
    H.filter(hb =>
      days.every(n =>
        isOn(hb.id, n)
      )
    );

  full
    .slice(0, 3)
    .forEach(hb => {
      A.push(
        `Perfect week: ${esc(hb.name)}`
      );
    });

  if (
    days.every(n =>
      parseFloat(
        sleepOf(n).h
      ) >= SLEEP_TARGET
    )
  ) {
    A.push(
      `${days.length}/${days.length} days sleep target met`
    );
  }

  if (sl.cur >= 3) {
    A.push(
      `${sl.cur}-day sleep streak`
    );
  }

  if (best >= 3) {
    A.push(
      `${best}-day habit streak reached`
    );
  }

  let total = 0;

  H.forEach(hb => {
    for (let n = 1; n <= 30; n++) {
      if (isOn(hb.id, n)) {
        total++;
      }
    }
  });

  if (total) {
    A.push(
      `${total} habit ticks logged so far`
    );
  }

  $('ach').innerHTML =
    A.length
      ? A.map(x => `<li>${x}</li>`).join('')
      : '<li>Tick your first habit to unlock achievements.</li>';
}

/* ---------- HABIT CLICK ---------- */

$('grid').onclick = e => {
  const b =
    e.target.closest('[data-h]');

  if (!b || b.disabled) {
    return;
  }

  const id = b.dataset.h;
  const n = +b.dataset.d;

  const c =
    S.checks[id] ||
    (S.checks[id] = {});

  if (c[n]) {
    delete c[n];
  } else {
    c[n] = 1;
  }

  save();
  render();
};

/* ---------- SLEEP CHANGE ---------- */

$('grid').onchange = e => {
  const el = e.target;

  const n =
    +(el.dataset.sh || el.dataset.sq);

  if (!n) {
    return;
  }

  const r =
    S.sleep[n] ||
    (S.sleep[n] = {});

  if (el.dataset.sh) {
    r.h =
      el.value === ''
        ? undefined
        : Math.min(
            24,
            Math.max(
              0,
              +el.value
            )
          );
  } else {
    r.q =
      el.value === ''
        ? undefined
        : Math.min(
            5,
            Math.max(
              1,
              Math.round(+el.value)
            )
          );
  }

  if (
    r.h === undefined &&
    r.q === undefined
  ) {
    delete S.sleep[n];
  }

  save();
  render();
};

/* ---------- WEEK NAVIGATION ---------- */

$('wPrev').onclick = () => {
  if (wk > 0) {
    wk--;
    renderWeek(todayIdx());
  }
};

$('wNext').onclick = () => {
  if (wk < 4) {
    wk++;
    renderWeek(todayIdx());
  }
};

/* ---------- NOTES ---------- */

let nt;

$('notes').oninput = () => {
  clearTimeout(nt);

  nt = setTimeout(() => {
    S.notes = $('notes').value;
    save();
  }, 300);
};

/* ---------- EDIT HABITS ---------- */

$('editHabits').onclick = () => {
  $('habForm').innerHTML =
    S.habits.map((h, i) => `
      <div class="erow">

        <input
          maxlength="4"
          value="${esc(h.icon)}"
          data-i="${i}"
          data-k="icon"
          aria-label="Icon ${i + 1}"
        >

        <input
          maxlength="40"
          value="${esc(h.name)}"
          data-i="${i}"
          data-k="name"
          aria-label="Habit ${i + 1} name"
        >

        <input
          type="color"
          value="${h.color}"
          data-i="${i}"
          data-k="color"
          aria-label="Colour ${i + 1}"
        >

      </div>
    `).join('');

  $('habModal').classList.add('on');
};

$('habCancel').onclick = () => {
  $('habModal').classList.remove('on');
};

$('habSave').onclick = () => {
  $('habForm')
    .querySelectorAll('input')
    .forEach(el => {

      const h =
        S.habits[
          +el.dataset.i
        ];

      const k =
        el.dataset.k;

      const v =
        el.value.trim();

      if (k === 'name') {
        h.name =
          v || h.name;

      } else if (k === 'icon') {
        h.icon =
          v || h.icon;

      } else {
        h.color =
          el.value;
      }
    });

  save();

  $('habModal').classList.remove('on');

  render();
};

/* ---------- CONFIRM DIALOG ---------- */

let onYes = null;

function ask(title, msg, yes, fn) {
  $('confTitle').textContent =
    title;

  $('confMsg').textContent =
    msg;

  $('confYes').textContent =
    yes;

  onYes = fn;

  $('confModal')
    .classList.add('on');
}

$('confNo').onclick = () => {
  $('confModal')
    .classList.remove('on');

  onYes = null;
};

$('confYes').onclick = () => {
  $('confModal')
    .classList.remove('on');

  const f = onYes;

  onYes = null;

  if (f) {
    f();
  }
};

/* ---------- RESET ---------- */

$('reset').onclick = () => {
  ask(
    'Reset all 30 days',
    'This deletes all habit ticks, sleep data and notes for this period. Your habit names are kept. Continue?',
    'Reset',
    () => {
      S.checks = {};
      S.sleep = {};
      S.notes = '';

      $('notes').value = '';

      save();
      render();
    }
  );
};

/* ---------- SETTINGS ---------- */

$('openSet').onclick = () => {
  $('eName').value =
    S.name;

  $('eDate').value =
    S.start;

  $('eRange').textContent =
    'Current period: ' +
    rangeTxt(S.start);

  $('setModal')
    .classList.add('on');
};

$('closeSet').onclick = () => {
  $('setModal')
    .classList.remove('on');
};

$('eDate').oninput = () => {
  $('eRange').textContent =
    $('eDate').value
      ? 'New period: ' +
        rangeTxt($('eDate').value)
      : '';
};

$('saveProf').onclick = () => {
  S.name =
    $('eName').value.trim() ||
    S.name;

  save();
  render();

  $('setModal')
    .classList.remove('on');
};

/* ---------- CHANGE START DATE ---------- */

$('chgDate').onclick = () => {
  const nd =
    $('eDate').value;

  if (!nd || nd === S.start) {
    $('setModal')
      .classList.remove('on');

    return;
  }

  ask(
    'Change start date',
    'Changing the start date will create a new 30-day tracking period. Continue?',
    'Continue',
    () => {

      S.start = nd;
      S.checks = {};
      S.sleep = {};
      S.notes = '';

      save();

      $('setModal')
        .classList.remove('on');

      boot();
    }
  );
};

/* ---------- START APPLICATION ---------- */

S = load();

boot();