import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DotsHorizontalIcon,
  ImageIcon,
  LockClosedIcon,
  Pencil2Icon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { KeyboardInput, KeyboardTextarea, MobileScroll, useKeyboard } from "./mobile";

const ASSET_ROOT = "/assets/pet-memory";

const screens = [
  "onboarding",
  "spaces",
  "space-create",
  "space-home",
  "record-entry",
  "record-text",
  "record-photo",
  "memories",
  "memory-detail",
  "memory-edit",
  "ai-draft",
  "space-settings",
  "privacy",
] as const;

type ScreenId = (typeof screens)[number];

const screenPaths: Record<ScreenId, string> = {
  onboarding: "/onboarding",
  spaces: "/spaces",
  "space-create": "/space-create",
  "space-home": "/space-home",
  "record-entry": "/record-entry",
  "record-text": "/record-text",
  "record-photo": "/record-photo",
  memories: "/memories",
  "memory-detail": "/memory-detail",
  "memory-edit": "/memory-edit",
  "ai-draft": "/ai-draft",
  "space-settings": "/space-settings",
  privacy: "/privacy",
};

function pathToScreen(pathname: string): ScreenId {
  const match = screens.find((screen) => screenPaths[screen] === pathname);
  return match ?? "space-home";
}

type Navigate = (screen: ScreenId, replace?: boolean) => void;

function AppHeader({
  title,
  onBack,
  action,
}: {
  title?: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <header className="app-header">
      <div className="header-side header-side--left">
        {onBack ? (
          <button className="icon-text-button" onClick={onBack} aria-label="返回">
            <ChevronLeftIcon />
            <span>返回</span>
          </button>
        ) : null}
      </div>
      {title ? <h1 className="header-title">{title}</h1> : <span />}
      <div className="header-side header-side--right">{action}</div>
    </header>
  );
}

function PrimaryButton({
  children,
  onClick,
  quiet = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  quiet?: boolean;
}) {
  return (
    <button className={quiet ? "primary-button primary-button--quiet" : "primary-button"} onClick={onClick}>
      {children}
    </button>
  );
}

function TextAction({
  children,
  onClick,
  danger = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button className={danger ? "text-action text-action--danger" : "text-action"} onClick={onClick}>
      {children}
    </button>
  );
}

function PageIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  return (
    <section className="page-intro">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </section>
  );
}

function DraftNotice({ onContinue }: { onContinue: () => void }) {
  return (
    <button className="draft-notice" onClick={onContinue}>
      <span>有一段还没写完的记录</span>
      <span className="draft-notice__action">
        继续写
        <ChevronRightIcon />
      </span>
    </button>
  );
}

function MemoryRow({
  image,
  text,
  date,
  onClick,
}: {
  image?: string;
  text: string;
  date: string;
  onClick: () => void;
}) {
  return (
    <button className="memory-row" onClick={onClick}>
      {image ? <img src={image} alt="" className="memory-row__image" draggable={false} /> : null}
      <span className="memory-row__body">
        <span className="memory-row__text">{text}</span>
        <span className="memory-row__date">{date}</span>
      </span>
      <ChevronRightIcon className="memory-row__chevron" />
    </button>
  );
}

function FormLabel({ children }: { children: ReactNode }) {
  return <label className="form-label">{children}</label>;
}

function PhotoTile({
  src,
  alt,
  large = false,
}: {
  src: string;
  alt: string;
  large?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={large ? "photo-tile photo-tile--large" : "photo-tile"}
      draggable={false}
    />
  );
}

function OnboardingScreen({ navigate }: { navigate: Navigate }) {
  return (
    <div className="page-shell page-shell--onboarding">
      <div className="onboarding-mark" aria-hidden="true">
        <span />
      </div>
      <PageIntro
        eyebrow="宠物记忆"
        title="给 Ta 留一个安静的位置"
        body="把想记住的样子、习惯和小事，慢慢留在这里。你可以只看看，也可以只写下一句话。"
      />
      <div className="onboarding-note">
        <LockClosedIcon />
        <p>这里默认只属于你。M0 只保存本地文字，照片仅用于这次预览。</p>
      </div>
      <div className="page-actions page-actions--bottom">
        <PrimaryButton onClick={() => navigate("space-create")}>开始</PrimaryButton>
        <TextAction onClick={() => navigate("privacy")}>先看看隐私说明</TextAction>
      </div>
    </div>
  );
}

