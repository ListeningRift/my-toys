// 主控制脚本 - 初始化游戏和事件处理
let game, board, activeSkill = null;

function init() {
    const canvas = document.getElementById('board');
    board = new Board(canvas, 15);

    const player1 = new Player(1, '黑方', '#000');
    const player2 = new Player(2, '白方', '#fff');

    player1.addSkill(new UndoSkill());
    player1.addSkill(new RemoveLastSkill());
    player1.addSkill(new FreezeSkill());
    player1.addSkill(new UnfreezeSkill());
    player1.addSkill(new DestroyBoardSkill());
    player1.addSkill(new RestoreBoardSkill());
    player1.addSkill(new MultiMoveSkill());
    player1.addSkill(new CleaningSkill());
    player2.addSkill(new UndoSkill());
    player2.addSkill(new RemoveLastSkill());
    player2.addSkill(new FreezeSkill());
    player2.addSkill(new UnfreezeSkill());
    player2.addSkill(new DestroyBoardSkill());
    player2.addSkill(new RestoreBoardSkill());
    player2.addSkill(new MultiMoveSkill());
    player2.addSkill(new CleaningSkill());

    game = new Game(board, player1, player2);

    board.draw();
    updateUI();
    renderSkills();

    canvas.addEventListener('click', handleClick);
    document.getElementById('restart-btn').addEventListener('click', restart);
}

function handleClick(event) {
    if (game.isGameOver && !game.boardDestroyed) return;

    const rect = board.canvas.getBoundingClientRect();
    const scaleX = board.canvas.width / rect.width;
    const scaleY = board.canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const pos = board.getPosition(x, y);

    if (pos) {
        if (activeSkill) {
            const currentPlayer = game.getCurrentPlayer();
            const result = activeSkill.skill.execute(game, currentPlayer, pos.row, pos.col);

            if (result.success) {
                activeSkill = null;
                board.draw();
                game.switchPlayer();
                renderSkills();
                updateUI();
                showMessage(result.message);
            } else {
                showMessage(result.message);
            }
            return;
        }

        if (game.boardDestroyed) {
            showMessage('棋盘已被摔破，请使用东山再起恢复');
            return;
        }

        const currentPlayer = game.getCurrentPlayer();
        if (game.frozenPlayer === currentPlayer.id) {
            showMessage('你被冻结了，不能下棋，只能使用水滴石穿');
            return;
        }

        const result = game.makeMove(pos.row, pos.col);

        if (result.success) {
            board.draw();

            if (result.gameOver) {
                renderSkills();
                if (result.draw) {
                    showMessage('平局！');
                } else if (result.winner) {
                    showMessage(`${result.winner.name}获胜！`);
                }
            } else {
                if (game.multiMovePlayer === currentPlayer.id && Date.now() < game.multiMoveEndTime) {
                    game.currentPlayerIndex = 1 - game.currentPlayerIndex;
                    renderSkills();
                    updateUI();
                } else {
                    if (game.multiMovePlayer === currentPlayer.id) {
                        game.multiMovePlayer = null;
                        game.multiMoveEndTime = null;
                    }
                    renderSkills();
                    updateUI();
                }
            }
        }
    }
}

function updateUI() {
    const currentPlayer = game.getCurrentPlayer();
    document.getElementById('current-player').textContent = currentPlayer.name;
    document.getElementById('current-player').style.color = currentPlayer.color;
}

function showMessage(text) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.style.display = 'block';
}

function restart() {
    game.reset();
    activeSkill = null;
    board.draw();
    updateUI();
    renderSkills();
    document.getElementById('message').style.display = 'none';

    board.canvas.classList.remove('board-destroyed');
    document.querySelectorAll('.skills-panel').forEach(panel => {
        panel.classList.remove('frozen');
    });
}

function renderSkills() {
    game.players.forEach((player, index) => {
        const panelId = `player${index + 1}-skills`;
        const panel = document.getElementById(panelId);
        const skillList = panel.querySelector('.skill-list');
        skillList.innerHTML = '';

        player.skills.forEach((skill, skillIndex) => {
            const skillBtn = document.createElement('button');
            skillBtn.className = 'skill-btn';
            skillBtn.textContent = skill.name;
            skillBtn.disabled = game.getCurrentPlayer().id !== player.id;

            if (activeSkill && activeSkill.player === player && activeSkill.index === skillIndex) {
                skillBtn.classList.add('active');
            }

            skillBtn.onclick = () => useSkill(player, skillIndex);
            skillList.appendChild(skillBtn);
        });
    });
}

function useSkill(player, skillIndex) {
    if (game.getCurrentPlayer().id !== player.id) return;

    const skill = player.skills[skillIndex];

    if (game.boardDestroyed && skill.name !== '东山再起') {
        showMessage('棋盘已被摔破，只能使用东山再起');
        return;
    }

    if (game.frozenPlayer === player.id && skill.name !== '水滴石穿') {
        showMessage('你被冻结了，只能使用水滴石穿');
        return;
    }

    const noPositionSkills = ['悔棋', '飞沙走石', '静如止水', '水滴石穿', '力拔山兮', '东山再起', '调你离山', '保洁上门'];

    if (noPositionSkills.includes(skill.name)) {
        const result = skill.execute(game, player);
        if (result.success) {
            board.draw();
            if (skill.name !== '调你离山') {
                game.switchPlayer();
            }
            renderSkills();
            updateUI();
            showMessage(result.message);
        } else {
            showMessage(result.message);
        }
    } else {
        activeSkill = { player, index: skillIndex, skill };
        renderSkills();
        showMessage(`请在棋盘上选择位置使用${skill.name}`);
    }
}

window.addEventListener('load', init);
