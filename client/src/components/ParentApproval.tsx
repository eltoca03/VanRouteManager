import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, UserX, Mail, Phone, Clock } from 'lucide-react';
import type { User } from '@shared/schema';

export default function ParentApproval() {
  const { toast } = useToast();

  const { data: pendingParentsData, isLoading } = useQuery<{ parents: User[] }>({
    queryKey: ['/api/driver/pending-parents'],
  });

  const approveMutation = useMutation({
    mutationFn: async (parentId: string) => {
      return await apiRequest('PUT', `/api/driver/approve-parent/${parentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/pending-parents'] });
      toast({
        title: 'Parent approved',
        description: 'The parent account has been approved and can now log in.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to approve',
        description: 'Could not approve parent account. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (parentId: string) => {
      return await apiRequest('PUT', `/api/driver/reject-parent/${parentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/driver/pending-parents'] });
      toast({
        title: 'Parent rejected',
        description: 'The parent account has been rejected.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to reject',
        description: 'Could not reject parent account. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const pendingParents = pendingParentsData?.parents || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-3xl font-bold">Parent Account Approvals</h1>
          <div className="text-muted-foreground">Loading pending accounts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-parent-approval">Parent Account Approvals</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve new parent account requests
          </p>
        </div>

        {pendingParents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No pending approvals</p>
              <p className="text-muted-foreground mt-2">
                All parent accounts have been reviewed
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingParents.map((parent) => (
              <Card key={parent.id} data-testid={`card-parent-${parent.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl" data-testid={`text-parent-name-${parent.id}`}>
                        {parent.name}
                      </CardTitle>
                      <CardDescription>
                        Account created on {new Date(parent.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" data-testid={`badge-status-${parent.id}`}>
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                      <span className="text-muted-foreground" data-testid={`text-parent-email-${parent.id}`}>
                        {parent.email}
                      </span>
                    </div>
                    {parent.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Phone:</span>
                        <span className="text-muted-foreground" data-testid={`text-parent-phone-${parent.id}`}>
                          {parent.phone}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => approveMutation.mutate(parent.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="flex-1"
                      data-testid={`button-approve-${parent.id}`}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => rejectMutation.mutate(parent.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="flex-1"
                      data-testid={`button-reject-${parent.id}`}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
