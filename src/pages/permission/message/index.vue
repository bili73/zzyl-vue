<!--
  消息管理主页面（管理端）
  @description 管理端消息管理，查看系统通知和报警通知
  @author System
  @date 2026-02-28
-->
<template>
  <div class="message-management">
    <!-- 顶部搜索栏 -->
    <t-card class="search-card">
      <t-form :data="searchForm" layout="inline">
        <t-form-item label="消息类型" name="type">
          <t-select
            v-model="searchForm.type"
            :clearable="true"
            placeholder="请选择消息类型"
            style="width: 200px"
          >
            <t-option :value="0" label="报警通知" />
            <t-option :value="1" label="系统通知" />
            <t-option :value="2" label="业务通知" />
          </t-select>
        </t-form-item>

        <t-form-item label="阅读状态" name="isRead">
          <t-select
            v-model="searchForm.isRead"
            :clearable="true"
            placeholder="请选择阅读状态"
            style="width: 200px"
          >
            <t-option :value="0" label="未读" />
            <t-option :value="1" label="已读" />
          </t-select>
        </t-form-item>

        <t-form-item label="时间范围" name="timeRange">
          <t-date-range-picker
            v-model="timeRange"
            :clearable="true"
            style="width: 340px"
          />
        </t-form-item>

        <t-form-item>
          <t-space>
            <t-button theme="primary" @click="handleSearch">
              <template #icon><search-icon /></template>
              查询
            </t-button>
            <t-button theme="default" @click="handleReset">
              <template #icon><refresh-icon /></template>
              重置
            </t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-card>

    <!-- 统计卡片 -->
    <t-row :gutter="16" class="stats-row">
      <t-col :span="4">
        <t-card class="stat-card">
          <div class="stat-item">
            <div class="stat-value">{{ messageStats.total || 0 }}</div>
            <div class="stat-label">消息总数</div>
          </div>
        </t-card>
      </t-col>
      <t-col :span="4">
        <t-card class="stat-card unread">
          <div class="stat-item">
            <div class="stat-value">{{ messageStats.unread || 0 }}</div>
            <div class="stat-label">未读消息</div>
          </div>
        </t-card>
      </t-col>
      <t-col :span="4">
        <t-card class="stat-card read">
          <div class="stat-item">
            <div class="stat-value">{{ messageStats.read || 0 }}</div>
            <div class="stat-label">已读消息</div>
          </div>
        </t-card>
      </t-col>
      <t-col :span="12">
        <t-card class="voice-notify-card">
          <div class="voice-notify">
            <span class="label">语音通知：</span>
            <t-switch
              v-model="voiceNotifyEnabled"
              :loading="voiceNotifyLoading"
              @change="handleVoiceNotifyChange"
            />
            <span class="tip">{{ voiceNotifyEnabled ? '已开启' : '已关闭' }}</span>
          </div>
        </t-card>
      </t-col>
    </t-row>

    <!-- 消息列表 -->
    <t-card class="table-card">
      <template #title>
        <t-space>
          <span>消息列表</span>
          <t-button
            v-if="selectedRowKeys.length > 0"
            theme="primary"
            size="small"
            @click="handleBatchMarkRead"
          >
            标记已读 ({{ selectedRowKeys.length }})
          </t-button>
          <t-button
            v-if="selectedRowKeys.length > 0"
            theme="danger"
            size="small"
            @click="handleBatchDelete"
          >
            批量删除 ({{ selectedRowKeys.length }})
          </t-button>
        </t-space>
      </template>

      <t-table
        :data="messageList"
        :columns="columns"
        :row-key="row => row.id"
        :selected-row-keys="selectedRowKeys"
        :loading="loading"
        :pagination="pagination"
        @select-change="handleSelectChange"
        @page-change="handlePageChange"
        hover
      >
        <!-- 消息类型 -->
        <template #type="{ row }">
          <t-tag :theme="getTypeTheme(row.type)">
            {{ getTypeName(row.type) }}
          </t-tag>
        </template>

        <!-- 阅读状态 -->
        <template #isRead="{ row }">
          <t-tag :theme="row.isRead === 0 ? 'warning' : 'success'">
            {{ row.isRead === 0 ? '未读' : '已读' }}
          </t-tag>
        </template>

        <!-- 消息标题（可点击查看详情） -->
        <template #title="{ row }">
          <div
            class="message-title"
            :class="{ unread: row.isRead === 0 }"
            @click="handleViewDetail(row)"
          >
            {{ row.title }}
          </div>
        </template>

        <!-- 创建时间 -->
        <template #createTime="{ row }">
          {{ formatTime(row.createTime) }}
        </template>

        <!-- 操作列 -->
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" hover="color" @click="handleViewDetail(row)">
              查看
            </t-link>
            <t-link
              v-if="row.isRead === 0"
              theme="primary"
              hover="color"
              @click="handleMarkRead(row.id)"
            >
              标记已读
            </t-link>
            <t-popconfirm content="确认删除此消息吗？" @confirm="handleDelete(row.id)">
              <t-link theme="danger" hover="color">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 消息详情弹窗 -->
    <message-detail-dialog
      v-model:visible="detailVisible"
      :message="currentMessage"
      @mark-read="handleMarkRead"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import {
  getMessageCount,
  getMessagePage,
  markMessageAsRead,
  markBatchAsRead,
  deleteMessage,
  deleteBatchMessage,
  getVoiceNotifyStatus,
  updateVoiceNotifyStatus,
  type Message,
  type MessagePageParams,
} from '@/api/message';
import MessageDetailDialog from './components/MessageDetailDialog.vue';
import type { PageInfo, PrimaryTableCol } from 'tdesign-vue-next';
import { SearchIcon, RefreshIcon } from 'tdesign-icons-vue-next';
import messageWebSocket from '@/utils/message-websocket';

