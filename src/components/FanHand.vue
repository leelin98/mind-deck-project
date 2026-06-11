<template>
  <div class="fan-wrapper">

    <!-- 說明文字 -->
    <p class="fan-hint">輕觸卡片展開，再次點擊查看全卡｜左右拖拉轉動牌圈</p>

    <!--
      Fan wheel：整組手牌是一個圓圈，可視範圍擷取上方扇形。
      左右拖拉 = 轉動圓圈（wheelAngle），每張卡固定間隔 STEP_DEG。
    -->
    <div class="fan-wheel">
      <div
        v-for="(card, i) in cards"
        :key="card.id"
        class="fan-spoke"
        :style="getSpokeStyle(i, cards.length)"
        @pointerdown="onPointerDown"
        @click.stop="handleTap(card.id)"
      >
        <div
          class="fan-inner"
          :class="{
            'fan-lifted': liftedId === card.id,
            'fan-dimmed': liftedId && liftedId !== card.id,
          }"
        >
          <MiniCard :card="card" />
          <span v-if="selectedIds.includes(card.id)" class="fan-tick">✓</span>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <p v-if="cards.length === 0" class="fan-empty">暫無可用資產卡</p>

    <!-- Full card overlay（第二次點擊） -->
    <Transition name="modal">
      <FullCardModal
        v-if="fullscreenCard"
        :card="fullscreenCard"
        @close="cancelFullscreen"
      >
        <template #action>
          <template v-if="!selectedIds.includes(fullscreenCard.id)">
            <button class="btn-combat puffy-btn" @click="confirmCard">
              ✦ 加入牌組
            </button>
          </template>
          <div v-else class="fan-in-deck">
            <span class="fan-in-deck-label">✓ 已加入牌組</span>
            <button class="btn-secondary fan-remove-btn" @click="removeCard">移除</button>
          </div>
        </template>
      </FullCardModal>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import MiniCard from './MiniCard.vue'
import FullCardModal from './FullCardModal.vue'

const props = defineProps({
  cards: { type: Array, default: () => [] },
  selectedIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['pick', 'remove'])

const liftedId = ref(null)
const fullscreenId = ref(null)

const fullscreenCard = computed(() =>
  fullscreenId.value ? (props.cards.find(c => c.id === fullscreenId.value) ?? null) : null
)

// ── 轉盤狀態 ──────────────────────────────────────────────────────
const STEP_DEG = 9 // 每張卡相隔角度
const DEG_PER_PX = 0.08 // 拖拉靈敏度（每 px 轉幾度）

const wheelAngle = ref(0) // 0 = 中央卡置中（初始即正中）
let dragStartX = 0
let dragStartAngle = 0
let dragMoved = false

// 轉動上限：最邊緣的卡最多轉到正中央
const maxAngle = computed(() => ((props.cards.length - 1) / 2) * STEP_DEG)

function getSpokeStyle(i, total) {
  const center = (total - 1) / 2
  const angle = (i - center) * STEP_DEG + wheelAngle.value
  return {
    transform: `rotate(${angle}deg)`,
    // 越接近正中央（angle 0）越上層
    zIndex: Math.max(1, 200 - Math.round(Math.abs(angle) * 4)),
  }
}

function onPointerDown(e) {
  dragStartX = e.clientX
  dragStartAngle = wheelAngle.value
  dragMoved = false
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e) {
  const dx = e.clientX - dragStartX
  if (Math.abs(dx) > 6) dragMoved = true
  const next = dragStartAngle + dx * DEG_PER_PX
  wheelAngle.value = Math.max(-maxAngle.value, Math.min(maxAngle.value, next))
}

function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  // click 事件在 pointerup 之後觸發，先保留 dragMoved 供 handleTap 判定
  setTimeout(() => { dragMoved = false }, 0)
}

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})

function handleTap(cardId) {
  if (dragMoved) return // 拖拉結束的誤觸不算點擊
  if (liftedId.value === cardId) {
    // 第二次點擊：展開全卡
    fullscreenId.value = cardId
    liftedId.value = null
  } else {
    // 第一次點擊：輕微上提
    liftedId.value = cardId
    fullscreenId.value = null
  }
}

function confirmCard() {
  if (!fullscreenCard.value) return
  emit('pick', fullscreenCard.value.id)
  fullscreenId.value = null
  liftedId.value = null
}

function removeCard() {
  if (!fullscreenCard.value) return
  emit('remove', fullscreenCard.value.id)
  fullscreenId.value = null
  liftedId.value = null
}

function cancelFullscreen() {
  fullscreenId.value = null
  liftedId.value = null
}
</script>
