<template>
  <div class="mind-deck">
    <!-- 首次進入遮蓋（全螢幕固定） -->
    <Transition name="modal">
      <div
        v-if="showIntro"
        class="intro-cover"
        :style="{ backgroundImage: `url(${BASE_URL}/cover.png)` }"
        @click.self="showIntro = false"
      ></div>
    </Transition>

    <!-- ── Top Nav ── -->
    <header class="top-nav">
      <div class="nav-brand" @click="goBrandHome">
        <img
          :src="`${BASE_URL}/images/ui/logo-icon.png`"
          alt=""
          class="brand-icon-img"
        />
        <img
          :src="`${BASE_URL}/images/ui/logo.png`"
          alt="腦補計畫"
          class="brand-logo-img"
        />
      </div>
      <div class="nav-user">
        <div class="streak-chip">
          <!-- 搖曳火焰 SVG：外焰橘、內焰黃，各自獨立擺動 -->
          <svg class="streak-fire" viewBox="0 0 24 24" aria-hidden="true">
            <path
              class="flame-outer"
              d="M12 2C12.5 5.5 7 8.5 7 14a5 5 0 0 0 10 0c0-2.4-1.2-4.5-2.4-6.2C13.6 6.4 12.3 4.3 12 2z"
              fill="#F97316"
            />
            <path
              class="flame-inner"
              d="M12 21a3 3 0 0 1-3-3c0-1.7 1.2-2.7 2-3.7.5-.7.9-1.4 1-2.2 1.3 1.3 3 3.3 3 5.9a3 3 0 0 1-3 3z"
              fill="#FBBF24"
            />
          </svg>
          <span class="streak-value">{{ state.streak }}</span>
        </div>
        <div class="points-chip">
          <span class="points-icon">◈</span>
          <span class="points-value" ref="pointsEl">{{ state.points }}</span>
        </div>
      </div>
    </header>

    <!-- ── Main Content ── -->
    <main
      class="main-content"
      :class="{ 'main-flush-bottom': !!state.newsDetailMode }"
      ref="mainEl"
    >
      <!-- 內層 wrapper：Lenis content，高度隨內容變化讓 ResizeObserver 正確更新捲動範圍 -->
      <div class="main-inner" ref="mainInnerEl">
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
              @touchend.passive="onStackTouchEnd"
            >
              <!-- 今日新聞卡（z-index 最低，始終可見） -->
              <div
                class="stack-card"
                :style="{
                  '--card-bg':
                    topicColors[state.todayNews?.topic] ||
                    'linear-gradient(135deg,#FFEDD5,#FED7AA)',
                  zIndex: 1,
                }"
                @click="openNewsDetail(state.todayNews.id)"
              >
                <div class="stack-hero">
                  <img
                    v-if="state.todayNews?.image"
                    :src="`${BASE_URL}${state.todayNews.image}`"
                    class="stack-hero-img"
                    :alt="state.todayNews.title"
                    @error="$event.target.style.display = 'none'"
                  />
                  <div class="stack-hero-overlay"></div>
                  <span class="stack-badge today-badge stack-hero-badge"
                    >今日挑戰</span
                  >
                </div>
                <div class="stack-card-body">
                  <div class="stack-card-meta">
                    <span class="stack-source">{{
                      state.todayNews.source
                    }}</span>
                    <span class="stack-pts-pill"
                      >{{ state.todayNews.difficulty }} pts</span
                    >
                  </div>
                  <div class="stack-tags">
                    <span
                      v-for="tag in state.todayNews?.tags || []"
                      :key="tag"
                      class="stack-tag"
                      >{{ tag }}</span
                    >
                  </div>
                  <h2 class="stack-title">{{ state.todayNews.title }}</h2>
                  <p class="stack-sub">{{ state.todayNews.subtitle }}</p>
                  <span class="stack-cta">開始挑戰 →</span>
                </div>
              </div>

              <!-- 過往新聞卡（從下方滑入覆蓋今日卡，z-index 依序疊高，通關後不顯示） -->
              <div
                v-for="(news, i) in stackPrevNews"
                :key="news.id"
                class="stack-card"
                :style="{
                  '--card-bg':
                    topicColors[news.topic] ||
                    'linear-gradient(135deg,#F1F5F9,#E2E8F0)',
                  zIndex: i + 2,
                  transform: prevCardTransform(i),
                }"
                @click="openNewsDetail(news.id)"
              >
                <div class="stack-hero">
                  <img
                    v-if="news.image"
                    :src="`${BASE_URL}${news.image}`"
                    class="stack-hero-img"
                    :alt="news.title"
                    @error="$event.target.style.display = 'none'"
                  />
                  <div class="stack-hero-overlay"></div>
                  <span
                    class="stack-badge stack-hero-badge"
                    :class="
                      getNewsLockRemaining(news.id) > 0
                        ? 'locked-badge'
                        : 'pending-badge'
                    "
                  >
                    {{
                      getNewsLockRemaining(news.id) > 0
                        ? `🔒 ${formatLock(getNewsLockRemaining(news.id))}`
                        : "未挑戰"
                    }}
                  </span>
                </div>
                <div class="stack-card-body">
                  <div class="stack-card-meta">
                    <span class="stack-source">{{ news.source }}</span>
                    <span class="stack-pts-pill"
                      >{{ news.difficulty }} pts</span
                    >
                  </div>
                  <div class="stack-tags">
                    <span
                      v-for="tag in news.tags || []"
                      :key="tag"
                      class="stack-tag"
                      >{{ tag }}</span
                    >
                  </div>
                  <h2 class="stack-title">{{ news.title }}</h2>
                  <p class="stack-sub">{{ news.subtitle }}</p>
                  <span class="stack-date">{{ news.date }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 新聞詳細頁 -->
          <div v-else class="news-detail-view">
            <div class="detail-nav" :class="{ 'detail-nav-hidden': navHidden }">
              <button class="detail-back-btn" @click="closeNewsDetail">
                ← 返回
              </button>
              <span class="detail-nav-label">{{
                state.activeNews?.source
              }}</span>
            </div>

            <!-- SELECT 階段 -->
            <template v-if="state.combatPhase === 'select'">
              <div class="news-article">
                <div class="article-img-wrap">
                  <img
                    v-if="!articleImgFailed && state.activeNews?.image"
                    :src="`${BASE_URL}${state.activeNews.image}`"
                    :alt="state.activeNews.title"
                    class="article-img"
                    @error="articleImgFailed = true"
                  />
                  <div
                    v-else
                    class="article-img-fallback"
                    :style="articleHeaderStyle"
                  ></div>
                </div>
                <div class="article-meta">
                  <span class="news-source-dark">{{
                    state.activeNews?.source
                  }}</span>
                  <span class="article-date">{{ state.activeNews?.date }}</span>
                </div>
                <h1 class="article-title">{{ state.activeNews?.title }}</h1>
                <div class="article-tags">
                  <span
                    v-for="tag in state.activeNews?.tags || []"
                    :key="tag"
                    class="tag-chip"
                    >{{ tag }}</span
                  >
                </div>
                <div class="article-body">
                  <p
                    v-for="(para, pIdx) in parsedArticle"
                    :key="pIdx"
                    class="article-para"
                  >
                    <template v-for="(part, i) in para" :key="i">
                      <span v-if="part.type === 'text'">{{
                        part.content
                      }}</span>
                      <button
                        v-else-if="part.type === 'term'"
                        class="term-highlight"
                        @click="openTermCard(part.content)"
                      >
                        {{ part.content }}
                      </button>
                    </template>
                  </p>
                </div>
              </div>

              <!-- 出牌區（已通關或歸檔不顯示）-->
              <div
                v-if="
                  !state.activeNews?.completed && !state.activeNews?.archived
                "
                class="fan-stage"
              >
                <div class="fan-stage-header">
                  <span class="fan-stage-label">選擇 3 張資產卡出戰</span>
                  <span class="fan-stage-count"
                    >{{ selectedCardIds.length }}/3</span
                  >
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
                    <span
                      v-if="selectedCardIds.length < 3"
                      class="btn-card-count"
                      >{{ selectedCardIds.length }}/3</span
                    >
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
            <div v-else class="tab-panel" ref="resultPanelEl">
              <!-- reveal 與 result 共用：解析數值框永遠顯示 -->
              <div
                v-if="
                  state.combatPhase === 'reveal' ||
                  state.combatPhase === 'result'
                "
                class="reveal-phase"
              >
                <BattleFormula :result="state.combatResult" />
              </div>

              <!-- result：成功訊息接在解析框下方 -->
              <div
                v-if="state.combatPhase === 'result'"
                class="result-phase"
                ref="resultSuccessEl"
              >
                <div class="result-card success">
                  <div class="result-icon">🏆</div>
                  <h3 class="result-title">解析成功！</h3>
                  <p class="result-pts" v-if="state.combatResult?.pointsDelta">
                    +{{ state.combatResult.pointsDelta }} pts
                  </p>
                  <p
                    v-if="state.combatResult?.matched?.length"
                    class="result-match"
                  >
                    ✦ 共鳴標籤：{{ state.combatResult.matched.join("、") }}
                  </p>
                  <p
                    v-if="state.combatResult?.antidoteSuccess"
                    class="result-antidote"
                  >
                    💊 解藥成功 — 已獲得新資產卡
                  </p>
                  <div class="result-news-card-earned">
                    <img
                      :src="`${BASE_URL}/images/cards/news-001.jpg`"
                      class="result-news-card-img"
                      alt="新聞卡"
                    />
                    <span class="result-news-card-label"
                      >🎴 新聞卡已加入資產庫</span
                    >
                  </div>
                  <button class="btn-secondary" @click="goToArsenal">
                    看新卡片 →
                  </button>
                </div>
              </div>

              <div v-else-if="state.combatPhase === 'fail'" class="fail-phase">
                <div class="result-card fail">
                  <div class="result-icon">⚠</div>
                  <h3 class="result-title">情報不足！</h3>
                  <p class="result-desc">偵測到未知領域盲區</p>
                  <a
                    :href="state.activeNews?.antidoteUrl"
                    target="_blank"
                    class="btn-antidote puffy-btn"
                  >
                    🔗 前往情報站獲取解藥
                  </a>
                  <button
                    class="btn-secondary mt-2"
                    @click="state.combatPhase = 'antidote'"
                  >
                    已取得解藥 — 輸入關鍵字
                  </button>
                </div>
              </div>

              <div
                v-else-if="state.combatPhase === 'antidote'"
                class="antidote-phase"
              >
                <div class="antidote-card">
                  <p class="antidote-label">輸入解藥關鍵字</p>
                  <p class="antidote-hint">
                    {{
                      state.activeNews?.antidoteHint ||
                      "（提示：回想今日新聞關鍵字）"
                    }}
                  </p>
                  <input
                    v-model="state.antidoteInput"
                    class="antidote-input"
                    :class="{ error: state.antidoteError }"
                    placeholder="關鍵字…"
                    @keyup.enter="submitAntidote"
                  />
                  <p v-if="state.antidoteError" class="antidote-error">
                    ✕ 關鍵字不符，再試一次
                  </p>
                  <button
                    class="btn-combat puffy-btn mt-3"
                    @click="submitAntidote"
                  >
                    💊 驗證解鎖新資產
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ══ ARSENAL TAB ══ -->
        <section v-else-if="state.activeTab === 'arsenal'" class="arsenal-tab">
          <!-- 知識庫大標 -->
          <div class="section-title-row arsenal-section-title">
            <h2 class="section-title">我的知識庫</h2>
            <span class="section-sub"
              >{{ ownedCards.length }} 張卡片已收錄</span
            >
          </div>

          <!-- 資產行 -->
          <div class="arsenal-row-section">
            <div class="arsenal-row-header">
              <span class="arsenal-row-label">資產</span>
              <span class="arsenal-row-count">{{ assetCards.length }}</span>
            </div>
            <div class="arsenal-carousel-wrap">
              <Swiper
                v-if="assetCards.length > 0"
                :modules="[Autoplay]"
                :slides-per-view="'auto'"
                :space-between="12"
                :loop="true"
                :grab-cursor="true"
                :autoplay="{
                  delay: 0,
                  disableOnInteraction: false,
                  reverseDirection: false,
                  waitForTransition: false,
                  pauseOnMouseEnter: false,
                }"
                :speed="4500"
                class="cards-swiper"
                @swiper="onAssetSwiper"
              >
                <SwiperSlide
                  v-for="(card, idx) in [
                    ...assetCards,
                    ...assetCards,
                    ...assetCards,
                  ]"
                  :key="`asset-${idx}`"
                  class="cards-swiper-slide"
                  :class="{
                    'new-card': card.id === state.lastSynthesizedCardId,
                  }"
                  @click="openFullCard(card.id)"
                >
                  <img
                    :src="getCardImage(card)"
                    :alt="card.name"
                    class="carousel-card-img"
                  />
                  <span class="carousel-card-name">{{ card.name }}</span>
                </SwiperSlide>
              </Swiper>
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
              <Swiper
                v-if="techCards.length > 0"
                :modules="[Autoplay]"
                :slides-per-view="'auto'"
                :space-between="12"
                :loop="true"
                :grab-cursor="true"
                :autoplay="{
                  delay: 0,
                  disableOnInteraction: false,
                  reverseDirection: true,
                  waitForTransition: false,
                  pauseOnMouseEnter: false,
                }"
                :speed="4500"
                class="cards-swiper"
                @swiper="onTechSwiper"
              >
                <SwiperSlide
                  v-for="(card, idx) in [
                    ...techCards,
                    ...techCards,
                    ...techCards,
                  ]"
                  :key="`tech-${idx}`"
                  class="cards-swiper-slide"
                  @click="openFullCard(card.id)"
                >
                  <img
                    :src="getCardImage(card)"
                    :alt="card.name"
                    class="carousel-card-img"
                  />
                  <span class="carousel-card-name">{{ card.name }}</span>
                </SwiperSlide>
              </Swiper>
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
              <Swiper
                v-if="strategyCards.length > 0"
                :modules="[Autoplay]"
                :slides-per-view="'auto'"
                :space-between="12"
                :loop="true"
                :grab-cursor="true"
                :autoplay="{
                  delay: 0,
                  disableOnInteraction: false,
                  reverseDirection: false,
                  waitForTransition: false,
                  pauseOnMouseEnter: false,
                }"
                :speed="4500"
                class="cards-swiper"
                @swiper="onStrategySwiper"
              >
                <SwiperSlide
                  v-for="(card, idx) in [
                    ...strategyCards,
                    ...strategyCards,
                    ...strategyCards,
                  ]"
                  :key="`strat-${idx}`"
                  class="cards-swiper-slide"
                  @click="openFullCard(card.id)"
                >
                  <img
                    :src="getCardImage(card)"
                    :alt="card.name"
                    class="carousel-card-img"
                  />
                  <span class="carousel-card-name">{{ card.name }}</span>
                </SwiperSlide>
              </Swiper>
              <p v-else class="carousel-empty">尚無策略卡</p>
            </div>
          </div>

          <!-- 新聞卡行（月份 accordion + fan out） -->
          <div class="arsenal-row-section">
            <div class="arsenal-row-header">
              <span class="arsenal-row-label">新聞卡</span>
              <span class="arsenal-row-count">{{
                state.earnedNewsCards.length
              }}</span>
            </div>

            <div
              v-if="state.earnedNewsCards.length === 0"
              class="carousel-empty news-empty"
            >
              贏得新聞戰鬥後自動收錄
            </div>

            <div v-else class="news-accordion">
              <div
                v-for="[month, cards] in newsCardsByMonth"
                :key="month"
                class="news-month-block"
              >
                <div class="news-month-header" @click="toggleMonth(month)">
                  <span class="news-month-label">{{ formatMonth(month) }}</span>
                  <span class="news-month-count">{{ cards.length }} 張</span>
                  <span
                    class="news-month-arrow"
                    :class="{ open: expandedMonth === month }"
                    >›</span
                  >
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
                    @click="openNewsCardPreview(news)"
                  >
                    <img
                      :src="`${BASE_URL}/images/cards/news-001.jpg`"
                      :alt="news.title"
                      class="news-fan-img"
                    />
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
            <div
              v-for="recipe in SYNTHESIS_RECIPES"
              :key="recipe.id"
              class="recipe-card"
            >
              <p class="recipe-name">{{ recipe.name }}</p>
              <div class="recipe-flow">
                <div class="recipe-ingredients">
                  <span
                    v-for="(id, i) in recipe.ingredients"
                    :key="i"
                    class="ingredient-chip"
                  >
                    {{ getCard(id)?.name }}
                  </span>
                </div>
                <span class="recipe-arrow">→</span>
                <div class="recipe-result-wrap">
                  <span class="result-chip epic">{{
                    getCard(recipe.result)?.name
                  }}</span>
                </div>
              </div>
              <p class="recipe-desc">{{ recipe.description }}</p>
              <Transition name="modal">
                <div
                  v-if="state.synthesisFeedback === 'success'"
                  class="synth-feedback success"
                >
                  ✦ 融合成功！次世代晶圓已加入資產庫
                </div>
                <div
                  v-else-if="state.synthesisFeedback === 'error'"
                  class="synth-feedback error"
                >
                  ✕ 材料不足（需要 3 張一般圓形晶圓）
                </div>
              </Transition>
              <button
                class="btn-synth puffy-btn"
                @click="openSynthesisModal(recipe.id)"
              >
                ⬡ 融合資產，解鎖高階燃料
              </button>
            </div>
          </div>
        </section>

        <!-- ══ ENCYCLOPEDIA TAB ══ -->
        <section
          v-else-if="state.activeTab === 'encyclopedia'"
          class="tab-panel"
        >
          <div class="section-title-row">
            <h2 class="section-title">科技百科</h2>
            <span class="section-sub">自主刷題解鎖</span>
          </div>

          <div class="encyclopedia-grid">
            <div
              v-for="(item, idx) in encyclopediaItems"
              :key="item.id"
              class="encyclopedia-grid-item"
              :class="{ owned: item.owned, locked: !item.owned }"
              @click="openEncyclopediaCard(item.id)"
            >
              <div class="grid-card-img-wrap">
                <img
                  :src="getCardImage(item)"
                  :alt="item.name"
                  class="grid-card-img"
                />
                <span v-if="!item.owned" class="grid-card-lock">🔒</span>
              </div>
              <span class="grid-card-num"
                >#{{ String(idx + 1).padStart(3, "0") }}</span
              >
            </div>
          </div>
        </section>

        <!-- ══ PROFILE TAB ══ -->
        <section v-else-if="state.activeTab === 'profile'" class="tab-panel">
          <div class="profile-hero">
            <div class="profile-avatar">
              <img
                :src="`${BASE_URL}/images/user/avatar.jpg`"
                alt="使用者頭像"
                class="profile-avatar-img"
              />
            </div>
            <h2 class="profile-name">戰略家 {{ state.userId }}</h2>
            <p class="profile-email">lee.lin@digitimes.com</p>
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
              <div
                v-for="item in state.redeemItems"
                :key="item.id"
                class="redeem-item"
              >
                <span class="redeem-icon">{{ item.icon }}</span>
                <div class="redeem-info">
                  <span class="redeem-name">{{ item.name }}</span>
                  <span class="redeem-cost">{{ item.cost }} PTS</span>
                </div>
                <button class="redeem-btn" :disabled="state.points < item.cost">
                  {{ state.points >= item.cost ? "兌換" : "不足" }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- ── 置底漂浮選單 ── -->
    <nav
      class="bottom-nav"
      :class="{
        'nav-show': navShow,
        'nav-hidden': navHidden || anyModalOpen || !!state.newsDetailMode,
      }"
    >
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

    <!-- ── 百科 Modal（含新聞專有名詞）── -->
    <Transition name="modal">
      <div
        v-if="state.encyclopediaModal"
        class="modal-overlay"
        @click.self="closeEncyclopediaModal"
      >
        <div class="modal-panel encq-panel">
          <button class="encq-close-x-btn" @click="closeEncyclopediaModal">
            ✕
          </button>

          <!-- UNLOCK 模式：鎖定卡片答題解鎖 -->
          <template v-if="state.encyclopediaModal.mode === 'unlock'">
            <p class="modal-tag">答題解鎖挑戰</p>
            <p v-if="state.encyclopediaModal.quiz?.teaser" class="encq-teaser">
              {{ state.encyclopediaModal.quiz.teaser }}
            </p>

            <h3 class="modal-q">
              {{ state.encyclopediaModal.quiz?.scenario }}
            </h3>

            <!-- 冷卻中（重新打開時）：題目可看，但選項鎖定 -->
            <template
              v-if="
                !state.encyclopediaModal.answer &&
                state.encyclopediaModal.cooldownEnd &&
                cooldownRemaining > 0
              "
            >
              <div class="modal-options">
                <button
                  v-for="opt in state.encyclopediaModal.quiz?.options"
                  :key="opt.label"
                  class="modal-opt"
                  disabled
                >
                  <span class="opt-label">{{ opt.label }}</span>
                  <span class="opt-text">{{ opt.text }}</span>
                </button>
              </div>
              <p class="encq-cooldown-note">
                ⏳ 答錯鎖定中，{{ formatCooldown(cooldownRemaining) }}
                後可重新作答
              </p>
              <a
                :href="
                  state.encyclopediaModal.quiz?.recommendedReading?.url ||
                  'https://www.digitimes.com.tw/'
                "
                target="_blank"
                class="btn-antidote puffy-btn encq-reading-btn"
              >
                📖 推薦閱讀：{{
                  state.encyclopediaModal.quiz?.recommendedReading?.title ||
                  "相關文章"
                }}
              </a>
            </template>

            <!-- 未作答 -->
            <template v-else-if="!state.encyclopediaModal.answer">
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

            <!-- 已作答 -->
            <div v-else class="modal-feedback">
              <template
                v-if="
                  state.encyclopediaModal.quiz?.options.find(
                    (o) => o.label === state.encyclopediaModal.answer,
                  )?.correct
                "
              >
                <p class="feedback-correct">
                  ✦ {{ state.encyclopediaModal.quiz.successMessage }}
                </p>
                <p class="feedback-reward">
                  🎴 {{ state.encyclopediaModal.quiz.reward }}
                </p>
              </template>
              <template v-else>
                <p class="feedback-wrong">
                  {{ state.encyclopediaModal.quiz?.failMessage }}
                </p>
                <p class="encq-cooldown-note">
                  已鎖定 30 分鐘，期間可閱讀推薦文章再回來挑戰。
                </p>
                <a
                  :href="
                    state.encyclopediaModal.quiz?.recommendedReading?.url ||
                    'https://www.digitimes.com.tw/'
                  "
                  target="_blank"
                  class="btn-antidote puffy-btn encq-reading-btn"
                >
                  📖 推薦閱讀：{{
                    state.encyclopediaModal.quiz?.recommendedReading?.title ||
                    "相關文章"
                  }}
                </a>
              </template>
            </div>
          </template>

          <!-- LOCKED 模式：未擁有且無題目，顯示解鎖提示 -->
          <template v-else-if="state.encyclopediaModal.mode === 'locked'">
            <div class="encq-card-detail">
              <img
                :src="getCardImage(state.encyclopediaModal.card)"
                :alt="state.encyclopediaModal.card.name"
                class="encq-detail-img encq-detail-img--locked"
              />
              <div>
                <h3 class="encq-detail-name">
                  {{ state.encyclopediaModal.card.name }}
                </h3>
                <p class="encq-detail-name-en">
                  {{ state.encyclopediaModal.card.nameEn }}
                </p>
              </div>
              <p class="encq-locked-hint">
                🔒
                {{
                  state.encyclopediaModal.card.synthesized
                    ? "此卡需透過「資產進化艙」融合解鎖"
                    : "答題挑戰即將開放，敬請期待"
                }}
              </p>
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- ── 新聞卡預覽 Modal（與資產卡全卡同樣式）── -->
    <Transition name="modal">
      <div
        v-if="state.newsCardPreview"
        class="fcard-overlay"
        @click.self="closeNewsCardPreview"
      >
        <div class="fcard-simple">
          <button class="fcard-simple-close" @click="closeNewsCardPreview">
            ✕
          </button>
          <img
            :src="`${BASE_URL}/images/cards/news-001.jpg`"
            :alt="state.newsCardPreview.news.title"
            class="fcard-pure-img"
            @click="goToNewsFromCard(state.newsCardPreview.news)"
          />
          <p class="news-card-preview-hint">點擊卡片進入新聞</p>
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
            <!-- 第一排：材料卡 -->
            <div class="synth-ov-ingredients">
              <template
                v-for="(cardId, idx) in currentRecipe?.ingredients ?? []"
                :key="idx"
              >
                <div class="synth-ov-card-item" :class="`synth-ingr-${idx}`">
                  <MiniCard :card="getCard(cardId)" />
                </div>
                <span
                  v-if="idx < (currentRecipe?.ingredients.length ?? 0) - 1"
                  class="synth-ov-plus"
                  >+</span
                >
              </template>
            </div>

            <!-- 第二排：融合結果卡 -->
            <div class="synth-ov-result-row">
              <span class="synth-ov-arrow">↓</span>
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
            <button
              class="btn-combat puffy-btn"
              :disabled="!canSynthesize"
              @click="handleSynthesisConfirm"
            >
              ⬡ 確認融合
            </button>
            <button class="btn-secondary mt-2" @click="closeSynthModal">
              取消
            </button>
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { gsap } from "gsap";
import Lenis from "lenis";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import { useGameStore } from "../composables/useGameStore.js";
import MiniCard from "./MiniCard.vue";
import BattleFormula from "./BattleFormula.vue";
import FanHand from "./FanHand.vue";
import FullCardModal from "./FullCardModal.vue";

