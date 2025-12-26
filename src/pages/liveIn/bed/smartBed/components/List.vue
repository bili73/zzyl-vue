<!--房型列表-->
<template>
  <div v-if="floorData.length">
    <!-- end -->
    <!-- 房间列表 -->
    <div v-if="baseData.length" class="houseList">
      <div
        v-for="(roomItem, roomindex) in baseData"
        :key="roomindex"
        class="item"
      >
        <!-- 房间标题 -->
        <div class="title">
          <div class="lText">
            <span class="name">{{ roomItem.code }}</span>
            <div :key="floorId" class="device">
              <t-popup
                v-for="(item, index) in roomItem.deviceVos"
                :key="index"
                placement="bottom"
                show-arrow
                class="devicePopup"
              >
                <template #content>
                  <div class="product">{{ item.productName || '--' }}</div>
                  <div class="deviceName">{{ item.deviceName }}</div>
                </template>
                <img :src="getImgSrc(item)" class="device-item" />
              </t-popup>
            </div>
          </div>
          <div v-if="getRoomWuData(roomItem).length" class="wuData">
            <div
              v-for="(item, index) in getRoomWuData(roomItem)"
              :key="index"
              class="wuDataItem"
            >
              <span class="label">{{ item.label }}</span>
              <span
                v-if="item.functionId === 'zidongmengongzuozhuangtai'"
                class="wuDataVal door-control"
                :class="{
                  'door-open': getWuKdyVal(item) === '开启',
                  'door-closed': getWuKdyVal(item) === '关闭'
                }"
                @click="handleDoorControl(roomItem)"
              >
                <span class="door-icon">{{ getWuKdyVal(item) }}</span>
                <span class="door-hint">点击{{ getWuKdyVal(item) === '开启' ? '关门' : '开门' }}</span>
              </span>
              <span v-else class="wuDataVal">{{ getWuKdyVal(item) }}</span>
              <span class="unit">{{ item.unit }}</span>
            </div>
          </div>
        </div>
        <!--  -->
        <!-- 床位列表 -->
        <div class="bedList">
          <div
            v-if="
              roomItem.bedVoList &&
              roomItem.bedVoList.length &&
              !(
                roomItem.bedVoList.filter((item) => !item.deviceVos.length)
                  .length === roomItem.bedVoList.length
              )
            "
          >
            <ul>
              <li
                v-for="(item, index) in roomItem.bedVoList.filter(
                  (item) => item.deviceVos.length
                )"
                :key="index"
                class="leisure"
                :class="
                  userStore.unusualBedId.includes(item.id) ? 'unusual' : ''
                "
              >
                <!-- <div class="bedIcon"><span class="leisureIcon"></span></div> -->
                <div class="bedText">
                  <div class="deviceBox">
                    <div>床位号： &nbsp;&nbsp;&ensp;{{ item.bedNumber }}</div>

                    <div class="device">
                      <t-popup
                        v-for="(item1, index1) in item.deviceVos"
                        :key="index1"
                        placement="bottom"
                        show-arrow
                      >
                        <template #content>
                          <div class="product">
                            {{ item1.productName || '' }}
                          </div>
                          <div class="deviceName">{{ item1.deviceName }}</div>
                        </template>
                        <template #triggerElement>
                          <img :src="getImgSrc(item1)" class="device-item" />
                        </template>
                      </t-popup>
                    </div>
                  </div>
                  <p class="oldName">
                    老人姓名：&nbsp;{{ item.name ? item.name : '--' }}
                  </p>
                  <div v-if="item.bedStatus === 1" class="olderStatus">
                    <div
                      v-if="
                        !(
                          item.deviceVos &&
                          item.deviceVos.length ===
                            item.deviceVos.filter(
                              (item1) =>
                                !item1.deviceDataVos ||
                                !item1.deviceDataVos.length
                            ).length
                        )
                      "
                    >
                      <div class="left">
                        <img :src="getSleepStatusImg(item)" />
                        <text class="bedStatus">{{
                          getSleepStatusText(item)
                        }}</text>
                      </div>
                      <div class="right">
                        <!-- 显示所有床位级物模型数据 -->
                        <div
                          v-for="(wuData, idx) in getBedWuData(item)"
                          :key="idx"
                          class="data-item"
                        >
                          <img
                            v-if="wuData.value !== 'lichuangcishu'"
                            :src="wuData.src || ''"
                            :style="{ opacity: wuData.src ? 1 : 0 }"
                          />
                          <div
                            v-else
                            class="img-placeholder"
                          ></div>
                          <div class="label">{{ wuData.label }}</div>
                          <div class="val">{{ wuData.dataValue }}</div>
                          <div class="unit">{{ wuData.unit }}</div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="noPeople">当前床位设备无数据</div>
                  </div>

                  <div v-else class="noPeople">当前床位没有安排老人</div>
                </div>

                <!-- <div class="setting"></div> -->
              </li>
            </ul>
          </div>
          <!-- <div v-else-if="bedNodeviceAll(roomItem.bedVoList)" class="noData">
            当前房间床位都没有绑定设备
          </div> -->
          <div v-else class="noData">
            当前房间没有安排床位或床位没有绑定设备
          </div>
        </div>
        <!-- end -->
      </div>
    </div>
    <!-- end -->
    <div v-else><NoData></NoData></div>
  </div>
  <div v-else><NoData></NoData></div>
