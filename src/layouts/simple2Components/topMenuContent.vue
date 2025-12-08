<!-- 简版布局 -->
<template>
  <div class="menuBox">
    <template v-for="item in list" :key="item.path">
      <!--  只有当路由不是第一级，且有子路由数量大于1，且不是最后一级 -->
      <template
        v-if="
          left
            ? !item.children.length
            : !(
                item.children.length > 0 &&
                item.children[0].children &&
                !item.redirect
              )
        "
      >
        <!-- 如果是外链 -->
        <t-menu-item
          v-if="getHref(item)"
          :name="item.path"
          :value="getPath(item)"
          @click="openHref(getHref(item)[0])"
        >
          <template #icon>
            <t-icon v-if="beIcon(item)" :name="item.icon" />
            <component
              :is="beRender(item).render"
              v-else-if="beRender(item).can"
              class="t-icon"
            />
          </template>
          {{ item.title }}
        </t-menu-item>
        <!-- 非外链 -->
        <t-menu-item
          v-else
          :name="item.path"
          :value="left ? getPathLeft(item) : getPath(item)"
          :to="safeItemPath(item)"
        >
          <!-- {{ getTopPath(item) }} -->
          <!--{{ getPath(item) }}-->
          <!-- {{ getPathLeft(item) }} -->
          {{ item.title }}
          <!-- {{ getPathLeft(item) }} -->
        </t-menu-item>
      </template>
      <t-submenu
        v-else
        :name="item.path"
        :value="getPathLeft(item)"
        :title="`${item.title}`"
      >
        <top-menu-content
          v-if="item.children"
          class="sideNav"
          :nav-data="item.children"
          :left="true"
        />
      </t-submenu>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted } from 'vue'
import type { PropType } from 'vue'
import isObject from 'lodash/isObject'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import type { MenuRoute } from '@/types/interface'
import { getActive } from '@/router'
import { useUserStore, usePermissionStore } from '@/store'

const props = defineProps({
  navData: {
    type: Array as PropType<MenuRoute[]>,
    default: () => []
  },
  // 用于防止子菜单点击出现左侧路由菜单闪烁问题
  isChildRoutes: {
    type: Boolean,
    default: false
  },
  left: {
    type: Boolean,
    default: false
  }
})
const subActive = ref('')
const route = useRoute()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const { isDynamic } = storeToRefs(permissionStore) // 静态路由
// 监听路由变化
watch(
  () => route.path,
  (newValue) => {
    subActive.value = newValue
    getRoutButton(newValue)
  }
)
onMounted(() => {
  getRoutButton(route.path)
})
const getRoutButton = (newRoute) => {
  findParent(userStore.trendsRouteButton, newRoute)
}
// 解决顶部导航无法默认进入一个子菜单的问题
const getTopPath = (item) => {
  if (!item) return '/dashboard/base'

  // 如果是权限数据结构（有id字段）
  if (item.id) {
    return item.path || item.redirect || '/dashboard/base'
  }

  // 原有的路由配置处理逻辑
  if (isDynamic.value) {
    if (item.children[0]?.children?.length) {
      return item.children[0]?.children[0]?.path || '/dashboard/base'
    }
    return item.redirect || '/dashboard/base'
  }
  return item.redirect || '/dashboard/base'
}
// 获取当前路由权限配置的按钮，有两种方法，一种是递归，一种是普通遍历
const findParent = (children, newRoute) => {
  children?.forEach((ele) => {
    const index = newRoute.lastIndexOf('/')
    const lastSegment = newRoute.substring(index + 1)
    if (ele.children !== undefined) {
      if (lastSegment === ele.path) {
        userStore.setRouteNewButton(ele.children)
      }
      findParent(ele.children, newRoute)
    } else {
      userStore.setRouteNewButton([])
    }
  })
}
// 选择
const active = computed(() => getActive())
// 菜单列表
const list = computed(() => {
  const { navData } = props
  return getMenuList(navData)
})
// getMenuList是一个递归函数，用于将路由转换为菜单列表
const getMenuList = (list: MenuRoute[], basePath?: string): MenuRoute[] => {
  if (!list) {
    return []
  }

  // 检查数据结构，如果是权限数据（有id字段）则直接返回
  if (list.length > 0 && list[0].id) {
    return list.filter((item) => item.status === 1).map(item => ({
      ...item,
      title: item.title || item.name || item.menuName, // 兼容不同的字段名
      path: item.path || `/${item.name}` // 确保有路径
    }))
  }

  // 原有的路由配置处理逻辑
  // 如果meta中有orderNo则按照从小到大排序
  list.sort((a, b) => {
    return (a.meta?.orderNo || 0) - (b.meta?.orderNo || 0)
  })
  return list
    .map((item) => {
      const path =
        basePath && !item.path.includes(basePath)
          ? `${basePath}/${item.path}`
          : item.path
      // console.log(item, 'item')
      return {
        // path: props.left ? `${path}` : item.path,
        path: item.path,
        title: item.meta?.title,
        icon: item.meta?.icon || '',
        children: getMenuList(item.children, path),
        meta: item.meta,
        redirect: item.redirect,
        parent: item.parent
      }
    })
    .filter((item) => item.meta && item.meta.hidden !== true)
}

