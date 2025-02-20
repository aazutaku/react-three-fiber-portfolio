import React, { useEffect, useState } from "react";
import AppRoutes from "./routes";
import { SubscribePopup } from "./components";
import "./assets/styles/global.css";

const App: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);

  // 初回描画時にポップアップを表示
  useEffect(() => {
    setShowPopup(true);
  }, []);

  return (
    <div className="min-h-screen">
      {showPopup && <SubscribePopup onClose={() => setShowPopup(false)} />}
      <AppRoutes />
    </div>
  );
};

export default App;
