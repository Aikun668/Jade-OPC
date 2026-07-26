export const ROUTES = {
  daily: { label: '日常', description: '从 Ta 平时的一个小习惯开始', question: 'Ta 最喜欢待在家里的哪个地方？' },
  meeting: { label: '相遇', description: '回想第一次见到 Ta 的样子', question: '还记得第一次见到 Ta 时，Ta 是什么样子吗？' },
  relationship: { label: '你们的关系', description: '用一句话说说你们', question: '如果用一句话形容你和 Ta 的关系，会是什么？' },
  photo: { label: '一张照片', description: '让照片帮你打开一个片段', question: '看到这张照片时，你最先想起了什么？' }
};

export const AID_PROMPTS = {
  sound: '你还记得 Ta 发出过什么特别的声音吗？',
  action: 'Ta 开心、害怕或撒娇时，通常会做什么？',
  place: '家里哪个地方最容易让你想起 Ta？'
};

export function createInitialState() {
  return { screen: 'intro', route: null, answer: '', aid: null, currentPrompt: null, selectedPhoto: null, savedItems: [] };
}

function clearDraftState(state) {
  return { ...state, route: null, answer: '', aid: null, currentPrompt: null, selectedPhoto: null };
}

function saveCurrentMemory(state, answer = state.answer) {
  const body = answer.trim();
  if (!body) return { ...state, screen: 'home' };

  const item = {
    label: '留下的一句话',
    title: '刚刚想起的一点',
    body,
    photo: state.selectedPhoto
  };

  return { ...state, screen: 'home', answer: body, savedItems: [...state.savedItems, item] };
}

export function reduce(state, action) {
  switch (action.type) {
    case 'START_DEMO':
    case 'START_NEW_MEMORY':
      return { ...clearDraftState(state), screen: 'entries' };
    case 'SELECT_ROUTE':
      return { ...state, screen: 'disclosure', route: action.route, answer: '', aid: null, currentPrompt: null, selectedPhoto: null };
    case 'BACK_TO_ENTRIES':
      return { ...clearDraftState(state), screen: 'entries' };
    case 'OPEN_HOME':
      return { ...state, screen: 'home' };
    case 'CONTINUE_DEMO':
      return state.route === 'photo'
        ? { ...state, screen: 'photoPicker' }
        : { ...state, screen: 'prompt', currentPrompt: ROUTES[state.route].question };
    case 'SELECT_LOCAL_PHOTO':
      return { ...state, screen: 'prompt', selectedPhoto: action.photo, currentPrompt: ROUTES.photo.question };
    case 'CLEAR_LOCAL_PHOTO':
      return { ...state, screen: 'photoPicker', selectedPhoto: null, currentPrompt: null };
    case 'SAVE_CURRENT':
      return saveCurrentMemory(state, action.answer);
    case 'OPEN_AIDS':
      return { ...state, screen: 'aids' };
    case 'SELECT_AID':
      if (action.aid === 'photos') return { ...state, screen: 'photoPicker', aid: action.aid };
      return { ...state, screen: 'prompt', aid: action.aid, currentPrompt: AID_PROMPTS[action.aid] };
    case 'FINISH':
      return saveCurrentMemory(state, action.answer);
    case 'RETURN_TO_INTRO':
      return { ...clearDraftState(state), screen: 'intro' };
    default:
      return state;
  }
}