// 搜索表单
const searchForm = reactive<MessagePageParams>({
  type: undefined,
  isRead: undefined,
  startTime: undefined,
  endTime: undefined,
  pageNum: 1,
  pageSize: 10,
});

// 时间范围
const timeRange = ref<string[]>([]);

// 消息列表
const messageList = ref<Message[]>([]);

// 加载状态
const loading = ref(false);

// 消息统计
const messageStats = ref<Record<string, number>>({
  total: 0,
  unread: 0,
  read: 0,
});

// 选中的行
const selectedRowKeys = ref<number[]>([]);

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showJumper: true,
});

// 语音通知状态
const voiceNotifyEnabled = ref(false);
const voiceNotifyLoading = ref(false);

// 消息详情弹窗
const detailVisible = ref(false);
const currentMessage = ref<Message | null>(null);

// 轮询定时器
let pollingTimer: NodeJS.Timeout | null = null;
// 上次消息数量（用于检测新消息）
let lastMessageCount = 0;
// 音频对象（用于播放提示音）
let audioElement: HTMLAudioElement | null = null;

// 表格列配置
const columns: PrimaryTableCol[] = [
  {
    colKey: 'row-select',
    type: 'multiple',
    width: 50,
  },
  {
    colKey: 'type',
    title: '消息类型',
    width: 120,
    align: 'center',
  },
  {
    colKey: 'title',
    title: '消息标题',
    ellipsis: true,
  },
  {
    colKey: 'isRead',
    title: '阅读状态',
    width: 100,
    align: 'center',
  },
  {
    colKey: 'createTime',
    title: '创建时间',
    width: 180,
    align: 'center',
  },
  {
    colKey: 'operation',
    title: '操作',
    width: 200,
    align: 'center',
    fixed: 'right',
  },
];

/**
 * 加载消息列表
 */
