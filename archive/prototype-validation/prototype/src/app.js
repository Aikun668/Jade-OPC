import { ROUTES, createInitialState, reduce } from './state.js';

const app = document.querySelector('#app');
let state = createInitialState();

function topbar({ back = false, pause = false } = {}) {
  return `<header class="topbar">
    ${back ? '<button class="quiet" data-action="BACK_TO_ENTRIES">换个入口</button>' : '<span></span>'}
    <strong>留念余温</strong>
    ${pause ? '<button class="quiet" data-action="FINISH">回到记忆空间</button>' : '<span></span>'}
  </header>`;
}

function introScreen() {
  return `<section class="intro screen">
    <p class="eyebrow">宠物记忆空间</p>
    <h1>留住那些你不想忘记的小事。</h1>
    <p class="intro-copy">给已经离开一段时间的 Ta，留一个私密的记忆空间。不必急着说告别，只从一张照片、第一次相遇，或一个普通日常开始。</p>
    <button class="primary" data-action="START_DEMO">开始体验</button>
    <p class="trust-note">无需账号 · 照片只在当前设备临时展示，不会上传或保存</p>
  </section>`;
}

function entriesScreen() {
  return `<section class="screen">
    <p class="eyebrow">从自己愿意的地方开始</p>
    <h1>今天想从哪里开始？</h1>
    <p>不同的开始方式，会带你想起不同的片段。</p>
    <div class="entry-grid">${Object.entries(ROUTES).map(([key, route]) => `
      <button class="entry-card" data-action="SELECT_ROUTE" data-route="${key}">
        <span class="entry-title">${route.label}</span><span class="entry-description">${route.description}</span>
      </button>`).join('')}</div>
    <div class="entry-footer"><button class="text-action" data-action="RETURN_TO_INTRO">先不体验了</button><button class="text-action" data-action="OPEN_HOME">我的记忆</button></div>
  </section>`;
}

function disclosureScreen() {
  const route = ROUTES[state.route];
  const photoNote = state.route === 'photo'
    ? '你可以从设备里选一张 Ta 的照片。照片只会临时显示在当前页面，不会上传或保存。'
    : '接下来只需要想起一点点你和 Ta 的真实记忆，不必讲完整个故事。';
  return `<section class="screen disclosure">
    <p class="eyebrow">${route.label}</p>
    <h1>从 Ta 的一个片段开始。</h1>
    <p>${photoNote}</p>
    <button class="primary" data-action="CONTINUE_DEMO">从这里开始</button>
    <button class="text-action solo" data-action="BACK_TO_ENTRIES">换一种开始方式</button>
  </section>`;
}

function photoPickerScreen() {
  return `<section class="screen">
    <p class="eyebrow">本地临时体验</p>
    <h1>从 Ta 的一张照片开始。</h1>
    <p>选中的照片只会在当前设备临时显示，用来帮你打开一段回忆；不会上传，也不会保存。</p>
    <div class="local-photo-picker">
      <input class="photo-input" id="photo-input" type="file" accept="image/*">
      <label class="upload-choice" for="photo-input"><span>从手机相册选一张</span><small>照片只在当前体验中使用</small></label>
    </div>
    <div class="action-row"><button class="text-action" data-action="OPEN_AIDS">先换一个轻一点的入口</button><button class="text-action" data-action="FINISH">今天就到这里</button></div>
  </section>`;
}

function promptScreen() {
  const selected = state.selectedPhoto;
  return `<section class="screen">
    <p class="eyebrow">本地临时体验 · 不会上传或保存</p>
    ${selected ? `<div class="selected-photo"><img src="${selected.previewUrl}" alt="你刚刚选择的照片"><span>${selected.name} · 仅在当前设备临时显示</span></div><button class="text-action" data-action="CLEAR_LOCAL_PHOTO">换一张照片</button>` : ''}
    <h2 class="question">${state.currentPrompt}</h2>
    <textarea class="answer" id="answer" placeholder="想到一点点也可以写下来">${state.answer}</textarea>
    <button class="primary" data-action="SAVE_CURRENT">先留下这段记忆</button>
    <div class="action-row"><button class="text-action" data-action="OPEN_AIDS">想不起来</button><button class="text-action" data-action="BACK_TO_ENTRIES">换一个入口</button><button class="text-action" data-action="FINISH">今天就到这里</button></div>
  </section>`;
}