const {
  state,
  ownedCards,
  encyclopediaItems,
  PREV_NEWS,
  SYNTHESIS_RECIPES,
  selectSlot,
  removeSlot,
  openNewsDetail,
  closeNewsDetail,
  startCombat,
  submitAntidote,
  resetCombat,
  openTermCard,
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
} = useGameStore();

const TABS = [
  { id: "combat", icon: "⚔", label: "每日挑戰" },
  { id: "arsenal", icon: "⬡", label: "我的資產" },
  { id: "encyclopedia", icon: "◈", label: "科技百科" },
  { id: "profile", icon: "👤", label: "我的" },
];

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

const pointsEl = ref(null);
const mainEl = ref(null);
const mainInnerEl = ref(null);
const combatSectionEl = ref(null);
const synthModuleEl = ref(null);
const synthStageEl = ref(null);
const resultSuccessEl = ref(null);
const resultPanelEl = ref(null);
const articleImgFailed = ref(false);
const synthResultRevealed = ref(false);
const now = ref(Date.now());
const expandedMonth = ref(null);
let nowInterval = null;

// ── bottom nav 滾動顯示/隱藏 ─────────────────────────────────────────────────
const navShow = ref(false);
const navHidden = ref(false);
let lastScrollY = 0;

const anyModalOpen = computed(
  () =>
    !!(
      state.encyclopediaModal ||
      state.fullCardModal ||
      state.newsCardPreview ||
      state.synthModal
    ),
);

