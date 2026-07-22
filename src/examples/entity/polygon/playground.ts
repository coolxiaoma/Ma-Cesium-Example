/**
 * Entity — 添加面
 * 修改 longitude / latitude / color 后点击「运行」即可看到效果。
 */
async function setup(viewer) {
  const longitude = 111.435519
  const latitude = 30.611572
  const positions = [
    111.435519,
    30.611572,
    111.550839,
    30.517633,
    111.529181,
    30.497636,
    111.413778,
    30.591553
  ]
  
  const cartesians = Cesium.Cartesian3.fromDegreesArray(positions) // 将经纬度坐标转换为笛卡尔坐标
  const boundingSphere = Cesium.BoundingSphere.fromPoints(cartesians) // 计算包围球
  const center = boundingSphere.center // Cartesian3 中心点坐标
  // 转回经纬度
  const cartographic = Cesium.Cartographic.fromCartesian(center) // 将中心点坐标转换为地理坐标
  const centerLongitude = Cesium.Math.toDegrees(cartographic.longitude) // 中心点经度
  const centerLatitude = Cesium.Math.toDegrees(cartographic.latitude) // 中心点纬度

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(centerLongitude, centerLatitude, 50000),
    duration: 1.5,
  })

    let alert = viewer.entities.add({
      name: "警戒区",
      position: Cesium.Cartesian3.fromDegrees(111.435519, 30.611572), // 必须
      polygon: {
          show: true,
          hierarchy: Cesium.Cartesian3.fromDegreesArray([
            111.435519,
            30.611572,
            111.550839,
            30.517633,
            111.529181,
            30.497636,
            111.413778,
            30.591553
          ]),
          height: 0,
          material:  new Cesium.Color(168 / 255, 22 / 255, 22 / 255, 0.5),
          outline: true,
          outlineColor: new Cesium.Color(168 / 255, 22 / 255, 22 / 255, 1),
      },
      label : {
        text : '警戒区',
        font : '14pt Source Han Sans CN',    //字体样式
        fillColor:Cesium.Color.WHITE,        //字体颜色
        backgroundColor: new Cesium.Color(168 / 255, 22 / 255, 22 / 255, 1),    //背景颜色
        showBackground:true,                //是否显示背景颜色
        style: Cesium.LabelStyle.FILL,        //label样式
        outlineWidth : 2,                    
        verticalOrigin : Cesium.VerticalOrigin.CENTER,//垂直位置
        horizontalOrigin :Cesium.HorizontalOrigin.LEFT,//水平位置
        pixelOffset:new Cesium.Cartesian2(10,0)            //偏移
    }
  })

  let monitor = viewer.entities.add({
    name: "监视区",
    position: Cesium.Cartesian3.fromDegrees(111.434144, 30.649819), // 必须
    polygon: {
        show: true,
        hierarchy: Cesium.Cartesian3.fromDegreesArray([
          111.434144,
          30.649819,
          111.595106,
          30.518778,
          111.530517,
          30.459383,
          111.369567,
          30.590350
        ]),
        height: 0,
        material:  new Cesium.Color(63 / 255, 168 / 255, 22 / 255, 0.5),
        outline: true,
        outlineColor: new Cesium.Color(63 / 255, 168 / 255, 22 / 255, 1),
    },
    label : {
      text : '监视区',
      font : '14pt Source Han Sans CN',    //字体样式
      fillColor:Cesium.Color.WHITE,        //字体颜色
      backgroundColor: new Cesium.Color(63 / 255, 168 / 255, 22 / 255, 1),    //背景颜色
      showBackground:true,                //是否显示背景颜色
      style: Cesium.LabelStyle.FILL,        //label样式
      outlineWidth : 2,                    
      verticalOrigin : Cesium.VerticalOrigin.CENTER,//垂直位置
      horizontalOrigin :Cesium.HorizontalOrigin.LEFT,//水平位置
      pixelOffset:new Cesium.Cartesian2(10,0)            //偏移
  }

})

}

function destroy() {}
