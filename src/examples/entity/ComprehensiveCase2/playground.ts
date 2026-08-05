/**
 * 综合案例 — 功能菜单 + 打点连线
 * 思路：
 * 1. 在 Cesium 容器上挂功能菜单
 * 2. 开启绘线后，左键点击地图打点；临时线用 CallbackProperty 跟着 positions 走
 * 3. 右键结束当前线：≥2 点则定稿成静态 polyline，再清空临时点，可继续画下一条
 * 4. 再次点「绘线」退出时，也会尝试结束当前线
 */
let cleanup = () => {}

async function setup(viewer) {
  const longitude = 116.391
  const latitude = 39.907

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 250000),
    duration: 1.5,
  })

  const tools = createToolsPanel(viewer.cesiumWidget.container) // 创建功能菜单
  const { toggleBtn, menu, drawBtn } = tools // 获取功能菜单按钮
  let drawing = false
  let count = 0
  const positions = [] // 当前正在画的临时顶点（数组）
  const draftMarkers = [] // 未定稿顶点；点数不足被取消时要删掉

  // 临时线：只负责「画到一半」的那条
  viewer.entities.add({
    polyline: {
      positions: new Cesium.CallbackProperty(() => positions, false),
      width: 3,
      material: Cesium.Color.CYAN,
      clampToGround: true,  // 是否沿地球表面绘制
    },
  })

  function setDrawing(on) {
    drawing = on
    ;(drawBtn as HTMLButtonElement).dataset.active = on ? '1' : '0'
    ;(drawBtn as HTMLButtonElement).textContent = on ? '绘线中…' : '绘线'
  }

  /** 结束当前线：够 2 点就定稿成静态线；不够则去掉未完成的临时点 */
  function finishLine() {
    if (positions.length >= 2) {
      viewer.entities.add({
        polyline: {
          positions: positions.slice(),
          width: 3,
          material: Cesium.Color.CYAN,
          clampToGround: true,
        },
      })
      draftMarkers.length = 0 // 顶点标记留下来，只解除临时追踪
    } else {
      while (draftMarkers.length) {
        viewer.entities.remove(draftMarkers.pop())
      }
    }
    positions.length = 0
  }

  toggleBtn.addEventListener('click', () => { // 功能菜单按钮点击事件
    (menu as HTMLElement).hidden = !(menu as HTMLElement).hidden
  })

  drawBtn.addEventListener('click', () => { // 点绘制按钮点击事件（用于判断是否在绘制状态，并切换按钮状态）
    if (drawing) {
      // 退出绘线 = 结束当前这条
      finishLine()
      setDrawing(false)
      return
    }
    setDrawing(true)
  })

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

  // 左键：加点
  handler.setInputAction((click) => {
    if (!drawing) return
    const cartesian = viewer.scene.pickPosition(click.position)
      ?? viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid)
    if (!cartesian) return

    positions.push(cartesian) // 将点击位置的笛卡尔坐标添加到临时顶点数组中
    count += 1
    const marker = viewer.entities.add({
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
    draftMarkers.push(marker)
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  // 右键：结束当前线（不退出绘线模式，可继续画下一条）
  handler.setInputAction(() => {
    if (!drawing) return
    finishLine()
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

  const blockContextMenu = (e) => e.preventDefault() // 阻止右键菜单显示
  viewer.scene.canvas.addEventListener('contextmenu', blockContextMenu) // 添加右键菜单事件监听，防止右键菜单显示

  cleanup = () => {
    handler.destroy()
    viewer.scene.canvas.removeEventListener('contextmenu', blockContextMenu)
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
    <button type="button" class="ma-tools-toggle">功能（左键打点，右键结束绘线）</button>
    <div class="ma-tools-menu" hidden>
      <button type="button" class="ma-tools-draw" data-active="0">绘线</button>
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
