import { PixelArt } from "../pages";

export interface PortfolioItem {
  id: number;
  title: string;
  image: string;
  demo: string;
  youtube: string;
  blog: string;
  component: React.FC; // ページコンポーネントを直接関連付け
}

export const portfolioItems: PortfolioItem[] = [
  {
    id: 1,
    title: "ピクセルアート",
    image: "/project1.jpg",
    demo: "/pixcel-art/demo",
    youtube: "https://www.youtube.com/watch?v=xxxx",
    blog: "https://yourblog.com/project1",
    component: PixelArt,
  },
  {
    id: 2,
    title: "Project 1",
    image: "/project1.jpg",
    demo: "/project1/demo",
    youtube: "https://www.youtube.com/watch?v=xxxx",
    blog: "https://yourblog.com/project1",
    component: PixelArt,
  },
  {
    id: 3,
    title: "Project 1",
    image: "/project1.jpg",
    demo: "/project1/demo",
    youtube: "https://www.youtube.com/watch?v=xxxx",
    blog: "https://yourblog.com/project1",
    component: PixelArt,
  },
  {
    id: 4,
    title: "Project 1",
    image: "/project1.jpg",
    demo: "/project1/demo",
    youtube: "https://www.youtube.com/watch?v=xxxx",
    blog: "https://yourblog.com/project1",
    component: PixelArt,
  },
];
