<!-- 框架头部 -->
<template>
  <div :class="layoutCls">
    <t-head-menu :value="active" :class="menuCls" :theme="theme">
      <template #logo>
        <span
          v-if="showLogo"
          class="header-logo-container"
          @click="handleNav('/dashboard/base')"
        >
          <logo-full v-if="settingStore.mode === 'light'" class="t-logo" />
          <img v-else src="@/assets/logBlackTemFull.png" alt="" />
        </span>
        <div v-else class="header-operate-left">
          <t-button
            theme="default"
            shape="square"
            variant="text"
            @click="changeCollapsed"
          >
            <t-icon class="collapsed-icon" name="view-list" />
          </t-button>
        </div>
      </template>
      <template v-if="layout !== 'side'" #default>
        <topMenuContent class="header-menu" :nav-data="menu" :left="false" />
      </template>
      <template #operations>
        <div
          v-if="settingStore.layout === 'top'"
          class="topOperationsContainer"
        >
          <div
            src="@/assets/test-img/newsCenter.png"
            class="toNews"
            :class="userStore.isHaveNews ? 'active' : ''"
            @click="handleNew"
          ></div>
          <t-dropdown :min-column-width="135" trigger="click">
            <template #dropdown>
              <t-dropdown-menu>
                <t-dropdown-item
                  class="operations-dropdown-container-item"
                  @click="handleNav('/userCenter')"
                >
                  <t-icon name="user-circle"></t-icon>个人中心
                </t-dropdown-item>
                <t-dropdown-item
                  class="operations-dropdown-container-item"
                  @click="handleOpen"
                >
                  <t-icon name="edit"></t-icon>修改密码
                </t-dropdown-item>
              </t-dropdown-menu>
            </template>
            <div class="baseInfo">
              <img
                :src="
                  userStore.userAvatar.avatar !== undefined
                    ? userStore.userAvatar.avatar
                    : avatar
                "
                class="headImg"
              />
              <div class="userName">{{ userStore.userAvatar.realName }}</div>
              <div><t-icon name="chevron-down" /></div>
            </div>
          </t-dropdown>
        </div>
        <div v-else class="operations-container">
          <!-- 搜索框 -->
          <!-- <search v-if="layout !== 'side'" :layout="layout" /> -->

          <!-- 全局通知 -->
          <!-- <notice /> -->
          <t-dropdown :min-column-width="135" trigger="click">
            <template #dropdown>
              <t-dropdown-menu>
                <!-- <t-dropdown-item
                  class="operations-dropdown-container-item"
                  @click="handleNav('/user/index')"
                >
                  <t-icon name="user-circle"></t-icon>个人中心
                </t-dropdown-item> -->
                <!-- <t-dropdown-item
                  class="operations-dropdown-container-item"
                  @click="handleLogout"
                >
                  <t-icon name="poweroff"></t-icon>退出登录
                </t-dropdown-item> -->
              </t-dropdown-menu>
            </template>
            <t-button class="header-user-btn" theme="default" variant="text">
              <template #icon>
                <t-icon class="header-user-avatar" name="user-circle" />
              </template>
              <div class="header-user-account">Tencent</div>
              <template #suffix><t-icon name="chevron-down" /></template>
            </t-button>
          </t-dropdown>
          <t-tooltip placement="bottom" content="系统设置">
            <t-button
              theme="default"
              shape="square"
              variant="text"
              @click="toggleSettingPanel"
            >
              <t-icon name="setting" />
            </t-button>
          </t-tooltip>
        </div>
      </template>
    </t-head-menu>
    <!-- 老人mp3 -->
    <audio v-if="warnData.alertDataType === 0" ref="audioVo" controls hidden>
      <source src="@/assets/oldPreview.mp3" type="audio/mp3" />
    </audio>
    <!-- end -->
    <!-- 设备mp3 -->
    <audio v-else ref="audioVo" controls hidden>
      <source src="@/assets/facilityPreview.mp3" type="audio/mp3" />
    </audio>
    <!-- end -->
  </div>
  <PaddWord
    ref="pwd"
    :visible="visible"
    @handleClose="handleClose"
    @handleOpen="handleOpenOperate"
  ></PaddWord>
  <!-- 修改密码确认框 -->
  <OperateDialog
    :visible="visibleOperate"
    :title="operateTitle"
    :text="operateText"
    @handle-delete="handleOperate"
    @handle-close="handleOperateClose"
  ></OperateDialog>
  <!-- 报警提示弹层 -->
  <Warn
    :visible="visibleWarn"
    :data="warnData"
    :time="time"
    @handleSubmit="handleSubmit"
    @handleClose="handleWarnClose"
  ></Warn>
  <!-- end -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { PropType } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { useSettingStore, useUserStore } from '@/store'
