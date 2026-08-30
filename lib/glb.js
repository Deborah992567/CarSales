/* ============================================================
   Cars NG — lib/glb.js
   Minimal GLB (glTF binary) loader for static single-scene models.

   Reads the JSON + BIN chunks, bakes each node's world transform
   into its mesh geometry, builds THREE Materials from the PBR
   factors, and returns a group normalised to `targetHeight`
   with its floor sitting on y = 0.
   ============================================================ */
import * as THREE from './three.module.min.js';

const RNORM = { 5126: 1, 5120: 127, 5121: 255, 5122: 32767, 5123: 65535, 5125: 1 };
const SIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const COMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

function mat4Mult(a, b) {
    const o = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            o[i * 4 + j] =
                a[i * 4 + 0] * b[0 * 4 + j] +
                a[i * 4 + 1] * b[1 * 4 + j] +
                a[i * 4 + 2] * b[2 * 4 + j] +
                a[i * 4 + 3] * b[3 * 4 + j];
        }
    }
    return o;
}

function mat4Compose(t, q, s) {
    const x = q[0], y = q[1], z = q[2], w = q[3];
    const xx = x * x, yy = y * y, zz = z * z;
    const xy = x * y, xz = x * z, yz = y * z;
    const wx = w * x, wy = w * y, wz = w * z;
    const sx = s[0], sy = s[1], sz = s[2];
    const o = new Float32Array(16);
    o[0] = (1 - 2 * (yy + zz)) * sx;  o[4] = 2 * (xy - wz) * sy;       o[8] = 2 * (xz + wy) * sz;       o[12] = t[0];
    o[1] = 2 * (xy + wz) * sx;        o[5] = (1 - 2 * (xx + zz)) * sy; o[9] = 2 * (yz - wx) * sz;       o[13] = t[1];
    o[2] = 2 * (xz - wy) * sx;        o[6] = 2 * (yz + wx) * sy;       o[10] = (1 - 2 * (xx + yy)) * sz; o[14] = t[2];
    o[3] = 0; o[7] = 0; o[11] = 0; o[15] = 1;
    return o;
}

function transformPoint(m, p) {
    return [
        m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
        m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
        m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
    ];
}

function transformNormal(m, p) {
    const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2];
    const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2];
    const z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2];
    const l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
}

