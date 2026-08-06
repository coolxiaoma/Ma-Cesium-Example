<!-- 地图渲染层级与聚合效果：水库列表面板 + 勾选上图 -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  BoundingSphere,
  Cartesian2,
  Cartesian3,
  Color,
  HeadingPitchRange,
  LabelStyle,
  Math as CesiumMath,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from 'cesium'
import {
  NCheckbox,
  NConfigProvider,
  NSelect,
  darkTheme,
  type SelectOption,
} from 'naive-ui'
import { createViewer } from '@/core/createViewer'
import { mockData } from './mock.js'

type Reservoir = (typeof mockData)[number]

const cesiumEl = ref<HTMLElement | null>(null)
let viewer: Viewer | null = null

const levelFilter = ref<string>('全部')
const selectedIds = ref<string[]>([])

const levelOptions: SelectOption[] = [
  { label: '全部', value: '全部' },
  { label: '大型', value: '大型' },
  { label: '中型', value: '中型' },
]

const filteredList = computed(() =>
  levelFilter.value === '全部'
    ? (mockData as Reservoir[])
    : (mockData as Reservoir[]).filter((d) => d.level === levelFilter.value),
)

const allChecked = computed(
  () =>
    filteredList.value.length > 0 &&
    filteredList.value.every((d) => selectedIds.value.includes(d.id)),
)

const indeterminate = computed(
  () =>
    filteredList.value.some((d) => selectedIds.value.includes(d.id)) &&
    !allChecked.value,
)

const entityMap = new Map<string, Entity>()

function isChecked(id: string) {
  return selectedIds.value.includes(id)
}

function toggleOne(id: string, checked: boolean) {
  if (checked) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value = [...selectedIds.value, id]
    }
  } else {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  }
}

function toggleAll(checked: boolean) {
  const ids = filteredList.value.map((d) => d.id)
  if (checked) {
    selectedIds.value = [...new Set([...selectedIds.value, ...ids])]
  } else {
    const drop = new Set(ids)
    selectedIds.value = selectedIds.value.filter((id) => !drop.has(id))
  }
}

function addEntity(item: Reservoir) {
  if (!viewer || entityMap.has(item.id)) return
  const entity = viewer.entities.add({
    id: `rsv-${item.id}`,
    name: item.name,
    position: Cartesian3.fromDegrees(item.longitude, item.latitude, 0),
    point: {
      pixelSize: 12,
      color: Color.fromCssColorString('#38bdf8'),
      outlineColor: Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: item.name,
      font: '13px sans-serif',
      fillColor: Color.WHITE,
      outlineColor: Color.BLACK,
      outlineWidth: 2,
      style: LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: VerticalOrigin.BOTTOM,
      pixelOffset: new Cartesian2(0, -14),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  })
  entityMap.set(item.id, entity)
}

function removeEntity(id: string) {
  if (!viewer) return
  const entity = entityMap.get(id)
  if (!entity) return
  viewer.entities.remove(entity)
  entityMap.delete(id)
}

function flyToSelection(ids: string[]) {
  if (!viewer || ids.length === 0) return

  if (ids.length === 1) {
    const item = (mockData as Reservoir[]).find((d) => d.id === ids[0])
    if (!item) return
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(item.longitude, item.latitude, 120_000),
      duration: 1,
    })
    return
  }

  const positions = ids
    .map((id) => (mockData as Reservoir[]).find((d) => d.id === id))
    .filter((d): d is Reservoir => !!d)
    .map((d) => Cartesian3.fromDegrees(d.longitude, d.latitude))

  if (positions.length === 0) return
  viewer.camera.flyToBoundingSphere(BoundingSphere.fromPoints(positions), {
    duration: 1.2,
    offset: new HeadingPitchRange(0, -CesiumMath.PI_OVER_FOUR, 0),
  })
}

function syncMap(ids: string[]) {
  if (!viewer) return
  const want = new Set(ids)

  for (const id of [...entityMap.keys()]) {
    if (!want.has(id)) removeEntity(id)
  }
  for (const id of want) {
    const item = (mockData as Reservoir[]).find((d) => d.id === id)
    if (item) addEntity(item)
  }
  flyToSelection(ids)
}

