// 物理世界类 - 负责Cannon.js物理引擎的设置和管理
class DicePhysics {
    constructor() {
        this.world = null;
        this.tableBody = null;

        this.init();
    }

    init() {
        // 创建物理世界
        this.world = new CANNON.World();
        this.world.gravity.set(0, -30, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 20;
        this.world.allowSleep = true;

        // 创建无限桌面物理体（不创建围栏）
        this.createTable();
    }

    createTable() {
        // 创建一个非常大的桌面，模拟无限平面
        const tableShape = new CANNON.Box(new CANNON.Vec3(1000, 0.5, 1000));
        this.tableBody = new CANNON.Body({
            mass: 0,
            shape: tableShape,
            position: new CANNON.Vec3(0, -0.5, 0)
        });
        this.tableBody.material = new CANNON.Material({
            friction: 0.5,
            restitution: 0.3
        });
        this.world.addBody(this.tableBody);
    }

    step(deltaTime) {
        this.world.step(deltaTime);
    }
}
