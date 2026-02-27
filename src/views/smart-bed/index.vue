<template>
  <div class="smart-bed-overview">
    <!-- 统计卡片区域 -->
    <t-row :gutter="[16, 16]" class="statistics-row">
      <t-col :span="3">
        <t-card class="statistics-card" theme="primary1">
          <div class="statistics-content">
            <div class="statistics-icon">
              <t-icon name="bed" size="24px" />
            </div>
            <div class="statistics-info">
              <div class="statistics-value">{{ statistics.totalBeds }}</div>
              <div class="statistics-label">床位总数</div>
            </div>
          </div>
        </t-card>
      </t-col>

      <t-col :span="3">
        <t-card class="statistics-card" theme="success1">
          <div class="statistics-content">
            <div class="statistics-icon">
              <t-icon name="user-avatar" size="24px" />
            </div>
            <div class="statistics-info">
              <div class="statistics-value">{{ statistics.inHospitalCount }}</div>
              <div class="statistics-label">在院人数</div>
            </div>
          </div>
        </t-card>
      </t-col>

      <t-col :span="3">
        <t-card class="statistics-card" theme="warning1">
          <div class="statistics-content">
            <div class="statistics-icon">
              <t-icon name="logout" size="24px" />
            </div>
            <div class="statistics-info">
              <div class="statistics-value">{{ statistics.emptyBeds }}</div>
              <div class="statistics-label">空床数</div>
            </div>
          </div>
        </t-card>
      </t-col>

      <t-col :span="3">
        <t-card class="statistics-card" theme="success1">
          <div class="statistics-content">
            <div class="statistics-icon">
              <t-icon name="wifi" size="24px" />
            </div>
            <div class="statistics-info">
              <div class="statistics-value">{{ statistics.onlineDevices }}</div>
              <div class="statistics-label">在线设备</div>
              <div class="statistics-rate">{{ statistics.onlineRate?.toFixed(1) }}%</div>
            </div>
          </div>
        </t-card>
      </t-col>
    </t-row>

    <!-- 设备状态概览 -->
    <t-card title="床位实时状态" class="bed-status-card">
      <template #actions>
        <t-button theme="primary" @click="refreshData">
          <t-icon name="refresh" />
          刷新
        </t-button>
      </template>

      <t-row :gutter="[16, 16]">
        <t-col :span="6" v-for="bed in bedStatusList" :key="bed.bedNumber">
          <t-card
            :class="['bed-card', getBedCardClass(bed)]"
            @click="viewBedDetail(bed.bedNumber)"
          >
            <div class="bed-header">
              <div class="bed-number">{{ bed.bedNumber }}</div>
              <div class="bed-status" :class="getBedStatusClass(bed.bedStatus)">
                {{ bed.bedStatusText }}
              </div>
            </div>

            <div class="bed-info">
              <div class="elderly-name" v-if="bed.elderlyName">
                <t-icon name="user" size="16px" />
                {{ bed.elderlyName }}
              </div>
              <div class="room-info" v-if="bed.roomNumber">
                <t-icon name="location" size="16px" />
                {{ bed.roomNumber }}
              </div>
            </div>

            <div class="vital-signs" v-if="bed.bedStatus === 1 && bed.deviceOnline === 1">
              <div class="vital-item">
                <span class="vital-label">心率</span>
                <span class="vital-value" :class="getVitalStatusClass(bed.heartRateStatus)">
                  {{ bed.heartRate }}
                </span>
              </div>
              <div class="vital-item">
                <span class="vital-label">呼吸</span>
                <span class="vital-value" :class="getVitalStatusClass(bed.respiratoryStatus)">
                  {{ bed.respiratoryRate }}
                </span>
              </div>
            </div>

            <div class="device-status">
              <div class="device-indicator" :class="getDeviceStatusClass(bed.deviceOnline)">
                {{ bed.deviceOnlineText }}
              </div>
              <div class="last-update">
                {{ formatTime(bed.lastUpdateTime) }}
              </div>
            </div>
          </t-card>
        </t-col>
      </t-row>
    </t-card>

    <!-- 床位详情弹窗 -->
    <t-dialog
      v-model:visible="detailDialogVisible"
      title="床位详情"
      width="800px"
      :footer="false"
    >
      <bed-detail
        v-if="detailDialogVisible"
        :bed-number="selectedBedNumber"
        @close="detailDialogVisible = false"
      />
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import {
  getSmartBedOverview,
  getAllBedStatus,
  getBedStatus
} from '@/api/smart-bed';
import BedDetail from './components/BedDetail.vue';

