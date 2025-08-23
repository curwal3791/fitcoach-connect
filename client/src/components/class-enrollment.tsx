import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, UserCheck, UserX } from "lucide-react";

interface ClassEnrollmentProps {
  eventId: string;
  eventTitle: string;
}

export function ClassEnrollment({ eventId, eventTitle }: ClassEnrollmentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all clients
  const { data: allClients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Fetch enrolled clients for this event
  const { data: enrolledClients = [] } = useQuery({
    queryKey: ["/api/calendar/events", eventId, "clients"],
  });

  // Enroll/unenroll mutation
  const enrollmentMutation = useMutation({
    mutationFn: async ({ clientId, action }: { clientId: string; action: "enroll" | "unenroll" }) => {
      if (action === "enroll") {
        const response = await apiRequest("POST", `/api/calendar/events/${eventId}/clients`, {
          clientId,
        });
        return await response.json();
      } else {
        const response = await apiRequest("DELETE", `/api/calendar/events/${eventId}/clients/${clientId}`, {});
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events", eventId, "clients"] });
      toast({
        title: "Success",
        description: "Client enrollment updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update client enrollment.",
        variant: "destructive",
      });
    },
  });

  const handleEnrollmentToggle = (clientId: string, isEnrolled: boolean) => {
    enrollmentMutation.mutate({
      clientId,
      action: isEnrolled ? "unenroll" : "enroll",
    });
  };

  const enrolledClientIds = new Set(enrolledClients.map((client: any) => client.id));

  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" data-testid="button-manage-enrollment">
            <Users className="w-4 h-4 mr-2" />
            Manage Clients ({enrolledClients.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Client Enrollment - {eventTitle}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Enrolled clients summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Enrolled Clients ({enrolledClients.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enrolledClients.length === 0 ? (
                  <p className="text-sm text-gray-500">No clients enrolled yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {enrolledClients.map((client: any) => (
                      <Badge key={client.id} variant="default">
                        {client.firstName} {client.lastName}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client enrollment list */}
            <div className="max-h-96 overflow-y-auto">
              <h4 className="font-medium mb-3">Select Clients for This Class</h4>
              <div className="space-y-2">
                {allClients.map((client: any) => {
                  const isEnrolled = enrolledClientIds.has(client.id);
                  return (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={isEnrolled}
                          onCheckedChange={() => handleEnrollmentToggle(client.id, isEnrolled)}
                          disabled={enrollmentMutation.isPending}
                          data-testid={`checkbox-client-${client.id}`}
                        />
                        <div>
                          <p className="font-medium">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {client.email} • {client.fitnessLevel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEnrolled ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Enrolled
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <UserPlus className="w-3 h-3 mr-1" />
                            Available
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setIsDialogOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClassEnrollment;