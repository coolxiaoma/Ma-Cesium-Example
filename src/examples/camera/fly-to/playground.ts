/**
 * 相机 — flyTo
 * 可修改目标点与 duration 体验不同飞行效果。
 */
async function setup(viewer) {
  // 先拉远，再飞入，方便观察动画
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(105, 20, 12_000_000),
  })

  await viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(121.47, 31.23, 120000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0,
    },
    duration: 2.5,
  })
}

function destroy() {
  // 如有正在进行的飞行，切换案例时平台会清理场景
}