function SpacesScreen({ navigate }: { navigate: Navigate }) {
  return (
    <div className="page-shell">
      <AppHeader
        title="我的记忆空间"
        action={
          <button className="icon-only-button" onClick={() => navigate("space-create")} aria-label="创建空间">
            <PlusIcon />
          </button>
        }
      />
      <section className="spaces-intro">
        <p>每一个 Ta，都有自己的位置。</p>
      </section>
      <div className="space-list">
        <button className="space-item" onClick={() => navigate("space-home")}>
          <PhotoTile src={`${ASSET_ROOT}/tuantuan-portrait.png`} alt="团团" />
          <span className="space-item__body">
            <strong>团团</strong>
            <span>那天下午，Ta 靠在窗边晒了很久的太阳。</span>
            <small>2026年7月22日</small>
          </span>
          <ChevronRightIcon />
        </button>
        <button className="space-item" onClick={() => navigate("space-home")}>
          <span className="space-placeholder">豆</span>
          <span className="space-item__body">
            <strong>豆豆</strong>
            <span>还没有留下记忆</span>
            <small>刚刚创建</small>
          </span>
          <ChevronRightIcon />
        </button>
      </div>
      <div className="page-actions page-actions--flow">
        <TextAction onClick={() => navigate("space-create")}>
          <PlusIcon />
          再为一位 Ta 创建空间
        </TextAction>
      </div>
    </div>
  );
}

function SpaceCreateScreen({ navigate }: { navigate: Navigate }) {
  const [name, setName] = useState("团团");
  return (
    <div className="page-shell">
      <AppHeader onBack={() => navigate("spaces")} />
      <PageIntro title="先写下 Ta 的名字" body="照片可以以后再补。名字是这里唯一需要先留下的内容。" />
      <div className="cover-picker">
        <PhotoTile src={`${ASSET_ROOT}/tuantuan-portrait.png`} alt="团团的空间照片" large />
        <button className="secondary-button">
          <ImageIcon />
          更换照片
        </button>
      </div>
      <div className="form-stack">
        <FormLabel>Ta 的名字</FormLabel>
        <KeyboardInput
          className="text-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="例如：团团"
          aria-label="Ta 的名字"
        />
        <p className="field-help">最多 20 个字。昵称、名字，或者你习惯的称呼都可以。</p>
      </div>
      <div className="page-actions page-actions--bottom">
        <PrimaryButton onClick={() => navigate("space-home")}>创建 Ta 的空间</PrimaryButton>
        <TextAction onClick={() => navigate("spaces")}>这次先不创建</TextAction>
      </div>
    </div>
  );
}

function SpaceHomeScreen({ navigate }: { navigate: Navigate }) {
  return (
    <div className="page-shell">
      <AppHeader
        onBack={() => navigate("spaces")}
        action={
          <button className="icon-only-button" onClick={() => navigate("space-settings")} aria-label="空间设置">
            <DotsHorizontalIcon />
          </button>
        }
      />
      <section className="pet-identity">
        <PhotoTile src={`${ASSET_ROOT}/tuantuan-portrait.png`} alt="团团" large />
        <h2>团团</h2>
      </section>
      <DraftNotice onContinue={() => navigate("record-text")} />
      <div className="home-primary-action">
        <PrimaryButton onClick={() => navigate("record-entry")}>留下一段新的记忆</PrimaryButton>
      </div>
      <section className="section-block">
        <div className="section-heading">
          <h3>最近留下</h3>
        </div>
        <MemoryRow
          image={`${ASSET_ROOT}/tuantuan-window.png`}
          text="那天下午，Ta 靠在窗边晒了很久的太阳。"
          date="2026年7月22日"
          onClick={() => navigate("memory-detail")}
        />
        <div className="center-action">
          <TextAction onClick={() => navigate("memories")}>
            查看全部记忆
            <ChevronRightIcon />
          </TextAction>
        </div>
      </section>
    </div>
  );
}

const entryCards = [
  { title: "日常", body: "从一个熟悉的小习惯开始", target: "record-text" as const },
  { title: "一张照片", body: "先留下照片，再决定要不要说点什么", target: "record-photo" as const },
  { title: "相遇", body: "想想你们第一次见面的样子", target: "record-text" as const },
  { title: "你们的关系", body: "用一句话，说说 Ta 对你的意义", target: "record-text" as const },
];

