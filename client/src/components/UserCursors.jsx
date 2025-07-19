import React from "react";
import { MousePointer } from "lucide-react";

const UserCursors = ({ users }) => {
  const cursorColors = [
    "#ef4444", "#3b82f6", "#22c55e", "#f97316", 
    "#a855f7", "#06b6d4", "#64748b", "#ec4899"
  ];

  const getUserColor = (userId) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return cursorColors[Math.abs(hash) % cursorColors.length];
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {Object.entries(users).map(([userId, userData]) => (
        <div
          key={userId}
          className="absolute transform -translate-x-1 -translate-y-1 transition-all duration-100 ease-out"
          style={{
            left: userData.x,
            top: userData.y,
          }}
        >
          <div className="relative">
            <MousePointer
              className="w-5 h-5 transform rotate-12"
              style={{ color: getUserColor(userId) }}
              fill="currentColor"
            />
            <div
              className="absolute top-5 left-2 px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap shadow-lg"
              style={{ backgroundColor: getUserColor(userId) }}
            >
              User {userId.slice(-4)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserCursors;