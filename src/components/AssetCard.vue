<template>
  <img
    v-if="!imgErr"
    :src="cardImage"
    :alt="card?.name || ''"
    class="img-card-asset"
    @error="imgErr = true"
  />
  <div v-else class="img-card-asset img-card-fallback" :style="{ '--accent': card?.accentColor || '#3B82F6' }">
    <span>{{ card?.name?.[0] || '?' }}</span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({ card: Object })
const imgErr = ref(false)

const cardImage = computed(() => {
  if (!props.card) return ''
  if (props.card.sponsor) return '/images/cards/figure-sponsored-001.jpg'
  if (props.card.type === 'tech') return '/images/cards/assest-002.jpg'
  return '/images/cards/assest-001.jpg'
})
</script>
