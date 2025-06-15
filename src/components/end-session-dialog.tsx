import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useState, useEffect } from 'react'
import { getTags } from '@/lib/supabase/queries'
import type { Tag } from '@/types'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { cn, isLightColor } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

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
                        <Label htmlFor="message">Session Summary</Label>
                        <Input
                            id="message"
                            value={message}
                            onChange={(e) => onMessageChange(e.target.value)}
                            placeholder="What did you accomplish in this session?"
                            disabled={skipComment}
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
