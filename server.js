const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;
let latestResult = {
  id: "binhtool90",
  id_phien: 0,
  ket_qua: "Chưa có kết quả"
};

// Lưu lịch sử kết quả T/X tối đa 20 lần
let patternHistory = "";

// Cập nhật patternHistory
function updatePatternHistory(result) {
  if (patternHistory.length >= 20) {
    patternHistory = patternHistory.slice(1);
  }
  patternHistory += result;
}

// Dự đoán pattern theo kiểu txtxtx đơn giản
function predictNextFromPattern(history) {
  if (history.length < 6) return "Chưa đủ dữ liệu dự đoán";

  // Dự đoán ngược lại ký tự cuối cùng (nếu 't' thì 'x', ngược lại cũng vậy)
  const lastChar = history[history.length - 1];
  const predicted = lastChar === 't' ? 'x' : 't';
  return predicted === 't' ? "Tài" : "Xỉu";
}

const WS_URL = "wss://websocket.atpman.net/websocket";
const HEADERS = {
  "Host": "websocket.atpman.net",
  "Origin": "https://play.789club.sx",
  "User-Agent": "Mozilla/5.0",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "vi-VN,vi;q=0.9",
  "Pragma": "no-cache",
  "Cache-Control": "no-cache"
};

let lastEventId = 19;

const LOGIN_MESSAGE = [
  1, "MiniGame", "snznkdndnd", "ppp111",
  {
    info: "{\"ipAddress\":\"2001:ee0:5763:9bd0:2dc0:33ab:f494:9894\",\"wsToken\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJnZW5kZXIiOjAsImNhblZpZXdTdGF0IjpmYWxzZSwiZGlzcGxheU5hbWUiOiJic2pkamRiZGJkamRuIiwiYm90IjowLCJpc01lcmNoYW50IjpmYWxzZSwidmVyaWZpZWRCYW5rQWNjb3VudCI6ZmFsc2UsInBsYXlFdmVudExvYmJ5IjpmYWxzZSwiY3VzdG9tZXJJZCI6NjEzMzYwODEsImFmZklkIjoiNzg5IiwiYmFubmVkIjpmYWxzZSwiYnJhbmQiOiI3ODkuY2x1YiIsInRpbWVzdGFtcCI6MTc1NTE0MjUyNzE1MSwibG9ja0dhbWVzIjpbXSwiYW1vdW50IjowLCJsb2NrQ2hhdCI6ZmFsc2UsInBob25lVmVyaWZpZWQiOmZhbHNlLCJpcEFkZHJlc3MiOiIyMDAxOmVlMDo1NzYzOjliZDA6MmRjMDozM2FiOmY0OTQ6OTg5NCIsIm11dGUiOmZhbHNlLCJhdmF0YXIiOiJodHRwczovL2FwaS54ZXVpLmlvL2ltYWdlcy9hdmF0YXIvYXZhdGFyXzEzLnBuZyIsInBsYXRmb3JtSWQiOjUsInVzZXJJZCI6IjJkN2Q2MzkwLWNjOWItNDZmNS04OGFhLTg2NmNhNTZjMTJjMiIsInJlZ1RpbWUiOjE3NTUxNDIyNDM3MDksInBob25lIjoiIiwiZGVwb3NpdCI6ZmFsc2UsInVzZXJuYW1lIjoiUzhfc256bmtkbmRuZCJ9.HHFvfzMNoRH2k0K8ACq76nwMrWBsBuYYQdLOehuPt6k\",\"locale\":\"vi\",\"userId\":\"2d7d6390-cc9b-46f5-88aa-866ca56c12c2\",\"username\":\"S8_snznkdndnd\",\"timestamp\":1755142527152,\"refreshToken\":\"b33c3c9c4dab44329718fb515c7e8ad6.e15dcdd93e874ea993800982356bc2b6\"}",
    signature: "5B71C2E0AC332C7BE9037D9D3D45A5D76E81419FA00FDFDD13EE46BD769FF34A90364595C60C843103C8009007412C741E4E9215517AD3130C7D1C7D0C6827D0C40994B1BDBCAC3DB1D95A7F7C33EA65BC0A80DBABE96C9E66BDC28EAAEF8B78956F70E7728C67F680261609EEB02203569348BC48EFD2B5CAEDA6703A3FE663"
  }
];

const SUBSCRIBE_TX_RESULT = [6, "MiniGame", "taixiuUnbalancedPlugin", { cmd: 2000 }];
const SUBSCRIBE_LOBBY = [6, "MiniGame", "lobbyPlugin", { cmd: 10001 }];

function connectWebSocket() {
  const ws = new WebSocket(WS_URL, { headers: HEADERS });

  ws.on('open', () => {
    console.log("✅ Đã kết nối WebSocket");

    ws.send(JSON.stringify(LOGIN_MESSAGE));
    setTimeout(() => {
      ws.send(JSON.stringify(SUBSCRIBE_TX_RESULT));
      ws.send(JSON.stringify(SUBSCRIBE_LOBBY));
    }, 1000);

    setInterval(() => ws.send("2"), 10000);
    setInterval(() => ws.send(JSON.stringify(SUBSCRIBE_TX_RESULT)), 30000);
    setInterval(() => ws.send(JSON.stringify([7, "Simms", lastEventId, 0, { id: 0 }])), 15000);
  });

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      if (Array.isArray(data)) {
        if (data[0] === 7 && data[1] === "Simms" && Number.isInteger(data[2])) {
          lastEventId = data[2];
        }

        if (data[1]?.cmd === 2006) {
          const { sid, d1, d2, d3 } = data[1];
          const tong = d1 + d2 + d3;
          const ketqua = tong >= 11 ? "Tài" : "Xỉu";

          latestResult = {
            id: "binhtool90",
            id_phien: sid,
            ket_qua: `${d1}-${d2}-${d3} = ${tong} (${ketqua})`
          };

          // Cập nhật patternHistory
          const resultTX = ketqua === "Tài" ? 't' : 'x';
          updatePatternHistory(resultTX);

          console.log(latestResult);
          console.log("🔮 Dự đoán pattern tiếp theo:", predictNextFromPattern(patternHistory));
        }
      }
    } catch (err) {
      console.error("❌ Lỗi message:", err.message);
    }
  });

  ws.on('close', () => {
    console.log("🔌 WebSocket đóng. Kết nối lại sau 5s...");
    setTimeout(connectWebSocket, 5000);
  });

  ws.on('error', (err) => {
    console.error("❌ Lỗi WebSocket:", err.message);
  });
}

// HTTP server trả JSON kèm dự đoán
const server = http.createServer((req, res) => {
  if (req.url === "/taixiu") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      latestResult,
      patternHistory,
      duDoanPattern: predictNextFromPattern(patternHistory)
    }));
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Không tìm thấy");
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Server đang chạy tại http://localhost:${PORT}`);
  connectWebSocket();
});
