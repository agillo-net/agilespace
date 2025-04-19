import { useGithubStore } from "@/store/github-store";
import { IssueList } from "@/components/issue-list";

export function TicketHistory() {
    const { trackedTickets } = useGithubStore();

    return (
        <div className="h-full">
            <h2 className="text-2xl font-semibold mb-4">Tracked Tickets</h2>
            {trackedTickets.length > 0 ? (
                <IssueList issues={trackedTickets} loading={false} />
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    No tracked tickets yet. Click on a ticket to track it.
                </div>
            )}
        </div>
    );
} 