function RecordEntryScreen({ navigate }: { navigate: Navigate }) {
  return (
    <div className="page-shell">
      <AppHeader onBack={() => navigate("space-home")} />
      <PageIntro title="今天想从哪里开始？" body="不用全部完成。选一个此刻比较容易靠近的方向就好。" />
      <div className="entry-list">
        {entryCards.map((entry) => (
          <button className="entry-card" key={entry.title} onClick={() => navigate(entry.target)}>
            <span>
              <strong>{entry.title}</strong>
              <small>{entry.body}</small>
            </span>
            <ChevronRightIcon />
          </button>
        ))}
      </div>
      <div className="page-actions page-actions--flow">
        <TextAction onClick={() => navigate("space-home")}>这次先看看</TextAction>
      </div>
    </div>
  );
}

function RecordTextScreen({ navigate }: { navigate: Navigate }) {
  const [text, setText] = useState("Ta 平时最喜欢靠在窗边。下午有太阳的时候，会在那里安静地趴很久。");
  return (
    <div className="page-shell page-shell--editor">
      <AppHeader title="留下一段" onBack={() => navigate("record-entry")} />
      <section className="prompt-block">
        <p className="eyebrow">一个小问题</p>
        <h2>Ta 平时最喜欢待在哪个地方？</h2>
      </section>
      <div className="editor-panel">
        <KeyboardTextarea
          className="text-area"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="想到什么，就写下什么……"
          aria-label="记忆原话"
        />
        <button className="photo-add-action">
          <ImageIcon />
          加一张照片
        </button>
      </div>
      <div className="editor-help-row">
        <TextAction>有点想不起来</TextAction>
      </div>
      <div className="page-actions page-actions--bottom">
        <PrimaryButton onClick={() => navigate("memory-detail")}>留下这段原话</PrimaryButton>
        <TextAction onClick={() => navigate("space-home")}>先留在草稿里</TextAction>
      </div>
    </div>
  );
}

function RecordPhotoScreen({ navigate }: { navigate: Navigate }) {
  return (
    <div className="page-shell">
      <AppHeader title="一张照片" onBack={() => navigate("record-entry")} />
      <PageIntro title="先把这张照片留在这里" body="照片不需要说明。你也可以再写下一句看到它时最先想起的话。" />
      <div className="photo-preview">
        <img src={`${ASSET_ROOT}/tuantuan-sleeping.png`} alt="团团睡在沙发上" draggable={false} />
        <button className="photo-change-button">更换照片</button>
      </div>
      <div className="photo-choice-list">
        <button onClick={() => navigate("memory-detail")}>
          <span>
            <strong>先只留下照片</strong>
            <small>这已经是一段完整的记忆</small>
          </span>
          <ChevronRightIcon />
        </button>
        <button onClick={() => navigate("record-text")}>
          <span>
            <strong>说说最先想起的事</strong>
            <small>只问一个问题，不会自动追问</small>
          </span>
          <ChevronRightIcon />
        </button>
      </div>
      <p className="session-note">M0 中，这张照片只用于本次会话预览，不会被描述为已经永久保存。</p>
    </div>
  );
}

function MemoriesScreen({ navigate }: { navigate: Navigate }) {
  return (
    <div className="page-shell">
      <AppHeader title="全部记忆" onBack={() => navigate("space-home")} />
      <section className="archive-heading">
        <p>团团</p>
        <span>2 段记忆</span>
      </section>
      <div className="archive-list">
        <MemoryRow
          image={`${ASSET_ROOT}/tuantuan-window.png`}
          text="那天下午，Ta 靠在窗边晒了很久的太阳。"
          date="2026年7月22日"
          onClick={() => navigate("memory-detail")}
        />
        <MemoryRow
          image={`${ASSET_ROOT}/tuantuan-sleeping.png`}
          text="阳光落在沙发上，Ta 就安静地睡着了。"
          date="2026年7月18日"
          onClick={() => navigate("memory-detail")}
        />
      </div>
      <p className="archive-end">先留到这里。以后想起新的，再慢慢回来。</p>
    </div>
  );
}

