import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ROLES } from '@/lib/permissions/constants';
import type { Role } from '@/lib/permissions/constants';
import { toast } from 'sonner';

interface RoleSelectorProps {
  currentRole: Role;
  memberId: string;
  memberName: string;
  onRoleChange: (memberId: string, newRole: Role) => Promise<void>;
  disabled?: boolean;
}

export function RoleSelector({
  currentRole,
  memberId,
  memberName,
  onRoleChange,
  disabled = false,
}: RoleSelectorProps) {
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleValueChange = (value: string) => {
    const newRole = value as Role;
    if (newRole === currentRole) return;

    setPendingRole(newRole);
    setIsDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingRole) return;

    setIsUpdating(true);
    try {
      await onRoleChange(memberId, pendingRole);
      toast.success(`Successfully updated ${memberName}'s role to ${pendingRole}`);
      setIsDialogOpen(false);
      setPendingRole(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setPendingRole(null);
  };

  const getRoleLabel = (role: Role) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getRoleDescription = (role: Role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'Full access to space settings, members, and all features';
      case ROLES.MEMBER:
        return 'Can create and manage their own content, view team analytics';
      case ROLES.OBSERVER:
        return 'Read-only access to view space content';
      default:
        return '';
    }
  };

  return (
    <>
      <Select
        value={currentRole}
        onValueChange={handleValueChange}
        disabled={disabled || isUpdating}
      >
        <SelectTrigger
          className="w-32 h-8 capitalize"
          onClick={(e) => e.stopPropagation()}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent onClick={(e) => e.stopPropagation()}>
          <SelectItem value={ROLES.ADMIN}>
            {getRoleLabel(ROLES.ADMIN)}
          </SelectItem>
          <SelectItem value={ROLES.MEMBER}>
            {getRoleLabel(ROLES.MEMBER)}
          </SelectItem>
          <SelectItem value={ROLES.OBSERVER}>
            {getRoleLabel(ROLES.OBSERVER)}
          </SelectItem>
        </SelectContent>
      </Select>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Member Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {memberName}'s role from{' '}
              <span className="font-semibold capitalize">{currentRole}</span> to{' '}
              <span className="font-semibold capitalize">{pendingRole}</span>?
              <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                <strong className="capitalize">{pendingRole}</strong>:{' '}
                {pendingRole && getRoleDescription(pendingRole)}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} disabled={isUpdating}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
