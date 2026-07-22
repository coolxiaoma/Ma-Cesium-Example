import * as Cesium from 'cesium'
import { transform } from 'sucrase'
import type { Viewer } from 'cesium'

export type PlaygroundModule = {
  setup: (viewer: Viewer) => void | Promise<void>
  destroy: () => void
}

export type RunPlaygroundResult =
  | { ok: true; module: PlaygroundModule }
  | { ok: false; error: string }

/**
 * 将编辑器中的 TypeScript/JavaScript 转译并执行。
 * 约定：用户代码需定义 setup(viewer)，可选 destroy()；Cesium 由平台注入。
 */
export function runPlayground(code: string): RunPlaygroundResult {
  try {
    const js = transform(code, {
      transforms: ['typescript'],
      disableESTransforms: true,
    }).code

    const runner = new Function(
      'Cesium',
      `${js}
      if (typeof setup !== 'function') {
        throw new Error('请定义 async function setup(viewer) { ... }')
      }
      return {
        setup,
        destroy: typeof destroy === 'function' ? destroy : () => {},
      };`,
    ) as (cesium: typeof Cesium) => PlaygroundModule

    const module = runner(Cesium)
    return { ok: true, module }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message }
  }
}

/** 清空 Viewer 上常见的案例残留（实体 / 数据源 / 事件句柄需案例自行在 destroy 里处理） */
export function resetViewerContent(viewer: Viewer) {
  viewer.entities.removeAll()
  viewer.dataSources.removeAll()
  viewer.clock.shouldAnimate = false
}
