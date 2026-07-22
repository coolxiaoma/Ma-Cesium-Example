/**
 * Hello World — 设置初始视角
 *
 * 约定：
 * - 必须定义 setup(viewer)
 * - 可选定义 destroy()
 * - 不要写 import，平台已注入全局 Cesium
 */
async function setup(viewer) {
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(105.0, 33.0, 8_000_000),
  })
}

function destroy() {
  // 本例无额外资源，清空由平台统一处理
}
