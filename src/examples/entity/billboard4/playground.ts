/**
 * Entity — 设备 Billboard + 扇形扫描光线
 * 修改 deviceList 中的坐标 / 半径 / 扇角 / 转速后点击「运行」即可看到效果。
 */
async function setup(viewer) {
  // 模拟设备数据
  const deviceList = [
    {
      deviceId: 'dev-001',
      deviceName: '侦测设备 A',
      longitude: 116.391,
      latitude: 39.907,
      scope: 40000, // 扫描半径（米）
      sectorAngle: 45, // 扇形开口角（度）
      scanSpeed: 40, // 转速（度/秒）
      color: '#22d3ee',
    },
    {
      deviceId: 'dev-002',
      deviceName: '侦测设备 B',
      longitude: 116.52,
      latitude: 39.82,
      scope: 28000,
      sectorAngle: 60,
      scanSpeed: 25,
      color: '#f59e0b',
    },
  ]
  for (const device of deviceList) {
    addDeviceWithScan(viewer, device)
  }

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.45, 39.86, 10000),
    duration: 1.5,
  })
}

/**
 * 添加设备图标 + 椭圆体
 */
function addDeviceWithScan(viewer, device) {
  const position = Cesium.Cartesian3.fromDegrees(
    device.longitude,
    device.latitude,
    0,
  )

  // 设备图标
  viewer.entities.add({
    id: `device-${device.deviceId}`,
    name: device.deviceName,
    position: position,
    point: {
      pixelSize: 14,
      color: Cesium.Color.BLUE,
    },
    ellipsoid: {
      radii: new Cesium.Cartesian3(1000, 1000, 1000), // x/y 水平半径，z 竖直半径
      maximumCone: Cesium.Math.PI_OVER_TWO, // 只保留上半球（从天顶到赤道面）
      material: Cesium.Color.TRANSPARENT,
      outline: true,
      outlineColor: Cesium.Color.RED,
    },
  })
}




function destroy() {}