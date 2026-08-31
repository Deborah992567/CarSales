/* ============================================================
   Cars NG — Three.js 3D showroom scenes
   Hero: a real GLB car on an orange showroom plinth. Hover it
   and the body splits apart (dismantle), reassembles, then lets
   you inside with a photographed interior cutaway before
   returning to the exterior. CTA: kinetic energy rings.
   ============================================================ */
import * as THREE from '../lib/three.module.min.js';
import { loadGLB } from '../lib/glb.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const INTERIOR_SRC = 'image/interior/interior-5.webp';
const CAR_GLB = 'lib/car.glb';
const CAR_YAW = Math.PI;   /* model's nose points -Z; flip to face the +Z camera */
const CAR_HEIGHT = 1.7;

/* perf tier — trim effects on low-memory / low-core devices so the
   showroom stays smooth on modest phones */
const ram = navigator.deviceMemory || 4;
const cores = navigator.hardwareConcurrency || 4;
const FAST = (ram >= 4 && cores >= 4) ? 1 : 0;
const DPR2 = Math.min(window.devicePixelRatio || 1, FAST ? 2 : 1);

/* choreography timing (seconds) */
const T_HOVER = { dismantle: 1.15, assemble: 1.0, interior: 2.0, return: 1.15 };

function safe(cb) { try { return cb(); } catch (e) { console.warn('[3D] muted:', e.message); return null; } }

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeOutBack(t) { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, k) { return a + (b - a) * k; }

function makeRenderer(canvas) {
    const r = new THREE.WebGLRenderer({
        canvas, alpha: true, antialias: true, powerPreference: 'high-performance',
    });
    r.setPixelRatio(DPR2);
    r.shadowMap.enabled = !!FAST;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.15;
    return r;
}

function onPointer() {
    const p = { x: 0, y: 0 };
    window.addEventListener('pointermove', (e) => {
        p.x = (e.clientX / innerWidth) * 2 - 1;
        p.y = (e.clientY / innerHeight) * 2 - 1;
    });
    return p;
}

function loadTex(src) {
    return new Promise((res) => {
        const img = new Image();
        img.onload = () => res(new THREE.CanvasTexture(img));
        img.onerror = () => res(null);
        img.src = src;
    });
}

