import React from 'react';
import { Vector3, Color } from 'three';

export const ShipModel: React.FC<{
    engineColor: Color;
    leftPlumeRef: any;
    rightPlumeRef: any;
    engineLeftMatRef: any;
    engineRightMatRef: any;
    boosting: boolean;
    weaponLevel: number;
    landingGear?: number; // 0 to 1
}> = ({ engineColor, leftPlumeRef, rightPlumeRef, engineLeftMatRef, engineRightMatRef, boosting, weaponLevel, landingGear = 0 }) => {

    const gunScale = 1 + (weaponLevel * 0.5);

    return (
        <group rotation={[0, Math.PI, 0]}>
            {/* Main Fuselage */}
            <mesh position={[0, 0, -2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.5, 1.2, 8, 8]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.6} />
            </mesh>
            {/* Cockpit */}
            <mesh position={[0, 0.8, -1]} scale={[0.8, 0.6, 1.5]}>
                <capsuleGeometry args={[1, 1, 4, 8]} />
                <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.9} />
            </mesh>
            {/* Rear Engine Block */}
            <mesh position={[0, 0.2, 3]}>
                <boxGeometry args={[3, 1.5, 3]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.5} />
            </mesh>
            {/* Wings & Engines */}
            {[-1, 1].map((side) => (
                <group key={side} position={[2.5 * side, 0, 2]}>
                    <mesh position={[-0.5 * side, 0, 0]} rotation={[0, 0, 0.2 * side]}>
                        <boxGeometry args={[3, 0.2, 4]} />
                        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.5} />
                    </mesh>
                    <mesh position={[1 * side, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.8, 0.6, 6, 16]} />
                        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.7} />
                    </mesh>
                    <mesh position={[1 * side, 0, 3.1]}>
                        <circleGeometry args={[0.5, 16]} />
                        <meshBasicMaterial ref={side === -1 ? engineLeftMatRef : engineRightMatRef} color="#60a5fa" toneMapped={false} />
                    </mesh>
                    <group ref={side === -1 ? leftPlumeRef : rightPlumeRef} position={[1 * side, 0, 3.2]}>
                        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.6]}>
                            <cylinderGeometry args={[0.4, 0.1, 3.4, 16, 1, true]} />
                            <meshBasicMaterial transparent opacity={0.4} color="#a5f3fc" depthWrite={false} blending={2} />
                        </mesh>
                    </group>
                </group>
            ))}
            {/* Weapons */}
            {[-1, 1].map(side => (
                <group key={side} position={[3.5 * side, -0.2, 0]} scale={[gunScale, gunScale, gunScale]}>
                    <mesh><boxGeometry args={[0.2, 0.2, 3]} /><meshStandardMaterial color="#333" /></mesh>
                    <mesh position={[0, 0, -1.5]}><boxGeometry args={[0.1, 0.1, 1]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" /></mesh>
                </group>
            ))}
            {/* Decals */}
            <mesh position={[0, 0.51, -2]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.8, 4]} />
                <meshStandardMaterial color="#ef4444" roughness={0.8} />
            </mesh>

            {/* Landing Gear */}
            {landingGear > 0.05 && (
                <group position={[0, -0.2 * landingGear, 0]}>
                    {/* Front Leg */}
                    <mesh position={[0, -0.4, -2.5]}>
                        <boxGeometry args={[0.2, 0.8, 0.2]} />
                        <meshStandardMaterial color="#475569" />
                    </mesh>
                    {/* Rear Legs */}
                    {[-1, 1].map(side => (
                        <mesh key={side} position={[1.2 * side, -0.4, 1.5]}>
                            <boxGeometry args={[0.2, 0.8, 0.2]} />
                            <meshStandardMaterial color="#475569" />
                        </mesh>
                    ))}
                </group>
            )}
        </group>
    );
};