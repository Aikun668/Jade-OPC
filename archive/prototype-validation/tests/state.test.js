import test from 'node:test';
import assert from 'node:assert/strict';
import { AID_PROMPTS, ROUTES, createInitialState, reduce } from '../prototype/src/state.js';

test('starts with product context rather than a fictional pet', () => {
  const state = createInitialState();
  assert.equal(state.screen, 'intro');
  assert.equal(state.route, null);
});

test('opening the demo leads to four route choices', () => {
  const state = reduce(createInitialState(), { type: 'START_DEMO' });
  assert.equal(state.screen, 'entries');
  assert.deepEqual(Object.keys(ROUTES), ['daily', 'meeting', 'relationship', 'photo']);
});

test('memory access from the entry page opens home without clearing saved items', () => {
  const state = reduce(
    { ...createInitialState(), screen: 'entries', savedItems: [{ title: '刚刚想起的一点', body: 'Ta 喜欢靠着窗边。' }] },
    { type: 'OPEN_HOME' }
  );

  assert.equal(state.screen, 'home');
  assert.equal(state.savedItems.length, 1);
});

test('daily, meeting and relationship each reach their own text-first prompt', () => {
  for (const route of ['daily', 'meeting', 'relationship']) {
    let state = reduce(createInitialState(), { type: 'START_DEMO' });
    state = reduce(state, { type: 'SELECT_ROUTE', route });
    state = reduce(state, { type: 'CONTINUE_DEMO' });
    assert.equal(state.screen, 'prompt');
    assert.equal(state.route, route);
    assert.equal(state.selectedPhoto, null);
    assert.notEqual(ROUTES[route].question, ROUTES.photo.question);
    assert.match(ROUTES[route].question, /Ta/);
  }
});

test('photo is the only route that opens the local photo picker before its prompt', () => {
  let state = reduce(createInitialState(), { type: 'START_DEMO' });
  state = reduce(state, { type: 'SELECT_ROUTE', route: 'photo' });
  state = reduce(state, { type: 'CONTINUE_DEMO' });
  assert.equal(state.screen, 'photoPicker');

  state = reduce(state, {
    type: 'SELECT_LOCAL_PHOTO',
    photo: { name: 'ta-at-window.jpg', previewUrl: 'blob:ta-at-window' }
  });
  assert.equal(state.screen, 'prompt');
  assert.deepEqual(state.selectedPhoto, { name: 'ta-at-window.jpg', previewUrl: 'blob:ta-at-window' });
  assert.equal(state.currentPrompt, '看到这张照片时，你最先想起了什么？');
});

test('cannot remember opens memory aids and allows an immediate safe ending', () => {
  let prompt = reduce(createInitialState(), { type: 'START_DEMO' });
  prompt = reduce(prompt, { type: 'SELECT_ROUTE', route: 'daily' });
  prompt = reduce(prompt, { type: 'CONTINUE_DEMO' });
  const aids = reduce(prompt, { type: 'OPEN_AIDS' });
  const saved = reduce(aids, { type: 'FINISH' });

  assert.equal(aids.screen, 'aids');
  assert.equal(saved.screen, 'home');
  assert.deepEqual(saved.savedItems, []);
});

test('each lighter memory entrance changes the next prompt', () => {
  let state = reduce(createInitialState(), { type: 'START_DEMO' });
  state = reduce(state, { type: 'SELECT_ROUTE', route: 'daily' });
  state = reduce(state, { type: 'CONTINUE_DEMO' });
  state = reduce(state, { type: 'OPEN_AIDS' });
  state = reduce(state, { type: 'SELECT_AID', aid: 'sound' });

  assert.equal(state.screen, 'prompt');
  assert.equal(state.currentPrompt, AID_PROMPTS.sound);
  assert.notEqual(state.currentPrompt, ROUTES.daily.question);
});

