# Smart Flashcard App / 智慧單字卡應用

A browser-based flashcard learning tool with spaced repetition and quiz features.  
基於瀏覽器的單字學習工具，具有間隔重複和測驗功能。

## Features / 功能
- Review Mode: Flip cards to learn vocabulary  
  溫習模式：翻轉卡片學習單字
- Quiz Mode: Test your knowledge with randomized questions  
  測驗模式：隨機題目測試你的知識
- PWA Support: Works offline after first load  
  PWA支持：首次載入後可離線使用
- CSV Data: Load vocabulary from external CSV file  
  CSV資料：從外部CSV檔案載入單字庫

## Usage / 使用方式
1. Clone this repository  
   克隆此存儲庫
2. Install dependencies: `npm install`  
   安裝依賴：`npm install`
3. Start dev server: `npx serve`  
   啟動開發伺服器：`npx serve`
4. Open in browser: `http://localhost:3000`  
   在瀏覽器中打開：`http://localhost:3000`

## Technical Specifications / 技術規格
- HTML5, CSS3, Vanilla JavaScript  
- Service Worker for offline functionality  
  Service Worker實現離線功能
- Responsive design works on mobile/desktop  
  響應式設計適用於手機/桌面

## Development / 開發
- Main app logic: `js/app.js`  
  主應用邏輯：`js/app.js`
- Service Worker: `sw.js`  
- Styling: `css/style.css`  
  樣式表：`css/style.css`
- Vocabulary data: `vocab.csv`  
  單字資料：`vocab.csv`
