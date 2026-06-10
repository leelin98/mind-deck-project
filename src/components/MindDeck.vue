<template>
  <div class="mind-deck">

    <!-- ── Top Nav ── -->
    <header class="top-nav">
      <div class="nav-brand" @click="state.activeTab = 'combat'">
        <span class="brand-icon">⬡</span>
        <span class="brand-text">MIND·DECK</span>
      </div>
      <div class="nav-user">
        <div class="streak-chip">
          <span class="streak-fire">🔥</span>
          <span class="streak-value">{{ state.streak }}</span>
        </div>
        <div class="points-chip">
          <span class="points-icon">◈</span>
          <span class="points-value" ref="pointsEl">{{ state.points }}</span>
        </div>
      </div>
    </header>

    <!-- ── Main Content ── -->
    <main class="main-content" ref="mainEl">

      <!-- ══ COMBAT TAB ══ -->
      <template v-if="state.activeTab === 'combat'">

        <!-- 新聞清單頁（堆疊卡片） -->
        <div v-if="!state.newsDetailMode" class="news-stack-view">
          <!--
            JS 虛擬滾動：overflow hidden + 攔截 wheel/touch
            所有卡片 position:absolute，今日卡固定在 top:0，
            舊卡依 stackScrollY 計算 translateY（100%→0%）
          -->
          <div
            class="stack-scroller"
            ref="stackScrollerEl"
            @wheel.prevent="onStackWheel"
            @touchstart.passive="onStackTouchStart"
            @touchmove.prevent="onStackTouchMove"
          >

            <!-- 今日新聞卡（z-index 最低，始終可見） -->
            <div
              class="stack-card"
              :style="{ '--card-bg': topicColors[state.todayNews?.topic] || 'linear-gradient(135deg,#F97316,#FBBF24)', zIndex: 1 }"
              @click="openNewsDetail(state.todayNews.id)"
            >
              <img
                v-if="state.todayNews?.image"
                :src="state.todayNews.image"
                class="stack-bg-img"
                :alt="state.todayNews.title"
                @error="$event.target.style.display='none'"
              />
              <div class="stack-card-inner">
                <div class="stack-card-top">
                  <span class="stack-badge today-badge">今日挑戰</span>
                  <span class="stack-source">{{ state.todayNews.source }}</span>
                </div>
                <div class="stack-card-bottom">
                  <div class="stack-tags">
                    <span v-for="tag in (state.todayNews?.tags || [])" :key="tag" class="stack-tag">{{ tag }}</span>
                  </div>
                  <h2 class="stack-title">{{ state.todayNews.title }}</h2>
                  <p class="stack-sub">{{ state.todayNews.subtitle }}</p>
                  <div class="stack-footer">
                    <span class="stack-diff">{{ state.todayNews.difficulty }} pts</span>
                    <span class="stack-cta">開始挑戰 →</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 過往新聞卡（從下方滑入覆蓋今日卡，z-index 依序疊高） -->
            <div
              v-for="(news, i) in PREV_NEWS"
              :key="news.id"
              class="stack-card"
              :style="{
                '--card-bg': topicColors[news.topic] || 'linear-gradient(135deg,#475569,#94A3B8)',
                zIndex: i + 2,
                transform: prevCardTransform(i),
              }"
              @click="openNewsDetail(news.id)"
            >
              <img
                v-if="news.image"
                :src="news.image"
                class="stack-bg-img"
                :alt="news.title"
                @error="$event.target.style.display='none'"
              />
              <div class="stack-card-inner">
                <div class="stack-card-top">
                  <span v-if="isNewsEarned(news.id)" class="stack-badge earned-badge">✦ 已獲得</span>
                  <span v-else-if="getNewsLockRemaining(news.id) > 0" class="stack-badge locked-badge">
                    🔒 {{ formatLock(getNewsLockRemaining(news.id)) }}
                  </span>
                  <span v-else class="stack-badge pending-badge">尚未獲得</span>
                  <span class="stack-source">{{ news.source }}</span>
                </div>
                <div class="stack-card-bottom">
                  <div class="stack-tags">
                    <span v-for="tag in (news.tags || [])" :key="tag" class="stack-tag">{{ tag }}</span>
                  </div>
                  <h2 class="stack-title">{{ news.title }}</h2>
                  <p class="stack-sub">{{ news.subtitle }}</p>
                  <div class="stack-footer">
                    <span class="stack-diff">{{ news.difficulty }} pts</span>
                    <span class="stack-date">{{ news.date }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- 新聞詳細頁 -->
        <div
          v-else
          class="news-detail-view"
        >

          <div class="detail-nav">
            <button class="detail-back-btn" @click="closeNewsDetail">← 返回</button>
            <span class="detail-nav-label">{{ state.activeNews?.source }}</span>
          </div>

          <!-- SELECT 階段 -->
          <template v-if="state.combatPhase === 'select'">

            <div class="news-article">
              <div class="article-img-wrap">
                <img
                  v-if="!articleImgFailed && state.activeNews?.image"
                  :src="state.activeNews.image"
                  :alt="state.activeNews.title"
                  class="article-img"
                  @error="articleImgFailed = true"
                />
                <div v-else class="article-img-fallback" :style="articleHeaderStyle"></div>
              </div>
              <div class="article-meta">
                <span class="news-source-dark">{{ state.activeNews?.source }}</span>
                <span class="article-date">{{ state.activeNews?.date }}</span>
              </div>
              <h1 class="article-title">{{ state.activeNews?.title }}</h1>
              <div class="article-tags">
                <span v-for="tag in (state.activeNews?.tags || [])" :key="tag" class="tag-chip">{{ tag }}</span>
              </div>
              <div class="article-body">
                <p v-for="(para, pIdx) in parsedArticle" :key="pIdx" class="article-para">
                  <template v-for="(part, i) in para" :key="i">
                    <span v-if="part.type === 'text'">{{ part.content }}</span>
                    <button
                      v-else-if="part.type === 'term'"
                      class="term-highlight"
                      @click="openTermCard(part.content)"
                    >{{ part.content }}</button>
                  </template>
                </p>
              </div>
            </div>

            <!-- 已通關提示 -->
            <div v-if="state.activeNews?.completed" class="combat-completed-notice">
              <span class="combat-completed-icon">✦</span>
              <p class="combat-completed-title">已完成此挑戰</p>
              <p class="combat-completed-sub">精通 {{ TOPIC_LABELS[state.activeNews?.topic] || '' }} 領域</p>
              <button class="btn-secondary mt-3" @click="closeNewsDetail">← 返回新聞清單</button>
            </div>

            <!-- 出牌區（在文章下方，隨頁面捲動）-->
            <div v-if="!state.activeNews?.completed" class="fan-stage">
              <div class="fan-stage-header">
                <span class="fan-stage-label">選擇 3 張資產卡出戰</span>
                <span class="fan-stage-count">{{ selectedCardIds.length }}/3</span>
              </div>

              <div class="slots-row">
                <div
                  v-for="(slot, i) in state.selectedSlots"
                  :key="i"
                  class="slot-target"
                  :class="{ filled: slot !== null }"
                  @click="slot !== null && removeSlot(i)"
                >
                  <template v-if="slot !== null">
                    <MiniCard :card="getCard(slot)" />
                    <span class="slot-remove">✕</span>
                  </template>
                  <template v-else>
                    <span class="slot-empty-icon">＋</span>
                    <span class="slot-empty-label">{{ i + 1 }}</span>
                  </template>
                </div>
              </div>

              <button
                class="btn-combat puffy-btn fan-confirm-btn"
                :class="{ 'btn-locked-state': isCurrentNewsLocked }"
                :disabled="selectedCardIds.length < 3 || isCurrentNewsLocked"
                @click="startCombat"
              >
                <template v-if="isCurrentNewsLocked">
                  <span>🔒 鎖定中 {{ newsLockCountdown }}</span>
                </template>
                <template v-else>
                  <span>⚔ 開始戰鬥</span>
                  <span v-if="selectedCardIds.length < 3" class="btn-card-count">{{ selectedCardIds.length }}/3</span>
                </template>
              </button>

              <FanHand
                :cards="ownedCards"
                :selected-ids="selectedCardIds"
                @pick="handleFanPick"
                @remove="handleFanRemove"
              />
            </div>

          </template>

          <!-- 非 SELECT 階段 -->
          <div v-else class="tab-panel">

            <div v-if="state.combatPhase === 'reveal'" class="reveal-phase">
              <BattleFormula :result="state.combatResult" />
            </div>

            <div v-else-if="state.combatPhase === 'result'" class="result-phase">
              <div class="result-card success">
                <div class="result-icon">🏆</div>
                <h3 class="result-title">解析成功！</h3>
                <p class="result-pts" v-if="state.combatResult?.pointsDelta">
                  +{{ state.combatResult.pointsDelta }} pts
                </p>
                <p v-if="state.combatResult?.matched?.length" class="result-match">
                  ✦ 共鳴標籤：{{ state.combatResult.matched.join('、') }}
                </p>
                <p v-if="state.combatResult?.antidoteSuccess" class="result-antidote">
                  💊 解藥成功 — 已獲得新資產卡
                </p>
                <div class="result-news-card-earned">
                  <img src="/images/cards/news-001.jpg" class="result-news-card-img" alt="新聞卡" />
                  <span class="result-news-card-label">🎴 新聞卡已加入資產庫</span>
                </div>
                <button class="btn-secondary" @click="closeNewsDetail">返回新聞清單</button>
              </div>
            </div>

            <div v-else-if="state.combatPhase === 'fail'" class="fail-phase">
              <div class="result-card fail">
                <div class="result-icon">⚠</div>
                <h3 class="result-title">情報不足！</h3>
                <p class="result-desc">偵測到未知領域盲區</p>
                <a :href="state.activeNews?.antidoteUrl" target="_blank" class="btn-antidote puffy-btn">
                  🔗 前往情報站獲取解藥
                </a>
                <button class="btn-secondary mt-2" @click="state.combatPhase = 'antidote'">
                  已取得解藥 — 輸入關鍵字
                </button>
              </div>
            </div>

            <div v-else-if="state.combatPhase === 'antidote'" class="antidote-phase">
              <div class="antidote-card">
                <p class="antidote-label">輸入解藥關鍵字</p>
                <p class="antidote-hint">{{ state.activeNews?.antidoteHint || '（提示：回想今日新聞關鍵字）' }}</p>
                <input
                  v-model="state.antidoteInput"
                  class="antidote-input"
                  :class="{ error: state.antidoteError }"
                  placeholder="關鍵字…"
                  @keyup.enter="submitAntidote"
                />
                <p v-if="state.antidoteError" class="antidote-error">✕ 關鍵字不符，再試一次</p>
                <button class="btn-combat puffy-btn mt-3" @click="submitAntidote">
                  💊 驗證解鎖新資產
                </button>
              </div>
            </div>

          </div>

        </div>

      </template>

      <!-- ══ ARSENAL TAB ══ -->
      <section v-else-if="state.activeTab === 'arsenal'" class="arsenal-tab">

        <!-- 資產行 -->
        <div class="arsenal-row-section">
          <div class="arsenal-row-header">
            <span class="arsenal-row-label">資產</span>
            <span class="arsenal-row-count">{{ assetCards.length }}</span>
          </div>
          <div class="arsenal-carousel-wrap">
            <div v-if="assetCards.length > 0" class="carousel-track carousel-ltr">
              <div
                v-for="(card, idx) in [...assetCards, ...assetCards]"
                :key="`asset-${idx}`"
                class="carousel-card-item"
                @click="idx < assetCards.length ? openFullCard(card.id) : null"
              >
                <img :src="getCardImage(card)" :alt="card.name" class="carousel-card-img" />
                <span class="carousel-card-name">{{ card.name }}</span>
              </div>
            </div>
            <p v-else class="carousel-empty">尚無資產卡</p>
          </div>
        </div>

        <!-- 技術行 -->
        <div class="arsenal-row-section">
          <div class="arsenal-row-header">
            <span class="arsenal-row-label">技術</span>
            <span class="arsenal-row-count">{{ techCards.length }}</span>
          </div>
          <div class="arsenal-carousel-wrap">
            <div v-if="techCards.length > 0" class="carousel-track carousel-rtl">
              <div
                v-for="(card, idx) in [...techCards, ...techCards]"
                :key="`tech-${idx}`"
                class="carousel-card-item"
                @click="idx < techCards.length ? openFullCard(card.id) : null"
              >
                <img :src="getCardImage(card)" :alt="card.name" class="carousel-card-img" />
                <span class="carousel-card-name">{{ card.name }}</span>
              </div>
            </div>
            <p v-else class="carousel-empty">尚無技術卡</p>
          </div>
        </div>

        <!-- 策略行 -->
        <div class="arsenal-row-section">
          <div class="arsenal-row-header">
            <span class="arsenal-row-label">策略</span>
            <span class="arsenal-row-count">{{ strategyCards.length }}</span>
          </div>
          <div class="arsenal-carousel-wrap">
            <div v-if="strategyCards.length > 0" class="carousel-track carousel-ltr">
              <div
                v-for="(card, idx) in [...strategyCards, ...strategyCards]"
                :key="`strat-${idx}`"
                class="carousel-card-item"
                @click="idx < strategyCards.length ? openFullCard(card.id) : null"
              >
                <img :src="getCardImage(card)" :alt="card.name" class="carousel-card-img" />
                <span class="carousel-card-name">{{ card.name }}</span>
              </div>
            </div>
            <p v-else class="carousel-empty">尚無策略卡</p>
          </div>
        </div>

        <!-- 新聞卡行（月份 accordion + fan out） -->
        <div class="arsenal-row-section">
          <div class="arsenal-row-header">
            <span class="arsenal-row-label">新聞卡</span>
            <span class="arsenal-row-count">{{ state.earnedNewsCards.length }}</span>
          </div>

          <div v-if="state.earnedNewsCards.length === 0" class="carousel-empty news-empty">
            贏得新聞戰鬥後自動收錄
          </div>

          <div v-else class="news-accordion">
            <div
              v-for="(cards, month) in newsCardsByMonth"
              :key="month"
              class="news-month-block"
            >
              <div class="news-month-header" @click="toggleMonth(month)">
                <span class="news-month-label">{{ formatMonth(month) }}</span>
                <span class="news-month-count">{{ cards.length }} 張</span>
                <span class="news-month-arrow" :class="{ open: expandedMonth === month }">›</span>
              </div>

              <div
                v-if="expandedMonth === month"
                class="news-month-cards"
                :data-month="month"
              >
                <div
                  v-for="(news, idx) in cards"
                  :key="news.id"
                  class="news-fan-card"
                  @click="openNewsDetail(news.id)"
                >
                  <img src="/images/cards/news-001.jpg" :alt="news.title" class="news-fan-img" />
                  <span class="news-fan-title">{{ news.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 資產進化艙 -->
        <div class="synthesis-module" ref="synthModuleEl">
          <div class="synth-header">
            <span class="synth-icon">⬡</span>
            <h3 class="synth-title">資產進化艙</h3>
          </div>
          <div v-for="recipe in SYNTHESIS_RECIPES" :key="recipe.id" class="recipe-card">
            <p class="recipe-name">{{ recipe.name }}</p>
            <div class="recipe-flow">
              <div class="recipe-ingredients">
                <span v-for="(id, i) in recipe.ingredients" :key="i" class="ingredient-chip">
                  {{ getCard(id)?.name }}
                </span>
              </div>
              <span class="recipe-arrow">→</span>
              <div class="recipe-result-wrap">
                <span class="result-chip epic">{{ getCard(recipe.result)?.name }}</span>
              </div>
            </div>
            <p class="recipe-desc">{{ recipe.description }}</p>
            <Transition name="modal">
              <div v-if="state.synthesisFeedback === 'success'" class="synth-feedback success">
                ✦ 融合成功！次世代晶圓已加入資產庫
              </div>
              <div v-else-if="state.synthesisFeedback === 'error'" class="synth-feedback error">
                ✕ 材料不足（需要 3 張一般圓形晶圓）
              </div>
            </Transition>
            <button class="btn-synth puffy-btn" @click="openSynthesisModal(recipe.id)">
              ⬡ 融合資產，解鎖高階燃料
            </button>
          </div>
        </div>
      </section>

      <!-- ══ ENCYCLOPEDIA TAB ══ -->
      <section v-else-if="state.activeTab === 'encyclopedia'" class="tab-panel">
        <div class="section-title-row">
          <h2 class="section-title">科技百科</h2>
          <span class="section-sub">自主刷題解鎖</span>
        </div>

        <div class="encyclopedia-list">
          <div
            v-for="item in encyclopediaItems"
            :key="item.id"
            class="encyclo-row"
            :class="{ owned: item.owned, locked: !item.owned }"
            @click="item.owned ? openFullCard(item.id) : openEncyclopediaCard(item.id)"
          >
            <!-- Mini card portrait preview -->
            <div
              class="encyclo-card-preview"
              :class="{ 'preview-blurred': !item.owned }"
            >
              <div
                class="mini-card mini-card-xs"
                :style="{ '--accent': item.accentColor || '#3B82F6' }"
              >
                <div class="mini-strip">{{ TYPE_LABELS[item.type] || item.type }}</div>
                <div class="mini-body">
                  <div class="mini-oval">
                    <span class="mini-glyph">{{ typeIcon(item.type) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="encyclo-info">
              <span class="encyclo-name">{{ item.name }}</span>
              <span class="encyclo-name-en">{{ item.owned ? item.nameEn : TOPIC_LABELS[item.strongTopic] }}</span>
              <div class="encyclo-tags">
                <template v-if="item.owned">
                  <span v-for="t in item.tags" :key="t" class="tag-chip small">{{ t }}</span>
                </template>
                <p v-else-if="item.quiz?.teaser" class="encyclo-teaser-preview">
                  {{ item.quiz.teaser.slice(0, 28) + '…' }}
                </p>
              </div>
            </div>

            <div class="encyclo-status">
              <span v-if="item.owned" class="status-owned">✦</span>
              <span v-else-if="item.quiz" class="status-locked">🔒 答題</span>
              <span v-else class="status-na">—</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ══ PROFILE TAB ══ -->
      <section v-else-if="state.activeTab === 'profile'" class="tab-panel">
        <div class="profile-hero">
          <div class="profile-avatar">
            <span class="avatar-glyph">⬡</span>
          </div>
          <h2 class="profile-name">戰略家 {{ state.userId }}</h2>
          <p class="profile-email">leelin36942@gmail.com</p>
        </div>

        <div class="profile-stats-row">
          <div class="stat-item">
            <span class="stat-value">{{ state.points }}</span>
            <span class="stat-label">◈ 積分</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">#{{ state.rank }}</span>
            <span class="stat-label">🏆 排名</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ state.streak }}天</span>
            <span class="stat-label">🔥 連打</span>
          </div>
        </div>

        <div class="profile-section-block">
          <div class="profile-section-header">
            <span>帳號設定</span>
            <span class="section-arrow">›</span>
          </div>
        </div>

        <div class="profile-section-block">
          <h3 class="profile-section-title">◈ 積分兌換</h3>
          <div class="redeem-list">
            <div v-for="item in state.redeemItems" :key="item.id" class="redeem-item">
              <span class="redeem-icon">{{ item.icon }}</span>
              <div class="redeem-info">
                <span class="redeem-name">{{ item.name }}</span>
                <span class="redeem-cost">{{ item.cost }} PTS</span>
              </div>
              <button class="redeem-btn" :disabled="state.points < item.cost">
                {{ state.points >= item.cost ? '兌換' : '不足' }}
              </button>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- ── 置底漂浮選單 ── -->
    <nav class="bottom-nav" :class="{ 'nav-show': navShow, 'nav-hidden': navHidden }">
      <div class="bottom-nav-inner">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          class="bottom-tab-btn"
          :class="{ active: state.activeTab === tab.id }"
          @click="switchTab(tab.id)"
        >
          <span class="bottom-tab-icon">{{ tab.icon }}</span>
          <span class="bottom-tab-label">{{ tab.label }}</span>
        </button>
      </div>
    </nav>

    <!-- ── 專有名詞卡 Modal ── -->
    <Transition name="modal">
      <div v-if="state.termCardModal" class="modal-overlay" @click.self="closeTermCard">
        <div class="modal-panel">
          <button class="modal-close" @click="closeTermCard">✕</button>

          <template v-if="state.termCardModal.phase === 'preview'">
            <p v-if="state.termCardModal.quiz?.teaser" class="term-teaser">
              {{ state.termCardModal.quiz.teaser }}
            </p>
            <p class="modal-tag">發現新概念</p>
            <div class="term-card-preview">
              <div class="term-card-icon" :style="{ '--accent': state.termCardModal.card.accentColor }">
                <span>{{ typeIcon(state.termCardModal.card.type) }}</span>
              </div>
              <div class="term-card-info">
                <h3 class="term-card-name">{{ state.termCardModal.card.name }}</h3>
                <p class="term-card-en">{{ state.termCardModal.card.nameEn }}</p>
                <p class="term-card-desc">{{ state.termCardModal.card.description }}</p>
                <div class="term-card-meta">
                  <span class="type-badge" :class="`type-${state.termCardModal.card.type}`">
                    {{ TYPE_LABELS[state.termCardModal.card.type] }}
                  </span>
                  <span class="topic-badge">
                    擅長 {{ TOPIC_LABELS[state.termCardModal.card.strongTopic] }}
                  </span>
                </div>
              </div>
            </div>
            <button
              v-if="state.termCardModal.quiz && !state.termCardModal.card.owned"
              class="btn-combat puffy-btn"
              @click="startTermQuiz"
            >解鎖挑戰 →</button>
            <p v-else-if="state.termCardModal.card.owned" class="term-card-owned">
              ✦ 已在你的資產庫中
            </p>
          </template>

          <template v-else-if="state.termCardModal.phase === 'quiz'">
            <p class="modal-tag">解鎖挑戰</p>
            <h3 class="modal-q">{{ state.termCardModal.quiz.scenario }}</h3>
            <div class="modal-options">
              <button
                v-for="opt in state.termCardModal.quiz.options"
                :key="opt.label"
                class="modal-opt"
                :class="{
                  selected: state.termCardModal.answer === opt.label,
                  correct: state.termCardModal.answer && opt.correct,
                  wrong: state.termCardModal.answer === opt.label && !opt.correct,
                }"
                :disabled="!!state.termCardModal.answer"
                @click="answerTermCard(opt.label)"
              >
                <span class="opt-label">{{ opt.label }}</span>
                <span class="opt-text">{{ opt.text }}</span>
              </button>
            </div>
            <div v-if="state.termCardModal.answer" class="modal-feedback">
              <template v-if="state.termCardModal.quiz.options.find(o => o.label === state.termCardModal.answer)?.correct">
                <p class="feedback-correct">{{ state.termCardModal.quiz.successMessage }}</p>
                <p class="feedback-reward">🎴 {{ state.termCardModal.quiz.reward }}</p>
                <button class="btn-secondary" @click="submitTermCard">確認領取</button>
              </template>
              <template v-else>
                <p class="feedback-wrong">{{ state.termCardModal.quiz.failMessage }}</p>
                <button class="btn-secondary" @click="state.termCardModal.answer = null">重新作答</button>
              </template>
            </div>
          </template>

        </div>
      </div>
    </Transition>

    <!-- ── 百科 Modal（新版）── -->
    <Transition name="modal">
      <div v-if="state.encyclopediaModal" class="modal-overlay" @click.self="closeEncyclopediaModal">
        <div class="modal-panel encq-panel">
          <button class="modal-close" @click="closeEncyclopediaModal">✕</button>

          <!-- UNLOCK 模式：鎖定卡片答題解鎖 -->
          <template v-if="state.encyclopediaModal.mode === 'unlock'">
            <!-- 模糊卡片視覺 -->
            <div class="encq-preview" :style="{ '--accent': state.encyclopediaModal.card.accentColor }">
              <div class="encq-blurred-card">
                <span class="encq-blurred-glyph">{{ typeIcon(state.encyclopediaModal.card.type) }}</span>
              </div>
              <div class="encq-preview-badges">
                <span class="type-badge" :class="`type-${state.encyclopediaModal.card.type}`">
                  {{ TYPE_LABELS[state.encyclopediaModal.card.type] }}
                </span>
                <span class="topic-badge">{{ TOPIC_LABELS[state.encyclopediaModal.card.strongTopic] }}</span>
              </div>
            </div>

            <p v-if="state.encyclopediaModal.quiz?.teaser" class="encq-teaser">
              {{ state.encyclopediaModal.quiz.teaser }}
            </p>

            <!-- 答題前 -->
            <template v-if="!state.encyclopediaModal.answer">
              <p class="modal-tag">答題解鎖任務</p>
              <h3 class="modal-q">{{ state.encyclopediaModal.quiz?.scenario }}</h3>
              <div class="modal-options">
                <button
                  v-for="opt in state.encyclopediaModal.quiz?.options"
                  :key="opt.label"
                  class="modal-opt"
                  @click="answerEncyclopediaQuiz(opt.label)"
                >
                  <span class="opt-label">{{ opt.label }}</span>
                  <span class="opt-text">{{ opt.text }}</span>
                </button>
              </div>
            </template>

            <!-- 答題後 -->
            <div v-else class="modal-feedback">
              <template v-if="state.encyclopediaModal.quiz?.options.find(o => o.label === state.encyclopediaModal.answer)?.correct">
                <p class="feedback-correct">✦ {{ state.encyclopediaModal.quiz.successMessage }}</p>
                <p class="feedback-reward">🎴 {{ state.encyclopediaModal.quiz.reward }}</p>
                <button class="btn-secondary" @click="closeEncyclopediaModal">關閉</button>
              </template>
              <template v-else>
                <p class="feedback-wrong">{{ state.encyclopediaModal.quiz?.failMessage }}</p>
                <button class="btn-secondary" @click="state.encyclopediaModal.answer = null">重新作答</button>
              </template>
            </div>
          </template>

          <!-- REVIEW 模式：已解鎖複習 -->
          <template v-else-if="state.encyclopediaModal.mode === 'review'">
            <!-- 完整卡片資訊 -->
            <div class="encq-owned-info" :style="{ '--accent': state.encyclopediaModal.card.accentColor }">
              <div class="encq-owned-icon">
                <span>{{ typeIcon(state.encyclopediaModal.card.type) }}</span>
              </div>
              <div class="encq-owned-text">
                <h3 class="encq-owned-name">{{ state.encyclopediaModal.card.name }}</h3>
                <p class="encq-owned-en">{{ state.encyclopediaModal.card.nameEn }}</p>
                <p class="encq-owned-desc">{{ state.encyclopediaModal.card.description }}</p>
              </div>
            </div>

            <p v-if="!state.encyclopediaModal.quiz" class="encq-no-quiz">此卡暫無挑戰題目</p>

            <!-- 冷卻中 -->
            <template v-else-if="state.encyclopediaModal.cooldownEnd && cooldownRemaining > 0">
              <div class="encq-cooldown">
                <p class="encq-cooldown-title">⏳ 冷卻中</p>
                <p class="encq-cooldown-timer">{{ formatCooldown(cooldownRemaining) }} 後可重新作答</p>
                <a
                  :href="state.encyclopediaModal.quiz.recommendedReading?.url || 'https://www.digitimes.com.tw/'"
                  target="_blank"
                  class="btn-antidote puffy-btn encq-reading-btn"
                >
                  📖 推薦閱讀：{{ state.encyclopediaModal.quiz.recommendedReading?.title || '相關文章' }}
                </a>
              </div>
            </template>

            <!-- 答題前 -->
            <template v-else-if="!state.encyclopediaModal.answer">
              <p class="modal-tag">複習挑戰</p>
              <h3 class="modal-q">{{ state.encyclopediaModal.quiz.scenario }}</h3>
              <div class="modal-options">
                <button
                  v-for="opt in state.encyclopediaModal.quiz.options"
                  :key="opt.label"
                  class="modal-opt"
                  @click="answerEncyclopediaQuiz(opt.label)"
                >
                  <span class="opt-label">{{ opt.label }}</span>
                  <span class="opt-text">{{ opt.text }}</span>
                </button>
              </div>
            </template>

            <!-- 答題後 -->
            <div v-else class="modal-feedback">
              <template v-if="state.encyclopediaModal.quiz.options.find(o => o.label === state.encyclopediaModal.answer)?.correct">
                <p class="feedback-correct">✦ 複習正確！繼續保持。</p>
                <button class="btn-secondary" @click="closeEncyclopediaModal">關閉</button>
              </template>
              <template v-else>
                <p class="feedback-wrong">{{ state.encyclopediaModal.quiz.failMessage }}</p>
                <p class="encq-cooldown-note">已設定 30 秒冷卻，期間可閱讀推薦文章。</p>
                <a
                  :href="state.encyclopediaModal.quiz.recommendedReading?.url || 'https://www.digitimes.com.tw/'"
                  target="_blank"
                  class="btn-antidote puffy-btn encq-reading-btn"
                >
                  📖 推薦閱讀：{{ state.encyclopediaModal.quiz.recommendedReading?.title || '相關文章' }}
                </a>
                <button class="btn-secondary mt-2" @click="closeEncyclopediaModal">關閉</button>
              </template>
            </div>
          </template>

        </div>
      </div>
    </Transition>

    <!-- ── 資產全卡 Modal ── -->
    <Transition name="modal">
      <FullCardModal
        v-if="state.fullCardModal"
        :card="state.fullCardModal.card"
        @close="closeFullCard"
      />
    </Transition>

    <!-- ── 合成 Overlay ── -->
    <Transition name="modal">
      <div
        v-if="state.synthModal"
        class="modal-overlay"
        @click.self="closeSynthModal"
      >
        <div class="synth-overlay-panel">
          <div class="synth-ov-header">
            <p class="synth-ov-title">{{ currentRecipe?.name }}</p>
            <p class="synth-ov-desc">{{ currentRecipe?.description }}</p>
          </div>

          <div class="synth-ov-stage" ref="synthStageEl">
            <div class="synth-ov-ingredients">
              <template v-for="(cardId, idx) in (currentRecipe?.ingredients ?? [])" :key="idx">
                <div class="synth-ov-card-item" :class="`synth-ingr-${idx}`">
                  <MiniCard :card="getCard(cardId)" />
                </div>
                <span
                  v-if="idx < (currentRecipe?.ingredients.length ?? 0) - 1"
                  class="synth-ov-plus"
                >+</span>
              </template>
            </div>

            <div class="synth-ov-arrow-row">
              <span class="synth-ov-arrow">→</span>
              <div class="synth-ov-result-area">
                <div v-if="synthResultRevealed" class="synth-result-glow">
                  <MiniCard :card="getCard(currentRecipe?.result)" />
                </div>
                <div v-else class="synth-result-locked">
                  <span class="synth-result-glyph">⬡</span>
                  <p class="synth-result-label">融合後解鎖</p>
                </div>
              </div>
            </div>
          </div>

          <template v-if="state.synthModal.phase === 'select'">
            <p v-if="!canSynthesize" class="synth-ov-missing">✕ 材料不足</p>
            <button class="btn-combat puffy-btn" :disabled="!canSynthesize" @click="handleSynthesisConfirm">
              ⬡ 確認融合
            </button>
            <button class="btn-secondary mt-2" @click="closeSynthModal">取消</button>
          </template>
          <div v-else class="synth-ov-animating">
            <p class="synth-ov-anim-text">✦ 融合中...</p>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'
import { useGameStore } from '../composables/useGameStore.js'
import { TOPIC_LABELS, TYPE_LABELS } from '../data/combat.js'
import MiniCard from './MiniCard.vue'
// AssetCard imported for future use (currently displays as image via AssetCard.vue)
import BattleFormula from './BattleFormula.vue'
import FanHand from './FanHand.vue'
import FullCardModal from './FullCardModal.vue'

const {
  state, ownedCards, encyclopediaItems,
  PREV_NEWS, SYNTHESIS_RECIPES,
  selectSlot, removeSlot,
  openNewsDetail, closeNewsDetail,
  startCombat, submitAntidote, resetCombat,
  openTermCard, startTermQuiz, answerTermCard, submitTermCard, closeTermCard,
  openEncyclopediaCard, answerEncyclopediaQuiz, closeEncyclopediaModal,
  openFullCard, closeFullCard,
  openSynthesisModal, triggerSynthesisAnimate, completeSynthesis, closeSynthModal,
} = useGameStore()

const TABS = [
  { id: 'combat',       icon: '⚔',  label: '每日挑戰' },
  { id: 'arsenal',      icon: '⬡',  label: '我的資產' },
  { id: 'encyclopedia', icon: '◈',  label: '科技百科' },
  { id: 'profile',      icon: '👤', label: '我的' },
]

const pointsEl         = ref(null)
const mainEl           = ref(null)
const combatSectionEl  = ref(null)
const synthModuleEl    = ref(null)
const synthStageEl     = ref(null)
const articleImgFailed = ref(false)
const synthResultRevealed = ref(false)
const now           = ref(Date.now())
const expandedMonth = ref(null)
let nowInterval     = null

// ── bottom nav 滾動顯示/隱藏 ─────────────────────────────────────────────────
const navShow   = ref(false)
const navHidden = ref(false)
let lastScrollY = 0

// ── stack 虛擬滾動 ───────────────────────────────────────────────────────────
const stackScrollerEl = ref(null)
const stackScrollY    = ref(0)
let stackTouchY = 0

// ── 主題色（依新聞 topic 動態變換）─────────────────────────────────────────
const topicColors = {
  compute:        'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
  connect:        'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
  intelligence:   'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
  sustainability: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
}

const newsHeaderStyle = computed(() => ({
  background: topicColors[state.todayNews?.topic] || 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)',
}))

const articleHeaderStyle = computed(() => ({
  background: topicColors[state.activeNews?.topic] || 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)',
}))

