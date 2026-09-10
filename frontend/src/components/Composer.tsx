export default function Composer({
  disabled,
  onSend,
  text,
  setText,
}: {
  disabled: boolean;
  onSend: (text: string) => Promise<boolean>;
  text: string;
  setText: (text: string) => void;
}) {
  async function submit() {
    if (!text.trim() || disabled) return;
    if (await onSend(text.trim())) setText("");
  }
  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label className="sr-only" htmlFor="prompt">
        メッセージ
      </label>
      <textarea
        id="prompt"
        value={text}
        disabled={disabled}
        maxLength={10000}
        rows={2}
        placeholder="何でも聞いてみてください"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !e.shiftKey &&
            !e.nativeEvent.isComposing &&
            e.keyCode !== 229
          ) {
            e.preventDefault();
            void submit();
          }
        }}
      />
      <div className="composer-bottom">
        <span>Shift + Enter で改行</span>
        <button
          className="send"
          type="submit"
          aria-label="送信"
          disabled={disabled || !text.trim()}
        >
          ↑
        </button>
      </div>
    </form>
  );
}