// ── 首次進入遮蓋 ──────────────────────────────────────────────────────
const showIntro = ref(true);

// ── Swiper 實例（用於 modal open/close 時恢復 autoplay）──────────────
let assetSwiperInstance = null;
let techSwiperInstance = null;
let strategySwiperInstance = null;
let swiperWatchdogId = null;

function onAssetSwiper(swiper) {
  assetSwiperInstance = swiper;
}
function onTechSwiper(swiper) {
  techSwiperInstance = swiper;
}
function onStrategySwiper(swiper) {
  strategySwiperInstance = swiper;
}

// 看門狗：拖曳、捲動、展開月份框等互動偶爾會讓 autoplay 卡住，定期檢查並重啟。
// 比對前後兩次 translate：即使 running 為 true，位置沒動就代表 transition 卡死。
function kickSwiperAutoplay(swiper) {
  if (!swiper || swiper.destroyed || !swiper.autoplay) return;
  if (swiper.touchEventsData?.isTouched) return; // 使用者拖曳中，不介入
  const cur = swiper.translate;
  const prev = swiper.__wdPrevTranslate;
  swiper.__wdPrevTranslate = cur;
  if (!swiper.autoplay.running) {
    swiper.autoplay.start();
  } else if (swiper.autoplay.paused) {
    swiper.autoplay.resume();
  } else if (prev !== undefined && prev === cur) {
    swiper.autoplay.stop();
    swiper.autoplay.start();
  }
}

