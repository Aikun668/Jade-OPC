# 宠物记忆可点击验证原型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, local-only clickable prototype that validates the gentle pet-memory interview loop using the fictional cat 沫沫.

**Architecture:** A static browser prototype keeps all state in memory. `prototype/src/state.js` owns the six-screen state machine and is unit tested with Node's built-in test runner; `prototype/src/app.js` renders the current state into a single app root and dispatches user actions; `prototype/styles.css` provides the mobile-first visual system. No API, login, upload, persistence, analytics, reminders, sharing, or AI model call is included.

**Tech Stack:** Semantic HTML, CSS, browser ES modules, Node.js built-in `node:test`; no third-party dependencies.

## Global Constraints

- The prototype must run locally from a basic static server; use `python -m http.server 4173 --directory prototype` during validation.
- It is a validation prototype: all content is demo content and is discarded on refresh.
- Use the fictional cat “沫沫”; any image area must be explicitly labeled `示例照片`.
- Include the six approved states: start, photo question, memory-aids branch, optional follow-up, editable AI draft, saved view.
- Any user path must offer a low-pressure skip, pause, or finish exit where applicable.
- The AI draft must be visibly marked as editable and must never auto-save.
- Do not add account, upload, storage, notifications, sharing, progress, streaks, gamification, community, or AI network integration.
- Copy must not use guilt, urgency, therapeutic claims, or completion pressure.
- The working directory is not a Git repository; do not attempt commits unless a repository is initialized before execution.

---

## File Structure

- `package.json` — defines the dependency-free Node test command.
- `prototype/index.html` — semantic document shell and `#app` mounting point.
- `prototype/styles.css` — responsive visual system, layout, cards, inputs and accessible focus states.
- `prototype/src/state.js` — pure state shape, action constants and deterministic transitions.
- `prototype/src/app.js` — DOM rendering, event delegation and state-to-screen mapping.
- `prototype/assets/momo-window.svg` — non-sensitive local placeholder illustration for the clearly labeled sample-photo area; it can be replaced later without changing application behavior.
- `tests/state.test.js` — unit tests for the approved paths and safety exits.

### Task 1: Establish the testable prototype state machine

**Files:**
- Create: `package.json`
- Create: `prototype/src/state.js`
- Create: `tests/state.test.js`

**Interfaces:**
- Consumes: plain action objects from the UI.
- Produces: `createInitialState()` and `reduce(state, action)` exported from `prototype/src/state.js`.
- State shape: `{ screen, entry, answer, aid, savedItems }` where `screen` is one of `start | photo | aids | followup | draft | saved`.

- [ ] **Step 1: Create the Node test command and write failing state tests**

Create `package.json`:

```json
{
  "name": "pet-memory-validation-prototype",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

Create `tests/state.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, reduce } from '../prototype/src/state.js';

test('all four entries lead to the same low-pressure photo question in round one', () => {
  for (const entry of ['日常', '相遇', '你们的关系', '一张照片']) {
    const next = reduce(createInitialState(), { type: 'SELECT_ENTRY', entry });
    assert.equal(next.screen, 'photo');
    assert.equal(next.entry, entry);
  }
});

test('cannot remember opens memory aids and allows an immediate safe ending', () => {
  const photo = reduce(createInitialState(), { type: 'SELECT_ENTRY', entry: '一张照片' });
  const aids = reduce(photo, { type: 'OPEN_AIDS' });
  const saved = reduce(aids, { type: 'FINISH' });

  assert.equal(aids.screen, 'aids');
  assert.equal(saved.screen, 'saved');
  assert.deepEqual(saved.savedItems, []);
});

test('a short answer creates an editable draft but does not save it automatically', () => {
  const photo = reduce(createInitialState(), { type: 'SELECT_ENTRY', entry: '日常' });
  const followup = reduce(photo, { type: 'SET_ANSWER', answer: '它总喜欢在午后晒太阳。' });
  const draft = reduce(followup, { type: 'SKIP_FOLLOWUP' });

  assert.equal(followup.screen, 'followup');
  assert.equal(draft.screen, 'draft');
  assert.deepEqual(draft.savedItems, []);
});

