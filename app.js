const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 初始化卡池
let cards = [
    "给通讯录第三个好友发‘我想你了’",
    "模仿一种极地动物，直到有人猜出来",
    "大喊三声‘我是猪’",
    "展示你的手机浏览器历史记录",
    "闭眼喝下一杯由三种调料调制的‘特饮’"
];

// 中间件：解析表单数据
app.use(express.urlencoded({ extended: true }));

// 1. 首页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. 管理页路由（包含美化后的 CSS）
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
                body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); display: flex; justify-content: center; padding: 40px 20px; margin: 0; }
                .admin-card { 
                    background: white; width: 100%; max-width: 600px; padding: 32px; 
                    border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                }
                h2 { color: #1e293b; margin-top: 0; display: flex; align-items: center; gap: 10px; }
                p { color: #64748b; font-size: 0.95rem; }
                textarea { 
                    width: 100%; border: 2px solid #e2e8f0; border-radius: 12px; padding: 15px;
                    font-size: 1rem; line-height: 1.6; color: #334155; resize: vertical;
                    box-sizing: border-box; transition: border-color 0.2s; min-height: 300px;
                }
                textarea:focus { outline: none; border-color: var(--primary); }
                .btn-group { margin-top: 24px; display: flex; gap: 12px; }
                button { 
                    background: var(--primary); color: white; border: none; padding: 12px 24px; 
                    border-radius: 8px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;
                    flex: 2;
                }
                .btn-back { 
                    background: #e2e8f0; color: #475569; text-decoration: none; 
                    padding: 12px 24px; border-radius: 8px; font-weight: 600; 
                    text-align: center; flex: 1; font-size: 0.9rem;
                    display: flex; align-items: center; justify-content: center;
                }
                button:hover { opacity: 0.9; }
            </style>
        </head>
        <body>
            <div class="admin-card">
                <h2>🃏 卡库编辑器</h2>
                <p>每一行代表一张卡牌内容。修改后点击保存即刻生效。</p>
                <form action="/update-cards" method="POST">
                    <textarea name="cardList" placeholder="请输入内容，换行区分...">${cardText}</textarea>
                    <div class="btn-group">
                        <a href="/" class="btn-back">返回游戏</a>
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
    res.send('<script>alert("更新成功！"); window.location.href="/admin";</script>');
});

// WebSocket 实时通信
io.on('connection', (socket) => {
    socket.on('draw', () => {
        if(cards.length === 0) {
            io.emit('newCard', "卡库空了，请去后台添加");
        } else {
            const result = cards[Math.floor(Math.random() * cards.length)];
            io.emit('newCard', result);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`游戏已启动！\n玩家访问：http://localhost:${PORT}\n管理卡牌：http://localhost:${PORT}/admin`);
});