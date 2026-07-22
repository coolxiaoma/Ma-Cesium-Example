import {
  Viewer,
  Ion,
  ImageryLayer,
  OpenStreetMapImageryProvider,
  type Viewer as CesiumViewer,
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

export type CreateViewerOptions = {
  /** 是否显示 Cesium 默认控件（案例平台建议关闭大部分） */
  showCredits?: boolean
}

/**
 * 统一创建 Viewer，保证每个案例的初始环境一致。
 * 未配置 Ion Token 时使用 OSM 底图，便于纯本地运行。
 */
export function createViewer(
  container: HTMLElement,
  options: CreateViewerOptions = {},
): CesiumViewer {
  const token = import.meta.env.VITE_CESIUM_TOKEN?.trim()
  if (token) {
    Ion.defaultAccessToken = token
  }

  const viewer = new Viewer(container, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    ...(token
      ? {}
      : {
          baseLayer: new ImageryLayer(
            new OpenStreetMapImageryProvider({
              url: 'https://tile.openstreetmap.org/',
            }),
          ),
        }),
  })

  viewer.scene.globe.depthTestAgainstTerrain = false

  // 使用 OSM 时保留版权信息；有 Ion Token 时可按需隐藏
  if (token && !options.showCredits) {
    const credit = viewer.cesiumWidget.creditContainer as HTMLElement
    credit.style.display = 'none'
  }

  return viewer
}
