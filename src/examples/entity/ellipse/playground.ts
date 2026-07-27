/**
 * Entity — 添加椭圆
 * 修改 longitude / latitude / color 后点击「运行」即可看到效果。
 */
let cleanupClickPopup = () => {};
async function setup(viewer) {
  const longitude = 116.391;
  const latitude = 39.907;

  // 飞行到椭圆位置
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 100000),
    duration: 1.5,
  });

  let radarInfos = [
    {
      deviceId: "1234567890",
      deviceName: "雷达",
      deviceType: "F01",
      deviceStatusName: "在线",
      scope: 50000,
      deviceStatus: 1,
      devicePosition: {
        longitude: 116.391,
        latitude: 39.907,
      },
    },
    {
      deviceId: "1234567891",
      deviceName: "雷达2",
      deviceType: "F02",
      deviceStatusName: "离线",
      scope: 30000,
      deviceStatus: 0,
      devicePosition: {
        longitude: 116.392,
        latitude: 39.307,
      },
    },
  ];
  radarInfos.forEach((radarInfo) => {
    // 最右侧：正东 90°
    const rightPoint = getPointByBearing(
      radarInfo.devicePosition.longitude,
      radarInfo.devicePosition.latitude,
      radarInfo.scope,
      90,
    );
    // 最左侧：正西 270°
    const leftPoint = getPointByBearing(
      radarInfo.devicePosition.longitude,
      radarInfo.devicePosition.latitude,
      radarInfo.scope,
      270,
    );
    const ONLINE = Cesium.Color.fromCssColorString('#a81616')
    const OFFLINE = Cesium.Color.fromCssColorString('#999999')
    const transparencyZeroFive = (radarInfo.deviceStatus === 1 ? ONLINE : OFFLINE).withAlpha(0.5) // 透明度0.5
    const transparencyOne = (radarInfo.deviceStatus === 1 ? ONLINE : OFFLINE).withAlpha(1) // 透明度1
    // 添加椭圆
    viewer.entities.add({
      name: radarInfo.deviceName,
      position: Cesium.Cartesian3.fromDegrees(
        radarInfo.devicePosition.longitude,
        radarInfo.devicePosition.latitude,
        0,
      ),
      properties: radarInfo,
      // 椭圆-是
      ellipse: {
        semiMajorAxis: radarInfo.scope, // 长轴
        semiMinorAxis: radarInfo.scope, // 短轴
        height: 0, // 高度
        material: transparencyZeroFive, // 材质
        outline: true, // 是否显示轮廓
        outlineColor: transparencyZeroFive, // 轮廓颜色
        outlineWidth: 2, // 轮廓宽度
        show: true, // 是否显示
      },
      // 广告牌
      billboard: {
        image:
          radarInfo.deviceStatus === 1
            ? "/img/radar-online.png"
            : "/img/radar-offline.png",
        scale: 1,
        color: Cesium.Color.WHITE,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 高度参考
        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 用于指定要禁用深度测试的相机的距离(解决雷达图被椭圆遮挡的问题)
      },
    });

    // 添加右侧标签
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        rightPoint.longitude,
        rightPoint.latitude,
        20000,
      ), // 经纬度传入高度值2000
      label: {
        text: `${radarInfo.deviceName}\n${radarInfo.deviceType}\n${radarInfo.deviceStatusName}`, // 设备名称、类型、状态
        font: "14pt sans-serif", // 字体样式
        fillColor: Cesium.Color.WHITE, // 字体颜色
        showBackground: true, // 是否显示背景颜色
        backgroundColor: transparencyOne, // 背景颜色
        backgroundPadding: new Cesium.Cartesian2(12, 10), // 背景padding
        outlineColor: transparencyOne, // 文字轮廓颜色
        outlineWidth: 2, // 文字轮廓宽度
        style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
        verticalOrigin: Cesium.VerticalOrigin.CENTER, // 垂直位置
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // 水平位置
        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 避免被地形/体块挡住
      },
    });

    // 添加虚线：从体块顶面中心 → 标签
    viewer.entities.add({
      polyline: {
        positions: [
          Cesium.Cartesian3.fromDegrees(
            rightPoint.longitude,
            rightPoint.latitude,
            0,
          ), // 从体块顶面中心 → 信息盒-开始
          Cesium.Cartesian3.fromDegrees(
            rightPoint.longitude,
            rightPoint.latitude,
            20000,
          ), // 从体块顶面中心 → 信息盒-结束
        ],
        width: 5,
        material: new Cesium.PolylineDashMaterialProperty({
          color: transparencyOne,
          dashLength: 16,
        }),
      },
    });
  });

  const radarDataByDeviceId = new Map(
    radarInfos.map((item) => [item.deviceId, item]),
  );
  cleanupClickPopup = bindDetailPopup(viewer, radarDataByDeviceId);
}
/**
 * 点击图标 → 在图标上方弹出详情框（随相机移动跟踪）
 */
