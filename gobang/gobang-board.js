// 棋盘类 - 负责棋盘绘制和渲染
class Board {
    constructor(canvas, size = 15) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.size = size;
        this.grid = Array(size).fill(null).map(() => Array(size).fill(0));
    }

    get cellSize() {
        return this.canvas.width / (this.size + 1);
    }

    get padding() {
        return this.cellSize;
    }

    draw() {
        this.drawBackground();
        this.drawGrid();
        this.drawStarPoints();
        this.drawPieces();
    }

    drawBackground() {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#daa520');
        gradient.addColorStop(1, '#cd853f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawWoodTexture();
    }

    drawWoodTexture() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(139, 90, 43, 0.1)';
        for (let i = 0; i < 50; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * this.canvas.width, 0);
            ctx.lineTo(Math.random() * this.canvas.width, this.canvas.height);
            ctx.lineWidth = Math.random() * 2;
            ctx.stroke();
        }
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;

        for (let i = 0; i < this.size; i++) {
            ctx.beginPath();
            ctx.moveTo(this.padding, this.padding + i * this.cellSize);
            ctx.lineTo(this.padding + (this.size - 1) * this.cellSize, this.padding + i * this.cellSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(this.padding + i * this.cellSize, this.padding);
            ctx.lineTo(this.padding + i * this.cellSize, this.padding + (this.size - 1) * this.cellSize);
            ctx.stroke();
        }
    }

    drawStarPoints() {
        const ctx = this.ctx;
        const points = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];
        ctx.fillStyle = '#000';

        points.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(
                this.padding + x * this.cellSize,
                this.padding + y * this.cellSize,
                4, 0, Math.PI * 2
            );
            ctx.fill();
        });
    }

    drawPieces() {
        const ctx = this.ctx;

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] !== 0) {
                    this.drawPiece(i, j, this.grid[i][j]);
                }
            }
        }
    }

    drawPiece(row, col, player) {
        const ctx = this.ctx;
        const x = this.padding + col * this.cellSize;
        const y = this.padding + row * this.cellSize;
        const radius = this.cellSize * 0.4;

        const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);

        if (player === 1) {
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(1, '#000');
        } else {
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ddd');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = player === 1 ? '#000' : '#999';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    placePiece(row, col, player) {
        if (this.grid[row][col] === 0) {
            this.grid[row][col] = player;
            return true;
        }
        return false;
    }

    getPosition(x, y) {
        const col = Math.round((x - this.padding) / this.cellSize);
        const row = Math.round((y - this.padding) / this.cellSize);

        if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
            return { row, col };
        }
        return null;
    }

    reset() {
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    }
}