test('saving an editable draft creates two visible memory items', () => {
  let state = reduce(createInitialState(), { type: 'SELECT_ENTRY', entry: '一张照片' });
  state = reduce(state, { type: 'SET_ANSWER', answer: '它总喜欢在午后晒太阳。' });
  state = reduce(state, { type: 'SKIP_FOLLOWUP' });
  state = reduce(state, { type: 'SAVE_DRAFT' });

  assert.equal(state.screen, 'saved');
  assert.equal(state.savedItems.length, 2);
  assert.match(state.savedItems[0].body, /午后/);
});
```

- [ ] **Step 2: Run the tests and verify they fail before implementation**

Run: `npm test`

Expected: failure reporting that `prototype/src/state.js` cannot be found.

- [ ] **Step 3: Implement the minimal pure state machine**

Create `prototype/src/state.js`:

```js
export function createInitialState() {
  return { screen: 'start', entry: null, answer: '', aid: null, savedItems: [] };
}

function makeDraft(answer) {
  const first = answer.trim() || '沫沫喜欢在午后去窗边晒太阳。';
  return [
    { label: '日常片段', title: '窗边的中午', body: first },
    { label: '小习惯', title: '阳光落下来时', body: '阳光落下来时，它常常安静地待在那里。' }
  ];
}

export function reduce(state, action) {
  switch (action.type) {
    case 'SELECT_ENTRY':
      return { ...state, screen: 'photo', entry: action.entry };
    case 'OPEN_AIDS':
      return { ...state, screen: 'aids' };
    case 'SELECT_AID':
      return { ...state, screen: 'followup', aid: action.aid };
    case 'SET_ANSWER':
      return { ...state, screen: 'followup', answer: action.answer };
    case 'SKIP_FOLLOWUP':
      return { ...state, screen: 'draft' };
    case 'SAVE_DRAFT':
      return { ...state, screen: 'saved', savedItems: makeDraft(state.answer) };
    case 'FINISH':
      return { ...state, screen: 'saved' };
    case 'START_OVER':
      return createInitialState();
    default:
      return state;
  }
}
```

- [ ] **Step 4: Run the state tests and verify they pass**

Run: `npm test`

Expected: four passing tests and zero failures.

- [ ] **Step 5: Record completion without a commit**

The workspace has no `.git` directory. Do not run `git commit`; retain the passing command output in the implementation handoff.

### Task 2: Build the static mobile shell and visual system

**Files:**
- Create: `prototype/index.html`
- Create: `prototype/styles.css`
- Create: `prototype/assets/momo-window.svg`

**Interfaces:**
- Consumes: the `#app` container and the asset path `/assets/momo-window.svg`.
- Produces: a phone-width, keyboard-accessible visual shell used by `prototype/src/app.js`.

- [ ] **Step 1: Create the semantic document shell**

Create `prototype/index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="留念余温：宠物记忆验证原型" />
    <title>留念余温 · 验证原型</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main id="app" aria-live="polite"></main>
    <script type="module" src="./src/app.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Add the local sample-photo placeholder**

Create `prototype/assets/momo-window.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560" role="img" aria-labelledby="title desc">
  <title id="title">沫沫在窗边晒太阳的示例照片</title>
  <desc id="desc">暖色窗光下，一只虚构的猫安静蜷在窗边。</desc>
  <defs>
    <linearGradient id="wall" x1="0" x2="1"><stop stop-color="#d7bf95"/><stop offset="1" stop-color="#f6ebd7"/></linearGradient>
    <linearGradient id="sun" x1="0" x2="1"><stop stop-color="#fff3b7" stop-opacity=".9"/><stop offset="1" stop-color="#fff3b7" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="800" height="560" fill="url(#wall)"/>
  <rect x="78" y="42" width="258" height="302" rx="10" fill="#8e785c"/>
  <rect x="93" y="57" width="228" height="272" rx="5" fill="#cfe0dd"/>
  <path d="M0 0h550v560H0z" fill="url(#sun)"/>
  <rect y="356" width="800" height="204" fill="#a98f70"/>
  <ellipse cx="510" cy="403" rx="195" ry="93" fill="#b97449"/>
  <circle cx="598" cy="330" r="72" fill="#c98357"/>
  <path d="M545 280l20-72 42 56M622 268l48-54 6 77" fill="#a6613c"/>
  <ellipse cx="622" cy="331" rx="8" ry="10" fill="#4c4438"/><ellipse cx="579" cy="331" rx="8" ry="10" fill="#4c4438"/>
  <path d="M578 367q21 14 42 0" fill="none" stroke="#6f4a38" stroke-width="6" stroke-linecap="round"/>
  <path d="M385 417q-89 34-82 89" fill="none" stroke="#a6613c" stroke-width="29" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 3: Add the complete mobile-first visual system**

