import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Edit2, Check, X } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { updateMemberStatus } from "@/lib/supabase/mutations";
import { getCurrentMemberStatus } from "@/lib/supabase/queries";
import { notifyStatusUpdate, type StatusUpdate } from "@/lib/notifications/utils";
import { useAuth } from "@/hooks/api/use-auth";

interface StatusEditorProps {
    initialStatus: string;
    initialLocation: string;
    slug: string;
}

export function StatusEditor({ initialStatus, initialLocation, slug }: StatusEditorProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const form = useForm<StatusUpdate>({
        defaultValues: {
            status: initialStatus,
            location: initialLocation,
        },
    });

    React.useEffect(() => {
        form.reset({
            status: initialStatus,
            location: initialLocation,
        });
    }, [initialStatus, initialLocation, form]);


    const updateStatusMutation = useMutation({
        mutationFn: async (data: StatusUpdate) => {
            const currentStatus = await getCurrentMemberStatus();

            if (currentStatus && currentStatus.status === data.status && currentStatus.location === data.location) {
                throw new Error("Status and location are already set to these values");
            }

            await updateMemberStatus(data);
            if (user) {
                await notifyStatusUpdate({ ...user, user_metadata: { ...user.user_metadata, full_name: user.user_metadata.full_name || 'A user' } }, data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["space", slug] });
            toast.success("Status updated successfully");
            setIsEditing(false);
        },
        onError: (error: Error) => {
            if (error.message === "Status and location are already set to these values") {
                toast.info("No changes needed - status is already up to date");
                setIsEditing(false);
            } else {
                toast.error(`Failed to update status: ${error.message}`);
            }
        },
    });

    const onSubmit = (data: StatusUpdate) => {
        updateStatusMutation.mutate(data);
    };

    const handleCancel = () => {
        form.reset({
            status: initialStatus,
            location: initialLocation,
        });
        setIsEditing(false);
    };

    if (!isEditing) {
        return (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <span className="text-sm text-muted-foreground">
                        {initialStatus === "online" ? "Online" : "Offline"}
                    </span>
                </div>
                {initialStatus === "online" && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Location:</span>
                        <span className="text-sm text-muted-foreground">
                            {initialLocation === "office" ? "In Office" : "Remote"}
                        </span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8 p-0"
                >
                    <Edit2 className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-4">
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="flex gap-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="online" id="online" />
                                        <Label htmlFor="online">Online</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="offline" id="offline" />
                                        <Label htmlFor="offline">Offline</Label>
                                    </div>
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem
                            style={{
                                display: form.watch("status") === "online" ? "block" : "none",
                            }}
                        >
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="flex gap-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="office" id="office" />
                                        <Label htmlFor="office">In Office</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="remote" id="remote" />
                                        <Label htmlFor="remote">Remote</Label>
                                    </div>
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )}
                />
                <div className="flex items-end gap-2">
                    <Button
                        type="submit"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={updateStatusMutation.isPending}
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </Form>
    );
} 