function decode(bin, json, acc) {
    const bv = json.bufferViews[acc.bufferView];
    const compCount = COMP[acc.type] || 3;
    const bytes = SIZE[acc.componentType] || 4;
    const stride = bv.byteStride || compCount * bytes;
    const base = (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const out = new Float32Array(acc.count * compCount);
    const outStride = compCount;
    for (let i = 0; i < acc.count; i++) {
        const o = base + i * stride;
        for (let c = 0; c < compCount; c++) {
            let v;
            switch (acc.componentType) {
                case 5126: v = bin.getFloat32(o + c * bytes, true); break;
                case 5120: v = bin.getInt8(o + c * bytes); break;
                case 5121: v = bin.getUint8(o + c * bytes); break;
                case 5122: v = bin.getInt16(o + c * bytes, true); break;
                case 5123: v = bin.getUint16(o + c * bytes, true); break;
                case 5125: v = bin.getUint32(o + c * bytes, true); break;
                default: v = 0;
            }
            if (acc.normalized) {
                v /= RNORM[acc.componentType] || 1;
                if (acc.componentType === 5120 || acc.componentType === 5122) v = Math.max(-1, Math.min(1, v));
            }
            out[i * outStride + c] = v;
        }
    }
    return out;
}

function loadGLB(url, targetHeight = 2.7) {
    return fetch(url)
        .then(r => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.arrayBuffer();
        })
        .then(buf => {
            const dv = new DataView(buf);
            if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('not a GLB');
            let json = null, bin = null;
            let off = 12;
            while (off < buf.byteLength) {
                const len = dv.getUint32(off, true);
                const type = dv.getUint32(off + 4, true);
                const data = buf.slice(off + 8, off + 8 + len);
                if (type === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(data));
                if (type === 0x004E4942) bin = new DataView(data);
                off += 8 + len;
            }
            if (!json || !bin) throw new Error('chunks missing');

            /* bake world matrices per node */
            const stack = (json.scenes[json.scene] || json.scenes[0]).nodes || [];
            const out = { meshes: [], box: { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] } };

            const bakeMesh = (meshIdx, M) => {
                const mesh = json.meshes[meshIdx];
                mesh.primitives.forEach((prim, k) => {
                    const attrs = prim.attributes;
                    const pos = attrs.POSITION != null ? decode(bin, json, json.accessors[attrs.POSITION]) : null;
                    const nrm = attrs.NORMAL != null ? decode(bin, json, json.accessors[attrs.NORMAL]) : null;
                    const uv = attrs.TEXCOORD_0 != null ? decode(bin, json, json.accessors[attrs.TEXCOORD_0]) : null;
                    const matIdx = prim.material;

                    const vPos = new Float32Array(pos.length);
                    let vNrm = null;
                    if (nrm) vNrm = new Float32Array(nrm.length);
                    for (let i = 0; i < pos.length; i += 3) {
                        const t = transformPoint(M, [pos[i], pos[i + 1], pos[i + 2]]);
                        vPos[i] = t[0]; vPos[i + 1] = t[1]; vPos[i + 2] = t[2];
                        if (nrm) {
                            const n = transformNormal(M, [nrm[i], nrm[i + 1], nrm[i + 2]]);
                            vNrm[i] = n[0]; vNrm[i + 1] = n[1]; vNrm[i + 2] = n[2];
                        }
                    }

                    const geo = new THREE.BufferGeometry();
                    geo.setAttribute('position', new THREE.BufferAttribute(vPos, 3));
                    if (vNrm) geo.setAttribute('normal', new THREE.BufferAttribute(vNrm, 3));
                    if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));

                    if (prim.indices != null) {
                        const ia = json.accessors[prim.indices];
                        const raw = decode(bin, json, ia);
                        const arr = raw[0] > 65535 ? new Uint32Array(raw) : new Uint16Array(raw);
                        geo.setIndex(new THREE.BufferAttribute(arr, 1));
                    }

                    let mat = null;
                    if (matIdx != null) {
                        const m = json.materials[matIdx];
                        const pbr = m.pbrMetallicRoughness || {};
                        const c = pbr.baseColorFactor || [1, 1, 1, 1];
                        const alpha = c[3] === undefined ? 1 : c[3];
                        mat = new THREE.MeshStandardMaterial({
                            name: m.name,
                            color: new THREE.Color(c[0], c[1], c[2]),
                            metalness: pbr.metallicFactor === undefined ? 1 : pbr.metallicFactor,
                            roughness: pbr.roughnessFactor === undefined ? 1 : pbr.roughnessFactor,
                            transparent: alpha < 1,
                            opacity: alpha,
                            depthWrite: alpha >= 1,
                            side: THREE.DoubleSide,
                        });
                    } else {
                        mat = new THREE.MeshStandardMaterial({
                            color: 0xcccccc, metalness: .6, roughness: .4, side: THREE.DoubleSide,
                        });
                    }

                    const meshObj = new THREE.Mesh(geo, mat);
                    meshObj.name = (mesh.name || 'mesh') + '_' + k;
                    out.meshes.push(meshObj);

                    const bb = new THREE.Box3().setFromBufferAttribute(geo.getAttribute('position'));
                    if (bb.min.x < out.box.min[0]) out.box.min[0] = bb.min.x;
                    if (bb.min.y < out.box.min[1]) out.box.min[1] = bb.min.y;
                    if (bb.min.z < out.box.min[2]) out.box.min[2] = bb.min.z;
                    if (bb.max.x > out.box.max[0]) out.box.max[0] = bb.max.x;
                    if (bb.max.y > out.box.max[1]) out.box.max[1] = bb.max.y;
                    if (bb.max.z > out.box.max[2]) out.box.max[2] = bb.max.z;
                });
            };

            const visit = (ni, parentM) => {
                const n = json.nodes[ni];
                const M = n.matrix
                    ? new Float32Array(n.matrix)
                    : mat4Compose(n.translation || [0, 0, 0], n.rotation || [0, 0, 0, 1], n.scale || [1, 1, 1]);
                const world = parentM ? mat4Mult(parentM, M) : M;
                if (n.mesh != null) bakeMesh(n.mesh, world);
                (n.children || []).forEach(c => visit(c, world));
            };
            stack.forEach(r => visit(r, null));

            /* normalise: floor at y=0, centered, scaled to target height */
            const h = out.box.max[1] - out.box.min[1];
            const s = h > 0 ? targetHeight / h : 1;
            const cx = (out.box.max[0] + out.box.min[0]) / 2 * s;
            const cz = (out.box.max[2] + out.box.min[2]) / 2 * s;
            const shiftY = -out.box.min[1] * s;
            const group = new THREE.Group();
            out.meshes.forEach(m => {
                m.position.set(-cx, shiftY, -cz);
                m.scale.setScalar(s);
                group.add(m);
            });
            out.box.max[0] = s * out.box.max[0] - cx;
            out.box.min[0] = s * out.box.min[0] - cx;
            out.box.max[2] = s * out.box.max[2] - cz;
            out.box.min[2] = s * out.box.min[2] - cz;
            out.box.max[1] = targetHeight;
            out.box.min[1] = 0;
            out.group = group;
            return out;
        });
}

export { loadGLB };