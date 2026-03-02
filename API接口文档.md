# 智慧养老系统 - API接口文档

## 📋 文档说明

**项目名称：** 智慧养老管理系统
**版本：** v1.0.1
**更新日期：** 2026-03-02
**作者：** 开发团队
**基础路径：** `http://localhost:9995`

---

## 🔐 认证说明

### Token认证
系统使用JWT Token进行认证，除白名单接口外，所有接口都需要在请求头中携带Token。

**请求头格式：**
```http
Authorization: {token}
```

**白名单接口（无需认证）：**
- `/security/login` - 登录
- `/security/logout` - 登出
- `/doc.html` - API文档
- `/swagger-resources/**` - Swagger资源

---

## 📌 通用响应格式

### 成功响应
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

### 失败响应
```json
{
  "code": 500,
  "msg": "错误信息",
  "data": null
}
```

### 分页响应
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "records": [],
    "total": 100,
    "size": 10,
    "current": 1,
    "pages": 10
  }
}
```

---

## 1️⃣ 认证管理模块

### 1.1 用户登录

**接口地址：** `POST /security/login`
**接口描述：** 用户登录认证，返回JWT Token
**是否鉴权：** 否

**请求参数：**
```json
{
  "username": "admin@qq.com",
  "password": "888itcast.CN764%..."
}
```

**响应示例：**
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "userToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 获取当前用户信息

**接口地址：** `GET /user/current-user`
**接口描述：** 获取当前登录用户的完整信息
**是否鉴权：** 是

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "id": 1,
    "username": "admin",
    "realName": "管理员",
    "avatar": "http://...",
    "email": "admin@qq.com",
    "mobile": "13800138000",
    "deptId": 1,
    "deptName": "总部",
    "postId": 1,
    "postName": "系统管理员",
    "roles": ["admin"],
    "permissions": ["*:*:*"]
  }
}
```

### 1.3 用户登出

**接口地址：** `POST /security/logout`
**接口描述：** 用户登出，清除Token
**是否鉴权：** 是

**响应示例：**
```json
{
  "code": 200,
  "msg": "登出成功"
}
```

---

## 2️⃣ 入住管理模块

### 2.1 申请入住

**接口地址：** `POST /check-in/apply`
**接口描述：** 提交入住申请（一站式提交）
**是否鉴权：** 是

**请求参数：**
```json
{
  "elderName": "张三",
  "idCardNo": "110101199001011234",
  "birthday": "1990-01-01",
  "sex": "男",
  "phone": "13800138000",
  "address": "北京市朝阳区xxx",
  "medicalHistory": "高血压、糖尿病",
  "familyContacts": [
    {
      "name": "李四",
      "phone": "13900139000",
      "relation": "子女"
    }
  ],
  "bedId": 1,
  "nursingLevelId": 1,
  "contractStartTime": "2024-01-01",
  "contractEndTime": "2025-01-01"
}
```

**响应示例：**
```json
{
  "code": 200,
  "msg": "申请成功",
  "data": 1
}
```

### 2.2 分页查询入住列表

**接口地址：** `GET /check-in/page`
**接口描述：** 分页查询入住申请列表
**是否鉴权：** 是

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pageNum | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页大小，默认10 |
| elderName | String | 否 | 老人姓名 |
| idCardNo | String | 否 | 身份证号 |
| status | Integer | 否 | 状态：0-待审核，1-已通过，2-已拒绝 |

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "records": [
      {
        "id": 1,
        "elderName": "张三",
        "idCardNo": "110101199001011234",
        "phone": "13800138000",
        "status": 0,
        "createTime": "2024-01-01 12:00:00"
      }
    ],
    "total": 100,
    "size": 10,
    "current": 1,
    "pages": 10
  }
}
```

### 2.3 查询入住详情

**接口地址：** `GET /check-in/detail/{id}`
**接口描述：** 根据ID查询入住完整详情（包含老人、配置、合同、家属信息）
**是否鉴权：** 是

**路径参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 入住记录ID |

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "id": 1,
    "elderName": "张三",
    "idCardNo": "110101199001011234",
    "phone": "13800138000",
    "bedId": 1,
    "bedNumber": "A101",
    "nursingLevelId": 1,
    "nursingLevelName": "一级护理",
    "contractInfo": {
      "contractNo": "HT2024001",
      "startTime": "2024-01-01",
      "endTime": "2025-01-01"
    },
    "familyContacts": [
      {
        "name": "李四",
        "phone": "13900139000",
        "relation": "子女"
      }
    ]
  }
}
```

