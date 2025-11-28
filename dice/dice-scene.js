// 场景类 - 负责Three.js场景、相机、渲染器和光照的设置
class DiceScene {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        this.init();
        this.setupCameraControls();
    }

    init() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // 创建相机 - 更远的俯视角度
        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        this.camera.position.set(0, 50, 50);
        this.camera.lookAt(0, 0, 0);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 设置光照
        this.setupLights();
    }

    setupLights() {
        // 环境光 - 降低强度以增强明暗对比
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        // 主光源 - 增强强度
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(10, 20, 10);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -20;
        mainLight.shadow.camera.right = 20;
        mainLight.shadow.camera.top = 20;
        mainLight.shadow.camera.bottom = -20;
        mainLight.shadow.bias = -0.0001;
        this.scene.add(mainLight);

        // 补光 - 降低强度
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-10, 10, -10);
        this.scene.add(fillLight);

        // 点光源（增强氛围）
        const pointLight = new THREE.PointLight(0x667eea, 0.3, 50);
        pointLight.position.set(0, 5, 0);
        this.scene.add(pointLight);
    }

    setupCameraControls() {
        // 相机平移控制 - 支持鼠标和触摸
        let isDragging = false;
        let previousPosition = { x: 0, y: 0 };
        const panSpeed = 0.08;

        // 记录相机的目标位置
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.onCameraMove = null;

        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousPosition = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                this.handlePan(e.clientX, e.clientY, previousPosition);
                previousPosition = { x: e.clientX, y: e.clientY };
                if (this.onCameraMove) this.onCameraMove();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                previousPosition = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
                e.preventDefault();
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches.length === 1) {
                this.handlePan(
                    e.touches[0].clientX,
                    e.touches[0].clientY,
                    previousPosition
                );
                previousPosition = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
                if (this.onCameraMove) this.onCameraMove();
                e.preventDefault();
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            isDragging = false;
        });

        // 禁用右键菜单
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 鼠标滚轮缩放
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 2;
            const delta = e.deltaY > 0 ? 1 : -1;

            // 沿着相机方向缩放
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);

            this.camera.position.addScaledVector(direction, -delta * zoomSpeed);

            // 限制最小和最大距离
            const distance = this.camera.position.distanceTo(this.cameraTarget);
            if (distance < 10) {
                const dir = new THREE.Vector3().subVectors(this.camera.position, this.cameraTarget).normalize();
                this.camera.position.copy(this.cameraTarget).add(dir.multiplyScalar(10));
            } else if (distance > 100) {
                const dir = new THREE.Vector3().subVectors(this.camera.position, this.cameraTarget).normalize();
                this.camera.position.copy(this.cameraTarget).add(dir.multiplyScalar(100));
            }

            if (this.onCameraMove) this.onCameraMove();
        }, { passive: false });
    }

    handlePan(currentX, currentY, previous) {
        const deltaX = currentX - previous.x;
        const deltaY = currentY - previous.y;

        // 计算相机的右方向
        const right = new THREE.Vector3();
        right.crossVectors(this.camera.up, this.camera.getWorldDirection(new THREE.Vector3())).normalize();

        // 计算相机的前方向（投影到水平面）
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        // 平移相机和目标点
        const moveX = right.multiplyScalar(-deltaX * 0.08);
        const moveZ = forward.multiplyScalar(deltaY * 0.08);

        this.camera.position.add(moveX);
        this.camera.position.add(moveZ);

        this.cameraTarget.add(moveX);
        this.cameraTarget.add(moveZ);

        this.camera.lookAt(this.cameraTarget);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}
