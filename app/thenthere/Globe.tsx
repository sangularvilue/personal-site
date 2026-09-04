"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type GlobePoint = { lat: number; lon: number };
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
    onGuessRef = useRef(onGuess);
  const markers = useRef<{
    guess?: THREE.Mesh;
    answer?: THREE.Mesh;
    route?: THREE.Line;
    scene?: THREE.Scene;
  }>({});
  onGuessRef.current = onGuess;
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    markers.current.scene = scene;
    if (view) camera.position.copy(toVector(view, view.distance));
    else camera.position.set(0, 0.08, 3.25);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    const texture = new THREE.TextureLoader().load(
      "/thenthere/earth-natural.webp",
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1, 128, 96),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.88 }),
    );
    globe.rotation.y = -0.12;
    scene.add(globe);
    scene.add(new THREE.HemisphereLight(0xd9efff, 0x071021, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 2.6);
    sun.position.set(-3, 3, 4);
    scene.add(sun);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.rotateSpeed = 0.55;
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;
    const pointerDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const pointerUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7)
        return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(globe)[0];
      if (hit?.uv)
        onGuessRef.current({
          lat: hit.uv.y * 180 - 90,
          lon: hit.uv.x * 360 - 180,
        });
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", pointerUp);
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
      controls.dispose();
      texture.dispose();
      globe.geometry.dispose();
      (globe.material as THREE.Material).dispose();
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
  return (
    <div
      ref={mountRef}
      className={`tt-globe ${locked ? "is-locked" : ""}`}
      aria-label="Interactive globe. Drag to rotate; click to choose a place."
    />
  );
}
