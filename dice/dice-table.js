// 桌面类 - 负责桌面的3D模型创建
class DiceTable {
    constructor(scene) {
        this.scene = scene;
        this.table = null;

        this.create();
    }

    create() {
        // 创建超大桌面，模拟无限平面
        const tableGeometry = new THREE.BoxGeometry(2000, 1, 2000);

        // 使用木质纹理材质
        const tableMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });

        this.table = new THREE.Mesh(tableGeometry, tableMaterial);
        this.table.position.y = -0.5;
        this.table.receiveShadow = true;
        this.scene.add(this.table);
    }
}