// ── stack snap scroll（GSAP 吸附動畫） ──────────────────────────────────────
const stackScrollerEl = ref(null);
const stackScrollY = ref(0); // template 讀取，驅動 prevCardTransform
const stackScrollTgt = { value: 0 }; // GSAP 動畫的目標物件
const snapIndex = ref(0); // 目前吸附到第幾個位置（0=今日卡，1+=舊卡）
let isSnapping = false;
let accumWheel = 0;
let stackTouchY = 0;
let stackTouchDelta = 0;

// ── 主題色（依新聞 topic 動態變換）─────────────────────────────────────────
// 粉彩淺色漸層（文字改用深色）
const topicColors = {
  compute: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
  connect: "linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%)",
  intelligence: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
  sustainability: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)",
};

const newsHeaderStyle = computed(() => ({
  background:
    topicColors[state.todayNews?.topic] ||
    "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
}));

const articleHeaderStyle = computed(() => ({
  background:
    topicColors[state.activeNews?.topic] ||
    "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
}));

// ── 文章解析（支援 {{詞}} 點擊）──────────────────────────────────────────
const parsedArticle = computed(() => {
  const body = state.activeNews?.body;
  if (!body) return [];
  const termWord = state.activeNews?.highlightedTerm?.word;
  return body.split("\n\n").map((para) => {
    if (!termWord) return [{ type: "text", content: para }];
    const marker = `{{${termWord}}}`;
    const idx = para.indexOf(marker);
    if (idx === -1) return [{ type: "text", content: para }];
    const parts = [];
    if (idx > 0) parts.push({ type: "text", content: para.slice(0, idx) });
    parts.push({ type: "term", content: termWord });
    const after = idx + marker.length;
    if (after < para.length)
      parts.push({ type: "text", content: para.slice(after) });
    return parts;
  });
});