function bindDetailPopup(viewer, dataByDeviceId) {
  const container = viewer.cesiumWidget.container;
  const popup = document.createElement("div");
  popup.className = "cesium-entity-detail-popup";
  popup.innerHTML = `
    <button type="button" class="popup-close" aria-label="关闭">×</button>
    <div class="popup-title"></div>
    <div class="popup-body"></div>
  `;
  container.appendChild(popup);

  const style = document.createElement("style");
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
  `;
  document.head.appendChild(style);

  const titleEl = popup.querySelector(".popup-title");
  const bodyEl = popup.querySelector(".popup-body");
  const closeBtn = popup.querySelector(".popup-close");

  let trackedEntity = null; // 跟踪的实体
  let removePostRender = null; // 移除 postRender 事件

  function hide() {
    // 隐藏详情框
    trackedEntity = null;
    popup.style.display = "none";
    if (removePostRender) {
      removePostRender();
      removePostRender = null;
    }
  }

  //清空 trackedEntity 后，updatePosition 不会被调用，详情框不会消失
  function updatePosition() {
    if (!trackedEntity) return;
    // 获取跟踪实体的三维坐标
    const position = trackedEntity.position?.getValue(viewer.clock.currentTime);
    if (!position) {
      hide();
      return;
    }
    // 将三维坐标转换为二维坐标
    const canvasPos = viewer.scene.cartesianToCanvasCoordinates(position);
    // 如果转换后的二维坐标没有，则隐藏详情框
    if (!Cesium.defined(canvasPos)) {
      popup.style.display = "none";
      return;
    }
    popup.style.display = "block";
    popup.style.left = `${canvasPos.x}px`;
    popup.style.top = `${canvasPos.y - 40}px`; // 40px 是图片的高度
  }

  //显示详情框
  function show(entity, raw) {
    trackedEntity = entity;
    titleEl.textContent = `${raw.deviceName} · ${raw.deviceType}`;

    const rows = [
      ["设备 ID", raw.deviceId],
      ["类型", raw.deviceType],
      ["状态", raw.deviceStatusName],
      ["范围", raw.scope],
      ["经度", raw.devicePosition.longitude],
      ["纬度", raw.devicePosition.latitude],
    ];

    bodyEl.innerHTML = rows
      .map(
        ([label, value]) =>
          `<div class="popup-row"><span class="popup-label">${label}</span><span class="popup-value">${value}</span></div>`,
      )
      .join("");

    // 如果 removePostRender 没有，则添加 postRender 事件
    if (!removePostRender) {
      removePostRender =
        viewer.scene.postRender.addEventListener(updatePosition);
    }
    // 更新详情框位置
    updatePosition();
  }

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    hide();
  });

  const onClick = (movement) => {
    // 点击屏幕，获取点击位置的实体
    const picked = viewer.scene.pick(movement.position);
    // 如果点击位置没有实体，或者实体没有 id，则隐藏详情框
    if (!Cesium.defined(picked) || !picked.id) {
      hide();
      return;
    }

    // 获取点击位置的实体
    const entity = picked.id;
    // 获取实体的属性 props
    const props = entity.properties?.getValue(Cesium.JulianDate.now());

    // 获取实体的原始数据
    const raw = dataByDeviceId.get(props.deviceId);
    // 如果实体的原始数据没有，则隐藏详情框
    if (!raw) {
      hide();
      return;
    }
    // 显示详情框
    show(entity, raw);
  };

  viewer.screenSpaceEventHandler.setInputAction(
    onClick,
    Cesium.ScreenSpaceEventType.LEFT_CLICK,
  );

  return () => {
    hide();
    viewer.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_CLICK,
    );
    popup.remove();
    style.remove();
  };
}
/**
 * 根据中心点、距离、方位角 获取目标点经纬度
 * @param {number} lon 中心点经度
 * @param {number} lat 中心点纬度
 * @param {number} distance 米
 * @param {number} bearing 方位角(度) 0北 90东 180南 270西
 * @returns { {longitude:number,latitude:number} }
 */
function getPointByBearing(lon, lat, distance, bearing) {
  const startLonRad = Cesium.Math.toRadians(lon);
  const startLatRad = Cesium.Math.toRadians(lat);
  const bearingRad = Cesium.Math.toRadians(bearing);
  const earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius;

  const angularDist = distance / earthRadius;

  const lat2Rad = Math.asin(
    Math.sin(startLatRad) * Math.cos(angularDist) +
      Math.cos(startLatRad) * Math.sin(angularDist) * Math.cos(bearingRad),
  );

  const lon2Rad =
    startLonRad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDist) * Math.cos(startLatRad),
      Math.cos(angularDist) - Math.sin(startLatRad) * Math.sin(lat2Rad),
    );

  return {
    longitude: Cesium.Math.toDegrees(lon2Rad),
    latitude: Cesium.Math.toDegrees(lat2Rad),
  };
}
function destroy() {
  cleanupClickPopup();
}