// ── 文章解析（支援 {{詞}} 點擊）──────────────────────────────────────────
const parsedArticle = computed(() => {
  const body = state.activeNews?.body
  if (!body) return []
  const termWord = state.activeNews?.highlightedTerm?.word
  return body.split('\n\n').map(para => {
    if (!termWord) return [{ type: 'text', content: para }]
    const marker = `{{${termWord}}}`
    const idx = para.indexOf(marker)
    if (idx === -1) return [{ type: 'text', content: para }]
    const parts = []
    if (idx > 0) parts.push({ type: 'text', content: para.slice(0, idx) })
    parts.push({ type: 'term', content: termWord })
    const after = idx + marker.length
    if (after < para.length) parts.push({ type: 'text', content: para.slice(after) })
    return parts
  })
})

// ── 已選卡片 IDs（給 FanHand 用）────────────────────────────────────────
const selectedCardIds = computed(() => state.selectedSlots.filter(id => id !== null))

// ── Arsenal 分類 ──────────────────────────────────────────────────────
const assetCards    = computed(() => ownedCards.value.filter(c => c.type === 'asset'))
const techCards     = computed(() => ownedCards.value.filter(c => c.type === 'tech'))
const strategyCards = computed(() => ownedCards.value.filter(c => c.type === 'strategy'))

