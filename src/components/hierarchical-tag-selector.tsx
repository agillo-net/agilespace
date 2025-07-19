import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn, isLightColor } from "@/lib/utils";
import { X, ChevronRight, ChevronDown } from "lucide-react";
import { useHierarchicalTagSelector } from "@/hooks/use-hierarchical-tag-selector";
import type { Tag } from "@/types";

interface HierarchicalTagSelectorProps {
    spaceId: string;
    selectedTags: Tag[];
    onTagsChange: (tags: Tag[]) => void;
    disabled?: boolean;
}

export function HierarchicalTagSelector({
    spaceId,
    selectedTags,
    onTagsChange,
    disabled = false,
}: HierarchicalTagSelectorProps) {
    const {
        selectedCategory,
        categories,
        categoriesLoading,
        handleCategorySelect,
        toggleTag,
        removeTag,
        getSubcategoriesQuery,
        isTagSelected,
        isCategoryExpanded,
    } = useHierarchicalTagSelector({
        spaceId,
        selectedTags,
        onTagsChange,
    });

    if (categoriesLoading) {
        return (
            <div className="space-y-4">
                <div>
                    <Label>Issue Type</Label>
                    <p className="text-sm text-muted-foreground">Loading categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <Label>Issue Type</Label>
                <p className="text-sm text-muted-foreground">
                    Select a category and then choose specific issue types
                </p>
            </div>

            {/* Selected tags display */}
            {selectedTags.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-sm">Selected:</Label>
                    <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                            <Badge
                                key={tag.id}
                                variant="default"
                                className={cn(
                                    "cursor-pointer",
                                    tag.color && isLightColor(tag.color) ? "text-gray-900" : "text-white"
                                )}
                                style={{ backgroundColor: tag.color || undefined }}
                                onClick={() => removeTag(tag.id)}
                            >
                                {tag.name}
                                <X className="ml-1 h-3 w-3" />
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Category and subcategory selection */}
            <div className="space-y-3">
                {categories.map((category) => {
                    const isExpanded = isCategoryExpanded(category.id);
                    const categorySubcategories = getSubcategoriesQuery(category.id);

                    return (
                        <div key={category.id} className="space-y-2">
                            {/* Category button */}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={disabled}
                                onClick={() => handleCategorySelect(category)}
                                className={cn(
                                    "w-full justify-start",
                                    selectedCategory?.id === category.id && "ring-2 ring-primary"
                                )}
                            >
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: category.color || "#6B7280" }}
                                />
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 mr-2" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 mr-2" />
                                )}
                                {category.name}
                            </Button>

                            {/* Subcategories */}
                            {isExpanded && (
                                <div className="ml-4 space-y-1">
                                    {categorySubcategories.isLoading && (
                                        <p className="text-sm text-muted-foreground">Loading...</p>
                                    )}
                                    {categorySubcategories.data?.map((subcategory) => {
                                        const isSelected = isTagSelected(subcategory.id);
                                        return (
                                            <Badge
                                                key={subcategory.id}
                                                variant={isSelected ? "default" : "outline"}
                                                className={cn(
                                                    "cursor-pointer mr-2 mb-1",
                                                    isSelected && subcategory.color && isLightColor(subcategory.color)
                                                        ? "text-gray-900"
                                                        : undefined
                                                )}
                                                style={{
                                                    backgroundColor:
                                                        isSelected && subcategory.color ? subcategory.color : undefined,
                                                }}
                                                onClick={() => !disabled && toggleTag(subcategory)}
                                            >
                                                {subcategory.name}
                                                {isSelected && <X className="ml-1 h-3 w-3" />}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {categories.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                    <p>No issue types available.</p>
                    <p className="text-sm">Contact your administrator to set up issue types.</p>
                </div>
            )}
        </div>
    );
} 
