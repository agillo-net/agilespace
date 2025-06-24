import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import type { GitHubIssue } from "@/types"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface IssueDetailsDialogProps {
    issue: GitHubIssue | null
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
}

export function IssueDetailsDialog({ issue, isOpen, onOpenChange }: IssueDetailsDialogProps) {
    if (!issue) return null

    const getTextColorForBackground = (hexColor: string | null | undefined) => {
        if (!hexColor) return 'black'
        const r = parseInt(hexColor.substr(0, 2), 16)
        const g = parseInt(hexColor.substr(2, 2), 16)
        const b = parseInt(hexColor.substr(4, 2), 16)
        const yiq = (r * 299 + g * 587 + b * 114) / 1000
        return yiq >= 128 ? 'black' : 'white'
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{issue.title}</DialogTitle>
                    <DialogDescription>
                        {issue.repository.name} #{issue.number}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground mt-4">
                    {issue.user && (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">Author:</span>
                            <a href={issue.user.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                    <AvatarImage src={issue.user.avatar_url} />
                                    <AvatarFallback>{issue.user.login.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {issue.user.login}
                            </a>
                        </div>
                    )}
                    {issue.milestone && (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">Milestone:</span>
                            <a href={issue.milestone.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {issue.milestone.title}
                            </a>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">Created:</span>
                        <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">Updated:</span>
                        <span>{new Date(issue.updated_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {issue.labels?.map(
                        (label) =>
                            label.name && (
                                <span
                                    key={label.id}
                                    className="px-2 py-1 text-xs font-semibold rounded-full"
                                    style={{
                                        backgroundColor: `#${label.color}`,
                                        color: getTextColorForBackground(label.color)
                                    }}
                                >
                                    {label.name}
                                </span>
                            )
                    )}
                </div>

                {issue.assignees && issue.assignees.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-gray-500">Assignees:</span>
                        {issue.assignees.map(
                            (assignee) =>
                                assignee && (
                                    <a
                                        key={assignee.id}
                                        href={assignee.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={assignee.login}
                                    >
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={assignee.avatar_url} />
                                            <AvatarFallback>
                                                {assignee.login?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </a>
                                )
                        )}
                    </div>
                )}

                <div className="prose dark:prose-invert max-w-none mt-4 overflow-y-auto max-h-[60vh]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{issue.body || ''}</ReactMarkdown>
                </div>
            </DialogContent>
        </Dialog>
    )
} 
