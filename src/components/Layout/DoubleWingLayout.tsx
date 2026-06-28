import React from 'react';
import { LeftSidebar } from '../Sidebar/LeftSidebar';
import { MainContent } from '../Main/MainContent';
import { RightSidebar } from '../Rightbar/RightSidebar';

export function DoubleWingLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - 250px */}
      <aside className="w-[250px] min-w-[250px] border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0">
        <LeftSidebar />
      </aside>

      {/* Main Content - Flexible */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <MainContent />
      </main>

      {/* Right Sidebar - 300px */}
      <aside className="w-[300px] min-w-[300px] border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0">
        <RightSidebar />
      </aside>
    </div>
  );
}
