import { useEffect, useRef } from "react";
import type { Message } from "../lib/api";

export default function MessageList({
  messages,
  sending,
  pending,
}: {
  messages: Message[];
  sending: boolean;
  pending: string;
}) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);
  return (
    <div
      className="messages"
      role="log"
      aria-label="メッセージ一覧"
      aria-live="polite"
    >
      {messages.map((m) => (
        <article className={`message ${m.role}`} key={m.id}>
          <div className="message-label">
            {m.role === "user" ? "あなた" : "✳ Chatbot"}
          </div>
          <div className="message-content">{m.content}</div>
        </article>
      ))}
      {sending && (
        <>
          <article className="message user">
            <div className="message-label">あなた</div>
            <div className="message-content">{pending}</div>
          </article>
          <div className="thinking" role="status">
            <span className="pulse" />
            回答を考えています…
          </div>
        </>
      )}
      <div ref={end} />
    </div>
  );
}
