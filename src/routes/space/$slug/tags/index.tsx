import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getSpaceAndTracks, getTags } from '@/lib/supabase/queries'
import type { Tag } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    DialogTrigger,
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
import { Pencil, Trash2, Plus } from 'lucide-react'
import { createTag, deleteTag, updateTag } from '@/lib/supabase/mutations'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TagsListSkeleton } from '@/components/skeleton/tags-list-skeleton'

export const Route = createFileRoute('/space/$slug/tags/')({
    component: TagsPage,
    loader: async ({ params: { slug } }) => {
        return getSpaceAndTracks(slug)
    }
})

function TagsPage() {
    const { space } = Route.useLoaderData()
    const queryClient = useQueryClient()
    const [newTagName, setNewTagName] = useState('')
    const [newTagColor, setNewTagColor] = useState('#000000')
    const [editingTag, setEditingTag] = useState<Tag | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingTagId, setEditingTagId] = useState<string | null>(null)

    // Query for fetching tags
    const { data: tags = [], isLoading, error } = useQuery({
        queryKey: ['tags', space?.id],
        queryFn: () => getTags(space!.id),
        enabled: !!space,
    })

    // Create tag mutation
    const createTagMutation = useMutation({
        mutationFn: () => createTag(space!.id, newTagName, newTagColor),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags', space?.id] })
            setNewTagName('')
            setNewTagColor('#000000')
            setIsCreateDialogOpen(false)
        },
    })

    // Update tag mutation
    const updateTagMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Tag> }) =>
            updateTag(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags', space?.id] })
            setEditingTag(null)
            setEditingTagId(null)
            setIsEditDialogOpen(false)
        },
    })

    // Delete tag mutation
    const deleteTagMutation = useMutation({
        mutationFn: (id: string) => deleteTag(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags', space?.id] })
        },
    })

    // Create new tag
    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!space || !newTagName.trim()) return
        createTagMutation.mutate()
    }

    // Update tag
    const handleUpdateTag = async (id: string, updates: Partial<Tag>) => {
        updateTagMutation.mutate({ id, updates })
    }

    // Delete tag
    const handleDeleteTag = async (id: string) => {
        deleteTagMutation.mutate(id)
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
        return (
            <TagsListSkeleton />
        )
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
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Tag
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Tag</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateTag} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="tagName">Name</Label>
                                <Input
                                    id="tagName"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    placeholder="Enter tag name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tagColor">Color</Label>
                                <Input
                                    type="color"
                                    id="tagColor"
                                    value={newTagColor}
                                    onChange={(e) => setNewTagColor(e.target.value)}
                                    className="h-10 w-full"
                                />
                            </div>
                            {createTagMutation.isError && (
                                <div className="text-sm text-red-500">
                                    {createTagMutation.error instanceof Error
                                        ? createTagMutation.error.message
                                        : 'Failed to create tag'}
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={createTagMutation.isPending}
                            >
                                {createTagMutation.isPending ? 'Creating...' : 'Create Tag'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Color</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tags.map(tag => (
                            <TableRow key={tag.id}>
                                <TableCell>
                                    <div
                                        className="w-6 h-6 rounded-full"
                                        style={{ backgroundColor: tag.color || '#000000' }}
                                    />
                                </TableCell>
                                <TableCell>{tag.name}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Dialog
                                            open={editingTagId === tag.id}
                                            onOpenChange={(open) => {
                                                if (!open) {
                                                    setEditingTagId(null)
                                                    setEditingTag(null)
                                                }
                                            }}
                                        >
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingTag(tag)
                                                        setEditingTagId(tag.id)
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-white">
                                                <DialogHeader>
                                                    <DialogTitle>Edit Tag</DialogTitle>
                                                </DialogHeader>
                                                {editingTag && (
                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault()
                                                            handleUpdateTag(tag.id, editingTag)
                                                        }}
                                                        className="space-y-4"
                                                    >
                                                        <div className="space-y-2">
                                                            <Label htmlFor="editTagName">Name</Label>
                                                            <Input
                                                                id="editTagName"
                                                                value={editingTag.name}
                                                                onChange={(e) =>
                                                                    setEditingTag({
                                                                        ...editingTag,
                                                                        name: e.target.value,
                                                                    })
                                                                }
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="editTagColor">Color</Label>
                                                            <Input
                                                                type="color"
                                                                id="editTagColor"
                                                                value={editingTag.color || '#000000'}
                                                                onChange={(e) =>
                                                                    setEditingTag({
                                                                        ...editingTag,
                                                                        color: e.target.value,
                                                                    })
                                                                }
                                                                className="h-10 w-full"
                                                            />
                                                        </div>
                                                        {updateTagMutation.isError && (
                                                            <div className="text-sm text-red-500">
                                                                {updateTagMutation.error instanceof Error
                                                                    ? updateTagMutation.error.message
                                                                    : 'Failed to update tag'}
                                                            </div>
                                                        )}
                                                        <Button
                                                            type="submit"
                                                            className="w-full"
                                                            disabled={updateTagMutation.isPending}
                                                        >
                                                            {updateTagMutation.isPending ? 'Saving...' : 'Save Changes'}
                                                        </Button>
                                                    </form>
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the
                                                        tag.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeleteTag(tag.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        disabled={deleteTagMutation.isPending}
                                                    >
                                                        {deleteTagMutation.isPending ? 'Deleting...' : 'Delete'}
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
        </div>
    )
} 
