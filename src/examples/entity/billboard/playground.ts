/**
 * Entity — Billboard 广告牌简单绘制，并添加鼠标划过显示标签
 */

let cleanupClickPopup = () => {}

async function setup(viewer) {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.45, 39.86, 2000),
    duration: 1.5,
  })
 // 无人机：properties 挂上完整数据源
 viewer.entities.add({
    id: `uav-001`,
    name: '无人机',
    position: Cesium.Cartesian3.fromDegrees(116.45, 39.86),
    billboard: {
      image: '/img/uav.png',
      scale: 1,
      color: Cesium.Color.WHITE, // 白色
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // 水平居中
      verticalOrigin: Cesium.VerticalOrigin.CENTER, // 垂直底部
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 高度参考地面
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // 禁用深度测试距离
    },
    label: {
      text: '无人机', // 或 entity.name
      font: '14px sans-serif',
      show: false, // 默认不显示
      pixelOffset: new Cesium.Cartesian2(0, -40),
      fillColor: Cesium.Color.WHITE,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  })

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  let hovered = null
  handler.setInputAction(function(movement) {
    // console.log(movement);
    const picked  = viewer.scene.pick(movement.endPosition); // 获取鼠标位置
    if(picked?.id){
      console.log(picked.id);
    }
     // pick 到的可能是 Entity，也可能是 Entity 的 graphic
    const entity = picked?.id instanceof Cesium.Entity ? picked.id : null
    // 如果 picked 到的 entity 有 billboard，则显示标签
    const next = entity?.billboard ? entity : null
    if (next === hovered) return
    if (hovered?.label) hovered.label.show = false
    hovered = next
    if (hovered?.label) {
      hovered.label.text = hovered.name ?? ''
      hovered.label.show = true
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  //
}


function destroy() {

}
