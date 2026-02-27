<template>
  <div class="bed-detail">
    <t-row :gutter="[16, 16]">
      <!-- 左侧：基本信息和实时数据 -->
      <t-col :span="12">
        <t-card title="基本信息" class="info-card">
          <div class="basic-info">
            <div class="info-item">
              <span class="label">床位编号：</span>
              <span class="value">{{ bedInfo.bedNumber }}</span>
            </div>
            <div class="info-item">
              <span class="label">房间号：</span>
              <span class="value">{{ bedInfo.roomNumber || '--' }}</span>
            </div>
            <div class="info-item">
              <span class="label">老人姓名：</span>
              <span class="value">{{ bedInfo.elderlyName || '未绑定' }}</span>
            </div>
            <div class="info-item">
              <span class="label">设备状态：</span>
              <span class="status" :class="getDeviceStatusClass(bedInfo.deviceOnline)">
                {{ bedInfo.deviceOnlineText }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">在床状态：</span>
              <span class="status" :class="getBedStatusClass(bedInfo.bedStatus)">
                {{ bedInfo.bedStatusText }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">最后更新：</span>
              <span class="value">{{ formatDateTime(bedInfo.lastUpdateTime) }}</span>
            </div>
          </div>
        </t-card>

        <t-card title="生命体征" class="vital-signs-card">
          <div class="vital-signs">
            <div class="vital-item">
              <div class="vital-header">
                <t-icon name="heart" size="24px" color="#ef4444" />
                <span class="vital-name">心率</span>
              </div>
              <div class="vital-data">
                <span class="vital-value" :class="getVitalStatusClass(bedInfo.heartRateStatus)">
                  {{ bedInfo.heartRate || '--' }}
                </span>
                <span class="vital-unit">次/分</span>
              </div>
              <div class="vital-status">{{ bedInfo.heartRateStatus }}</div>
            </div>

            <div class="vital-item">
              <div class="vital-header">
                <t-icon name="cloud" size="24px" color="#3b82f6" />
                <span class="vital-name">呼吸</span>
              </div>
              <div class="vital-data">
                <span class="vital-value" :class="getVitalStatusClass(bedInfo.respiratoryStatus)">
                  {{ bedInfo.respiratoryRate || '--' }}
                </span>
                <span class="vital-unit">次/分</span>
              </div>
              <div class="vital-status">{{ bedInfo.respiratoryStatus }}</div>
            </div>

            <div class="vital-item">
              <div class="vital-header">
                <t-icon name="thermometer" size="24px" color="#f59e0b" />
                <span class="vital-name">体温</span>
              </div>
              <div class="vital-data">
                <span class="vital-value" :class="getVitalStatusClass(bedInfo.temperatureStatus)">
                  {{ bedInfo.bodyTemperature || '--' }}
                </span>
                <span class="vital-unit">℃</span>
              </div>
              <div class="vital-status">{{ bedInfo.temperatureStatus }}</div>
            </div>

            <div class="vital-item">
              <div class="vital-header">
                <t-icon name="sleep" size="24px" color="#8b5cf6" />
                <span class="vital-name">睡眠质量</span>
              </div>
              <div class="vital-data">
                <span class="vital-value">{{ bedInfo.sleepQuality || '--' }}</span>
                <span class="vital-unit">分</span>
              </div>
              <div class="vital-status">{{ bedInfo.sleepQualityLevel }}</div>
            </div>
          </div>
        </t-card>
      </t-col>

      <!-- 右侧：图表和操作 -->
      <t-col :span="12">
        <t-card title="实时心率趋势" class="chart-card">
          <div ref="heartRateChart" class="chart-container"></div>
        </t-card>

        <t-card title="快速操作" class="actions-card">
          <t-space direction="vertical" size="large">
            <t-button theme="primary" @click="bindElderly" :disabled="!!bedInfo.elderlyName">
              <t-icon name="user-add" />
              绑定老人
            </t-button>
            <t-button theme="warning" @click="unbindElderly" :disabled="!bedInfo.elderlyName">
              <t-icon name="user-delete" />
              解除绑定
            </t-button>
            <t-button theme="default" @click="viewHistory">
              <t-icon name="chart-line" />
              查看历史数据
            </t-button>
            <t-button theme="default" @click="viewAlarms">
              <t-icon name="notification" />
              查看报警记录
            </t-button>
          </t-space>
        </t-card>
      </t-col>
    </t-row>

    <!-- 绑定老人弹窗 -->
    <t-dialog
      v-model:visible="bindDialogVisible"
      title="绑定老人"
      confirm-btn="确认绑定"
      @confirm="confirmBindElderly"
    >
      <t-form :data="bindForm" label-width="80px">
        <t-form-item label="床位编号">
          <t-input v-model="bindForm.bedNumber" disabled />
        </t-form-item>
        <t-form-item label="老人姓名">
          <t-input v-model="bindForm.elderlyName" placeholder="请输入老人姓名" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 历史数据弹窗 -->
    <t-dialog
      v-model:visible="historyDialogVisible"
      title="历史数据"
      width="1000px"
      :footer="false"
    >
      <bed-history
        v-if="historyDialogVisible"
        :bed-number="bedNumber"
        @close="historyDialogVisible = false"
      />
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import * as echarts from 'echarts';
import {
  getBedStatus,
  bindElderlyToBed,
  unbindElderlyFromBed
} from '@/api/smart-bed';
import BedHistory from './BedHistory.vue';

// Props
const props = defineProps<{
  bedNumber: string;
}>();

// Emits
const emit = defineEmits<{
  close: [];
}>();

// 响应式数据
const bedInfo = reactive({
  bedNumber: '',
  roomNumber: '',
  elderlyName: '',
  deviceOnline: 0,
  deviceOnlineText: '',
  bedStatus: 0,
  bedStatusText: '',
  heartRate: null,
  heartRateStatus: '',
  respiratoryRate: null,
  respiratoryStatus: '',
  bodyTemperature: null,
  temperatureStatus: '',
  sleepQuality: null,
  sleepQualityLevel: '',
  lastUpdateTime: ''
});

const bindDialogVisible = ref(false);
const historyDialogVisible = ref(false);
const heartRateChart = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

// 绑定表单
const bindForm = reactive({
  bedNumber: props.bedNumber,
  elderlyName: ''
});

// 页面加载完成后初始化
onMounted(() => {
  loadBedDetail();
  initChart();
});

// 加载床位详情
const loadBedDetail = async () => {
  try {
    const res = await getBedStatus(props.bedNumber);
    if (res.data) {
      Object.assign(bedInfo, res.data);
      bindForm.bedNumber = res.data.bedNumber;
    }
  } catch (error) {
    console.error('加载床位详情失败:', error);
    MessagePlugin.error('加载床位详情失败');
  }
};

// 初始化图表
const initChart = async () => {
  await nextTick();
  if (heartRateChart.value) {
    chartInstance = echarts.init(heartRateChart.value);
    updateChart();
  }
};

// 更新图表数据
const updateChart = () => {
  if (!chartInstance) return;

  // 生成模拟数据（实际项目中应该从后端获取）
  const times = [];
  const data = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    times.push(time.getHours() + ':00');
    data.push(Math.floor(Math.random() * 20) + 65); // 65-85之间的心率
  }

  const option = {
    title: {
      text: '24小时心率趋势',
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a}: {c} 次/分'
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '心率(次/分)',
      min: 50,
      max: 100
    },
    series: [
      {
        name: '心率',
        type: 'line',
        data: data,
        smooth: true,
        lineStyle: {
          color: '#ef4444'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.1)' }
            ]
          }
        }
      }
    ]
  };

  chartInstance.setOption(option);
};

