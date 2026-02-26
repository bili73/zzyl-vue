<!-- 列表排名组件 - 修改版 -->
<template>
  <t-row :gutter="12">
    <t-col :xs="6" :xl="3">
      <t-card title="" class="dashboard-rank-card">
        <template #title>
          <div class="timeTie">
            <div>老人等级分布</div>
            <div>
              数据更新:{{
                new Date().getFullYear() +
                '-' +
                Number(new Date().getMonth() + 1) +
                '-' +
                new Date().getDate()
              }}
            </div>
          </div>
        </template>
        <div ref="elderRankContainer" style="height: 240px"></div>
      </t-card>
    </t-col>
    <t-col :xs="6" :xl="4">
      <t-card title="" class="dashboard-rank-card">
        <template #title>
          <div class="timeTie">
            <div>老人年龄分布</div>
            <div>
              数据更新:{{
                new Date().getFullYear() +
                '-' +
                Number(new Date().getMonth() + 1) +
                '-' +
                new Date().getDate()
              }}
            </div>
          </div>
        </template>
        <div ref="elderAgeContainer" style="height: 220px"></div>
      </t-card>
    </t-col>
    <t-col :xs="12" :xl="5">
      <t-card title="" class="dashboard-rank-card">
        <template #title>
          <div class="timeTie">
            <div>预约总览</div>
            <div>
              <span class="goToday" @click="goToday">回到今日</span
              >{{ selectTime }}
            </div>
          </div>
        </template>
        <div class="dateSelete">
          <span
            class="pre"
            :class="isToday ? 'forbidActive' : ''"
            @click="getPreWeek"
          ></span>
          <span class="next" @click="getNextWeek"></span>
          <ul>
            <li v-for="(item, index) in dataObj" :key="index">
              <p>
                <span>{{ item.week }}</span>
              </p>
              <p @click="handleDay(item, index)">
                <span :class="dayActive === index ? 'dayActive' : ''">{{
                  item.day
                }}</span>
              </p>
            </li>
          </ul>
        </div>
        <div class="subscribeCon">
          <ul>
            <li v-for="(item, index) in subscribeData" :key="index">
              <span
                class="typeIcon"
                :class="item.type === 1 ? 'icon3' : 'icon1'"
                >{{ item.type === 1 ? '参观' : '预约' }}</span
              >
              <span class="time">{{ item.time }}</span>
              <span>预约人：{{ item.name }}</span>
              <span>手机号：{{ item.phone }}</span>
            </li>
          </ul>
        </div>
      </t-card>
    </t-col>
  </t-row>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as echarts from 'echarts/core'
import { getWeekDate, getDateInfo } from '@/utils/date'
import { getElderDistribution, getReservationList } from '@/api/dashboard'
import { getElderAgeDistribution, getElderRankDistribution } from '..'

const dataObj = ref([])
const isToday = ref(false)
const selectTime = ref('')
const dayActive = ref(0)
const subscribeData = ref([])
let myChart: echarts.ECharts
const elderRankContainer = ref()
const elderAgeContainer = ref()

const elderRankData = ref([])
const elderAgeData = ref({
  man: [],
  woman: []
})

// 获取老人分布数据
const fetchElderDistribution = async () => {
  try {
    const res = await getElderDistribution()
    if (res.code === 200) {
      elderRankData.value = res.data.rankDistribution
      elderAgeData.value = res.data.ageDistribution

      // 重新渲染图表
      elderRankChart()
      elderAgeChart()
    }
  } catch (error) {
    console.error('获取老人分布失败：', error)
  }
}

// 获取预约总览数据
const fetchReservationList = async (date: string) => {
  try {
    const res = await getReservationList(date)
    if (res.code === 200) {
      subscribeData.value = res.data
    }
  } catch (error) {
    console.error('获取预约总览失败：', error)
    subscribeData.value = []
  }
}

onMounted(() => {
  // 设置一周的日期
  dataObj.value = getWeekDate({ baselineDate: new Date() })
  selectTime.value = time()

  // 获取老人分布数据
  fetchElderDistribution()

  // 获取今日预约数据
  fetchReservationList(selectTime.value)

  // 检查是否可以点击上一周
  isChick(dataObj.value)

  window.addEventListener('resize', handleResize)
})

const handleResize = () => {
  if (myChart) {
    myChart.resize()
  }
}

// 老人等级分布
const elderRankChart = () => {
  if (elderRankContainer.value) {
    myChart = echarts.init(elderRankContainer.value)
    myChart.setOption(getElderRankDistribution(elderRankData.value))
  }
}

// 老人年龄分布
const elderAgeChart = () => {
  if (elderAgeContainer.value) {
    myChart = echarts.init(elderAgeContainer.value)
    myChart.setOption(getElderAgeDistribution(elderAgeData.value))
  }
}

// 是否可以触发上一周
const isChick = (date) => {
  const today = time()
  const selectDate = date[0].dateStr
  const todayStr = new Date(today).getTime()
  const selectStr = new Date(selectDate).getTime()
  if (selectStr <= todayStr) {
    isToday.value = true
  } else {
    isToday.value = false
  }
  // 是否与当前时间相等，设置天的当前状态与要显示的数据
  dataObj.value.forEach((obj, i) => {
    if (obj.dateStr === selectTime.value) {
      dayActive.value = i
    }
    // 如果上一页不能触发了，显示当前的时间
    if (isToday.value) {
      selectTime.value = time()
    }
  })
}

// 上一周
const getPreWeek = () => {
  if (!isToday.value) {
    dayActive.value = 0
    dataObj.value = getWeekDate({
      baselineDate: new Date(dataObj.value[0].dateStr),
      range: -7
    })
    selectTime.value = dataObj.value[0].dateStr
    isChick(dataObj.value)
    // 获取新日期的预约数据
    fetchReservationList(selectTime.value)
  }
}

// 下一周
const getNextWeek = () => {
  dayActive.value = 0
  dataObj.value = getWeekDate({
    baselineDate: new Date(dataObj.value[0].dateStr),
    range: 7
  })

  isChick(dataObj.value)
  selectTime.value = dataObj.value[0].dateStr
  // 获取新日期的预约数据
  fetchReservationList(selectTime.value)
}

// 触发当天显示的数据
const handleDay = (item, i) => {
  dayActive.value = i
  selectTime.value = item.dateStr
  // 获取选中日期的预约数据
  fetchReservationList(item.dateStr)
}

// 回到今天
const goToday = () => {
  dataObj.value = getWeekDate({ baselineDate: new Date() })
  isChick(dataObj.value)
  selectTime.value = time()
  // 获取今日预约数据
  fetchReservationList(selectTime.value)
}

// 当前时间
const time = () => {
  return getDateInfo(new Date())
}
</script>
