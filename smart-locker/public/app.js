// ============== 配置区域 ==============
const CONFIG = {
  lockerId: "001",
  servers: [
    {
      host: "broker.emqx.io",
      port: 8084,
      path: "/mqtt",
      useSSL: true
    },
    {
      host: "test.mosquitto.org",
      port: 8081,
      path: "/mqtt",
      useSSL: true
    }
  ],
  reconnectDelay: 3000
};

// ============== 全局变量 ==============
let mqttClient;
let currentServerIndex = 0;

// ============== UI控制 ==============
function updateStatus(status, message) {
  const el = document.getElementById('connection-status');
  el.className = 'status ' + status;
  el.textContent = message;
}

// ============== MQTT核心 ==============
function initializeApp() {
  if (typeof Paho === 'undefined') {
    document.getElementById('error-panel').style.display = 'block';
    document.getElementById('error-panel').textContent = 
      '系统初始化失败：请刷新页面或检查网络连接';
    return;
  }
  
  connectToServer();
}

function connectToServer() {
  const server = CONFIG.servers[currentServerIndex];
  updateStatus("connecting", `正在连接 ${server.host}...`);
  
  const clientId = `web_${Math.random().toString(16).substr(2, 8)}`;
  mqttClient = new Paho.MQTT.Client(
    server.host,
    server.port,
    server.path,
    clientId
  );

  mqttClient.onConnectionLost = onConnectionLost;
  mqttClient.onMessageArrived = onMessageArrived;

  const connectOptions = {
    timeout: 5,
    keepAliveInterval: 30,
    useSSL: server.useSSL,
    onSuccess: onConnectSuccess,
    onFailure: onConnectFailure,
    mqttVersion: 4
  };

  mqttClient.connect(connectOptions);
}

function tryNextServer() {
  currentServerIndex = (currentServerIndex + 1) % CONFIG.servers.length;
  setTimeout(connectToServer, CONFIG.reconnectDelay);
}

// ============== MQTT回调 ==============
function onConnectSuccess() {
  console.log("MQTT连接成功");
  updateStatus("connected", "已连接");
  
  document.getElementById('store-btn').disabled = false;
  document.getElementById('pickup-code').disabled = false;
  document.getElementById('retrieve-btn').disabled = false;
  
  mqttClient.subscribe(`locker/${CONFIG.lockerId}/status`);
}

function onConnectFailure(error) {
  console.error("连接失败:", error.errorMessage);
  updateStatus("disconnected", `连接失败: ${error.errorMessage}`);
  tryNextServer();
}

function onConnectionLost(response) {
  console.warn("连接断开:", response.errorMessage);
  updateStatus("disconnected", "连接已断开");
  
  document.getElementById('store-btn').disabled = true;
  document.getElementById('pickup-code').disabled = true;
  document.getElementById('retrieve-btn').disabled = true;
  
  setTimeout(connectToServer, CONFIG.reconnectDelay);
}

function onMessageArrived(message) {
  try {
    const data = JSON.parse(message.payloadString);
    if (data.code) {
      document.getElementById('code-display').textContent = 
        `您的取件码: ${data.code}`;
    }
  } catch (err) {
    console.error("消息解析错误:", err);
  }
}

// ============== 业务逻辑 ==============
function storeItem() {
  const btn = document.getElementById('store-btn');
  btn.disabled = true;
  btn.textContent = "处理中...";
  
  const message = new Paho.MQTT.Message(JSON.stringify({
    action: "store",
    lockerId: CONFIG.lockerId,
    time: new Date().toISOString()
  }));
  message.destinationName = `locker/${CONFIG.lockerId}/cmd`;
  
  mqttClient.send(message);
  
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = "打开柜门存物";
  }, 3000);
}

function retrieveItem() {
  const code = document.getElementById('pickup-code').value.trim();
  const btn = document.getElementById('retrieve-btn');
  
  if (!/^\d{6}$/.test(code)) {
    alert("请输入6位数字取件码");
    return;
  }
  
  btn.disabled = true;
  btn.textContent = "验证中...";
  
  const message = new Paho.MQTT.Message(JSON.stringify({
    code: code,
    lockerId: CONFIG.lockerId,
    time: new Date().toISOString()
  }));
  message.destinationName = `locker/${CONFIG.lockerId}/auth`;
  
  mqttClient.send(message);
  
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = "打开柜门取物";
  }, 3000);
}

// ============== 初始化 ==============
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('store-btn').addEventListener('click', storeItem);
  document.getElementById('retrieve-btn').addEventListener('click', retrieveItem);
  
  document.getElementById('pickup-code').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') retrieveItem();
  });
  
  initializeApp();
});