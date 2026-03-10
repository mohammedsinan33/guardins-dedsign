import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import logo from '../assets/Guardians_logo.png'; 

export default function Home() {
  const mountRef = useRef(null);
  const logoRef = useRef(null); 

  useEffect(() => {
    // ---- 1. SETUP SCENE, CAMERA, RENDERER ----
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0015);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    if (mountRef.current) {
        mountRef.current.innerHTML = ''; 
        mountRef.current.appendChild(renderer.domElement);
    }

    // ---- 2. CREATE PROFESSIONAL PARTICLE NETWORK ----
    const group = new THREE.Group();
    scene.add(group);

    const particleCount = 500; 
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalY = new Float32Array(particleCount); 
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1200;     
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1200; 
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1200; 
      originalY[i] = positions[i * 3 + 1]; 
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvasTexture = document.createElement('canvas');
    canvasTexture.width = 32;
    canvasTexture.height = 32;
    const context = canvasTexture.getContext('2d');
    const radGradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    radGradient.addColorStop(0, 'rgba(255,255,255,1)');
    radGradient.addColorStop(0.2, 'rgba(255, 215, 0, 1)'); 
    radGradient.addColorStop(0.5, 'rgba(218, 165, 32, 0.4)'); 
    radGradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = radGradient;
    context.fillRect(0, 0, 32, 32);

    const starTexture = new THREE.CanvasTexture(canvasTexture);

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffe666, 
      size: 15, 
      map: starTexture, 
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    group.add(particles);

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xaa8800,
      transparent: true,
      opacity: 0.2, 
      blending: THREE.AdditiveBlending
    });
    
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const x1 = positions[i * 3], y1 = positions[i * 3 + 1], z1 = positions[i * 3 + 2];
        const x2 = positions[j * 3], y2 = positions[j * 3 + 1], z2 = positions[j * 3 + 2];
        
        const distance = Math.sqrt((x1-x2)**2 + (y1-y2)**2 + (z1-z2)**2);
        
        if (distance < 120) { 
           linePositions.push(x1, y1, z1, x2, y2, z2);
        }
      }
    }
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    group.add(lines);

    // ---- 3. MOUSE INTERACTION ----
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    // Variables for continuous, smooth coin-spin rotation
    let currentLogoRotationY = 0;
    let logoSpinVelocity = 0;
    let lastMouseX = 0; 

    const handleMouseMove = (event) => {
      // Normalize mouse coordinates (-1 to +1)
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // Calculate how fast the mouse moved horizontally since the last event
      const mouseDeltaX = mouseX - lastMouseX;
      lastMouseX = mouseX;

      // Calculate the distance of the mouse from the center of the screen
      // mouseX and mouseY are already -1 to +1, so distance from center (0,0) is max ~1.4
      const distanceFromCenter = Math.sqrt(mouseX * mouseX + mouseY * mouseY);

      // Only add spin velocity if the mouse is close to the center (over the logo)
      // 0.4 means the inner 40% of the screen. Increase to 0.6 if the logo is wider.
      if (distanceFromCenter < 0.4) {
          logoSpinVelocity += mouseDeltaX * 30; 
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ---- 4. RENDER LOOP ----
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();

      // Background particle interactions
      targetX = mouseX * 1.2; 
      targetY = mouseY * 1.2; 
      
      group.rotation.x += 0.05 * (targetY - group.rotation.x);
      group.rotation.y += 0.05 * (targetX - group.rotation.y);
      
      group.rotation.y += 0.003; 
      group.rotation.z += 0.001; 
      
      // --- COIN SPIN LOGIC ---
      if (logoRef.current) {
        // Add current velocity to the total rotation
        currentLogoRotationY += logoSpinVelocity;
        
        // Apply friction so it gradually slows down to a stop (change 0.95 to 0.99 for longer spin)
        logoSpinVelocity *= 0.95; 

        // Apply ONLY Y-axis rotation (X axis is locked to 0)
        logoRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(${currentLogoRotationY}deg)`;
      }

      // Floating wave motion for lines and points
      const positionsAttr = geometry.attributes.position;
      for(let i=0; i<particleCount; i++) {
         positionsAttr.array[i * 3 + 1] = originalY[i] + Math.sin(time * 1.5 + i) * 15; 
      }
      positionsAttr.needsUpdate = true;
      
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // ---- 5. CLEANUP ----
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      
      if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
      }
      
      geometry.dispose();
      lineGeometry.dispose();
      particleMaterial.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, []); // <-- This closing bracket for useEffect was missing!

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-black via-[#0a0a0a] to-[#2a1e00] font-sans">
      
      <div ref={mountRef} className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none" />

      <div className="z-10 relative flex flex-col justify-center items-center w-full h-full p-4 selection:bg-yellow-500/30">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Logo Container */}
        <div className="relative hover:scale-105 transition-transform duration-700 ease-out z-20 flex justify-center items-center w-full" style={{ perspective: '1000px' }}>
            <img 
              ref={logoRef} 
              src={logo} 
              alt="Guardians Logo" 
              className="w-[800px] max-w-[80vw] h-auto object-contain drop-shadow-[0_0_40px_rgba(218,165,32,0.4)] animate-pulse-slow transition-transform duration-100 ease-out" 
            />
        </div>

        {/* Title / Typography Section */}
        <div className="mt-8 pointer-events-auto z-20 text-center w-full">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-white via-[rgb(212,176,91)] to-[rgba(212,176,91,0.6)] drop-shadow-[0_10px_20px_rgba(212,176,91,0.3)] mx-auto">
                Guardians
            </h1>
            <div className="w-1/2 h-[1px] mx-auto mt-6 bg-gradient-to-r from-transparent via-[rgb(212,176,91)] to-transparent opacity-80"></div>
        </div>
      </div>
    </div>
  );
}