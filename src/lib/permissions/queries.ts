/**
 * Permission-related database queries
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import type { Permission } from './constants';

/**
 * Check if the current user has a specific permission in a space
 */
export async function checkUserPermission(
  spaceId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('user_has_permission', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_space_id: spaceId,
      p_permission_name: permission,
    });

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    return data as boolean;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if the current user has any of the specified permissions in a space
 */
export async function checkUserHasAnyPermission(
  spaceId: string,
  permissions: Permission[]
): Promise<boolean> {
  try {
    const results = await Promise.all(
      permissions.map((permission) => checkUserPermission(spaceId, permission))
    );
    return results.some((result) => result);
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Check if the current user has all of the specified permissions in a space
 */
export async function checkUserHasAllPermissions(
  spaceId: string,
  permissions: Permission[]
): Promise<boolean> {
  try {
    const results = await Promise.all(
      permissions.map((permission) => checkUserPermission(spaceId, permission))
    );
    return results.every((result) => result);
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Get all permissions for the current user in a space
 */
export async function getUserPermissions(
  spaceId: string
): Promise<Record<Permission, boolean>> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_user_permissions', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_space_id: spaceId,
    });

    if (error) {
      console.error('Error getting user permissions:', error);
      return {} as Record<Permission, boolean>;
    }

    // Convert array of {permission_name, granted} to object
    const permissionsMap = (data as Array<{ permission_name: Permission; granted: boolean }>).reduce(
      (acc, { permission_name, granted }) => {
        acc[permission_name] = granted;
        return acc;
      },
      {} as Record<Permission, boolean>
    );

    return permissionsMap;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return {} as Record<Permission, boolean>;
  }
}

/**
 * Grant a permission to a space member (admin only)
 */
export async function grantPermissionToMember(
  spaceMemberId: string,
  permissionName: Permission
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    // First, get the permission ID
    const { data: permission, error: permError } = await supabase
      .from('permissions')
      .select('id')
      .eq('name', permissionName)
      .single();

    if (permError || !permission) {
      return { success: false, error: 'Permission not found' };
    }

    // Insert or update the permission override
    const { error: insertError } = await supabase
      .from('space_member_permissions')
      .upsert({
        space_member_id: spaceMemberId,
        permission_id: permission.id,
        granted: true,
        granted_by: (await supabase.auth.getUser()).data.user?.id,
      }, {
        onConflict: 'space_member_id,permission_id',
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Revoke a permission from a space member (admin only)
 */
export async function revokePermissionFromMember(
  spaceMemberId: string,
  permissionName: Permission
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    // First, get the permission ID
    const { data: permission, error: permError } = await supabase
      .from('permissions')
      .select('id')
      .eq('name', permissionName)
      .single();

    if (permError || !permission) {
      return { success: false, error: 'Permission not found' };
    }

    // Insert or update the permission override to revoke
    const { error: insertError } = await supabase
      .from('space_member_permissions')
      .upsert({
        space_member_id: spaceMemberId,
        permission_id: permission.id,
        granted: false,
        granted_by: (await supabase.auth.getUser()).data.user?.id,
      }, {
        onConflict: 'space_member_id,permission_id',
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Remove a permission override (revert to role default)
 */
export async function removePermissionOverride(
  spaceMemberId: string,
  permissionName: Permission
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    // First, get the permission ID
    const { data: permission, error: permError } = await supabase
      .from('permissions')
      .select('id')
      .eq('name', permissionName)
      .single();

    if (permError || !permission) {
      return { success: false, error: 'Permission not found' };
    }

    // Delete the override
    const { error: deleteError } = await supabase
      .from('space_member_permissions')
      .delete()
      .match({
        space_member_id: spaceMemberId,
        permission_id: permission.id,
      });

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
