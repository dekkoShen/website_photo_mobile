# dekko Shen — 手機版攝影網站

獨立重製自 `dekkoShen/website_photo` 的 `gh-pages` 分支。原 repo 未改動；新版沒有 `CNAME`，不使用已停用的自訂網域。

## 網站功能

- 手機預設單張大圖，桌面預設四張一組，並可切換。
- 保留 `2x2*24.2015` 原作二十四組與照片順序。
- 點圖放大，支援上一張、下一張、左右滑動及方向鍵。
- 圖片保留完整比例，手機導覽支援安全區域。
- 靜態 HTML、CSS、JavaScript，無建置依賴。

## 照片載入方式

所有作品、首頁、個人與聯絡頁的圖片，均在 HTML 直接使用原網站的 Google 圖片網址，由訪客的瀏覽器載入。全部二十四組、九十六張作品均保留在頁面，不再依伺服器端下載結果收起組別或標記照片遺失。

先前已取得的 26 張圖片保留為本地備份；瀏覽器載入原始連結失敗時，會自動嘗試對應的備份。`photo-manifest.json` 保留完整原始網址、順序、對應檔名，以及先前伺服器端下載的紀錄；下載紀錄不代表照片遭刪除。沒有用其他照片取代原作。

使用者已於 2026-10-08 確認新版網頁正常運作。本次程式檢查確認 HTML 使用原始照片網址。放大檢視提供「開啟原圖」，方便在新分頁直接開啟照片。

## 在新 GitHub repo 發布

此原始碼可放入新的 `website_photo_mobile` repo，原有的 `website_photo` 可保持原狀。

1. 建立新的 public repo，預設分支使用 `main`。
2. 將此目錄的 `dist/`、`.github/`、README 與照片清單提交到新 repo。
3. 在新 repo 的 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。
4. 執行 **Publish photography website** 工作流程，成功後使用 Pages 顯示的 `github.io` 免費網址。

部署工作流程位於 `.github/workflows/pages.yml`。不要設定 Custom domain，也不要新增 `CNAME`。樣式、程式與備份圖片使用相對路徑，支援 repo 的子路徑網址；原始照片使用完整外部網址。

GitHub 官方說明：
https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## 檢查結果與限制

JavaScript 語法、二十四組作品的順序、九十六張作品的原始網址對照、本地備份檔案參照與舊網域排除檢查已通過。此環境未另行執行瀏覽器畫面驗證；新版網頁已由使用者確認正常運作。GitHub Pages 可依上述步驟啟用。

網站另外具有一份獨立的預覽部署：
https://dekko-photo-mobile.dekko.chatgpt.site

## 權利

攝影作品與原站文字 © dekko Shen。此重製不更動作品的作者與內容。
