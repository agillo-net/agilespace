import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useState, useEffect } from 'react'
import { getTags } from '@/lib/supabase/queries'
import type { Tag } from '@/types'
import { Badge } from '@/components/ui/badge'
import { X, Eye, Pencil } from 'lucide-react'
import { cn, isLightColor } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import MDEditor from '@uiw/react-md-editor'

interface EndSessionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    message: string
    onMessageChange: (message: string) => void
    onEndSession: (skipSummary: boolean, selectedTags: Tag[]) => void
    isPending: boolean
    spaceId: string
}

export function EndSessionDialog({
    open,
    onOpenChange,
    message,
    onMessageChange,
    onEndSession,
    isPending,
    spaceId
}: EndSessionDialogProps) {
    const [skipComment, setSkipComment] = useState(false)
    const [selectedTags, setSelectedTags] = useState<Tag[]>([])
    const [isPreview, setIsPreview] = useState(false)
    const canSubmit = skipComment || message.trim().length > 0

    const { data: tags = [] } = useQuery({
        queryKey: ['tags', spaceId],
        queryFn: () => getTags(spaceId),
        enabled: open && !!spaceId
    })

    useEffect(() => {
        if (!open) {
            setSkipComment(false)
            setSelectedTags([])
            onMessageChange('')
        }
    }, [open, onMessageChange])

    const toggleTag = (tag: Tag) => {
        setSelectedTags(prev =>
            prev.some(t => t.id === tag.id)
                ? prev.filter(t => t.id !== tag.id)
                : [...prev, tag]
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>End Session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="message">Session Summary</Label>
                            <Button
                                variant="ghost"
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
                        <MDEditor
                            value={message}
                            onChange={(value) => onMessageChange(value || '')}
                            preview={isPreview ? "preview" : "edit"}
                            height={200}
                            enableScroll={!skipComment}
                            className="!bg-transparent [&_.w-md-editor]:!bg-transparent [&_.w-md-editor-toolbar]:!bg-transparent [&_.w-md-editor-toolbar-divider]:!bg-border [&_.w-md-editor-toolbar-button]:!text-foreground [&_.w-md-editor-toolbar-button]:hover:!bg-accent [&_.w-md-editor-toolbar-button]:hover:!text-accent-foreground [&_.w-md-editor-text-pre]:!text-foreground [&_.w-md-editor-text-input]:!text-foreground"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Session Type</Label>
                        <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                                <Badge
                                    key={tag.id}
                                    variant={selectedTags.some(t => t.id === tag.id) ? "default" : "outline"}
                                    className={cn(
                                        "cursor-pointer",
                                        selectedTags.some(t => t.id === tag.id) && tag.color && isLightColor(tag.color) ? "text-gray-900" : undefined
                                    )}
                                    style={{ backgroundColor: selectedTags.some(t => t.id === tag.id) && tag.color ? tag.color : undefined }}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag.name}
                                    {selectedTags.some(t => t.id === tag.id) && (
                                        <X className="ml-1 h-3 w-3" />
                                    )}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="skip-comment"
                            checked={skipComment}
                            onCheckedChange={(checked) => {
                                setSkipComment(checked as boolean)
                                if (checked) {
                                    onMessageChange('')
                                }
                            }}
                        />
                        <Label htmlFor="skip-comment">Skip comment</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onEndSession(skipComment, selectedTags)}
                        disabled={isPending || !canSubmit}
                    >
                        {isPending ? "Processing..." : "End Session"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 
