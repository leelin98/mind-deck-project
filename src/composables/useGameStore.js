import { reactive, computed } from "vue";
import { CARDS, SYNTHESIS_RECIPES } from "../data/cards.js";
import {
  ALL_NEWS,
  NEWS_CARDS,
  COMBAT_FORMULA,
  TOPIC_LABELS,
  TYPE_LABELS,
  PREV_NEWS,
  ARCHIVED_NEWS,
} from "../data/combat.js";
import { QUIZZES } from "../data/quizzes.js";

// ─── Singleton state ──────────────────────────────────────────────────────────
const state = reactive({
  // Player
  userId: "#066",
  points: 100,
  streak: 7,
  rank: 156,

  // Cards
  cards: CARDS.map((c) => ({ ...c })),

  // 今日新聞（清單頁標題用）
  todayNews: NEWS_CARDS[0],

  // 當前詳細頁新聞（可以是今日或過往）
  activeNews: NEWS_CARDS[0],

  // 新聞詳細頁模式（null = 清單頁，news.id = 詳細頁）
  newsDetailMode: null,

  // Selected slots for combat
  selectedSlots: [null, null, null],

  // Combat state
  combatPhase: "select", // 'select' | 'reveal' | 'result' | 'fail' | 'antidote'
  combatResult: null,

  // Antidote
  antidoteInput: "",
  antidoteError: false,

  // Term card modal（新聞專有名詞解鎖）
  termCardModal: null, // { card, quiz, phase: 'preview'|'quiz', answer: null }

  // Encyclopedia modal（百科查看 / 答題）
  // mode: 'unlock'（鎖定卡片答題解鎖）| 'review'（已解鎖複習）
  encyclopediaModal: null,

  // 答題冷卻時間（key: cardId, value: cooldown end timestamp ms）
  quizCooldowns: {},

  // Full card overlay（我的腦補包​​點擊查看）
  fullCardModal: null, // { card }

  // Synthesis
  synthesisFeedback: null,
  synthModal: null, // null | { recipeId, phase: 'select' | 'animate' }

  // 新聞鎖定（key: newsId, value: 解鎖時間 ms）
  newsLocks: {},
  // 贏得的新聞卡（預設收錄四五月歸檔新聞）
  earnedNewsCards: ARCHIVED_NEWS.map((n) => ({ ...n, earnedAt: 0 })),

  // 新聞卡預覽 Modal
  newsCardPreview: null, // { news }

  // 最後融合的卡片 ID（置頂顯示用）
  lastSynthesizedCardId: null,

  // Active view
  activeTab: "combat",

  // 積分兌換項目（靜態 placeholder）
  redeemItems: [
    { id: "r1", name: "VIP 媒體訂閱 3個月", cost: 500, icon: "📰" },
    { id: "r2", name: "論壇實體 VIP 門票", cost: 1000, icon: "🎫" },
    { id: "r3", name: "B2B 科技廠聯名周邊", cost: 800, icon: "🎁" },
  ],
});

// ─── Getters ──────────────────────────────────────────────────────────────────
const ownedCards = computed(() => state.cards.filter((c) => c.owned));

const selectedCards = computed(() =>
  state.selectedSlots.map((id) =>
    id ? state.cards.find((c) => c.id === id) : null,
  ),
);

const encyclopediaItems = computed(() =>
  state.cards.map((c) => ({
    ...c,
    quiz: QUIZZES.find((q) => q.cardId === c.id) || null,
  })),
);

// ─── Actions ──────────────────────────────────────────────────────────────────

function selectSlot(slotIndex, cardId) {
  const existingSlot = state.selectedSlots.indexOf(cardId);
  if (existingSlot !== -1 && existingSlot !== slotIndex) {
    state.selectedSlots[existingSlot] = null;
  }
  state.selectedSlots[slotIndex] = cardId;
}

function removeSlot(slotIndex) {
  state.selectedSlots[slotIndex] = null;
}

function lockNews(newsId) {
  state.newsLocks[newsId] = Date.now() + 3 * 60 * 60 * 1000;
}

function openNewsDetail(newsId) {
  const news = ALL_NEWS.find((n) => n.id === newsId);
  if (!news) return;
  state.activeNews = news;
  state.newsDetailMode = newsId;
  // 進入詳細頁時重置戰鬥
  state.selectedSlots = [null, null, null];
  state.combatPhase = "select";
  state.combatResult = null;
  state.antidoteInput = "";
  state.antidoteError = false;
}

