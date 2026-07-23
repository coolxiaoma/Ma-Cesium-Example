export type ExampleMeta = {
  id: string
  title: string
  group: string
  description: string
  /** 加载编辑器默认源码（Vite ?raw） */
  loadCode: () => Promise<{ default: string }>
}

/**
 * 案例注册表：侧栏与路由都从这里读取。
 * 新增案例：在 examples 下建目录，并在此追加一项。
 */
export const examples: ExampleMeta[] = [
  {
    id: 'hello-world',
    title: 'Hello World',
    group: '入门',
    description: '创建场景并设置初始相机位置。可改经纬度后点「运行」。',
    loadCode: () => import('./basic/hello-world/playground.ts?raw'),
  },
  {
    id: 'entity-point',
    title: '添加点实体',
    group: 'Entity',
    description: '在地球上添加一个点标注，演示 entities API。',
    loadCode: () => import('./entity/point/playground.ts?raw'),
  },
  {
    id: 'entity-polygon',
    title: '添加面实体',
    group: 'Entity',
    description: '在地球上添加一个面标注，演示 entities API。',
    loadCode: () => import('./entity/polygon/playground.ts?raw'),
  },
  {
    id: 'entity-polygon-3D',
    title: '添加3d多边形实体',
    group: 'Entity',
    description: '在地球上添加一个3D多边形标注，演示 entities API。',
    loadCode: () => import('./entity/polygon-3d/playground.ts?raw'),
  },
  {
    id: 'camera-flyto',
    title: '相机飞入',
    group: '相机',
    description: '使用 camera.flyTo 平滑飞到指定位置。',
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
