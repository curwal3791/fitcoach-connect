import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema, type Client, type InsertClient } from "@shared/schema";
import { Plus, User, Phone, Mail, Calendar, Target, AlertTriangle, Users, Search } from "lucide-react";
import { format } from "date-fns";

export default function Clients() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated && !isLoading,
  });

  // Create client form
  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema.omit({ trainerId: true })),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      goals: "",
      medicalConditions: "",
      injuries: "",
      fitnessLevel: "Beginner",
      notes: "",
    },
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: InsertClient) => {
      return await apiRequest("/api/clients", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Client created",
        description: "New client has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateClient = (data: InsertClient) => {
    createClientMutation.mutate(data);
  };

  // Filter clients based on search
  const filteredClients = clients.filter((client: Client) =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to access clients.</div>;
  }

  return (
    <main className="flex-1 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600 mt-1">Manage your clients and track their progress</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-client">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client profile with their personal information and fitness goals.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreateClient)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    {...form.register("firstName")}
                    placeholder="John"
                    data-testid="input-first-name"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    {...form.register("lastName")}
                    placeholder="Doe"
                    data-testid="input-last-name"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    {...form.register("email")}
                    type="email"
                    placeholder="john.doe@email.com"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    {...form.register("phone")}
                    placeholder="(555) 123-4567"
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fitnessLevel">Fitness Level</Label>
                <Select onValueChange={(value) => form.setValue("fitnessLevel", value)}>
                  <SelectTrigger data-testid="select-fitness-level">
                    <SelectValue placeholder="Select fitness level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="goals">Goals</Label>
                <Textarea
                  {...form.register("goals")}
                  placeholder="What are their fitness goals?"
                  data-testid="input-goals"
                />
              </div>

              <div>
                <Label htmlFor="medicalConditions">Medical Conditions</Label>
                <Textarea
                  {...form.register("medicalConditions")}
                  placeholder="Any medical conditions to be aware of?"
                  data-testid="input-medical-conditions"
                />
              </div>

              <div>
                <Label htmlFor="injuries">Injuries or Limitations</Label>
                <Textarea
                  {...form.register("injuries")}
                  placeholder="Any injuries or physical limitations?"
                  data-testid="input-injuries"
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  {...form.register("notes")}
                  placeholder="Any additional notes about this client?"
                  data-testid="input-notes"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createClientMutation.isPending}
                  data-testid="button-save"
                >
                  {createClientMutation.isPending ? "Creating..." : "Create Client"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filter */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search clients by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-clients"
          />
        </div>
      </div>

      {/* Clients grid */}
      {clientsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? "No clients match your search criteria." : "Get started by adding your first client."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-client">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client: Client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => setSelectedClient(client)}
                  data-testid={`card-client-${client.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {client.firstName} {client.lastName}
                </CardTitle>
                <CardDescription>
                  <Badge variant="secondary">{client.fitnessLevel}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {client.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      {client.phone}
                    </div>
                  )}
                  {client.goals && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{client.goals}</span>
                    </div>
                  )}
                  {(client.medicalConditions || client.injuries) && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">Medical notes</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Calendar className="h-3 w-3" />
                    Added {format(new Date(client.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Client detail modal */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedClient.firstName} {selectedClient.lastName}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Information</Label>
                    <div className="space-y-2 mt-1">
                      {selectedClient.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{selectedClient.email}</span>
                        </div>
                      )}
                      {selectedClient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{selectedClient.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Fitness Level</Label>
                    <div className="mt-1">
                      <Badge variant="secondary">{selectedClient.fitnessLevel}</Badge>
                    </div>
                  </div>
                </div>
                
                {selectedClient.goals && (
                  <div>
                    <Label>Goals</Label>
                    <p className="mt-1 text-sm text-gray-600">{selectedClient.goals}</p>
                  </div>
                )}
                
                {selectedClient.medicalConditions && (
                  <div>
                    <Label>Medical Conditions</Label>
                    <p className="mt-1 text-sm text-gray-600">{selectedClient.medicalConditions}</p>
                  </div>
                )}
                
                {selectedClient.injuries && (
                  <div>
                    <Label>Injuries & Limitations</Label>
                    <p className="mt-1 text-sm text-gray-600">{selectedClient.injuries}</p>
                  </div>
                )}
                
                {selectedClient.notes && (
                  <div>
                    <Label>Additional Notes</Label>
                    <p className="mt-1 text-sm text-gray-600">{selectedClient.notes}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="progress">
                <div className="text-center py-8">
                  <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Progress Tracking</h3>
                  <p className="text-gray-500">Progress tracking features coming soon!</p>
                </div>
              </TabsContent>
              
              <TabsContent value="attendance">
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance History</h3>
                  <p className="text-gray-500">Attendance tracking features coming soon!</p>
                </div>
              </TabsContent>
              
              <TabsContent value="notes">
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Client Notes</h3>
                  <p className="text-gray-500">Notes and communication features coming soon!</p>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}