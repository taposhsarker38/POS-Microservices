// app/(dashboard)/users/page.tsx
'use client';

import { useState } from 'react';
import { useGetUsersQuery, useDeleteUserMutation } from '@/features/users/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, error } = useGetUsersQuery();
  const [deleteUser] = useDeleteUserMutation();
  const { logDataAction } = useActivityLogger();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canCreate = hasPermission(currentUser?.user_permissions || [], PERMISSIONS.USERS_CREATE);
  const canEdit = hasPermission(currentUser?.user_permissions || [], PERMISSIONS.USERS_EDIT);
  const canDelete = hasPermission(currentUser?.user_permissions || [], PERMISSIONS.USERS_DELETE);

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user ${username}?`)) {
      return;
    }

    setDeletingId(userId);
    try {
      await deleteUser(userId).unwrap();
      logDataAction('delete', 'User', userId);
      toast({
        title: 'User deleted',
        description: `User ${username} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Failed to load users</h3>
          <p className="text-gray-500 mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and permissions</p>
        </div>
        {canCreate && (
          <Link href="/users/create">
            <Button>Add User</Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.first_name} {user.last_name}</TableCell>
                <TableCell>
                  <Badge variant={user.is_superuser ? 'default' : 'secondary'}>
                    {user.is_superuser ? 'Superuser' : user.is_staff ? 'Staff' : 'User'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'success' : 'destructive'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {canEdit && (
                    <Link href={`/users/${user.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  )}
                  {canDelete && !user.is_superuser && user.id !== currentUser?.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      disabled={deletingId === user.id}
                    >
                      {deletingId === user.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}