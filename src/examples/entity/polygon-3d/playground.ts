/**
 * Entity — 以经纬度坐标绘制3D面实体 - 警戒区、监视区、高层监视区
 * 修改 positions 后点击「运行」即可看到效果。
 */
async function setup(viewer) {
  // ---------------------------------------------- 计算中心点 ----------------------------------------------
  const positions = [
    116.397, 39.907, 116.403, 39.907, 116.403, 39.913, 116.397, 39.913,
  ];

  const cartesians = Cesium.Cartesian3.fromDegreesArray(positions); // 将经纬度坐标转换为笛卡尔坐标
  const boundingSphere = Cesium.BoundingSphere.fromPoints(cartesians); // 计算包围球
  const center = boundingSphere.center; // Cartesian3 中心点坐标
  // 转回经纬度
  const cartographic = Cesium.Cartographic.fromCartesian(center); // 将中心点坐标转换为地理坐标
  const centerLongitude = Cesium.Math.toDegrees(cartographic.longitude); // 中心点经度
  const centerLatitude = Cesium.Math.toDegrees(cartographic.latitude); // 中心点纬度

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      centerLongitude,
      centerLatitude,
      5000,
    ),
    duration: 1.5,
  });
  // ---------------------------------------------- 警戒区 ----------------------------------------------
  let alert = viewer.entities.add({
    name: "警戒区",
    position: Cesium.Cartesian3.fromDegrees(116.403, 39.907), // 必须
    polygon: {
      show: true,
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        // 多边形顶点坐标
        116.397, 39.907, 116.403, 39.907, 116.403, 39.913, 116.397, 39.913,
      ]),
      height: 200, // 多边形高度
      extrudedHeight: 1000, // 拉伸至1000米高度
      material: new Cesium.Color(168 / 255, 22 / 255, 22 / 255, 0.5), // 材质颜色
      outline: true, // 是否显示轮廓
      outlineColor: new Cesium.Color(168 / 255, 22 / 255, 22 / 255, 1), // 轮廓颜色
    },
  });
  // 2) 2000m 信息盒（label）
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(116.403, 39.907, 2000), // 经纬度传入高度值2000
    label: {
      text: "警戒区\n预警区\n底高: 200m 顶高: 1000m", // 底高: 200m 顶高: 1000m
      font: "14pt sans-serif", // 字体样式
      fillColor: Cesium.Color.WHITE, // 字体颜色
      showBackground: true, // 是否显示背景颜色
      backgroundColor: new Cesium.Color(168 / 255, 22 / 255, 22 / 255, 0.8), // 背景颜色
      backgroundPadding: new Cesium.Cartesian2(12, 10), // 背景padding
      outlineColor: new Cesium.Color(168 / 255, 22 / 255, 22 / 255, 1), // 文字轮廓颜色
      outlineWidth: 2, // 文字轮廓宽度
      style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
      verticalOrigin: Cesium.VerticalOrigin.CENTER, // 垂直位置
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // 水平位置
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // 避免被地形/体块挡住
    },
  });
  // 3) 虚线：从体块顶面中心 → 标签
  viewer.entities.add({
    polyline: {
      positions: [
        Cesium.Cartesian3.fromDegrees(116.403, 39.907, 1000), // 从体块顶面中心 → 信息盒-开始
        Cesium.Cartesian3.fromDegrees(116.403, 39.907, 2000), // 从体块顶面中心 → 信息盒-结束
      ],
      width: 2,
      material: new Cesium.PolylineDashMaterialProperty({
        color: new Cesium.Color(168 / 255, 22 / 255, 22 / 255, 1),
        dashLength: 16,
      }),
    },
  });

  // ---------------------------------------------- 监视区 ----------------------------------------------
  const monitorLon = 116.39;
  const monitorLat = 39.92;
  const labelHeight = 2000;
  const topHeight = 200; // 与 extrudedHeight 一致，引线从顶面拉上去
  const labelPosition = Cesium.Cartesian3.fromDegrees(
    monitorLon,
    monitorLat,
    labelHeight,
  );
  let monitor = viewer.entities.add({
    name: "监视区",
    position: Cesium.Cartesian3.fromDegrees(111.434144, 30.649819), // 必须
    polygon: {
      show: true,
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        // 多边形顶点坐标
        116.39, 39.9, 116.41, 39.9, 116.41, 39.92, 116.39, 39.92,
      ]),
      height: 0,
      extrudedHeight: 200, // 拉伸至100米高度
      material: new Cesium.Color(63 / 255, 168 / 255, 22 / 255, 0.5), // 材质颜色
      outline: true, // 是否显示轮廓
      outlineColor: new Cesium.Color(63 / 255, 168 / 255, 22 / 255, 1), // 轮廓颜色
    },
  });

  // 2) 2000m 信息盒（label）
  viewer.entities.add({
    position: labelPosition,
    label: {
      text: "监视区\n预警区\n底高: 0m 顶高: 200m", // 底高: 0m 顶高: 200m
      font: "14pt sans-serif", // 字体样式
      fillColor: Cesium.Color.WHITE, // 字体颜色
      showBackground: true, // 是否显示背景颜色
      backgroundColor: new Cesium.Color(63 / 255, 168 / 255, 22 / 255, 0.8), // 背景颜色
      backgroundPadding: new Cesium.Cartesian2(12, 10), // 背景padding
      outlineColor: new Cesium.Color(63 / 255, 168 / 255, 22 / 255, 1), // 文字轮廓颜色
      outlineWidth: 2, // 文字轮廓宽度
      style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
      verticalOrigin: Cesium.VerticalOrigin.CENTER, // 垂直位置
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // 水平位置
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // 避免被地形/体块挡住
    },
  });
  // 3) 虚线：从体块顶面中心 → 标签
  viewer.entities.add({
    polyline: {
      positions: [
        Cesium.Cartesian3.fromDegrees(monitorLon, monitorLat, topHeight),
        labelPosition,
      ],
      width: 2,
      material: new Cesium.PolylineDashMaterialProperty({
        color: new Cesium.Color(63 / 255, 168 / 255, 22 / 255, 1),
        dashLength: 16,
      }),
    },
  });

  // ---------------------------------------------- 高层监视区 ----------------------------------------------
  // 外部轮廓
  const outerPositions = Cesium.Cartesian3.fromDegreesArray([
    116.39, 39.9, 116.41, 39.9, 116.41, 39.92, 116.39, 39.92,
  ]);

  // 内部孔洞
  const innerPositions = Cesium.Cartesian3.fromDegreesArray([
    116.397, 39.907, 116.403, 39.907, 116.403, 39.913, 116.397, 39.913,
  ]);

  let monitor3D = viewer.entities.add({
    name: "高层监视区",
    position: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 39.9), // 必须
    polygon: {
      show: true,
      hierarchy: new Cesium.PolygonHierarchy(outerPositions, [
        new Cesium.PolygonHierarchy(innerPositions),
      ]),
      height: 200,
      extrudedHeight: 1000, // 拉伸至1000米高度
      material: new Cesium.Color(48 / 255, 127 / 255, 245 / 255, 0.5), // 材质颜色
      outline: true, // 是否显示轮廓
      outlineColor: new Cesium.Color(48 / 255, 127 / 255, 245 / 255, 1), // 轮廓颜色
    },
  });
  // 2) 2000m 信息盒（label）
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 2000), // 经纬度传入高度值2000
    label: {
      text: "高层监视区\n预警区\n底高: 200m 顶高: 1000m", // 底高: 200m 顶高: 1000m
      font: "14pt sans-serif", // 字体样式
      fillColor: Cesium.Color.WHITE, // 字体颜色
      showBackground: true, // 是否显示背景颜色
      backgroundColor: new Cesium.Color(48 / 255, 127 / 255, 245 / 255, 0.8), // 背景颜色
      backgroundPadding: new Cesium.Cartesian2(12, 10), // 背景padding
      outlineColor: new Cesium.Color(48 / 255, 127 / 255, 245 / 255, 1), // 文字轮廓颜色
      outlineWidth: 2, // 文字轮廓宽度
      style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
      verticalOrigin: Cesium.VerticalOrigin.CENTER, // 垂直位置
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // 水平位置
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // 避免被地形/体块挡住
    },
  });
  // 3) 虚线：从体块顶面中心 → 标签
  viewer.entities.add({
    polyline: {
      positions: [
        Cesium.Cartesian3.fromDegrees(116.39, 39.9, 1000),
        Cesium.Cartesian3.fromDegrees(116.39, 39.9, 2000),
      ],
      width: 2,
      material: new Cesium.PolylineDashMaterialProperty({
        color: new Cesium.Color(48 / 255, 127 / 255, 245 / 255, 1),
        dashLength: 16,
      }),
    },
  });
}

function destroy() {}
