import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ServicesSection() {
  const services = [
    {
      title: "Create Your Own Routines",
      description:
        "Build custom workout plans with our intuitive drag-and-drop interface. Add exercises, set durations, and customize every detail.",
      icon: "🏋️",
    },
    {
      title: "Download Pre-Made Routines",
      description:
        "Access thousands of professionally designed workouts from certified trainers. Filter by difficulty, duration, and equipment needed.",
      icon: "📱",
    },
    {
      title: "Create and Sell Routines",
      description:
        "Monetize your expertise by selling your workout routines to other trainers and fitness enthusiasts in our marketplace.",
      icon: "💰",
    },
  ]

  return (
    <section id="services" className="py-20 bg-muted/50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed specifically for fitness professionals who want to create exceptional training
            experiences.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">{service.icon}</div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{service.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