const newsCardsByMonth = computed(() => {
  const grouped = {}
  for (const news of state.earnedNewsCards) {
    const month = news.date ? news.date.substring(0, 7) : 'unknown'
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(news)
  }
  return grouped
})

// ── 新聞鎖定狀態 ──────────────────────────────────────────────────────
const isCurrentNewsLocked = computed(() => {
  const until = state.newsLocks[state.activeNews?.id]
  if (!until) return false
  return until > now.value
})

const newsLockCountdown = computed(() => {
  if (!state.activeNews?.id) return ''
  return formatLock(Math.max(0, (state.newsLocks[state.activeNews.id] || 0) - now.value))
})

// ── 合成 overlay ──────────────────────────────────────────────────────
const currentRecipe = computed(() =>
  state.synthModal ? SYNTHESIS_RECIPES.find(r => r.id === state.synthModal.recipeId) : null
)

const canSynthesize = computed(() => {
  if (!currentRecipe.value) return false
  const counts = {}
  for (const id of currentRecipe.value.ingredients) {
    counts[id] = (counts[id] || 0) + 1
  }
  return Object.entries(counts).every(([cardId, needed]) =>
    state.cards.filter(c => c.id === cardId && c.owned).length >= needed
  )
})

function getCard(id) { return state.cards.find(c => c.id === id) }

