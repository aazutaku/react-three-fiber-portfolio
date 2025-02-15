import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { portfolioItems } from "../data/portfolio";
import { Home } from "../pages";

export const routes = {
  home: "/",
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* メインメニュー */}
        <Route path={routes.home} element={<Home />} />

        {/* 各ポートフォリオページ */}
        {portfolioItems.map((item) => (
          <Route key={item.id} path={item.demo} element={<item.component />} />
        ))}
      </Routes>
    </Router>
  );
};

export default AppRoutes;
