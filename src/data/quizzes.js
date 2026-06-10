// ─── Quiz Data ────────────────────────────────────────────────────────────────
// 每個 quiz 綁定一張鎖定卡片。答對即解鎖。
// teaser: 百科鎖定狀態下，模糊圖示下方的簡短說明（不透露卡名）
// recommendedReading: 答錯後的推薦閱讀

export const QUIZZES = [
  {
    id: 'quiz_001',
    cardId: 'card_006', // 矽光子互連
    title: '答題解鎖：矽光子技術',
    teaser: '這項技術讓晶片以光子傳輸資料，突破傳統電子通訊的頻寬瓶頸，是下一代高速運算的核心關鍵。',
    scenario: '矽光子互連技術使用什麼介質傳輸資料，因此能突破傳統電子傳輸的頻寬限制？',
    options: [
      { label: 'A', text: '光子（光）', correct: true },
      { label: 'B', text: '電子（電流）', correct: false },
      { label: 'C', text: '無線電波', correct: false },
    ],
    successMessage: '正確！矽光子以光取代電訊號，大幅提升頻寬並降低延遲。',
    failMessage: '再想想！矽光子的核心突破是傳輸介質的改變。',
    reward: '矽光子互連 解鎖！',
    recommendedReading: {
      title: 'AI 晶片供應鏈重組',
      newsId: 'news_p001',
      url: 'https://www.digitimes.com.tw/',
    },
  },
  {
    id: 'quiz_002',
    cardId: 'card_008', // 邊緣推論模組（新聞專有名詞入口）
    title: '解鎖挑戰：邊緣運算',
    teaser: '當工廠攝影機需要毫秒內判斷瑕疵品，卻不能等雲端回應——這張卡代表的技術正是解決方案。',
    scenario:
      '工廠內的 AI 攝影機需要即時偵測瑕疵品，卻不能等待雲端回傳結果。以下哪種技術最適合解決此問題？',
    options: [
      { label: 'A', text: '邊緣推論 — 在本地裝置執行 AI 模型', correct: true },
      { label: 'B', text: '雲端批次處理 — 累積資料後上傳分析', correct: false },
      { label: 'C', text: '人工抽查 — 定期人工檢驗產品', correct: false },
    ],
    successMessage: '正確！邊緣推論讓 AI 在終端裝置本地運算，毫秒回應無需連網。',
    failMessage: '再想想！關鍵是「即時」且「不依賴雲端」。',
    reward: '邊緣推論模組 解鎖！',
    recommendedReading: {
      title: '2026 無人載具技術趨勢',
      newsId: 'news_001',
      url: 'https://www.digitimes.com.tw/',
    },
  },
]
