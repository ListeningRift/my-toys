// 游戏逻辑类 - 负责游戏规则和胜负判断
class Game {
    constructor(board, player1, player2) {
        this.board = board;
        this.players = [player1, player2];
        this.currentPlayerIndex = 0;
        this.isGameOver = false;
        this.winner = null;
        this.frozenPlayer = null;
        this.boardDestroyed = false;
        this.destroyedBy = null;
        this.multiMovePlayer = null;
        this.multiMoveEndTime = null;
        this.lastRemovedPiece = null;
        this.flyingStoneActive = false;
        this.flyingStoneEndTime = null;
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    makeMove(row, col) {
        if (this.isGameOver) return false;

        const currentPlayer = this.getCurrentPlayer();

        if (this.board.placePiece(row, col, currentPlayer.id)) {
            if (this.checkWin(row, col, currentPlayer.id)) {
                this.isGameOver = true;
                this.winner = currentPlayer;
                return { success: true, gameOver: true, winner: currentPlayer };
            }

            if (this.checkDraw()) {
                this.isGameOver = true;
                return { success: true, gameOver: true, draw: true };
            }

            this.switchPlayer();
            return { success: true, gameOver: false };
        }

        return { success: false };
    }

    checkWin(row, col, player) {
        const directions = [
            [[0, 1], [0, -1]],
            [[1, 0], [-1, 0]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]]
        ];

        for (const direction of directions) {
            let count = 1;

            for (const [dx, dy] of direction) {
                let x = row + dx;
                let y = col + dy;

                while (
                    x >= 0 && x < this.board.size &&
                    y >= 0 && y < this.board.size &&
                    this.board.grid[x][y] === player
                ) {
                    count++;
                    x += dx;
                    y += dy;
                }
            }

            if (count >= 5) return true;
        }

        return false;
    }

    checkDraw() {
        for (let i = 0; i < this.board.size; i++) {
            for (let j = 0; j < this.board.size; j++) {
                if (this.board.grid[i][j] === 0) return false;
            }
        }
        return true;
    }

    switchPlayer() {
        this.currentPlayerIndex = 1 - this.currentPlayerIndex;
    }

    reset() {
        this.board.reset();
        this.currentPlayerIndex = 0;
        this.isGameOver = false;
        this.winner = null;
        this.frozenPlayer = null;
        this.boardDestroyed = false;
        this.destroyedBy = null;
        this.multiMovePlayer = null;
        this.multiMoveEndTime = null;
        this.lastRemovedPiece = null;
        this.flyingStoneActive = false;
        this.flyingStoneEndTime = null;
    }
}