### 2.4 查询所有入住列表

**接口地址：** `GET /check-in/list`
**接口描述：** 查询所有入住信息列表
**是否鉴权：** 是

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": 1,
      "elderName": "张三",
      "idCardNo": "110101199001011234",
      "phone": "13800138000",
      "status": 1
    }
  ]
}
```

---

## 3️⃣ 护理管理模块

### 3.1 护理项目管理

#### 3.1.1 分页查询护理项目

**接口地址：** `GET /nursing-project/page`
**接口描述：** 分页查询护理项目列表
**是否鉴权：** 是

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pageNum | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页大小，默认10 |
| name | String | 否 | 项目名称 |
| status | Integer | 否 | 状态：0-禁用，1-启用 |

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "records": [
      {
        "id": 1,
        "name": "日常护理",
        "price": 100.00,
        "orderNo": 1,
        "status": 1,
        "createTime": "2024-01-01 12:00:00"
      }
    ],
    "total": 50,
    "size": 10,
    "current": 1,
    "pages": 5
  }
}
```

#### 3.1.2 新增护理项目

**接口地址：** `POST /nursing-project`
**接口描述：** 新增护理项目
**是否鉴权：** 是

**请求参数：**
```json
{
  "name": "日常护理",
  "price": 100.00,
  "orderNo": 1,
  "status": 1,
  "remark": "包含日常生活照料"
}
```

**响应示例：**
```json
{
  "code": 200,
  "msg": "新增成功",
  "data": 1
}
```

#### 3.1.3 修改护理项目

**接口地址：** `PUT /nursing-project`
**接口描述：** 修改护理项目
**是否鉴权：** 是

**请求参数：**
```json
{
  "id": 1,
  "name": "日常护理",
  "price": 120.00,
  "orderNo": 1,
  "status": 1,
  "remark": "包含日常生活照料"
}
```

**响应示例：**
```json
{
  "code": 200,
  "msg": "修改成功"
}
```

#### 3.1.4 删除护理项目

**接口地址：** `DELETE /nursing-project/{id}`
**接口描述：** 根据ID删除护理项目
**是否鉴权：** 是

**路径参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 项目ID |

**响应示例：**
```json
{
  "code": 200,
  "msg": "删除成功"
}
```

### 3.2 护理等级管理

#### 3.2.1 分页查询护理等级

**接口地址：** `GET /nursingLevel/listByPage`
**接口描述：** 分页查询护理等级列表
**是否鉴权：** 是

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pageNum | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页大小，默认10 |
| name | String | 否 | 等级名称 |
| status | Integer | 否 | 状态：0-禁用，1-启用 |

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "records": [
      {
        "id": 1,
        "name": "一级护理",
        "fee": 3000.00,
        "lplanId": 1,
        "planName": "基础护理计划",
        "status": 1,
        "createTime": "2024-01-01 12:00:00"
      }
    ],
    "total": 20,
    "size": 10,
    "current": 1,
    "pages": 2
  }
}
```

### 3.3 护理计划管理

#### 3.3.1 查询护理计划列表

**接口地址：** `GET /nursing/plan/search`
**接口描述：** 查询护理计划列表
**是否鉴权：** 是

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pageNum | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页大小，默认10 |
| planName | String | 否 | 计划名称 |
| status | Integer | 否 | 状态：0-禁用，1-启用 |

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "records": [
      {
        "id": 1,
        "planName": "基础护理计划",
        "sortNo": 1,
        "status": 1,
        "createTime": "2024-01-01 12:00:00",
        "nursingProjectIds": [1, 2, 3]
      }
    ],
    "total": 15,
    "size": 10,
    "current": 1,
    "pages": 2
  }
}
```

