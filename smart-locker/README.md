# 智能储物柜系统

这是一个基于MQTT的智能储物柜系统Web界面，可通过浏览器操作储物柜。

## 功能特性

- 连接MQTT服务器进行实时通信
- 生成取件码存储物品
- 输入取件码取回物品
- 自动重连机制确保连接稳定

## 部署说明

1. 将本项目上传到GitHub仓库
2. 在Netlify中连接该仓库并部署
3. 无需额外构建步骤

## 配置说明

修改`index.html`中的`CONFIG`对象可以配置：
- `lockerId`: 储物柜ID
- `servers`: MQTT服务器列表
- `reconnectDelay`: 重连延迟时间(毫秒)

## 技术栈

- HTML5/CSS3
- JavaScript
- Paho MQTT客户端