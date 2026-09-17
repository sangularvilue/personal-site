"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type GlobePoint = { lat: number; lon: number };
const GREAT_LAKES: GlobePoint[][] = [
  // Simplified shorelines retain the five lakes at the globe's viewing scale.
  [
    { lat: 46.35, lon: -92.1 }, { lat: 47.1, lon: -91.0 },
    { lat: 47.85, lon: -89.7 }, { lat: 48.0, lon: -88.1 },
    { lat: 47.7, lon: -86.6 }, { lat: 47.05, lon: -86.15 },
    { lat: 46.48, lon: -87.0 }, { lat: 46.28, lon: -88.5 },
    { lat: 46.42, lon: -90.15 }, { lat: 46.1, lon: -91.5 },
  ],
  [
    { lat: 45.85, lon: -88.95 }, { lat: 46.2, lon: -88.15 },
    { lat: 45.8, lon: -87.25 }, { lat: 44.8, lon: -86.8 },
    { lat: 43.5, lon: -86.62 }, { lat: 42.28, lon: -86.92 },
    { lat: 41.72, lon: -87.52 }, { lat: 42.0, lon: -88.18 },
    { lat: 43.3, lon: -88.45 }, { lat: 44.65, lon: -88.7 },
  ],
  [
    { lat: 45.9, lon: -84.95 }, { lat: 46.3, lon: -84.1 },
    { lat: 45.95, lon: -83.0 }, { lat: 45.15, lon: -82.65 },
    { lat: 44.3, lon: -82.75 }, { lat: 43.55, lon: -82.35 },
    { lat: 43.18, lon: -82.58 }, { lat: 43.65, lon: -83.25 },
    { lat: 44.45, lon: -83.75 }, { lat: 45.05, lon: -84.8 },
  ],
  [
    { lat: 42.15, lon: -83.18 }, { lat: 42.55, lon: -82.5 },
    { lat: 42.48, lon: -81.4 }, { lat: 42.3, lon: -80.25 },
    { lat: 42.15, lon: -79.15 }, { lat: 41.8, lon: -79.1 },
    { lat: 41.5, lon: -80.0 }, { lat: 41.45, lon: -81.45 },
    { lat: 41.55, lon: -82.65 },
  ],
  [
    { lat: 43.92, lon: -79.15 }, { lat: 44.22, lon: -78.2 },
    { lat: 44.3, lon: -77.2 }, { lat: 44.05, lon: -76.65 },
    { lat: 43.65, lon: -76.7 }, { lat: 43.45, lon: -77.45 },
    { lat: 43.5, lon: -78.45 },
  ],
];
const toVector = (p: GlobePoint, r = 1.018) => {
  const phi = ((p.lon + 180) * Math.PI) / 180,
    theta = ((90 - p.lat) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.cos(phi) * Math.sin(theta),
    r * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
  );
};

