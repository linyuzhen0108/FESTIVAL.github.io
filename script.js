
// 初始化 Firebase 資料庫
let db = null;

try {
    const firebaseConfig = {
        apiKey: "AIzaSyCfpe9SI8KU9IFO_Sqy5rbBEZph_p7fxlA",
        authDomain: "festival-832b2.firebaseapp.com",
        databaseURL: "https://festival-832b2-default-rtdb.firebaseio.com",
        projectId: "festival-832b2",
        storageBucket: "festival-832b2.firebasestorage.app",
        messagingSenderId: "690417444780",
        appId: "1:690417444780:web:86788bb34223109caabc09",
        measurementId: "G-L11EPLT8ZC"
    };

    //  v8 版本的 Firebase
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("🔥 Firebase 資料庫連線成功！");
} catch (error) {
    console.error("Firebase 初始化失敗：", error);
}

// 共用工具函數
const $ = id => document.getElementById(id);
const toastEl = $('toast');

function toast(t) {
    toastEl.textContent = t;
    toastEl.classList.add('show');
    clearTimeout(window.tt);
    window.tt = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

// 玩家全域變數
let playerName = "神秘客";

// 輸入姓名
window.addEventListener('DOMContentLoaded', () => {
    for (let i = 0; i < 70; i++) {
        const s = document.createElement('i');
        s.className = 'star';
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 70 + '%';
        s.style.animationDelay = Math.random() * 3 + 's';
        s.style.opacity = .25 + Math.random() * .75;
        $('stars').appendChild(s);
    }

    setTimeout(() => $('playerNameInput').focus(), 300);
});

// 確認姓名按鈕
$('confirmNameBtn').onclick = () => {
    const inputName = $('playerNameInput').value.trim();
    if (inputName) {
        playerName = inputName;
    }
    $('displayPlayerName').textContent = playerName;
    $('entryModal').classList.remove('show');
    toast(`歡迎，${playerName}！祝您中秋快樂！`);
    launchFireworks();
};

// 賀卡互動特效
$('moon').onclick = () => {
    toast('🌕 月亮送上祝福：願你所盼皆圓滿，所遇皆溫柔。');
    $('moon').style.transform = 'translateX(-50%) scale(1.08)';
    setTimeout(() => $('moon').style.transform = 'translateX(-50%)', 450);
};

document.querySelectorAll('.bunny').forEach(b => {
    b.onclick = () => toast(b.dataset.msg);
});


function fall(sym) {
    const p = document.createElement('div');
    p.className = 'petal';
    p.textContent = sym;
    p.style.left = Math.random() * 100 + 'vw';
    p.style.fontSize = 10 + Math.random() * 12 + 'px';
    p.style.setProperty('--x', (Math.random() * 150 - 75) + 'px');
    p.style.animationDuration = 3 + Math.random() * 4 + 's';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 8000);
}


// 偷吃月餅大賽
let gameScore = 0;
let rabbitState = 0; // 0 = 綠燈(安全), 1 = 黃燈(預警), 2 = 紅燈(危險)
let gameActive = false;
let rabbitTimer;

const gameOverlay = $('gameOverlay');
const gameRabbit = $('gameRabbit');
const gameStatusText = $('gameStatusText');
const scoreDisplay = $('gameScore');
const stealBtn = $('stealBtn');
const countdownDisplay = $('countdownDisplay');

// 點擊開始按鈕
$('startGameBtn').onclick = () => {
    gameOverlay.className = 'game-overlay show';
    scoreDisplay.textContent = "0";

    gameRabbit.src = 'rabbit.png';

    gameStatusText.textContent = '準備中...';
    countdownDisplay.style.display = '';

    stealBtn.disabled = true;
    stealBtn.style.opacity = '0.5';

    startCountdown();
};


// 倒數計時邏輯
function startCountdown() {
    let count = 3;

    const tick = () => {
        if (count > 0) {
            countdownDisplay.textContent = count;
            countdownDisplay.className = 'countdown-text';
            void countdownDisplay.offsetWidth; 
            countdownDisplay.className = 'countdown-text pop';
            count--;
            setTimeout(tick, 1000);
        } else {
            countdownDisplay.innerHTML = '開<br>始';

            countdownDisplay.className = 'countdown-text';
            void countdownDisplay.offsetWidth;
            countdownDisplay.className = 'countdown-text pop';

            setTimeout(() => {
                countdownDisplay.style.display = 'none';
                actualStartGame();
            }, 1000);
        }
    };

    tick(); 
}
// 開始遊戲
function actualStartGame() {
    gameScore = 0;
    scoreDisplay.textContent = gameScore;
    gameActive = true;
    rabbitState = 0;

    // 啟用偷吃按鈕
    stealBtn.disabled = false;
    stealBtn.style.opacity = '1';

    updateRabbitUI();
    scheduleRabbitTurn();
    toast('遊戲開始！趁玉兔沒看時偷吃！');
}
// 兔子的三階段轉頭機制
function scheduleRabbitTurn() {
    if (!gameActive) return;

    if (rabbitState === 0) {
        // 綠燈：隨機 1~3 秒後進入黃燈 (預警)
        const delay = Math.random() * 2000 + 1000;
        rabbitTimer = setTimeout(() => {
            rabbitState = 1;
            updateRabbitUI();
            scheduleRabbitTurn();
        }, delay);
    } else if (rabbitState === 1) {
        // 黃燈：預警狀態，大約 0.5~0.8 秒後立刻轉紅燈
        const warningTime = Math.random() * 300 + 500;
        rabbitTimer = setTimeout(() => {
            rabbitState = 2;
            updateRabbitUI();
            scheduleRabbitTurn();
        }, warningTime);
    } else if (rabbitState === 2) {
        // 紅燈：隨機盯著 1~2.5 秒後轉回綠燈
        const dangerTime = Math.random() * 1500 + 1000;
        rabbitTimer = setTimeout(() => {
            rabbitState = 0;
            updateRabbitUI();
            scheduleRabbitTurn();
        }, dangerTime);
    }
}

