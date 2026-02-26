<!-- 顶部数据概览组件 - 修改版 -->
<template>
  <t-row :gutter="24">
    <t-col :xs="12" :xl="9">
      <t-card title="">
        <template #title>
          <div class="tit">
            <span>数据概览</span>
            <span class="time">数据更新：{{ newDate }}</span>
          </div>
        </template>
        <div class="dataCon">
          <div
            id="oldContainer"
            ref="oldContainer"
            class="dashboard-chart-container"
          />
          <div
            id="bedContainer"
            ref="bedContainer"
            class="dashboard-chart-container"
          />
          <div
            id="serveContainer"
            ref="serveContainer"
            class="dashboard-chart-container"
          />
          <div
            id="staffContainer"
            ref="staffContainer"
            class="dashboard-chart-container"
          />
          <div
            id="moneyContainer"
            ref="moneyContainer"
            class="dashboard-chart-container"
          />
        </div>
      </t-card>
    </t-col>
    <t-col :xs="12" :xl="3">
      <t-card title="">
        <div class="roleCon">
          <div class="head">
            <div class="img">
              <img :src="baseData.avatar ? baseData.avatar : avatar" />
            </div>
            <div class="rText">
              <p>Hello！{{ baseData.realName }}</p>
              <p>今天也是元气满满的一天！</p>
            </div>
          </div>
          <div class="userInfo">
            <p class="userTit">
              <i class="icon1"></i>
              <span class="textOverflow"
                ><t-tooltip :content="baseData.email" show-arrow>
                  <span>{{ baseData.email }}</span>
                </t-tooltip></span
              >
            </p>
            <p>
              <i class="icon2"></i>
              <span v-if="roleListData.length > 12" class="textOverflow"
                ><t-tooltip :content="roleListData" show-arrow>
                  <span>{{ roleListData }}</span>
                </t-tooltip></span
              >
              <span v-else>{{ roleListData }}</span>
            </p>
            <p><i class="icon3"></i>{{ baseData.postName }}</p>
            <p><i class="icon4"></i>{{ baseData.deptName }}</p>
          </div>
          <div class="hFoot">
            <div class="fTit">下属员工</div>
            <ul class="imgItem">
              <li>
                <span><img src="../../../../assets/img1.png" /></span>
              </li>
              <li>
                <span><img src="../../../../assets/img2.png" /></span>
              </li>
              <li>
                <span><img src="../../../../assets/img3.png" /></span>
              </li>
              <li>
                <span><img src="../../../../assets/img4.png" /></span>
              </li>
              <li>
                <span><img src="../../../../assets/img5.png" /></span>
              </li>
              <li>
                <span><img src="../../../../assets/img6.png" /></span>
              </li>
              <li><span>+3</span></li>
            </ul>
          </div>
        </div>
      </t-card>
    </t-col>
  </t-row>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import * as echarts from 'echarts/core'
