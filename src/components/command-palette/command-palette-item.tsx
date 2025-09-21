import React from 'react';
import { Badge } from "@/components/ui/badge";
import type { CommandPaletteItem } from "@/types/command-palette";

interface CommandPaletteItemProps {
  item: CommandPaletteItem;
  onSelect: (item: CommandPaletteItem) => void;
}

/**
 * Command Palette Item Component
 * Renders individual items in the command palette with proper styling and metadata
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const CommandPaletteItemComponent = React.memo<CommandPaletteItemProps>(({ item }) => {

  return (
    <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors">
      {/* Icon */}
      <div className="flex-shrink-0" aria-hidden="true">
        <item.icon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{item.title}</span>
          {item.type === 'existing-track' && item.isActive && (
            <Badge 
              variant="secondary" 
              className="text-xs"
              aria-label="Currently active track"
            >
              Active
            </Badge>
          )}
        </div>
        {item.subtitle && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            {item.subtitle}
          </p>
        )}
        
        {/* Metadata for existing tracks */}
        {item.type === 'existing-track' && (
          <div 
            className="flex items-center gap-4 mt-2 text-xs text-muted-foreground"
            aria-label={`Track statistics: ${item.sessionCount} sessions, total duration ${item.totalDuration}`}
          >
            <span aria-label={`${item.sessionCount} sessions`}>
              {item.sessionCount} sessions
            </span>
            <span aria-label={`Total duration: ${item.totalDuration}`}>
              {item.totalDuration}
            </span>
          </div>
        )}
      </div>
    </div>
   );
});

CommandPaletteItemComponent.displayName = 'CommandPaletteItemComponent';

export { CommandPaletteItemComponent };