test('other photos in the lighter-memory menu opens the local photo picker', () => {
  let state = reduce(createInitialState(), { type: 'START_DEMO' });
  state = reduce(state, { type: 'SELECT_ROUTE', route: 'daily' });
  state = reduce(state, { type: 'CONTINUE_DEMO' });
  state = reduce(state, { type: 'OPEN_AIDS' });
  state = reduce(state, { type: 'SELECT_AID', aid: 'photos' });

  assert.equal(state.screen, 'photoPicker');
});

test('clearing a local photo removes its temporary preview without leaving the picker', () => {
  let state = reduce(createInitialState(), { type: 'START_DEMO' });
  state = reduce(state, { type: 'SELECT_ROUTE', route: 'photo' });
  state = reduce(state, { type: 'CONTINUE_DEMO' });
  state = reduce(state, {
    type: 'SELECT_LOCAL_PHOTO',
    photo: { name: 'ta-sleeping.png', previewUrl: 'blob:ta-sleeping' }
  });
  state = reduce(state, { type: 'CLEAR_LOCAL_PHOTO' });

  assert.equal(state.screen, 'photoPicker');
  assert.equal(state.selectedPhoto, null);
});

test('saving a completed answer immediately creates one real memory item', () => {
  let state = reduce(createInitialState(), { type: 'START_DEMO' });
  state = reduce(state, { type: 'SELECT_ROUTE', route: 'daily' });
  state = reduce(state, { type: 'CONTINUE_DEMO' });
  state = reduce(state, { type: 'SAVE_CURRENT', answer: 'Ta 总喜欢在午后晒太阳。' });

  assert.equal(state.screen, 'home');
  assert.equal(state.savedItems.length, 1);
  assert.match(state.savedItems[0].body, /午后/);
});

test('ending with a typed answer saves that answer before opening memory home', () => {
  let state = reduce(createInitialState(), { type: 'START_DEMO' });
  state = reduce(state, { type: 'SELECT_ROUTE', route: 'daily' });
  state = reduce(state, { type: 'CONTINUE_DEMO' });
  state = reduce(state, { type: 'FINISH', answer: 'Ta 听见开罐头的声音就会跑来。' });

  assert.equal(state.screen, 'home');
  assert.equal(state.savedItems.length, 1);
  assert.equal(state.savedItems[0].body, 'Ta 听见开罐头的声音就会跑来。');
});

test('ending with no typed answer does not create an empty memory item', () => {
  const home = reduce(createInitialState(), { type: 'FINISH', answer: '   ' });

  assert.equal(home.screen, 'home');
  assert.deepEqual(home.savedItems, []);
});

test('a locally selected photo stays attached to the first saved memory in this session', () => {
  let state = reduce(createInitialState(), { type: 'START_DEMO' });
  state = reduce(state, { type: 'SELECT_ROUTE', route: 'photo' });
  state = reduce(state, { type: 'CONTINUE_DEMO' });
  state = reduce(state, {
    type: 'SELECT_LOCAL_PHOTO',
    photo: { name: 'ta-by-window.jpg', previewUrl: 'blob:ta-by-window' }
  });
  state = reduce(state, { type: 'SAVE_CURRENT', answer: 'Ta 总喜欢在午后靠着窗边睡觉。' });

  assert.deepEqual(state.savedItems[0].photo, { name: 'ta-by-window.jpg', previewUrl: 'blob:ta-by-window' });
});

test('memory home retains completed pieces when starting another memory', () => {
  let state = reduce(createInitialState(), { type: 'START_DEMO' });
  state = reduce(state, { type: 'SELECT_ROUTE', route: 'daily' });
  state = reduce(state, { type: 'CONTINUE_DEMO' });
  state = reduce(state, { type: 'SAVE_CURRENT', answer: 'Ta 会在窗边打盹。' });
  state = reduce(state, { type: 'START_NEW_MEMORY' });

  assert.equal(state.screen, 'entries');
  assert.equal(state.savedItems.length, 1);
});
