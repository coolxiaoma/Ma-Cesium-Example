<script setup lang="ts">
/**
 * 实战页：Vue 工具栏 + 点 / 线 / 面绘制。
 * Viewer 由本组件自行创建/销毁，不走 playground。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  CallbackProperty,
  Cartesian2,
  Cartesian3,
  Color,
  LabelStyle,
  PolygonHierarchy,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Viewer,
} from 'cesium'
import { createViewer } from '@/core/createViewer'

type DrawMode = 'point' | 'line' | 'polygon' | null

const cesiumEl = ref<HTMLElement | null>(null)
const drawMode = ref<DrawMode>(null)
const pointCount = ref(0)
const lineVertexCount = ref(0)
const polygonVertexCount = ref(0)

const modeHint = computed(() => {
  if (drawMode.value === 'point') return '点击地图添加点'
  if (drawMode.value === 'line') return '点击地图加点连线'
  if (drawMode.value === 'polygon') return '点击地图加点，满 3 点成面'
  return '选择一种绘制方式'
})

let viewer: Viewer | null = null
let handler: ScreenSpaceEventHandler | null = null
let resizeObserver: ResizeObserver | null = null

const linePositions: Cartesian3[] = []
const polygonPositions: Cartesian3[] = []

function setMode(mode: DrawMode) {
  drawMode.value = drawMode.value === mode ? null : mode
}

function addVertexMarker(position: Cartesian3, text: string) {
  if (!viewer) return
  viewer.entities.add({
    position,
    point: {
      pixelSize: 10,
      color: Color.CYAN,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text,
      font: '12px sans-serif',
      pixelOffset: new Cartesian2(0, -18),
      style: LabelStyle.FILL_AND_OUTLINE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  })
}

function ensureShapeEntities() {
  if (!viewer) return

  viewer.entities.add({
    polyline: {
      positions: new CallbackProperty(() => linePositions, false),
      width: 3,
      material: Color.CYAN,
      clampToGround: true,
    },
  })

  viewer.entities.add({
    polygon: {
      hierarchy: new CallbackProperty(
        () => new PolygonHierarchy(polygonPositions),
        false,
      ),
      material: Color.CYAN.withAlpha(0.35),
      outline: true,
      outlineColor: Color.CYAN,
    },
  })
}

function clearAll() {
  if (!viewer) return
  linePositions.length = 0
  polygonPositions.length = 0
  pointCount.value = 0
  lineVertexCount.value = 0
  polygonVertexCount.value = 0
  viewer.entities.removeAll()
  ensureShapeEntities()
}

function flyHome() {
  viewer?.camera.flyTo({
    destination: Cartesian3.fromDegrees(116.391, 39.907, 250000),
    duration: 1.2,
  })
}

function pickCartesian(position: Cartesian2): Cartesian3 | undefined {
  if (!viewer) return undefined
  return (
    viewer.scene.pickPosition(position) ??
    viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid) ??
    undefined
  )
}

onMounted(() => {
  if (!cesiumEl.value) return

  viewer = createViewer(cesiumEl.value)
  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(116.391, 39.907, 250000),
  })
  ensureShapeEntities()

  resizeObserver = new ResizeObserver(() => {
    if (!viewer || viewer.isDestroyed()) return
    if (cesiumEl.value && cesiumEl.value.clientWidth > 0) viewer.resize()
  })
  resizeObserver.observe(cesiumEl.value)

  handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction((click: { position: Cartesian2 }) => {
    if (!drawMode.value || !viewer) return
    const cartesian = pickCartesian(click.position)
    if (!cartesian) return

    if (drawMode.value === 'point') {
      pointCount.value += 1
      addVertexMarker(cartesian, String(pointCount.value))
      return
    }

    if (drawMode.value === 'line') {
      linePositions.push(cartesian)
      lineVertexCount.value = linePositions.length
      addVertexMarker(cartesian, String(lineVertexCount.value))
      return
    }

    polygonPositions.push(cartesian)
    polygonVertexCount.value = polygonPositions.length
    addVertexMarker(cartesian, String(polygonVertexCount.value))
  }, ScreenSpaceEventType.LEFT_CLICK)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  handler?.destroy()
  handler = null
  if (viewer && !viewer.isDestroyed()) viewer.destroy()
  viewer = null
})
</script>

<template>
  <div class="app">
    <div ref="cesiumEl" class="map" />

    <aside class="panel">
      <h2>标注工具</h2>
      <p class="desc">{{ modeHint }}</p>

      <div class="row">
        <button
          type="button"
          class="btn"
          :class="{ active: drawMode === 'point' }"
          @click="setMode('point')"
        >
          {{ drawMode === 'point' ? '打点中…' : '绘点' }}
        </button>
        <button
          type="button"
          class="btn"
          :class="{ active: drawMode === 'line' }"
          @click="setMode('line')"
        >
          {{ drawMode === 'line' ? '绘线中…' : '绘线' }}
        </button>
        <button
          type="button"
          class="btn"
          :class="{ active: drawMode === 'polygon' }"
          @click="setMode('polygon')"
        >
          {{ drawMode === 'polygon' ? '绘面中…' : '绘面' }}
        </button>
        <button type="button" class="btn" @click="clearAll">清空</button>
        <button type="button" class="btn" @click="flyHome">飞回北京</button>
      </div>

      <div class="stat">
        <div>点 <strong>{{ pointCount }}</strong></div>
        <div>线顶点 <strong>{{ lineVertexCount }}</strong></div>
        <div>面顶点 <strong>{{ polygonVertexCount }}</strong></div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.app {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.map {
  width: 100%;
  height: 100%;
}

.panel {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 20;
  width: 220px;
  padding: 14px;
  border: 1px solid rgba(71, 85, 105, 0.9);
  border-radius: 10px;
  background: rgba(18, 24, 32, 0.94);
  color: #e8eef7;
  pointer-events: auto;
}

.panel h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}

.desc {
  margin: 8px 0 12px;
  font-size: 12px;
  line-height: 1.45;
  color: #93a4bb;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn {
  padding: 7px 10px;
  border: 1px solid #334155;
  border-radius: 6px;
  background: #1a2330;
  color: #d7e2f0;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}

.btn:hover {
  border-color: #475569;
}

.btn.active {
  border-color: #38bdf8;
  color: #38bdf8;
}

.stat {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #93a4bb;
}

.stat strong {
  color: #e8eef7;
}
</style>
