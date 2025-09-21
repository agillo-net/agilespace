import React, { useMemo, useState, useEffect, useRef } from 'react';
import { CommandGroup } from "@/components/ui/command";
import { CommandPaletteItemComponent } from './command-palette-item';
import type { CommandPaletteItem } from "@/types/command-palette";

interface OptimizedCommandListProps {
  items: CommandPaletteItem[];
  onSelect: (item: CommandPaletteItem) => void;
  maxHeight?: number;
  itemsPerPage?: number;
}

/**
 * Optimized Command List Component
 * Uses pagination and memoization for efficient rendering of large lists
 * Renders items in batches to improve performance
 */
export const OptimizedCommandList = React.memo<OptimizedCommandListProps>(({
  items,
  onSelect,
  maxHeight = 300,
  itemsPerPage = 20,
}) => {
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset visible count when items change
  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [items, itemsPerPage]);

  // Memoize visible items to prevent unnecessary re-renders
  const visibleItems = useMemo(() => {
    return items.slice(0, visibleCount);
  }, [items, visibleCount]);

  // Load more items when scrolling near the bottom
  const handleScroll = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const container = containerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        // Load more items when 80% scrolled
        if (scrollPercentage > 0.8 && visibleCount < items.length) {
          setVisibleCount(prev => Math.min(prev + itemsPerPage, items.length));
        }
      }, 100);
    };
  }, [visibleCount, items.length, itemsPerPage]);

  // Don't optimize for small lists
  if (items.length <= itemsPerPage) {
    return (
      <CommandGroup>
        {items.map((item) => (
          <CommandPaletteItemComponent
            key={item.id}
            item={item}
            onSelect={onSelect}
          />
        ))}
      </CommandGroup>
    );
  }

  return (
    <CommandGroup>
      <div
        ref={containerRef}
        style={{ maxHeight }}
        className="overflow-y-auto"
        onScroll={handleScroll}
      >
        {visibleItems.map((item) => (
          <CommandPaletteItemComponent
            key={item.id}
            item={item}
            onSelect={onSelect}
          />
        ))}
        {visibleCount < items.length && (
          <div className="p-2 text-center text-sm text-muted-foreground">
            Showing {visibleCount} of {items.length} items
          </div>
        )}
      </div>
    </CommandGroup>
  );
});

OptimizedCommandList.displayName = 'OptimizedCommandList';