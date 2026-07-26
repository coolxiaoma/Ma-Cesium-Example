/**
 * Entity — 无人机 / 飞手 Billboard + 连线
 * 点击图标在上方弹出详情介绍框。
 */

let cleanupClickPopup = () => {}

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

  cleanupClickPopup = bindDetailPopup(viewer, dataByDeviceId)
}

/**
 * 点击图标 → 在图标上方弹出详情框（随相机移动跟踪）
 */
function bindDetailPopup(viewer, dataByDeviceId) {
  const container = viewer.cesiumWidget.container
  const popup = document.createElement('div')
  popup.className = 'cesium-entity-detail-popup'
  popup.innerHTML = `
    <button type="button" class="popup-close" aria-label="关闭">×</button>
    <div class="popup-title"></div>
    <div class="popup-body"></div>
  `
  container.appendChild(popup)

  const style = document.createElement('style')
  style.textContent = `
    .cesium-entity-detail-popup {
      position: absolute;
      z-index: 10;
      display: none;
      min-width: 200px;
      max-width: 280px;
      padding: 12px 14px 14px;
      border: 1px solid rgba(71, 85, 105, 0.9);
      border-radius: 10px;
      background: rgba(18, 24, 32, 0.94);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      color: #e8eef7;
      font-size: 12px;
      line-height: 1.5;
      pointer-events: auto;
      transform: translate(-50%, calc(-100% - 16px));
      backdrop-filter: blur(6px);
    }
    .cesium-entity-detail-popup::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -7px;
      width: 12px;
      height: 12px;
      border-right: 1px solid rgba(71, 85, 105, 0.9);
      border-bottom: 1px solid rgba(71, 85, 105, 0.9);
      background: rgba(18, 24, 32, 0.94);
      transform: translateX(-50%) rotate(45deg);
    }
    .cesium-entity-detail-popup .popup-close {
      position: absolute;
      top: 6px;
      right: 8px;
      border: 0;
      background: transparent;
      color: #93a4bb;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
    }
    .cesium-entity-detail-popup .popup-close:hover {
      color: #fff;
    }
    .cesium-entity-detail-popup .popup-title {
      margin: 0 18px 8px 0;
      font-size: 14px;
      font-weight: 650;
      color: #f8fafc;
    }
    .cesium-entity-detail-popup .popup-row {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .cesium-entity-detail-popup .popup-label {
      flex: 0 0 64px;
      color: #93a4bb;
    }
    .cesium-entity-detail-popup .popup-value {
      flex: 1;
      word-break: break-all;
      color: #d7e2f0;
    }
  `
  document.head.appendChild(style)

  const titleEl = popup.querySelector('.popup-title')
  const bodyEl = popup.querySelector('.popup-body')
  const closeBtn = popup.querySelector('.popup-close')

  let trackedEntity = null // 跟踪的实体
  let removePostRender = null // 移除 postRender 事件

  function hide() { // 隐藏详情框
    trackedEntity = null
    popup.style.display = 'none'
    if (removePostRender) {
      removePostRender()
      removePostRender = null
    }
  }

  //清空 trackedEntity 后，updatePosition 不会被调用，详情框不会消失
  function updatePosition() {
    if (!trackedEntity) return
    // 获取跟踪实体的三维坐标
    const position = trackedEntity.position?.getValue(viewer.clock.currentTime)
    if (!position) {
      hide()
      return
    }
    // 将三维坐标转换为二维坐标
    const canvasPos = viewer.scene.cartesianToCanvasCoordinates(position)
    // 如果转换后的二维坐标没有，则隐藏详情框
    if (!Cesium.defined(canvasPos)) {
      popup.style.display = 'none'
      return
    }
    popup.style.display = 'block'
    popup.style.left = `${canvasPos.x}px`
    popup.style.top = `${canvasPos.y}px`
  }

  //显示详情框
  function show(entity, role, raw) {
    trackedEntity = entity
    const roleLabel = role === 'uav' ? '无人机' : '飞手'
    titleEl.textContent = `${raw.uavModel} · ${roleLabel}`

    const rows =
      role === 'uav'
        ? [
            ['设备 ID', raw.deviceId],
            ['类型', raw.devType],
            ['经度', raw.longitude],
            ['纬度', raw.latitude],
          ]
        : [
            ['设备 ID', raw.deviceId],
            ['关联机型', raw.uavModel],
            ['经度', raw.operLongitude],
            ['纬度', raw.operLatitude],
            ['海拔', `${raw.operAltitudeGeo ?? 0} m`],
          ]

    bodyEl.innerHTML = rows
      .map(
        ([label, value]) =>
          `<div class="popup-row"><span class="popup-label">${label}</span><span class="popup-value">${value}</span></div>`,
      )
      .join('')

    // 如果 removePostRender 没有，则添加 postRender 事件
    if (!removePostRender) {
      removePostRender = viewer.scene.postRender.addEventListener(updatePosition)
    }
    // 更新详情框位置
    updatePosition()
  }

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    hide()
  })

  const onClick = (movement) => {
    // 点击屏幕，获取点击位置的实体
    const picked = viewer.scene.pick(movement.position)
    // 如果点击位置没有实体，或者实体没有 id，则隐藏详情框
    if (!Cesium.defined(picked) || !picked.id) {
      hide()
      return
    }

    // 获取点击位置的实体
    const entity = picked.id
    // 获取实体的属性 props
    const props = entity.properties?.getValue(Cesium.JulianDate.now())
    // 如果实体的属性 props 没有 role，或者 role 不是 uav 或 oper，则隐藏详情框
    if (!props || (props.role !== 'uav' && props.role !== 'oper')) {
      hide()
      return
    }
    // 获取实体的原始数据
    const raw = props.raw ?? dataByDeviceId.get(props.deviceId)
    // 如果实体的原始数据没有，则隐藏详情框
    if (!raw) {
      hide()
      return
    }
    // 显示详情框
    show(entity, props.role, raw)
  }

  viewer.screenSpaceEventHandler.setInputAction(
    onClick,
    Cesium.ScreenSpaceEventType.LEFT_CLICK,
  )

  return () => {
    hide()
    viewer.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_CLICK,
    )
    popup.remove()
    style.remove()
  }
}

function destroy() {
  cleanupClickPopup()
  cleanupClickPopup = () => {}
}
