/* ============================================================
   VELOCITY — Three.js 3D showroom scenes
   Hero: stylized concept car in a particle stage
   CTA : kinetic energy ring
   ============================================================ */
import * as THREE from '../lib/three.module.min.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, 2);

function safe(cb) {
    try { return cb(); } catch (e) { console.warn('[3D] muted:', e.message); return null; }
}

/* ---------------- shared helpers ---------------- */
function makeRenderer(canvas) {
    const r = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
    });
    r.setPixelRatio(DPR);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.1;
    return r;
}

function onMouse(target) {
    const m = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
        m.x = (e.clientX / innerWidth) * 2 - 1;
        m.y = (e.clientY / innerHeight) * 2 - 1;
    });
    return m;
}

/* ---------------- hero scene ---------------- */
function initHero(canvas) {
    if (!canvas) return null;

    const renderer = makeRenderer(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 200);
    camera.position.set(0, 1.35, 9.2);

    scene.add(new THREE.HemisphereLight(0xbfd6ff, 0x0a0d16, .9));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(5, 8, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const neon = (color, x, y, z, i) => {
        const l = new THREE.PointLight(color, i, 16, 1.6);
        l.position.set(x, y, z);
        scene.add(l);
        return l;
    };
    const cyanLight = neon(0x38f0ff, 0, 4, -3, 26);
    const magentaLight = neon(0xff4d7d, 5, 1.4, 2.4, 18);
    const goldLight = neon(0xffcf7d, -5, 1.2, 1, 12);
    neon(0x38f0ff, -5, 5, -5, 6);

    /* --- stylized concept car --- */
    const car = new THREE.Group();

    const paint = new THREE.MeshPhysicalMaterial({
        color: 0x0e2236,
        metalness: .72,
        roughness: .28,
        clearcoat: 1,
        clearcoatRoughness: .12,
    });
    const glass = new THREE.MeshPhysicalMaterial({
        color: 0x9fd4de,
        metalness: .95,
        roughness: .08,
        transparent: true,
        opacity: .55,
        clearcoat: 1,
    });
    const trim = new THREE.MeshStandardMaterial({ color: 0x0a0b10, metalness: .9, roughness: .35 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xc9d4e6, metalness: 1, roughness: .18 });
    const glowCyan = new THREE.MeshBasicMaterial({ color: 0x38f0ff });
    const glowRed = new THREE.MeshBasicMaterial({ color: 0xff4d7d });

    const box = (w, h, d, mat, x, y, z, cast = true) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        if (cast) m.castShadow = true;
        car.add(m);
        return m;
    };

    /* low body slab */
    const bodyLow = box(5.1, .42, 1.72, paint, 0, .42, 0);
    /* tapered hood + trunk (scaled boxes give a wedge silhouette) */
    const hood = box(1.15, .34, 1.6, paint, 2.35, .4, 0);
    hood.scale.set(1, 1, .92);
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0, .5, 1.5, 4, 1), paint);
    nose.rotation.z = -Math.PI / 2;
    nose.scale.set(.9, 1.5, 1);
    nose.position.set(3.0, .18, 0);
    car.add(nose);

    /* rockers / side skirts */
    const skirtL = box(3.4, .16, .18, trim, 0, .16, -0.98);
    const skirtR = box(3.4, .16, .18, trim, 0, .16, 0.98);
    skirtL.rotation.z = -.04; skirtR.rotation.z = .04;

    /* cabin canopy (fastback glass) */
    const canopyMat = glass;
    const cabinBack = box(2.1, .5, 1.34, canopyMat, -.05, 1.02, 0);
    cabinBack.rotation.x = 0;
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.5, .42, 1.3), glass);
    windshield.position.set(.85, .94, 0);
    windshield.rotation.x = -.28;
    car.add(windshield);
    const roof = box(1.95, .1, 1.28, paint, .12, 1.32, 0);

    /* rear spoiler */
    const wing = box(1.7, .07, .34, paint, -2.55, 1.06, 0);
    const wingStands = box(.12, .2, .1, trim, -2.4, .96, -.55);
    const wingStands2 = box(.12, .2, .1, trim, -2.4, .96, .55);

    /* diffuser */
    box(.7, .2, 1.3, trim, -2.62, .24, 0);

    /* wheels */
    const wheelGeo = new THREE.CylinderGeometry(.46, .46, .34, 28);
    const rimGeo = new THREE.CylinderGeometry(.27, .27, .4, 20);
    const wheelPos = [[-1.55, .46, .95], [-1.55, .46, -.95], [1.7, .46, .95], [1.7, .46, -.95]];
    wheelPos.forEach(p => {
        const wheel = new THREE.Mesh(wheelGeo, trim);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(p[0], p[1], p[2]);
        wheel.castShadow = true;
        car.add(wheel);
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.rotation.z = Math.PI / 2;
        rim.position.set(p[0] + 0.0001, p[1], p[2]);
        car.add(rim);
    });

    /* headlight + taillight strips */
    const headL = new THREE.Mesh(new THREE.BoxGeometry(.06, .16, 1.15), glowCyan);
    headL.position.set(3.05, .42, 0);
    car.add(headL);
    headL.material.color.multiplyScalar(2);
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(.06, .16, 1.1), glowRed);
    tailL.position.set(-2.68, .48, 0);
    car.add(tailL);
    tailL.material.color.multiplyScalar(2);

    /* underglow disc */
    const glow = new THREE.Mesh(
        new THREE.CircleGeometry(1.6, 48),
        new THREE.MeshBasicMaterial({ color: 0x1fdcff, transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = .06;
    car.add(glow);

    car.position.y = .3;
    car.scale.setScalar(1.02);
    scene.add(car);

    /* --- showroom rings on the floor --- */
    const ringGeo = new THREE.TorusGeometry(3.4, .018, 12, 120);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38f0ff, transparent: true, opacity: .8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = .02;
    scene.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.85, .009, 10, 120), new THREE.MeshBasicMaterial({ color: 0xff4d7d, transparent: true, opacity: .45 }));
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = .015;
    scene.add(ring2);
    const ticks = 36;
    for (let i = 0; i < ticks; i += 3) {
        const a = (i / ticks) * Math.PI * 2;
        const t = new THREE.Mesh(new THREE.BoxGeometry(.03, .01, .5), new THREE.MeshBasicMaterial({ color: 0x38f0ff, transparent: true, opacity: .5 }));
        t.rotation.y = -a;
        t.position.set(Math.cos(a) * 3.6, .012, Math.sin(a) * 3.6);
        scene.add(t);
    }

    /* reflective floor */
    const floor = new THREE.Mesh(
        new THREE.CircleGeometry(20, 64),
        new THREE.MeshStandardMaterial({ color: 0x0a0d16, metalness: .9, roughness: .4 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    /* --- particle field --- */
    const N = 700;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const accentA = new THREE.Color(0x38f0ff);
    const accentB = new THREE.Color(0xff4d7d);
    const accentC = new THREE.Color(0xffcf7d);
    for (let i = 0; i < N; i++) {
        const r = 4 + Math.random() * 7;
        const a = Math.random() * Math.PI * 2;
        const y = (Math.random() - .5) * 6;
        pos[i * 3] = Math.cos(a) * r;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = Math.sin(a) * r;
        const c = [accentA, accentB, accentC][Math.floor(Math.random() * 3)];
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pMat = new THREE.PointsMaterial({
        size: .05, vertexColors: true, transparent: true, opacity: .85,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* starfield */
    const SN = 650;
    const spos = new Float32Array(SN * 3);
    for (let i = 0; i < SN; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = 60;
        spos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        spos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        spos[i * 3 + 2] = r * Math.cos(ph);
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
    const starMat = new THREE.PointsMaterial({
        size: .09, color: 0xffffff, transparent: true, opacity: .5, sizeAttenuation: false,
    });
    const stars = new THREE.Points(sGeo, starMat);
    scene.add(stars);

    /* --- interaction --- */
    const mouse = onMouse();
    let targetRotY = 0, targetTilt = 0;

    const onResize = () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight, false);
    };
    window.addEventListener('resize', onResize);
    onResize();
    renderer.setSize(innerWidth, innerHeight);

    const clock = new THREE.Clock();
    let raf = 0;

    const tick = () => {
        const t = clock.getElapsedTime();
        targetRotY += ((mouse.x * .5) - targetRotY) * .05;
        targetTilt += ((-mouse.y * .28) - targetTilt) * .05;

        car.rotation.y = Math.sin(t * .28) * .32 + targetRotY;
        car.rotation.x = targetTilt * .4 + Math.sin(t * .6) * .03;
        car.position.y = .3 + Math.sin(t * .85) * .08;

        particles.rotation.y = t * .045;
        particles.rotation.x = Math.sin(t * .11) * .05;
        stars.rotation.y = t * .006;
        ring.rotation.y = t * .05;
        ring2.rotation.z = -t * .09;

        cyanLight.position.x = Math.sin(t * .6) * 4.2;
        cyanLight.position.z = -3.2 + Math.cos(t * .6) * 1.4;
        magentaLight.position.y = 1.6 + Math.sin(t * .5) * .6;
        goldLight.intensity = 11 + Math.sin(t * 2.2) * 5;

        camera.position.x += ((mouse.x * .6) - camera.position.x) * .04;
        camera.position.y = 1.35 + (-mouse.y * .3);
        camera.lookAt(0, .5, 0);

        renderer.render(scene, camera);
        if (!reduced) raf = requestAnimationFrame(tick);
    };
    tick();

    return {
        dispose: () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
        }
    };
}

/* ---------------- CTA scene ---------------- */
function initCTA(canvas) {
    if (!canvas) return null;

    const renderer = makeRenderer(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, .1, 80);
    camera.position.set(0, .4, 8.5);

    const group = new THREE.Group();
    scene.add(group);

    /* spinning kinetic rings */
    const mats = [0x38f0ff, 0xff4d7d, 0xffcf7d, 0x7f9bff];
    const rings = mats.map((c, i) => {
        const g = new THREE.TorusGeometry(2.2 - i * .45, .02, 10, 90);
        const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .85 });
        const mesh = new THREE.Mesh(g, m);
        mesh.rotation.x = Math.PI / 2.2 + i * .35;
        mesh.rotation.y = i * .6;
        group.add(mesh);
        return mesh;
    });

    /* speedline particles */
    const CP = 260;
    const cpos = new Float32Array(CP * 3);
    const cc = new Float32Array(CP * 3);
    for (let i = 0; i < CP; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 1.4 + Math.random() * 3;
        cpos[i * 3] = Math.cos(a) * r;
        cpos[i * 3 + 1] = (Math.random() - .5) * 3.4;
        cpos[i * 3 + 2] = Math.sin(a) * r;
        const ac = mats[i % mats.length];
        const color = new THREE.Color(ac);
        cc[i * 3] = color.r; cc[i * 3 + 1] = color.g; cc[i * 3 + 2] = color.b;
    }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.BufferAttribute(cpos, 3));
    cg.setAttribute('color', new THREE.BufferAttribute(cc, 3));
    const cp = new THREE.Points(cg, new THREE.PointsMaterial({
        size: .045, vertexColors: true, transparent: true, opacity: .8,
        blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    group.add(cp);

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
        const t = clock.getElapsedTime();
        rings.forEach((m, i) => {
            m.rotation.z = t * (.35 + i * .15) * (i % 2 ? 1 : -1);
            m.rotation.x = Math.PI / 2.2 + i * .35 + Math.sin(t * .4 + i) * .12;
        });
        cp.rotation.y = t * .12;
        group.rotation.y = Math.sin(t * .3) * .3;
        renderer.render(scene, camera);
        if (!reduced) raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', onResize);
    onResize();

    return {
        dispose: () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
        }
    };
}

safe(() => initHero(document.getElementById('scene')));
safe(() => initCTA(document.getElementById('ctaScene')));