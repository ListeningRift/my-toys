// 游戏逻辑类 - 负责游戏状态管理和骰子投掷
class DiceGame {
    constructor(diceScene, dicePhysics, diceModel) {
        this.scene = diceScene;
        this.physics = dicePhysics;
        this.model = diceModel;
        this.isRolling = false;
    }

    roll() {
        if (this.isRolling) return false;
        if (this.model.diceList.length === 0) return false;

        this.isRolling = true;

        // 为每个骰子设置随机初始状态
        this.model.diceBodyList.forEach((diceBody, index) => {
            // 唤醒物理体
            diceBody.wakeUp();

            // 根据骰子数量计算排列位置
            const count = this.model.diceList.length;
            const spacing = 3;
            const totalWidth = (count - 1) * spacing;
            const offsetX = -totalWidth / 2 + index * spacing;

            // 设置随机初始位置
            const startX = offsetX + (Math.random() - 0.5) * 2;
            const startY = 10 + Math.random() * 5;
            const startZ = (Math.random() - 0.5) * 4;
            diceBody.position.set(startX, startY, startZ);

            // 设置随机初始旋转
            const randomAxis = new CANNON.Vec3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).unit();
            const randomAngle = Math.random() * Math.PI * 2;
            diceBody.quaternion.setFromAxisAngle(randomAxis, randomAngle);

            // 设置初始速度
            diceBody.velocity.set(
                (Math.random() - 0.5) * 8,
                -2,
                (Math.random() - 0.5) * 8
            );

            // 设置角速度
            diceBody.angularVelocity.set(
                (Math.random() - 0.5) * 25,
                (Math.random() - 0.5) * 25,
                (Math.random() - 0.5) * 25
            );
        });

        // 同步视觉模型
        this.model.syncAllVisualWithPhysics();

        return true;
    }

    update() {
        if (!this.isRolling) return null;

        // 更新物理世界
        this.physics.step(1 / 60);

        // 同步视觉模型
        this.model.syncAllVisualWithPhysics();

        // 检测所有骰子是否都停止
        let allStopped = true;

        for (let i = 0; i < this.model.diceBodyList.length; i++) {
            const diceBody = this.model.diceBodyList[i];
            const velocity = diceBody.velocity;
            const angularVelocity = diceBody.angularVelocity;

            const speed = Math.sqrt(
                velocity.x * velocity.x +
                velocity.y * velocity.y +
                velocity.z * velocity.z
            );

            const angularSpeed = Math.sqrt(
                angularVelocity.x * angularVelocity.x +
                angularVelocity.y * angularVelocity.y +
                angularVelocity.z * angularVelocity.z
            );

            // 如果任何一个骰子还在运动，则继续等待
            if (speed >= 0.01 || angularSpeed >= 0.01 || diceBody.position.y >= 5) {
                allStopped = false;
                break;
            }
        }

        // 当所有骰子都停止时，返回结果
        if (allStopped) {
            this.isRolling = false;

            // 停止所有骰子的物理模拟
            this.model.diceBodyList.forEach(diceBody => {
                diceBody.velocity.set(0, 0, 0);
                diceBody.angularVelocity.set(0, 0, 0);
                diceBody.sleep();
            });

            // 返回所有骰子的结果
            return this.model.getAllTopFaces();
        }

        return null;
    }
}