function closeNewsDetail() {
  state.newsDetailMode = null;
  state.selectedSlots = [null, null, null];
  state.combatPhase = "select";
  state.combatResult = null;
  state.antidoteInput = "";
  state.antidoteError = false;
}

function startCombat() {
  if (state.selectedSlots.some((s) => s === null)) return;
  state.combatPhase = "reveal";

  const news = state.activeNews;
  const steps = [];
  let finalDelta = 0;
  const matched = [];

  steps.push({ label: "新聞難度", value: news.difficulty, sign: "" });

  state.selectedSlots.forEach((cardId, i) => {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;

    const topicMatch = card.strongTopic === news.topic;
    const multiplier = topicMatch ? COMBAT_FORMULA.matchBonus : 1;
    const delta = card.power * multiplier;
    finalDelta += delta;

    const step = {
      label: `卡片 ${i + 1}：${card.name}`,
      value: card.power,
      multiplier: multiplier > 1 ? multiplier : null,
      matchedTag: topicMatch ? `#${TOPIC_LABELS[news.topic]}` : null,
      bonusReason: topicMatch
        ? `${card.name} 屬「${TYPE_LABELS[card.type] || card.type}」類，擅長 ${TOPIC_LABELS[card.strongTopic]}，與本篇新聞主題高度契合`
        : null,
      sign: "",
    };
    steps.push(step);
    if (topicMatch) matched.push(card.name);
  });

  const pointsDelta = Math.round(Math.abs(finalDelta));
  const remainder = news.difficulty + finalDelta;

  state.combatResult = { steps, finalDelta, remainder, pointsDelta, matched };

  setTimeout(() => {
    if (remainder <= 0) {
      state.points += pointsDelta;
      state.combatPhase = "result";
      if (!state.earnedNewsCards.find((n) => n.id === state.activeNews.id)) {
        state.earnedNewsCards.push({
          ...state.activeNews,
          earnedAt: Date.now(),
        });
      }
      state.activeNews.completed = true;
    } else {
      lockNews(state.activeNews.id);
      state.combatPhase = "fail";
    }
  }, 3200);
}

function submitAntidote() {
  const keyword = state.antidoteInput.trim();
  if (keyword === state.activeNews?.antidoteKeyword) {
    const lockedRare = state.cards.find(
      (c) => !c.owned && !c.synthesized && !c.sponsor,
    );
    if (lockedRare) lockedRare.owned = true;
    state.points += 15;
    state.antidoteError = false;
    state.combatPhase = "result";
    state.combatResult = { ...state.combatResult, antidoteSuccess: true };
    if (!state.earnedNewsCards.find((n) => n.id === state.activeNews?.id)) {
      state.earnedNewsCards.push({ ...state.activeNews, earnedAt: Date.now() });
    }
    if (state.activeNews) state.activeNews.completed = true;
  } else {
    state.antidoteError = true;
  }
}

function resetCombat() {
  state.selectedSlots = [null, null, null];
  state.combatPhase = "select";
  state.combatResult = null;
  state.antidoteInput = "";
  state.antidoteError = false;
}

// 新聞文章專有名詞卡 modal → 直接開百科 modal
function openTermCard(word) {
  const term = state.activeNews?.highlightedTerm;
  if (!term || term.word !== word) return;
  openEncyclopediaCard(term.cardId);
}

function startTermQuiz() {
  if (state.termCardModal) state.termCardModal.phase = "quiz";
}

function answerTermCard(optionLabel) {
  if (!state.termCardModal) return;
  state.termCardModal.answer = optionLabel;
}

function submitTermCard() {
  if (!state.termCardModal?.answer) return;
  const correct = state.termCardModal.quiz?.options.find(
    (o) => o.label === state.termCardModal.answer,
  )?.correct;
  if (correct) {
    const card = state.cards.find((c) => c.id === state.termCardModal.card.id);
    if (card) card.owned = true;
    state.points += 10;
    setTimeout(() => {
      state.termCardModal = null;
    }, 1500);
  }
}

function closeTermCard() {
  state.termCardModal = null;
}

// ── 百科 Modal（新版，取代舊 activeQuiz）─────────────────────────────────────

function openEncyclopediaCard(cardId) {
  const card = state.cards.find((c) => c.id === cardId);
  if (!card) return;
  // 已擁有：直接顯示整張卡（與知識庫一致）
  if (card.owned) {
    openFullCard(cardId);
    return;
  }
  const quiz = QUIZZES.find((q) => q.cardId === cardId);
  // mode：有題目=unlock（答題解鎖）、無題目=locked（顯示解鎖提示）
  const mode = quiz ? "unlock" : "locked";
  const cooldownEnd = state.quizCooldowns[cardId] ?? null;
  state.encyclopediaModal = { card, quiz, mode, answer: null, cooldownEnd };
}

