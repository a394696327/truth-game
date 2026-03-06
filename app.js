const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- 核心配置：适配云平台端口 ---
// process.env.PORT 是 Zeabur 动态分配的端口，3000 是本地兜底端口
const PORT = process.env.PORT || 3000; 

// 初始化卡池
let cards = [
    "给通讯录第三个好友发‘我想你了’",
    "模仿一种极地动物，直到有人猜出来",
    "展示你的手机浏览器历史记录",
    "闭眼喝下一杯由三种调料调制的‘特饮’"
];

// 中间件：解析表单数据
app.use(express.urlencoded({ extended: true }));

// 1. 首页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. 管理页路由
app.get('/admin', (req, res) => {
    const cardText = cards.join('\n');
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>卡库编辑器</title>
            <style>
                :root { --primary: #6366f1; --bg: #f8fafc; }
                body { font-family: sans-serif; background: var(--bg); display: flex; justify-content: center; padding: 20px; margin: 0; }
                .admin-card { background: white; width: 100%; max-width: 600px; padding: 25px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                textarea { width: 100%; border: 1px solid #ddd; border-radius: 8px; padding: 10px; font-size: 1rem; min-height: 250px; box-sizing: border-box; }
                .btn-group { margin-top: 15px; display: flex; gap: 10px; }
                button { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; flex: 2; }
                .btn-back { background: #eee; color: #333; text-decoration: none; padding: 10px; border-radius: 6px; flex: 1; text-align: center; }
            </style>
        </head>
        <body>
            <div class="admin-card">
                <h2>🃏 卡库编辑器</h2>
                <form action="/update-cards" method="POST">
                    <textarea name="cardList">${cardText}</textarea>
                    <div class="btn-group">
                        <a href="/" class="btn-back">返回</a>
                        <button type="submit">保存配置</button>
                    </div>
                </form>
            </div>
        </body>
        </html>
    `);
});

// 3. 更新卡库接口
app.post('/update-cards', (req, res) => {
    const rawText = req.body.cardList;
    cards = rawText.split(/\r?\n/).filter(line => line.trim() !== "");
    res.send('<script>alert("保存成功！"); window.location.href="/admin";</script>');
});

// WebSocket 实时通信
io.on('connection', (socket) => {
    socket.on('draw', () => {
        if(cards.length === 0) {
            io.emit('newCard', "请先去后台添加卡片");
        } else {
            const result = cards[Math.floor(Math.random() * cards.length)];
            io.emit('newCard', result);
        }
    });
});

// --- 关键修改：监听地址设为 0.0.0.0 ---
server.listen(PORT, "0.0.0.0", () => {
    console.log(`游戏已在端口 ${PORT} 启动，准备迎接玩家！`);
});
