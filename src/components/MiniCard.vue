<template>
  <img
    v-if="!imgErr"
    :src="cardImage"
    :alt="card?.name || ''"
    class="img-card-mini"
    @error="imgErr = true"
  />
  <div v-else class="img-card-mini img-card-fallback" :style="{ '--accent': card?.accentColor || '#3B82F6' }">
    <span>{{ card?.name?.[0] || '?' }}</span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({ card: Object })
const imgErr = ref(false)
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

const cardImage = computed(() => {
  if (!props.card) return ''
  if (props.card.sponsor) return `${BASE}/images/cards/figure-sponsored-001.jpg`
  if (props.card.type === 'tech') return `${BASE}/images/cards/assest-002.jpg`
  return `${BASE}/images/cards/assest-001.jpg`
})
</script>
