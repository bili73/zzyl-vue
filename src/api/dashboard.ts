import { request } from '@/utils/request';

/**
 * 工作台统计相关API
 */

/**
 * 获取数据概览统计
 */
export function getDashboardOverview() {
  return request.get({
    url: '/dashboard/overview'
  });
}

/**
 * 获取收益趋势数据
 * @param {Object} params - 查询参数
 * @param {string} params.type - 类型：today-今日，week-本周，month-本月
 * @param {string} [params.startDate] - 开始日期（YYYY-MM-DD）
 * @param {string} [params.endDate] - 结束日期（YYYY-MM-DD）
 */
export function getIncomeTrend(params: {
  type: string;
  startDate?: string;
  endDate?: string;
}) {
  return request.get({
    url: '/dashboard/income/trend',
    params
  });
}

/**
 * 获取入退情况趋势数据
 * @param {Object} params - 查询参数
 * @param {string} params.type - 类型：today-今日，week-本周，month-本月
 * @param {string} [params.startDate] - 开始日期（YYYY-MM-DD）
 * @param {string} [params.endDate] - 结束日期（YYYY-MM-DD）
 */
export function getCheckInOutTrend(params: {
  type: string;
  startDate?: string;
  endDate?: string;
}) {
  return request.get({
    url: '/dashboard/checkin-out/trend',
    params
  });
}

/**
 * 获取服务情况趋势数据
 * @param {Object} params - 查询参数
 * @param {string} params.type - 类型：today-今日，week-本周，month-本月
 * @param {string} [params.startDate] - 开始日期（YYYY-MM-DD）
 * @param {string} [params.endDate] - 结束日期（YYYY-MM-DD）
 */
export function getServiceTrend(params: {
  type: string;
  startDate?: string;
  endDate?: string;
}) {
  return request.get({
    url: '/dashboard/service/trend',
    params
  });
}

/**
 * 获取老人分布数据（等级分布+年龄分布）
 */
export function getElderDistribution() {
  return request.get({
    url: '/dashboard/elder/distribution'
  });
}

/**
 * 获取预约总览数据
 * @param {string} date - 日期（YYYY-MM-DD）
 */
export function getReservationList(date: string) {
  return request.get({
    url: '/dashboard/reservation',
    params: { date }
  });
}
