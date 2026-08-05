/**
 * Entity — 加载 glTF 建筑模型
 * 模型中心：115.7886734008789, 40.05039405822754
 * 资源放在 public/models/gltf/，Playground 通过 URL 加载。
 */
async function setup(viewer) {
  const longitude = 115.7886734008789
  const latitude = 40.05039405822754

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0,
    },
    duration: 1.5,
  })

  viewer.entities.add({ // 添加实体
    name: 'Geobuilding',
    position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 0),
    model: {
      uri: '/models/gltf/1.gltf',
      scale: 1.0,
      minimumPixelSize: 128, // 最小像素大小
      maximumScale: 20000, // 最大缩放比例
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 高度参考
    },
  })
}

function destroy() {}
