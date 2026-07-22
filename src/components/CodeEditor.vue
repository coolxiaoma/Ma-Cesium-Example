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
    @mount="onMount"
  />
</template>

<style scoped>
.code-editor {
  width: 100%;
  height: 100%;
}
</style>
