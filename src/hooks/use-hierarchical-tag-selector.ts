import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCategoryTags, getSubcategoryTags } from "@/lib/supabase/queries";
import type { Tag } from "@/types";

interface UseHierarchicalTagSelectorProps {
  spaceId: string;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

export function useHierarchicalTagSelector({
  spaceId,
  selectedTags,
  onTagsChange,
}: UseHierarchicalTagSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<Tag | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Fetch categories
  const categoriesQuery = useQuery({
    queryKey: ["categories", spaceId],
    queryFn: () => getCategoryTags(spaceId),
    enabled: !!spaceId,
  });

  // Get subcategories for a specific category
  const getSubcategoriesQuery = (categoryId: string) => {
    return useQuery({
      queryKey: ["subcategories", spaceId, categoryId],
      queryFn: () => getSubcategoryTags(spaceId, categoryId),
      enabled: expandedCategories.has(categoryId),
    });
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Handle category selection
  const handleCategorySelect = (category: Tag) => {
    if (selectedCategory?.id === category.id) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
      toggleCategoryExpansion(category.id);
    }
  };

  // Handle tag toggle (for subcategories)
  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  // Remove selected tag
  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  // Check if a tag is selected
  const isTagSelected = (tagId: string) => {
    return selectedTags.some((t) => t.id === tagId);
  };

  // Check if a category is expanded
  const isCategoryExpanded = (categoryId: string) => {
    return expandedCategories.has(categoryId);
  };

  return {
    // State
    selectedCategory,
    expandedCategories,

    // Data
    categories: categoriesQuery.data || [],
    categoriesLoading: categoriesQuery.isLoading,
    categoriesError: categoriesQuery.error,

    // Actions
    handleCategorySelect,
    toggleTag,
    removeTag,

    // Utilities
    getSubcategoriesQuery,
    isTagSelected,
    isCategoryExpanded,
  };
}
