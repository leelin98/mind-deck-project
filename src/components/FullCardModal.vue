<template>
  <div class="fcard-overlay" @click.self="$emit('close')">
    <div class="fcard-simple">
      <button class="fcard-simple-close" @click="$emit('close')">✕</button>
      <img
        v-if="!imgFailed"
        :src="cardImage"
        :alt="card.name"
        class="fcard-pure-img"
        @error="imgFailed = true"
      />
      <div v-else class="fcard-pure-fallback" :style="{ background: card.accentColor || '#3B82F6' }">
        <span class="fcard-pure-glyph">{{ glyphs[card.type] || '◉' }}</span>
        <p>{{ card.name }}</p>
      </div>
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  card: { type: Object, required: true },
})
defineEmits(['close'])

const imgFailed = ref(false)
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')
const glyphs = { asset: '⬡', tech: '◈', strategy: '▲', sponsor: '★' }

const cardImage = computed(() => {
  if (!props.card) return ''
  if (props.card.sponsor) return `${BASE}/images/cards/figure-sponsored-001.jpg`
  if (props.card.type === 'tech') return `${BASE}/images/cards/assest-002.jpg`
  return `${BASE}/images/cards/assest-001.jpg`
})
</script>
