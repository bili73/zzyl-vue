<!-- 订单信息 -->
<template>
  <!-- 订单信息 -->
  <t-card title="订单信息">
    <div class="info-block">
      <div class="info-item">
        <h1 class="label-wt">订单编号：</h1>
        <span>{{ data.orderNo }}</span>
      </div>
      <div class="info-item">
        <h1 class="label-wt">期望服务时间：</h1>
        <span>{{ data.estimatedArrivalTime }}</span>
      </div>
      <div class="info-item">
        <h1 class="label-wt">老人姓名：</h1>
        <span>{{ elderVoData.name }}</span>
      </div>
      <div class="info-item">
        <h1 class="label-wt">床位号：</h1>
        <span>{{ bedVoData.bedNumber }}</span>
      </div>
      <div v-if="nursingProjectVo !== undefined" class="info-item">
        <h1 class="label-wt">护理项目名称：</h1>
        <span>{{ nursingProjectVo.name }}</span>
      </div>
      <div class="info-item">
        <h1 class="label-wt">订单金额：</h1>
        <span>{{ decimalsReplenish(data.amount) }} 元</span>
      </div>
      <div class="info-item">
        <h1 class="label-wt">下单人：</h1>
        <span>{{ memberVoData.name }}</span>
      </div>
      <div class="info-item">
        <h1 class="label-wt">下单人手机号：</h1>
        <span>{{ phoneStar(memberVoData.phone) }}</span>
      </div>
      <div class="info-item">
        <h1 class="label-wt">备注：</h1>
        <span>{{ data.remark ? data.remark : '--' }}</span>
      </div>
    </div>
  </t-card>
  <!-- end -->
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { decimalsReplenish, phoneStar } from '@/utils/index'

// 获取父组件值、方法
const props = defineProps({
  // 所有的老人数据
  data: {
    type: Object,
    default: () => {
      return {}
    }
  }
})

// ------定义变量------
const bedVoData = ref({}) // 床位信息
const elderVoData = ref({}) // 老人信息
const memberVoData = ref({}) //
const nursingProjectVo = ref({}) // 护理项目
// 监听props变化
watch(() => props.data, (val) => {
  if (val && val.bedVo) {
    bedVoData.value = val.bedVo
  }
  if (val && val.elderVo) {
    elderVoData.value = val.elderVo
  }
  if (val && val.memberVo) {
    memberVoData.value = val.memberVo
  }
  if (val && val.nursingProjectVo) {
    nursingProjectVo.value = val.nursingProjectVo
  }
}, { immediate: true, deep: true })
onMounted(() => {
  if (props.data && props.data.bedVo) {
    bedVoData.value = props.data.bedVo
  }
  if (props.data && props.data.elderVo) {
    elderVoData.value = props.data.elderVo
  }
  if (props.data && props.data.memberVo) {
    memberVoData.value = props.data.memberVo
  }
  if (props.data && props.data.nursingProjectVo) {
    nursingProjectVo.value = props.data.nursingProjectVo
  }
})
</script>
