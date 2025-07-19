import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTags, getHierarchicalTags } from "@/lib/supabase/queries";
import {
  createTag,
  deleteTag,
  updateTag,
  seedIssueTypes,
} from "@/lib/supabase/mutations";
import type { Tag } from "@/types";

export function useTags(spaceId: string | undefined) {
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#000000");
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  const {
    data: tags = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tags", spaceId],
    queryFn: () => getTags(spaceId!),
    enabled: !!spaceId,
  });

  const createTagMutation = useMutation({
    mutationFn: () => createTag(spaceId!, newTagName, newTagColor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", spaceId] });
      setNewTagName("");
      setNewTagColor("#000000");
      setIsCreateDialogOpen(false);
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Tag> }) =>
      updateTag(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", spaceId] });
      setEditingTag(null);
      setEditingTagId(null);
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", spaceId] });
    },
  });

  const seedIssueTypesMutation = useMutation({
    mutationFn: () => seedIssueTypes(spaceId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", spaceId] });
      queryClient.invalidateQueries({ queryKey: ["categories", spaceId] });
    },
  });

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceId || !newTagName.trim()) return;
    createTagMutation.mutate();
  };

  const handleUpdateTag = (id: string, updates: Partial<Tag>) => {
    updateTagMutation.mutate({ id, updates });
  };

  const handleSeedIssueTypes = () => {
    if (!spaceId) return;
    seedIssueTypesMutation.mutate();
  };

  return {
    tags,
    isLoading,
    error,
    newTagName,
    setNewTagName,
    newTagColor,
    setNewTagColor,
    editingTag,
    setEditingTag,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    editingTagId,
    setEditingTagId,
    createTagMutation,
    updateTagMutation,
    deleteTagMutation,
    seedIssueTypesMutation,
    handleCreateTag,
    handleUpdateTag,
    handleSeedIssueTypes,
  };
}
