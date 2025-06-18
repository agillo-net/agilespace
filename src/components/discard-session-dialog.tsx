import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DiscardSessionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    isPending: boolean
}

export function DiscardSessionDialog({
    open,
    onOpenChange,
    onConfirm,
    isPending
}: DiscardSessionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Discard Session</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p>Are you sure you want to discard this session? This action cannot be undone.</p>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        {isPending ? "Discarding..." : "Discard Session"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 
