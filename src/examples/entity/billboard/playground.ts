/**
 * Entity — 无人机 / 飞手 Billboard + 连线
 * 点击图标在上方弹出详情介绍框。
 */

let cleanupClickPopup = () => {}

async function setup(viewer) {
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
  })
}


function destroy() {

}
