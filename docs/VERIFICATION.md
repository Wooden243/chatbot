# 実装・検証記録

実施日: 2026-09-11（日本時間）

## 完成した機能

- Next.js / React / TypeScript のダークテーマUI。サイドバー、会話一覧、会話選択、新規会話、削除確認、メッセージ一覧、入力、送信、読込・エラー表示。
- FastAPI の会話一覧・作成・詳細・削除・メッセージ送信API。
- SQLAlchemy の Conversation 1:N Message。SQLiteへの保存、起動時テーブル作成、外部キー、削除連動。
- OpenAI Python SDKによる履歴付き送信。キーはサーバー環境から読込み。認証・制限・タイムアウト・通信・空回答のエラー処理。
- AI成功時に2メッセージを同時保存し、失敗時は履歴を変更せず入力文を保持。
- 選択中の会話IDの復元、複数会話切替、ページ再読み込み後の履歴表示。

## 検証結果

| 検証 | 結果 |
| --- | --- |
| pytest | 14 passed |
| Python依存整合性 / pip check | No broken requirements found |
| npm run lint | 成功、警告なし |
| npm run typecheck | 成功 |
| npm run build | 成功、Next.js 16.3.4 |
| npm監査 | 既知の脆弱性0件 |
| Playwright正常系 | 1 passed |
| Playwrightキー未設定 | 1 passed |
| ブラウザーJavaScript例外 | 検出なし |
| PC 1280px / モバイル390px | スクリーンショット確認、横はみ出しなし |
| .env / DB / キャッシュのGit除外 | 確認済み |
| TODO / FIXME / APIキーパターン検査 | 対象ソース内に検出なし |
| Git操作 | status / diff / ls-files / check-ignoreのみ。add / commit / pushは未実行 |

バックエンドテストは会話CRUD、入力境界、履歴順序、会話分離、再接続後の永続化、メッセージ削除連動、404、CORS、キー未設定、AI失敗時の原子性、SDKへの引数、エラー内容の秘匿、空回答を確認。

PlaywrightはNext.js本番サーバーとFastAPIをポート3000/8000で起動。外部AIだけをテスト応答に差し替え、実APIと実SQLiteを使って新規会話、2往復送信、会話切替、reload後の履歴、削除を確認。キー未設定の別実行では実際の503エラーと初回送信の入力保持を確認。テストサーバーは終了済み。

## 未確認・制約

- OPENAI_API_KEYは未設定。実OpenAIへの課金を伴う通信、モデルアクセス権、実回答の品質は未確認。SDK呼出し・履歴・エラー変換はモックテスト済み。
- Starlette/AnyIO内部の非推奨API警告がpytestで1件発生するが、テスト失敗はなし。
- アプリはローカル単一ユーザー・単一worker用。認証、公開運用、ストリーミング、複数プロセス書込みは対象外。
- 依存導入の初回にpipがOS標準の一時ディレクトリを使用した。以降はTEMP/TMPもbackend/.tmpに指定。リポジトリ外の既存プロジェクトやOS設定は編集していない。

## 作業の節目

1. 既存のAGENTS.md・初回コミット・初期構成を確認。Gitメタデータ書込みを行わない方針を維持。
2. 制限で失敗していた依存取得を許可された実行で解決し、backend/.venvを作成。
3. DB・API・AI連携を実装し、SQLiteと外部AIを分離してテスト可能に構成。
4. コンポーネント分割したダークUIとAPIクライアントを実装。
5. 依存監査で発見した旧Next.jsの間接依存の問題を修正版へ更新して解消。
6. テスト環境の保存ディレクトリ不足、ブラウザーテストの要素指定の曖昧さを修正。初回送信時の入力保持も改善。
7. 自動テスト・ビルド・ブラウザー検証とREADMEを完成。

## 推奨コミット単位

ユーザーのPowerShellから、以下の順に分けることを推奨。

1. `.gitignore` と `backend/`: `feat: implement persistent chatbot API with OpenAI integration`
2. `frontend/`: `feat: add dark chat interface and end-to-end tests`
3. `README.md` と `docs/VERIFICATION.md`: `docs: document setup architecture and verification results`

`.env`、仮想環境、node_modules、SQLiteファイル、テスト生成物は含めない。コミット前にREADMEのテスト手順を再実行できる。