// 更新遊戲畫面狀態
function updateRabbitUI() {
    if (rabbitState === 2) {
        // 紅燈：轉正面看人
        gameRabbit.src = 'see.png';
        gameStatusText.textContent = '盯——！(停手)';
        gameOverlay.className = 'game-overlay show danger';
    } else if (rabbitState === 1) {
        // 黃燈：預警
        gameRabbit.src = 'rabbit.png';
        gameStatusText.textContent = '⚠️ 玉兔豎起耳朵... (準備停手)';
        gameOverlay.className = 'game-overlay show warning';
    } else {
        // 綠燈：背對安全
        gameRabbit.src = 'rabbit.png';
        gameStatusText.textContent = '玉兔搗藥中...(快偷吃)';
        gameOverlay.className = 'game-overlay show';
    }
}
// 點擊「偷吃月餅」按鈕
$('stealBtn').onclick = () => {
    if (!gameActive) return;

    if (rabbitState === 2) {
        // 紅燈時點擊 -> 抓到了！遊戲結束
        gameOver();
    } else {
        // 綠燈或黃燈時點擊 -> 成功偷吃 
        gameScore++;
        scoreDisplay.textContent = gameScore;

        gameRabbit.style.transform = 'scale(0.9) translateX(-10px)';
        setTimeout(() => { if (gameActive && rabbitState === 0) gameRabbit.style.transform = 'scale(1)'; }, 100);
    }
};

function gameOver() {
    gameActive = false;
    clearTimeout(rabbitTimer);
    gameOverlay.className = 'game-overlay'; // 關閉遊戲畫面

    saveScoreAndShowLeaderboard();
}