const loadMessageList = async () => {
  loading.value = true;
  try {
    // 处理时间范围
    if (timeRange.value && timeRange.value.length === 2) {
      searchForm.startTime = timeRange.value[0];
      searchForm.endTime = timeRange.value[1];
    } else {
      searchForm.startTime = undefined;
      searchForm.endTime = undefined;
    }

    const response = await getMessagePage(searchForm);
    messageList.value = response.records || [];
    pagination.total = response.total || 0;
  } catch (error: any) {
    MessagePlugin.error(error.message || '加载消息列表失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 加载消息统计
 */
const loadMessageStats = async () => {
  try {
    const stats = await getMessageCount();
    messageStats.value = stats;
  } catch (error: any) {
    console.error('加载消息统计失败', error);
  }
};

/**
 * 加载语音通知状态
 */
const loadVoiceNotifyStatus = async () => {
  try {
    const status = await getVoiceNotifyStatus();
    voiceNotifyEnabled.value = status === 1;
  } catch (error: any) {
    console.error('加载语音通知状态失败', error);
  }
};

/**
 * 查询
 */
const handleSearch = () => {
  searchForm.pageNum = 1;
  pagination.current = 1;
  loadMessageList();
};

/**
 * 重置
 */
const handleReset = () => {
  Object.assign(searchForm, {
    type: undefined,
    isRead: undefined,
    startTime: undefined,
    endTime: undefined,
    pageNum: 1,
    pageSize: 10,
  });
  timeRange.value = [];
  pagination.current = 1;
  loadMessageList();
};

/**
 * 选择变化
 */
const handleSelectChange = (keys: number[]) => {
  selectedRowKeys.value = keys;
};

/**
 * 分页变化
 */
const handlePageChange = (pageInfo: PageInfo) => {
  searchForm.pageNum = pageInfo.current;
  searchForm.pageSize = pageInfo.pageSize;
  pagination.current = pageInfo.current;
  pagination.pageSize = pageInfo.pageSize;
  loadMessageList();
};

/**
 * 查看详情
 */
const handleViewDetail = (message: Message) => {
  currentMessage.value = message;
  detailVisible.value = true;

  // 如果是未读消息，标记为已读
  if (message.isRead === 0) {
    handleMarkRead(message.id);
  }
};

/**
 * 标记已读
 */
const handleMarkRead = async (id: number) => {
  try {
    await markMessageAsRead(id);
    MessagePlugin.success('标记已读成功');
    loadMessageList();
    loadMessageStats();
  } catch (error: any) {
    MessagePlugin.error(error.message || '标记已读失败');
  }
};

/**
 * 批量标记已读
 */
const handleBatchMarkRead = async () => {
  if (selectedRowKeys.value.length === 0) {
    MessagePlugin.warning('请选择要标记的消息');
    return;
  }

  try {
    await markBatchAsRead(selectedRowKeys.value);
    MessagePlugin.success('批量标记已读成功');
    selectedRowKeys.value = [];
    loadMessageList();
    loadMessageStats();
  } catch (error: any) {
    MessagePlugin.error(error.message || '批量标记已读失败');
  }
};

/**
 * 删除消息
 */
const handleDelete = async (id: number) => {
  try {
    await deleteMessage(id);
    MessagePlugin.success('删除成功');
    loadMessageList();
    loadMessageStats();
  } catch (error: any) {
    MessagePlugin.error(error.message || '删除失败');
  }
};

/**
 * 批量删除
 */
const handleBatchDelete = async () => {
  if (selectedRowKeys.value.length === 0) {
    MessagePlugin.warning('请选择要删除的消息');
    return;
  }

  try {
    await deleteBatchMessage(selectedRowKeys.value);
    MessagePlugin.success('批量删除成功');
    selectedRowKeys.value = [];
    loadMessageList();
    loadMessageStats();
  } catch (error: any) {
    MessagePlugin.error(error.message || '批量删除失败');
  }
};

/**
 * 语音通知开关变化
 */
const handleVoiceNotifyChange = async (value: boolean) => {
  voiceNotifyLoading.value = true;
  try {
    await updateVoiceNotifyStatus(value ? 1 : 0);
    MessagePlugin.success(value ? '语音通知已开启' : '语音通知已关闭');

    // 如果开启语音通知，立即播放一次提示音让用户知道
    if (value) {
      setTimeout(() => {
        playBeepSound();
      }, 300);
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '更新语音通知状态失败');
    voiceNotifyEnabled.value = !value; // 恢复原状态
  } finally {
    voiceNotifyLoading.value = false;
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

/**
 * 初始化音频元素
 */
const initAudio = () => {
  if (!audioElement) {
    // 优先使用本地提示音文件
    audioElement = new Audio('/sounds/notification.mp3');
    audioElement.volume = 0.6;
    audioElement.preload = 'auto';

    // 备用方案：如果本地文件不存在，使用Web Audio API
    audioElement.onerror = () => {
      console.warn('本地音频文件不存在，将使用Web Audio API生成提示音');
      audioElement = null;
    };
  }
};

/**
 * 使用Web Audio API生成提示音（备用方案）
 */
const playBeepSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // 创建振荡器（发声源）
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 设置音调频率（Hz） - 更高的频率更刺耳，更容易注意到
    oscillator.frequency.value = 880; // A5音符
    oscillator.type = 'sine'; // 正弦波，声音更柔和

    // 设置音量包络（渐入渐出）
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    // 播放0.5秒
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    console.log('🔊 Web Audio API 提示音已播放');
  } catch (error) {
    console.error('播放Web Audio提示音失败:', error);
  }
};

/**
 * 播放提示音
 */
const playNotificationSound = () => {
  if (!voiceNotifyEnabled.value) {
    console.log('🔇 语音通知已关闭');
    return;
  }

  try {
    // 直接使用Web Audio API生成提示音（更可靠）
    playBeepSound();
  } catch (error) {
    console.error('播放提示音异常:', error);
  }
};

/**
 * 显示新消息通知
 */
const showNewMessageNotification = (newCount: number) => {
  if (newCount <= 0) {
    return;
  }

  // 播放提示音
  playNotificationSound();

  // 显示弹窗通知
  MessagePlugin.success({
    content: `您有 ${newCount} 条新消息`,
    duration: 5000,
    closeBtn: true,
  });
};

/**
 * 处理WebSocket消息推送
 */
const handleWebSocketMessage = (data: any) => {
  console.log('收到WebSocket消息推送:', data);

  // 播放提示音
  playNotificationSound();

  // 显示弹窗通知
  MessagePlugin.warning({
    content: data.title || '您有一条新消息',
    duration: 5000,
    closeBtn: true,
  });

  // 刷新消息列表和统计
  loadMessageList();
  loadMessageStats();
};

/**
 * 启动定时轮询（作为WebSocket的备用方案）
 */
const startPolling = () => {
  // 每30秒轮询一次（降低频率，因为有了WebSocket）
  pollingTimer = setInterval(() => {
    loadMessageStatsWithCheck();
  }, 30000);
};

/**
 * 停止定时轮询
 */
const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

/**
 * 重写loadMessageStats，添加新消息检测
 */
const loadMessageStatsWithCheck = async () => {
  const previousUnread = messageStats.value.unread || 0;

  await loadMessageStats();

  const currentUnread = messageStats.value.unread || 0;

  // 检测到新消息（未读数增加了）
  if (currentUnread > previousUnread && previousUnread >= 0) {
    const newCount = currentUnread - previousUnread;
    showNewMessageNotification(newCount);

    // 如果当前在消息列表页面，自动刷新列表
    loadMessageList();
  }
};

// 初始化
onMounted(() => {
  loadMessageList();
  loadMessageStats();
  loadVoiceNotifyStatus();

  // 初始化音频
  initAudio();

  // 连接WebSocket并订阅消息通知
  messageWebSocket.connect();
  messageWebSocket.subscribeMessages(handleWebSocketMessage);

  // 启动轮询作为备用方案（30秒一次）
  startPolling();
});

// 组件卸载时清理
onUnmounted(() => {
  stopPolling();

  // 取消WebSocket订阅
  messageWebSocket.unsubscribe('/topic/messages');

  if (audioElement) {
    audioElement.pause();
    audioElement = null;
  }
});
</script>

<style scoped lang="less">
.message-management {
  padding: 16px;

  .search-card {
    margin-bottom: 16px;
  }

  .stats-row {
    margin-bottom: 16px;

    .stat-card {
      text-align: center;

      .stat-item {
        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
          margin-top: 8px;
        }
      }

      &.unread {
        .stat-value {
          color: #ff9800;
        }
      }

      &.read {
        .stat-value {
          color: #4caf50;
        }
      }
    }

    .voice-notify-card {
      .voice-notify {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        height: 100%;

        .label {
          font-size: 14px;
          color: #666;
          margin-right: 12px;
        }

        .tip {
          font-size: 12px;
          color: #999;
          margin-left: 12px;
        }
      }
    }
  }

  .table-card {
    .message-title {
      cursor: pointer;
      color: #0052d9;

      &:hover {
        text-decoration: underline;
      }

      &.unread {
        font-weight: bold;
        color: #333;
      }
    }
  }
}
</style>