// ── 已選卡片 IDs（給 FanHand 用）────────────────────────────────────────
const selectedCardIds = computed(() =>
  state.selectedSlots.filter((id) => id !== null),
);

// ── 過往新聞（過濾已通關） ─────────────────────────────────────────────
const stackPrevNews = computed(() =>
  PREV_NEWS.filter((n) => !isNewsEarned(n.id)),
);

// ── Arsenal 分類（最後融合卡置頂）────────────────────────────────────
function sortWithSynthFirst(cards) {
  if (!state.lastSynthesizedCardId) return cards;
  return [...cards].sort((a, b) =>
    a.id === state.lastSynthesizedCardId
      ? -1
      : b.id === state.lastSynthesizedCardId
        ? 1
        : 0,
  );
}
const assetCards = computed(() =>
  sortWithSynthFirst(ownedCards.value.filter((c) => c.type === "asset")),
);
const techCards = computed(() =>
  sortWithSynthFirst(ownedCards.value.filter((c) => c.type === "tech")),
);
const strategyCards = computed(() =>
  sortWithSynthFirst(ownedCards.value.filter((c) => c.type === "strategy")),
);

// ── 新聞卡月份（降序，最新在上）─────────────────────────────────────
const newsCardsByMonth = computed(() => {
  const grouped = {};
  for (const news of state.earnedNewsCards) {
    const month = news.date ? news.date.substring(0, 7) : "unknown";
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(news);
  }
  return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
});

