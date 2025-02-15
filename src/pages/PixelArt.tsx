import React, { useState, useRef, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Cloud, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

// --- 型定義 ---
type PixelInfo = {
  x: number;
  y: number;
  z: number;
  color: THREE.Color;
};

const DEFAULT_PIXEL_SIZE = 64; // 一度に表示するピクセル数
const ANIMATION_TIME = 3; // アニメーション時間（秒）

// --- PixelGrid: ピクセル全体を管理 ---
function PixelGrid({
  pixelSize,
  pixels,
  animation,
  fileChangeCount,
}: {
  pixelSize: number;
  pixels: PixelInfo[];
  animation: string;
  fileChangeCount: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // 表示アニメーション
  const [scales, setScales] = useState<number[]>(Array(pixels.length).fill(0));
  const progressShowRef = useRef(0); // 累積時間を管理する変数
  const batchIndexRef = useRef(0); // バッチのインデックスを管理する変数
  const fileChangeCountRef = useRef(0);

  React.useEffect(() => {
    if (fileChangeCount !== fileChangeCountRef.current) {
      setScales(Array(pixels.length).fill(0)); // ピクセルを全て非表示にする
      progressShowRef.current = 0;
      fileChangeCountRef.current = fileChangeCount;
      batchIndexRef.current = 0;
    }
  }, [fileChangeCount, pixels.length, pixelSize]);

  useFrame((_, delta) => {
    if (batchIndexRef.current > pixels.length / pixelSize) return; // 全てのpixelsを表示済み

    // 累積時間を増やす
    progressShowRef.current += delta;

    // バッチでスケールを拡大
    const threshold =
      batchIndexRef.current * (ANIMATION_TIME / (pixels.length / pixelSize));

    if (progressShowRef.current > threshold) {
      const newScales = [...scales];
      const start = batchIndexRef.current * pixelSize;
      const end = Math.min(start + pixelSize, pixels.length);

      for (let i = start; i < end; i++) {
        newScales[i] = 1;
      }

      setScales(newScales);
      batchIndexRef.current += 1;
    }
  });

  // --- 移動アニメーション ---
  const lastAnimationRef = useRef("default"); // 前回のアニメーションを管理する変数
  const progressRef = useRef(0); // アニメーションの進行度を管理する変数
  const scatterPositionsRef = useRef<{ x: number; y: number; z: number }[]>(
    pixels.map(() => ({
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
      z: (Math.random() - 0.5) * 100,
    }))
  );

  React.useEffect(() => {
    scatterPositionsRef.current = pixels.map(() => ({
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
      z: (Math.random() - 0.5) * 100,
    }));
  }, [pixels]);

  useFrame((_, delta) => {
    // アニメーションが変わったら進捗度を0に戻す
    if (animation !== lastAnimationRef.current) {
      lastAnimationRef.current = animation;
      progressRef.current = 0;
    }
    if (animation === "default") return; // デフォルトは何もしない

    if (progressRef.current < 1) {
      progressRef.current += delta / ANIMATION_TIME; // 進捗度を更新
      if (progressRef.current > 1) progressRef.current = 1; // 1を超えてしまったら、1にする
    }

    const animProgress = Math.sin((progressRef.current * Math.PI) / 2); // `0 → 1` のスムーズな補間
    pixels.forEach((pixel, i) => {
      let targetX = pixel.x;
      let targetY = pixel.y;
      let targetZ = pixel.z;

      if (animation === "explosion_start") {
        // scatterPositions: ランダムで座標を変更している
        // pixel: 元の座標
        // 元 ⇒ ばらばら
        targetX =
          scatterPositionsRef.current[i].x * animProgress +
          pixel.x * (1 - animProgress);
        targetY =
          scatterPositionsRef.current[i].y * animProgress +
          pixel.y * (1 - animProgress);
        targetZ =
          scatterPositionsRef.current[i].z * animProgress +
          pixel.z * (1 - animProgress);
      } else if (animation === "explosion_end") {
        // ばらばら → 戻る
        targetX =
          scatterPositionsRef.current[i].x * (1 - animProgress) +
          pixel.x * animProgress;
        targetY =
          scatterPositionsRef.current[i].y * (1 - animProgress) +
          pixel.y * animProgress;
        targetZ =
          scatterPositionsRef.current[i].z * (1 - animProgress) +
          pixel.z * animProgress;
      } else if (animation === "wave_start") {
        // 波のアニメーション
        targetZ =
          Math.sin((pixel.x + pixel.z + progressRef.current * 10) * 0.3) *
          5 *
          animProgress;
      } else if (animation === "wave_end") {
        // 波を元に戻す
        targetZ =
          Math.sin((pixel.x + pixel.z + (1 - progressRef.current) * 10) * 0.3) *
          5 *
          (1 - animProgress);
      }

      groupRef.current?.children[i]?.position.set(targetX, targetY, targetZ);
    });
  });

  return (
    <group ref={groupRef}>
      {pixels.map((pixel, i) => (
        <PixelBox key={i} pixel={pixel} scale={scales[i]} />
      ))}
    </group>
  );
}

// --- PixelBox: 各ピクセルのボックス ---
function PixelBox({ pixel, scale }: { pixel: PixelInfo; scale: number }) {
  return (
    <mesh position={[pixel.x, pixel.y, pixel.z]} scale={[scale, scale, scale]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={pixel.color} />
    </mesh>
  );
}

// --- Appコンポーネント ---
export default function PixelArt() {
  const [pixels, setPixels] = useState<PixelInfo[] | null>(null);
  const [tempPixelSize, setTempPixelSize] =
    useState<number>(DEFAULT_PIXEL_SIZE);
  const [pixelSize, setPixelSize] = useState<number>(tempPixelSize);
  const [fileChangeCount, setFileChangeCount] = useState<number>(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // 画像の再読み込み処理
  const reloadImage = () => {
    if (!imageSrc) return;
    setPixelSize(tempPixelSize); // ⭐️ pixelSize を更新
  };

  // pixelSizeが更新された後に画像を再生成
  React.useEffect(() => {
    if (!imageSrc) return;
    setFileChangeCount((prev) => prev + 1); // 変更カウントを更新
    const img = new Image();
    img.onload = () => {
      const pix = createPixelData(img, pixelSize, pixelSize);
      setPixels(pix);
    };
    img.src = imageSrc;
  }, [pixelSize, imageSrc]); // pixelSize が更新されたら処理を実行

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result;
      if (typeof url !== "string") return;
      setPixelSize(tempPixelSize);
      setImageSrc(url); // 🔥 ここでは `imageSrc` の更新だけを行う
    };
    reader.readAsDataURL(file);
  };

  // アニメーション制御
  const [animation, setAnimation] = useState("default");
  const controlExplosionAnimation = () => {
    // ばらばらにする
    setAnimation("explosion_start");
    // 1秒経ったら元に戻す
    setTimeout(() => {
      // 元に戻す
      console.log("explosion_end");
      setAnimation("explosion_end");
    }, ANIMATION_TIME * 1000);
    // 1秒経ったら元に戻す
    setTimeout(() => {
      // 元に戻す
      console.log("default");
      setAnimation("default");
    }, ANIMATION_TIME * 1000 * 2);
  };

  const controlWaveAnimation = () => {
    // ばらばらにする
    setAnimation("wave_start");
    // 1秒経ったら元に戻す
    setTimeout(() => {
      // 元に戻す
      setAnimation("wave_end");
    }, ANIMATION_TIME * 1000);
    // 1秒経ったら元に戻す
    setTimeout(() => {
      // 元に戻す
      setAnimation("default");
    }, ANIMATION_TIME * 1000 * 2);
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <div className="absolute top-4 left-4 bg-white shadow-lg p-4 rounded-lg z-10 w-64 space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        {/* ピクセルサイズ変更フィールド */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-700">Pixel Size:</label>
          <input
            type="number"
            value={tempPixelSize}
            onChange={(e) => setTempPixelSize(Number(e.target.value))}
            min="1"
            max="128"
            className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* 再表示ボタン */}
        <button
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
          onClick={reloadImage}
        >
          再表示
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            onClick={controlExplosionAnimation}
          >
            Explosion
          </button>
          <button
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            onClick={controlWaveAnimation}
          >
            Wave
          </button>
        </div>
      </div>
      <div className="absolute top-0 left-0 w-full h-full z-[1]">
        <Canvas camera={{ far: 5000, position: [0, 0, 100] }}>
          <ambientLight intensity={1} />
          <directionalLight position={[100, 200, 100]} intensity={1} />
          <OrbitControls />
          {pixels && (
            <PixelGrid
              pixelSize={pixelSize}
              pixels={pixels}
              animation={animation}
              fileChangeCount={fileChangeCount}
            />
          )}
        </Canvas>
      </div>
      <div className="absolute top-0 left-0 w-full h-full z-[-1]">
        <Canvas
          camera={{ position: [0, 5, 15], fov: 50 }}
          style={{ background: "black" }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color="white" />
          <BackgroundScene />
        </Canvas>
      </div>
    </div>
  );
}

// --- 画像からピクセル情報を抽出 ---
function createPixelData(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): PixelInfo[] {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context available");

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;

  const result: PixelInfo[] = [];
  let idx = 0;
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const r = data[idx],
        g = data[idx + 1],
        b = data[idx + 2],
        a = data[idx + 3];
      idx += 4;
      if (a < 30) continue;
      result.push({
        x: x - targetWidth / 2,
        y: -y + targetHeight / 2,
        z: 0,
        color: new THREE.Color(r / 255, g / 255, b / 255),
      });
    }
  }
  return result;
}

// --- 🎬 背景シーン（星＋煙） ---
const BackgroundScene = memo(() => {
  return (
    <>
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={6}
        saturation={1}
        fade
      />
      <Cloud
        position={[0, 0, 0]} // 雲のポジショニング
        opacity={0.1} // 不透明度
        speed={0.2} // 回転速度
        scale={[10, 10, 10]} // 雲全体の幅
        segments={20} // パーティクルの数
      />
    </>
  );
});
