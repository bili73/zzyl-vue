export const COLUMNS = [
  {
    title: '序号',
    align: 'left',
    width: 80,
    minWidth: 80,
    colKey: 'rowIndex'
  },
  {
    title: '老人姓名',
    minWidth: 180,
    colKey: 'elderVo.name'
  },
  {
    title: '床位号',
    minWidth: 200,
    colKey: 'bedVo.bedNumber'
  },
  {
    title: '欠款金额（元）',
    minWidth: 180,
    colKey: 'total'
  },
  {
    title: '支付截止时间',
    minWidth: 300,
    colKey: 'paymentDeadline'
  },
  {
    align: 'left',
    fixed: 'right',
    width: 65,
    minWidth: '65px',
    colKey: 'op',
    title: '操作'
  }
]
export const COLUMNS2 = [
  {
    title: '序号',
    align: 'left',
    width: 80,
    minWidth: 80,
    colKey: 'rowIndex'
  },
  {
    title: '账单编号',
    minWidth: 180,
    colKey: 'billNo'
  },
  {
    title: '账单月份',
    width: 120,
    colKey: 'billMonth'
  },
  {
    title: '账单金额（元）',
    width: 120,
    colKey: 'billAmount'
  },
  {
    title: '应付金额（元）',
    width: 120,
    colKey: 'payableAmount'
  },
  {
    title: '护理等级',
    width: 120,
    colKey: 'lname'
  },
  {
    title: '房间类型',
    width: 100,
    colKey: 'typeName'
  },
  {
    title: '账单状态',
    width: 100,
    colKey: 'transactionStatus'
  },
  {
    title: '支付截止时间',
    width: 160,
    colKey: 'paymentDeadline'
  }
]
