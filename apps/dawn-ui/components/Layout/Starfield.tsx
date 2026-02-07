// Final_Dawn_of_Eideus/apps/dawn-ui/components/Layout/Starfield.tsx

import React, { useRef, useEffect } from 'react';

interface StarfieldProps {
    // mapping 'warping' to the requested effect where stars stretch to all 4 edges
    flightState: 'idle' | 'retracting' | 'warping' | 'flying';
}

// Background Galaxy Components (Static)
const BrightStar: React.FC<{ className?: string, color?: string }> = ({ className = '', color = 'white' }) => (
    <div className={`absolute ${className}`}>
        <div className={`w-1 h-1 bg-${color} rounded-full shadow-[0_0_20px_4px_${color}] relative`}>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40px] h-[1px] bg-gradient-to-r from-transparent via-${color} to-transparent opacity-80`} />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-[40px] bg-gradient-to-b from-transparent via-${color} to-transparent opacity-80`} />
            <div className="absolute inset-0 bg-white blur-[1px] rounded-full" />
        </div>
    </div>
);

const SpiralGalaxy: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div style={style} className="absolute w-[400px] h-[400px] opacity-80 mix-blend-screen pointer-events-none transition-opacity duration-1000">
        <div className="absolute inset-0 bg-radial-gradient from-cyan-100 via-blue-900/40 to-transparent blur-2xl"
            style={{ background: 'radial-gradient(circle, rgba(200,240,255,0.8) 0%, rgba(30,64,175,0.3) 30%, transparent 70%)' }} />
        <div className="absolute inset-[-20%] w-[140%] h-[140%] animate-spin-slow opacity-60">
            <div className="w-full h-full rounded-full"
                style={{
                    background: 'repeating-conic-gradient(from 0deg, transparent 0deg, transparent 40deg, rgba(6,182,212,0.1) 45deg, rgba(30,64,175,0.2) 60deg, transparent 70deg)',
                    maskImage: 'radial-gradient(circle, transparent 20%, black 50%, transparent 70%)'
                }}
            />
        </div>
        <BrightStar className="top-[40%] left-[45%]" color="cyan-200" />
        <BrightStar className="top-[60%] right-[35%]" color="blue-100" />
        <BrightStar className="top-[25%] left-[30%]" color="white" />
    </div>
);

const EllipticalGalaxy: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div style={style} className="absolute w-[300px] h-[250px] opacity-90 mix-blend-screen pointer-events-none transition-opacity duration-1000">
        <div className="absolute inset-0 rounded-[50%]"
            style={{
                background: 'radial-gradient(ellipse at center, rgba(255,250,220,0.95) 0%, rgba(253,186,116,0.6) 20%, rgba(234,88,12,0.2) 50%, transparent 80%)',
                boxShadow: '0 0 80px rgba(253,186,116,0.2)'
            }} />
        <BrightStar className="top-[45%] left-[40%]" color="yellow-100" />
        <BrightStar className="top-[55%] left-[55%]" color="orange-100" />
        <BrightStar className="top-[30%] right-[40%]" color="white" />
    </div>
);

const IrregularGalaxy: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div style={style} className="absolute w-[350px] h-[350px] opacity-70 mix-blend-screen pointer-events-none transition-opacity duration-1000">
        <div className="absolute top-0 left-0 w-full h-full filter blur-3xl">
            <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-purple-600/30 rounded-full" />
            <div className="absolute bottom-[30%] right-[20%] w-[50%] h-[50%] bg-pink-600/30 rounded-full" />
            <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-fuchsia-500/20 rounded-full" />
        </div>
        <div className="absolute top-[30%] left-[30%] w-[40%] h-[10%] bg-black/40 blur-xl rotate-45" />
        <BrightStar className="top-[30%] left-[30%]" color="fuchsia-200" />
        <BrightStar className="bottom-[40%] right-[30%]" color="pink-200" />
        <BrightStar className="top-[50%] left-[50%]" color="purple-100" />
    </div>
);