function getCardImage(card) {
  if (card.sponsor) return '/images/cards/figure-sponsored-001.jpg'
  if (card.type === 'tech') return '/images/cards/assest-002.jpg'
  return '/images/cards/assest-001.jpg'
}

function isNewsEarned(newsId) {
  return state.earnedNewsCards.some(n => n.id === newsId)
}

function getNewsLockRemaining(newsId) {
  const until = state.newsLocks[newsId]
  if (!until) return 0
  return Math.max(0, until - now.value)
}

function formatLock(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}時${m}分`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

function formatMonth(month) {
  if (!month || month === 'unknown') return '未知月份'
  const [year, m] = month.split('-')
  return `${year}年${parseInt(m)}月`
}

async function toggleMonth(month) {
  if (expandedMonth.value === month) {
    expandedMonth.value = null
    return
  }
  expandedMonth.value = month
  await nextTick()
  const container = document.querySelector(`[data-month="${month}"]`)
  const items = container?.querySelectorAll('.news-fan-card')
  if (!items?.length) return
  gsap.from([...items], {
    x: 0, y: 30, scale: 0.3, opacity: 0,
    duration: 0.5,
    stagger: { amount: 0.4, from: 'start' },
    ease: 'back.out(1.8)'
  })
}

function typeIcon(type) {
  const icons = { asset: '⬡', tech: '◈', strategy: '▲', sponsor: '★' }
  return icons[type] || '◉'
}

function handleFanPick(cardId) {
  const emptySlot = state.selectedSlots.indexOf(null)
  if (emptySlot === -1) return
  selectSlot(emptySlot, cardId)
}

function handleFanRemove(cardId) {
  const slotIdx = state.selectedSlots.indexOf(cardId)
  if (slotIdx !== -1) removeSlot(slotIdx)
}

function handleSynthesisConfirm() {
  triggerSynthesisAnimate()
}

function scrollToCombat() {
  combatSectionEl.value?.scrollIntoView({ behavior: 'smooth' })
}

function switchTab(tabId) {
  state.activeTab = tabId
  mainEl.value?.scrollTo({ top: 0 })
  lastScrollY = 0
  navHidden.value = false
  stackScrollY.value = 0
}

// ── stack 虛擬滾動 handlers ──────────────────────────────────────────────────
function _stackMaxY() {
  return PREV_NEWS.length * (stackScrollerEl.value?.clientHeight || 0)
}

function _stackUpdateNav(delta) {
  if (delta > 8) navHidden.value = true
  else if (delta < -8) navHidden.value = false
}

function onStackWheel(e) {
  const prev = stackScrollY.value
  stackScrollY.value = Math.max(0, Math.min(prev + e.deltaY, _stackMaxY()))
  _stackUpdateNav(stackScrollY.value - prev)
  lastScrollY = stackScrollY.value
}

function onStackTouchStart(e) {
  stackTouchY = e.touches[0].clientY
}

function onStackTouchMove(e) {
  const delta = stackTouchY - e.touches[0].clientY
  stackTouchY = e.touches[0].clientY
  const prev = stackScrollY.value
  stackScrollY.value = Math.max(0, Math.min(prev + delta, _stackMaxY()))
  _stackUpdateNav(delta)
  lastScrollY = stackScrollY.value
}

// 計算第 i 張舊卡（0-indexed）的 translateY
// scroll 0→stackH: card i=0 從 translateY(100%) 滑至 0%
// scroll stackH→2*stackH: card i=1 滑入，以此類推
function prevCardTransform(i) {
  const h = stackScrollerEl.value?.clientHeight
  if (!h) return 'translateY(100%)'
  const progress = Math.max(0, Math.min(1, (stackScrollY.value - i * h) / h))
  return `translateY(${(1 - progress) * 100}%)`
}

// ── 百科冷卻倒數 ──────────────────────────────────────────────────────────
const cooldownRemaining = ref(0)
let cooldownInterval = null

watch(
  () => state.encyclopediaModal?.cooldownEnd,
  (endTime) => {
    if (cooldownInterval) { clearInterval(cooldownInterval); cooldownInterval = null }
    if (!endTime) { cooldownRemaining.value = 0; return }

    const tick = () => {
      const remaining = Math.max(0, endTime - Date.now())
      cooldownRemaining.value = remaining
      if (remaining === 0) {
        clearInterval(cooldownInterval)
        cooldownInterval = null
        if (state.encyclopediaModal) state.encyclopediaModal.cooldownEnd = null
      }
    }
    tick()
    cooldownInterval = setInterval(tick, 1000)
  },
  { immediate: true }
)

function formatCooldown(ms) {
  const s = Math.ceil(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}分 ${sec}秒` : `${sec}秒`
}