// 绑定老人
const bindElderly = () => {
  bindForm.elderlyName = '';
  bindDialogVisible.value = true;
};

// 确认绑定老人
const confirmBindElderly = async () => {
  if (!bindForm.elderlyName.trim()) {
    MessagePlugin.warning('请输入老人姓名');
    return;
  }

  try {
    await bindElderlyToBed({
      bedNumber: bindForm.bedNumber,
      elderlyId: Date.now(), // 模拟ID，实际应该从老人列表选择
      elderlyName: bindForm.elderlyName
    });

    MessagePlugin.success('绑定成功');
    bindDialogVisible.value = false;
    loadBedDetail();
  } catch (error) {
    console.error('绑定老人失败:', error);
    MessagePlugin.error('绑定老人失败');
  }
};

// 解除绑定
const unbindElderly = async () => {
  try {
    await unbindElderlyFromBed(props.bedNumber);
    MessagePlugin.success('解除绑定成功');
    loadBedDetail();
  } catch (error) {
    console.error('解除绑定失败:', error);
    MessagePlugin.error('解除绑定失败');
  }
};

// 查看历史数据
const viewHistory = () => {
  historyDialogVisible.value = true;
};

// 查看报警记录
const viewAlarms = () => {
  // 这里可以跳转到报警记录页面或打开弹窗
  MessagePlugin.info('报警记录功能开发中...');
};

// 获取状态样式类
const getDeviceStatusClass = (deviceOnline: number) => {
  return deviceOnline === 1 ? 'online' : 'offline';
};

const getBedStatusClass = (bedStatus: number) => {
  return bedStatus === 1 ? 'in-bed' : 'out-bed';
};

const getVitalStatusClass = (status: string) => {
  return status === '正常' ? 'normal' : 'abnormal';
};

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '--';
  return new Date(dateTime).toLocaleString();
};
</script>

<style scoped lang="less">
.bed-detail {
  .info-card,
  .vital-signs-card,
  .chart-card,
  .actions-card {
    margin-bottom: 16px;
  }

  .basic-info {
    .info-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;

      &:last-child {
        border-bottom: none;
      }

      .label {
        width: 80px;
        color: #6b7280;
        font-size: 14px;
      }

      .value {
        flex: 1;
        color: #1f2937;
        font-size: 14px;
      }

      .status {
        padding: 2px 8px;
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
  }

  .vital-signs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .vital-item {
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      text-align: center;

      .vital-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 12px;

        .vital-name {
          font-size: 14px;
          color: #6b7280;
        }
      }

      .vital-data {
        margin-bottom: 8px;

        .vital-value {
          font-size: 24px;
          font-weight: 600;
          margin-right: 4px;

          &.normal {
            color: #10b981;
          }

          &.abnormal {
            color: #ef4444;
          }
        }

        .vital-unit {
          font-size: 12px;
          color: #6b7280;
        }
      }

      .vital-status {
        font-size: 12px;
        color: #6b7280;
      }
    }
  }

  .chart-container {
    height: 300px;
  }

  .actions-card {
    .t-space {
      width: 100%;

      .t-button {
        width: 100%;
        justify-content: flex-start;
      }
    }
  }
}
</style>