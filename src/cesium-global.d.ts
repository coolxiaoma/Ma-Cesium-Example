import type * as CesiumNamespace from 'cesium'

declare global {
  /** 由 runPlayground 注入，playground 中勿 import */
  const Cesium: typeof CesiumNamespace
}

export {}
