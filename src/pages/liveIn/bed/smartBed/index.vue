<!-- 床位列表页 -->
<template>
  <div class="min-h bg-wt pd-main br-2 smartBed">
    <!-- 楼层tab导航 -->
    <SwitchBar
      ref="tabBar"
      :data="tabData"
      :route-type="routeType"
      @change-id="getFloorId"
    ></SwitchBar>
    <!-- end -->

    <!-- 自动刷新控制栏 -->
    <div class="refresh-control">
      <div class="refresh-info">
        <span class="refresh-label">自动刷新：</span>
        <t-switch
          v-model="autoRefreshEnabled"
          size="small"
          @change="handleAutoRefreshToggle"
        />
        <span v-if="autoRefreshEnabled" class="refresh-countdown">
          {{ countdown }}秒后刷新
        </span>
        <span v-if="lastRefreshTime" class="last-refresh-time">
          上次刷新：{{ formatTime(lastRefreshTime) }}
        </span>
      </div>
      <div class="refresh-actions">
        <t-select
          v-model="refreshInterval"
          size="small"
          style="width: 120px"
          :disabled="!autoRefreshEnabled"
          @change="handleIntervalChange"
        >
          <t-option :value="5" label="5秒" />
          <t-option :value="10" label="10秒" />
          <t-option :value="30" label="30秒" />
          <t-option :value="60" label="60秒" />
        </t-select>
        <t-button
          theme="primary"
          size="small"
          :loading="dataLoading"
          @click="handleManualRefresh"
        >
          <template #icon>
            <t-icon name="refresh" />
          </template>
          立即刷新
        </t-button>
      </div>
    </div>
    <!-- end -->

    <!-- 房型列表 -->
    <HouseList
      :key="floorId"
      :floorId="floorId"
      :base-data="roomVoList"
      :floor-data="tabData"
      :route-type="routeType"
      @refresh="getList"
    ></HouseList>
    <!-- end -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store'
import dayjs from 'dayjs'

// 接口
import { getAllByFloorSmartBed, getFloorBySmartBed, getRealtimeMockData } from '@/api/liveIn'
// 组件
// tab切换
import SwitchBar from './components/SwitchBartop.vue'

// 房型列表
import HouseList from './components/List.vue'

// 床位添加编辑弹层
// ------定义变量------
const route = useRoute() // 获取局部
const userStore = useUserStore()
// 楼层变量
const tabBar = ref(null) // 楼层的ref
const tabData = ref([]) // 定义tab切换数据
const roomVoList = ref([])
const floorId = ref('') // 楼层id
const floorIndex = ref(null)
// 房间变量
const dataLoading = ref(false) // 加载loading
const routeType = ref(null)
// 获取全部数据
const allData = ref([])

// ========== 自动刷新相关变量 ==========
const autoRefreshEnabled = ref(true) // 自动刷新开关，默认开启
const refreshInterval = ref(10) // 刷新间隔（秒），默认10秒
const countdown = ref(10) // 倒计时
const lastRefreshTime = ref<Date | null>(null) // 上次刷新时间
const timerId = ref<NodeJS.Timeout | null>(null) // 定时器ID
const countdownTimerId = ref<NodeJS.Timeout | null>(null) // 倒计时定时器ID

// ========== 生命周期 ==========
onUnmounted(() => {
  clearRefreshTimer()
  clearCountdownTimer()
})

// 默认加载数据
onMounted(() => {
  if (route.query.type !== undefined) {
    routeType.value = route.query.type
  }
  getAllFloorList()

  // 启动自动刷新
  if (autoRefreshEnabled.value) {
    startAutoRefresh()
  }
})

// ========== 监听器 ==========
// 监听楼层切换，重置定时器
watch(floorId, (newFloorId, oldFloorId) => {
  if (newFloorId !== oldFloorId && autoRefreshEnabled.value) {
    // 楼层切换时，重置定时器
    restartAutoRefresh()
  }
})

// ========== 自动刷新核心方法 ==========

/**
 * 启动自动刷新
 */
const startAutoRefresh = () => {
  console.log('========== 启动自动刷新 ==========')
  console.log('当前刷新间隔：', refreshInterval.value, '秒')
  console.log('当前楼层ID：', floorId.value)

  // 先清除旧的定时器
  clearRefreshTimer()
  clearCountdownTimer()

  // 重置倒计时
  countdown.value = refreshInterval.value
  console.log('倒计时已重置为：', countdown.value, '秒')

  // 启动倒计时定时器（每秒更新倒计时）
  countdownTimerId.value = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      countdown.value = refreshInterval.value
    }
  }, 1000)

  // 启动刷新定时器
  const intervalMs = refreshInterval.value * 1000
  console.log('设置刷新定时器，间隔：', intervalMs, '毫秒')

  timerId.value = setInterval(async () => {
    // 只有当前页面可见且楼层一致时才刷新
    if (document.visibilityState === 'visible') {
      console.log('自动刷新触发，floorId:', floorId.value, '当前楼层：', userStore.floorId)
      await performRefresh()
    } else {
      console.log('自动刷新跳过 - 页面不可见')
    }
  }, intervalMs)

  console.log('自动刷新已启动，间隔：', refreshInterval.value, '秒')
  console.log('定时器ID：', timerId.value)
  console.log('========== 自动刷新启动完成 ==========')
}