// getHref是一个函数，用于判断是否是外链
const getHref = (item: MenuRoute) => {
  const { frameSrc, frameBlank } = item.meta
  if (frameSrc && frameBlank) {
    return frameSrc.match(/(http|https):\/\/([\w.]+\/?)\S*/)
  }
  return null
}

// getPathLeft是一个函数，用于判断当前路由是否为激活状态
const getPathLeft = (item) => {
  if (
    active.value.includes(item.path) ||
    // 确保二级菜单也可以高亮
    (
      item.children.length &&
      item.children.filter((item) => active.value.includes(item.path))
    ).length
  ) {
    return active.value
  }

  // 单独处理详情页的时候左侧导航栏的高亮情况
  if (
    active.value === '/enterQuit/enterDetails' &&
    item.path === '/enterQuit/enterManage'
  ) {
    return active.value
  }
  if (
    active.value === '/enterQuit/quitDetails' &&
    item.path === '/enterQuit/quitManage'
  ) {
    return active.value
  }
  if (
    active.value === '/liveIn/trackDetails' &&
    item.path === '/liveIn/trackAfter'
  ) {
    return active.value
  }
  if (
    active.value === '/serve/serveDetails' &&
    item.path === '/serve/oldPeople'
  ) {
    return active.value
  }

  if (active.value === '/order/orderDetails' && item.path === '/order/olist') {
    return active.value
  }

  if (
    active.value === '/finance/billDetails' &&
    item.path === '/finance/enterAccount'
  ) {
    return active.value
  }

  if (
    [
      '/active/checkDetails',
      '/active/applyDetails',
      '/active/selectHouse'
    ].includes(active.value) &&
    item.path === '/active/apply'
  ) {
    return active.value
  }

  if (
    active.value === '/intelligence/equiDetails' &&
    item.path === '/intelligence/equipment'
  ) {
    return active.value
  }
  return item.path
}

