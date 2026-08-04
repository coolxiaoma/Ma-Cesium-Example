<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  type Component,
} from 'vue'
import { useRoute } from 'vue-router'
import type { Viewer } from 'cesium'
import AppSidebar from '@/components/AppSidebar.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import { createViewer } from '@/core/createViewer'
import { resetViewerContent, runPlayground } from '@/core/runPlayground'
import { getExampleById } from '@/examples/registry'

const route = useRoute()
const cesiumContainer = ref<HTMLElement | null>(null)
const code = ref('')
const originalCode = ref('')
const errorMessage = ref('')
const running = ref(false)
const showEditor = ref(true)
const panelWidth = ref(440)
const appComponent = shallowRef<Component | null>(null)

let viewer: Viewer | null = null
let currentDestroy: (() => void) | null = null
let resizeObserver: ResizeObserver | null = null

const exampleId = computed(() => String(route.params.id ?? ''))
const example = computed(() => getExampleById(exampleId.value))
const isAppMode = computed(() => example.value?.mode === 'app')

function bindViewerResize(el: HTMLElement) {
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(() => {
    if (!viewer || viewer.isDestroyed()) return
    if (el.clientWidth > 0 && el.clientHeight > 0) {
      viewer.resize()
    }
  })
  resizeObserver.observe(el)
}

function teardownPlayground() {
  currentDestroy?.()
  currentDestroy = null
  resizeObserver?.disconnect()
  resizeObserver = null
  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy()
  }
  viewer = null
}

async function ensurePlaygroundViewer() {
  if (viewer && !viewer.isDestroyed()) return
  await nextTick()
  if (!cesiumContainer.value) return
  viewer = createViewer(cesiumContainer.value)
  bindViewerResize(cesiumContainer.value)
}

async function loadExample(id: string) {
  const meta = getExampleById(id)
  if (!meta) {
    errorMessage.value = `未找到案例：${id}`
    appComponent.value = null
    return
  }

  errorMessage.value = ''

  if (meta.mode === 'app') {
    teardownPlayground()
    if (!meta.loadApp) {
      errorMessage.value = `实战页缺少 loadApp：${id}`
      appComponent.value = null
      return
    }
    const mod = await meta.loadApp()
    appComponent.value = mod.default
    return
  }

  appComponent.value = null
  await ensurePlaygroundViewer()
  if (!meta.loadCode) {
    errorMessage.value = `Playground 缺少 loadCode：${id}`
    return
  }
  const mod = await meta.loadCode()
  originalCode.value = mod.default
  code.value = mod.default
  await runCurrentCode()
}

async function runCurrentCode() {
  if (!viewer || isAppMode.value) return

  running.value = true
  errorMessage.value = ''

  try {
    currentDestroy?.()
    currentDestroy = null
    resetViewerContent(viewer)

    const result = runPlayground(code.value)
    if (!result.ok) {
      errorMessage.value = result.error
      return
    }

    await result.module.setup(viewer)
    currentDestroy = result.module.destroy
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err)
  } finally {
    running.value = false
  }
}

function resetCode() {
  code.value = originalCode.value
  void runCurrentCode()
}

async function recreateViewer() {
  if (isAppMode.value) return
  teardownPlayground()
  await ensurePlaygroundViewer()
  await runCurrentCode()
}

onMounted(async () => {
  await loadExample(exampleId.value)
})

onBeforeUnmount(() => {
  appComponent.value = null
  teardownPlayground()
})

watch(exampleId, (id) => {
  void loadExample(id)
})
</script>

<template>
  <div class="page">
    <AppSidebar />

    <main class="main">
      <header class="toolbar">
        <div class="meta">
          <h1>{{ example?.title ?? '未知案例' }}</h1>
          <p>{{ example?.description }}</p>
        </div>
        <div v-if="!isAppMode" class="actions">
          <button type="button" class="btn ghost" @click="showEditor = !showEditor">
            {{ showEditor ? '隐藏源码' : '显示源码' }}
          </button>
          <button type="button" class="btn ghost" @click="recreateViewer">重建地球</button>
          <button type="button" class="btn ghost" :disabled="running" @click="resetCode">
            重置
          </button>
          <button type="button" class="btn primary" :disabled="running" @click="runCurrentCode">
            {{ running ? '运行中…' : '运行' }}
          </button>
        </div>
      </header>

      <div class="workspace">
        <!-- 实战页：自包含 Vue 应用 -->
        <div v-if="isAppMode" class="app-host">
          <component :is="appComponent" v-if="appComponent" :key="exampleId" />
          <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>
        </div>

        <!-- Playground：平台 Viewer + 编辑器 -->
        <template v-else>
          <div class="viewer-wrap">
            <div ref="cesiumContainer" class="cesium-box" />
            <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>
          </div>

          <aside v-show="showEditor" class="editor-panel" :style="{ width: `${panelWidth}px` }">
            <div class="editor-header">
              <span>源码 Playground</span>
              <span class="hint">Ctrl / ⌘ + Enter 运行</span>
            </div>
            <div class="editor-body">
              <CodeEditor v-model="code" @run="runCurrentCode" />
            </div>
          </aside>
        </template>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0b0f14;
  color: #e8eef7;
}

.main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.toolbar {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #243041;
  background: #121820;
}

.meta h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 650;
}

.meta p {
  margin: 6px 0 0;
  max-width: 720px;
  font-size: 13px;
  line-height: 1.5;
  color: #93a4bb;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.btn {
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn.ghost {
  background: #1a2330;
  color: #d7e2f0;
}

.btn.primary {
  border-color: #2f6fed;
  background: #2f6fed;
  color: #fff;
}

.workspace {
  display: flex;
  flex: 1;
  min-height: 0;
}

.app-host {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.viewer-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

.cesium-box {
  width: 100%;
  height: 100%;
}

.error-banner {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 2;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(127, 29, 29, 0.92);
  color: #ffe4e6;
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  min-width: 320px;
  max-width: 55vw;
  border-left: 1px solid #243041;
  background: #1e1e1e;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #30363d;
  font-size: 12px;
  color: #c9d1d9;
}

.hint {
  color: #8b949e;
}

.editor-body {
  flex: 1;
  min-height: 0;
}

@media (max-width: 960px) {
  .page {
    flex-direction: column;
  }

  .main {
    min-height: 0;
  }

  .workspace {
    flex-direction: column;
  }

  .viewer-wrap,
  .app-host {
    flex: 1;
    min-height: 200px;
  }

  .editor-panel {
    width: 100% !important;
    max-width: none;
    min-width: 0;
    flex: none;
    height: 36vh;
    border-left: 0;
    border-top: 1px solid #243041;
  }
}
</style>
