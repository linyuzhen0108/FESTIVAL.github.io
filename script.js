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
let hasInsurance = true; // 預設玩家擁有一張免死金牌
let rabbitState = 0; // 0 = 綠燈(安全), 1 = 黃燈(預警), 2 = 紅燈(危險)
let gameActive = false;
let rabbitTimer;

const gameOverlay = $('gameOverlay');
const gameRabbit = $('gameRabbit');
const gameStatusText = $('gameStatusText');
const scoreDisplay = $('gameScore');
const stealBtn = $('stealBtn');
const countdownDisplay = $('countdownDisplay');

// 難度控制
function getDifficultyMultiplier() {
    if (gameScore >= 70) return 0.4; // 速度剩 40%
    if (gameScore >= 50) return 0.6;
    if (gameScore >= 30) return 0.8;
    if (gameScore >= 15) return 0.9;
    return 1.0; // 正常級：原本速度
}

function checkDifficultyLevelUp() {
    if (gameScore === 30) {
        toast("🐰 玉兔起疑心了！轉頭速度加快！");
    } else if (gameScore === 50) {
        toast("⚠️ 玉兔緊盯著你！極速模式！");
    } else if (gameScore === 70) {
        toast("🔥 噩夢難度！你能撐多久？");
    }
}
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
    hasInsurance = true;
    // 啟用偷吃按鈕
    stealBtn.disabled = false;
    stealBtn.style.opacity = '1';

    updateRabbitUI();
    scheduleRabbitTurn();
    triggerRabbitSpeech();
    toast('遊戲開始！趁玉兔沒看時偷吃！');
}
// 兔子的三階段轉頭機制
function scheduleRabbitTurn() {
    if (!gameActive) return;
    const multiplier = getDifficultyMultiplier();

    if (rabbitState === 0) {
        // 綠燈：隨機 1~3 秒後進入黃燈 (預警)
        const delay = (Math.random() * 2000 + 1000) * multiplier;
        rabbitTimer = setTimeout(() => {
            rabbitState = 1;
            updateRabbitUI();
            scheduleRabbitTurn();
        }, delay);
    } else if (rabbitState === 1) {
        // 黃燈：預警狀態，大約 0.5~0.8 秒後立刻轉紅燈
        const warningTime = (Math.random() * 300 + 500) * multiplier;
        rabbitTimer = setTimeout(() => {
            rabbitState = 2;
            updateRabbitUI();
            scheduleRabbitTurn();
        }, warningTime);
    } else if (rabbitState === 2) {
        // 紅燈：隨機盯著 1~2.5 秒後轉回綠燈
        const dangerTime = (Math.random() * 1500 + 1000) * multiplier;
        rabbitTimer = setTimeout(() => {
            rabbitState = 0;
            updateRabbitUI();
            scheduleRabbitTurn();
        }, dangerTime);
    }
}