</template>
<script setup lang="ts">
import { watch } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import {
  sleepStatus,
  productIconList,
  wuDataList,
  roomWuDataList,
  bedWuDataList,
  roomStatus,
  baoJingStatus
} from '../constants'
import { useUserStore } from '@/store'
import { deviceOpenDoor, deviceCloseDoor } from '@/api/intelligence'
import NoData from '@/components/noData/index.vue' // 无数据提示组件

// ------定义变量------
// 获取父组件值、方法
const props = defineProps({
  //  基础列表数据
  baseData: {
    type: Array<Object | any>
  },
  // 楼层数据
  floorData: {
    type: Array<Object | any>
  },
  floorId: {
    type: String
  }
})

// 定义emits
const emit = defineEmits(['refresh'])

const userStore = useUserStore()

/**
 * 处理智能门锁开门/关门操作
 * @param roomItem 房间数据
 */
const handleDoorControl = async (roomItem) => {
  try {
    // 查找房间中的门锁状态数据（functionId='zidongmengongzuozhuangtai'）
    const doorStatusData = getRoomWuData(roomItem).find(
      (item) => item.functionId === 'zidongmengongzuozhuangtai'
    )

    if (!doorStatusData) {
      MessagePlugin.warning('未找到门锁状态数据')
      return
    }

    // 获取当前门锁状态：0=开启, 1=关闭（根据roomStatus数组定义）
    const currentStatus = Number(doorStatusData.dataValue)
    // isOpen=true 表示门锁是"开启"状态（dataValue=0），此时应该执行关门操作
    const isOpen = currentStatus === 0

    console.log('=== 门锁控制调试信息 ===')
    console.log('门锁状态原始值:', doorStatusData.dataValue, '类型:', typeof doorStatusData.dataValue)
    console.log('转换后的状态值:', currentStatus, '类型:', typeof currentStatus)
    console.log('isOpen 判断（true=当前状态为开启，需要关门）:', isOpen)
    console.log('将要执行的操作:', isOpen ? '关门' : '开门')

    // 查找房间中的智能门锁设备（产品名称包含"门禁"、"自动门"、"门锁"等）
    const doorLockDevice = roomItem.deviceVos?.find((device) =>
      device.productName?.includes('门禁') ||
      device.productName?.includes('自动门') ||
      device.productName?.includes('门锁') ||
      device.productName?.includes('智能门')
    )

    if (!doorLockDevice) {
      MessagePlugin.warning('当前房间未绑定智能门锁设备')
      return
    }

    if (!doorLockDevice.iotId) {
      MessagePlugin.error('设备IoT ID不存在')
      return
    }

    // 根据当前门锁状态调用开门或关门API
    const res: any = isOpen
      ? await deviceCloseDoor(doorLockDevice.iotId)
      : await deviceOpenDoor(doorLockDevice.iotId)

    if (res.code === 200) {
      const actionText = isOpen ? '关门' : '开门'
      MessagePlugin.success(`${actionText}成功`)
      // 触发父组件刷新数据
      emit('refresh')
    } else {
      MessagePlugin.error(res.msg || (isOpen ? '关门失败' : '开门失败'))
    }
  } catch (error) {
    console.error('门锁操作失败:', error)
    MessagePlugin.error('门锁操作失败')
  }
}