// 排行榜系統與結算 (雲端資料庫)
async function saveScoreAndShowLeaderboard() {
    const replayBtn = $('replayBtn');
    const closeBtn = $('closeLeaderboardBtn');
    replayBtn.disabled = true;
    closeBtn.disabled = true;
    replayBtn.style.opacity = '0.5';
    closeBtn.style.opacity = '0.5';
    $('leaderboardModal').classList.add('show');

    // 介面先顯示讀取中
    const resultMsg = $('gameResultMsg');
    resultMsg.innerHTML = `連線至月球資料庫中... 🌕`;
    $('leaderboardList').innerHTML = '<p style="text-align:center;">資料讀取中...</p>';

    try {
        // 如果分數大於 0，將分數寫入雲端資料庫
        if (gameScore > 0) {
            await db.collection("mooncake_scores").add({
                name: playerName,
                score: gameScore,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        // 從雲端抓取「全球前 10 名」的分數
        const snapshot = await db.collection("mooncake_scores")
            .orderBy("score", "desc") 
            .limit(10) 
            .get();

        let leaderboard = [];
        snapshot.forEach((doc) => {
            leaderboard.push(doc.data());
        });

        // 判斷本次成績的文字顯示
        let currentRankText = "";
        const rankIndex = leaderboard.findIndex(entry => entry.score <= gameScore && entry.name === playerName);

        if (rankIndex !== -1) {
            currentRankText = `🏆 本次全球排名：第 <b>${rankIndex + 1}</b> 名`;
            toast(`擠進全球前 10 名啦！吃了 ${gameScore} 顆！`);
        } else {
            currentRankText = `💪 本次偷吃：<b>${gameScore}</b> 顆 (未擠進全球前 10)`;
            toast(`被抓到了！吃了 ${gameScore} 顆！`);
        }

        resultMsg.innerHTML = `遊戲結束！<br><span style="color: #ffda79; font-size: 15px; display: inline-block; margin-top: 5px;">${currentRankText}</span>`;

        // 渲染雲端排行榜
        renderLeaderboard(leaderboard);

    } catch (error) {
        console.error("資料庫連線錯誤:", error);
        resultMsg.innerHTML = `資料庫連線失敗，請檢查網路 😢`;
    }

    setTimeout(() => {
        replayBtn.disabled = false;
        closeBtn.disabled = false;
        replayBtn.style.opacity = '1';
        closeBtn.style.opacity = '1';
    }, 1500);
}

// 生成排行榜畫面函數 
function renderLeaderboard(data) {
    const list = $('leaderboardList');
    list.innerHTML = '';

    if (data.length === 0) {
        list.innerHTML = '<p style="text-align:center;">目前還沒有人挑戰過喔！</p>';
        return;
    }

    data.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = `rank-item ${index < 3 ? 'rank-' + (index + 1) : ''}`;

        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        else medal = `${index + 1}.`;

        item.innerHTML = `
            <span>${medal} ${entry.name}</span>
            <span>${entry.score} 顆</span>
        `;
        list.appendChild(item);
    });
}


// 排行榜按鈕：再玩一次 / 關閉
$('replayBtn').onclick = () => {
    $('leaderboardModal').classList.remove('show');
    $('startGameBtn').click(); // 直接重新開始遊戲
};

$('closeLeaderboardBtn').onclick = () => {
    $('leaderboardModal').classList.remove('show');
};

// 籤詩資料庫 
const fortunes = [
    { level: "大吉 🌕", text: "滿月賜福，好運爆棚！近期將有意想不到的好消息降臨，財運與桃花雙豐收！" },
    { level: "上吉 🐇", text: "玉兔送安，諸事順遂。工作或學業上的努力即將獲得回報，繼續保持現在的步調！" },
    { level: "中吉 🌸", text: "桂花飄香，貴人相助。遇到困難時，留意身邊的朋友，他們會給你帶來很大的幫助。" },
    { level: "小吉 🥮", text: "吃口月餅，小確幸不斷。今天適合放慢腳步，享受與家人朋友相聚的溫馨時光。" },
    { level: "特吉 ✨", text: "嫦娥仙子偷偷為你加持！近期願望成真的機率大幅提升，想做什麼就勇敢去做吧！" },
    { level: "平吉 🍵", text: "清茶一杯，歲月靜好。沒有壞事發生就是最好的事，享受這段平穩安康的日子。" }
];

// 點擊占卜按鈕
$('divinationBtn').onclick = () => {
    // 1. 初始化 / 重置彈窗狀態
    $('divinationTitle').textContent = "🔮 玉兔為您求籤中...";
    $('divinationAnim').style.display = "block"; // 顯示搖晃動畫
    $('divinationResult').style.display = "none"; // 隱藏結果
    $('closeDivinationBtn').style.display = "none"; // 隱藏關閉按鈕

    // 開啟彈窗
    $('divinationModal').classList.add('show');

    // 2. 模擬求籤過程 (延遲 2.5 秒)
    setTimeout(() => {
        // 隨機抽取一首籤詩
        const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];

        // 3. 更新畫面顯示結果
        $('divinationTitle').textContent = `✨ ${playerName} 的專屬中秋籤詩`;
        $('divinationAnim').style.display = "none"; 

        $('fortuneLevel').textContent = randomFortune.level;
        $('fortuneText').textContent = randomFortune.text;
        $('divinationResult').style.display = "block"; 

        $('closeDivinationBtn').style.display = "block"; 

        // 撒下星星特效慶祝
        for (let i = 0; i < 8; i++) fall('✨');

    }, 2500); // 2.5秒後揭曉
};

$('closeDivinationBtn').onclick = () => {
    $('divinationModal').classList.remove('show');
    toast('玉兔說：心誠則靈，祝您好運！🐰');
};


// 開場煙火特效 
function launchFireworks() {
    console.log("🎆 準備發射煙火！"); // 檢查用
    const container = document.body;
    const colors = ['#ffda79', '#ff9ff3', '#feca57', '#48dbfb', '#1dd1a1', '#ff7675'];

    const numFireworks = 5 + Math.floor(Math.random() * 4); 

    for (let f = 0; f < numFireworks; f++) {
        setTimeout(() => {
            console.log(`發射第 ${f+1} 朵煙火！`); // 檢查用

            const screenW = window.innerWidth;
            const screenH = window.innerHeight;

            const startX = (screenW * 0.15) + Math.random() * (screenW * 0.7);
            const startY = (screenH * 0.1) + Math.random() * (screenH * 0.4);
            const color = colors[Math.floor(Math.random() * colors.length)];

            const particlesCount = 35 + Math.floor(Math.random() * 20);

            for (let i = 0; i < particlesCount; i++) {
                const p = document.createElement('div');
                p.className = 'firework-particle';

                p.style.backgroundColor = color;
                p.style.boxShadow = `0 0 8px 2px ${color}`;

                p.style.left = startX + 'px';
                p.style.top = startY + 'px';

                const angle = Math.random() * Math.PI * 2;
                const distance = 60 + Math.random() * 100;

                p.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
                p.style.setProperty('--ty', Math.sin(angle) * distance + 'px');

                const duration = 0.8 + Math.random() * 0.7;
                p.style.animation = `explode ${duration}s ease-out forwards`;

                container.appendChild(p);

                setTimeout(() => {
                    if (p.parentNode) p.remove();
                }, duration * 1000 + 100);
            }
        }, f * 500 + Math.random() * 300); 
    }
}
