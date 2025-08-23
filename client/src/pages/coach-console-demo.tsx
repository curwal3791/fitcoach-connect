import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Monitor, Calendar, Users, PlayCircle } from "lucide-react";

function CoachConsoleDemo() {
  const [, navigate] = useLocation();

  // Demo event IDs (these would be from your actual events)
  const demoEvents = [
    {
      id: "demo-hiit-class",
      title: "HIIT Bootcamp Demo",
      time: "2:00 PM - 3:00 PM",
      date: "Today",
      location: "Studio A",
      type: "HIIT",
      enrolledCount: 8,
      status: "scheduled"
    },
    {
      id: "demo-yoga-class", 
      title: "Power Yoga Demo",
      time: "4:00 PM - 5:00 PM",
      date: "Today", 
      location: "Studio B",
      type: "Yoga",
      enrolledCount: 12,
      status: "scheduled"
    }
  ];

  const handleStartDemo = (eventId: string) => {
    navigate(`/coach-console/${eventId}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8" data-testid="coach-console-demo">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Coach Console Demo</h1>
        <p className="text-gray-600 mb-6">
          Experience the live class management features with these demo sessions. 
          The Coach Console provides real-time tools for conducting fitness classes.
        </p>
        
        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Live Check-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Quick client check-in with attendance tracking and roster management
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <PlayCircle className="w-5 h-5 mr-2 text-green-600" />
                Exercise Timers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Built-in timers for each exercise with automatic progression through routines
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Monitor className="w-5 h-5 mr-2 text-purple-600" />
                Session Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Record performance metrics and session notes for post-class analysis
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Demo Classes */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Try Demo Classes</h2>
        
        {demoEvents.map((event) => (
          <Card key={event.id} className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{event.date} • {event.time}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{event.enrolledCount} enrolled</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {event.type}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {event.status}
                    </span>
                    <span className="text-xs text-gray-500">{event.location}</span>
                  </div>
                </div>
                
                <div className="ml-6">
                  <Button
                    onClick={() => handleStartDemo(event.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    data-testid={`demo-start-${event.id}`}
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Start Demo Console
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card className="mt-8 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">Demo Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>1. Start a Demo Class:</strong> Click "Start Demo Console" on any class above</p>
            <p><strong>2. Check-in Clients:</strong> Use the roster panel to mark attendance</p>
            <p><strong>3. Follow the Routine:</strong> Navigate through exercises with built-in timers</p>
            <p><strong>4. Record Metrics:</strong> Add session notes and performance data</p>
            <p><strong>5. Complete Session:</strong> Generate an automated class summary</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6 text-center">
        <Button
          variant="outline"
          onClick={() => navigate("/calendar")}
          data-testid="back-to-calendar"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Back to Calendar
        </Button>
      </div>
    </div>
  );
}

export default CoachConsoleDemo;