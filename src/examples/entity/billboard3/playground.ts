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
    destination: Cesium.Cartesian3.fromDegrees(116.45, 39.86, 180000),
    duration: 1.5,
  })
}

/**
 * 添加设备图标 + 旋转扇形扫描光线
 */
function addDeviceWithScan(viewer, device) {
  const baseColor = Cesium.Color.fromCssColorString(device.color)
  const halfAngle = device.sectorAngle / 2 // 扇形开口角的一半
  const startMs = performance.now() // 开始时间（performance.now() 返回的是高精度时间戳，单位是毫秒，起点是页面的 time origin（一般是打开/刷新该页的时刻），不是墙上的时钟时间。）

  // 设备图标
  viewer.entities.add({
    id: `device-${device.deviceId}`,
    name: device.deviceName,
    position: Cesium.Cartesian3.fromDegrees(device.longitude, device.latitude),
    billboard: {
      image: '/img/device.png',
      scale: 1,
      color: Cesium.Color.WHITE,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  })

  // 扇形扫描面（随时间旋转）
  viewer.entities.add({
    id: `scan-${device.deviceId}`,
    name: `${device.deviceName}-扫描`,
    polygon: {
      hierarchy: new Cesium.CallbackProperty(() => { // 它允许开发者创建动态变化的实体属性
        /**
         * 1.elapsedSec
            performance.now() - startMs 得到从创建扫描实体到现在过了多少毫秒，再 / 1000 变成秒。
            例如过了 2.5 秒 → elapsedSec = 2.5。
         * 2.heading
            elapsedSec * device.scanSpeed：按转速（度/秒）算出转过的总角度。
            比如 scanSpeed = 40，过了 2 秒 → 80 度。
            % 360：把角度压回 0~360，转满一圈重新从 0 开始，所以会一直转。
         * 3.buildSectorPositions
            合起来：用真实流逝时间 × 转速，得到当前扇形中心方位角，再交给后面的 buildSectorPositions 画扇形。
         */
        const elapsedSec = (performance.now() - startMs) / 1000
        const heading = (elapsedSec * device.scanSpeed) % 360

        return new Cesium.PolygonHierarchy(
          buildSectorPositions(
            device.longitude,
            device.latitude,
            device.scope,
            heading,
            halfAngle,
          ),
        )
      }, false),
      material: baseColor.withAlpha(0.28),
      outline: true,
      outlineColor: baseColor.withAlpha(0.9),
      outlineWidth: 2,
      height: 0,
      classificationType: Cesium.ClassificationType.BOTH,
    },
  })
}

/**
 * 生成扇形多边形顶点：中心点 + 圆弧点列
 * @param {number} lon
 * @param {number} lat
 * @param {number} radius 米
 * @param {number} heading 扇形中心方位角（度）0北 90东
 * @param {number} halfAngle 半开口角（度）
 * 中心 → 左边界 → 弧上若干点 → 右边界
 */
function buildSectorPositions(lon, lat, radius, heading, halfAngle) {
  const positions = [Cesium.Cartesian3.fromDegrees(lon, lat, 0)]
  const start = heading - halfAngle
  const end = heading + halfAngle
  const step = Math.max(2, (end - start) / 36) // 约 36 段，保证圆弧平滑

  for (let angle = start; angle <= end + 1e-6; angle += step) {
    const p = getPointByBearing(lon, lat, radius, angle)
    positions.push(Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude, 0))
  }

  // 兜底：保证终点精确落在 end
  const endPoint = getPointByBearing(lon, lat, radius, end)
  positions.push(
    Cesium.Cartesian3.fromDegrees(endPoint.longitude, endPoint.latitude, 0),
  )
  console.log(positions, 'positions');
  return positions
}

/**
 * 根据中心点、距离、方位角 获取目标点经纬度
 * @param {number} lon 中心点经度
 * @param {number} lat 中心点纬度
 * @param {number} distance 米
 * @param {number} bearing 方位角(度) 0北 90东 180南 270西
 */
function getPointByBearing(lon, lat, distance, bearing) { 
  const startLonRad = Cesium.Math.toRadians(lon) // 将经度转换为弧度
  const startLatRad = Cesium.Math.toRadians(lat) // 将纬度转换为弧度
  const bearingRad = Cesium.Math.toRadians(bearing) // 将方位角转换为弧度
  const earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius
  const angularDist = distance / earthRadius // 将距离转换为弧度

  const lat2Rad = Math.asin( // 计算目标点的纬度
    Math.sin(startLatRad) * Math.cos(angularDist) +
      Math.cos(startLatRad) * Math.sin(angularDist) * Math.cos(bearingRad),
  )

  const lon2Rad = // 计算目标点的经度
    startLonRad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDist) * Math.cos(startLatRad),
      Math.cos(angularDist) - Math.sin(startLatRad) * Math.sin(lat2Rad),
    )

  return {
    longitude: Cesium.Math.toDegrees(lon2Rad),
    latitude: Cesium.Math.toDegrees(lat2Rad),
  }
}

function destroy() {}