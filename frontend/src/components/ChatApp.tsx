"use client";
import { useEffect, useState } from "react";
import { api, type Conversation, type Detail } from "../lib/api";
import Sidebar from "./Sidebar";
import MessageList from "./MessageList";
import Composer from "./Composer";

export default function ChatApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [current, setCurrent] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(true);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setBusy(true);
      setError("");
      try {
        const list = await api<Conversation[]>("/conversations");
        const saved = Number(localStorage.getItem("conversation"));
        const id = list.find((c) => c.id === saved)?.id ?? list[0]?.id;
        const detail = id ? await api<Detail>(`/conversations/${id}`) : null;
        if (!cancelled) {
          setConversations(list);
          setCurrent(detail);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [retry]);
  async function select(id: number) {
    setBusy(true);
    setError("");
    try {
      setCurrent(await api<Detail>(`/conversations/${id}`));
      setDraft("");
      localStorage.setItem("conversation", String(id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function create() {
    setBusy(true);
    setError("");
    try {
      const c = await api<Detail>("/conversations", {
        method: "POST",
        body: "{}",
      });
      setCurrent(c);
      setDraft("");
      setConversations((list) => [c, ...list]);
      localStorage.setItem("conversation", String(c.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: number) {
    if (!window.confirm("この会話とメッセージを削除しますか？")) return;
    setBusy(true);
    setError("");
    try {
      await api<void>(`/conversations/${id}`, { method: "DELETE" });
      setConversations((list) => list.filter((c) => c.id !== id));
      if (current?.id === id) {
        setCurrent(null);
        localStorage.removeItem("conversation");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function send(text: string) {
    setBusy(true);
    setSending(true);
    setPending(text);
    setError("");
    try {
      let c = current;
      if (!c) {
        c = await api<Detail>("/conversations", { method: "POST", body: "{}" });
        setCurrent(c);
        setConversations((list) => [c!, ...list]);
        localStorage.setItem("conversation", String(c.id));
      }
      const updated = await api<Detail>(`/conversations/${c.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: text }),
      });
      setCurrent(updated);
      setConversations((list) => [
        updated,
        ...list.filter((item) => item.id !== updated.id),
      ]);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
      setSending(false);
      setPending("");
    }
  }
  return (
    <div className="app-shell">
      <Sidebar
        conversations={conversations}
        selected={current?.id ?? null}
        busy={busy}
        onNew={() => void create()}
        onSelect={(id) => void select(id)}
        onDelete={(id) => void remove(id)}
      />
      <main className="chat-panel">
        <header>
          <span>
            Chatbot <span className="muted">/</span>{" "}
            <span className="header-title">
              {current?.title || "新しい会話"}
            </span>
          </span>
          <span className="local-badge">● ローカル保存</span>
        </header>
        <div className="chat-scroll">
          {!current?.messages.length && !sending ? (
            <div className="welcome">
              <div className="welcome-icon">✳</div>
              <p className="eyebrow">YOUR EVERYDAY THINKING PARTNER</p>
              <h1>今日は、何を話しましょう？</h1>
              <p className="muted">
                アイデアを広げる。疑問をほどく。
                <br />
                あなたの言葉から、会話をはじめましょう。
              </p>
              <div className="suggestions">
                <span>✧ アイデアを整理する</span>
                <span>⌘ コードを読み解く</span>
                <span>↗ 新しいことを学ぶ</span>
              </div>
            </div>
          ) : (
            <MessageList
              messages={current?.messages || []}
              sending={sending}
              pending={pending}
            />
          )}
        </div>
        <div className="input-area">
          {error && (
            <div className="error" role="alert">
              {error}
              <button onClick={() => setRetry((n) => n + 1)} disabled={busy}>
                再読み込み
              </button>
            </div>
          )}
          {busy && !sending && <p role="status">読み込み中…</p>}
          <Composer
            text={draft}
            setText={setDraft}
            disabled={busy}
            onSend={send}
          />
          <p className="disclaimer">
            AIの回答は正確とは限りません。重要な情報は確認してください。
          </p>
        </div>
      </main>
    </div>
  );
}
