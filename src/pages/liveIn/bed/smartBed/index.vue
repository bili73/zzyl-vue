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
    <!-- 房型列表 -->
    <HouseList
      :key="floorId"
      :floorId="floorId"
      :base-data="roomVoList"
      :floor-data="tabData"
      :route-type="routeType"
    ></HouseList>
    <!-- end -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store'

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
const timerId = ref(null)
onUnmounted(() => {
  clearInterval(timerId.value)
})
// 默认加载数据
onMounted(() => {
  if (route.query.type !== undefined) {
    routeType.value = route.query.type
  }
  getAllFloorList()
  // 在一个楼层，每个楼层下都有一个接口获取该楼层下的数据，然后每隔5秒自动执行获取一次数据，但是如果5秒后所在的楼层和当前的楼层不是同一个，则不执行
  // timerId.value = setInterval(() => {
  //   if (userStore.floorId === floorId.value) {
  //     getList()
  //     console.log(userStore.floorId, floorId.value, '触发')
  //   } else {
  //     userStore.floorId = floorId.value
  //     console.log(userStore.floorId, floorId.value, '不触发')
  //   }
  // }, 60000)
})
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
</style>
