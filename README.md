# 监听路由器设备状态并发送通知(iOS)
- 路由器型号： 华为路由器TC7102
- 通知方式： [Bark](https://bark.day.app/#/)

# Copy a `.env` from `.env.example`
- `LOCAL_HOST`: 路由器管理页面访问IP，使用`http://`开头, 例如`http://192.168.1.1`
- `NOTIFICATION_URI`: 通知请求API接口(Bark)(不要以`/`结尾)
- `PASSWORD`: 路由器管理页面登录密码