// 切換新聞時重置圖片狀態；離開詳細頁時恢復 nav
watch(() => state.newsDetailMode, (mode) => {
  articleImgFailed.value = false
  if (!mode) navHidden.value = false
})

// ── 積分動畫 ──────────────────────────────────────────────────────────────
let prevPoints = state.points
watch(() => state.points, (newVal) => {
  if (!pointsEl.value) return
  gsap.fromTo(pointsEl.value,
    { scale: 1.4, color: newVal > prevPoints ? '#34d399' : '#f87171' },
    { scale: 1, color: '', duration: 0.5, ease: 'back.out(2)' }
  )
  prevPoints = newVal
})

// ── 合成 Overlay 動畫 ────────────────────────────────────────────────────
watch(() => state.synthModal, (val) => {
  if (!val) synthResultRevealed.value = false
})

watch(() => state.synthModal?.phase, async (phase) => {
  if (phase !== 'animate') return
  synthResultRevealed.value = false
  await nextTick()

  const ingrEls = synthStageEl.value?.querySelectorAll('.synth-ov-card-item .mini-card')
  const plusEls = synthStageEl.value?.querySelectorAll('.synth-ov-plus, .synth-ov-arrow')

  if (ingrEls?.length) {
    gsap.to([...ingrEls], {
      scale: 0, rotation: 180, opacity: 0,
      duration: 0.45, stagger: 0.08, ease: 'power2.in',
    })
  }
  if (plusEls?.length) {
    gsap.to([...plusEls], { opacity: 0, duration: 0.3, delay: 0.1 })
  }

  setTimeout(async () => {
    synthResultRevealed.value = true
    await nextTick()
    const resultEl = synthStageEl.value?.querySelector('.synth-result-glow')
    if (resultEl) {
      gsap.from(resultEl, {
        scale: 0, rotation: -20, opacity: 0,
        duration: 0.75, ease: 'back.out(2.5)',
      })
    }
    setTimeout(() => { completeSynthesis() }, 1400)
  }, 650)
})

