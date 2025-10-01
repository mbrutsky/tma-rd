// src/components/Views/TaskView/VirtualizedList.tsx
"use client";

import React, { useRef, useMemo, useCallback, useEffect } from "react";
import {
  FixedSizeList,
  VariableSizeList,
  ListOnItemsRenderedProps,
  // @ts-ignore
} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (props: { item: T; index: number; isScrolling?: boolean }) => React.ReactNode;
  itemHeight?: number | ((index: number) => number);
  className?: string;
  height?: number;
  width?: number;
  overscanCount?: number;
  initialScrollOffset?: number;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  onItemsRendered?: (props: { startIndex: number; stopIndex: number }) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  estimatedItemSize?: number;
  threshold?: number;
  hasNextPage?: boolean;
  loadNextPage?: () => void;
  getItemKey?: (index: number, item: T) => string | number;

  /** С какого индекса инвалидировать кэш VariableSizeList (при сворачивании/разворачивании группы) */
  invalidateFromIndex?: number | null;

  /** Ключ для принудительного ремоунта списка при смене раскладки групп */
  listKey?: React.Key; // не используется, можно не передавать
}

interface ItemData<T> {
  items: T[];
  renderItem: VirtualizedListProps<T>["renderItem"];
}

type RowFC<T> = React.FC<{ index: number; style: React.CSSProperties; data: ItemData<T> }>;

const Row = React.memo(function Row<T>({ index, style, data }: {
  index: number; style: React.CSSProperties; data: ItemData<T>;
}) {
  const item = data.items[index];
  return (
    <div style={style}>
      {item ? (
        data.renderItem({ item, index })
      ) : (
        <div className="flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 rounded h-16 w-full" />
        </div>
      )}
    </div>
  );
}) as RowFC<any>;

export default function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 80,
  className = "",
  height = 400,
  width,
  overscanCount = 5,
  initialScrollOffset = 0,
  onScroll,
  onItemsRendered,
  loading = false,
  loadingComponent,
  emptyComponent,
  estimatedItemSize = 80,
  threshold = 5,
  hasNextPage = false,
  loadNextPage,
  getItemKey,
  invalidateFromIndex = null,
  listKey,
}: VirtualizedListProps<T>) {
  const listRef = useRef<FixedSizeList | VariableSizeList>(null);
  const isVariableHeight = typeof itemHeight === "function";

  const getItemSize = useCallback(
    (index: number) => (typeof itemHeight === "function" ? itemHeight(index) : (itemHeight as number)),
    [itemHeight]
  );

  const itemData = useMemo<ItemData<T>>(() => ({ items, renderItem }), [items, renderItem]);

  const itemKey = useCallback(
    (index: number) => (getItemKey && items[index] ? getItemKey(index, items[index]) : index),
    [getItemKey, items]
  );

  const handleItemsRenderedRW = useCallback(
    (info: ListOnItemsRenderedProps) => {
      onItemsRendered?.({ startIndex: info.visibleStartIndex, stopIndex: info.visibleStopIndex });
      if (hasNextPage && loadNextPage && info.visibleStopIndex >= items.length - threshold) {
        loadNextPage();
      }
    },
    [onItemsRendered, hasNextPage, loadNextPage, items.length, threshold]
  );

  // Сбрасываем кэш высот с нужного индекса при изменении групп/разметки
  useEffect(() => {
    if (!isVariableHeight || !listRef.current) return;
    const vlist = listRef.current as VariableSizeList;
    const idx = typeof invalidateFromIndex === "number" ? Math.max(0, invalidateFromIndex) : 0;
    vlist.resetAfterIndex(idx, true);
  }, [isVariableHeight, items, getItemSize, height, width, invalidateFromIndex]);

  if (loading && items.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ height }}>
        {loadingComponent ?? (
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm text-gray-500">Загрузка…</p>
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ height }}>
        {emptyComponent ?? (
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">Нет элементов</p>
            <p className="text-sm">Список пуст</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className} style={{ minHeight: height, width }}>
      <AutoSizer>
        {({ height: autoHeight, width: autoWidth }) => {
          const listHeight = height || autoHeight;
          const listWidth = width || autoWidth;

          const common = {
            ref: listRef as any,
            height: listHeight,
            width: listWidth,
            itemCount: items.length + (hasNextPage ? 1 : 0),
            overscanCount,
            onItemsRendered: handleItemsRenderedRW,
            itemKey,
            initialScrollOffset,
            onScroll,
            itemData,
          } as const;

          return typeof itemHeight === "function" ? (
            <VariableSizeList
              key={listKey}
              {...common}
              itemSize={getItemSize}
              estimatedItemSize={estimatedItemSize}
            >
              {Row as RowFC<T>}
            </VariableSizeList>
          ) : (
            <FixedSizeList key={listKey} {...common} itemSize={itemHeight as number}>
              {Row as RowFC<T>}
            </FixedSizeList>
          );
        }}
      </AutoSizer>
    </div>
  );
}
