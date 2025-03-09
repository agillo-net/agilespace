import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon: Icon,
  count,
  isOpen,
  onToggle,
  children,
  className = "border-b",
}: CollapsibleSectionProps) {
  return (
    <Collapsible open={isOpen} className={className}>
      <CollapsibleTrigger
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="font-medium">{title}</span>
          <Badge variant="outline" className="ml-1 text-xs">
            {count}
          </Badge>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
