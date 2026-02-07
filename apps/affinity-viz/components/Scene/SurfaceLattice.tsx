import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line, useCursor, Billboard, Sphere, Ring, Octahedron } from '@react-three/drei';
import { Group, Vector3, MathUtils, Color } from 'three';
import { Planet, Civilization, City, RuralZone } from '../../types';

interface SurfaceProps {
  planet: Planet;
  onBack: () => void;
  selectedCityId: string | null;
  selectedDistrictId: string | null;
  onSelectCity: (id: string) => void;
  onSelectDistrict: (id: string) => void;
}

// --- Layout Constants ---
const R_CIV = 35;       // Distance from Planet Core to Civ
const R_CITY = 18;      // Distance from Civ to City
const R_DIST = 10;      // Distance from City to District

// --- Helper: Calculate Web Layout ---
const useWebLayout = (planet: Planet) => {
    return useMemo(() => {
        const layout: any[] = [];
        
        planet.surfaceData.forEach((civ, i, civArr) => {
            // 1. Civ Position (Triangle/Circle around center)
            const civAngle = (i / civArr.length) * Math.PI * 2;
            const civPos = new Vector3(
                Math.cos(civAngle) * R_CIV,
                0,
                Math.sin(civAngle) * R_CIV
            );

            const cityNodes: any[] = [];

            civ.cities.forEach((city, j, cityArr) => {
                // 2. City Position (Fan out from Civ, away from center)
                // We use the Civ's angle as a base, and spread cities +/- 45 degrees
                const spread = Math.PI / 2;
                const offset = (j / (Math.max(cityArr.length - 1, 1))) * spread - (spread / 2);
                const cityAngle = civAngle + offset;
                
                const cityPos = new Vector3(
                    civPos.x + Math.cos(cityAngle) * R_CITY,
                    0,
                    civPos.z + Math.sin(cityAngle) * R_CITY
                );

                const districtNodes: any[] = [];

                city.districts.forEach((dist, k, distArr) => {
                    // 3. District Position (Fan out from City)
                    const dSpread = Math.PI * 0.8;
                    const dOffset = (k / (Math.max(distArr.length - 1, 1))) * dSpread - (dSpread / 2);
                    const dAngle = cityAngle + dOffset;

                    const distPos = new Vector3(
                        cityPos.x + Math.cos(dAngle) * R_DIST,
                        0,
                        cityPos.z + Math.sin(dAngle) * R_DIST
                    );

                    districtNodes.push({ data: dist, pos: distPos, parentPos: cityPos });
                });

                cityNodes.push({ data: city, pos: cityPos, parentPos: civPos, districts: districtNodes });
            });

            layout.push({ data: civ, pos: civPos, parentPos: new Vector3(0,0,0), cities: cityNodes });
        });
        return layout;
    }, [planet]);
};

export const SurfaceLattice: React.FC<SurfaceProps> = ({ 
  planet, 
  selectedCityId, 
  selectedDistrictId, 
  onSelectCity, 
  onSelectDistrict 
}) => {
  const groupRef = useRef<Group>(null);
  const layoutData = useWebLayout(planet);

  // Animation: Float the whole web gently
  useFrame(({ clock }) => {
    if (groupRef.current) {
        groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.2) * 2 - 10;
        groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.05) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      
      {/* Central Planet Core Hologram */}
      <group position={[0, 0, 0]}>
         <Sphere args={[4, 32, 32]}>
             <meshStandardMaterial color="#00a8ff" wireframe emissive="#004488" />
         </Sphere>
         <Billboard position={[0, 6, 0]}>
             <Text fontSize={3} color="white" outlineWidth={0.1} outlineColor="black">
                 {planet.name.toUpperCase()}
             </Text>
             <Text position={[0, -1.5, 0]} fontSize={1} color="#00a8ff">
                 PLANETARY DOMAIN WEB
             </Text>
         </Billboard>
         {/* Core Glow */}
         <pointLight color="#00a8ff" distance={50} intensity={2} />
      </group>

      {/* Render The Web */}
      {layoutData.map((civNode, i) => (
          <CivCluster 
            key={civNode.data.id} 
            node={civNode} 
            selectedCityId={selectedCityId}
            selectedDistrictId={selectedDistrictId}
            onSelectCity={onSelectCity}
            onSelectDistrict={onSelectDistrict}
          />
      ))}

    </group>
  );
};

const CivCluster: React.FC<{
    node: any,
    selectedCityId: string | null,
    selectedDistrictId: string | null,
    onSelectCity: (id: string) => void,
    onSelectDistrict: (id: string) => void
}> = ({ node, selectedCityId, selectedDistrictId, onSelectCity, onSelectDistrict }) => {
    // Dim logic: If a city is selected, and it's NOT in this cluster, dim this cluster
    const isClusterActive = !selectedCityId || node.cities.some((c: any) => c.data.id === selectedCityId);
    const opacity = isClusterActive ? 1 : 0.1;
    const lineColor = isClusterActive ? '#00f0ff' : '#1f2937';

    return (
        <group>
            {/* Connection to Core */}
            <Line 
                points={[node.parentPos, node.pos]} 
                color={lineColor} 
                transparent 
                opacity={opacity * 0.5} 
                lineWidth={1} 
            />

            {/* Civilization Node */}
            <group position={node.pos}>
                <Ring args={[3, 3.5, 6]} rotation={[-Math.PI/2, 0, 0]}>
                    <meshBasicMaterial color={lineColor} transparent opacity={opacity} side={2} />
                </Ring>
                <Billboard position={[0, 5, 0]}>
                    <Text fontSize={1.5} color={isClusterActive ? "#ffaa00" : "#444"}>
                        {node.data.name.toUpperCase()}
                    </Text>
                </Billboard>
                
                {/* Decoration: Rotating rings */}
                <RotatingRings active={isClusterActive} color={isClusterActive ? "#ffaa00" : "#444"} />
            </group>

            {/* Cities */}
            {node.cities.map((cityNode: any) => (
                <CityCluster 
                    key={cityNode.data.id}
                    node={cityNode}
                    parentVisible={isClusterActive}
                    selectedCityId={selectedCityId}
                    selectedDistrictId={selectedDistrictId}
                    onSelectCity={onSelectCity}
                    onSelectDistrict={onSelectDistrict}
                />
            ))}
        </group>
    );
};

