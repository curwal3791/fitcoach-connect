import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Users, Calendar, Presentation, PlayCircle, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-fitness-600">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-8">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              FitFlow
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Professional fitness training platform that empowers group fitness trainers to create, organize, and deliver structured workout routines with seamless presentation capabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-4"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-login"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-4"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to run amazing fitness classes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From routine creation to live presentation, FitFlow provides all the tools professional trainers need to deliver exceptional group fitness experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-routine-builder">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Drag & Drop Routine Builder</CardTitle>
                <CardDescription>
                  Create structured workout routines with our intuitive drag-and-drop interface. Set timing, reps, and music for each exercise.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-presentation">
              <CardHeader>
                <div className="w-12 h-12 bg-fitness/10 rounded-lg flex items-center justify-center mb-4">
                  <Presentation className="w-6 h-6 text-fitness-600" />
                </div>
                <CardTitle className="text-xl">Professional Presentation Mode</CardTitle>
                <CardDescription>
                  Full-screen presentation mode with large timers, exercise details, and upcoming exercise previews for seamless class delivery.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-exercise-library">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">Comprehensive Exercise Library</CardTitle>
                <CardDescription>
                  Access hundreds of exercises with filtering by category, difficulty, and equipment. Add your own custom exercises with media.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-calendar">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Smart Calendar Integration</CardTitle>
                <CardDescription>
                  Schedule classes, assign routines to sessions, and manage your training calendar with recurring event support.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-music">
              <CardHeader>
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Music Synchronization</CardTitle>
                <CardDescription>
                  Assign music tracks to exercises with BPM matching for perfectly timed workouts that keep your class energized.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid="card-secure">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Secure & Professional</CardTitle>
                <CardDescription>
                  Enterprise-grade security with cloud backup, user authentication, and professional tools designed for fitness professionals.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to transform your fitness classes?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of professional trainers who use FitFlow to create engaging, well-structured fitness experiences.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-4"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-cta-login"
          >
            Start Building Routines Today
          </Button>
        </div>
      </div>
    </div>
  );
}
