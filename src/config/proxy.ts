export default {
  isRequestProxy: true,
  mock: {
    // mock模式接口请求
    host: 'http://localhost:9995',
    // mock模式 cdn 路径
    cdn: ''
  },
  development: {
    // 开发环境接口请求
    host: 'http://localhost:9995',
    // 开发环境 cdn 路径
    cdn: ''
  },
  test: {
    // 测试环境接口地址
    host: 'http://192.168.200.146:9995',
    // 测试环境 cdn 路径
    cdn: ''
  },
  release: {
    // 正式环境接口地址
    host: 'http://localhost:9995',
    // 正式环境 cdn 路径
    cdn: ''
  },
  pro: {
    // 正式环境接口地址
    host: 'http://localhost:9995',
    // 正式环境 cdn 路径
    cdn: ''
  }
}
