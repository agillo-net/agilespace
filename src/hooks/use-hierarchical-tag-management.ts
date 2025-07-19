import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTags,
  getCategoryTags,
  getHierarchicalTags,
} from "@/lib/supabase/queries";
import {
  createCategoryTag,
  createSubcategoryTag,
  updateTag,
  deleteTag,
  seedIssueTypes,
} from "@/lib/supabase/mutations";
import type { Tag, TagType } from "@/types";

interface TagFormData {
  name: string;
  color: string;
  tagType: TagType;
  parentId?: string;
  sortOrder?: number;
}

export function useHierarchicalTagManagement(spaceId: string | undefined) {
  const queryClient = useQueryClient();

  // Form states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Form data
  const [formData, setFormData] = useState<TagFormData>({
    name: "",
    color: "#3B82F6",
    tagType: "subcategory",
    parentId: undefined,
    sortOrder: 0,
  });

  // Fetch all tags
  const tagsQuery = useQuery({
    queryKey: ["tags", spaceId],
    queryFn: () => getTags(spaceId!),
    enabled: !!spaceId,
  });

  // Fetch categories for parent selection
  const categoriesQuery = useQuery({
    queryKey: ["categories", spaceId],
    queryFn: () => getCategoryTags(spaceId!),
    enabled: !!spaceId,
  });

  // Fetch hierarchical tags for display
  const hierarchicalTagsQuery = useQuery({
    queryKey: ["hierarchical-tags", spaceId],
    queryFn: () => getHierarchicalTags(spaceId!),
    enabled: !!spaceId,
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (data: TagFormData) => {
      if (!spaceId) throw new Error("Space ID is required");

      if (data.tagType === "category") {
        return createCategoryTag(
          spaceId,
          data.name,
          data.color,
          data.sortOrder || 0,
          false
        );
      } else {
        if (!data.parentId)
          throw new Error("Parent category is required for subcategories");
        return createSubcategoryTag(
          spaceId,
          data.name,
          data.color,
          data.parentId,
          data.sortOrder || 0,
          false
        );
      }
    },
    onSuccess: () => {
      // Invalidate all tag-related queries
      queryClient.invalidateQueries({ queryKey: ["tags", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["categories", spaceId] });
      queryClient.invalidateQueries({
        queryKey: ["hierarchical-tags", spaceId],
      });

      // Reset form
      resetForm();
      setIsCreateDialogOpen(false);
    },
  });

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<TagFormData>;
    }) => {
      const updateData: Partial<Tag> = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.color) updateData.color = updates.color;
      if (updates.tagType) updateData.tag_type = updates.tagType;
      if (updates.parentId !== undefined)
        updateData.parent_id = updates.parentId;
      if (updates.sortOrder !== undefined)
        updateData.sort_order = updates.sortOrder;

      return updateTag(id, updateData);
    },
    onSuccess: () => {
      // Invalidate all tag-related queries
      queryClient.invalidateQueries({ queryKey: ["tags", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["categories", spaceId] });
      queryClient.invalidateQueries({
        queryKey: ["hierarchical-tags", spaceId],
      });

      // Reset editing state
      setEditingTag(null);
      setIsEditDialogOpen(false);
    },
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      // Invalidate all tag-related queries
      queryClient.invalidateQueries({ queryKey: ["tags", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["categories", spaceId] });
      queryClient.invalidateQueries({
        queryKey: ["hierarchical-tags", spaceId],
      });
    },
  });

  // Seed issue types mutation
  const seedIssueTypesMutation = useMutation({
    mutationFn: () => seedIssueTypes(spaceId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["categories", spaceId] });
      queryClient.invalidateQueries({
        queryKey: ["hierarchical-tags", spaceId],
      });
    },
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      name: "",
      color: "#3B82F6",
      tagType: "subcategory",
      parentId: undefined,
      sortOrder: 0,
    });
  };

  const openCreateDialog = (
    tagType: TagType = "subcategory",
    parentId?: string
  ) => {
    resetForm();
    setFormData((prev) => ({
      ...prev,
      tagType,
      parentId,
    }));
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color || "#3B82F6",
      tagType: (tag.tag_type as TagType) || "subcategory",
      parentId: tag.parent_id || undefined,
      sortOrder: tag.sort_order || 0,
    });
    setIsEditDialogOpen(true);
  };

  const closeDialogs = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingTag(null);
    resetForm();
  };

  const updateFormData = (updates: Partial<TagFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createTagMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !formData.name.trim()) return;
    updateTagMutation.mutate({ id: editingTag.id, updates: formData });
  };

  const handleDelete = (tagId: string) => {
    deleteTagMutation.mutate(tagId);
  };

  const handleSeedIssueTypes = () => {
    if (!spaceId) return;
    seedIssueTypesMutation.mutate();
  };

  // Group tags by category - LOGIC belongs in hook
  const groupedTags = useMemo(() => {
    const categoryMap = new Map<
      string,
      { category: Tag; subcategories: Tag[] }
    >();

    // Initialize categories
    categoriesQuery.data?.forEach((category) => {
      categoryMap.set(category.id, {
        category,
        subcategories: [],
      });
    });

    // Add subcategories to their parent categories
    tagsQuery.data
      ?.filter((tag) => tag.parent_id)
      .forEach((subcategory) => {
        const parentId = subcategory.parent_id!;
        if (categoryMap.has(parentId)) {
          categoryMap.get(parentId)!.subcategories.push(subcategory);
        }
      });

    // Sort subcategories by sort_order and name
    categoryMap.forEach((group) => {
      group.subcategories.sort((a, b) => {
        const orderA = a.sort_order || 0;
        const orderB = b.sort_order || 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
    });

    return Array.from(categoryMap.values()).sort((a, b) => {
      const orderA = a.category.sort_order || 0;
      const orderB = b.category.sort_order || 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.category.name.localeCompare(b.category.name);
    });
  }, [categoriesQuery.data, tagsQuery.data]);

  return {
    // Data
    tags: tagsQuery.data || [],
    categories: categoriesQuery.data || [],
    groupedTags, // Add grouped tags to return object
    hierarchicalTags: hierarchicalTagsQuery.data || [],

    // Loading states
    isLoading: tagsQuery.isLoading,
    isCreating: createTagMutation.isPending,
    isUpdating: updateTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending,
    isSeeding: seedIssueTypesMutation.isPending,

    // Error states
    error: tagsQuery.error,
    createError: createTagMutation.error,
    updateError: updateTagMutation.error,

    // Dialog states
    isCreateDialogOpen,
    isEditDialogOpen,
    editingTag,

    // Form data
    formData,

    // Actions
    openCreateDialog,
    openEditDialog,
    closeDialogs,
    updateFormData,
    handleCreateSubmit,
    handleEditSubmit,
    handleDelete,
    handleSeedIssueTypes,
  };
}