export default function Globe({
  guess,
  answer,
  locked,
  onGuess,
  view,
}: {
  guess: GlobePoint | null;
  answer: GlobePoint | null;
  locked: boolean;
  onGuess: (p: GlobePoint) => void;
  view?: GlobePoint & { distance: number };
}) {
  const mountRef = useRef<HTMLDivElement>(null),
    onGuessRef = useRef(onGuess),
    controlsRef = useRef<OrbitControls | null>(null),
    lockedRef = useRef(locked);
  const markers = useRef<{
    guess?: THREE.Mesh;
    answer?: THREE.Mesh;
    route?: THREE.Line;
    scene?: THREE.Scene;
  }>({});
  onGuessRef.current = onGuess;
  lockedRef.current = locked;
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    markers.current.scene = scene;
    if (view) camera.position.copy(toVector(view, view.distance));
    else camera.position.set(0, 0.08, 3.25);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    const texture = new THREE.TextureLoader().load(
      "/thenthere/earth-natural.webp",
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1, 256, 192),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.88 }),
    );
    scene.add(globe);
    const lakes = new THREE.Group();
    for (const shoreline of GREAT_LAKES) {
      const center = shoreline.reduce(
        (sum, point) => sum.add(toVector(point, 1.003)),
        new THREE.Vector3(),
      ).normalize().multiplyScalar(1.003);
      const vertices = [center, ...shoreline.map((point) => toVector(point, 1.003))];
      const indices: number[] = [];
      for (let i = 1; i <= shoreline.length; i++) {
        indices.push(0, i, i === shoreline.length ? 1 : i + 1);
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
      geometry.setIndex(indices);
      lakes.add(new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ color: 0x3b78a5, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
      ));
    }
    scene.add(lakes);
    scene.add(new THREE.HemisphereLight(0xd9efff, 0x071021, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 2.6);
    sun.position.set(-3, 3, 4);
    scene.add(sun);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 1.08;
    controls.maxDistance = 5.2;
    controls.zoomSpeed = 0.8;
    controls.rotateSpeed = 0.3;
    controls.enableDamping = false;
    controls.enableRotate = true;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    controlsRef.current = controls;
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    const activePointers = new Set<number>();
    let tap: { id: number; x: number; y: number } | null = null;
    const markAt = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(globe)[0];
      if (hit?.uv)
        onGuessRef.current({
          // SphereGeometry stores v inverted (north is 1), so this keeps the
          // selected point aligned with the globe texture.
          lat: hit.uv.y * 180 - 90,
          lon: hit.uv.x * 360 - 180,
        });
    };
    const pointerDown = (e: PointerEvent) => {
      activePointers.add(e.pointerId);
      tap = activePointers.size === 1 && e.button === 0 && !lockedRef.current
        ? { id: e.pointerId, x: e.clientX, y: e.clientY }
        : null;
    };
    const pointerMove = (e: PointerEvent) => {
      if (tap?.id === e.pointerId &&
          Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 5) tap = null;
    };
    const pointerUp = (e: PointerEvent) => {
      pointerMove(e);
      const shouldMark = tap?.id === e.pointerId && !lockedRef.current;
      tap = null;
      activePointers.delete(e.pointerId);
      if (shouldMark) markAt(e);
    };
    const pointerCancel = (e: PointerEvent) => {
      tap = null;
      activePointers.delete(e.pointerId);
    };
    const cancelTap = () => { tap = null; };
    // Observe gestures before OrbitControls releases pointer capture. A drag,
    // pinch, wheel zoom, or canceled gesture must never place a dot.
    renderer.domElement.addEventListener("pointerdown", pointerDown, true);
    renderer.domElement.addEventListener("pointermove", pointerMove, true);
    renderer.domElement.addEventListener("pointerup", pointerUp, true);
    renderer.domElement.addEventListener("pointercancel", pointerCancel, true);
    renderer.domElement.addEventListener("lostpointercapture", pointerCancel, true);
    renderer.domElement.addEventListener("wheel", cancelTap, { passive: true });
    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", pointerDown, true);
      renderer.domElement.removeEventListener("pointermove", pointerMove, true);
      renderer.domElement.removeEventListener("pointerup", pointerUp, true);
      renderer.domElement.removeEventListener("pointercancel", pointerCancel, true);
      renderer.domElement.removeEventListener("lostpointercapture", pointerCancel, true);
      renderer.domElement.removeEventListener("wheel", cancelTap);
      controls.dispose();
      if (controlsRef.current === controls) controlsRef.current = null;
      texture.dispose();
      globe.geometry.dispose();
      (globe.material as THREE.Material).dispose();
      lakes.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        (object.material as THREE.Material).dispose();
      });
      [
        markers.current.guess,
        markers.current.answer,
        markers.current.route,
      ].forEach((marker) => {
        if (!marker) return;
        marker.geometry.dispose();
        (marker.material as THREE.Material).dispose();
      });
      renderer.dispose();
      mount.replaceChildren();
    };
  }, []);
  useEffect(() => {
    const s = markers.current;
    if (!s.scene) return;
    if (s.guess) {
      s.scene.remove(s.guess);
      s.guess.geometry.dispose();
      (s.guess.material as THREE.Material).dispose();
      delete s.guess;
    }
    if (guess) {
      s.guess = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 18, 18),
        new THREE.MeshBasicMaterial({ color: 0xfde593 }),
      );
      s.guess.position.copy(toVector(guess));
      s.scene.add(s.guess);
    }
  }, [guess]);
  useEffect(() => {
    const s = markers.current;
    if (!s.scene) return;
    if (s.answer) {
      s.scene.remove(s.answer);
      s.answer.geometry.dispose();
      (s.answer.material as THREE.Material).dispose();
      delete s.answer;
    }
    if (answer) {
      s.answer = new THREE.Mesh(
        new THREE.SphereGeometry(0.031, 18, 18),
        new THREE.MeshBasicMaterial({ color: 0x2fc472 }),
      );
      s.answer.position.copy(toVector(answer, 1.022));
      s.scene.add(s.answer);
    }
  }, [answer]);
  useEffect(() => {
    const s = markers.current;
    if (!s.scene) return;
    if (s.route) {
      s.scene.remove(s.route);
      s.route.geometry.dispose();
      (s.route.material as THREE.Material).dispose();
      delete s.route;
    }
    if (!guess || !answer) return;

    // A lifted great-circle path gives the reveal a physical sense of the
    // miss without drawing an arbitrary flat line across the map.
    const from = toVector(guess, 1).normalize();
    const to = toVector(answer, 1).normalize();
    const angle = Math.acos(THREE.MathUtils.clamp(from.dot(to), -1, 1));
    const sinAngle = Math.sin(angle);
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      const direction =
        sinAngle < 0.0001
          ? from.clone()
          : from
              .clone()
              .multiplyScalar(Math.sin((1 - t) * angle) / sinAngle)
              .add(to.clone().multiplyScalar(Math.sin(t * angle) / sinAngle));
      const lift =
        1.028 + Math.sin(Math.PI * t) * (0.045 + 0.12 * (angle / Math.PI));
      points.push(direction.normalize().multiplyScalar(lift));
    }
    s.route = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: 0xfde593,
        transparent: true,
        opacity: 0.9,
      }),
    );
    s.scene.add(s.route);
  }, [guess, answer]);
  const nudgeZoom = (direction: 1 | -1) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object;
    const offset = camera.position.clone().sub(controls.target);
    const nextDistance = THREE.MathUtils.clamp(
      offset.length() * (direction === 1 ? 0.78 : 1.28),
      controls.minDistance,
      controls.maxDistance,
    );
    camera.position.copy(
      controls.target.clone().add(offset.setLength(nextDistance)),
    );
    controls.update();
  };
  return (
    <div className="tt-globe-shell">
      <div
        ref={mountRef}
        className={`tt-globe ${locked ? "is-locked" : ""}`}
        aria-label={`Interactive globe. Drag to rotate. ${locked ? "" : "Click to place a dot. "}Scroll or pinch to zoom.`}
      />
      <div className="tt-globe-zoom" aria-label="Globe zoom controls">
        <button
          type="button"
          onClick={() => nudgeZoom(-1)}
          aria-label="Zoom globe out"
          title="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => nudgeZoom(1)}
          aria-label="Zoom globe in"
          title="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  );
}
