// 主控制脚本 - 初始化游戏和事件处理
let diceScene, dicePhysics, diceModel, diceTable, diceGame;
let needsRender = true;
let fpsCounter = { frames: 0, lastTime: performance.now(), fps: 60 };

function init() {
    const canvas = document.getElementById('canvas');
    const resultEl = document.getElementById('result');
    const rollBtn = document.getElementById('rollBtn');
    const diceCountSelect = document.getElementById('diceCount');

    // 初始化各个模块
    diceScene = new DiceScene(canvas);
    dicePhysics = new DicePhysics();
    diceTable = new DiceTable(diceScene.scene);
    diceModel = new DiceModel(diceScene.scene, dicePhysics, diceScene.renderer);
    diceGame = new DiceGame(diceScene, dicePhysics, diceModel);

    // 创建默认数量的骰子（1个）
    diceModel.createDice(1);

    // 开始动画循环
    animate();

    // 骰子数量改变时重新创建骰子
    diceCountSelect.addEventListener('change', () => {
        const count = parseInt(diceCountSelect.value);
        diceModel.createDice(count);
        resultEl.classList.remove('show');
        needsRender = true;
    });

    // 点击按钮投掷骰子
    rollBtn.addEventListener('click', () => {
        if (diceGame.roll()) {
            resultEl.classList.remove('show');
            rollBtn.disabled = true;
            needsRender = true;
        }
    });

    // 窗口大小调整
    window.addEventListener('resize', () => {
        diceScene.onResize();
        needsRender = true;
    });

    // 相机移动时需要重新渲染
    diceScene.onCameraMove = () => {
        needsRender = true;
    };
}

function animate() {
    requestAnimationFrame(animate);

    // 更新FPS计数器
    updateFPS();

    // 更新游戏状态
    const result = diceGame.update();

    // 如果骰子正在运动，需要持续渲染
    if (diceGame.isRolling) {
        needsRender = true;
    }

    // 如果骰子停止，显示结果
    if (result !== null) {
        const resultEl = document.getElementById('result');
        const rollBtn = document.getElementById('rollBtn');

        // 处理多骰子结果显示
        if (Array.isArray(result)) {
            const total = result.reduce((sum, val) => sum + val, 0);
            if (result.length === 1) {
                resultEl.textContent = `🎲 ${result[0]} 点`;
            } else {
                const diceStr = result.map(val => `${val}`).join(' + ');
                resultEl.textContent = `🎲 ${diceStr} = ${total} 点`;
            }
        } else {
            resultEl.textContent = `🎲 ${result} 点`;
        }

        resultEl.classList.add('show');
        rollBtn.disabled = false;

        // 3秒后自动隐藏结果
        setTimeout(() => {
            resultEl.classList.remove('show');
        }, 3000);

        needsRender = true;
    }

    // 只在需要时渲染场景
    if (needsRender) {
        diceScene.render();
        needsRender = false;
    }
}

function updateFPS() {
    fpsCounter.frames++;
    const currentTime = performance.now();
    const elapsed = currentTime - fpsCounter.lastTime;

    if (elapsed >= 1000) {
        fpsCounter.fps = Math.round((fpsCounter.frames * 1000) / elapsed);
        fpsCounter.frames = 0;
        fpsCounter.lastTime = currentTime;

        const fpsEl = document.getElementById('fps');
        if (fpsEl) {
            fpsEl.textContent = `FPS: ${fpsCounter.fps}`;
        }
    }
}

// 页面加载完成后初始化
window.addEventListener('load', init);
