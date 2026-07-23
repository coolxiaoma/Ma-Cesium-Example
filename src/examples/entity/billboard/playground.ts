/**
 * Entity — 无人机 / 飞手 Billboard + 连线
 * 点击实体可取回 uavList 中对应的完整数据。
 */
async function setup(viewer) {
  const uavList = [
    {
      uavModel: '大疆无人机',
      longitude: 115.9425,
      latitude: 39.9175,
      devType: 'uav',
      deviceId: '1234567890',
      operLongitude: 116.1175,
      operLatitude: 39.6175,
      operAltitudeGeo: 61,
    },
    {
      uavModel: '大疆无人机2',
      longitude: 116.3975,
      latitude: 39.9075,
      devType: 'uav',
      deviceId: '1234567891',
      operLongitude: 116.3375,
      operLatitude: 39.9275,
      operAltitudeGeo: 61,
    },
  ]

  // deviceId → 列表原始数据，点击时 O(1) 回查
  const dataByDeviceId = new Map(uavList.map((item) => [item.deviceId, item]))

  for (const item of uavList) {
    const uavPos = Cesium.Cartesian3.fromDegrees(item.longitude, item.latitude, 0) // 无人机位置
    const operPos = Cesium.Cartesian3.fromDegrees(item.operLongitude, item.operLatitude, item.operAltitudeGeo ?? 0) // 飞手位置

    // 无人机：properties 挂上完整数据源
    viewer.entities.add({
      id: `uav-${item.deviceId}`,
      name: item.uavModel,
      position: uavPos,
      properties: {
        role: 'uav',
        deviceId: item.deviceId,
        raw: item, // 整条列表数据
      },
      billboard: {
        image: '/img/uav.png',
        scale: 1,
        color: Cesium.Color.WHITE,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })

    // 飞手
    viewer.entities.add({
      id: `oper-${item.deviceId}`,
      name: `${item.uavModel}-飞手`,
      position: operPos,
      properties: {
        role: 'oper',
        deviceId: item.deviceId,
        raw: item,
      },
      billboard: {
        image: '/img/person.png',
        scale: 1,
        color: Cesium.Color.WHITE,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })

    // 连线
    viewer.entities.add({
      id: `link-${item.deviceId}`,
      name: `${item.uavModel}-连线`,
      properties: {
        role: 'link',
        deviceId: item.deviceId,
        raw: item,
      },
      polyline: {
        positions: [uavPos, operPos],
        width: 2,
        clampToGround: true,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.YELLOW,
          dashLength: 16,
        }),
      },
    })
  }

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.3575, 39.9175, 80000),
    duration: 1.5,
  })
  
  // 注册点击事件
  leftDownAction(viewer, dataByDeviceId, uavList)
}

// 点击事件
function leftDownAction(viewer, dataByDeviceId, uavList) {
  viewer.screenSpaceEventHandler.setInputAction((movement) => {
    const picked = viewer.scene.pick(movement.position)
    if (!Cesium.defined(picked) || !picked.id) return

    const entity = picked.id
    const props = entity.properties?.getValue(Cesium.JulianDate.now()) // 获取实体的属性
    if (!props) return

    // 方式 1：直接从 entity.properties 取挂载的整条数据
    const rawFromProps = props.raw

    // 方式 2：用 deviceId 从 Map 回查（适合数据会更新的场景）
    const rawFromMap = dataByDeviceId.get(props.deviceId)

    console.log('点击角色:', props.role)
    console.log('整条数据(properties):', rawFromProps)
    console.log('整条数据(Map):', rawFromMap)
    console.log('完整列表:', uavList)
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

function destroy() {}