---

## 4️⃣ 订单管理模块

### 4.1 分页查询订单

**接口地址：** `GET /orders/page`
**接口描述：** 分页查询订单列表
**是否鉴权：** 是

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pageNum | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页大小，默认10 |
| orderNo | String | 否 | 订单编号 |
| status | Integer | 否 | 状态：0-待支付，1-待服务，2-已完成，3-已取消 |
| elderName | String | 否 | 老人姓名 |

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "records": [
      {
        "id": 1,
        "orderNo": "DD202401010001",
        "elderName": "张三",
        "projectName": "日常护理",
        "amount": 100.00,
        "status": 0,
        "createTime": "2024-01-01 12:00:00"
      }
    ],
    "total": 80,
    "size": 10,
    "current": 1,
    "pages": 8
  }
}
```

### 4.2 查询订单详情

**接口地址：** `GET /orders/{id}`
**接口描述：** 根据ID查询订单详情
**是否鉴权：** 是

**路径参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 订单ID |

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "id": 1,
    "orderNo": "DD202401010001",
    "elderName": "张三",
    "elderId": 1,
    "projectId": 1,
    "projectName": "日常护理",
    "amount": 100.00,
    "status": 0,
    "expectedTime": "2024-01-02 10:00:00",
    "familyContact": "李四",
    "familyPhone": "13900139000",
    "remark": "请准时服务",
    "createTime": "2024-01-01 12:00:00"
  }
}
```

---

## 5️⃣ 账单管理模块

### 5.1 分页查询账单

**接口地址：** `GET /bills/page`
**接口描述：** 分页查询账单列表
**是否鉴权：** 是

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pageNum | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页大小，默认10 |
| elderName | String | 否 | 老人姓名 |
| billMonth | String | 否 | 账单月份（格式：2024-01） |
| status | Integer | 否 | 状态：0-未支付，1-已支付 |

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "records": [
      {
        "id": 1,
        "billNo": "ZD202401010001",
        "elderName": "张三",
        "elderId": 1,
        "billMonth": "2024-01",
        "totalAmount": 5000.00,
        "paidAmount": 0.00,
        "status": 0,
        "createTime": "2024-01-01 12:00:00"
      }
    ],
    "total": 60,
    "size": 10,
    "current": 1,
    "pages": 6
  }
}
```

---

## 6️⃣ 合同管理模块

### 6.1 分页查询合同

**接口地址：** `GET /contracts/page`
**接口描述：** 分页查询合同列表
**是否鉴权：** 是

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pageNum | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页大小，默认10 |
| contractNo | String | 否 | 合同编号 |
| elderName | String | 否 | 老人姓名 |
| status | Integer | 否 | 状态：0-待签署，1-生效中，2-已到期 |

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "records": [
      {
        "id": 1,
        "contractNo": "HT2024001",
        "elderName": "张三",
        "elderId": 1,
        "startTime": "2024-01-01",
        "endTime": "2025-01-01",
        "status": 1,
        "createTime": "2024-01-01 12:00:00"
      }
    ],
    "total": 40,
    "size": 10,
    "current": 1,
    "pages": 4
  }
}
```

---

## 7️⃣ 设备管理模块（智能监测）

### 7.1 分页查询设备

