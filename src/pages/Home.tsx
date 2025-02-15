import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text3D, Center, Float, Cloud } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

import { portfolioItems, PortfolioItem } from "../data/portfolio";

const FloatingLights = ({ count = 10, area = "cloud" }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <pointLight
        key={i}
        position={
          area === "cloud"
            ? [
                Math.random() * 20 - 10,
                Math.random() * 2 - 1,
                Math.random() * 1,
              ]
            : [
                Math.random() * 3 - 2,
                Math.random() * 1.5 - 0.75,
                Math.random() - 0.1,
              ]
        }
        intensity={Math.random() * 2 + 1}
        color={i % 2 === 0 ? "#ffcc00" : "#ffffff"}
      />
    ))}
  </>
);

const ThunderCloud = () => {
  const lightRef = useRef<THREE.PointLight | null>(null);

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.intensity = Math.random() > 0.97 ? 10 : 0;
    }
  });

  return (
    <>
      <Cloud
        opacity={0.9}
        speed={0.3}
        scale={[1.5, 1, 1]}
        segments={40}
        color="#333"
      />
      <pointLight
        ref={lightRef}
        position={[0, 2, -2]}
        intensity={0}
        color="#ffffff"
      />
      <FloatingLights count={15} area="cloud" />
    </>
  );
};

const ProjectCard: React.FC<{ project: PortfolioItem }> = ({ project }) => (
  <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform">
    <img
      src={project.image}
      alt={project.title}
      className="w-full h-32 object-cover"
    />
    <div className="p-3 text-center text-white font-bold">{project.title}</div>
    <div className="flex justify-center gap-2 p-2">
      {[
        { href: project.demo, label: "デモ", color: "bg-green-600" },
        {
          href: project.youtube,
          label: "YouTube",
          color: "bg-red-600",
          external: true,
        },
        {
          href: project.blog,
          label: "ブログ",
          color: "bg-blue-600",
          external: true,
        },
      ].map(({ href, label, color, external }) => (
        <a
          key={label}
          href={href}
          className={`w-1/3 px-4 py-2 ${color} text-white font-bold text-center rounded-lg shadow-md hover:scale-105 transition-transform`}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {label}
        </a>
      ))}
    </div>
  </div>
);

const Home: React.FC = () => (
  <div className="bg-gray-900 text-white w-full min-h-screen flex flex-col">
    <div className="w-full h-[50vh]">
      <Canvas camera={{ position: [0, 0, 6] }} className="w-full h-full">
        <ambientLight intensity={0.3} />
        <ThunderCloud />
        <Float speed={4} rotationIntensity={1} floatIntensity={2}>
          <Center>
            <Text3D
              font="/fonts/Roboto_Bold.json"
              size={0.75}
              height={0.2}
              curveSegments={12}
              bevelEnabled
              bevelThickness={0.02}
              bevelSize={0.02}
              bevelOffset={0}
              bevelSegments={5}
            >
              PORTFOLIO
              <meshStandardMaterial
                color="#00ff08"
                emissive="#00ff08"
                emissiveIntensity={0.8}
                roughness={0.1}
                metalness={0.8}
              />
            </Text3D>
          </Center>
        </Float>
        <FloatingLights count={5} area="text" />
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            intensity={1.5}
          />
        </EffectComposer>
        <OrbitControls />
      </Canvas>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {portfolioItems.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  </div>
);

export default Home;
