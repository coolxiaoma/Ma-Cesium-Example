/**
 * 综合案例 — 功能菜单 + 打点绘面
 * 思路：
 * 1. 在 Cesium 容器上挂功能菜单
 * 2. 开启绘面后，每次点击地图打一个点，并写入 positions
 * 3. 一个 polygon 用 CallbackProperty 读 positions，点满 3 个后自动围成面
 */
let cleanup = () => {}

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
  const positions = [] // 所有顶点坐标，polygon 会跟着它更新

  // 一个面：positions 变了（且 ≥ 3 个点），面就变了
  viewer.entities.add({
    polygon: {
      // CallbackProperty 每次渲染时读最新 positions，包成 PolygonHierarchy
      hierarchy: new Cesium.CallbackProperty(
        () => new Cesium.PolygonHierarchy(positions),
        false,
      ),
      material: Cesium.Color.CYAN.withAlpha(0.4),
      outline: true,
      outlineColor: Cesium.Color.CYAN,
    },
  })

  toggleBtn.addEventListener('click', () => {
    (menu as HTMLElement).hidden = !(menu as HTMLElement).hidden
  })

  drawBtn.addEventListener('click', () => {
    drawing = !drawing;
    (drawBtn as HTMLButtonElement).dataset.active = drawing ? '1' : '0';
    (drawBtn as HTMLButtonElement).textContent = drawing ? '绘面中…' : '绘面'
  })

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction((click) => {
    if (!drawing) return
    const cartesian = viewer.scene.pickPosition(click.position)
      ?? viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid)
    if (!cartesian) return

    // 1. 记下坐标 → 满 3 个点后自动成面，之后继续加点会扩展面
    positions.push(cartesian)
    // 2. 同时画一个带序号的点，方便看清顶点
    count += 1
    viewer.entities.add({
      name: `Point-${count}`,
      position: cartesian,
      point: {
        pixelSize: 12,
        color: Cesium.Color.CYAN,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: String(count),
        font: '12px sans-serif',
        pixelOffset: new Cesium.Cartesian2(0, -18),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
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

/** 在 Cesium 容器上挂功能菜单，返回节点供业务绑定 / destroy 清理 */
function createToolsPanel(container) {
  const panel = document.createElement('div')
  panel.className = 'ma-tools'
  panel.innerHTML = `
    <button type="button" class="ma-tools-toggle">功能</button>
    <div class="ma-tools-menu" hidden>
      <button type="button" class="ma-tools-draw" data-active="0">绘面</button>
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
    toggleBtn: panel.querySelector('.ma-tools-toggle'),
    menu: panel.querySelector('.ma-tools-menu'),
    drawBtn: panel.querySelector('.ma-tools-draw'),
    dispose() {
      panel.remove()
      style.remove()
    },
  }
}
