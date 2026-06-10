<template>
  <div class="fan-wrapper">

    <!-- 說明文字 -->
    <p class="fan-hint">輕觸卡片展開，再次點擊查看全卡</p>

    <!-- Fan hand -->
    <div class="fan-hand">
      <div
        v-for="(card, i) in cards"
        :key="card.id"
        class="fan-outer"
        :style="getOuterStyle(i, cards.length)"
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
import { ref, computed } from 'vue'
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

function getOuterStyle(i, total) {
  const center = (total - 1) / 2
  const angle = (i - center) * 5 // 每張卡旋轉 5deg 差距
  // 中間卡 z-index 最高，讓中心卡片在最上層
  const zIdx = Math.max(1, Math.round(total * 2 - Math.abs(i - center) * 2))
  return {
    transform: `rotate(${angle}deg)`,
    zIndex: zIdx,
  }
}

function handleTap(cardId) {
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
