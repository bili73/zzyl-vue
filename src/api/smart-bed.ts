import { request } from '@/utils/request';

// 智能床位相关API接口

/**
 * 获取智能床位总览数据
 */
export function getSmartBedOverview() {
  return request({
    url: '/smart-bed/overview',
    method: 'get'
  });
}

/**
 * 分页查询智能床位设备列表
 */
export function pageQuerySmartBed(params: {
  bedNumber?: string;
  status?: number;
  elderlyName?: string;
  roomNumber?: string;
  pageNum: number;
  pageSize: number;
}) {
  return request({
    url: `/smart-bed/page/${params.pageNum}/${params.pageSize}`,
    method: 'get',
    params
  });
}

/**
 * 获取床位实时状态
 */
export function getBedStatus(bedNumber: string) {
  return request({
    url: `/smart-bed/status/${bedNumber}`,
    method: 'get'
  });
}

/**
 * 获取所有床位实时状态列表
 */
export function getAllBedStatus() {
  return request({
    url: '/smart-bed/status/list',
    method: 'get'
  });
}

/**
 * 添加智能床位设备
 */
export function addSmartBedDevice(data: any) {
  return request({
    url: '/smart-bed/device',
    method: 'post',
    data
  });
}

/**
 * 更新智能床位设备
 */
export function updateSmartBedDevice(data: any) {
  return request({
    url: '/smart-bed/device',
    method: 'put',
    data
  });
}

/**
 * 删除智能床位设备
 */
export function deleteSmartBedDevice(id: number) {
  return request({
    url: `/smart-bed/device/${id}`,
    method: 'delete'
  });
}

/**
 * 绑定老人到床位
 */
export function bindElderlyToBed(data: {
  bedNumber: string;
  elderlyId: number;
  elderlyName: string;
}) {
  return request({
    url: '/smart-bed/bind-elderly',
    method: 'put',
    data
  });
}

/**
 * 解除床位老人绑定
 */
export function unbindElderlyFromBed(bedNumber: string) {
  return request({
    url: `/smart-bed/unbind-elderly/${bedNumber}`,
    method: 'put'
  });
}

/**
 * 获取床位历史数据
 */
export function getBedHistory(params: {
  bedNumber: string;
  startTime: string;
  endTime: string;
}) {
  return request({
    url: `/smart-bed/history/${params.bedNumber}`,
    method: 'get',
    params: {
      startTime: params.startTime,
      endTime: params.endTime
    }
  });
}

/**
 * 获取报警记录
 */
export function getSmartBedAlarms(params: {
  bedNumber?: string;
  alarmType?: string;
  alarmStatus?: string;
  pageNum: number;
  pageSize: number;
}) {
  return request({
    url: `/smart-bed/alarms`,
    method: 'get',
    params
  });
}

/**
 * 处理报警
 */
export function handleSmartBedAlarm(data: {
  alarmId: number;
  handleRemark?: string;
}) {
  return request({
    url: '/smart-bed/alarm/handle',
    method: 'put',
    data
  });
}

/**
 * 获取睡眠质量统计
 */
export function getSleepStats(params: {
  bedNumber: string;
  startDate?: string;
  endDate?: string;
}) {
  return request({
    url: `/smart-bed/sleep-stats/${params.bedNumber}`,
    method: 'get',
    params
  });
}

/**
 * 模拟设备数据上报
 */
export function simulateSmartBedData(data: any) {
  return request({
    url: '/smart-bed/simulate-data',
    method: 'post',
    data
  });
}