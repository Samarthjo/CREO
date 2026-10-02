import { Color, HalfFloatType, LinearMipmapLinearFilter, Matrix4, Mesh, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Vector2, Vector3, Vector4, WebGLRenderTarget } from "three";
import type { Scene, WebGLRenderer } from "three";
import { floorFragment, floorVertex, GROUND_HEX, mirrorUniform } from "./shaders";

/** Layer 1 holds everything that appears in the floor reflection (tiles). The glass, shadows and the floor are left out. */
export const MIRROR_LAYER = 1;

export function createFloor(glow: { col: Color; at: Vector4 }) {
  const rt = new WebGLRenderTarget(4, 4, { type: HalfFloatType, samples: 0, generateMipmaps: true, minFilter: LinearMipmapLinearFilter });
  const texMat = new Matrix4();
  const material = new ShaderMaterial({
    uniforms: {
      tRefl: { value: rt.texture },
      uTexMat: { value: texMat },
      uCam: { value: new Vector3() },
      uGround: { value: new Color(GROUND_HEX) },
      uTaps: { value: 3 },
      uTexel: { value: new Vector2(1, 1) },
      uQuiet: { value: new Vector4(0.04, 0.5, 0.56, 0.94) },
      uQuietK: { value: 1 },
      uRes: { value: new Vector2(1, 1) },
      uGlassX: { value: 0 },
      uDither: { value: 0 },
      uGlowCol: { value: glow.col },
      uGlowAt: { value: glow.at },
    },
    vertexShader: floorVertex,
    fragmentShader: floorFragment,
  });
  const mesh = new Mesh(new PlaneGeometry(160, 160).rotateX(-Math.PI / 2), material);
  mesh.frustumCulled = false;

  const cam = new PerspectiveCamera();
  cam.layers.set(MIRROR_LAYER);
  const bias = new Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  const f = new Vector3();
  const t = new Vector3();
  const up = new Vector3();
  const clear = new Color();

  /** Render the scene as seen in the plane y = 0. The alpha channel of the target carries height (see shaders.ts). */
  function render(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera) {
    const p = camera.position;
    cam.position.set(p.x, -p.y, p.z);
    f.set(0, 0, -1).applyQuaternion(camera.quaternion);
    t.copy(p).add(f);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    cam.up.set(up.x, -up.y, up.z);
    cam.lookAt(t.x, -t.y, t.z);
    cam.fov = camera.fov;
    cam.aspect = camera.aspect;
    cam.near = camera.near;
    cam.far = camera.far;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    texMat.copy(bias).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
    material.uniforms.uCam!.value.copy(p);

    const prevRT = renderer.getRenderTarget();
    const prevBg = scene.background;
    const prevAlpha = renderer.getClearAlpha();
    renderer.getClearColor(clear);
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
    mirrorUniform.value = 1;
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, cam);
    mirrorUniform.value = 0;
    renderer.setRenderTarget(prevRT);
    renderer.setClearColor(clear, prevAlpha);
    scene.background = prevBg;
  }

  return {
    mesh,
    material,
    render,
    setSize(w: number, h: number) {
      rt.setSize(Math.max(2, w), Math.max(2, h));
      material.uniforms.uTexel!.value.set(1 / rt.width, 1 / rt.height);
    },
    dispose() {
      rt.dispose();
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
