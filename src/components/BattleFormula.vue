<template>
  <div class="battle-formula" ref="formulaEl">
    <h3 class="formula-title">⚔ 戰鬥解析中…</h3>
    <div class="formula-area">
      <div
        v-for="(step, i) in visibleSteps"
        :key="i"
        class="formula-row"
        :class="{ matched: step.matchedTag, separator: step.separator, final: step.final }"
        :ref="el => stepEls[i] = el"
      >
        <template v-if="step.separator">
          <div class="formula-sep-line"></div>
        </template>
        <template v-else-if="step.final">
          <div class="formula-row-main">
            <span class="formula-label final-label">最終解析結果</span>
            <span class="formula-eq">→</span>
            <span class="formula-value final-value" :class="step.value <= 0 ? 'good' : 'bad'">
              {{ step.value > 0 ? '+' : '' }}{{ step.value.toFixed(1) }}
            </span>
          </div>
        </template>
        <template v-else>
          <div class="formula-row-main">
            <span class="formula-label">{{ step.label }}</span>
            <span class="formula-eq">:</span>
            <span class="formula-value">{{ step.value }}</span>
            <template v-if="step.multiplier">
              <span class="formula-mult">× {{ step.multiplier }}</span>
              <span class="formula-match-tag">!! 共鳴！{{ step.matchedTag }} !!</span>
            </template>
          </div>
          <p v-if="step.bonusReason" class="formula-bonus-reason">{{ step.bonusReason }}</p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  result: Object,
})

const formulaEl = ref(null)
const stepEls = ref([])
const visibleSteps = ref([])

onMounted(() => {
  if (!props.result) return

  const allSteps = [
    ...props.result.steps,
    { separator: true },
    {
      final: true,
      label: '最終解析結果',
      value: props.result.remainder,
    },
  ]

  let delay = 0.3
  allSteps.forEach((step, i) => {
    setTimeout(() => {
      visibleSteps.value.push(step)
      const el = formulaEl.value?.querySelectorAll('.formula-row')[visibleSteps.value.length - 1]
      if (el) {
        gsap.from(el, { x: -24, opacity: 0, duration: 0.4, ease: 'power2.out' })
        if (step.matchedTag) {
          gsap.to(el, {
            scale: 1.03,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            delay: 0.4,
            ease: 'power2.inOut',
          })
        }
        if (step.final) {
          gsap.from(el, { scale: 0.8, opacity: 0, duration: 0.5, ease: 'back.out(2)' })
        }
      }
    }, delay * 1000)
    delay += step.separator ? 0.1 : 0.55
  })
})
</script>