// 获取当前房间对应的物模型数据（仅房间级：门磁、温湿度）
const getRoomWuData = (item) => {
  const wuList = []
  if (item && item.deviceVos && item.deviceVos.length) {
    item.deviceVos.forEach((item1) => {
      if (item1.deviceDataVos) {
        wuList.push(...item1.deviceDataVos)
      } else {
        return []
      }
    })
  }

  // 使用 roomWuDataList 过滤，只显示房间级物模型
  const filteredData = getSameRoomData(roomWuDataList, wuList)

  return filteredData
}
// 获取当前床位对应的物模型数据（床位级：心率、呼吸率等）
const getBedWuData = (item) => {
  const wuList = []
  if (item && item.deviceVos && item.deviceVos.length) {
    item.deviceVos.forEach((item1) => {
      if (item1.deviceDataVos) {
        wuList.push(...item1.deviceDataVos)
      } else {
        return []
      }
    })
  }
  // 使用 bedWuDataList 过滤，只显示床位级物模型
  return getSameRoomData(bedWuDataList, wuList)
}
// 根据物模型的key返回对应的文字状态值
const getWuKdyVal = (item) => {
  if (item.functionId === 'zidongmengongzuozhuangtai') {
    // 门锁状态：0=关闭, 1=开启
    const statusValue = Number(item.dataValue)
    const statusText = roomStatus[statusValue]
    return statusText || (statusValue === 1 ? '开启' : '关闭')
  }
  if (item.functionId === 'SmokeSensorState') {
    return baoJingStatus[Number(item.dataValue)]
  }
  return item.dataValue
}
// 求自定义物模型和设置的物模型的交集
const getSameRoomData = (array1, array2) => {
  // console.log(array1, array2, 'array1, array2')
  // 创建一个空数组来存储交集结果
  const intersection = []
  // 遍历第一个数组
  for (const item1 of array1) {
    // 在第二个数组中查找匹配的对象
    const matchingItem = array2.find(
      (item2) => item2.functionId === item1.value
    )

    if (matchingItem) {
      // 如果找到匹配的对象，将其复制到结果数组，并添加新属性
      const newItem = {
        ...item1,
        ...matchingItem,
        dataValue: matchingItem.dataValue
      }
      intersection.push(newItem)
    }
  }
  // console.log(intersection, 'intersection')
  return intersection
}
// 根据睡眠状态获取对应的心率或者离床次数物模型
const getWuDataBySleepStatus = (item) => {
  // console.log(item, 'item')
  const obj = getBedWuData(item).filter(
    (item) => item.functionId === 'shuimianzhuangtai'
  )
  // console.log(obj, '心率')
  if (obj.length) {
    const arr = getBedWuData(item).filter(
      (item) =>
        item.functionId ===
        (obj[0].dataValue === '2' ? 'lichuangcishu' : 'HeartRate')
    )
    return arr[0]
  }
}
// 根据睡眠状态获取对应的呼吸率或者离床时间物模型
const getWuDataBySleepStatus1 = (item) => {
  const obj = getBedWuData(item).filter(
    (item) => item.functionId === 'shuimianzhuangtai'
  )

  if (obj.length) {
    const arr = getBedWuData(item).filter(
      (item) =>
        item.functionId ===
        (obj[0].dataValue === '2' ? 'lichuagnshijian' : 'RespiratoryRate')
    )
    return obj[0].dataValue === '2'
      ? { ...arr[0], dataValue: timestampToTime(arr[0]?.dataValue) }
      : arr[0]
  }
}
// 获取睡眠状态对应的图片
const getSleepStatusImg = (item) => {
  const obj = getBedWuData(item).filter(
    (item) => item.functionId === 'shuimianzhuangtai'
  )
  if (obj[0]) {
    return sleepStatus[Number(obj[0].dataValue)]?.src
  }
}
// 获取睡眠状态对应的文案
const getSleepStatusText = (item) => {
  const obj = getBedWuData(item).filter(
    (item) => item.functionId === 'shuimianzhuangtai'
  )
  if (obj[0]) {
    return sleepStatus[Number(obj[0].dataValue)].value
  }
}
// 获取产品对应的图片
const getImgSrc = (item) => {
  // console.log(item, 'itemitemitem')
  const obj = productIconList.filter((item1) => {
    return item.productName?.includes(item1.label)
  })
  if (obj.length) {
    return obj[0].src
  }
  return 'https://yjy-slwl-oss.oss-cn-hangzhou.aliyuncs.com/1b2cccd6-895f-4118-83d4-8e44fb47a1fd.png'
}
// 时间戳转成时分秒
const timestampToTime = (timestamp) => {
  // console.log(timestamp, 'timestamp')
  const date = new Date(timestamp * 1000) // 将时间戳转换为毫秒
  const hours = date.getUTCHours().toString().padStart(2, '0') // 获取小时并格式化为两位数
  const minutes = date.getUTCMinutes().toString().padStart(2, '0') // 获取分钟并格式化为两位数
  const seconds = date.getUTCSeconds().toString().padStart(2, '0') // 获取秒钟并格式化为两位数
  return `${hours}:${minutes}:${seconds}`
}
const handleMouseover = () => {
  console.log(111)
}
watch(
  () => props.baseData,
  (val) => {
    console.log(val, 'baseData')
  }
)
</script>
<style lang="less" scoped>
.t-popup .t-popup__content {
  width: auto !important;
  padding: 14px 16px;
  .product,
  .deviceName {
    font-size: 12px !important;
  }
  .product {
    color: #191919;
    margin-bottom: 4px;
  }
  .deviceName {
    color: #999;
  }
}
</style>
<style lang="less" scoped>
.houseList {
  display: block;
  .item {
    display: block;
    width: auto;
    .bedList {
      .leisure {
        background-color: #f6fbfa;
        position: relative;
        width: calc(33.3% - 12px);
        min-height: 178px;
        .setting {
          width: 20px;
          height: 20px;
          position: absolute;
          right: 12px;
          top: 12px;
          background-image: url('../../../../../assets/icon-sz@2x.png');
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center;
          cursor: pointer;
        }
        .bedText {
          width: 100%;
          .oldName {
            margin-bottom: 24px;
          }
          .olderStatus > div {
            display: flex;
          }
          .noPeople {
            text-align: center;
            color: var(--color-bk6);
            display: block;
            margin-top: 35px;
          }
          .olderStatus {
            .noPeople {
              text-align: center;
              color: var(--color-bk6);
              display: block;
              margin-top: 35px;
            }
            .left {
              margin-right: 22px;
              display: flex;
              flex-direction: column;
              img {
                width: 44px;
                height: 44px;
              }
              .bedStatus {
                font-size: 14px;
                color: #595959;
                position: relative;
                left: 3px;
              }
            }
            .right {
              display: flex;
              flex-direction: column;
              gap: 6px;
              position: relative;
              bottom: 7px;

              .data-item {
                display: flex;
                align-items: center;
                gap: 5px;

                img {
                  width: 32px;
                  height: 32px;
                  margin-right: 3px;
                  flex-shrink: 0;
                }

                .img-placeholder {
                  width: 32px;
                  height: 32px;
                  margin-right: 3px;
                  flex-shrink: 0;
                }

                .label {
                  min-width: 70px;
                  font-size: 13px;
                  color: #595959;
                  white-space: nowrap;
                }

                .val {
                  font-size: 20px;
                  color: #262626;
                  font-weight: bold;
                  margin-right: 4px;
                  min-width: 40px;
                }

                .unit {
                  font-size: 13px;
                  color: #595959;
                }
              }
            }
          }
          .deviceBox {
            display: flex;
            justify-content: space-between;
            .device {
              display: flex;
              align-items: center;
              margin-left: 15px;
              .device-item {
                width: 16px;
                height: 16px;
              }
            }
          }

          p {
            margin-bottom: 4px;
          }
          .care {
            span {
              padding: 2.5px 9.5px;
              border-radius: 100px 100px 100px 100px;
              font-size: 12px;
              margin-right: 10px;
            }
            span:nth-child(1) {
              color: #008d71;
              background-color: #e5f4f2;
            }
            span:nth-child(2) {
              color: #395cff;
              background-color: #d8edfd;
            }
            span:nth-child(3) {
              color: #fb9b0d;
              background-color: #f4edd1;
            }
            span:nth-child(4) {
              color: #ff6800;
              background-color: rgba(#ffcfae, 0.37);
            }
          }
          .noCare {
            span {
              padding: 0 !important;
              background-color: transparent !important;
              color: #999 !important;
              font-size: 14px;
            }
          }
        }
      }
    }
    .title {
      .wuData {
        display: flex;
        .wuDataItem {
          margin-right: 20px;

          .door-control {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 2px 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;

            .door-icon {
              font-weight: 500;
            }

            .door-hint {
              font-size: 12px;
              opacity: 0.8;
            }

            &.door-open {
              color: #00a870;
              background-color: #e7f9f2;
              border-color: #00a870;

              &:hover {
                background-color: #d0efea;
              }
            }

            &.door-closed {
              color: #e37318;
              background-color: #fef2e8;
              border-color: #e37318;

              &:hover {
                background-color: #fce5d2;
              }
            }

            &:active {
              transform: scale(0.95);
            }
          }

          .wuDataVal:not(.door-control) {
            color: #262626;
          }
        }
      }
      .device {
        display: flex;
        align-items: center;
        margin-left: 15px;
        .device-item {
          width: 16px;
          height: 16px;
          margin-right: 8px;
        }
      }
    }
  }
}
</style>
