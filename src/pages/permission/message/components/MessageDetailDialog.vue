<!--
  消息详情弹窗组件
  @description 展示消息的详细信息，包括类型、状态、标题、内容、时间等
  @author System
  @date 2026-02-28
-->
<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="消息详情"
    :width="600"
    :footer="false"
    @close="handleClose"
  >
    <div v-if="message" class="message-detail">
      <t-descriptions :column="1" bordered>
        <t-descriptions-item label="消息类型">
          <t-tag :theme="getTypeTheme(message.type)">
            {{ getTypeName(message.type) }}
          </t-tag>
        </t-descriptions-item>

        <t-descriptions-item label="阅读状态">
          <t-tag :theme="message.isRead === 0 ? 'warning' : 'success'">
            {{ message.isRead === 0 ? '未读' : '已读' }}
          </t-tag>
        </t-descriptions-item>

        <t-descriptions-item label="消息标题">
          {{ message.title }}
        </t-descriptions-item>

        <t-descriptions-item label="消息内容">
          <div class="message-content">
            {{ message.content }}
          </div>
        </t-descriptions-item>

        <t-descriptions-item label="创建时间">
          {{ formatTime(message.createTime) }}
        </t-descriptions-item>

        <t-descriptions-item v-if="message.readTime" label="阅读时间">
          {{ formatTime(message.readTime) }}
        </t-descriptions-item>
      </t-descriptions>

      <div class="dialog-footer">
        <t-space>
          <t-button
            v-if="message.isRead === 0"
            theme="primary"
            @click="handleMarkRead"
          >
            标记已读
          </t-button>
          <t-button theme="default" @click="handleClose">
            关闭
          </t-button>
        </t-space>
      </div>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Message } from '@/api/message';

/**
 * 组件属性接口
 */
interface Props {
  /** 弹窗是否可见 */
  visible: boolean;
  /** 消息对象 */
  message: Message | null;
}

/**
 * 组件事件接口
 */
interface Emits {
  /** 更新弹窗可见状态 */
  (e: 'update:visible', value: boolean): void;
  /** 标记消息为已读 */
  (e: 'mark-read', id: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * 弹窗可见状态（双向绑定）
 */
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

/**
 * 关闭弹窗
 */
const handleClose = () => {
  dialogVisible.value = false;
};

/**
 * 标记已读
 */
const handleMarkRead = () => {
  if (props.message) {
    emit('mark-read', props.message.id);
    handleClose();
  }
};

/**
 * 获取消息类型名称
 */
const getTypeName = (type: number) => {
  const typeMap: Record<number, string> = {
    0: '报警通知',
    1: '系统通知',
    2: '业务通知',
  };
  return typeMap[type] || '未知';
};

/**
 * 获取消息类型主题
 */
const getTypeTheme = (type: number) => {
  const themeMap: Record<number, string> = {
    0: 'danger',
    1: 'primary',
    2: 'warning',
  };
  return themeMap[type] || 'default';
};

/**
 * 格式化时间
 */
const formatTime = (time: string) => {
  if (!time) return '-';
  return time.replace('T', ' ').substring(0, 19);
};
</script>

<style scoped lang="less">
.message-detail {
  .message-content {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.6;
    max-height: 300px;
    overflow-y: auto;
  }

  .dialog-footer {
    margin-top: 24px;
    text-align: right;
  }
}
</style>