Create `prototype/styles.css`:

```css
:root { --paper:#f8f6f0; --card:#fffdf8; --ink:#423e37; --muted:#7a786f; --olive:#7b8372; --line:#ddd8cb; --shadow:0 16px 34px rgba(70,62,49,.10); }
* { box-sizing:border-box; }
body { margin:0; min-height:100vh; background:var(--paper); color:var(--ink); font-family:"Noto Sans SC","Microsoft YaHei",sans-serif; }
button, input { font:inherit; }
button { cursor:pointer; }
button:focus-visible, input:focus-visible { outline:3px solid rgba(123,131,114,.45); outline-offset:3px; }
.phone { width:min(100%, 460px); min-height:100vh; margin:auto; padding:28px 22px 42px; background:linear-gradient(145deg,#fffefa,var(--paper)); }
.topbar { display:flex; align-items:center; justify-content:space-between; min-height:42px; color:var(--muted); font-size:14px; }
.topbar strong { color:var(--ink); font-family:Georgia,"Songti SC",serif; font-size:20px; font-weight:500; }
.quiet { border:0; background:transparent; color:var(--muted); padding:8px 0; }
.screen { padding-top:54px; }
.eyebrow { color:var(--olive); font-size:13px; letter-spacing:.08em; }
h1,h2 { font-family:Georgia,"Songti SC",serif; font-weight:500; line-height:1.35; margin:10px 0; }
h1 { font-size:34px; } h2 { font-size:27px; }
p { color:var(--muted); line-height:1.8; margin:0; }
.choice-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:38px 0; }
.choice,.aid,.secondary { border:1px solid var(--line); background:rgba(255,253,248,.7); color:var(--ink); border-radius:18px; padding:21px 16px; text-align:left; min-height:82px; }
.choice:hover,.aid:hover { border-color:var(--olive); }
.privacy { margin-top:46px; font-size:13px; text-align:center; color:var(--muted); }
.photo-card,.memory-card,.draft { background:var(--card); border:1px solid var(--line); border-radius:24px; box-shadow:var(--shadow); overflow:hidden; margin:24px 0; }
.photo-card img { display:block; width:100%; aspect-ratio:4/3; object-fit:cover; background:#d8c5a2; }
.sample-label { display:block; padding:10px 16px; color:var(--muted); font-size:12px; }
.question { font-size:28px; margin:24px 0 18px; }
.answer { width:100%; min-height:112px; resize:vertical; border:1px solid var(--line); border-radius:18px; padding:16px; background:var(--card); color:var(--ink); line-height:1.7; }
.action-row { display:flex; gap:16px; flex-wrap:wrap; margin-top:16px; }
.text-action { border:0; background:transparent; color:var(--olive); padding:8px 0; }
.aid-list { display:grid; gap:12px; margin:30px 0; }
.aid { min-height:58px; padding:16px; }
.finish { display:block; width:100%; margin-top:34px; padding:15px; border:1px solid var(--line); border-radius:999px; background:transparent; color:var(--muted); }
.answer-chip { width:100%; text-align:left; background:#eef0e9; border:1px solid #d8ddcf; border-radius:16px; padding:16px; color:var(--ink); margin:18px 0; }
.draft { padding:22px; }
.draft small,.memory-card small { color:var(--olive); letter-spacing:.07em; }
.memory-card { padding:22px; box-shadow:none; }
.memory-card h3 { margin:8px 0; font-family:Georgia,"Songti SC",serif; font-weight:500; font-size:23px; }
.primary { width:100%; border:0; border-radius:999px; padding:16px 20px; color:#fff; background:var(--olive); margin-top:18px; }
.saved-actions { display:grid; gap:10px; margin-top:30px; }
.saved-actions .secondary { text-align:center; min-height:auto; padding:14px; }
@media (min-width: 700px) { body { padding:24px; } .phone { min-height:calc(100vh - 48px); border:1px solid var(--line); border-radius:34px; box-shadow:var(--shadow); } }
```

