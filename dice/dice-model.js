// 骰子模型类 - 负责骰子的3D模型和物理体创建
class DiceModel {
    constructor(scene, physics, renderer) {
        this.scene = scene;
        this.physics = physics;
        this.renderer = renderer;
        this.diceList = [];  // 存储多个骰子
        this.diceBodyList = [];  // 存储多个物理体
        this.diceSize = 2;  // 增大骰子尺寸
        this.materials = null;  // 共享材质
        this.sharedGeometry = null;  // 共享几何体
    }

    // 创建指定数量的骰子
    createDice(count) {
        // 清除现有骰子
        this.clearDice();

        // 只在第一次创建材质和几何体
        if (!this.materials) {
            this.materials = this.createMaterials();
        }
        if (!this.sharedGeometry) {
            this.sharedGeometry = new THREE.BoxGeometry(this.diceSize, this.diceSize, this.diceSize);
        }

        // 创建指定数量的骰子
        for (let i = 0; i < count; i++) {
            this.createSingleDice();
        }
    }

    // 清除所有骰子
    clearDice() {
        // 移除视觉模型（不释放共享材质和几何体）
        this.diceList.forEach(dice => {
            this.scene.remove(dice);
        });

        // 移除物理体
        this.diceBodyList.forEach(body => {
            this.physics.world.removeBody(body);
        });

        this.diceList = [];
        this.diceBodyList = [];
    }

    // 创建单个骰子
    createSingleDice() {
        // 创建Three.js可视模型
        const dice = this.createVisualModel();

        // 创建Cannon.js物理体
        const diceBody = this.createPhysicsBody();

        // 设置物理材质
        this.setupPhysicsMaterial(diceBody);

        this.diceList.push(dice);
        this.diceBodyList.push(diceBody);

        // 同步初始位置
        dice.position.copy(diceBody.position);
        dice.quaternion.copy(diceBody.quaternion);
    }

    createVisualModel() {
        // 创建网格（使用共享几何体和材质）
        const dice = new THREE.Mesh(this.sharedGeometry, this.materials);
        dice.castShadow = true;
        dice.receiveShadow = true;
        this.scene.add(dice);

        return dice;
    }

    createMaterials() {
        const faceNumbers = [3, 4, 5, 6, 1, 2];

        return faceNumbers.map(number => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');

            // 绘制白色背景
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 256, 256);

            // 绘制点数
            this.drawDots(ctx, number);

            const texture = new THREE.CanvasTexture(canvas);
            texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

            return new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.5,
                metalness: 0.1,
                color: 0xffffff,
                flatShading: false,
                side: THREE.FrontSide
            });
        });
    }

    drawDots(ctx, number) {
        const dotRadius = 22;
        const positions = {
            1: [[128, 128]],
            2: [[64, 64], [192, 192]],
            3: [[64, 64], [128, 128], [192, 192]],
            4: [[64, 64], [192, 64], [64, 192], [192, 192]],
            5: [[64, 64], [192, 64], [128, 128], [64, 192], [192, 192]],
            6: [[64, 64], [192, 64], [64, 128], [192, 128], [64, 192], [192, 192]]
        };

        positions[number].forEach(([x, y]) => {
            // 绘制点的阴影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(x + 3, y + 3, dotRadius, 0, Math.PI * 2);
            ctx.fill();

            // 绘制点
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();

            // 添加高光效果
            const gradient = ctx.createRadialGradient(
                x - dotRadius * 0.3, y - dotRadius * 0.3, 0,
                x, y, dotRadius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    createPhysicsBody() {
        const halfSize = this.diceSize / 2;
        const diceShape = new CANNON.Box(new CANNON.Vec3(halfSize, halfSize, halfSize));

        const diceBody = new CANNON.Body({
            mass: 1,
            shape: diceShape,
            linearDamping: 0.3,
            angularDamping: 0.3
        });

        diceBody.material = new CANNON.Material();
        this.physics.world.addBody(diceBody);

        // 初始位置
        diceBody.position.set(0, 10, 0);

        return diceBody;
    }

    setupPhysicsMaterial(diceBody) {
        const diceMaterial = diceBody.material;
        const tableMaterial = this.physics.tableBody.material;

        const contactMaterial = new CANNON.ContactMaterial(diceMaterial, tableMaterial, {
            friction: 0.4,
            restitution: 0.3
        });

        this.physics.world.addContactMaterial(contactMaterial);
    }

    // 同步所有骰子的视觉模型和物理体
    syncAllVisualWithPhysics() {
        for (let i = 0; i < this.diceList.length; i++) {
            this.diceList[i].position.copy(this.diceBodyList[i].position);
            this.diceList[i].quaternion.copy(this.diceBodyList[i].quaternion);
        }
    }

    // 获取单个骰子的顶面
    getTopFace(diceIndex) {
        const dice = this.diceList[diceIndex];
        const upVector = new THREE.Vector3(0, 1, 0);
        const matrix = new THREE.Matrix4();
        matrix.extractRotation(dice.matrixWorld);

        const faces = [
            { normal: new THREE.Vector3(1, 0, 0), value: 3 },
            { normal: new THREE.Vector3(-1, 0, 0), value: 4 },
            { normal: new THREE.Vector3(0, 1, 0), value: 5 },
            { normal: new THREE.Vector3(0, -1, 0), value: 6 },
            { normal: new THREE.Vector3(0, 0, 1), value: 1 },
            { normal: new THREE.Vector3(0, 0, -1), value: 2 }
        ];

        let maxDot = -Infinity;
        let topValue = 1;

        faces.forEach(face => {
            const worldNormal = face.normal.clone().applyMatrix4(matrix).normalize();
            const dot = worldNormal.dot(upVector);
            if (dot > maxDot) {
                maxDot = dot;
                topValue = face.value;
            }
        });

        return topValue;
    }

    // 获取所有骰子的顶面结果
    getAllTopFaces() {
        return this.diceList.map((_, index) => this.getTopFace(index));
    }
}
