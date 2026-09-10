export type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};
export type Conversation = { id: number; title: string; updated_at: string };
export type Detail = Conversation & { messages: Message[] };
const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "サーバーに接続できません。バックエンドの起動を確認してください。",
    );
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : `リクエストに失敗しました (${response.status})`,
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
