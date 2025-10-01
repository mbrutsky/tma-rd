"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FilterTab {
  value: string;
  label: string;
  count: number;
}

interface TasksFilterTabsProps {
  tabs: FilterTab[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function TasksFilterTabs({
  tabs,
  activeFilter,
  onFilterChange,
}: TasksFilterTabsProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Проверка возможности прокрутки
  const checkScrollButtons = () => {
    const el = tabsRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const x = el.scrollLeft;
    const EPS = 1;

    setCanScrollLeft(x > EPS);
    setCanScrollRight(x < max - EPS);
  };

  const scrollLeft = () => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: -200, behavior: "smooth" });
    setTimeout(checkScrollButtons, 250);
  };

  const scrollRight = () => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: 200, behavior: "smooth" });
    setTimeout(checkScrollButtons, 250);
  };

  useEffect(() => {
    checkScrollButtons();
  }, [tabs.length]);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => checkScrollButtons());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    checkScrollButtons();
    const handleResize = () => checkScrollButtons();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(checkScrollButtons, 100);
    return () => clearTimeout(timer);
  }, [activeFilter]);

  return (
    <div className="relative">
      <div className="flex items-center">
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 z-10 bg-white shadow-md rounded-full w-8 h-8 p-0"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        <div
          ref={tabsRef}
          className="flex gap-2 overflow-x-auto scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onScroll={checkScrollButtons}
        >
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onFilterChange(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
                activeFilter === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span className="font-medium">{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    activeFilter === tab.value
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {canScrollRight && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 border-custom z-10 bg-white shadow-md rounded-full w-8 h-8 p-0"
            onClick={scrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}