// ── 合成成功動畫 ──────────────────────────────────────────────────────────
watch(() => state.synthesisFeedback, (val) => {
  if (val === 'success') {
    nextTick(() => {
      const fb = document.querySelector('.synth-feedback.success')
      if (fb) gsap.from(fb, { scale: 0.5, opacity: 0, duration: 0.5, ease: 'back.out(3)' })
      // 閃光卡出場動畫
      const shiny = document.querySelectorAll('.arsenal-card-wrap.is-shiny')
      if (shiny.length) {
        gsap.from(shiny, { scale: 0.8, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(2)', delay: 0.3 })
      }
    })
  }
})

onMounted(() => {
  gsap.from('.top-nav', { y: -60, opacity: 0, duration: 0.6, ease: 'power3.out' })
  nowInterval = setInterval(() => { now.value = Date.now() }, 1000)

  // 讓 nav 在首次渲染後滑入（double rAF 確保 CSS transition 觸發）
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { navShow.value = true })
  })

  // 下滑隱藏 / 上滑顯示 nav（非 stack view 時才監聽 main-content）
  if (mainEl.value) {
    mainEl.value.addEventListener('scroll', () => {
      // stack view 有自己的 scroller，跳過
      if (state.activeTab === 'combat' && !state.newsDetailMode) return
      const y = mainEl.value.scrollTop
      if (y > lastScrollY + 8 && y > 60) {
        navHidden.value = true
      } else if (y < lastScrollY - 8) {
        navHidden.value = false
      }
      lastScrollY = y
    }, { passive: true })
  }
})


onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval)
  if (nowInterval) clearInterval(nowInterval)
})
</script>
