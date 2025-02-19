// ReactおよびThree.js関連のライブラリをインポート
import React, { useState, useRef, memo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Cloud, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

// -----------------------------------------------------------------
// PixelInfo 型: 各ピクセルの位置（x, y, z）と色（THREE.Color）を管理
// -----------------------------------------------------------------
type PixelInfo = {
  x: number;
  y: number;
  z: number;
  color: THREE.Color;
};

// 定数設定：
// - DEFAULT_PIXEL_SIZE: 画像を縮小する際のデフォルトのサイズ（ピクセル数）
// - ANIMATION_TIME: アニメーションにかかる時間（秒）
const DEFAULT_PIXEL_SIZE = 64;
const ANIMATION_TIME = 3;

// ===================================================================
// PixelGridコンポーネント：
// - ピクセルデータのグループをレンダリングし、
// - 表示アニメーション（段階的な拡大）と移動アニメーション（爆発・波）を制御
// ===================================================================
type PixelGridProps = {
  pixelWidth: number;
  pixelHeight: number;
  pixels: PixelInfo[];
  animation: string;
  fileChangeCount: number;
};

const PixelGrid = ({
  pixelWidth,
  pixelHeight,
  pixels,
  animation,
  fileChangeCount,
}: PixelGridProps) => {
  // Three.js の Group オブジェクトへの参照。全ピクセルをまとめるために使用
  const groupRef = useRef<THREE.Group>(null);

  // ----------------------------------------------------
  // 表示アニメーション：ピクセルが段階的に表示される処理
  // ----------------------------------------------------
  // 各ピクセルのスケール状態を管理（初期状態は全て0＝非表示）
  const [scales, setScales] = useState<number[]>(Array(pixels.length).fill(0));
  // scaleProgressRef: バッチごとの表示進捗（累積時間）を保持
  const scaleProgressRef = useRef(0);
  // batchIndexRef: 現在表示中のバッチ番号を管理
  const batchIndexRef = useRef(0);
  // 画像ファイルが変更されたかを判定するための参照
  const prevFileChangeCountRef = useRef(fileChangeCount);

  // 画像再読み込み時に、全ピクセルの表示状態（スケール）をリセットする
  useEffect(() => {
    if (fileChangeCount !== prevFileChangeCountRef.current) {
      // ピクセルを全て非表示にするため、スケールを0にリセット
      setScales(Array(pixels.length).fill(0));
      // バッチ表示用の累積時間とバッチインデックスを初期化
      scaleProgressRef.current = 0;
      batchIndexRef.current = 0;
      // 変更回数の参照も更新
      prevFileChangeCountRef.current = fileChangeCount;
    }
  }, [fileChangeCount, pixels.length, pixelWidth, pixelHeight]);

  // useFrame で毎フレームの更新処理を行い、段階的にピクセルを表示
  useFrame((_, delta) => {
    // すべてのバッチが表示済みならこれ以上処理を行わない
    if (batchIndexRef.current > pixels.length / pixelWidth) return;

    // 前フレームからの経過時間を加算
    scaleProgressRef.current += delta;

    // 現在のバッチを表示するための時間の閾値を計算
    const threshold =
      batchIndexRef.current * (ANIMATION_TIME / (pixels.length / pixelWidth));

    // 経過時間が閾値を超えたら、次のバッチのピクセルを表示開始
    if (scaleProgressRef.current > threshold) {
      // 現在のスケール状態のコピーを作成
      const newScales = [...scales];
      // 現在のバッチに属するピクセルのインデックス範囲を算出
      const startIndex = batchIndexRef.current * pixelWidth;
      const endIndex = Math.min(startIndex + pixelWidth, pixels.length);

      // 該当するピクセルのスケールを1にして表示させる
      for (let i = startIndex; i < endIndex; i++) {
        newScales[i] = 1;
      }
      // 更新したスケール状態をセット
      setScales(newScales);
      // 次のバッチに進む
      batchIndexRef.current += 1;
    }
  });

  // ----------------------------------------------------
  // 移動アニメーション：爆発や波のエフェクトでピクセルの位置を変化
  // ----------------------------------------------------
  // 前回のアニメーション状態と比較し、変化があれば進行度をリセットするための参照
  const lastAnimationRef = useRef(animation);
  // アニメーションの進行度（0～1）を管理
  const animationProgressRef = useRef(0);

  // 各ピクセルに対しランダムな散乱先の座標を生成（爆発エフェクト用）
  const scatterPositionsRef = useRef(
    pixels.map(() => ({
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
      z: (Math.random() - 0.5) * 100,
    }))
  );

  // 画像やピクセルデータが更新された場合、ランダムな散乱座標を再生成する
  useEffect(() => {
    scatterPositionsRef.current = pixels.map(() => ({
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
      z: (Math.random() - 0.5) * 100,
    }));
  }, [pixels]);

  // useFrame で毎フレーム、各ピクセルの位置をアニメーション進捗に合わせて更新
  useFrame((_, delta) => {
    // アニメーション状態が変化した場合、進行度をリセットする
    if (animation !== lastAnimationRef.current) {
      lastAnimationRef.current = animation;
      animationProgressRef.current = 0;
    }
    // "default" 状態では位置の更新は行わない
    if (animation === "default") return;

    // アニメーションの進行度を更新（ANIMATION_TIMEで正規化）
    if (animationProgressRef.current < 1) {
      animationProgressRef.current += delta / ANIMATION_TIME;
      if (animationProgressRef.current > 1) animationProgressRef.current = 1;
    }
    // 補間を滑らかにするため、sin関数を利用して進行度を変換
    const smoothProgress = Math.sin(
      (animationProgressRef.current * Math.PI) / 2
    );

    // 各ピクセルの新しい位置を計算し、更新する
    pixels.forEach((pixel, i) => {
      // 基本のターゲット座標は元の座標
      let targetX = pixel.x;
      let targetY = pixel.y;
      let targetZ = pixel.z;

      // 爆発開始: 元の位置からランダムな散乱位置へ移動
      if (animation === "explosion_start") {
        targetX =
          scatterPositionsRef.current[i].x * smoothProgress +
          pixel.x * (1 - smoothProgress);
        targetY =
          scatterPositionsRef.current[i].y * smoothProgress +
          pixel.y * (1 - smoothProgress);
        targetZ =
          scatterPositionsRef.current[i].z * smoothProgress +
          pixel.z * (1 - smoothProgress);
      }
      // 爆発終了: 散乱位置から元の位置へ戻る
      else if (animation === "explosion_end") {
        targetX =
          scatterPositionsRef.current[i].x * (1 - smoothProgress) +
          pixel.x * smoothProgress;
        targetY =
          scatterPositionsRef.current[i].y * (1 - smoothProgress) +
          pixel.y * smoothProgress;
        targetZ =
          scatterPositionsRef.current[i].z * (1 - smoothProgress) +
          pixel.z * smoothProgress;
      }
      // 波の開始: XとZの座標に基づいて、Z軸方向に波の動きを与える
      else if (animation === "wave_start") {
        targetZ =
          Math.sin(
            (pixel.x + pixel.z + animationProgressRef.current * 10) * 0.3
          ) *
          5 *
          smoothProgress;
      }
      // 波の終了: 波の効果を徐々に打ち消して元の状態に戻す
      else if (animation === "wave_end") {
        targetZ =
          Math.sin(
            (pixel.x + pixel.z + (1 - animationProgressRef.current) * 10) * 0.3
          ) *
          5 *
          (1 - smoothProgress);
      }

      // 対応するピクセルのメッシュの位置を更新
      groupRef.current?.children[i]?.position.set(targetX, targetY, targetZ);
    });
  });

  // groupRefにより管理されるグループ内に、各PixelBoxコンポーネントを配置してレンダリング
  return (
    <group ref={groupRef}>
      {pixels.map((pixel, i) => (
        <PixelBox key={i} pixel={pixel} scale={scales[i]} />
      ))}
    </group>
  );
};

// ===================================================================
// PixelBoxコンポーネント：
// - 単一のピクセル（箱）を描画するためのコンポーネント
// ===================================================================
type PixelBoxProps = {
  pixel: PixelInfo;
  scale: number;
};

const PixelBox = ({ pixel, scale }: PixelBoxProps) => {
  // mesh: Three.js のオブジェクトで、位置とスケールを指定して箱ジオメトリとマテリアルを使用
  return (
    <mesh position={[pixel.x, pixel.y, pixel.z]} scale={[scale, scale, scale]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={pixel.color} />
    </mesh>
  );
};

// ===================================================================
// Appコンポーネント：
// - UIの全体管理（画像読み込み、ピクセルサイズ設定、アニメーション操作）
// - 2つのCanvas（ピクセルシーンと背景シーン）を配置
// ===================================================================
const PixelArt = () => {
  // 状態管理：
  // - pixels: 画像から生成されたピクセル情報の配列
  // - tempPixelSize: 入力フォーム上の一時的なピクセルサイズ
  // - pixelSize: 実際に適用されるピクセルサイズ
  // - fileChangeCount: 画像の変更回数（再読み込みのトリガーに使用）
  // - imageSrc: 読み込んだ画像のData URL
  // - animation: 現在のアニメーションモード
  const [pixels, setPixels] = useState<PixelInfo[] | null>(null);
  const [tempPixelWidth, setTempPixelWidth] =
    useState<number>(DEFAULT_PIXEL_SIZE);
  const [tempPixelHeight, setTempPixelHeight] =
    useState<number>(DEFAULT_PIXEL_SIZE);
  const [pixelWidth, setPixelWidth] = useState<number>(tempPixelWidth);
  const [pixelHeight, setPixelHeight] = useState<number>(tempPixelHeight);
  const [fileChangeCount, setFileChangeCount] = useState<number>(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [animation, setAnimation] = useState("default");

  // ----------------------------------------------------
  // 画像ファイルが選択されたときの処理：
  // - ファイルを読み込み、Data URLに変換して imageSrc にセット
  // ----------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result;
      if (typeof url !== "string") return;
      // ピクセルサイズを一旦更新してから、画像ソースを設定
      setPixelWidth(tempPixelWidth);
      setPixelHeight(tempPixelHeight);
      setImageSrc(url);
    };
    reader.readAsDataURL(file);
  };

  // ----------------------------------------------------
  // 「再表示」ボタン押下時の処理：
  // - tempPixelSize の値を pixelSize に反映して画像を再描画
  // ----------------------------------------------------
  const reloadImage = () => {
    if (!imageSrc) return;
    setPixelWidth(tempPixelWidth);
    setPixelHeight(tempPixelHeight);
  };

  // ----------------------------------------------------
  // 画像または pixelSize が変更されたときに、画像からピクセルデータを生成する
  // ----------------------------------------------------
  useEffect(() => {
    if (!imageSrc) return;
    // 画像が変わった際のトリガーとして fileChangeCount を更新
    setFileChangeCount((prev) => prev + 1);
    // 新たな画像を読み込み、onload イベントでピクセルデータを生成
    const img = new Image();
    img.onload = () => {
      const pix = createPixelData(img, pixelWidth, pixelHeight);
      setPixels(pix);
    };
    img.src = imageSrc;
  }, [pixelWidth, pixelHeight, imageSrc]);

  // ----------------------------------------------------
  // Explosionアニメーションの制御：
  // - 爆発の開始、終了、そして元に戻す処理をタイムアウトで順次実行
  // ----------------------------------------------------
  const controlExplosionAnimation = () => {
    setAnimation("explosion_start");
    setTimeout(() => {
      console.log("explosion_end");
      setAnimation("explosion_end");
    }, ANIMATION_TIME * 1000);
    setTimeout(() => {
      console.log("default");
      setAnimation("default");
    }, ANIMATION_TIME * 2000);
  };

  // ----------------------------------------------------
  // Waveアニメーションの制御：
  // - 波の開始、終了、そして元に戻す処理をタイムアウトで順次実行
  // ----------------------------------------------------
  const controlWaveAnimation = () => {
    setAnimation("wave_start");
    setTimeout(() => {
      setAnimation("wave_end");
    }, ANIMATION_TIME * 1000);
    setTimeout(() => {
      setAnimation("default");
    }, ANIMATION_TIME * 2000);
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {/* ----------------- コントロールパネル ----------------- */}
      <div className="absolute top-4 left-4 bg-white shadow-lg p-4 rounded-lg z-10 w-64 space-y-4">
        {/* 画像ファイルの選択 */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        {/* ピクセルサイズの入力フィールド */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-700">Pixel Width:</label>
          <input
            type="number"
            value={tempPixelWidth}
            onChange={(e) => setTempPixelWidth(Number(e.target.value))}
            min="1"
            max="128"
            className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-700">Pixel Height:</label>
          <input
            type="number"
            value={tempPixelHeight}
            onChange={(e) => setTempPixelHeight(Number(e.target.value))}
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

        {/* アニメーション制御ボタン */}
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

      {/* ----------------- メインCanvas：ピクセルシーン ----------------- */}
      <div className="absolute top-0 left-0 w-full h-full z-[1]">
        <Canvas camera={{ far: 5000, position: [0, 0, 100] }}>
          {/* 基本の照明設定 */}
          <ambientLight intensity={1} />
          <directionalLight position={[100, 200, 100]} intensity={1} />
          {/* マウス操作でシーンの回転が可能なOrbitControls */}
          <OrbitControls />
          {/* ピクセルデータが存在する場合のみPixelGridをレンダリング */}
          {pixels && (
            <PixelGrid
              pixelWidth={pixelWidth}
              pixelHeight={pixelHeight}
              pixels={pixels}
              animation={animation}
              fileChangeCount={fileChangeCount}
            />
          )}
        </Canvas>
      </div>

      {/* ----------------- 背景Canvas：星と雲のシーン ----------------- */}
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
};

// ===================================================================
// createPixelData関数：
// - 指定された画像からCanvasを用いてピクセルデータを取得し、
// - PixelInfo型の配列に変換する
// ===================================================================
const createPixelData = (
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): PixelInfo[] => {
  // Canvas要素を作成し、指定のサイズに設定
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context available");

  // 画像をCanvas上に描画し、ピクセル情報を取得
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;

  const result: PixelInfo[] = [];
  let idx = 0;
  // 画像の各ピクセルに対して、RGBAの値を取得しPixelInfoに変換
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const r = data[idx],
        g = data[idx + 1],
        b = data[idx + 2],
        a = data[idx + 3];
      idx += 4;
      // 透明度が低いピクセルは無視する（a < 30の場合）
      if (a < 30) continue;
      result.push({
        // 画像の中心を原点とするため、x,y座標を調整
        x: x - targetWidth / 2,
        y: -y + targetHeight / 2,
        z: 0,
        // RGB値を 0～1 の範囲に変換してTHREE.Colorを作成
        color: new THREE.Color(r / 255, g / 255, b / 255),
      });
    }
  }
  return result;
};

// ===================================================================
// BackgroundSceneコンポーネント：
// - 背景に星空と雲を表示するためのコンポーネント
// - memoでラップすることで不要な再描画を防止
// ===================================================================
const BackgroundScene = memo(() => {
  return (
    <>
      {/* Starsコンポーネントで星空を表現 */}
      <Stars
        radius={100} // 星が存在する空間の半径
        depth={50} // 星の配置される深さの範囲
        count={5000} // 表示する星の総数
        factor={6} // 星の大きさ調整用の係数
        saturation={1} // 色の鮮やかさ
        fade // 遠くの星がフェードアウトする効果
      />
      {/* Cloudコンポーネントで雲を表現 */}
      <Cloud
        position={[0, 0, 0]} // 雲の中心位置
        opacity={0.1} // 雲の不透明度（低いほど透明）
        speed={0.2} // 雲の動く速度
        scale={[10, 10, 10]} // 雲全体のサイズ
        segments={20} // 雲を構成するパーティクルの数
      />
    </>
  );
});

export default PixelArt;
