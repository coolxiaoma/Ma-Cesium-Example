# Ma Cesium Example

本地运行的 Cesium 案例展示平台（Vue 3 + Vite），支持查看源码、修改并即时运行。无需后端。

## 快速开始

```bash
npm install
npm run dev
```

`npm install` 会自动把 Monaco 静态资源拷到 `public/monaco`（本地离线编辑器用）。

浏览器打开终端提示的地址（默认 `http://localhost:5173`）。

可选：复制 `.env.example` 为 `.env`，填入 [Cesium Ion Token](https://ion.cesium.com/tokens)。不填则使用 OpenStreetMap 影像。

## 使用方式

1. 左侧选择案例
2. 右侧编辑源码
3. 点击「运行」或 `Ctrl/⌘ + Enter`
4. 「重置」恢复该案例原始源码并重新运行
5. 「重建地球」在场景异常时销毁并重建 Viewer

## 新增案例

1. 在 `src/examples/<分组>/<案例名>/playground.ts` 编写源码（不要写 `import`，平台注入 `Cesium`）
2. 在 `src/examples/registry.ts` 注册：

```ts
{
  id: 'my-demo',
  title: '我的案例',
  group: '入门',
  description: '一句话说明',
  loadCode: () => import('./basic/my-demo/playground.ts?raw'),
}
```

Playground 约定：

```ts
async function setup(viewer) {
  // 必填
}

function destroy() {
  // 可选：清理定时器、事件等
}
```

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览构建产物 |