// ── 新聞鎖定狀態 ──────────────────────────────────────────────────────
const isCurrentNewsLocked = computed(() => {
  const until = state.newsLocks[state.activeNews?.id];
  if (!until) return false;
  return until > now.value;
});

const newsLockCountdown = computed(() => {
  if (!state.activeNews?.id) return "";
  return formatLock(
    Math.max(0, (state.newsLocks[state.activeNews.id] || 0) - now.value),
  );
});

// ── 合成 overlay ──────────────────────────────────────────────────────
const currentRecipe = computed(() =>
  state.synthModal
    ? SYNTHESIS_RECIPES.find((r) => r.id === state.synthModal.recipeId)
    : null,
);

const canSynthesize = computed(() => {
  if (!currentRecipe.value) return false;
  const counts = {};
  for (const id of currentRecipe.value.ingredients) {
    counts[id] = (counts[id] || 0) + 1;
  }
  return Object.entries(counts).every(
    ([cardId, needed]) =>
      state.cards.filter((c) => c.id === cardId && c.owned).length >= needed,
  );
});

function getCard(id) {
  return state.cards.find((c) => c.id === id);
}

function getCardImage(card) {
  if (card.cardImage) return `${BASE_URL}/images/cards/${card.cardImage}`;
  if (card.sponsor) return `${BASE_URL}/images/cards/figure-sponsored-001.jpg`;
  if (card.type === "tech") return `${BASE_URL}/images/cards/assest-002.jpg`;
  return `${BASE_URL}/images/cards/assest-001.jpg`;
}

function isNewsEarned(newsId) {
  return state.earnedNewsCards.some((n) => n.id === newsId);
}

function getNewsLockRemaining(newsId) {
  const until = state.newsLocks[newsId];
  if (!until) return 0;
  return Math.max(0, until - now.value);
}