import { getActive } from '@/router'
import { prefix } from '@/config/global'
import LogoFull from '@/assets/test-img/assets-logo-full.svg?component'
import type { MenuRoute } from '@/types/interface'
import topMenuContent from './topMenuContent.vue'
import PaddWord from '../components/PaddWord.vue'
import OperateDialog from '@/components/OperateDialog/index.vue'
import Warn from '@/components/warn/index.vue'
import { updatePwd } from '@/api/user'
import { countByReadStatus } from '@/api/news'

const props = defineProps({
  theme: {
    type: String,
    default: ''
  },
  layout: {
    type: String,
    default: 'top'
  },
  showLogo: {
    type: Boolean,
    default: true
  },
  menu: {
    type: Array as PropType<MenuRoute[]>,
    default: () => []
  },
  isFixed: {
    type: Boolean,
    default: false
  },
  isCompact: {
    type: Boolean,
    default: false
  },
  maxLevel: {
    type: Number,
    default: 3
  }
})

const router = useRouter()
const settingStore = useSettingStore()
const userStore = useUserStore()
const visible = ref(false)
const visibleOperate = ref(false)
const visibleWarn = ref(false) // 报警弹层
const operateTitle = ref('') // 操作弹层标题
const operateText = ref('') // 要操作的内容提示
const pwd = ref(null)
const audioVo = ref(null)
const time = ref(10)
const avatar = ref(
  'https://yjy-oss-videos.oss-accelerate.aliyuncs.com/grzxhz.jpg'
)
// 打开设置
const toggleSettingPanel = () => {
  settingStore.updateConfig({
    showSettingPanel: true
  })
}
// 点击
const active = computed(() => {
  const data = getActive()
  console.log(data, '头部导航')
  return `/${data.split('/')[1]}`
})

const layoutCls = computed(() =>
  settingStore.mode === 'black'
    ? [`${prefix}-header-layout modeStyle`]
    : [`${prefix}-header-layout`]
)

const menuCls = computed(() => {
  const { isFixed, layout, isCompact } = props
  return [
    {
      [`${prefix}-header-menu`]: !isFixed,
      [`${prefix}-header-menu-fixed`]: isFixed,
      [`${prefix}-header-menu-fixed-side`]: layout === 'side' && isFixed,
      [`${prefix}-header-menu-fixed-side-compact`]:
        layout === 'side' && isFixed && isCompact
    }
  ]
})
// 获取已读未读消息数量
const getCountStatus = async () => {
  await countByReadStatus().then((res) => {
    if (res.code === 200) {
      const data = res.data
      userStore.isHaveNews = Boolean(data.unReadCount)
    }
  })
}
// 改变侧边栏
const changeCollapsed = () => {
  settingStore.updateConfig({
    isSidebarCompact: !settingStore.isSidebarCompact
  })
}
// 点击跳转
const handleNav = (url) => {
  router.push(url)
}
// 点击回到登录页
const handleOpen = () => {
  visible.value = true
}
// 是否确认修改密码弹层
const handleOpenOperate = () => {
  visibleOperate.value = true
  operateTitle.value = '确认修改'
  operateText.value = '密码修改成功后，需重新登录，是否继续？'
}
// 关闭修改密码弹层
const handleClose = () => {
  visible.value = false
}
// 确认修改
const handleOperate = async () => {
  const val = pwd.value.formData
  const parent = {
    newPassword: val.newPassword,
    oldPassword: val.oldPassword
  }
  const res: any = await updatePwd(parent)
  if (res.code === 200) {
    MessagePlugin.success('操作成功')
    handleOperateClose()
    handleClose()
    pwd.value.handleClear()
    router.push({
      path: '/login',
      query: {
        redirect: encodeURIComponent(router.currentRoute.value.fullPath)
      }
    })
  }
}
//
const handleOperateClose = () => {
  visibleOperate.value = false
}
const handleWarnClose = () => {
  visibleWarn.value = false
}
// 语音播报/报警异常
const socket = ref(null)
const warnData = ref({}) // 报警数据
const messageNotificationAudio = ref(null) // 消息提示音