const CityCluster: React.FC<{
    node: any,
    parentVisible: boolean,
    selectedCityId: string | null,
    selectedDistrictId: string | null,
    onSelectCity: (id: string) => void,
    onSelectDistrict: (id: string) => void
}> = ({ node, parentVisible, selectedCityId, selectedDistrictId, onSelectCity, onSelectDistrict }) => {
    const isSelected = selectedCityId === node.data.id;
    const isDimmed = selectedCityId && !isSelected;
    
    // If parent is hidden, we are hidden. If parent is visible but we aren't selected (and something else is), dim us.
    const finalOpacity = parentVisible ? (isDimmed ? 0.2 : 1) : 0.05;
    const color = isSelected ? '#00f0ff' : (isDimmed ? '#334155' : '#00a8ff');
    
    const [hovered, setHover] = useState(false);
    useCursor(hovered && !isDimmed);

    return (
        <group>
            {/* Connection to Civ */}
            <Line 
                points={[node.parentPos, node.pos]} 
                color={color} 
                transparent 
                opacity={finalOpacity * 0.6} 
                lineWidth={isSelected ? 2 : 1} 
            />

            {/* City Node */}
            <group position={node.pos}>
                 <mesh 
                    onClick={(e) => { e.stopPropagation(); onSelectCity(node.data.id); }}
                    onPointerOver={() => setHover(true)}
                    onPointerOut={() => setHover(false)}
                 >
                     <sphereGeometry args={[isSelected ? 2.5 : 1.5, 16, 16]} />
                     <meshStandardMaterial 
                        color={isSelected ? "#00f0ff" : "#1e293b"} 
                        emissive={color}
                        emissiveIntensity={isSelected ? 1 : 0.5}
                        transparent
                        opacity={finalOpacity}
                     />
                 </mesh>

                 {/* Label */}
                 {(hovered || isSelected || !selectedCityId) && (
                     <Billboard position={[0, 3.5, 0]}>
                        <Text 
                            fontSize={isSelected ? 1.2 : 0.8} 
                            color={isSelected ? "white" : "#94a3b8"}
                            outlineWidth={0.05}
                            outlineColor="black"
                        >
                            {node.data.name}
                        </Text>
                     </Billboard>
                 )}
            </group>

            {/* Districts (Only visible if this city is selected) */}
            {isSelected && node.districts.map((distNode: any) => (
                <DistrictNode 
                    key={distNode.data.id} 
                    node={distNode} 
                    isSelected={selectedDistrictId === distNode.data.id}
                    onSelect={() => onSelectDistrict(distNode.data.id)}
                />
            ))}
        </group>
    );
};

const DistrictNode: React.FC<{
    node: any,
    isSelected: boolean,
    onSelect: () => void
}> = ({ node, isSelected, onSelect }) => {
    const [hovered, setHover] = useState(false);
    useCursor(hovered);

    return (
        <group>
             {/* Connection to City */}
             <Line 
                points={[node.parentPos, node.pos]} 
                color={isSelected ? "#ff9f00" : "#00f0ff"} 
                transparent 
                opacity={0.3} 
                lineWidth={1} 
            />

            <group position={node.pos}>
                <mesh 
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    onPointerOver={() => setHover(true)}
                    onPointerOut={() => setHover(false)}
                    scale={isSelected ? 1.5 : 1}
                >
                    <Octahedron args={[0.8, 0]}>
                        <meshStandardMaterial 
                            color={node.data.resourceType === 'Mining' ? "#ef4444" : "#22c55e"} 
                            emissive={isSelected ? "#ffffff" : "#000000"}
                            emissiveIntensity={isSelected ? 0.5 : 0}
                            wireframe={!isSelected && !hovered}
                        />
                    </Octahedron>
                </mesh>
                
                {(hovered || isSelected) && (
                    <Billboard position={[0, 1.5, 0]}>
                        <Text fontSize={0.5} color={isSelected ? "#ff9f00" : "white"} outlineWidth={0.02} outlineColor="black">
                            {node.data.name}
                        </Text>
                    </Billboard>
                )}
            </group>
        </group>
    );
};

// Decorative Component
const RotatingRings: React.FC<{ active: boolean, color: string }> = ({ active, color }) => {
    const ref = useRef<Group>(null);
    useFrame(({ clock }) => {
        if (ref.current && active) {
            ref.current.rotation.z = clock.elapsedTime * 0.2;
            ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.5) * 0.2;
        }
    });
    return (
        <group ref={ref}>
            <Ring args={[4, 4.1, 32]} transparent opacity={active ? 0.3 : 0.05}>
                <meshBasicMaterial color={color} side={2} />
            </Ring>
            <Ring args={[5, 5.05, 32]} rotation={[0.5, 0, 0]} transparent opacity={active ? 0.2 : 0.05}>
                <meshBasicMaterial color={color} side={2} />
            </Ring>
        </group>
    );
};