// getSafePath是一个函数，确保路径安全（不是中文）
const getSafePath = (item) => {
  console.log('=== getSafePath called with item:', item)

  // 如果是权限数据结构（有id字段）
  if (item.id) {
    // 检查路径是否是中文，如果是则使用安全路径
    const path = item.path || item.redirect || '/dashboard/base'
    console.log('权限数据，原始路径:', path)

    // 检查路径本身或redirect是否包含中文
    if (path.includes('工作台') || path.includes('来访管理') || path.includes('入退管理') || path.includes('在住管理') || path.includes('服务管理') || path.includes('订单管理') || path.includes('财务管理') || path.includes('客户管理') || path.includes('权限管理') || path.includes('协同工作') || path.includes('智能监测') || path === '/dashboard') {
      console.log('检测到中文路径，进行映射转换')
      // 根据不同的菜单类型返回对应的英文路径
      if (path.includes('工作台')) {
        console.log('工作台 -> /dashboard/base')
        return '/dashboard/base'
      }
      if (path.includes('来访管理')) {
        console.log('来访管理 -> /appointment/subscribe')
        return '/appointment/subscribe'
      }
      if (path.includes('入退管理')) {
        console.log('入退管理 -> /enterQuit/enterManage')
        return '/enterQuit/enterManage'
      }
      if (path.includes('在住管理')) {
        console.log('在住管理 -> /liveIn/trackAfter')
        return '/liveIn/trackAfter'
      }
      if (path.includes('服务管理')) {
        console.log('服务管理 -> /serve/grade')
        return '/serve/grade'
      }
      if (path.includes('订单管理')) {
        console.log('订单管理 -> /order/olist')
        return '/order/olist'
      }
      if (path.includes('财务管理')) {
        console.log('财务管理 -> /finance/enterAccount')
        return '/finance/enterAccount'
      }
      if (path.includes('客户管理')) {
        console.log('客户管理 -> /client/list')
        return '/client/list'
      }
      if (path.includes('权限管理')) {
        console.log('权限管理 -> /permission/user')
        return '/permission/user'
      }
      if (path.includes('协同工作')) {
        console.log('协同工作 -> /active/backlogAfter')
        return '/active/backlogAfter'
      }
      if (path.includes('智能监测')) {
        console.log('智能监测 -> /intelligence/equipment')
        return '/intelligence/equipment'
      }
      console.log('默认路径 -> /dashboard/base')
      return '/dashboard/base'
    }
    console.log('非中文路径，直接返回:', path)
    return path
  }

  // 原有的路由配置处理逻辑 - 但是也要检查中文路径
  let targetPath
  if (props.left) {
    targetPath = item.path
  } else {
    targetPath = getTopPath(item)
  }

  console.log('路由配置数据，原始路径:', targetPath)

  // 检查是否是中文路径，如果是则进行映射
  if (targetPath && targetPath.includes('工作台')) {
    console.log('检测到中文工作台路径，映射转换')
    return '/dashboard/base'
  }
  if (targetPath && targetPath.includes('来访管理')) {
    console.log('检测到中文来访管理路径，映射转换')
    return '/appointment/subscribe'
  }
  if (targetPath && targetPath.includes('入退管理')) {
    console.log('检测到中文入退管理路径，映射转换')
    return '/enterQuit/enterManage'
  }
  if (targetPath && targetPath.includes('在住管理')) {
    console.log('检测到中文在住管理路径，映射转换')
    return '/liveIn/trackAfter'
  }
  if (targetPath && targetPath.includes('服务管理')) {
    console.log('检测到中文服务管理路径，映射转换')
    return '/serve/grade'
  }
  if (targetPath && targetPath.includes('订单管理')) {
    console.log('检测到中文订单管理路径，映射转换')
    return '/order/olist'
  }
  if (targetPath && targetPath.includes('财务管理')) {
    console.log('检测到中文财务管理路径，映射转换')
    return '/finance/enterAccount'
  }
  if (targetPath && targetPath.includes('客户管理')) {
    console.log('检测到中文客户管理路径，映射转换')
    return '/client/list'
  }
  if (targetPath && targetPath.includes('权限管理')) {
    console.log('检测到中文权限管理路径，映射转换')
    return '/permission/user'
  }
  if (targetPath && targetPath.includes('协同工作')) {
    console.log('检测到中文协同工作路径，映射转换')
    return '/active/backlogAfter'
  }
  if (targetPath && targetPath.includes('智能监测')) {
    console.log('检测到中文智能监测路径，映射转换')
    return '/intelligence/equipment'
  }

  console.log('路由配置数据，最终返回路径:', targetPath)
  return targetPath
}

// 为模板提供的安全路径计算属性
const safeItemPath = (item) => {
  const safePath = getSafePath(item)
  console.log(`>>> safeItemPath for "${item.title}":`, safePath)
  return safePath
}
// const dealDetail = () => {}
// getPath是一个函数，用于判断当前路由是否为激活状态
const getPath = (item) => {
  // 如果是权限数据结构（有id字段），使用路由路径
  if (item.id) {
    return item.path || `/${item.name}`
  }

  // 原有的路由配置处理逻辑
  // 对于single路由（如工作台），使用redirect路径而不是meta.title
  if (item.meta?.single) {
    return item.redirect || '/dashboard/base'
  }
  // 对于其他路由，使用完整路径或构建路径
  return item.meta?.fullPath || (item.path ? `/${item.path}` : '/')
}
// beIcon是一个函数，用于判断是否是内置图标
const beIcon = (item: MenuRoute) => {
  return item.icon && typeof item.icon === 'string'
}

const beRender = (item: MenuRoute) => {
  if (isObject(item.icon) && typeof item.icon.render === 'function') {
    return {
      can: true,
      render: item.icon.render
    }
  }
  return {
    can: false,
    render: null
  }
}
// openHref是一个函数，用于打开外链
const openHref = (url: string) => {
  window.open(url)
}
</script>
<style lang="less" scoped>
.sideNav {
  :deep(.t-submenu) {
    .t-menu__item {
      color: #151515;
    }
  }

  // .t-default-menu .t-menu__item {
  //   padding: 0 18px 0 24px;
  // }
}

:deep(.t-submenu__item) {
  color: #151515;

  .t-icon {
    display: none;
  }

  .t-menu__content {
    margin-left: 3px;
    opacity: 0.56;
  }

  &:hover {
    .t-menu__content {
      opacity: 1;
    }
  }
}

.leftIcon {
  margin-right: 4px;
}
</style>
