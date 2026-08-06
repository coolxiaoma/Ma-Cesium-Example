import type { Component } from 'vue'

export type ExampleMeta = {
  id: string
  title: string
  group: string
  description: string
  /** playground = 可编辑脚本；app = 侧栏内完整 Vue 实战页 */
  mode: 'playground' | 'app'
  /** playground：加载编辑器默认源码（Vite ?raw） */
  loadCode?: () => Promise<{ default: string }>
  /** app：加载实战页 Vue 组件 */
  loadApp?: () => Promise<{ default: Component }>
}

/**
 * 案例注册表：侧栏与路由都从这里读取。
 * 新增 playground：建目录 + loadCode；新增实战页：建 Vue + loadApp。
 */
export const examples: ExampleMeta[] = [
  {
    id: 'hello-world',
    title: 'Hello World',
    group: '入门',
    description: '创建场景并设置初始相机位置。可改经纬度后点「运行」。',
    mode: 'playground',
    loadCode: () => import('./basic/hello-world/playground.ts?raw'),
  },
  {
    id: 'entity-point',
    title: '添加点实体',
    group: '点实体',
    description: '在地球上添加一个点标注，演示 entities API。',
    mode: 'playground',
    loadCode: () => import('./entity/point/playground.ts?raw'),
  },
  {
    id: 'entity-polygon',
    title: '添加面实体',
    group: '面实体',
    description: '在地球上添加一个面标注，演示 entities API。',
    mode: 'playground',
    loadCode: () => import('./entity/polygon/playground.ts?raw'),
  },
  {
    id: 'entity-polygon-3D',
    title: '添加3d多边形实体',
    group: '面实体',
    description: '在地球上添加一个3D多边形标注，演示 entities API。',
    mode: 'playground',
    loadCode: () => import('./entity/polygon-3d/playground.ts?raw'),
  },
  {
    id: 'billboard-1',
    title: '添加Billboard实体',
    group: '广告牌实体',
    description: '在地球上添加一个Billboard标注，演示 entities API。',
    mode: 'playground',
    loadCode: () => import('./entity/billboard/playground.ts?raw'),
  },
  {
    id: 'billboard-2',
    title: '添加Billboard实体-无人机案例',
    group: '广告牌实体',
    description: '在地球上添加一个Billboard标注，演示 entities API。',
    mode: 'playground',
    loadCode: () => import('./entity/billboard2/playground.ts?raw'),
  },
  {
    id: 'billboard-3',
    title: '添加Billboard实体-设备扫描方向案例',
    group: '广告牌实体',
    description: '在地球上添加一个Billboard标注，以设备扫描方向为例，演示 entities API。',
    mode: 'playground',
    loadCode: () => import('./entity/billboard3/playground.ts?raw'),
  },
  {
    id: 'billboard-4',
    title: '添加Billboard实体-椭圆体案例',
    group: '广告牌实体',
    description: '在地球上添加一个Billboard标注，以椭圆体为例，演示 entities API。',
    mode: 'playground',
    loadCode: () => import('./entity/billboard4/playground.ts?raw'),
  },
  {
    id: 'entity-ellipse',
    title: '添加椭圆实体',
    group: 'Entity',
    description: '在地球上添加一个椭圆标注，案例以雷达扫描范围为例，演示 entities API。',
    mode: 'playground',
    loadCode: () => import('./entity/ellipse/playground.ts?raw'),
  },
  {
    id: 'entity-comprehensive',
    title: '综合案例-地图打点',
    group: '综合案例',
    description: '功能菜单展开后可开启点绘制，在地图上点击打点。',
    mode: 'playground',
    loadCode: () => import('./entity/ComprehensiveCase/playground.ts?raw'),
  },
  {
    id: 'entity-comprehensive-2',
    title: '综合案例-地图绘线',
    group: '综合案例',
    description: '功能菜单展开后可开启线绘制，在地图上点击打点。',
    mode: 'playground',
    loadCode: () => import('./entity/ComprehensiveCase2/playground.ts?raw'),
  },
  {
    id: 'entity-comprehensive-3',
    title: '综合案例-地图绘面',
    group: '综合案例',
    description: '功能菜单展开后可开启面绘制，在地图上点击打点围成多边形。',
    mode: 'playground',
    loadCode: () => import('./entity/ComprehensiveCase3/playground.ts?raw'),
  },
  {
    id: 'entity-gltf',
    title: '加载 glTF 模型',
    group: '模型',
    description: '在指定经纬度加载并渲染本地 glTF 建筑模型。',
    mode: 'playground',
    loadCode: () => import('./entity/gltf/playground.ts?raw'),
  },
  {
    id: 'project-draw-tools',
    title: '标注工具（Vue）',
    group: '实战项目',
    description: '侧栏内完整 Vue 实战页：绘点 / 绘线 / 绘面，不走 Playground。',
    mode: 'app',
    loadApp: () => import('./projects/draw-tools/index.vue'),
  },
  {
    id: 'project-aggregate-effect',
    title: '聚合效果',
    group: '实战项目',
    description: '地图渲染层级与聚合效果。',
    mode: 'app',
    loadApp: () => import('./projects/聚合效果/index.vue'),
  },
  {
    id: 'camera-flyto',
    title: '相机飞入',
    group: '相机',
    description: '使用 camera.flyTo 平滑飞到指定位置。',
    mode: 'playground',
    loadCode: () => import('./camera/fly-to/playground.ts?raw'),
  },
]

export function getExampleById(id: string): ExampleMeta | undefined {
  return examples.find((item) => item.id === id)
}

export function groupExamples() {
  const map = new Map<string, ExampleMeta[]>()
  for (const item of examples) {
    const list = map.get(item.group) ?? []
    list.push(item)
    map.set(item.group, list)
  }
  return [...map.entries()].map(([group, items]) => ({ group, items }))
}
