import { createFileRoute } from '@tanstack/react-router'
import { getSpaceAndTracks } from '@/lib/supabase/queries'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Pencil, Trash2, Plus, FolderPlus, TagIcon, ChevronDown, ChevronRight } from 'lucide-react'
import { TagsListSkeleton } from '@/components/skeleton/tags-list-skeleton'
import { HierarchicalTagForm } from '@/components/hierarchical-tag-form'
import { useHierarchicalTagManagement } from '@/hooks/use-hierarchical-tag-management'
import { useState } from 'react'

export const Route = createFileRoute('/space/$slug/tags/')({
    component: TagsPage,
    loader: async ({ params: { slug } }) => {
        return getSpaceAndTracks(slug)
    }
})

function TagsPage() {
    const { space } = Route.useLoaderData()
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

    const {
        tags,
        categories,
        groupedTags, // Get from hook instead of computing in UI
        isLoading,
        error,
        isCreating,
        isUpdating,
        isDeleting,
        isSeeding,
        createError,
        updateError,
        isCreateDialogOpen,
        isEditDialogOpen,
        editingTag,
        formData,
        openCreateDialog,
        openEditDialog,
        closeDialogs,
        updateFormData,
        handleCreateSubmit,
        handleEditSubmit,
        handleDelete,
        handleSeedIssueTypes,
    } = useHierarchicalTagManagement(space?.id)

    // UI-only functions for expand/collapse
    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId)
        } else {
            newExpanded.add(categoryId)
        }
        setExpandedCategories(newExpanded)
    }

    const expandAll = () => {
        setExpandedCategories(new Set(categories.map(c => c.id)))
    }

    const collapseAll = () => {
        setExpandedCategories(new Set())
    }

    if (!space) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Tags</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">Space not found.</p>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return <TagsListSkeleton />
    }

    if (error) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Tags</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-red-600">Error loading tags. Please try again.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Tags</h1>
                <div className="flex gap-2">
                    {tags.length === 0 && (
                        <Button
                            variant="outline"
                            onClick={handleSeedIssueTypes}
                            disabled={isSeeding}
                        >
                            {isSeeding ? 'Seeding...' : 'Seed Issue Types'}
                        </Button>
                    )}

                    {/* Expand/Collapse Controls */}
                    {groupedTags.length > 0 && (
                        <>
                            <Button variant="ghost" size="sm" onClick={expandAll}>
                                Expand All
                            </Button>
                            <Button variant="ghost" size="sm" onClick={collapseAll}>
                                Collapse All
                            </Button>
                        </>
                    )}

                    {/* Create Tag Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Tag
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openCreateDialog('category')}>
                                <FolderPlus className="h-4 w-4 mr-2" />
                                Create Category
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => openCreateDialog('subcategory')}
                                disabled={categories.length === 0}
                            >
                                <TagIcon className="h-4 w-4 mr-2" />
                                Create Subcategory
                            </DropdownMenuItem>
                            {categories.length === 0 && (
                                <p className="px-2 py-1 text-xs text-muted-foreground">
                                    Create a category first
                                </p>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Create Tag Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={closeDialogs}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Create {formData.tagType === 'category' ? 'Category' : 'Subcategory'}
                        </DialogTitle>
                    </DialogHeader>
                    <HierarchicalTagForm
                        formData={formData}
                        categories={categories}
                        onFormDataChange={updateFormData}
                        onSubmit={handleCreateSubmit}
                        isSubmitting={isCreating}
                        submitButtonText="Create Tag"
                        error={createError}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Tag Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={closeDialogs}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Edit {editingTag?.tag_type === 'category' ? 'Category' : 'Subcategory'}
                        </DialogTitle>
                    </DialogHeader>
                    <HierarchicalTagForm
                        formData={formData}
                        categories={categories}
                        onFormDataChange={updateFormData}
                        onSubmit={handleEditSubmit}
                        isSubmitting={isUpdating}
                        submitButtonText="Save Changes"
                        error={updateError}
                    />
                </DialogContent>
            </Dialog>

            {/* Hierarchical Tags List */}
            <div className="space-y-4">
                {groupedTags.map(({ category, subcategories }) => {
                    const isExpanded = expandedCategories.has(category.id)

                    return (
                        <div key={category.id} className="rounded-lg border bg-card">
                            {/* Category Header */}
                            <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                                <CollapsibleTrigger className="w-full">
                                    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <div
                                                className="w-4 h-4 rounded-full border"
                                                style={{ backgroundColor: category.color || '#6B7280' }}
                                            />
                                            <div className="text-left">
                                                <h3 className="font-semibold text-lg">{category.name}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {subcategories.length} subcategories
                                                    {category.is_system && (
                                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                                            System
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(category)}
                                                disabled={isUpdating || isDeleting}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={isDeleting}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete "{category.name}"?
                                                            <span className="block mt-2 text-destructive">
                                                                This will also delete all {subcategories.length} subcategories within this category.
                                                            </span>
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(category.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Delete Category
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CollapsibleTrigger>

                                {/* Subcategories */}
                                <CollapsibleContent>
                                    {subcategories.length > 0 ? (
                                        <div className="border-t bg-muted/20">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-12"></TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead className="w-20">Order</TableHead>
                                                        <TableHead className="w-24 text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {subcategories.map(subcategory => (
                                                        <TableRow key={subcategory.id}>
                                                            <TableCell>
                                                                <div
                                                                    className="w-4 h-4 rounded-full border mx-auto"
                                                                    style={{ backgroundColor: subcategory.color || '#6B7280' }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center">
                                                                    <span className={subcategory.is_system ? 'font-medium' : ''}>
                                                                        {subcategory.name}
                                                                    </span>
                                                                    {subcategory.is_system && (
                                                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                                                            System
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {subcategory.sort_order || 0}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => openEditDialog(subcategory)}
                                                                        disabled={isUpdating || isDeleting}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>

                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                disabled={isDeleting}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Are you sure you want to delete "{subcategory.name}"?
                                                                                    This action cannot be undone.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => handleDelete(subcategory.id)}
                                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                >
                                                                                    Delete
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground border-t bg-muted/10">
                                            <p>No subcategories in this category</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2"
                                                onClick={() => openCreateDialog('subcategory', category.id)}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add Subcategory
                                            </Button>
                                        </div>
                                    )}
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    )
                })}
            </div>

            {tags.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg mb-2">No tags created yet</p>
                    <p className="mb-4">Create your first tag or seed with predefined issue types</p>
                </div>
            )}
        </div>
    )
}
