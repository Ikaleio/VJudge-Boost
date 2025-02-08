const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const app = express()

// 这里从环境变量读取配置，方便命令行启动
// HOST 指目标地址
// PORT 服务端口
const { HOST = 'https://www.luogu.com/' } = process.env

// 反向代理（这里把需要进行反代的路径配置到这里即可）
// eg:将/api 代理到 ${HOST}/api
// app.use(createProxyMiddleware('/api', { target: HOST }));
// 自定义代理规则
app.use(createProxyMiddleware('/**', {
    target: HOST, // target host
    changeOrigin: true, // needed for virtual hosted sites
    ws: true, // proxy websockets
    headers: {
        "host": "lg.ikale.io"
    },
    onProxyReq(proxyReq, req, res) {
        // 将本地请求的头信息复制一遍给代理。
        // 包含cookie信息，这样就能用登录后的cookie请求相关资源
        Object.keys(req.headers).forEach(function (key) {
            proxyReq.setHeader(key, req.headers[key])
        })
        // 代理的host 设置成被代理服务的，解决跨域访问
        proxyReq.setHeader('Host', "lg.ikale.io")
    },
    onProxyRes: function (proxyRes, req, res) {
        var cookies = proxyRes.headers['set-cookie'];
        var cookieRegex = /.vjudge.net/g;
        //修改cookie Path
        if (cookies) {
            var newCookie = cookies.map(function (cookie) {
                if (cookieRegex.test(cookie)) {
                    return cookie.replace(cookieRegex, '.lg.ikale.io');
                }
                return cookie;
            });
            delete proxyRes.headers['set-cookie'];
            proxyRes.headers['set-cookie'] = newCookie;
        }
    }
}))

module.exports = app