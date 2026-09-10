import type { Conversation } from "../lib/api";

type Props = {
  conversations: Conversation[];
  selected: number | null;
  busy: boolean;
  onNew: () => void;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
};
export default function Sidebar({
  conversations,
  selected,
  busy,
  onNew,
  onSelect,
  onDelete,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">✳</span> Chatbot{" "}
        <span className="beta">WORKSPACE</span>
      </div>
      <button className="new-chat" onClick={onNew} disabled={busy}>
        <span>＋</span> 新しいチャット
      </button>
      <p className="section-label">会話履歴</p>
      <nav aria-label="会話一覧">
        {conversations.length === 0 && (
          <p className="muted small">会話はまだありません</p>
        )}
        {conversations.map((c) => (
          <div
            className={`conversation ${selected === c.id ? "selected" : ""}`}
            key={c.id}
          >
            <button
              className="conversation-select"
              disabled={busy}
              onClick={() => onSelect(c.id)}
              aria-current={selected === c.id ? "page" : undefined}
              title={c.title}
            >
              {c.title}
            </button>
            <button
              className="delete"
              disabled={busy}
              onClick={() => onDelete(c.id)}
              aria-label={`${c.title}を削除`}
            >
              ×
            </button>
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="avatar">U</span>
        <div>
          あなたのワークスペース<small>会話はこの端末に保存されます</small>
        </div>
      </div>
    </aside>
  );
}
