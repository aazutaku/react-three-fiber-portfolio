import React from "react";
import AppRoutes from "./routes";
import "./assets/styles/global.css";

const App: React.FC = () => {
  return (
    <div className="min-h-screen">
      <AppRoutes />
    </div>
  );
};

export default App;
