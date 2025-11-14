// 玩家类 - 负责玩家信息和技能系统（预留扩展接口）
class Player {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.skills = [];
    }

    addSkill(skill) {
        this.skills.push(skill);
    }

    useSkill(skillIndex, game, ...args) {
        if (skillIndex >= 0 && skillIndex < this.skills.length) {
            return this.skills[skillIndex].execute(game, this, ...args);
        }
        return false;
    }

    hasSkills() {
        return this.skills.length > 0;
    }
}

// 技能基类 - 为后期扩展提供统一接口
class Skill {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.cooldown = 0;
        this.currentCooldown = 0;
    }

    execute(game, player, ...args) {
        if (this.currentCooldown > 0) {
            return { success: false, message: '技能冷却中' };
        }

        const result = this.use(game, player, ...args);

        if (result.success) {
            this.currentCooldown = this.cooldown;
        }

        return result;
    }

    use(game, player, ...args) {
        throw new Error('技能必须实现use方法');
    }

    reduceCooldown() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }
}

// 悔棋技能
class UndoSkill extends Skill {
    constructor() {
        super('悔棋', '撤销双方各一步棋');
        this.cooldown = 0;
    }

    use(game, player) {
        const opponent = game.players.find(p => p.id !== player.id);

        let playerCount = 0;

        for (let i = 0; i < game.board.size; i++) {
            for (let j = 0; j < game.board.size; j++) {
                if (game.board.grid[i][j] === player.id) playerCount++;
            }
        }

        if (playerCount === 0) {
            return { success: false, message: '还没下棋不能悔棋' };
        }

        let removed = 0;

        for (let i = game.board.size - 1; i >= 0 && removed < 1; i--) {
            for (let j = game.board.size - 1; j >= 0 && removed < 1; j--) {
                if (game.board.grid[i][j] === opponent.id) {
                    game.board.grid[i][j] = 0;
                    removed++;
                }
            }
        }

        for (let i = game.board.size - 1; i >= 0 && removed < 2; i--) {
            for (let j = game.board.size - 1; j >= 0 && removed < 2; j--) {
                if (game.board.grid[i][j] === player.id) {
                    game.board.grid[i][j] = 0;
                    removed++;
                }
            }
        }

        return { success: true, message: '悔棋成功' };
    }
}

// 禁手技能
class BlockSkill extends Skill {
    constructor() {
        super('禁手', '禁止对方在某个位置落子');
        this.cooldown = 0;
    }

    use(game, player, row, col) {
        if (game.board.grid[row][col] === 0) {
            game.board.grid[row][col] = -1;
            return { success: true, message: '禁手成功', needsPosition: false };
        }
        return { success: false, message: '该位置已有棋子' };
    }
}

// 飞沙走石技能
class RemoveLastSkill extends Skill {
    constructor() {
        super('飞沙走石', '去掉对方上一个下的棋子');
        this.cooldown = 0;
    }

    use(game, player) {
        const opponent = game.players.find(p => p.id !== player.id);

        for (let i = game.board.size - 1; i >= 0; i--) {
            for (let j = game.board.size - 1; j >= 0; j--) {
                if (game.board.grid[i][j] === opponent.id) {
                    this.animateRemovePiece(game, i, j, opponent.id);
                    game.board.grid[i][j] = 0;
                    return { success: true, message: '飞沙走石成功，去掉对方最后一个棋子', animated: true };
                }
            }
        }

        return { success: false, message: '对方还没有棋子' };
    }

    animateRemovePiece(game, row, col, playerId) {
        const board = game.board;
        const canvas = board.canvas;
        const x = board.padding + col * board.cellSize;
        const y = board.padding + row * board.cellSize;
        const radius = board.cellSize * 0.4;

        const river = document.createElement('div');
        river.className = 'shichahai-river';
        river.textContent = '什刹海';
        document.body.appendChild(river);

        const piece = document.createElement('div');
        piece.className = 'flying-piece';
        piece.style.left = (canvas.offsetLeft + x) + 'px';
        piece.style.top = (canvas.offsetTop + y) + 'px';
        piece.style.width = (radius * 2) + 'px';
        piece.style.height = (radius * 2) + 'px';
        piece.style.background = playerId === 1 ? 'radial-gradient(circle at 30% 30%, #666, #000)' : 'radial-gradient(circle at 30% 30%, #fff, #ddd)';
        document.body.appendChild(piece);

        setTimeout(() => {
            piece.style.transform = 'translate(calc(50vw - 50%), calc(100vh - 100px)) rotate(720deg) scale(0.5)';
            piece.style.opacity = '0';
        }, 50);

        setTimeout(() => {
            piece.remove();
            river.remove();
        }, 1500);
    }
}