/**
 * WebSocket 消息处理（统一入口）
 * @param {MessageEvent} event - WebSocket消息事件
 */
const handleWebSocketMessage = (event) => {
  try {
    const res = JSON.parse(event.data)
    console.log('收到WebSocket消息:', res)

    // 报警消息（notifyType === 1）
    if (res.notifyType === 1) {
      handleAlarmMessage(res)
    }
    // 普通消息通知（notifyType === 2 或其他）
    else {
      handleNormalMessageNotification(res)
    }

    // 统一更新未读消息数量
    updateUnreadCount()
  } catch (error) {
    console.error('WebSocket消息处理错误:', error)
  }
}

/**
 * 处理报警消息
 * @param {Object} alarmData - 报警数据
 */
const handleAlarmMessage = (alarmData) => {
  warnData.value = alarmData

  // 判断是否是解除报警
  if (alarmData.notifyType !== 1) {
    // 解除报警异常
    if (alarmData.physicalLocationType === 0) {
      return userStore.deleteUnusualFloorId(
        alarmData.deviceDescription?.split(',')[0]
      )
    }
    if (alarmData.physicalLocationType === 2) {
      return userStore.deleteUnusualBedId(
        alarmData.deviceDescription?.split(',')[2]
      )
    }
  }

  // 处理报警异常
  if (alarmData.isAllConsumer) {
    // 全局通知：标记异常楼层或床位
    if (alarmData.physicalLocationType === 0) {
      userStore.setUnusualFloorId(alarmData.deviceDescription?.split(',')[0])
    } else if (alarmData.physicalLocationType === 2) {
      userStore.setUnusualBedId(alarmData.deviceDescription?.split(',')[2])
    }
  } else {
    // 个人通知：显示弹窗和语音播报
    visibleWarn.value = true

    // 语音播报
    if (alarmData.voiceNotifyStatus === 1) {
      playAlarmAudio()
    }
  }
}

/**
 * 处理普通消息通知
 * @param {Object} message - 消息数据
 */
const handleNormalMessageNotification = (message) => {
  // 播放消息提示音
  playMessageNotificationSound()

  // 更新红点状态
  userStore.isHaveNews = true

  // 可选：显示简短的Toast提示
  // MessagePlugin.info({
  //   content: `您有新的消息：${message.title || '新通知'}`,
  //   duration: 3000,
  //   placement: 'top-right'
  // })
}

/**
 * 播放报警语音
 */
const playAlarmAudio = () => {
  if (!audioVo.value) return

  const playPromise = audioVo.value.play()
  if (playPromise && playPromise !== undefined) {
    playPromise
      .then(() => {
        // 播放成功
      })
      .catch((err) => {
        console.error('报警语音播放失败:', err)
        // 重试播放
        audioVo.value.play().catch(() => {})
      })
  }
}

/**
 * 播放消息提示音
 * 优先使用音频文件，如果文件不存在则使用 Web Audio API 生成简单提示音
 */
