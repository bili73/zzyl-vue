/**
 * 消息管理API接口
 * @description 提供消息管理的所有接口，包括消息查询、标记已读、删除、语音通知等功能
 * @author System
 * @date 2026-02-28
 */

import { request } from '@/utils/request';

/**
 * 消息类型枚举
 */
export enum MessageType {
  /** 报警通知 */
  ALERT = 0,
  /** 系统通知 */
  SYSTEM = 1,
  /** 业务通知 */
  BUSINESS = 2,
}

/**
 * 消息接口返回类型
 */
export interface Message {
  /** 消息ID */
  id: number;
  /** 消息标题 */
  title: string;
  /** 消息内容 */
  content: string;
  /** 消息类型（0:报警通知 1:系统通知 2:业务通知） */
  type: number;
  /** 用户ID */
  userId: number;
  /** 是否已读（0:未读 1:已读） */
  isRead: number;
  /** 阅读时间 */
  readTime: string | null;
  /** 关联ID */
  relevantId: number | null;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
  /** 创建人 */
  createBy: number | null;
  /** 更新人 */
  updateBy: number | null;
  /** 备注 */
  remark: string | null;
}

/**
 * 分页查询参数
 */
export interface MessagePageParams {
  /** 消息类型 */
  type?: number;
  /** 是否已读 */
  isRead?: number;
  /** 开始时间 */
  startTime?: string;
  /** 结束时间 */
  endTime?: string;
  /** 页码 */
  pageNum?: number;
  /** 每页大小 */
  pageSize?: number;
}

/**
 * 分页响应
 */
export interface MessagePageResponse {
  /** 消息记录列表 */
  records: Message[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页大小 */
  pageSize: number;
  /** 总页数 */
  pages: number;
}

/**
 * 管理端 - 根据读取状态统计消息数量（系统通知和报警通知）
 * @returns 消息统计数据（total: 总数, unread: 未读数, read: 已读数）
 */
export const getMessageCount = () =>
  request.get<Record<string, number>>({
    url: '/message/manager/countByReadStatus',
  });

/**
 * 查询语音通知状态
 * @returns 语音通知状态（0: 关闭, 1: 开启）
 */
export const getVoiceNotifyStatus = () =>
  request.get<number>({
    url: '/message/queryVoiceNotifyStatus',
  });

/**
 * 更新语音通知状态
 * @param status 语音通知状态（0: 关闭, 1: 开启）
 * @returns 操作结果
 */
export const updateVoiceNotifyStatus = (status: number) =>
  request.put<void>({
    url: `/message/updateVoiceNotifyStatus/${status}`,
  });

/**
 * 管理端 - 分页查询消息列表（系统通知和报警通知）
 * @param params 查询参数
 * @returns 分页消息列表
 */
export const getMessagePage = (params: MessagePageParams) =>
  request.get<MessagePageResponse>({
    url: '/message/manager/page',
    params,
  });

/**
 * 根据ID查询消息详情
 * @param id 消息ID
 * @returns 消息详情
 */
export const getMessageById = (id: number) =>
  request.get<Message>({
    url: `/message/${id}`,
  });

/**
 * 标记消息为已读
 * @param id 消息ID
 * @returns 操作结果
 */
export const markMessageAsRead = (id: number) =>
  request.put<void>({
    url: `/message/read/${id}`,
  });

/**
 * 批量标记消息为已读
 * @param ids 消息ID列表
 * @returns 操作结果
 */
export const markBatchAsRead = (ids: number[]) =>
  request.put<void>({
    url: '/message/read/batch',
    data: ids,
  });

/**
 * 删除消息
 * @param id 消息ID
 * @returns 操作结果
 */
export const deleteMessage = (id: number) =>
  request.delete<void>({
    url: `/message/${id}`,
  });

/**
 * 批量删除消息
 * @param ids 消息ID列表
 * @returns 操作结果
 */
export const deleteBatchMessage = (ids: number[]) =>
  request.delete<void>({
    url: '/message/batch',
    data: ids,
  });
