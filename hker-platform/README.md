# HKER 平台

這是一個**完整、可直接部署**的 Next.js 專案（首頁、遊戲頁、登入頁都已經接好），
不再只是零散的補充檔案。如果你之前把上一版 zip 單獨部署導致 404，
原因是那版沒有 `package.json` 和首頁——這版已經補齊。

## ⚠️ 第一步，一定要先做

你之前一份文件裡明文貼了 Supabase Secret Key、Gemini API Key、NewsAPI Key。
這些金鑰已經曝光在文字檔裡，等同外洩。**在做任何其他事情之前**：

1. 到 Supabase 專案 → Settings → API，重新產生（rotate）`service_role` key
2. 到 Google AI Studio，刪除舊的 Gemini API key，建立新的
3. 到 NewsAPI 後台，重新產生 API key
4. 把新金鑰填進 `.env.local`（本機）與 Vercel 的 Environment Variables（正式環境），絕對不要再貼進任何聊天訊息或文件

本套件裡的所有程式碼都改成從環境變數讀取金鑰，沒有任何一處寫死真實金鑰。


## 這個套件解決了什麼

| 需求 | 對應檔案 |
|---|---|
| 1) 遊戲功能 | `public/games/*.html`（老虎機、小瑪莉、輪盤、魚蝦蟹，已改為純娛樂單機版，不掛帳號/代幣），入口在 `/games` 頁面 |
| 2) 會員登入後資料遺失 | `lib/supabase/client.ts`、`lib/supabase/server.ts`、`middleware.ts`、`app/login/page.tsx` |
| 3) 手機/網站資料不同步 | 同上 + `sql/schema.sql`（所有裝置讀寫同一份 Supabase 資料，天然同步） |
| 4) 新聞即時性（≤2天） | `app/api/news-bot/route.ts` 的 `isWithinTwoDays()` |
| 5) 中英自動翻譯 | `app/api/news-bot/route.ts` 的 `translateText()`，前台切換見 `components/NewsCard.tsx` |
| 6) 分享/按讚 | `components/NewsShareLike.tsx` |
| 7) 背景音樂開關 | 每個遊戲 HTML 內建的 `🔊 音樂` 按鈕（Web Audio 自產音效，無版權疑慮） |
| 8) 管理後台（會員/積分/今日統計） | `components/AdminPanel.tsx` + `sql/schema.sql` 的 `daily_stats` |
| 9) 發文合規審查 | `app/api/news-bot/route.ts` 的 `containsSensitiveContent()` |
| 10) 管理員公告 | `components/AnnouncementBanner.tsx` |

## 安裝（本機測試用，非必要，也可以直接部署到 Vercel）

```bash
npm install
npm run dev
```

## 部署到 Vercel（完整步驟，這次就能看到真正的首頁）

1. 先在 Supabase SQL Editor 執行 `sql/schema.sql`，建立所有資料表、觸發器、權限規則
2. 到 Supabase → Authentication → Providers，確認 Email 登入方式已啟用
3. 到 Vercel，New Project → 選擇這個專案的 GitHub repo（或直接把整個資料夾拖進 Vercel 的部署介面）
4. 在 Vercel 專案 Settings → Environment Variables，設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEWS_API_KEY`
   - `GEMINI_API_KEY`
5. 部署。完成後打開網域，應該會看到首頁「最新新聞」（一開始會是空的，因為新聞機械人還沒跑過）
6. 到 `你的網域/login` 註冊一個帳號，再到 Supabase SQL Editor 執行：
   ```sql
   update public.profiles set is_admin = true where email = 'you@example.com';
   ```
   把這個帳號設成管理員，重新整理頁面後，右下角會出現「⚙ 管理後台」按鈕
7. 手動打開一次 `你的網域/api/news-bot` 測試新聞機械人是否正常運作，之後可以到 Vercel 的 Cron Jobs 設定定時執行（例如每小時一次）
8. `/games` 頁面可以看到 4 個小遊戲的入口

## 關於第 9 點：法律合規的重要提醒

`containsSensitiveContent()` 只是一個關鍵字警示機制，**不是法律判斷工具**。它的作用是把可能觸及香港《國家安全法》、《基本法》第23條等敏感內容的新聞攔下來，交給人工審查，而不是自動幫你判斷合法與否。

實際發文前，尤其涉及政治、國家安全、社會運動相關新聞，建議：
- 讓真人（最好有法律背景）審核 `flaggedForReview` 的新聞再決定是否發佈
- 不要只靠這組關鍵字清單就完全自動化發文，清單本身不可能涵蓋所有風險內容
- 如果平台會大量、持續發佈新聞內容，建議諮詢熟悉香港/英國/中國三地法律的律師，確認你的內容審查流程是否足夠

## 關於遊戲：目前的設計

四個遊戲都已改為「單機、不記錄、不累計、重新整理歸零」的純娛樂版本，畫面上的分數不具真實價值、不可兌換、不與任何會員帳戶或 HKER 代幣連動。這是為了避免平台落入未經牌照的線上博彩範疇（可能觸犯香港《賭博條例》、英國 Gambling Act 等）。

如果之後想加入「積分可累積在會員帳戶」的功能，切記：積分**不可**兌換代幣、不可提現、不可用來換取任何有真實市場價值的東西，否則會重新觸及博彩相關法律風險。
