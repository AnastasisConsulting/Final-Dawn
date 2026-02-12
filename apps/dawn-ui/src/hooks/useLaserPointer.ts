import { useState, useEffect, useRef } from 'react';

export function useLaserPointer() {
    const [laserActive, setLaserActive] = useState(false);
    const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
    const scrollHistory = useRef<number[]>([]);
    const lastScrollTime = useRef<number>(0);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            const activeTag = (document.activeElement as HTMLElement)?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

            const now = Date.now();
            if (now - lastScrollTime.current > 500) {
                scrollHistory.current = [];
            }
            lastScrollTime.current = now;

            const dir = Math.sign(e.deltaY);
            const lastDir = scrollHistory.current[scrollHistory.current.length - 1];
            if (dir !== 0 && dir !== lastDir) {
                scrollHistory.current.push(dir);
            }

            if (scrollHistory.current.length >= 5) {
                setLaserActive(true);
                scrollHistory.current = [];
            }
        };

        window.addEventListener('wheel', handleWheel);
        return () => window.removeEventListener('wheel', handleWheel);
    }, []);

    useEffect(() => {
        if (!laserActive) {
            window.dispatchEvent(new CustomEvent('vizzy-laser-update', { detail: { active: false, x: 0, y: 0 } }));
            const existingStyle = document.getElementById('laser-cursor-style');
            if (existingStyle) existingStyle.remove();
            return;
        }

        const style = document.createElement('style');
        style.id = 'laser-cursor-style';
        style.innerHTML = `* { cursor: none !important; }`;
        document.head.appendChild(style);

        const handleMove = (e: MouseEvent) => {
            setLaserPos({ x: e.clientX, y: e.clientY });
            const normX = (e.clientX / window.innerWidth) * 2 - 1;
            const normY = -(e.clientY / window.innerHeight) * 2 + 1;
            window.dispatchEvent(new CustomEvent('vizzy-laser-update', { detail: { active: true, x: normX, y: normY } }));
        };

        const handleExit = () => setLaserActive(false);

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mousedown', handleExit);
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleExit(); };
        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mousedown', handleExit);
            window.removeEventListener('keydown', handleEsc);
            const existingStyle = document.getElementById('laser-cursor-style');
            if (existingStyle) existingStyle.remove();
        };
    }, [laserActive]);

    return { laserActive, laserPos, setLaserActive };
}
