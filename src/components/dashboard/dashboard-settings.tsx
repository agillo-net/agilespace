import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Settings, Filter, Eye, EyeOff, RotateCcw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DashboardSection {
  id: string
  label: string
  description: string
  enabled: boolean
  category: 'core' | 'analytics' | 'team'
}

interface DashboardFilter {
  dateRange: string
  teamMembers: string[]
  tracks: string[]
  sessionTypes: string[]
  minDuration: number
}

interface DashboardSettingsProps {
  sections: DashboardSection[]
  filters: DashboardFilter
  onSectionsChange: (sections: DashboardSection[]) => void
  onFiltersChange: (filters: DashboardFilter) => void
  onResetToDefaults: () => void
}

const DEFAULT_SECTIONS: DashboardSection[] = [
  { id: 'stats', label: 'Dashboard Stats', description: 'Overview statistics', enabled: true, category: 'core' },
  { id: 'activeSessions', label: 'Active Sessions', description: 'Currently active sessions', enabled: true, category: 'core' },
  { id: 'teamMembers', label: 'Team Members', description: 'Team member overview', enabled: true, category: 'team' },
  { id: 'sessionActivity', label: 'Session Activity', description: 'Session activity chart', enabled: true, category: 'analytics' },
  { id: 'trackStats', label: 'Track Statistics', description: 'Track performance metrics', enabled: true, category: 'analytics' },
  { id: 'timeHeatmap', label: 'Activity Heatmap', description: 'Time-based activity patterns', enabled: true, category: 'analytics' },
  { id: 'productivityTrend', label: 'Productivity Trends', description: 'Productivity metrics over time', enabled: true, category: 'analytics' },
  { id: 'focusTimeDistribution', label: 'Focus Time Distribution', description: 'Focus time breakdown', enabled: true, category: 'analytics' },
]

const DATE_RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 3 months' },
  { value: 'custom', label: 'Custom range' },
]

const SESSION_TYPE_OPTIONS = [
  { value: 'focus', label: 'Focus Sessions' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'meeting', label: 'Meetings' },
  { value: 'break', label: 'Breaks' },
]

export function DashboardSettings({
  sections,
  filters,
  onSectionsChange,
  onFiltersChange,
  onResetToDefaults
}: DashboardSettingsProps) {
  const [activeTab, setActiveTab] = useState<'sections' | 'filters'>('sections')

  const handleSectionToggle = (sectionId: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId ? { ...section, enabled: !section.enabled } : section
    )
    onSectionsChange(updatedSections)
  }

  const handleCategoryToggle = (category: string, enabled: boolean) => {
    const updatedSections = sections.map(section =>
      section.category === category ? { ...section, enabled } : section
    )
    onSectionsChange(updatedSections)
  }

  const handleFilterChange = (key: keyof DashboardFilter, value: string | string[] | number) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const getCategoryStats = (category: string) => {
    const categorySections = sections.filter(s => s.category === category)
    const enabledCount = categorySections.filter(s => s.enabled).length
    return { total: categorySections.length, enabled: enabledCount }
  }

  const categories = [
    { id: 'core', label: 'Core Features', description: 'Essential dashboard components' },
    { id: 'analytics', label: 'Analytics', description: 'Advanced analytics and charts' },
    { id: 'team', label: 'Team Insights', description: 'Team collaboration features' },
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Customize Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription>
            Customize your dashboard layout and apply filters to focus on what matters most.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'sections' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('sections')}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Sections
            </Button>
            <Button
              variant={activeTab === 'filters' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('filters')}
              className="flex-1"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Sections Tab */}
          {activeTab === 'sections' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Dashboard Sections</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose which sections to display on your dashboard
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetToDefaults}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to Defaults
                </Button>
              </div>

              {categories.map((category) => {
                const stats = getCategoryStats(category.id)
                return (
                  <Card key={category.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{category.label}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">
                            {stats.enabled}/{stats.total} enabled
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`${category.id}-toggle`} className="text-sm">
                              Enable All
                            </Label>
                            <Switch
                              id={`${category.id}-toggle`}
                              checked={stats.enabled === stats.total}
                              onCheckedChange={(checked) => handleCategoryToggle(category.id, checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {sections
                        .filter(section => section.category === category.id)
                        .map((section) => (
                          <div key={section.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center space-x-3">
                              {section.enabled ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium">{section.label}</p>
                                <p className="text-sm text-muted-foreground">{section.description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={section.enabled}
                              onCheckedChange={() => handleSectionToggle(section.id)}
                            />
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Filters Tab */}
          {activeTab === 'filters' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Dashboard Filters</h3>
                <p className="text-sm text-muted-foreground">
                  Apply filters to focus on specific data ranges and criteria
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Date Range Filter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Date Range</CardTitle>
                    <CardDescription>Select the time period for data analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) => handleFilterChange('dateRange', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_RANGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Session Types Filter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Session Types</CardTitle>
                    <CardDescription>Filter by session types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {SESSION_TYPE_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Switch
                            id={option.value}
                            checked={filters.sessionTypes.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const newTypes = checked
                                ? [...filters.sessionTypes, option.value]
                                : filters.sessionTypes.filter(t => t !== option.value)
                              handleFilterChange('sessionTypes', newTypes)
                            }}
                          />
                          <Label htmlFor={option.value}>{option.label}</Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Minimum Duration Filter */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Minimum Session Duration</CardTitle>
                    <CardDescription>
                      Filter sessions by minimum duration (minutes): {filters.minDuration}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Slider
                      value={[filters.minDuration]}
                      onValueChange={(value) => handleFilterChange('minDuration', value[0])}
                      max={180}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>0 min</span>
                      <span>180 min</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { DEFAULT_SECTIONS }
export type { DashboardSection, DashboardFilter }