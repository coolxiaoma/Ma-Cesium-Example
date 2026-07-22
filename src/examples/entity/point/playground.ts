/**
 * Entity — 添加点
 * 修改 longitude / latitude / color 后点击「运行」即可看到效果。
 */
async function setup(viewer) {
  const longitude = 116.391
  const latitude = 39.907

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 250000),
    duration: 1.5,
  })

  viewer.entities.add({
    name: 'Beijing',
    position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
    point: {
      pixelSize: 14,
      color: Cesium.Color.YELLOW,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
    },
    label: {
      text: '北京',
      font: '16px sans-serif',
      pixelOffset: new Cesium.Cartesian2(0, -24),
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    },
  })
}

function destroy() {}