function answerEncyclopediaQuiz(optionLabel) {
  if (!state.encyclopediaModal) return;
  state.encyclopediaModal.answer = optionLabel;

  const correct = state.encyclopediaModal.quiz?.options.find(
    (o) => o.label === optionLabel,
  )?.correct;

  if (correct) {
    const card = state.cards.find(
      (c) => c.id === state.encyclopediaModal.card.id,
    );
    if (card) card.owned = true;
    state.points += 10;
    delete state.quizCooldowns[state.encyclopediaModal.card.id];
    state.encyclopediaModal.cooldownEnd = null;
  } else {
    // 答錯：鎖定 30 分鐘無法作答（仍可開啟查看題目）
    const cooldownEnd = Date.now() + 30 * 60 * 1000;
    state.quizCooldowns[state.encyclopediaModal.card.id] = cooldownEnd;
    state.encyclopediaModal.cooldownEnd = cooldownEnd;
  }
}

function closeEncyclopediaModal() {
  state.encyclopediaModal = null;
}

// ── 新聞卡預覽 Modal ──────────────────────────────────────────────────────────

function openNewsCardPreview(news) {
  state.newsCardPreview = { news };
}

function closeNewsCardPreview() {
  state.newsCardPreview = null;
}

// ── 我的腦補包​​ Full Card Modal ──────────────────────────────────────────────────

function openFullCard(cardId) {
  const card = state.cards.find((c) => c.id === cardId);
  if (card) state.fullCardModal = { card };
}

function closeFullCard() {
  state.fullCardModal = null;
}

// ── 合成 Overlay ──────────────────────────────────────────────────────────────

function openSynthesisModal(recipeId) {
  const recipe = SYNTHESIS_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return;
  state.synthModal = { recipeId, phase: "select" };
}

function triggerSynthesisAnimate() {
  if (state.synthModal) state.synthModal.phase = "animate";
}

function completeSynthesis() {
  if (!state.synthModal) return;
  const { recipeId } = state.synthModal;
  attemptSynthesis(recipeId);
  state.synthModal = null;
  state.activeTab = "arsenal";
}

function closeSynthModal() {
  if (state.synthModal?.phase === "animate") return;
  state.synthModal = null;
}

// ── 合成 ──────────────────────────────────────────────────────────────────────

function attemptSynthesis(recipeId) {
  const recipe = SYNTHESIS_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return;

  const ingredientCounts = {};
  for (const id of recipe.ingredients) {
    ingredientCounts[id] = (ingredientCounts[id] || 0) + 1;
  }

  for (const [cardId, needed] of Object.entries(ingredientCounts)) {
    const available = state.cards.filter(
      (c) => c.id === cardId && c.owned,
    ).length;
    if (available < needed) {
      state.synthesisFeedback = "error";
      setTimeout(() => {
        state.synthesisFeedback = null;
      }, 2000);
      return;
    }
  }

  for (const [cardId, needed] of Object.entries(ingredientCounts)) {
    let removed = 0;
    for (const card of state.cards) {
      if (card.id === cardId && card.owned && removed < needed) {
        card.owned = false;
        removed++;
      }
    }
  }

  const resultCard = state.cards.find((c) => c.id === recipe.result);
  if (resultCard) {
    resultCard.owned = true;
    state.lastSynthesizedCardId = recipe.result;
  }
  state.points += 5;
  state.synthesisFeedback = "success";
  setTimeout(() => {
    state.synthesisFeedback = null;
  }, 2500);
}

export function useGameStore() {
  return {
    state,
    ownedCards,
    selectedCards,
    encyclopediaItems,
    PREV_NEWS,
    ALL_NEWS,
    SYNTHESIS_RECIPES,
    TOPIC_LABELS,
    TYPE_LABELS,
    selectSlot,
    removeSlot,
    openNewsDetail,
    closeNewsDetail,
    startCombat,
    submitAntidote,
    resetCombat,
    openTermCard,
    startTermQuiz,
    answerTermCard,
    submitTermCard,
    closeTermCard,
    openEncyclopediaCard,
    answerEncyclopediaQuiz,
    closeEncyclopediaModal,
    openNewsCardPreview,
    closeNewsCardPreview,
    openFullCard,
    closeFullCard,
    openSynthesisModal,
    triggerSynthesisAnimate,
    completeSynthesis,
    closeSynthModal,
    attemptSynthesis,
    lockNews,
  };
}
