<template>
  <div class="fcard-overlay" @click.self="$emit('close')">
    <div class="fcard-container">

      <!-- Card frame（外框 checkered，左側 strip，右側白色內容）-->
      <div
        class="fcard-frame"
        :class="{ 'fcard-shiny': isShiny }"
        :style="frameStyle"
      >
        <!-- Left category strip -->
        <div class="fcard-strip" :style="{ background: card.accentColor }">
          <span class="fcard-strip-text">{{ stripLabel }}</span>
        </div>

        <!-- Main body -->
        <div class="fcard-body">

          <!-- Watermark background text -->
          <div class="fcard-watermark" aria-hidden="true">
            ASSETS&nbsp;&nbsp;ASSETS&nbsp;&nbsp;ASSETS&nbsp;&nbsp;ASSETS
          </div>

          <!-- Illustration oval -->
          <div class="fcard-illus-area">
            <div class="fcard-illus-oval" :style="{ borderColor: ovalBorderColor }">
              <img
                v-if="!imgFailed"
                :src="cardImage"
                :alt="card.name"
                class="fcard-img"
                @error="imgFailed = true"
              />
              <span v-else class="fcard-glyph">{{ typeGlyph }}</span>
            </div>
            <!-- Rarity / Sponsor tag -->
            <span class="fcard-rarity-tag" :style="rarityTagStyle">
              {{ rarityLabel }}
            </span>
          </div>

          <!-- Title zone -->
          <div class="fcard-title-zone">
            <p class="fcard-name-en">「{{ card.nameEn }}」</p>
            <h2 class="fcard-name">{{ card.name }}</h2>
          </div>

          <!-- Description -->
          <div class="fcard-desc-zone">
            <p class="fcard-desc">{{ card.description }}</p>
            <div class="fcard-tags">
              <span v-for="t in card.tags" :key="t" class="tag-chip small">{{ t }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="fcard-footer">
            <span class="fcard-source">DigiTimes 科技新聞</span>
            <div class="fcard-badge" :style="{ background: card.accentColor }">
              <span class="fcard-power">{{ Math.abs(card.power) }}</span>
            </div>
          </div>

        </div>
      </div>

      <!-- Action slot -->
      <div class="fcard-action">
        <slot name="action" />
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { TYPE_LABELS } from '../data/combat.js'

const props = defineProps({
  card: { type: Object, required: true },
})
defineEmits(['close'])

const imgFailed = ref(false)
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

const glyphs = { asset: '⬡', tech: '◈', strategy: '▲', sponsor: '★' }
const typeGlyph = computed(() => glyphs[props.card?.type] || '◉')

const cardImage = computed(() => {
  if (!props.card) return ''
  if (props.card.sponsor) return `${BASE}/images/cards/figure-sponsored-001.jpg`
  if (props.card.type === 'tech') return `${BASE}/images/cards/assest-002.jpg`
  return `${BASE}/images/cards/assest-001.jpg`
})

const isShiny = computed(() =>
  props.card?.rarity === 'epic' || props.card?.sponsor === true
)

const stripLabel = computed(() => TYPE_LABELS[props.card?.type] || props.card?.type || 'ASSETS')

const ovalBorderColor = computed(() => {
  const c = props.card?.accentColor || '#3B82F6'
  return c + '40' // ~25% opacity hex
})

const rarityMap = {
  common: { label: 'COMMON', bg: '#64748B' },
  rare:   { label: 'RARE ✦', bg: '#F97316' },
  epic:   { label: 'EPIC ✦✦', bg: '#8B5CF6' },
}
const rarityLabel = computed(() =>
  props.card?.sponsor ? '★ SPONSOR' : (rarityMap[props.card?.rarity]?.label || 'COMMON')
)
const rarityTagStyle = computed(() => ({
  background: props.card?.sponsor ? '#E31837' : (rarityMap[props.card?.rarity]?.bg || '#64748B'),
}))

const frameStyle = computed(() => ({
  '--card-accent': props.card?.accentColor || '#3B82F6',
}))
</script>