// 更新遊戲畫面狀態
function updateRabbitUI() {
    if (rabbitState !== 0) {
        $('rabbitSpeech').classList.remove('show');
    }

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

// === 玉兔心理戰干擾系統 ===
let speechTimer;
const rabbitQuotes = [
    "我好像聽到偷吃的聲音...",
    "妤蓁說不能吃太多喔！",
    "我要轉頭了喔... ",
    "背後感覺涼涼的？",
    "你是不是在狂點按鈕？",
    "搗藥好累，想偷懶...",
    "再吃會變胖喔～"
];

function triggerRabbitSpeech() {
    if (!gameActive) return;

    // 只有在綠燈狀態下才會講話干擾
    if (rabbitState === 0 && Math.random() > 0.4) {
        const quote = rabbitQuotes[Math.floor(Math.random() * rabbitQuotes.length)];
        const speechBubble = $('rabbitSpeech');

        speechBubble.textContent = quote;
        speechBubble.classList.add('show');

        // 顯示 1.5 秒後自動隱藏
        setTimeout(() => {
            speechBubble.classList.remove('show');
        }, 1500);
    }

    // 隨機是否講話
    speechTimer = setTimeout(triggerRabbitSpeech, 1000 + Math.random() * 3000);
}
// 點擊「偷吃月餅」按鈕
$('stealBtn').onclick = () => {
    if (!gameActive) return;

    const stealBtn = $('stealBtn'); // 取得按鈕元素以便後續操作

    if (rabbitState === 2) {
        // 紅燈時點擊 -> 判斷有沒有保險！
        if (hasInsurance) {
            hasInsurance = false; // 消耗保險
            toast("🛡️ 意外發生！妤蓁為你擋下一次風險！(免死金牌 -1)");

            // 畫面震動或特效提示
            gameOverlay.style.animation = "shakeAnim 0.5s";
            setTimeout(() => gameOverlay.style.animation = "", 500);

            // ★ 新增：強制鎖定按鈕 1.5 秒，防止玩家煞車不及狂點
            stealBtn.disabled = true;
            stealBtn.style.opacity = '0.5';
            stealBtn.textContent = '🛡️ 保障發揮中...';

            // 1.5 秒後解除鎖定，讓玩家可以繼續遊戲
            setTimeout(() => {
                if (gameActive) { // 確保遊戲還沒結束才恢復按鈕
                    stealBtn.disabled = false;
                    stealBtn.style.opacity = '1';
                    stealBtn.textContent = '偷吃月餅！🥮';
                }
            }, 1500);

        } else {
            gameOver();
        }
    } else {
        // 綠燈或黃燈時點擊 -> 成功偷吃 
        gameScore++;
        scoreDisplay.textContent = gameScore;

        // 保留你新增的難度升級功能！
        if (typeof checkDifficultyLevelUp === "function") {
            checkDifficultyLevelUp();
        }

        gameRabbit.style.transform = 'scale(0.9) translateX(-10px)';
        setTimeout(() => { if (gameActive && rabbitState === 0) gameRabbit.style.transform = 'scale(1)'; }, 100);
    }
};

function gameOver() {
    gameActive = false;
    clearTimeout(rabbitTimer);
    clearTimeout(speechTimer); // ★ 新增這行：遊戲結束停止講話
    $('rabbitSpeech').classList.remove('show'); // 隱藏對話框
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

        // 判斷本次成績
        let rankBadge = "";
        let careMessage = "";
        const rankIndex = leaderboard.findIndex(entry => entry.score <= gameScore && entry.name === playerName);

        if (rankIndex !== -1 && rankIndex < 10) {
            // 情境 1：擠進全球前 10 名的大神
            rankBadge = `🏆 榮登全球第 <b>${rankIndex + 1}</b> 名！`;
            careMessage = `吃成大胖子啦！反應敏銳又果決～<br>人生就像這場挑戰，未來的各項保障與風險規劃，就交給妤蓁為您精準把關！`;
            toast(`太神啦！成功擠進全球前 10 名！吃了 ${gameScore} 顆！`);
        } else if (gameScore >= 30) {
            // 情境 2：拿到 30 分以上的高手
            rankBadge = `🔥 實力派高手：偷吃了 <b>${gameScore}</b> 顆！`;
            careMessage = `表現超亮眼！差一點就登頂了！<br>月圓人團圓，妤蓁祝福您下半年步步高升、事業與健康皆圓滿！`;
            toast(`好身手！吃了 ${gameScore} 顆月餅！`);
        } else if (gameScore >= 10) {
            // 情境 3：拿 10 ~ 29 分的普通玩家
            rankBadge = `😋 品嚐了 <b>${gameScore}</b> 顆月餅！`;
            careMessage = `美味月餅下肚，甜在心裡！<br>享受節慶氛圍之餘，也別忘了多喝茶解膩，妤蓁隨時關心您的健康與平安！`;
            toast(`被玉兔發現了！吃了 ${gameScore} 顆！`);
        } else {
            // 情境 4：10 分以下（剛開始就被抓到的手滑玩家）
            rankBadge = `🐰 玉兔眼力太好啦！(吃了 <b>${gameScore}</b> 顆)`;
            careMessage = `哈哈別氣餒！雖然遊戲裡有玉兔盯著，<br>但現實生活中，有妤蓁在南山為您築起保護傘，讓您隨時都安心！`;
            toast(`剛偷吃就被抓到了！再玩一次一定更棒！`);
        }

        // 組合完整的結算畫面 (質感金色排版 + 專屬署名)
        resultMsg.innerHTML = `
            <div style="font-size: 19px; font-weight: bold; color: #ffda79; margin-bottom: 8px;">
                ${rankBadge}
            </div>
            <div style="font-size: 14px; line-height: 1.6; color: #f5f6fa; margin-bottom: 12px;">
                ${careMessage}
            </div>
            <div style="font-size: 12px; color: #feca57; font-weight: bold; letter-spacing: 1.5px; border-top: 1px dashed rgba(254, 202, 87, 0.4); padding-top: 8px;">
                🌸 南山人壽 妤蓁 誠摯守護 🌸
            </div>
        `;

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
    { level: "大吉 ✨", text: "嫦娥仙子偷偷為你加持！近期願望成真的機率大幅提升，想做什麼就勇敢去做吧！妤蓁祝您中秋佳節愉快！" },
    { level: "中吉 🌸", text: "月圓圓，錢包也圓圓！投資理財還是人生規劃都讓妤蓁陪您一起守護家人與未來。" },
    { level: "小吉 🥮", text: "生活難免有小波折，但別擔心，就像月有陰晴圓缺，妤蓁會一直在南山人壽為您撐起保護傘！" },
    { level: "吉 🐇", text: "花好月圓人團圓，健康平安就是最大的財富。您的專屬守護員妤蓁，隨時為您把關！" },
    { level: "末吉 🍵", text: "清茶一杯，歲月靜好。沒有壞事發生就是最好的事，享受與家人朋友相聚的溫馨時光。" },
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
