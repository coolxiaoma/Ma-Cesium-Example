/**
 * 综合案例 — 功能菜单 + 点绘制
 * 思路：
 * 1. 在 Cesium 容器上挂功能菜单（按钮和菜单）
 * 2. 功能菜单包含点绘制按钮，点击后显示点绘制状态，再点击后隐藏点绘制状态
 * 3. 屏幕空间事件处理，点击后绘制点，按住鼠标左键拖动绘制点
 */
let cleanup = () => {}

/** 在 Cesium 容器上挂功能菜单，返回节点供业务绑定 / destroy 清理 */
function createToolsPanel(container) {
  const panel = document.createElement('div')
  panel.className = 'ma-tools'
  panel.innerHTML = `
    <button type="button" class="ma-tools-toggle">功能</button>
    <div class="ma-tools-menu" hidden>
      <button type="button" class="ma-tools-draw" data-active="0">点绘制</button>
    </div>
  `
  container.appendChild(panel)

  const style = document.createElement('style')
  style.textContent = `
    .ma-tools {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 20;
      display: flex;
      flex-direction: column;
      gap: 6px;
      pointer-events: auto;
    }
    .ma-tools button {
      padding: 6px 12px;
      border: 1px solid rgba(71, 85, 105, 0.9);
      border-radius: 6px;
      background: rgba(18, 24, 32, 0.92);
      color: #e8eef7;
      font-size: 13px;
      cursor: pointer;
    }
    .ma-tools button[data-active="1"] {
      border-color: #38bdf8;
      color: #38bdf8;
    }
  `
  document.head.appendChild(style)

  return {
    panel,
    style,
    toggleBtn: panel.querySelector('.ma-tools-toggle'), // 功能菜单按钮
    menu: panel.querySelector('.ma-tools-menu'), // 功能菜单
    drawBtn: panel.querySelector('.ma-tools-draw'), // 点绘制按钮
    dispose() {
      panel.remove()
      style.remove()
    },
  }
}

async function setup(viewer) {
  const longitude = 116.391
  const latitude = 39.907

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 250000),
    duration: 1.5,
  })

  const tools = createToolsPanel(viewer.cesiumWidget.container)
  const { toggleBtn, menu, drawBtn } = tools
  let drawing = false
  let count = 0

  // 功能菜单按钮点击事件
  toggleBtn.addEventListener('click', () => {
    (menu as HTMLElement).hidden = !(menu as HTMLElement).hidden
  })

  // 点绘制按钮点击事件（用于判断是否在绘制状态，并切换按钮状态）
  drawBtn.addEventListener('click', () => {
    drawing = !drawing;
    (drawBtn as HTMLButtonElement).dataset.active = drawing ? '1' : '0';
    (drawBtn as HTMLButtonElement).textContent = drawing ? '点绘制中…' : '点绘制'
  })

  // 屏幕空间事件处理
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction((click) => {
    if (!drawing) return
    // 获取点击位置的笛卡尔坐标，如果获取不到，则获取点击位置的经纬度
    const cartesian = viewer.scene.pickPosition(click.position) // 获取点击位置的笛卡尔坐标
      ?? viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid) // 获取点击位置的经纬度
    if (!cartesian) return
    count += 1
    viewer.entities.add({
      name: `Point-${count}`,
      position: cartesian,
      point: {
        pixelSize: 12, // 像素大小
        color: Cesium.Color.CYAN, // 颜色
        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 禁用深度测试距离
      },
      label: {
        text: String(count), // 文本
        font: '12px sans-serif', // 字体
        pixelOffset: new Cesium.Cartesian2(0, -18), // 像素偏移
        style: Cesium.LabelStyle.FILL_AND_OUTLINE, // 样式
        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 禁用深度测试距离
      },
    })
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  cleanup = () => {
    handler.destroy()
    tools.dispose()
    cleanup = () => {}
  }
}

function destroy() {
  cleanup()
}