watch(selectedIds, (ids) => syncMap(ids), { deep: true })

onMounted(() => {
  viewer = createViewer(cesiumEl.value as HTMLElement)
  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(105.0, 35.0, 4_500_000),
  })
})

onUnmounted(() => {
  entityMap.clear()
  viewer?.destroy()
  viewer = null
})
</script>

<template>
  <div class="app">
    <div ref="cesiumEl" class="map" />

    <NConfigProvider :theme="darkTheme" class="panel-host">
      <aside class="panel">
        <header class="panel-head">
          <span class="panel-mark" />
          <h2>水库信息</h2>
        </header>

        <div class="panel-body">
          <div class="filter-row">
            <span class="filter-label">等级</span>
            <NSelect
              v-model:value="levelFilter"
              :options="levelOptions"
              size="small"
              :consistent-menu-width="false"
              class="filter-select"
            />
          </div>

          <div class="table">
            <div class="table-head">
              <span class="col-name">水库</span>
              <span class="col-meta">编码</span>
              <span class="col-action">
                <NCheckbox
                  :checked="allChecked"
                  :indeterminate="indeterminate"
                  @update:checked="toggleAll"
                />
              </span>
            </div>

            <div class="table-body">
              <div
                v-for="item in filteredList"
                :key="item.id"
                class="table-row"
                :class="{ selected: isChecked(item.id) }"
                @click="toggleOne(item.id, !isChecked(item.id))"
              >
                <span class="col-name" :title="item.name">{{ item.name }}</span>
                <span class="col-meta" :title="item.code">{{ item.code }}</span>
                <span class="col-action" @click.stop>
                  <NCheckbox
                    :checked="isChecked(item.id)"
                    @update:checked="(v) => toggleOne(item.id, v)"
                  />
                </span>
              </div>

              <div v-if="filteredList.length === 0" class="empty">暂无数据</div>
            </div>
          </div>

          <div class="footer">
            已选 <strong>{{ selectedIds.length }}</strong> / {{ mockData.length }}
          </div>
        </div>
      </aside>
    </NConfigProvider>
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

.panel-host {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
  pointer-events: none;
}

.panel {
  width: 320px;
  max-height: calc(100% - 24px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #2f7fff;
  background: rgba(8, 28, 58, 0.88);
  color: #f0f6ff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  pointer-events: auto;
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(90deg, #1a5fd4 0%, #2a78f0 100%);
}

.panel-mark {
  width: 10px;
  height: 14px;
  background: #f5d76e;
  transform: skewX(-18deg);
  flex-shrink: 0;
}

.panel-head h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: 0.04em;
}

.panel-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 10px 12px 12px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.filter-label {
  flex-shrink: 0;
  font-size: 13px;
  color: #d7e6ff;
}

.filter-select {
  flex: 1;
  max-width: 160px;
}

.table {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-top: 1px solid rgba(120, 170, 255, 0.25);
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 1fr 110px 36px;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  font-size: 13px;
}

.table-head {
  color: #9eb6d8;
  border-bottom: 1px solid rgba(120, 170, 255, 0.2);
}

.table-body {
  overflow: auto;
  max-height: 360px;
}

.table-row {
  border-bottom: 1px solid rgba(120, 170, 255, 0.15);
  cursor: pointer;
  color: #eef5ff;
  transition: background 0.15s ease;
}

.table-row:hover {
  background: rgba(56, 140, 255, 0.12);
}

.table-row.selected {
  background: rgba(64, 150, 255, 0.28);
}

.col-name,
.col-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-meta {
  color: #c5d7f0;
  font-size: 12px;
}

.col-action {
  display: flex;
  justify-content: center;
}

.empty {
  padding: 24px 8px;
  text-align: center;
  color: #8aa0c0;
  font-size: 13px;
}

.footer {
  margin-top: 10px;
  font-size: 12px;
  color: #9eb6d8;
}

.footer strong {
  color: #7ec8ff;
}
</style>
