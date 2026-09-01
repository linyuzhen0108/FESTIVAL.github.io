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

// --- 1. 網站初始邏輯：輸入姓名 ---
window.addEventListener('DOMContentLoaded', () => {
    // 預設背景星星
    for (let i = 0; i < 70; i++) {
        const s = document.createElement('i');
        s.className = 'star';
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 70 + '%';
        s.style.animationDelay = Math.random() * 3 + 's';
        s.style.opacity = .25 + Math.random() * .75;
        $('stars').appendChild(s);
    }

    // 讓輸入框自動聚焦
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
};

// --- 2. 原版賀卡互動特效 ---
$('moon').onclick = () => {
    toast('🌕 月亮送上祝福：願你所盼皆圓滿，所遇皆溫柔。');
    $('moon').style.transform = 'translateX(-50%) scale(1.08)';
    setTimeout(() => $('moon').style.transform = 'translateX(-50%)', 450);
};

document.querySelectorAll('.bunny').forEach(b => {
    b.onclick = () => toast(b.dataset.msg);
});

$('lantern').onclick = () => {
    document.body.classList.toggle('lit');
    toast(document.body.classList.contains('lit') ? '🏮 燈籠已點亮，願前路明亮順遂。' : '🏮 燈籠休息一下，下次再點亮。');
};

$('wishBtn').onclick = () => {
    toast('💛 已收下月亮祝福：平安、順心、好事發生。');
    for (let i = 0; i < 15; i++) fall('✦');
};

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

$('starBtn').onclick = () => {
    toast('✨ 星空已點亮！');
    for (let j = 0; j < 4; j++) setTimeout(() => {
        const x = 18 + Math.random() * 64,
            y = 13 + Math.random() * 28;
        for (let i = 0; i < 16; i++) {
            const p = document.createElement('div');
            p.className = 'petal';
            p.textContent = '✦';
            p.style.left = x + 'vw';
            p.style.top = y + 'svh';
            p.style.animation = 'none';
            p.style.fontSize = '14px';
            const a = i * Math.PI * 2 / 16,
                r = 45 + Math.random() * 45;
            p.animate([
                { transform: 'translate(0,0)', opacity: 1 },
                { transform: `translate(${Math.cos(a)*r}px,${Math.sin(a)*r}px)`, opacity: 0 }
            ], { duration: 850, fill: 'forwards' });
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 900);
        }
    }, j * 300);
};

// --- 3. 偷吃月餅大賽 (一二三木頭人) 升級版 ---
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
    gameOverlay.className = 'game-overlay show'; // 顯示遊戲畫面
    scoreDisplay.textContent = "0";
    gameRabbit.textContent = '🐇';
    gameStatusText.textContent = '準備中...';

    // ★ 關鍵修復：清除上一次遊戲結束時殘留的隱藏設定 ★
    countdownDisplay.style.display = '';

    // 倒數期間先禁用偷吃按鈕
    stealBtn.disabled = true;
    stealBtn.style.opacity = '0.5';

    startCountdown(); // 呼叫倒數函數
};

// 倒數計時邏輯
function startCountdown() {
    let count = 3;

    const tick = () => {
        if (count > 0) {
            // 顯示 3, 2, 1
            countdownDisplay.textContent = count;
            countdownDisplay.className = 'countdown-text';
            void countdownDisplay.offsetWidth; // 觸發重繪以重置動畫
            countdownDisplay.className = 'countdown-text pop';
            count--;
            setTimeout(tick, 1000);
        } else {
            // 顯示 START!
            countdownDisplay.textContent = '開始!';
            countdownDisplay.className = 'countdown-text';
            void countdownDisplay.offsetWidth;
            countdownDisplay.className = 'countdown-text pop';

            // 等 START 動畫跑完後，正式啟動遊戲
            setTimeout(() => {
                countdownDisplay.style.display = 'none';
                actualStartGame();
            }, 1000);
        }
    };

    tick(); // 啟動倒數
}

