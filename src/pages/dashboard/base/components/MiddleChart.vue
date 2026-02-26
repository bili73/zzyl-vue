<!-- 中部图表组件 - 修改版 -->
<template>
  <t-row :gutter="24" class="row-container">
    <t-col :xs="12" :xl="9">
      <t-card title="" class="dashboard-chart-card">
        <div class="condition">
          <t-tabs v-model="tabActive" @change="changeTab">
            <t-tab-panel
              v-for="(item, index) in tabData"
              :key="index"
              :value="item.id"
              :label="item.name"
            >
            </t-tab-panel>
          </t-tabs>

          <div class="times">
            <ul class="date">
              <li
                v-for="(item, index) in dateData"
                :key="index"
                :class="active === index ? 'active' : ''"
                @click="changeActive(index)"
              >
                {{ item }}
              </li>
            </ul>
            <div class="dateCon">{{ startDate }} 至 {{ endDate }}</div>
          </div>
        </div>
        <div v-if="tabActive === 0">
          <EarningsEchart
            :allDateArr="allDateArr"
            :allTimeArr="allTimeArr"
          ></EarningsEchart>
        </div>
        <div v-if="tabActive === 1">
          <EnterEchart
            :allDateArr="allDateArr"
            :allTimeArr="allTimeArr"
          ></EnterEchart>
        </div>
        <div v-if="tabActive === 2">
          <ServeEchart
            :allDateArr="allDateArr"
            :allTimeArr="allTimeArr"
          ></ServeEchart>
        </div>
      </t-card>
    </t-col>
    <t-col :xs="12" :xl="3">
      <t-card
        title="常用功能"
        :subtitle="currentMonth"
        class="dashboard-chart-card"
      >
        <ul class="useList">
          <router-link to="/appointment/comeVisit?toast=true">
            <span class="appointmentIcon"></span>
            <p>来访管理</p></router-link
          >

          <router-link to="/enterQuit/enterDetails">
            <span class="checkIcon"></span>
            <p>入住申请</p>
          </router-link>

          <router-link to="/enterQuit/quitDetails">
            <span class="backIcon"></span>
            <p>退住申请</p>
          </router-link>

          <router-link to="/liveIn/houseType">
            <span class="bedIcon"></span>
            <p>床位预览</p>
          </router-link>

          <router-link to="/permission/user">
            <span class="addIcon"></span>
            <p>用户管理</p>
          </router-link>

          <router-link to="/order/olist">
            <span class="orderIcon"></span>
            <p>订单管理</p>
          </router-link>

          <router-link to="/order/refund">
            <span class="refundIcon"></span>
            <p>退款管理</p>
          </router-link>

          <router-link to="/intelligence/facility">
            <span class="warnIcon"></span>
            <p>报警数据</p>
          </router-link>
        </ul>
      </t-card>
    </t-col>
  </t-row>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import {
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { PieChart, LineChart, BarChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { getMonthInfo, getDateInfo } from '@/utils/date'
import {
  getIncomeTrend,
  getCheckInOutTrend,
  getServiceTrend
} from '@/api/dashboard'
import EarningsEchart from './EarningsEchart.vue'
import EnterEchart from './EnterEchart.vue'
import ServeEchart from './ServeEchart.vue'

echarts.use([
  TooltipComponent,
  LegendComponent,
  PieChart,
  GridComponent,
  LineChart,
  BarChart,
  CanvasRenderer
])

const dateData = ref(['今日', '本周', '本月'])
const tabData = ref([
  { id: 0, name: '收益情况' },
  { id: 1, name: '入退情况' },
  { id: 2, name: '服务情况' }
])

const active = ref(2)  // 默认显示"本月"（0:今日, 1:本周, 2:本月）
const tabActive = ref(0)
const startDate = ref()
const endDate = ref()
const allDateArr = ref([])
const allTimeArr = ref([])
const currentMonth = ref('')

// 获取收益趋势数据
const fetchIncomeTrend = async (type: string) => {
  try {
    const res = await getIncomeTrend({ type })
    if (res.code === 200) {
      // 后端返回的数据格式：{ dateArray: [], dataArray: [], dataArraySecond: [] }
      // 需要转换为前端格式：{ incomeData: [], refundData: [] }
      allTimeArr.value = res.data.dateArray || []
      allDateArr.value = {
        incomeData: res.data.dataArray || [],
        refundData: res.data.dataArraySecond || []
      }
    }
  } catch (error) {
    console.error('获取收益趋势失败：', error)
    // 失败时使用空数据
    allDateArr.value = {
      incomeData: [],
      refundData: []
    }
    allTimeArr.value = []
  }
}

// 获取入退情况趋势数据
const fetchCheckInOutTrend = async (type: string) => {
  try {
    const res = await getCheckInOutTrend({ type })
    if (res.code === 200) {
      allTimeArr.value = res.data.dateArray || []
      allDateArr.value = {
        incomeData: res.data.dataArray || [],
        refundData: res.data.dataArraySecond || []
      }
    }
  } catch (error) {
    console.error('获取入退情况失败：', error)
    allDateArr.value = {
      incomeData: [],
      refundData: []
    }
    allTimeArr.value = []
  }
}

// 获取服务情况趋势数据
const fetchServiceTrend = async (type: string) => {
  try {
    const res = await getServiceTrend({ type })
    if (res.code === 200) {
      allTimeArr.value = res.data.dateArray || []
      // 服务情况只有一个数据数组
      allDateArr.value = res.data.dataArray || []
    }
  } catch (error) {
    console.error('获取服务情况失败：', error)
    allDateArr.value = []
    allTimeArr.value = []
  }
}

// 触发 tab 切换
const changeTab = (e) => {
  active.value = 0
  nextTick(() => {
    getDataInfo()
  })
}

// 获取数据
const getDataInfo = () => {
  // 确定类型：today/week/month
  const type = active.value === 0 ? 'today' : active.value === 1 ? 'week' : 'month'

  // 更新日期显示
  updateDateDisplay(type)

  // 根据tab调用不同的接口
  if (tabActive.value === 0) {
    fetchIncomeTrend(type)
  } else if (tabActive.value === 1) {
    fetchCheckInOutTrend(type)
  } else {
    fetchServiceTrend(type)
  }
}

// 更新日期显示
const updateDateDisplay = (type: string) => {
  if (type === 'today') {
    getDate()
  } else if (type === 'week') {
    startDate.value = getStartDayOfWeek(new Date())
    endDate.value = getEndDayOfWeek(new Date())
  } else {
    const date = getMonty()
    startDate.value = getDateInfo(date.firstDay)
    endDate.value = getDateInfo(date.lastDay)
  }
}

onMounted(() => {
  // 设置当前月份
  const date = new Date()
  currentMonth.value = `${date.getFullYear()}年${date.getMonth() + 1}月`

  // 初始化日期
  getDate()

  // 获取初始数据
  nextTick(() => {
    getDataInfo()
  })
})

// 触发本日、本周、本月
const changeActive = (i) => {
  active.value = i
  getDataInfo()
}

// 获取本日
const getDate = () => {
  startDate.value = getDateInfo(new Date())
  endDate.value = getDateInfo(new Date())
}

// 获得本周的开始时间：
const getStartDayOfWeek = (time) => {
  const now = new Date(time)
  const nowDayOfWeek = now.getDay()
  const day = nowDayOfWeek || 7
  const nowDay = now.getDate()
  const nowMonth = now.getMonth()
  return formatDate(new Date(now.getFullYear(), nowMonth, nowDay + 0 - day))
}

// 获得本周的结束时间：
const getEndDayOfWeek = (time) => {
  const now = new Date(time)
  const nowDayOfWeek = now.getDay()
  const day = nowDayOfWeek || 7
  const nowDay = now.getDate()
  const nowMonth = now.getMonth()
  return formatDate(new Date(now.getFullYear(), nowMonth, nowDay + 6 - day))
}

// 日期格式化
const formatDate = (date) => {
  const myyear = date.getFullYear()
  let mymonth = date.getMonth() + 1
  let myweekday = date.getDate()
  if (mymonth < 10) {
    mymonth = `0${mymonth}`
  }
  if (myweekday < 10) {
    myweekday = `0${myweekday}`
  }
  return `${myyear}-${mymonth}-${myweekday}`
}

// 本月的开始结束时间
const getMonty = () => {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const date = {
    firstDay,
    lastDay
  }
  return date
}
</script>