- [ ] **Step 4: Manually verify the static shell**

Run: `python -m http.server 4173 --directory prototype`

Open: `http://localhost:4173`

Expected: an empty but styled page shell loads without console errors. Stop the server after checking.

- [ ] **Step 5: Record completion without a commit**

The workspace has no `.git` directory. Do not run `git commit`; record that the shell and asset load at the stated local URL.

### Task 3: Render the six interactive states and verify the mobile flow

**Files:**
- Create: `prototype/src/app.js`
- Modify: `prototype/index.html`
- Test: `tests/state.test.js`

**Interfaces:**
- Consumes: `createInitialState`, `reduce`, `#app`, `momo-window.svg` and CSS classes from prior tasks.
- Produces: click and input behavior for all approved prototype paths.

- [ ] **Step 1: Add rendering and event delegation**

Create `prototype/src/app.js`:

```js
import { createInitialState, reduce } from './state.js';

const app = document.querySelector('#app');
let state = createInitialState();

const topbar = () => `
  <header class="topbar"><button class="quiet" data-action="START_OVER" aria-label="回到开始">←</button><strong>留念余温</strong><button class="quiet" data-action="FINISH">随时暂停</button></header>`;

function startScreen() {
  const entries = ['日常', '相遇', '你们的关系', '一张照片'];
  return `<section class="screen"><p class="eyebrow">给沫沫留下一点点</p><h1>从一个你还记得的小细节开始。</h1><p>不用一次讲完，想从哪里开始都可以。</p><div class="choice-grid">${entries.map((entry) => `<button class="choice" data-action="SELECT_ENTRY" data-entry="${entry}">${entry}</button>`).join('')}</div><p class="privacy">⌁ 默认私密 · 随时可以暂停</p></section>`;
}

function photoScreen() {
  return `<section class="screen"><p class="eyebrow">从一张照片开始</p><div class="photo-card"><img src="./assets/momo-window.svg" alt="沫沫在窗边晒太阳的示例照片"><span class="sample-label">示例照片</span></div><h2 class="question">这张照片里的沫沫，正在做什么？</h2><textarea class="answer" id="answer" placeholder="想到一点点也可以写下来">${state.answer}</textarea><button class="primary" data-action="CONTINUE">继续</button><div class="action-row"><button class="text-action" data-action="OPEN_AIDS">想不起来</button><button class="text-action" data-action="OPEN_AIDS">换一个问题</button><button class="text-action" data-action="OPEN_AIDS">暂时跳过</button></div></section>`;
}

function aidsScreen() {
  const aids = ['从声音开始', '从动作开始', '从常待的地方开始', '看看其他照片'];
  return `<section class="screen"><h1>没关系，不需要现在想起来。</h1><p>我们可以换一个更轻的入口，或者先停在这里。</p><div class="aid-list">${aids.map((aid) => `<button class="aid" data-action="SELECT_AID" data-aid="${aid}">${aid}</button>`).join('')}</div><button class="finish" data-action="FINISH">今天就到这里</button></section>`;
}

function followupScreen() {
  const prompt = state.aid ? `你想从“${state.aid}”开始，也可以只留下一句话。` : '还有什么小习惯，是你一想到就会认出它的？';
  return `<section class="screen"><p class="eyebrow">想到一点点就够了</p><h2>${prompt}</h2><button class="answer-chip" data-action="USE_SAMPLE">它总喜欢在午后晒太阳。</button><textarea class="answer" id="answer" placeholder="也可以写下自己的测试回答">${state.answer}</textarea><div class="action-row"><button class="text-action" data-action="SKIP_FOLLOWUP">跳过这个问题</button><button class="text-action" data-action="FINISH">今天先到这里</button></div></section>`;
}

function draftScreen() {
  const first = state.answer.trim() || '沫沫喜欢在午后去窗边晒太阳。';
  return `<section class="screen"><p class="eyebrow">根据刚才的内容整理，仍可修改。</p><div class="draft"><small>日常片段</small><h2>窗边的中午</h2><p>${first}</p></div><div class="draft"><small>小习惯</small><h2>阳光落下来时</h2><p>阳光落下来时，它常常安静地待在那里。</p></div><button class="text-action" data-action="OPEN_AIDS">修改原话</button><button class="primary" data-action="SAVE_DRAFT">保存这两段</button><button class="finish" data-action="FINISH">今天先到这里</button></section>`;
}

function savedScreen() {
  const cards = state.savedItems.map((item) => `<article class="memory-card"><small>${item.label}</small><h3>${item.title}</h3><p>${item.body}</p></article>`).join('') || '<p>今天可以先停在这里。你随时都可以再回来看看。</p>';
  return `<section class="screen"><p class="eyebrow">沫沫的记忆</p><h1>${state.savedItems.length ? '今天留下了两段记忆。' : '今天就到这里。'}</h1>${cards}<div class="saved-actions"><button class="secondary" data-action="START_OVER">再记一段</button><button class="secondary" data-action="FINISH">以后再继续</button><button class="secondary" data-action="FINISH">今天就到这里</button></div></section>`;
}

function render() {
  const screens = { start: startScreen, photo: photoScreen, aids: aidsScreen, followup: followupScreen, draft: draftScreen, saved: savedScreen };
  app.innerHTML = `<div class="phone">${topbar()}${screens[state.screen]()}</div>`;
}

function dispatch(action) {
  if (action.type === 'USE_SAMPLE') action = { type: 'SET_ANSWER', answer: '它总喜欢在午后晒太阳。' };
  const input = document.querySelector('#answer');
  if (input && ['CONTINUE', 'OPEN_AIDS', 'SKIP_FOLLOWUP', 'FINISH'].includes(action.type)) state = { ...state, answer: input.value };
  if (action.type === 'CONTINUE') action = { type: 'SET_ANSWER', answer: state.answer };
  state = reduce(state, action);
  render();
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  dispatch({ type: button.dataset.action, entry: button.dataset.entry, aid: button.dataset.aid });
});

render();
```