// 實際開始遊戲
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
        // 黃燈：預警狀態很短，大約 0.5~0.8 秒後立刻轉紅燈
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
        // 紅燈：抓人
        gameRabbit.textContent = '🐰';
        gameRabbit.style.transform = 'scale(1.2)';
        gameStatusText.textContent = '盯——！(停手)';
        gameOverlay.className = 'game-overlay show danger';
    } else if (rabbitState === 1) {
        // 黃燈：預警
        gameRabbit.textContent = '🐇';
        gameStatusText.textContent = '⚠️ 玉兔豎起耳朵... (準備停手)';
        gameOverlay.className = 'game-overlay show warning';
    } else {
        // 綠燈：安全
        gameRabbit.textContent = '🐇';
        gameRabbit.style.transform = 'scale(1)';
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
        // 綠燈或黃燈時點擊 -> 成功偷吃 (黃燈有風險，但還算安全)
        gameScore++;
        scoreDisplay.textContent = gameScore;

        // 點擊特效
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

// --- 4. 排行榜系統與結算 ---
function saveScoreAndShowLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem('mooncake_leaderboard') || '[]');

    // 取得歷史最高分，判斷是否破紀錄
    const currentHighScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
    const isNewRecord = gameScore > currentHighScore && gameScore > 0;

    // 建立本次紀錄的物件
    const currentEntry = { name: playerName, score: gameScore, date: new Date().getTime() };
    leaderboard.push(currentEntry);

    // 排序：分數由高到低，分數相同則新紀錄排前面 (b.date - a.date)
    leaderboard.sort((a, b) => b.score - a.score || b.date - a.date);

    // 找出本次遊玩的實際排名 (在所有歷史紀錄中的名次)
    const currentRank = leaderboard.indexOf(currentEntry) + 1;

    // 只保留前 10 名存入 LocalStorage 與顯示
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem('mooncake_leaderboard', JSON.stringify(leaderboard));

    // 顯示結算文字、本次排名與破紀錄特效
    const resultMsg = $('gameResultMsg');
    let rankText = currentRank <= 10 ? `🏆 本次排名：第 <b>${currentRank}</b> 名` : `💪 本次排名：第 <b>${currentRank}</b> 名 (未進榜，再接再厲！)`;

    if (isNewRecord) {
        resultMsg.innerHTML = `遊戲結束！你吃了 <b>${gameScore}</b> 顆月餅🥮<br>${rankText}<br><span class="new-record-msg">🎉 恭喜打破全場最高分紀錄！🎉</span>`;
        toast(`破紀錄啦！吃了 ${gameScore} 顆！`);
    } else {
        resultMsg.innerHTML = `被抓到了！本次偷吃：<b>${gameScore}</b> 顆月餅🥮<br><span style="color: #ffda79; font-size: 15px; display: inline-block; margin-top: 5px;">${rankText}</span>`;
        toast(`被玉兔抓到了！`);
    }

    renderLeaderboard(leaderboard);

    // --- 防誤觸機制 ---
    const replayBtn = $('replayBtn');
    const closeBtn = $('closeLeaderboardBtn');

    replayBtn.disabled = true;
    closeBtn.disabled = true;
    replayBtn.style.opacity = '0.5';
    closeBtn.style.opacity = '0.5';

    $('leaderboardModal').classList.add('show');

    setTimeout(() => {
        replayBtn.disabled = false;
        closeBtn.disabled = false;
        replayBtn.style.opacity = '1';
        closeBtn.style.opacity = '1';
    }, 1000);
}

// ★ 補回遺失的生成排行榜畫面函數 ★
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

// --- 5. 月兔中秋占卜系統 ---

// 籤詩資料庫 (可以自行新增或修改)
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
        $('divinationAnim').style.display = "none"; // 隱藏動畫

        $('fortuneLevel').textContent = randomFortune.level;
        $('fortuneText').textContent = randomFortune.text;
        $('divinationResult').style.display = "block"; // 顯示結果

        $('closeDivinationBtn').style.display = "block"; // 顯示關閉按鈕

        // 撒下星星特效慶祝
        for (let i = 0; i < 8; i++) fall('✨');

    }, 2500); // 2.5秒後揭曉
};

// 關閉占卜畫面
$('closeDivinationBtn').onclick = () => {
    $('divinationModal').classList.remove('show');
    toast('玉兔說：心誠則靈，祝您好運！🐰');
};