// 响应式数据
const statistics = reactive({
  totalBeds: 0,
  inHospitalCount: 0,
  emptyBeds: 0,
  onlineDevices: 0,
  offlineDevices: 0,
  onlineRate: 0,
  occupancyRate: 0,
  todayAlarmCount: 0,
  pendingAlarmCount: 0
});

const bedStatusList = ref([]);
const detailDialogVisible = ref(false);
const selectedBedNumber = ref('');

// 定时器
let refreshTimer: NodeJS.Timeout | null = null;

// 页面加载完成后初始化
onMounted(() => {
  loadData();
  // 每30秒自动刷新数据
  refreshTimer = setInterval(() => {
    loadData();
  }, 30000);
});

// 页面卸载时清除定时器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});

// 加载数据
const loadData = async () => {
  try {
    // 并行请求总览数据和状态列表
    const [overviewRes, statusRes] = await Promise.all([
      getSmartBedOverview(),
      getAllBedStatus()
    ]);

    // 更新统计数据
    Object.assign(statistics, overviewRes.data);

    // 更新床位状态列表
    bedStatusList.value = statusRes.data || [];

  } catch (error) {
    console.error('加载数据失败:', error);
    MessagePlugin.error('加载数据失败');
  }
};

// 刷新数据
const refreshData = () => {
  loadData();
  MessagePlugin.success('数据已刷新');
};

// 查看床位详情
const viewBedDetail = async (bedNumber: string) => {
  selectedBedNumber.value = bedNumber;
  detailDialogVisible.value = true;
};

// 获取床位卡片样式类
const getBedCardClass = (bed: any) => {
  const classes = [];
  if (bed.bedStatus === 1) {
    classes.push('occupied');
  } else {
    classes.push('empty');
  }
  if (bed.deviceOnline === 0) {
    classes.push('offline');
  }
  return classes;
};

// 获取床位状态样式类
const getBedStatusClass = (bedStatus: number) => {
  return bedStatus === 1 ? 'in-bed' : 'out-bed';
};

// 获取设备状态样式类
const getDeviceStatusClass = (deviceOnline: number) => {
  return deviceOnline === 1 ? 'online' : 'offline';
};

// 获取生命体征状态样式类
const getVitalStatusClass = (status: string) => {
  return status === '正常' ? 'normal' : 'abnormal';
};

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return '--';
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) { // 1分钟内
    return '刚刚';
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) { // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`;
  } else {
    return date.toLocaleDateString();
  }
};
</script>

<style scoped lang="less">
.smart-bed-overview {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.statistics-row {
  margin-bottom: 24px;
}

.statistics-card {
  .statistics-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .statistics-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .statistics-info {
    flex: 1;

    .statistics-value {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      line-height: 1;
    }

    .statistics-label {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }

    .statistics-rate {
      font-size: 12px;
      color: #6b7280;
      margin-top: 2px;
    }
  }
}

.bed-status-card {
  .bed-card {
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.occupied {
      border-color: #10b981;
    }

    &.empty {
      border-color: #f59e0b;
    }

    &.offline {
      border-color: #ef4444;
      opacity: 0.7;
    }

    .bed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .bed-number {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
      }

      .bed-status {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;

        &.in-bed {
          background: #dcfce7;
          color: #16a34a;
        }

        &.out-bed {
          background: #fef3c7;
          color: #d97706;
        }
      }
    }

    .bed-info {
      margin-bottom: 12px;

      .elderly-name,
      .room-info {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 4px;

        .t-icon {
          color: #9ca3af;
        }
      }
    }

    .vital-signs {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
      padding: 8px 0;
      border-top: 1px solid #f3f4f6;
      border-bottom: 1px solid #f3f4f6;

      .vital-item {
        flex: 1;
        text-align: center;

        .vital-label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .vital-value {
          display: block;
          font-size: 16px;
          font-weight: 600;

          &.normal {
            color: #10b981;
          }

          &.abnormal {
            color: #ef4444;
          }
        }
      }
    }

    .device-status {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .device-indicator {
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;

        &.online {
          background: #dcfce7;
          color: #16a34a;
        }

        &.offline {
          background: #fee2e2;
          color: #dc2626;
        }
      }

      .last-update {
        font-size: 12px;
        color: #9ca3af;
      }
    }
  }
}
</style>