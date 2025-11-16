"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { createIssue } from "@/lib/github/mutations"
import { getOrgRepositories } from "@/lib/github/queries"
import { ExternalLink, Copy, Eye, Pencil } from "lucide-react"
import MDEditor from '@uiw/react-md-editor'
import { useLocalStorage } from "@/hooks/use-local-storage"

const createIssueSchema = z.object({
    title: z.string().min(1, "Title is required"),
    body: z.string().optional(),
    repository: z.string().min(1, "Repository is required"),
})

type CreateIssueFormData = z.infer<typeof createIssueSchema>

interface CreateIssueDialogProps {
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
    organizationLogin: string
}

export function CreateIssueDialog({ 
    isOpen, 
    onOpenChange, 
    organizationLogin 
}: CreateIssueDialogProps) {
    const [createdIssue, setCreatedIssue] = React.useState<{ url: string; title: string } | null>(null)
    const [isPreview, setIsPreview] = React.useState(false)
    const [lastSelectedRepo, setLastSelectedRepo] = useLocalStorage<string>(`last-selected-repo-${organizationLogin}`, "")
    
    const form = useForm<CreateIssueFormData>({
        resolver: zodResolver(createIssueSchema),
        defaultValues: {
            title: "",
            body: "",
            repository: lastSelectedRepo,
        },
    })

    // Fetch organization repositories
    const { data: repositories, isLoading: isLoadingRepos } = useQuery({
        queryKey: queryKeys.organizations.repositories(organizationLogin),
        queryFn: () => getOrgRepositories(organizationLogin),
        enabled: isOpen && !!organizationLogin,
    })

    // Create issue mutation
    const createIssueMutation = useMutation({
        mutationFn: createIssue,
        onSuccess: (data) => {
            toast.success("Issue created successfully!")
            setCreatedIssue({ url: data.html_url, title: data.title })
            form.reset()
        },
        onError: (error) => {
            console.error("Error creating issue:", error)
            toast.error("Failed to create issue. Please try again.")
        },
    })

    const onSubmit = (data: CreateIssueFormData) => {
        const [owner, repo] = data.repository.split("/")
        createIssueMutation.mutate({
            owner,
            repo,
            title: data.title,
            body: data.body || undefined,
        })
    }

    // Convert repositories to searchable select options
    const repositoryOptions: SearchableSelectOption[] = React.useMemo(() => {
        if (!repositories) return []
        return repositories.map((repo) => ({
            value: repo.full_name,
            label: repo.name,
            subtitle: repo.description || undefined,
        }))
    }, [repositories])

    // Set the last selected repository when repositories are loaded or dialog opens
    React.useEffect(() => {
        if (isOpen && repositories && lastSelectedRepo) {
            // Check if the saved repository still exists in the current organization
            const repoExists = repositories.some(repo => repo.full_name === lastSelectedRepo)
            if (repoExists) {
                form.setValue('repository', lastSelectedRepo)
            }
        }
    }, [isOpen, repositories, lastSelectedRepo, form])

    // Watch for repository field changes and restore localStorage value if cleared unexpectedly
    const repositoryValue = form.watch('repository')
    React.useEffect(() => {
        if (isOpen && repositories && lastSelectedRepo && !repositoryValue) {
            // Check if the saved repository still exists in the current organization
            const repoExists = repositories.some(repo => repo.full_name === lastSelectedRepo)
            if (repoExists) {
                form.setValue('repository', lastSelectedRepo)
            }
        }
    }, [isOpen, repositories, lastSelectedRepo, repositoryValue, form])

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            form.reset({
                title: "",
                body: "",
                repository: lastSelectedRepo,
            })
            setCreatedIssue(null)
        }
        onOpenChange(open)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Issue</DialogTitle>
                    <DialogDescription>
                        Create a new GitHub issue in {organizationLogin}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="repository"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Repository *</FormLabel>
                                    <FormControl>
                                        <SearchableSelect
                                            options={repositoryOptions}
                                            value={field.value}
                                            onValueChange={(value) => {
                                                field.onChange(value)
                                                if (value) {
                                                    setLastSelectedRepo(value)
                                                }
                                            }}
                                            placeholder={isLoadingRepos ? "Loading repositories..." : "Select a repository..."}
                                            searchPlaceholder="Search repositories..."
                                            emptyText="No repositories found."
                                            allowClear={false}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter issue title..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="body"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Description (Markdown)</FormLabel>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsPreview(!isPreview)}
                                            className="h-8 px-2"
                                        >
                                            {isPreview ? (
                                                <>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Preview
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <FormControl>
                                        <MDEditor
                                            value={field.value || ''}
                                            onChange={(value) => field.onChange(value || '')}
                                            hideToolbar={isPreview}
                                            extraCommands={[]}
                                            preview={isPreview ? "preview" : "edit"}
                                            height={200}
                                            className="!bg-transparent [&_.w-md-editor]:!bg-transparent [&_.w-md-editor-toolbar]:!bg-transparent [&_.w-md-editor-toolbar-divider]:!bg-border [&_.w-md-editor-toolbar-button]:!text-foreground [&_.w-md-editor-toolbar-button]:hover:!bg-accent [&_.w-md-editor-toolbar-button]:hover:!text-accent-foreground [&_.w-md-editor-text-pre]:!text-foreground [&_.w-md-editor-text-input]:!text-foreground"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {createdIssue && (
                            <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
                                <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="font-medium">Issue created successfully!</span>
                                </div>
                                <div className="mt-2">
                                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                                        <strong>{createdIssue.title}</strong>
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <code className="flex-1 rounded bg-green-100 px-2 py-1 text-sm text-green-800 dark:bg-green-900/50 dark:text-green-200">
                                            {createdIssue.url}
                                        </code>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                navigator.clipboard.writeText(createdIssue.url)
                                                toast.success("URL copied to clipboard!")
                                            }}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => window.open(createdIssue.url, "_blank")}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            Open
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={createIssueMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createIssueMutation.isPending || isLoadingRepos}
                            >
                                {createIssueMutation.isPending ? "Creating..." : "Create Issue"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}