import {
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { PieChart, LineChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { useSettingStore } from '@/store'
import { getDateInfo } from '@/utils/date'
import { getDashboardOverview } from '@/api/dashboard'
import {
  getOldPieChartDataSet,
  getBedPieChartDataSet,
  getservePieChartDataSet,
  getStaffPieChartDataSet,
  getMoneyPieChartDataSet
} from '../index'

const avatar = ref(
  'https://yjy-oss-videos.oss-accelerate.aliyuncs.com/grzxhz.jpg'
)
echarts.use([
  TooltipComponent,
  LegendComponent,
  PieChart,
  GridComponent,
  LineChart,
  CanvasRenderer
])

const store = useSettingStore()
const newDate = getDateInfo(new Date())
const chartColors = computed(() => store.chartColors)

// 获取父组件值、方法
const props = defineProps({
  baseData: {
    type: Object,
    default: () => ({})
  },
  roleListData: {
    type: String,
    default: ''
  }
})

// 定义响应式数据
const overviewData = ref({
  elderTotal: 0,
  elderOut: 0,
  elderIn: 0,
  bedTotal: 0,
  bedEmpty: 0,
  bedOccupied: 0,
  serviceTotal: 0,
  servicePlan: 0,
  serviceOutPlan: 0,
  staffTotal: 0,
  staffManager: 0,
  staffNormal: 0,
  incomeTotal: 0,
  incomeService: 0,
  incomeMonthly: 0
})

// monitorChart
let oldContainer: HTMLElement // 老人
let bedContainer: HTMLElement // 床位
let serveContainer: HTMLElement // 服务
let staffContainer: HTMLElement // 员工
let moneyContainer: HTMLElement // 收入
let countChart: echarts.ECharts

// 老人数量
const renderCountChart = () => {
  if (!oldContainer) {
    oldContainer = document.getElementById('oldContainer')
  }
  countChart = echarts.init(oldContainer)
  const data = {
    total: overviewData.value.elderTotal.toString(),
    data: [
      { value: overviewData.value.elderOut, name: '外出中' },
      { value: overviewData.value.elderIn, name: '在院中' }
    ]
  }
  countChart.setOption(
    getOldPieChartDataSet((chartColors as any).value, data)
  )
}

// 床位数量
const bedCountChart = () => {
  if (!bedContainer) {
    bedContainer = document.getElementById('bedContainer')
  }
  countChart = echarts.init(bedContainer)
  const data = {
    total: overviewData.value.bedTotal.toString(),
    data: [
      { value: overviewData.value.bedEmpty, name: '空闲中' },
      { value: overviewData.value.bedOccupied, name: '入住中' }
    ]
  }
  countChart.setOption(
    getBedPieChartDataSet((chartColors as any).value, data)
  )
}

// 服务数量
const serveCountChart = () => {
  if (!serveContainer) {
    serveContainer = document.getElementById('serveContainer')
  }
  countChart = echarts.init(serveContainer)
  const data = {
    total: overviewData.value.serviceTotal,
    data: [
      { value: overviewData.value.serviceOutPlan, name: '护理计划外' },
      { value: overviewData.value.servicePlan, name: '护理计划内' }
    ]
  }
  countChart.setOption(
    getservePieChartDataSet((chartColors as any).value, data)
  )
}

// 员工数量
const staffCountChart = () => {
  if (!staffContainer) {
    staffContainer = document.getElementById('staffContainer')
  }
  countChart = echarts.init(staffContainer)
  const data = {
    total: overviewData.value.staffTotal.toString(),
    data: [
      { value: overviewData.value.staffManager, name: '管理层' },
      { value: overviewData.value.staffNormal, name: '普通员工' }
    ]
  }
  countChart.setOption(
    getStaffPieChartDataSet((chartColors as any).value, data)
  )
}

// 收入金额
const moneyCountChart = () => {
  if (!moneyContainer) {
    moneyContainer = document.getElementById('moneyContainer')
  }
  countChart = echarts.init(moneyContainer)
  const data = {
    total: overviewData.value.incomeTotal,
    data: [
      { value: overviewData.value.incomeService, name: '服务费用' },
      { value: overviewData.value.incomeMonthly, name: '月度费用' }
    ]
  }
  countChart.setOption(
    getMoneyPieChartDataSet((chartColors as any).value, data)
  )
}

const renderCharts = () => {
  renderCountChart()
  bedCountChart()
  serveCountChart()
  staffCountChart()
  moneyCountChart()
}

// 获取数据概览
const fetchOverviewData = async () => {
  try {
    const res = await getDashboardOverview()
    if (res.code === 200) {
      overviewData.value = res.data
      renderCharts()
    }
  } catch (error) {
    console.error('获取数据概览失败：', error)
  }
}

onMounted(() => {
  fetchOverviewData()
})
</script>

<style lang="less" scoped>
.dashboard-chart-card {
  padding: 8px;

  :deep(.t-card__header) {
    padding-bottom: 24px;
  }

  :deep(.t-card__title) {
    font-size: 20px;
    font-weight: 500;
  }
}
</style>
