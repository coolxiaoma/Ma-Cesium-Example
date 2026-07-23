<script setup lang="ts">
import { VueMonacoEditor, loader } from '@guolao/vue-monaco-editor'
import type { editor } from 'monaco-editor'

const base = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`

// 使用 public/monaco（postinstall 从 node_modules 拷贝），本地离线可用
loader.config({
  paths: {
    vs: `${base}monaco/vs`,
  },
})

/** Monaco 内置 TS 服务不读项目 d.ts，需自行注入 playground 全局声明 */
let playgroundTsConfigured = false

function configurePlaygroundTypescript(monaco: {
  languages: {
    typescript: {
      ScriptTarget: { ESNext: number }
      ModuleResolutionKind: { NodeJs: number }
      ModuleKind: { ESNext: number }
      typescriptDefaults: {
        setCompilerOptions: (options: Record<string, unknown>) => void
        addExtraLib: (content: string, filePath?: string) => unknown
      }
    }
  }
}) {
  if (playgroundTsConfigured) return
  playgroundTsConfigured = true

  const ts = monaco.languages.typescript
  ts.typescriptDefaults.setCompilerOptions({
    target: ts.ScriptTarget.ESNext,
    allowNonTsExtensions: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    module: ts.ModuleKind.ESNext,
    noEmit: true,
    esModuleInterop: true,
    // playground 片段无 import / 无显式参数类型
    strict: false,
    noImplicitAny: false,
  })

  // 与 runPlayground 注入的全局 Cesium 对齐（勿写 import）
  ts.typescriptDefaults.addExtraLib(
    [
      '/** 由平台注入，playground 中勿 import */',
      'declare const Cesium: any;',
      '',
      '/** Viewer 由 setup(viewer) 传入 */',
      'type Viewer = any;',
      '',
    ].join('\n'),
    'ts:cesium-playground.d.ts',
  )
}

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  run: []
}>()

function onUpdate(value: string) {
  emit('update:modelValue', value)
}

function onBeforeMount(monaco: Parameters<typeof configurePlaygroundTypescript>[0]) {
  configurePlaygroundTypescript(monaco)
}

function onMount(instance: editor.IStandaloneCodeEditor) {
  // KeyMod.CtrlCmd = 2048, KeyCode.Enter = 3
  instance.addCommand(2048 | 3, () => emit('run'))
}
</script>

<template>
  <VueMonacoEditor
    class="code-editor"
    :value="modelValue"
    language="typescript"
    theme="vs-dark"
    :options="{
      automaticLayout: true,
      fontSize: 13,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      tabSize: 2,
      wordWrap: 'on',
      padding: { top: 12, bottom: 12 },
    }"
    @update:value="onUpdate"
    @beforeMount="onBeforeMount"
    @mount="onMount"
  />
</template>

<style scoped>
.code-editor {
  width: 100%;
  height: 100%;
}
</style>