- [ ] **Step 2: Run the automated state suite**

Run: `npm test`

Expected: four passing tests and zero failures.

- [ ] **Step 3: Perform the manual mobile flow check**

Run: `python -m http.server 4173 --directory prototype`

Open `http://localhost:4173` using a mobile viewport or phone browser and complete these exact checks:

1. Select each of the four entries and verify that each reaches the photo question.
2. Select `想不起来`, choose `从声音开始`, use the sample answer, skip the follow-up, and verify the draft is not shown as saved before tapping `保存这两段`.
3. Return to the photo question, select `想不起来`, then `今天就到这里`, and verify no guilt, task, reminder, login, or data collection message appears.
4. Save the draft and verify two memory cards appear alongside `再记一段`、`以后再继续` and `今天就到这里`.
5. Refresh the browser and verify the prototype restarts with no saved data.

Expected: every action is touch-friendly, the complete loop works without a computer, and refresh removes demo state.

- [ ] **Step 4: Record completion without a commit**

The workspace has no `.git` directory. Do not run `git commit`; report the automated test result and all five manual validation checks in the handoff.

## Plan Self-Review

### Spec coverage

- Six approved states are implemented by Task 3.
- Fictional `沫沫` content and the explicit sample-photo label are implemented by Task 2 and Task 3.
- Local-only/no-account/no-upload/no-AI scope is protected by the static architecture and global constraints.
- Low-pressure exits, the “想不起来” branch, editable draft, and non-automatic save are covered by Task 1 tests and Task 3 rendering.
- Guided interview script and feedback recording remain in the approved design spec because they are research operations, not prototype code.

### Placeholder scan

No incomplete requirements or deferred implementation steps are present in this plan.

### Type consistency

The action names used by `prototype/src/app.js` match `prototype/src/state.js`: `SELECT_ENTRY`, `OPEN_AIDS`, `SELECT_AID`, `SET_ANSWER`, `SKIP_FOLLOWUP`, `SAVE_DRAFT`, `FINISH`, and `START_OVER`.