**接口地址：** `GET /devices/page`
**接口描述：** 分页查询设备列表
**是否鉴权：** 是

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pageNum | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页大小，默认10 |
| deviceName | String | 否 | 设备名称 |
| deviceType | String | 否 | 设备类型 |
| status | Integer | 否 | 状态：0-离线，1-在线 |

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "records": [
      {
        "id": 1,
        "deviceName": "智能床位001",
        "deviceType": "智能床位",
        "deviceId": "BED001",
        "status": 1,
        "location": "A栋101室",
        "createTime": "2024-01-01 12:00:00"
      }
    ],
    "total": 30,
    "size": 10,
    "current": 1,
    "pages": 3
  }
}
```

### 7.2 查询报警数据

**接口地址：** `GET /alert-data/page`
**接口描述：** 分页查询报警数据
**是否鉴权：** 是

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pageNum | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页大小，默认10 |
| alertType | String | 否 | 报警类型 |
| status | Integer | 否 | 状态：0-未处理，1-已处理 |

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "records": [
      {
        "id": 1,
        "alertType": "离床报警",
        "alertTime": "2024-01-01 12:00:00",
        "deviceName": "智能床位001",
        "elderName": "张三",
        "status": 0,
        "handleTime": null,
        "handleUser": null
      }
    ],
    "total": 25,
    "size": 10,
    "current": 1,
    "pages": 3
  }
}
```

---

## 8️⃣ 权限管理模块

### 8.1 用户管理

#### 8.1.1 分页查询用户

**接口地址：** `GET /users/page`
**接口描述：** 分页查询用户列表
**是否鉴权：** 是

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pageNum | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页大小，默认10 |
| username | String | 否 | 用户名 |
| realName | String | 否 | 真实姓名 |
| mobile | String | 否 | 手机号 |

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "records": [
      {
        "id": 1,
        "username": "admin",
        "realName": "管理员",
        "email": "admin@qq.com",
        "mobile": "13800138000",
        "status": 1,
        "createTime": "2024-01-01 12:00:00"
      }
    ],
    "total": 50,
    "size": 10,
    "current": 1,
    "pages": 5
  }
}
```

### 8.2 角色管理

#### 8.2.1 查询所有角色

**接口地址：** `GET /roles/list`
**接口描述：** 查询所有角色列表
**是否鉴权：** 是

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": 1,
      "roleName": "超级管理员",
      "roleCode": "admin",
      "status": 1,
      "createTime": "2024-01-01 12:00:00"
    },
    {
      "id": 2,
      "roleName": "护理员",
      "roleCode": "nurse",
      "status": 1,
      "createTime": "2024-01-01 12:00:00"
    }
  ]
}
```

### 8.3 菜单权限

#### 8.3.1 查询用户菜单

**接口地址：** `GET /menus/user-menu`
**接口描述：** 查询当前用户的菜单权限
**是否鉴权：** 是

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": 1,
      "parentId": 0,
      "menuName": "入住管理",
      "path": "/checkIn",
      "icon": "home",
      "orderNum": 1,
      "children": [
        {
          "id": 2,
          "parentId": 1,
          "menuName": "入住办理",
          "path": "/checkIn/handle",
          "icon": "file-add",
          "orderNum": 1
        }
      ]
    }
  ]
}
```

---

## 9️⃣ 工作台统计模块

### 9.1 首页统计数据

**接口地址：** `GET /dashboard/statistics`
**接口描述：** 获取首页统计数据
**是否鉴权：** 是

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "checkInCount": 120,
    "bedCount": 500,
    "availableBedCount": 80,
    "orderCount": 150,
    "billAmount": 500000.00,
    "unpaidBillAmount": 50000.00,
    "alertCount": 10
  }
}
```

---

## 🔟 微信小程序接口（客户端）

### 10.1 用户相关

#### 10.1.1 微信登录

**接口地址：** `POST /customer/user/login`
**接口描述：** 微信小程序用户登录
**是否鉴权：** 否

**请求参数：**
```json
{
  "code": "071abc123def456",
  "phoneCode": "getPhoneNumber"
}
```