function aidsScreen() {
  const aids = [
    ['sound', '从声音开始'],
    ['action', '从动作开始'],
    ['place', '从常待的地方开始'],
    ['photos', '换一张照片']
  ];
  return `<section class="screen">
    <h1>没关系，不需要现在想起来。</h1>
    <p>我们可以换一个更轻的入口，或者先停在这里。</p>
    <div class="aid-list">${aids.map(([key, label]) => `<button class="aid" data-action="SELECT_AID" data-aid="${key}">${label}</button>`).join('')}</div>
    <button class="secondary wide" data-action="FINISH">今天就到这里</button>
  </section>`;
}

function homeScreen() {
  const hasMemories = state.savedItems.length > 0;
  const cards = state.savedItems.map((item) => `<article class="memory-card">${item.photo ? `<img class="memory-card-photo" src="${item.photo.previewUrl}" alt="${item.photo.name}">` : ''}<small>${item.label}</small><h2>${item.title}</h2><p>${item.body}</p></article>`).join('');
  return `<section class="screen memory-home">
    <p class="eyebrow">记忆空间</p>
    <h1>${hasMemories ? '刚刚留下的记忆。' : '今天可以先停在这里。'}</h1>
    ${hasMemories ? `<p>这些片段会一直留在这里，想看的时候再回来看看。</p>${cards}` : '<p>这里会慢慢留住 Ta 的片段。想开始时，再从自己愿意的地方开始。</p>'}
    <button class="primary" data-action="START_NEW_MEMORY">再留一段</button>
    <p class="trust-note">本次内容只在当前浏览器会话中可见</p>
  </section>`;
}

function render() {
  const screens = { intro: introScreen, entries: entriesScreen, disclosure: disclosureScreen, photoPicker: photoPickerScreen, prompt: promptScreen, aids: aidsScreen, home: homeScreen };
  const active = ['photoPicker', 'prompt', 'aids'].includes(state.screen);
  app.innerHTML = `<div class="phone">${topbar({ back: ['disclosure', 'photoPicker', 'prompt', 'aids'].includes(state.screen), pause: active })}${screens[state.screen]()}</div>`;
}

function dispatch(action) {
  const input = document.querySelector('#answer');
  if (input && ['SAVE_CURRENT', 'OPEN_AIDS', 'FINISH'].includes(action.type)) state = { ...state, answer: input.value };
  const preservesPhoto = ['SAVE_CURRENT', 'FINISH'].includes(action.type) && state.answer.trim().length > 0;
  if (['CLEAR_LOCAL_PHOTO', 'BACK_TO_ENTRIES', 'FINISH', 'RETURN_TO_INTRO', 'START_NEW_MEMORY'].includes(action.type) && !preservesPhoto) releaseSelectedPhoto();
  state = reduce(state, action);
  render();
}

function releaseSelectedPhoto() {
  const previewUrl = state.selectedPhoto?.previewUrl;
  const savedPhoto = state.savedItems.some((item) => item.photo?.previewUrl === previewUrl);
  if (previewUrl?.startsWith('blob:') && !savedPhoto) URL.revokeObjectURL(previewUrl);
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  dispatch({ type: button.dataset.action, route: button.dataset.route, photo: button.dataset.photo, aid: button.dataset.aid });
});

app.addEventListener('change', (event) => {
  const input = event.target;
  if (input.id !== 'photo-input' || !input.files?.[0]) return;
  releaseSelectedPhoto();
  const photo = input.files[0];
  dispatch({ type: 'SELECT_LOCAL_PHOTO', photo: { name: photo.name, previewUrl: URL.createObjectURL(photo) } });
});

render();