function formatLock(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}時${m}分`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

function formatMonth(month) {
  if (!month || month === "unknown") return "未知月份";
  const [year, m] = month.split("-");
  return `${year}年${parseInt(m)}月`;
}

async function toggleMonth(month) {
  if (expandedMonth.value === month) {
    expandedMonth.value = null;
    await nextTick();
    lenis?.resize();
    return;
  }
  expandedMonth.value = month;
  await nextTick();
  lenis?.resize();
  const container = document.querySelector(`[data-month="${month}"]`);
  const items = container?.querySelectorAll(".news-fan-card");
  if (!items?.length) return;
  gsap.from([...items], {
    x: 0,
    y: 30,
    scale: 0.3,
    opacity: 0,
    duration: 0.5,
    stagger: { amount: 0.4, from: "start" },
    ease: "back.out(1.8)",
  });
}

function typeIcon(type) {
  const icons = { asset: "⬡", tech: "◈", strategy: "▲", sponsor: "★" };
  return icons[type] || "◉";
}

function handleFanPick(cardId) {
  const emptySlot = state.selectedSlots.indexOf(null);
  if (emptySlot === -1) return;
  selectSlot(emptySlot, cardId);
}

function handleFanRemove(cardId) {
  const slotIdx = state.selectedSlots.indexOf(cardId);
  if (slotIdx !== -1) removeSlot(slotIdx);
}

function handleSynthesisConfirm() {
  triggerSynthesisAnimate();
}

function scrollToCombat() {
  combatSectionEl.value?.scrollIntoView({ behavior: "smooth" });
}

function goToArsenal() {
  closeNewsDetail();
  nextTick(() => {
    switchTab("arsenal");
  });
}

// 點 logo：不論在哪（含新聞內頁）都回到新聞總覽
function goBrandHome() {
  closeNewsDetail();
  switchTab("combat");
}

function goToNewsFromCard(news) {
  closeNewsCardPreview();
  switchTab("combat");
  nextTick(() => {
    openNewsDetail(news.id);
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  mainEl.value?.scrollTo({ top: 0 });
  lastScrollY = 0;
  navHidden.value = false;
  // 重置 stack
  gsap.killTweensOf(stackScrollTgt);
  stackScrollTgt.value = 0;
  stackScrollY.value = 0;
  snapIndex.value = 0;
  isSnapping = false;
  accumWheel = 0;
  // 內容高度改變，更新 Lenis 捲動範圍並回到頂部
  nextTick(() => {
    lenis?.resize();
    lenis?.scrollTo(0, { immediate: true });
  });
}

// ── stack snap scroll handlers ────────────────────────────────────────────────
function _stackH() {
  return stackScrollerEl.value?.clientHeight || 0;
}

function _snapTo(idx) {
  const h = _stackH();
  if (!h) return;
  const targetY = idx * h;
  isSnapping = true;
  gsap.killTweensOf(stackScrollTgt);
  gsap.to(stackScrollTgt, {
    value: targetY,
    duration: 0.55,
    ease: "power4.out",
    onUpdate() {
      stackScrollY.value = stackScrollTgt.value;
    },
    onComplete() {
      snapIndex.value = idx;
      isSnapping = false;
      accumWheel = 0;
      stackTouchDelta = 0;
      // stack view 的 nav 永遠保持可見
    },
  });
}

function onStackWheel(e) {
  if (isSnapping) return;
  accumWheel += e.deltaY;
  const threshold = _stackH() * 0.12; // 12% 觸發 snap
  if (accumWheel > threshold && snapIndex.value < stackPrevNews.value.length) {
    _snapTo(snapIndex.value + 1);
  } else if (accumWheel < -threshold && snapIndex.value > 0) {
    _snapTo(snapIndex.value - 1);
  }
}

function onStackTouchStart(e) {
  stackTouchY = e.touches[0].clientY;
  stackTouchDelta = 0;
}

function onStackTouchMove(e) {
  const dy = stackTouchY - e.touches[0].clientY;
  stackTouchDelta = dy;
  // 手指拖動時即時預覽位移
  const h = _stackH();
  const baseY = snapIndex.value * h;
  stackScrollTgt.value = Math.max(
    0,
    Math.min(baseY + dy, stackPrevNews.value.length * h),
  );
  stackScrollY.value = stackScrollTgt.value;
}

function onStackTouchEnd() {
  const threshold = _stackH() * 0.12;
  if (
    stackTouchDelta > threshold &&
    snapIndex.value < stackPrevNews.value.length
  ) {
    _snapTo(snapIndex.value + 1);
  } else if (stackTouchDelta < -threshold && snapIndex.value > 0) {
    _snapTo(snapIndex.value - 1);
  } else {
    _snapTo(snapIndex.value); // 未達門檻，彈回
  }
}

// 計算第 i 張舊卡的 translateY（stackScrollY 驅動）
function prevCardTransform(i) {
  const h = stackScrollerEl.value?.clientHeight;
  if (!h) return "translateY(100%)";
  const progress = Math.max(0, Math.min(1, (stackScrollY.value - i * h) / h));
  return `translateY(${(1 - progress) * 100}%)`;
}

// ── 百科冷卻倒數 ──────────────────────────────────────────────────────────
const cooldownRemaining = ref(0);
let cooldownInterval = null;

watch(
  () => state.encyclopediaModal?.cooldownEnd,
  (endTime) => {
    if (cooldownInterval) {
      clearInterval(cooldownInterval);
      cooldownInterval = null;
    }
    if (!endTime) {
      cooldownRemaining.value = 0;
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, endTime - Date.now());
      cooldownRemaining.value = remaining;
      if (remaining === 0) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
        if (state.encyclopediaModal) state.encyclopediaModal.cooldownEnd = null;
      }
    };
    tick();
    cooldownInterval = setInterval(tick, 1000);
  },
  { immediate: true },
);

function formatCooldown(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}分 ${sec}秒` : `${sec}秒`;
}

