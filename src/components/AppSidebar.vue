<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { groupExamples } from '@/examples/registry'

const route = useRoute()
const router = useRouter()
const groups = groupExamples()

const activeId = computed(() => String(route.params.id ?? ''))

function go(id: string) {
  if (id === activeId.value) return
  router.push(`/examples/${id}`)
}
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark">Ma</span>
      <div>
        <div class="brand-title">Cesium Example</div>
        <div class="brand-sub">本地案例 · 可改可跑</div>
      </div>
    </div>

    <nav class="nav">
      <section v-for="block in groups" :key="block.group" class="group">
        <h3 class="group-title">{{ block.group }}</h3>
        <button
          v-for="item in block.items"
          :key="item.id"
          type="button"
          class="nav-item"
          :class="{ active: item.id === activeId }"
          @click="go(item.id)"
        >
          {{ item.title }}
        </button>
      </section>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 240px;
  min-width: 240px;
  height: 100%;
  background: #0f1419;
  border-right: 1px solid #243041;
  color: #e7eef7;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 18px 16px;
  border-bottom: 1px solid #243041;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3d8bfd, #1f6feb);
  font-weight: 700;
  font-size: 14px;
}

.brand-title {
  font-size: 14px;
  font-weight: 600;
}

.brand-sub {
  margin-top: 2px;
  font-size: 11px;
  color: #8b9bb4;
}

.nav {
  flex: 1;
  overflow: auto;
  padding: 12px 10px 20px;
}

.group + .group {
  margin-top: 14px;
}

.group-title {
  margin: 0 8px 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #7f8ea3;
}

.nav-item {
  display: block;
  width: 100%;
  margin-bottom: 4px;
  padding: 9px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #c5d0e0;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
}

.nav-item:hover {
  background: #1a2330;
}

.nav-item.active {
  background: #1f3a5f;
  color: #fff;
}
</style>
