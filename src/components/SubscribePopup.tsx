import React from "react";

type SubscribePopupProps = {
  onClose: () => void;
};

const SubscribePopup: React.FC<SubscribePopupProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">
          YouTubeチャンネル登録お願いします！
        </h2>
        <p className="mb-4">
          チャンネル登録者数に応じて、新しい機能も追加していきます！
          <br />
          ぜひ、チャンネル登録して追加してほしい機能をコメントしてください！
        </p>
        <div className="flex justify-end space-x-2">
          <a
            href="https://youtube.com/@hack-lab-256?si=Y7bEoPbczbwhN8Wy"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            今すぐ登録する
          </a>
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            あとで
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscribePopup;