/**
 * 停止自动刷新
 */
const stopAutoRefresh = () => {
  console.log('========== 停止自动刷新 ==========')
  clearRefreshTimer()
  clearCountdownTimer()
  console.log('自动刷新已停止')
  console.log('========== 自动刷新停止完成 ==========')
}

/**
 * 重启自动刷新
 */
const restartAutoRefresh = () => {
  if (autoRefreshEnabled.value) {
    startAutoRefresh()
  }
}

/**
 * 清除刷新定时器
 */
const clearRefreshTimer = () => {
  if (timerId.value) {
    console.log('清除刷新定时器，ID：', timerId.value)
    clearInterval(timerId.value)
    timerId.value = null
  } else {
    console.log('没有需要清除的刷新定时器')
  }
}

/**
 * 清除倒计时定时器
 */
const clearCountdownTimer = () => {
  if (countdownTimerId.value) {
    console.log('清除倒计时定时器，ID：', countdownTimerId.value)
    clearInterval(countdownTimerId.value)
    countdownTimerId.value = null
  } else {
    console.log('没有需要清除的倒计时定时器')
  }
}

/**
 * 执行刷新操作
 */
const performRefresh = async () => {
  if (dataLoading.value) {
    console.log('正在加载中，跳过本次刷新')
    return
  }

  await getList()
}

/**
 * 处理自动刷新开关切换
 */