// Modal open → 暫停 Lenis 及 Swiper autoplay；關閉後恢復
watch(anyModalOpen, (open) => {
  if (open) {
    lenis?.stop();
    assetSwiperInstance?.autoplay?.stop();
    techSwiperInstance?.autoplay?.stop();
    strategySwiperInstance?.autoplay?.stop();
  } else {
    lenis?.start();
    lenis?.resize();
    assetSwiperInstance?.autoplay?.start();
    techSwiperInstance?.autoplay?.start();
    strategySwiperInstance?.autoplay?.start();
  }
});

// 切換新聞時重置圖片狀態；離開詳細頁時恢復 nav
watch(
  () => state.newsDetailMode,
  (mode) => {
    articleImgFailed.value = false;
    if (!mode) navHidden.value = false;
  },
);

// 進入 result 階段時自動下滑到成功訊息
watch(
  () => state.combatPhase,
  async (phase) => {
    if (phase !== "result") return;
    await nextTick();
    resultSuccessEl.value?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  },
);

// ── 積分動畫 ──────────────────────────────────────────────────────────────
let prevPoints = state.points;
watch(
  () => state.points,
  (newVal) => {
    if (!pointsEl.value) return;
    gsap.fromTo(
      pointsEl.value,
      { scale: 1.4, color: newVal > prevPoints ? "#34d399" : "#f87171" },
      { scale: 1, color: "", duration: 0.5, ease: "back.out(2)" },
    );
    prevPoints = newVal;
  },
);

// ── 合成 Overlay 動畫 ────────────────────────────────────────────────────
watch(
  () => state.synthModal,
  (val) => {
    if (!val) synthResultRevealed.value = false;
  },
);

watch(
  () => state.synthModal?.phase,
  async (phase) => {
    if (phase !== "animate") return;
    synthResultRevealed.value = false;
    await nextTick();

    const ingrEls = synthStageEl.value?.querySelectorAll(
      ".synth-ov-card-item .mini-card",
    );
    const plusEls = synthStageEl.value?.querySelectorAll(
      ".synth-ov-plus, .synth-ov-arrow",
    );

    if (ingrEls?.length) {
      gsap.to([...ingrEls], {
        scale: 0,
        rotation: 180,
        opacity: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: "power2.in",
      });
    }
    if (plusEls?.length) {
      gsap.to([...plusEls], { opacity: 0, duration: 0.3, delay: 0.1 });
    }

    setTimeout(async () => {
      synthResultRevealed.value = true;
      await nextTick();
      const resultEl = synthStageEl.value?.querySelector(".synth-result-glow");
      if (resultEl) {
        gsap.from(resultEl, {
          scale: 0,
          rotation: -20,
          opacity: 0,
          duration: 0.75,
          ease: "back.out(2.5)",
        });
      }
      setTimeout(() => {
        completeSynthesis();
      }, 1400);
    }, 650);
  },
);

// ── 合成成功動畫 ──────────────────────────────────────────────────────────
watch(
  () => state.synthesisFeedback,
  (val) => {
    if (val === "success") {
      nextTick(() => {
        const fb = document.querySelector(".synth-feedback.success");
        if (fb)
          gsap.from(fb, {
            scale: 0.5,
            opacity: 0,
            duration: 0.5,
            ease: "back.out(3)",
          });
        // 閃光卡出場動畫
        const shiny = document.querySelectorAll(".arsenal-card-wrap.is-shiny");
        if (shiny.length) {
          gsap.from(shiny, {
            scale: 0.8,
            opacity: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "back.out(2)",
            delay: 0.3,
          });
        }
      });
    }
  },
);

let lenis = null;
let lenisRafId = null;

onMounted(() => {
  gsap.from(".top-nav", {
    y: -60,
    opacity: 0,
    duration: 0.6,
    ease: "power3.out",
  });
  nowInterval = setInterval(() => {
    now.value = Date.now();
  }, 1000);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      navShow.value = true;
    });
  });

  // Lenis 平滑滾動（非 stack view 用）
  // content 必須是內層元素：wrapper 高度固定，若兩者同元素
  // ResizeObserver 偵測不到內容增長，捲動範圍會卡在舊值（無法下滑）
  if (mainEl.value && mainInnerEl.value) {
    lenis = new Lenis({
      wrapper: mainEl.value,
      content: mainInnerEl.value,
      lerp: 0.12,
      smoothWheel: true,
    });

    lenis.on("scroll", ({ scroll, direction }) => {
      if (state.activeTab === "combat" && !state.newsDetailMode) return;
      if (direction > 0 && scroll > 60) navHidden.value = true;
      else if (direction < 0) navHidden.value = false;
      lastScrollY = scroll;
    });

    const raf = (time) => {
      lenis.raf(time);
      lenisRafId = requestAnimationFrame(raf);
    };
    lenisRafId = requestAnimationFrame(raf);
  }

  // Swiper autoplay 看門狗：每 2 秒確認輪播持續運轉
  swiperWatchdogId = setInterval(() => {
    if (state.activeTab !== "arsenal" || anyModalOpen.value) return;
    kickSwiperAutoplay(assetSwiperInstance);
    kickSwiperAutoplay(techSwiperInstance);
    kickSwiperAutoplay(strategySwiperInstance);
  }, 2000);
});

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval);
  if (nowInterval) clearInterval(nowInterval);
  if (swiperWatchdogId) clearInterval(swiperWatchdogId);
  if (lenisRafId) cancelAnimationFrame(lenisRafId);
  lenis?.destroy();
});
</script>