const playMessageNotificationSound = () => {
  // 方案1：尝试播放音频文件
  try {
    const audio = new Audio('/sounds/message-notification.mp3')
    audio.volume = 0.5 // 音量设置为50%

    // 设置超时，如果2秒内没有开始播放，说明文件不存在
    const playTimeout = setTimeout(() => {
      // 音频文件不存在，使用方案2
      playGeneratedNotificationSound()
    }, 2000)

    audio.play().then(() => {
      clearTimeout(playTimeout)
    }).catch((err) => {
      clearTimeout(playTimeout)
      console.warn('消息提示音文件播放失败，尝试使用生成音效:', err)
      // 音频文件不存在或播放失败，使用方案2
      playGeneratedNotificationSound()
    })
  } catch (error) {
    console.warn('消息提示音播放异常，尝试使用生成音效:', error)
    playGeneratedNotificationSound()
  }
}

/**
 * 使用 Web Audio API 生成简单的消息提示音（备用方案）
 * 无需外部音频文件
 */
const playGeneratedNotificationSound = () => {
  try {
    // 检查浏览器支持
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) {
      console.warn('浏览器不支持 Web Audio API')
      return
    }

    const audioContext = new AudioContext()

    // 创建振荡器（生成音调）
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    // 连接节点
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // 设置音调参数（"叮"的音效）
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // 频率800Hz
    oscillator.frequency.exponentialRampToValueAtTime(
      600,
      audioContext.currentTime + 0.1
    ) // 频率下降到600Hz
    oscillator.type = 'sine' // 正弦波（最柔和的波形）

    // 设置音量包络（淡入淡出）
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01) // 快速淡入
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    ) // 慢速淡出

    // 播放
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3) // 播放0.3秒

    // 清理资源
    setTimeout(() => {
      audioContext.close()
    }, 400)
  } catch (error) {
    console.warn('生成消息提示音失败:', error)
  }
}

/**
 * 实时更新未读消息数量
 */
const updateUnreadCount = async () => {
  try {
    const res = await countByReadStatus()
    if (res.code === 200) {
      const data = res.data
      userStore.isHaveNews = Boolean(data.unReadCount)
    }
  } catch (error) {
    console.error('更新未读消息数量失败:', error)
  }
}

/**
 * 初始化WebSocket连接
 */