/* ---------------- hero scene ---------------- */
function initHero(canvas) {
    if (!canvas) return null;
    const hintEl = document.getElementById('carHint');
    if (hintEl && reduced) hintEl.classList.add('hide');

    const renderer = makeRenderer(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .1, 200);
    const camBase = new THREE.Vector3(0, 1.55, 9.5);
    const camLook = new THREE.Vector3(0, .85, 0);
    const interiorCam = new THREE.Vector3(0, 1.0, 3.4);
    const interiorLook = new THREE.Vector3(0, 1.0, .3);
    camera.position.copy(camBase);

    scene.add(new THREE.HemisphereLight(0xfff3e4, 0xb8a68f, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(6, 9, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const neon = (color, x, y, z, i) => {
        const l = new THREE.PointLight(color, i, 20, 1.4);
        l.position.set(x, y, z);
        scene.add(l);
        return l;
    };
    const orangeLight = neon(0xff6b00, 0, 4.4, -6, 30);
    const amberLight = neon(0xffb35c, 6, 1.6, 3, 16);
    const whiteLight = neon(0xfff3e4, -6, 1.4, 2, 12);

    /* --- showroom rings on the floor --- */
    const addRing = (r, tube, color, op) => {
        const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 140),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op }));
        m.rotation.x = -Math.PI / 2;
        m.position.y = .02;
        scene.add(m);
        return m;
    };
    const ring = addRing(4.1, .02, 0xff6b00, .85);
    const ring2 = addRing(4.6, .01, 0xffb35c, .45);
    const ticks = 40;
    for (let i = 0; i < ticks; i += 4) {
        const a = (i / ticks) * Math.PI * 2;
        const t = new THREE.Mesh(new THREE.BoxGeometry(.035, .012, .6),
            new THREE.MeshBasicMaterial({ color: 0xff6b00, transparent: true, opacity: .5 }));
        t.rotation.y = -a;
        t.position.set(Math.cos(a) * 4.35, .015, Math.sin(a) * 4.35);
        scene.add(t);
    }

    /* reflective plinth */
    const floor = new THREE.Mesh(
        new THREE.CircleGeometry(22, 64),
        new THREE.MeshStandardMaterial({ color: 0xf4efe6, metalness: .92, roughness: .3 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    /* --- particle field --- */
    const N = FAST ? 620 : 300;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const accentA = new THREE.Color(0xff6b00);
    const accentB = new THREE.Color(0xffb35c);
    const accentC = new THREE.Color(0xfff0df);
    for (let i = 0; i < N; i++) {
        const r = 4.6 + Math.random() * 8;
        const a = Math.random() * Math.PI * 2;
        const y = (Math.random() - .5) * 7;
        pos[i * 3] = Math.cos(a) * r;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = Math.sin(a) * r;
        const c = [accentA, accentB, accentC][Math.floor(Math.random() * 3)];
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
        size: .055, vertexColors: true, transparent: true, opacity: .8,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    scene.add(particles);

    /* starfield */
    const SN = FAST ? 700 : 320;
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
    const stars = new THREE.Points(sGeo, new THREE.PointsMaterial({
        size: .08, color: 0xfff6ea, transparent: true, opacity: .35, sizeAttenuation: false,
    }));
    scene.add(stars);

    /* --- the car (GLB) + fallback --- */
    const group = new THREE.Group();
    let meshes = [];
    let mats = [];
    let carFilled = false;
    let interiorTex = null;
    loadTex(INTERIOR_SRC).then(t => { interiorTex = t; });

    loadGLB(CAR_GLB, CAR_HEIGHT)
        .then(({ group: g, meshes: ms }) => {
            meshes = ms;
            mats = ms.map(m => m.material);
            g.name = 'car';
            g.rotation.y = CAR_YAW;
            group.add(g);
            carFilled = true;
            console.log('[Cars NG] hero model loaded:', ms.length, 'meshes');
        })
        .catch((e) => {
            console.warn('[Cars NG] GLB failed, using fallback:', e.message);
            buildFallbackCar();
        });

    function buildFallbackCar() {
        const mat = new THREE.MeshPhysicalMaterial({
            color: 0xff6b00, metalness: .5, roughness: .3, clearcoat: 1,
        });
        const slab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 1.1), mat);
        slab.position.y = .85;
        slab.name = 'car';
        group.add(slab);
        meshes = [slab];
        mats = [mat];
        carFilled = true;
    }

    /* clones for the split (left / right halves) */
    let halfL = null, halfR = null;
    const buildHalves = () => {
        if (halfL) return;
        halfL = new THREE.Group();
        halfR = new THREE.Group();
        meshes.forEach(m => {
            const mL = m.material.clone();
            const mR = m.material.clone();
            mL.transparent = true;
            mR.transparent = true;
            mL.clippingPlanes = [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)];
            mR.clippingPlanes = [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)];
            const l = new THREE.Mesh(m.geometry, mL);
            const r = new THREE.Mesh(m.geometry, mR);
            l.position.copy(m.position); l.scale.copy(m.scale);
            r.position.copy(m.position); r.scale.copy(m.scale);
            halfL.add(l); halfR.add(r);
        });
        halfL.visible = halfR.visible = false;
        group.add(halfL); group.add(halfR);
    };

    /* interior cutaway panel */
    let interior = null;
    const buildInterior = () => {
        if (interior) return;
        if (!interiorTex || !interiorTex.image) return;
        const tex = interiorTex;
        const ratio = tex.image.naturalHeight / tex.image.naturalWidth || 1;
        const w = 2.3, h = Math.min(2.3 * ratio, 1.9);
        const geo = new THREE.PlaneGeometry(w, h);
        const mat = new THREE.MeshBasicMaterial({
            map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide,
        });
        interior = new THREE.Mesh(geo, mat);
        interior.position.set(0, 1.0, .55);
        group.add(interior);
    };

    scene.add(group);

    function setupHalves() {
        if (!meshes.length) return;
        buildHalves();
        buildInterior();
    }

    /* --- choreography state machine --- */
    let phase = 'idle';       /* idle | dismantle | assemble | interior | return */
    let tPhase = 0;
    let halfSpread = 0;
    const pointer = onPointer();
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const sphere = new THREE.Sphere(new THREE.Vector3(0, .9, 0), 4.0);

    const startShow = () => {
        if (reduced || phase !== 'idle') return;
        phase = 'dismantle';
        tPhase = 0;
        choreoSetup();
        if (hintEl) hintEl.classList.add('hide');
    };
    const playSeg = (label) => {
        const dur = T_HOVER[label];
        return { t: clamp(tPhase / dur, 0, 1), done: tPhase >= dur };
    };

    /* during the choreography only the half-shells render */
    const choreoSetup = () => {
        mats.forEach(m => { m.visible = false; });
        if (halfL) { halfL.visible = true; halfR.visible = true; }
    };
    const choreoTearDown = () => {
        mats.forEach(m => { m.visible = true; });
        if (halfL) { halfL.visible = false; halfR.visible = false; }
    };
    const halfOpacity = (o) => {
        if (halfL) halfL.traverse(n => { if (n.isMesh) n.material.opacity = o; });
        if (halfR) halfR.traverse(n => { if (n.isMesh) n.material.opacity = o; });
    };
    const applySpread = () => {
        if (halfL) halfL.position.x = -halfSpread;
        if (halfR) halfR.position.x = halfSpread;
    };

    const tickChoreo = (dt) => {
        tPhase += dt;
        let seg;
        switch (phase) {
            case 'dismantle':
                seg = playSeg('dismantle');
                halfSpread = easeOutBack(seg.t) * 2.6;
                halfOpacity(1);
                applySpread();
                break;
            case 'assemble':
                seg = playSeg('assemble');
                halfSpread = easeOutCubic(1 - seg.t) * 2.6;
                halfOpacity(1);
                applySpread();
                break;
            case 'interior':
                seg = playSeg('interior');
                halfOpacity(1 - easeInOutCubic(seg.t) * .82);
                if (interior) {
                    interior.visible = true;
                    interior.material.opacity = easeOutCubic(seg.t) * .96;
                    const k = 1 + (1 - seg.t) * .35;
                    interior.scale.set(k, k, 1);
                }
                camera.position.lerp(interiorCam.clone(), Math.min(dt * 2.5, 1));
                camera.lookAt(interiorLook);
                break;
            case 'return':
                seg = playSeg('return');
                halfSpread = 0;
                applySpread();
                halfOpacity(easeInOutCubic(seg.t));
                if (interior) interior.material.opacity = 1 - easeInOutCubic(seg.t);
                camera.position.lerp(camBase.clone(), Math.min(dt * 3, 1));
                camera.lookAt(camLook);
                break;
            default:
                break;
        }

        if (phase === 'dismantle' && seg && seg.done) { phase = 'assemble'; tPhase = 0; }
        else if (phase === 'assemble' && seg && seg.done) { phase = 'interior'; tPhase = 0; }
        else if (phase === 'interior' && seg && seg.done) { phase = 'return'; tPhase = 0; }
        else if (phase === 'return' && seg && seg.done) {
            phase = 'idle'; tPhase = 0;
            if (interior) { interior.visible = false; interior.material.opacity = 0; }
            choreoTearDown();
            if (hintEl) hintEl.classList.remove('hide');
        }
    };

    const hitCar = () => {
        ndc.set(pointer.x, pointer.y);
        ray.setFromCamera(ndc, camera);
        if (ray.ray.intersectsSphere(sphere)) startShow();
    };

    /* tap / click also starts the tour — handy where there is no hover (touch) */
    const tapShow = (e) => {
        if (reduced || phase !== 'idle') return;
        ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        if (ray.ray.intersectsSphere(sphere)) startShow();
    };
    canvas.addEventListener('pointerdown', tapShow);

    /* keyboard: Enter / Space on the focusable canvas starts the tour */
    canvas.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startShow(); }
    });

    /* --- interaction / resize --- */
    const onResize = () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight, false);
    };
    window.addEventListener('resize', onResize);
    onResize();

    renderer.localClippingEnabled = true;

    /* survive a WebGL context loss (mobile / low-memory GPU) without a frozen scene */
    canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        active = false;
        cancelAnimationFrame(raf);
    }, false);
    canvas.addEventListener('webglcontextrestored', () => {
        active = true;
        clock.getDelta();
        if (!reduced) tick();
    }, false);

    const clock = new THREE.Clock();
    let raf = 0;
    let active = true;
    const visIO = new IntersectionObserver(([en]) => {
        active = en.isIntersecting;
        if (active && !reduced) tick();
    });
    visIO.observe(canvas);

    const tick = () => {
        if (!active && !reduced) return;
        const dt = Math.min(clock.getDelta(), .05) || .016;
        const t = clock.elapsedTime;

        if (carFilled) {
            setupHalves();
            if (phase === 'idle') {
                hitCar();
                group.rotation.y = CAR_YAW + Math.sin(t * .5) * .24 + pointer.x * .18;
                group.position.y = Math.sin(t * .8) * .06;
                ring.rotation.y = t * .05;
                ring2.rotation.z = -t * .09;
            } else {
                tickChoreo(dt);
            }
        }

        particles.rotation.y = t * .05;
        stars.rotation.y = t * .006;
        orangeLight.position.x = Math.sin(t * .55) * 5;
        orangeLight.position.z = -5 + Math.cos(t * .55) * 1.4;
        amberLight.intensity = 14 + Math.sin(t * 2.1) * 5;

        if (phase === 'idle') {
            camera.position.set(
                lerp(camera.position.x, pointer.x * .55, .03),
                lerp(camera.position.y, camBase.y, .03),
                lerp(camera.position.z, camBase.z, .03)
            );
            camera.lookAt(camLook);
        }

        renderer.render(scene, camera);
        if (!reduced && active) raf = requestAnimationFrame(tick);
    };
    tick();

    return {
        dispose: () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
            visIO.disconnect();
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

    const mats = [0xff6b00, 0xffb35c, 0xff9432, 0xf3ede4];
    const rings = mats.map((c, i) => {
        const g = new THREE.TorusGeometry(2.2 - i * .45, .02, 10, 90);
        const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .85 });
        const mesh = new THREE.Mesh(g, m);
        mesh.rotation.x = Math.PI / 2.2 + i * .35;
        mesh.rotation.y = i * .6;
        group.add(mesh);
        return mesh;
    });

    const CP = 260;
    const cpos = new Float32Array(CP * 3);
    const cc = new Float32Array(CP * 3);
    for (let i = 0; i < CP; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 1.4 + Math.random() * 3;
        cpos[i * 3] = Math.cos(a) * r;
        cpos[i * 3 + 1] = (Math.random() - .5) * 3.4;
        cpos[i * 3 + 2] = Math.sin(a) * r;
        const color = new THREE.Color(mats[i % mats.length]);
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
    let active = true;
    const visIO = new IntersectionObserver(([en]) => {
        active = en.isIntersecting;
        if (active && !reduced) tick();
    });
    visIO.observe(canvas);
    const clock = new THREE.Clock();
    const onResize = () => {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', onResize);
    onResize();
    const tick = () => {
        if (!active && !reduced) return;
        const t = clock.getElapsedTime();
        rings.forEach((m, i) => {
            m.rotation.z = t * (.35 + i * .15) * (i % 2 ? 1 : -1);
            m.rotation.x = Math.PI / 2.2 + i * .35 + Math.sin(t * .4 + i) * .12;
        });
        cp.rotation.y = t * .12;
        group.rotation.y = Math.sin(t * .3) * .3;
        renderer.render(scene, camera);
        if (!reduced && active) raf = requestAnimationFrame(tick);
    };
    tick();

    return {
        dispose: () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
            visIO.disconnect();
            renderer.dispose();
        }
    };
}

const hero = safe(() => initHero(document.getElementById('scene')));
if (!hero) {
    document.body.classList.add('no-3d');
    if (window.VELOCITY_DEBUG) console.log('[Cars NG] WebGL unavailable — showing static hero.');
}
safe(() => initCTA(document.getElementById('ctaScene')));