// 静如止水技能
class FreezeSkill extends Skill {
    constructor() {
        super('静如止水', '冻结对方，只能释放水滴石穿');
        this.cooldown = 0;
    }

    use(game, player) {
        if (game.frozenPlayer) {
            return { success: false, message: '已有玩家被冻结' };
        }

        const opponent = game.players.find(p => p.id !== player.id);
        game.frozenPlayer = opponent.id;

        this.showFreezeEffect(opponent.id);

        return { success: true, message: `${opponent.name}被冻结，只能使用水滴石穿` };
    }

    showFreezeEffect(playerId) {
        const panelId = `player${playerId}-skills`;
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('frozen');
        }
    }
}

// 水滴石穿技能
class UnfreezeSkill extends Skill {
    constructor() {
        super('水滴石穿', '解除静如止水状态');
        this.cooldown = 0;
    }

    use(game, player) {
        if (!game.frozenPlayer) {
            return { success: false, message: '当前没有冻结状态' };
        }

        if (game.frozenPlayer !== player.id) {
            return { success: false, message: '你没有被冻结' };
        }

        game.frozenPlayer = null;

        const panelId = `player${player.id}-skills`;
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.remove('frozen');
        }

        return { success: true, message: '解除冻结状态' };
    }
}

// 力拔山兮技能
class DestroyBoardSkill extends Skill {
    constructor() {
        super('力拔山兮', '摔破棋盘直接获胜');
        this.cooldown = 0;
    }

    use(game, player) {
        if (game.boardDestroyed) {
            return { success: false, message: '棋盘已经被摔破了' };
        }

        game.boardDestroyed = true;
        game.destroyedBy = player.id;

        this.showDestroyEffect(game.board.canvas);

        return { success: true, message: `${player.name}摔破棋盘！对方可使用东山再起恢复` };
    }

    showDestroyEffect(canvas) {
        canvas.classList.add('board-destroyed');
    }
}

// 东山再起技能
class RestoreBoardSkill extends Skill {
    constructor() {
        super('东山再起', '恢复被摔破的棋盘');
        this.cooldown = 0;
    }

    use(game, player) {
        if (!game.boardDestroyed) {
            return { success: false, message: '棋盘没有被摔破' };
        }

        game.boardDestroyed = false;
        game.destroyedBy = null;
        game.isGameOver = false;
        game.winner = null;

        game.board.canvas.classList.remove('board-destroyed');

        return { success: true, message: '棋盘已恢复，游戏继续' };
    }
}

// 调你离山技能
class MultiMoveSkill extends Skill {
    constructor() {
        super('调你离山', '五秒内可以连续下棋不结束回合');
        this.cooldown = 0;
    }

    use(game, player) {
        if (game.multiMovePlayer) {
            return { success: false, message: '已有玩家在连续下棋' };
        }

        game.multiMovePlayer = player.id;
        game.multiMoveEndTime = Date.now() + 5000;

        return { success: true, message: `${player.name}开启连续下棋模式，5秒内不结束回合` };
    }
}

// 保洁上门技能
class CleaningSkill extends Skill {
    constructor() {
        super('保洁上门', '随机扫掉一部分棋子');
        this.cooldown = 0;
    }

    use(game, player) {
        const pieces = [];
        for (let i = 0; i < game.board.size; i++) {
            for (let j = 0; j < game.board.size; j++) {
                if (game.board.grid[i][j] > 0) {
                    pieces.push({ row: i, col: j });
                }
            }
        }

        if (pieces.length === 0) {
            return { success: false, message: '棋盘上没有棋子' };
        }

        const removeCount = Math.max(1, Math.floor(pieces.length * (0.3 + Math.random() * 0.3)));
        const toRemove = [];
        for (let i = 0; i < removeCount; i++) {
            const idx = Math.floor(Math.random() * pieces.length);
            toRemove.push(pieces[idx]);
            pieces.splice(idx, 1);
        }

        toRemove.forEach(pos => {
            game.board.grid[pos.row][pos.col] = 0;
        });

        return { success: true, message: `保洁上门成功，扫掉了${removeCount}个棋子` };
    }
}
