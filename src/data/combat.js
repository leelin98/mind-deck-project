// ─── Combat Data ──────────────────────────────────────────────────────────────

export const NEWS_CARDS = [
  {
    id: 'news_001',
    date: '2026-06-07',
    title: '2026 無人載具技術趨勢',
    subtitle: '邊緣運算 × 感測融合 × 低軌衛星',
    topic: 'intelligence',
    difficulty: 20,
    tags: ['#AI應用', '#邊緣感知', '#自動駕駛'],
    source: 'DigiTimes 科技新聞',
    image: '/images/news/news_001.png',
    summary: '2026年，無人載具技術迎來多項突破，各大科技廠正加速布局這塊兆元市場。',
    body: '2026年，無人載具技術迎來多項突破，各大科技廠正加速布局這塊兆元市場。\n\n{{邊緣運算}}技術的成熟讓車輛得以在本地即時處理感測資料，毫秒內做出駕駛決策，無需仰賴雲端回傳，大幅降低了對網路連線的依賴性。本地 AI 推論的普及，意味著即使在訊號不穩的隧道或偏遠山區，車輛依然能保持完整的感知與決策能力。\n\n與此同時，低軌衛星星座持續擴充覆蓋範圍，為偏遠地區的自動駕駛車輛提供穩定的廣域連線支援。城市場景中，5G 專網以超低延遲的特性，確保車隊管理系統能夠即時協調數百輛無人載具。\n\n產業分析師預估，感測融合、路徑規劃與車間通訊三大技術的成熟，將在 2027 年前催生全球第一個完整的 L4 無人物流系統，市場規模可望突破 300 億美元。',
    highlightedTerm: {
      word: '邊緣運算',
      cardId: 'card_008',
    },
    antidoteKeyword: '邊緣運算',
    antidoteHint: '（提示：本地 AI 推論技術——「邊緣＿＿」）',
    antidoteUrl: 'https://www.digitimes.com.tw/',
  },
]

// 過往新聞（完整戰鬥資料）
export const PREV_NEWS = [
  {
    id: 'news_p001',
    date: '2026-06-06',
    title: 'AI 晶片供應鏈重組',
    subtitle: '台積電 × NVIDIA × HBM 需求爆發',
    topic: 'compute',
    difficulty: 18,
    tags: ['#硬體算力', '#半導體', '#AI晶片'],
    source: 'DigiTimes 科技新聞',
    image: '/images/news/news_p001.png',
    summary: 'NVIDIA H200 需求爆量，台積電三奈米產能全速運轉，HBM 記憶體供應鏈持續緊繃。',
    body: '2026年上半年，AI 晶片需求呈現爆發式成長，NVIDIA H200 GPU 訂單量超出市場預期三倍，整個半導體供應鏈進入前所未見的超級循環。\n\n{{高頻寬記憶體}}（HBM）成為最大的供應瓶頸。SK Hynix 與三星持續擴大產能，但製程良率提升速度仍追趕不上 AI 訓練的爆發性需求。CoWoS 先進封裝容量幾乎完全分配給 AI 加速器，台積電封測訂單能見度已延伸至 18 個月以上。\n\n台灣在這波浪潮中扮演核心角色。台積電三奈米製程幾乎全數供給 AI 加速器，日月光的先進封裝產能供不應求。業界分析師預估，這波超級循環至少持續到 2027 年底，半導體設備廠與材料廠同步受惠。',
    highlightedTerm: {
      word: '高頻寬記憶體',
      cardId: 'card_006',
    },
    antidoteKeyword: 'CoWoS',
    antidoteHint: '（提示：台積電先進封裝技術縮寫——「CoW＿＿」）',
    antidoteUrl: 'https://www.digitimes.com.tw/',
    completed: true,
  },
  {
    id: 'news_p002',
    date: '2026-06-05',
    title: '綠能數據中心革命',
    subtitle: '液冷散熱 × 碳追蹤 × 再生能源',
    topic: 'sustainability',
    difficulty: 22,
    tags: ['#永續架構', '#綠能', '#液冷'],
    source: 'DigiTimes 科技新聞',
    image: '/images/news/news_p002.png',
    summary: '各大科技廠加速部署液冷數據中心，台灣本土廠商切入全球綠色 IT 市場。',
    body: '隨著 AI 算力需求暴增，數據中心的電力消耗與散熱問題成為全球關注焦點。傳統氣冷架構已無法應對單機架超過 100kW 的功率密度，{{液冷散熱}}技術因此進入快速商業化階段。\n\n台灣廠商正把握機遇切入這波轉型。散熱模組廠商與冷媒管路設計廠積極與全球超大型雲端廠商洽談合作，部分廠商的接單能見度已延伸至 2028 年，訂單黃金期明確。\n\n在碳排放追蹤方面，企業級碳管理平台的需求同步飆升。ESG 報告合規壓力促使大型企業採購智慧型電表與碳足跡監控系統，形成另一波商機浪潮。液冷設施結合再生能源採購，成為新世代數據中心的標準配置。',
    highlightedTerm: null,
    antidoteKeyword: 'ESG',
    antidoteHint: '（提示：企業永續發展三字母縮寫——「＿＿＿」）',
    antidoteUrl: 'https://www.digitimes.com.tw/',
    completed: false,
  },
]

// 所有新聞合集（供 store 查找用）
export const ALL_NEWS = [...NEWS_CARDS, ...PREV_NEWS]

export const COMBAT_FORMULA = {
  basePoints: 20,
  matchBonus: 2.5,
  failThreshold: 0,
}

export const TOPIC_LABELS = {
  compute: '硬體算力',
  connect: '傳輸韌性',
  intelligence: 'AI 應用',
  sustainability: '永續架構',
}

export const TYPE_LABELS = {
  asset: '資產',
  tech: '技術',
  strategy: '策略',
  sponsor: '贊助',
}