function MemoryDetailScreen({ navigate }: { navigate: Navigate }) {
  return (
    <div className="page-shell page-shell--detail">
      <AppHeader
        onBack={() => navigate("space-home")}
        action={
          <button className="icon-only-button" onClick={() => navigate("memory-edit")} aria-label="编辑原话">
            <Pencil2Icon />
          </button>
        }
      />
      <p className="detail-date">2026年7月22日</p>
      <div className="detail-photo-stack">
        <img src={`${ASSET_ROOT}/tuantuan-window.png`} alt="团团靠在窗边" draggable={false} />
        <span>1 / 2</span>
      </div>
      <article className="original-memory">
        <p className="eyebrow">你留下的话</p>
        <p>那天下午，Ta 靠在窗边晒了很久的太阳。光落在毛上，看起来软软的。我坐在旁边，没有叫 Ta，只是一起安静地待了一会儿。</p>
      </article>
      <section className="ai-invitation">
        <p>如果你愿意，可以把这段原话整理成一个可编辑的候选版本。原话会一直保留。</p>
        <TextAction onClick={() => navigate("ai-draft")}>
          整理一个候选稿
          <ChevronRightIcon />
        </TextAction>
      </section>
      <div className="detail-actions">
        <TextAction onClick={() => navigate("memory-edit")}>
          <Pencil2Icon />
          编辑原话
        </TextAction>
        <TextAction danger>
          <TrashIcon />
          删除这段记忆
        </TextAction>
      </div>
    </div>
  );
}

function MemoryEditScreen({ navigate }: { navigate: Navigate }) {
  const [text, setText] = useState(
    "那天下午，Ta 靠在窗边晒了很久的太阳。光落在毛上，看起来软软的。我坐在旁边，没有叫 Ta，只是一起安静地待了一会儿。",
  );
  return (
    <div className="page-shell page-shell--editor">
      <AppHeader title="编辑原话" onBack={() => navigate("memory-detail")} />
      <p className="editing-note">这里只修改你留下的话。已经确认的 AI 候选稿不会自动覆盖或重新生成。</p>
      <KeyboardTextarea
        className="text-area text-area--large"
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-label="编辑记忆原话"
      />
      <div className="page-actions page-actions--bottom">
        <PrimaryButton onClick={() => navigate("memory-detail")}>保存修改</PrimaryButton>
        <TextAction onClick={() => navigate("memory-detail")}>这次先不改</TextAction>
      </div>
    </div>
  );
}

function AiDraftScreen({ navigate }: { navigate: Navigate }) {
  const [candidate, setCandidate] = useState(
    "那天下午，阳光落在团团柔软的毛上。我们没有做什么，只是安静地坐在窗边，把那一小段温暖留在了彼此身边。",
  );
  return (
    <div className="page-shell page-shell--editor">
      <AppHeader title="整理候选稿" onBack={() => navigate("memory-detail")} />
      <div className="ai-scope-note">
        <LockClosedIcon />
        <p>这次只处理当前这段原话。下面是可编辑候选稿，不会覆盖你的原话。</p>
      </div>
      <div className="candidate-label">
        <span>候选版本</span>
        <small>可以继续修改</small>
      </div>
      <KeyboardTextarea
        className="text-area text-area--candidate"
        value={candidate}
        onChange={(event) => setCandidate(event.target.value)}
        aria-label="AI 候选稿"
      />
      <div className="original-reference">
        <p className="eyebrow">原话仍然保留</p>
        <p>那天下午，Ta 靠在窗边晒了很久的太阳……</p>
      </div>
      <div className="page-actions page-actions--bottom">
        <PrimaryButton onClick={() => navigate("memory-detail")}>
          <CheckIcon />
          保存这个候选稿
        </PrimaryButton>
        <TextAction onClick={() => navigate("memory-detail")}>继续只用原话</TextAction>
      </div>
    </div>
  );
}

