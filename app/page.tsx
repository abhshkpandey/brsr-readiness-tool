import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  Users,
  Shield,
  Leaf,
  Building,
  FileText,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ClipboardList,
} from "lucide-react"
import Link from "next/link"

const metrics = [
  {
    title: "ESG Score",
    value: "78",
    unit: "/100",
    change: "+5.2%",
    trend: "up",
    icon: TrendingUp,
    color: "text-primary",
  },
  {
    title: "Workforce Data",
    value: "1,247",
    unit: "employees",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "text-accent",
  },
  {
    title: "Safety Incidents",
    value: "2",
    unit: "this year",
    change: "-67%",
    trend: "down",
    icon: Shield,
    color: "text-primary",
  },
  {
    title: "Carbon Footprint",
    value: "1,234",
    unit: "tCO2e",
    change: "-8.5%",
    trend: "down",
    icon: Leaf,
    color: "text-accent",
  },
]

const assessmentSections = [
  { name: "Workforce & Employment", completed: true, questions: 9 },
  { name: "Occupational Health & Safety", completed: true, questions: 9 },
  { name: "Employee Health & Well-being", completed: false, questions: 4 },
  { name: "Environmental Performance", completed: false, questions: 14 },
  { name: "Business Conduct & Governance", completed: false, questions: 9 },
  { name: "Business Ethics & Performance", completed: false, questions: 6 },
  { name: "Business Openness & RPTs", completed: false, questions: 6 },
  { name: "Related Party Transactions", completed: false, questions: 10 },
]

const completedSections = assessmentSections.filter((s) => s.completed).length
const totalSections = assessmentSections.length
const completionPercentage = (completedSections / totalSections) * 100

export default function Dashboard() {
  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-balance bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            BRSR Assessment Dashboard
          </h1>
          <p className="text-muted-foreground text-pretty text-sm md:text-base max-w-2xl leading-relaxed">
            Monitor your Business Responsibility and Sustainability Reporting readiness with comprehensive analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <Link href="/assessment">
              Continue Assessment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            key={metric.title}
            className="hover:shadow-lg transition-all duration-200 hover:scale-105 border-border/50 bg-gradient-to-br from-card to-card/50"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">{metric.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-muted/50 ${metric.color}`}>
                <metric.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">
                {metric.value}
                <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className={metric.trend === "up" ? "text-primary font-medium" : "text-accent font-medium"}>
                  {metric.change}
                </span>{" "}
                from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Assessment Progress */}
        <div className="xl:col-span-2">
          <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card to-card/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Building className="h-5 w-5 text-primary" />
                Assessment Progress
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Complete all sections to generate your comprehensive BRSR report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Overall Completion</span>
                <Badge variant="outline" className="font-semibold">
                  {completedSections} of {totalSections} sections
                </Badge>
              </div>
              <Progress value={completionPercentage} className="h-3 shadow-inner" />

              <div className="space-y-3">
                {assessmentSections.map((section) => (
                  <div
                    key={section.name}
                    className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {section.completed ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-balance">{section.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={section.completed ? "default" : "secondary"} className="text-xs">
                        {section.questions} questions
                      </Badge>
                      {section.completed && (
                        <Badge variant="outline" className="text-primary border-primary text-xs">
                          Complete
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card to-card/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                asChild
                className="w-full justify-start h-12 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <Link href="/assessment">
                  <ClipboardList className="mr-3 h-5 w-5" />
                  <span className="font-semibold">Continue Assessment</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 bg-transparent hover:bg-muted/50 transition-all duration-200"
                disabled
              >
                <FileText className="mr-3 h-5 w-5" />
                <span className="font-semibold">Generate Report</span>
                <Badge variant="secondary" className="ml-auto font-bold">
                  {Math.round(completionPercentage)}%
                </Badge>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 bg-transparent hover:bg-muted/50 transition-all duration-200"
              >
                <TrendingUp className="mr-3 h-5 w-5" />
                <span className="font-semibold">View Analytics</span>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="text-lg">Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-sm font-medium">BRSR Readiness</span>
                  <Badge variant="outline" className="font-bold text-primary border-primary">
                    {Math.round(completionPercentage)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-sm font-medium">Data Quality</span>
                  <Badge variant="default" className="font-bold">
                    Good
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-xs text-muted-foreground font-medium">2 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