const setwebSocket = () => {
  if (!userStore.userInfo?.id) {
    console.warn('用户信息不存在，无法建立WebSocket连接')
    return
  }

  try {
    socket.value = new WebSocket(
      `${import.meta.env.VITE_APP_SOCKET_URL}/ws/${userStore.userInfo.id}`
    )

    // 连接成功
    socket.value.onopen = () => {
      console.log('WebSocket连接成功')
    }

    // 连接关闭
    socket.value.onclose = () => {
      console.log('WebSocket连接关闭')
    }

    // 连接错误
    socket.value.onerror = (error) => {
      console.error('WebSocket连接错误:', error)
    }

    // 收到消息（统一处理入口）
    socket.value.onmessage = handleWebSocketMessage
  } catch (error) {
    console.error('WebSocket初始化失败:', error)
  }
}
// 查看消息
const handleSubmit = () => {
  handleWarnClose()
  router.push({
    path: `/intelligence/facility`,
    query: {
      id: warnData.value.id
    }
  })
}
//
const handleNew = () => {
  router.push({
    path: `/news/newlist`
  })
}
onMounted(() => {
  setwebSocket()
  getCountStatus()
})
</script>
<style lang="less" scoped>
.toNews {
  width: 20px;
  height: 20px;
  margin-right: 21px;
  cursor: pointer;
  position: relative;
  background-image: url('@/assets/test-img/newsCenter.png');
  background-size: contain;
}
.active::after {
  display: inline-block;
  content: '';
  width: 5px;
  height: 5px;
  background-color: red;
  border-radius: 50%;
  position: absolute;
  right: -2px;
  top: 0;
}
.setShow {
  cursor: pointer;
  color: #000;
  padding: 3px 6px;
  z-index: 1002;
  line-height: 16px;
  .t-icon {
    width: 16px;
    height: 16px;
  }
}
.modeStyle .setShow {
  color: var(--color-white);
  &:hover {
    color: #000;
  }
}
.@{starter-prefix}-header {
  &-menu-fixed {
    position: fixed;
    top: 0;
    z-index: 1001;

    &-side {
      left: 232px;
      right: 0;
      z-index: 10;
      width: auto;
      transition: all 0.3s;
      &-compact {
        left: 64px;
      }
    }
  }

  &-logo-container {
    cursor: pointer;
    display: inline-flex;
  }
}
.header-menu {
  flex: 1 1 1;
  display: flex;
  :deep(li.t-menu__item:first-child) {
    margin-top: 0px !important;
  }

  :deep(.t-menu__item) {
    min-width: unset;
    padding: 0px 12px 0 8px;
    // TOTO 框架修改
    height: 56px;
    // height: 30px;
    margin-bottom: 0px !important;
    margin-right: 8px;
    // color: var(--color-black);
    // TOTO 框架修改
    // border-radius: 0px;
    border-radius: 0px;
    .t-icon {
      display: none;
      height: 24px;
      width: 24px;
    }
  }
  :deep(
      .t-menu__item:hover:not(.t-is-active):not(.t-is-opened):not(
          .t-is-disabled
        ):not(.t-submenu__item)
    ) {
    color: var(--color-white) !important;
    // color: var(--color-main) !important;
    background-color: transparent !important;
  }
  :deep(.t-menu__item.t-is-active) {
    color: var(--color-main);
    background-color: #dff5f3;
    .t-menu__content {
      color: var(--color-link) !important;
    }
    .t-icon {
      display: block;
    }
  }
}
:deep(.t-menu__item-spacer) {
  color: var(--color-white);
}
.operations-container {
  display: flex;
  align-items: center;
  margin-right: 12px;

  .t-popup__reference {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .t-button {
    margin: 0 8px;
    &.header-user-btn {
      margin: 0;
    }
  }

  .t-icon {
    font-size: 20px;
    &.general {
      margin-right: 16px;
    }
  }
}

.header-operate-left {
  display: flex;
  margin-left: 20px;
  align-items: normal;
  line-height: 0;

  .collapsed-icon {
    font-size: 20px;
  }
}

.header-logo-container {
  width: 128px;
  height: 31px;
  display: flex;
  margin-left: 24px;
  color: var(--td-text-color-primary);

  .t-logo {
    width: 100%;
    height: 100%;
    &:hover {
      cursor: pointer;
    }
  }

  &:hover {
    cursor: pointer;
  }
}

.header-user-account {
  display: inline-flex;
  align-items: center;
  color: var(--td-text-color-primary);
  .t-icon {
    margin-left: 4px;
    font-size: 16px;
  }
}

:deep(.t-head-menu__inner) {
  border-bottom: 1px solid var(--td-border-level-1-color);
  .t-submenu {
    margin-bottom: 0px;
  }
}

:deep(.modeStyle .t-head-menu__inner) {
  background-color: #000;
}

.t-menu--light {
  .header-user-account {
    color: var(--td-text-color-primary);
  }
}
.t-menu--dark {
  .t-head-menu__inner {
    border-bottom: 1px solid var(--td-gray-color-10);
  }
  .header-user-account {
    color: rgba(255, 255, 255, 0.55);
  }
  .t-button {
    --ripple-color: var(--td-gray-color-10) !important;
    &:hover {
      background: var(--td-gray-color-12) !important;
    }
  }
}

.operations-dropdown-container-item {
  width: 100%;
  display: flex;
  align-items: center;

  .t-icon {
    margin-right: 8px;
  }

  :deep(.t-dropdown__item) {
    .t-dropdown__item__content {
      display: flex;
      justify-content: center;
    }
    .t-dropdown__item__content__text {
      display: flex;
      align-items: center;
      font-size: 14px;
    }
  }

  :deep(.t-dropdown__item) {
    width: 100%;
    margin-bottom: 0px;
  }
  &:last-child {
    :deep(.t-dropdown__item) {
      margin-bottom: 8px;
    }
  }
}
</style>