function SpaceSettingsScreen({ navigate }: { navigate: Navigate }) {
  const [name, setName] = useState("团团");
  return (
    <div className="page-shell">
      <AppHeader title="空间设置" onBack={() => navigate("space-home")} />
      <div className="settings-cover">
        <PhotoTile src={`${ASSET_ROOT}/tuantuan-portrait.png`} alt="团团" large />
        <div>
          <button className="secondary-button">
            <ImageIcon />
            更换照片
          </button>
          <TextAction>移除照片</TextAction>
        </div>
      </div>
      <div className="form-stack">
        <FormLabel>Ta 的名字</FormLabel>
        <KeyboardInput
          className="text-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="修改 Ta 的名字"
        />
        <PrimaryButton onClick={() => navigate("space-home")}>保存设置</PrimaryButton>
      </div>
      <section className="settings-section">
        <button className="settings-row" onClick={() => navigate("privacy")}>
          <span>
            <strong>隐私说明</strong>
            <small>本地数据、照片与 AI 的处理方式</small>
          </span>
          <ChevronRightIcon />
        </button>
      </section>
      <section className="danger-zone">
        <h3>删除这个空间</h3>
        <p>将同时删除团团的 2 段记忆、1 条草稿和关联照片，无法恢复。</p>
        <TextAction danger>
          <TrashIcon />
          删除团团的空间
        </TextAction>
      </section>
    </div>
  );
}

function PrivacyScreen({ navigate }: { navigate: Navigate }) {
  return (
    <div className="page-shell page-shell--reading">
      <AppHeader title="隐私说明" onBack={() => navigate("onboarding")} />
      <PageIntro title="你的记忆，默认只属于你" body="这份说明描述 M0 本地 Mock 阶段实际具备的能力，不提前承诺云端功能。" />
      <div className="privacy-sections">
        <section>
          <h3>文字保存在本地</h3>
          <p>M0 使用本机的本地 Mock 数据验证记录与回看流程，不接入微信登录和 CloudBase。</p>
        </section>
        <section>
          <h3>照片只用于会话预览</h3>
          <p>你选择的照片不会被描述为已经永久保存。重新启动后照片可能不可用，文字仍会保留。</p>
        </section>
        <section>
          <h3>AI 只提供候选稿</h3>
          <p>M0 使用固定 Mock 场景，不调用真实模型。以后接入真实 AI 时，也只处理你当次明确同意发送的内容。</p>
        </section>
        <section>
          <h3>删除不可恢复</h3>
          <p>删除记忆或空间前会明确说明范围。M0 暂不提供虚假的导出入口。</p>
        </section>
      </div>
      <div className="page-actions page-actions--flow">
        <PrimaryButton quiet onClick={() => navigate("onboarding")}>我知道了</PrimaryButton>
      </div>
    </div>
  );
}

function Screen({ screen, navigate }: { screen: ScreenId; navigate: Navigate }) {
  const component = useMemo(() => {
    switch (screen) {
      case "onboarding":
        return <OnboardingScreen navigate={navigate} />;
      case "spaces":
        return <SpacesScreen navigate={navigate} />;
      case "space-create":
        return <SpaceCreateScreen navigate={navigate} />;
      case "space-home":
        return <SpaceHomeScreen navigate={navigate} />;
      case "record-entry":
        return <RecordEntryScreen navigate={navigate} />;
      case "record-text":
        return <RecordTextScreen navigate={navigate} />;
      case "record-photo":
        return <RecordPhotoScreen navigate={navigate} />;
      case "memories":
        return <MemoriesScreen navigate={navigate} />;
      case "memory-detail":
        return <MemoryDetailScreen navigate={navigate} />;
      case "memory-edit":
        return <MemoryEditScreen navigate={navigate} />;
      case "ai-draft":
        return <AiDraftScreen navigate={navigate} />;
      case "space-settings":
        return <SpaceSettingsScreen navigate={navigate} />;
      case "privacy":
        return <PrivacyScreen navigate={navigate} />;
    }
  }, [screen, navigate]);

  return component;
}

export default function Prototype() {
  const keyboard = useKeyboard();
  const [screen, setScreen] = useState<ScreenId>(() => pathToScreen(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => setScreen(pathToScreen(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate: Navigate = useCallback(
    (nextScreen, replace = false) => {
      keyboard.hide();
      const path = screenPaths[nextScreen];
      if (replace) {
        window.history.replaceState({}, "", path);
      } else {
        window.history.pushState({}, "", path);
      }
      setScreen(nextScreen);
    },
    [keyboard],
  );

  return (
    <MobileScroll className="app-screen" key={screen}>
      <main className="screen-content" data-screen={screen}>
        <Screen screen={screen} navigate={navigate} />
      </main>
    </MobileScroll>
  );
}
