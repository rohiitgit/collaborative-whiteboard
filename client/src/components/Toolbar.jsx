import React from "react";
import { Palette, RotateCcw } from "lucide-react";

const Toolbar = ({
  currentColor,
  setCurrentColor,
  currentStrokeWidth,
  setCurrentStrokeWidth,
  onClearCanvas,
}) => {
  const colors = [
    { name: "Black", value: "#000000" },
    { name: "Red", value: "#ef4444" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#22c55e" },
    { name: "Purple", value: "#a855f7" },
    { name: "Orange", value: "#f97316" },
    { name: "Pink", value: "#ec4899" },
    { name: "Yellow", value: "#eab308" },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Colors</span>
          </div>
          
          <div className="flex items-center gap-2">
            {colors.map((color) => (
              <button
                key={color.value}
                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                  currentColor === color.value 
                    ? "border-gray-800 shadow-lg scale-110" 
                    : "border-gray-300 hover:border-gray-400"
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => setCurrentColor(color.value)}
                title={color.name}
                aria-label={`Select ${color.name} color`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Brush Size</label>
            <input
              type="range"
              min="1"
              max="20"
              value={currentStrokeWidth}
              onChange={(e) => setCurrentStrokeWidth(parseInt(e.target.value))}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center justify-center w-8 h-8">
              <div
                className="rounded-full transition-all duration-200"
                style={{
                  width: Math.max(4, currentStrokeWidth),
                  height: Math.max(4, currentStrokeWidth),
                  backgroundColor: currentColor,
                }}
              />
            </div>
          </div>

          <button
            onClick={onClearCanvas}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200 hover:scale-105 font-medium"
            title="Clear canvas"
          >
            <RotateCcw className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;