const handleAutoRefreshToggle = (enabled: boolean) => {
  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

/**
 * 处理刷新间隔变化
 */
const handleIntervalChange = (newInterval: number) => {
  console.log('刷新间隔已变更为：', newInterval, '秒')
  console.log('自动刷新状态：', autoRefreshEnabled.value ? '开启' : '关闭')

  // 先更新 refreshInterval 的值
  refreshInterval.value = newInterval
  countdown.value = newInterval

  // 如果自动刷新是开启的，重启定时器
  if (autoRefreshEnabled.value) {
    console.log('重启自动刷新定时器')
    stopAutoRefresh()
    // 使用 setTimeout 确保状态更新后再启动
    setTimeout(() => {
      startAutoRefresh()
    }, 50)
  } else {
    console.log('自动刷新已关闭，不重启定时器')
  }
}

/**
 * 手动刷新
 */
const handleManualRefresh = async () => {
  console.log('手动刷新触发')
  await performRefresh()

  // 如果自动刷新开启，重置定时器
  if (autoRefreshEnabled.value) {
    startAutoRefresh()
  }
}

/**
 * 格式化时间
 */
const formatTime = (date: Date) => {
  return dayjs(date).format('HH:mm:ss')
}
// ------定义方法------
// 获取楼层数据
const getAllFloorList = async () => {
  const res: any = await getFloorBySmartBed()
  allData.value = res.data
  if (res.code === 200) {
    tabData.value = res.data
    // 首次进来需要拿楼层第一条数据的id来获取当前数据
    if (floorId.value === '' && tabData.value.length) {
      floorId.value = tabData.value[0].id
      userStore.floorId = tabData.value[0].id
    }
    getList()
  }
}
// 根据不同的楼层id楼层信息
const getList = async () => {
  dataLoading.value = true
  try {
    const res: any = await getAllByFloorSmartBed(floorId.value)
    if (res.code === 200) {
      roomVoList.value = res.data

      // 获取模拟数据并填充到设备中
      await fetchAndFillMockData(floorId.value)

      // 更新刷新时间
      lastRefreshTime.value = new Date()
    }
  } finally {
    dataLoading.value = false
  }
}

// 获取模拟数据并填充到设备
const fetchAndFillMockData = async (floorId: string) => {
  try {
    console.log('开始获取模拟数据，floorId:', floorId)
    const mockRes: any = await getRealtimeMockData({ floorId })
    console.log('模拟数据接口返回:', mockRes)
    if (mockRes.code === 200 && mockRes.data && mockRes.data.length > 0) {
      // 将模拟数据按 iotId 分组
      const mockDataMap = new Map()
      mockRes.data.forEach((mockItem: any) => {
        console.log('模拟数据项:', mockItem.iotId, mockItem)
        mockDataMap.set(mockItem.iotId, mockItem)
      })

      // 遍历房间列表，填充设备数据
      roomVoList.value.forEach((room: any) => {
        // 填充房间级设备数据
        if (room.deviceVos && room.deviceVos.length > 0) {
          room.deviceVos.forEach((device: any) => {
            const mockData = mockDataMap.get(device.iotId)
            if (mockData) {
              device.deviceDataVos = convertMockDataToDeviceDataVos(mockData)
            }
          })
        }

        // 填充床位级设备数据
        if (room.bedVoList && room.bedVoList.length > 0) {
          room.bedVoList.forEach((bed: any) => {
            if (bed.deviceVos && bed.deviceVos.length > 0) {
              bed.deviceVos.forEach((device: any) => {
                const mockData = mockDataMap.get(device.iotId)
                if (mockData) {
                  device.deviceDataVos = convertMockDataToDeviceDataVos(mockData)
                }
              })
            }
          })
        }
      })

      console.log('模拟数据已填充到设备')
    }
  } catch (error) {
    console.error('获取模拟数据失败:', error)
  }
}

// 将模拟数据转换为 deviceDataVos 格式
const convertMockDataToDeviceDataVos = (mockData: any) => {
  const deviceDataVos = []

  // ========== 健康数据（用于床位设备） ==========
  // 心率
  if (mockData.heartRate !== undefined && mockData.heartRate !== null) {
    deviceDataVos.push({
      functionId: 'HeartRate',
      dataValue: mockData.heartRate.toString(),
      functionName: '心率'
    })
  }

  // 呼吸率
  if (mockData.respiratoryRate !== undefined && mockData.respiratoryRate !== null) {
    deviceDataVos.push({
      functionId: 'RespiratoryRate',
      dataValue: mockData.respiratoryRate.toString(),
      functionName: '呼吸率'
    })
  }

  // 体温
  if (mockData.bodyTemperature !== undefined && mockData.bodyTemperature !== null) {
    deviceDataVos.push({
      functionId: 'BodyTemperature',
      dataValue: mockData.bodyTemperature.toString(),
      functionName: '体温'
    })
  }

  // 睡眠状态 (根据在床状态转换: 0-离床, 1-在床)
  if (mockData.bedStatus !== undefined && mockData.bedStatus !== null) {
    deviceDataVos.push({
      functionId: 'shuimianzhuangtai',
      dataValue: mockData.bedStatus.toString(),
      functionName: '睡眠状态'
    })
  }

  // 离床次数
  if (mockData.movementCount !== undefined && mockData.movementCount !== null) {
    deviceDataVos.push({
      functionId: 'lichuangcishu',
      dataValue: mockData.movementCount.toString(),
      functionName: '离床次数'
    })
  }

  // 睡眠质量
  if (mockData.sleepQuality !== undefined && mockData.sleepQuality !== null) {
    deviceDataVos.push({
      functionId: 'SleepQuality',
      dataValue: mockData.sleepQuality.toString(),
      functionName: '睡眠质量'
    })
  }

  // ========== 环境数据（用于房间设备） ==========
  // 室内温度
  if (mockData.indoorTemperature !== undefined && mockData.indoorTemperature !== null) {
    deviceDataVos.push({
      functionId: 'IndoorTemperature',
      dataValue: mockData.indoorTemperature.toString(),
      functionName: '温度'
    })
  }

  // 当前湿度
  if (mockData.currentHumidity !== undefined && mockData.currentHumidity !== null) {
    deviceDataVos.push({
      functionId: 'CurrentHumidity',
      dataValue: mockData.currentHumidity.toString(),
      functionName: '湿度'
    })
  }

  // 烟雾传感器状态
  if (mockData.smokeSensorState !== undefined && mockData.smokeSensorState !== null) {
    deviceDataVos.push({
      functionId: 'SmokeSensorState',
      dataValue: mockData.smokeSensorState.toString(),
      functionName: '报警状态'
    })
  }

  // 门磁状态
  if (mockData.doorMagnetState !== undefined && mockData.doorMagnetState !== null) {
    deviceDataVos.push({
      functionId: 'DoorMagnetState',
      dataValue: mockData.doorMagnetState.toString(),
      functionName: '门磁状态'
    })
  }

  // 自动门工作状态
  if (mockData.autoDoorState !== undefined && mockData.autoDoorState !== null) {
    deviceDataVos.push({
      functionId: 'zidongmengongzuozhuangtai',
      dataValue: mockData.autoDoorState.toString(),
      functionName: '房间状态'
    })
  }

  // 滞留状态
  if (mockData.stayState !== undefined && mockData.stayState !== null) {
    deviceDataVos.push({
      functionId: 'StayState',
      dataValue: mockData.stayState.toString(),
      functionName: '滞留状态'
    })
  }

  return deviceDataVos
}
// 获取楼层id
const getFloorId = (id, i) => {
  // 点击异常楼层后消除对应的红点异常

  userStore.floorId = floorId.value
  floorIndex.value = i
  floorId.value = id
  getList()
}
</script>
<style lang="less" src="../../index.less"></style>
<style lang="less" scoped>
.smartBed {
  min-height: calc(100vh - 130px);
}

// 自动刷新控制栏样式
.refresh-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .refresh-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .refresh-label {
      font-size: 14px;
      color: #595959;
      font-weight: 500;
    }

    .refresh-countdown {
      font-size: 13px;
      color: #008d71;
      font-weight: 500;
      background: linear-gradient(135deg, #e5f4f2 0%, #d0efea 100%);
      padding: 4px 10px;
      border-radius: 12px;
      animation: pulse 2s ease-in-out infinite;
    }

    .last-refresh-time {
      font-size: 12px;
      color: #999;
    }
  }

  .refresh-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

// 倒计时动画
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}
</style>