**响应示例：**
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "openId": "oXXXX123456789"
  }
}
```

### 10.2 家人管理

#### 10.2.1 查询家人列表

**接口地址：** `GET /customer/elder/list`
**接口描述：** 查询当前用户的家人列表
**是否鉴权：** 是

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": 1,
      "name": "张三",
      "phone": "13800138000",
      "relation": "父亲",
      "avatar": "http://...",
      "status": 1
    }
  ]
}
```

### 10.3 预约管理

#### 10.3.1 创建预约

**接口地址：** `POST /customer/reservation`
**接口描述：** 创建预约参观
**是否鉴权：** 是

**请求参数：**
```json
{
  "elderId": 1,
  "reservationTime": "2024-01-05 10:00:00",
  "contactName": "李四",
  "contactPhone": "13900139000",
  "remark": "希望了解养老服务"
}
```

**响应示例：**
```json
{
  "code": 200,
  "msg": "预约成功",
  "data": 1
}
```

### 10.4 订单管理

#### 10.4.1 查询订单列表

**接口地址：** `GET /customer/orders/list`
**接口描述：** 查询当前用户的订单列表
**是否鉴权：** 是

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": 1,
      "orderNo": "DD202401010001",
      "projectName": "日常护理",
      "amount": 100.00,
      "status": 0,
      "createTime": "2024-01-01 12:00:00"
    }
  ]
}
```

### 10.5 账单管理

#### 10.5.1 查询账单列表

**接口地址：** `GET /customer/bills/list`
**接口描述：** 查询当前用户的账单列表
**是否鉴权：** 是

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": 1,
      "billNo": "ZD202401010001",
      "billMonth": "2024-01",
      "totalAmount": 5000.00,
      "paidAmount": 0.00,
      "status": 0,
      "createTime": "2024-01-01 12:00:00"
    }
  ]
}
```

### 10.6 合同管理

#### 10.6.1 查询合同列表

**接口地址：** `GET /customer/contracts/list`
**接口描述：** 查询当前用户的合同列表
**是否鉴权：** 是

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": 1,
      "contractNo": "HT2024001",
      "elderName": "张三",
      "startTime": "2024-01-01",
      "endTime": "2025-01-01",
      "status": 1,
      "createTime": "2024-01-01 12:00:00"
    }
  ]
}
```

---

## 📌 附录

### A. 状态码说明

#### 订单状态
- `0` - 待支付
- `1` - 待服务
- `2` - 已完成
- `3` - 已取消
- `4` - 退款中
- `5` - 已退款

#### 账单状态
- `0` - 未支付
- `1` - 已支付

#### 合同状态
- `0` - 待签署
- `1` - 生效中
- `2` - 已到期

#### 设备状态
- `0` - 离线
- `1` - 在线

#### 报警状态
- `0` - 未处理
- `1` - 已处理

### B. 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 401 | 未授权，请先登录 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 1001 | 参数错误 |
| 1002 | 数据已存在 |
| 1003 | 数据不存在 |
| 2001 | 用户名或密码错误 |
| 2002 | 账号已被禁用 |
| 2003 | Token已过期 |

### C. 请求频率限制

- 普通接口：100次/分钟
- 登录接口：5次/分钟
- 短信接口：1次/分钟

### D. 数据格式规范

#### 日期时间格式
- 日期：`yyyy-MM-dd`（例如：2024-01-01）
- 时间：`HH:mm:ss`（例如：12:00:00）
- 日期时间：`yyyy-MM-dd HH:mm:ss`（例如：2024-01-01 12:00:00）

#### 金额格式
- 所有金额单位为：元（人民币）
- 保留2位小数

#### 手机号格式
- 11位中国大陆手机号

#### 身份证号格式
- 18位中国居民身份证号

---

## 📞 技术支持

**接口文档地址：** http://localhost:9995/doc.html
**开发团队：** 智慧养老开发团队
**更新日期：** 2026-03-02
**文档版本：** v1.0.1