export const Starfield: React.FC<StarfieldProps> = ({ flightState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -9999, y: -9999 });
    const flightStateRef = useRef(flightState);

    // Keep ref in sync for animation loop
    useEffect(() => {
        flightStateRef.current = flightState;
    }, [flightState]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        interface Star {
            x: number;
            y: number;
            z: number;
            originX: number;
            originY: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
            alpha: number;
            twinkleSpeed: number;
            twinkleDir: number;
            prevX?: number;
            prevY?: number;
        }
        let stars: Star[] = [];
        const colors = ['#ffffff', '#bfdbfe', '#fef9c3', '#fee2e2'];
        const numStars = 300;

        const initStars = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars = [];

            for (let i = 0; i < numStars; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                stars.push({
                    x,
                    y,
                    z: Math.random() * canvas.width,
                    originX: x,
                    originY: y,
                    vx: 0,
                    vy: 0,
                    // Smaller stars for higher density realism
                    size: Math.random() < 0.7 ? 0.8 : Math.random() < 0.95 ? 1.2 : 2.0,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    alpha: 0.3 + Math.random() * 0.7,
                    twinkleSpeed: 0.005 + Math.random() * 0.02,
                    twinkleDir: Math.random() < 0.5 ? 1 : -1,
                    prevX: x,
                    prevY: y
                });
            }
        };

        const animate = () => {
            const currentState = flightStateRef.current;
            const centerW = canvas.width / 2;
            const centerH = canvas.height / 2;

            if (currentState === 'warping') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            } else if (currentState === 'flying') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            } else {
                ctx.fillStyle = 'rgba(2, 2, 2, 1)';
            }

            if (currentState === 'idle' || currentState === 'retracting') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            const mouse = mouseRef.current;
            const tugStrength = 0.15;
            const friction = 0.9;
            const springFactor = 0.04;
            const mouseRadius = 250;

            stars.forEach(star => {
                star.prevX = star.x;
                star.prevY = star.y;

                if (currentState === 'idle' || currentState === 'retracting') {
                    const dx = mouse.x - star.x;
                    const dy = mouse.y - star.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouseRadius) {
                        const angle = Math.atan2(dy, dx);
                        const force = (mouseRadius - distance) / mouseRadius;
                        star.vx += Math.cos(angle) * force * tugStrength;
                        star.vy += Math.sin(angle) * force * tugStrength;
                    }

                    const homeDx = star.originX - star.x;
                    const homeDy = star.originY - star.y;
                    star.vx += homeDx * springFactor;
                    star.vy += homeDy * springFactor;

                    star.vx *= friction;
                    star.vy *= friction;
                    star.x += star.vx;
                    star.y += star.vy;

                    star.alpha += star.twinkleSpeed * star.twinkleDir;
                    if (star.alpha > 1) { star.alpha = 1; star.twinkleDir = -1; }
                    else if (star.alpha < 0.2) { star.alpha = 0.2; star.twinkleDir = 1; }

                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                    ctx.fillStyle = star.color;
                    ctx.globalAlpha = star.alpha;
                    ctx.fill();

                } else if (currentState === 'warping') {
                    // --- FLAT WARP ENTRY PHYSICS ---
                    const dx = star.x - centerW;
                    const dy = star.y - centerH;
                    const distFromCenter = Math.sqrt(dx * dx + dy * dy);

                    // Fast expansion relative to the screen center
                    const angle = Math.atan2(dy, dx);
                    const warpSpeed = 25 + (distFromCenter * 0.18);

                    star.x += Math.cos(angle) * warpSpeed;
                    star.y += Math.sin(angle) * warpSpeed;

                    // RECYCLE TO FLAT HORIZONTAL ORIGIN
                    // If star leaves bounds, reset it to a horizontal horizon in the vertical center.
                    if (star.x < 0 || star.x > canvas.width || star.y < 0 || star.y > canvas.height) {
                        star.x = (Math.random() * canvas.width * 0.9) + (canvas.width * 0.05); // Spread across width
                        star.y = centerH + (Math.random() - 0.5) * 2; // Flat blade origin (2px spread)
                        star.prevX = star.x;
                        star.prevY = star.y;
                    }

                    // Draw stretching trail
                    ctx.beginPath();
                    ctx.moveTo(star.prevX!, star.prevY!);
                    ctx.lineTo(star.x, star.y);
                    ctx.strokeStyle = `rgba(220, 250, 255, ${Math.min(0.8, distFromCenter / (canvas.width * 0.4))})`;
                    ctx.lineWidth = star.size * 0.8;
                    ctx.lineCap = 'round';
                    ctx.stroke();

                } else if (currentState === 'flying') {
                    star.z -= 15;
                    if (star.z <= 0) {
                        star.z = canvas.width;
                        star.x = (Math.random() * canvas.width - centerW) * (canvas.width / star.z) + centerW;
                        star.y = (Math.random() * canvas.height - centerH) * (canvas.width / star.z) + centerH;
                        star.prevX = star.x;
                        star.prevY = star.y;
                    }

                    const k = 128.0 / star.z;
                    const px = (star.x - centerW) * k + centerW;
                    const py = (star.y - centerH) * k + centerH;

                    if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
                        const dist = Math.sqrt(Math.pow(px - star.prevX!, 2) + Math.pow(py - star.prevY!, 2));
                        if (dist < 100) {
                            ctx.beginPath();
                            ctx.moveTo(star.prevX!, star.prevY!);
                            ctx.lineTo(px, py);
                            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - star.z / canvas.width})`;
                            ctx.lineWidth = Math.max(0.5, (1 - star.z / canvas.width) * 3);
                            ctx.stroke();
                        }
                    }
                    star.prevX = px;
                    star.prevY = py;
                }
            });

            animationId = requestAnimationFrame(animate);
        };

        const onResize = () => initStars();
        const onMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouseMove);

        initStars();
        animate();

        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    const galaxyOpacity = flightState === 'idle' || flightState === 'retracting' ? 1 : 0;

    return (
        <div className="absolute inset-0 z-0 bg-[#020202] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0b0b15_0%,#000000_100%)] opacity-80" />

            <div style={{ opacity: galaxyOpacity, transition: 'opacity 2s ease-in-out' }}>
                <SpiralGalaxy style={{ top: '-5%', left: '5%', transform: 'scale(0.8) rotate(-10deg)' }} />
                <EllipticalGalaxy style={{ top: '35%', right: '2%', transform: 'scale(0.9)' }} />
                <IrregularGalaxy style={{ bottom: '-5%', left: '15%', transform: 'scale(1.1) rotate(20deg)' }} />
            </div>

            <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />
        </div>
    );
};