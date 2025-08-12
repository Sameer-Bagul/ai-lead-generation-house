import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Users, 
  MapPin, 
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Phone,
  MessageSquare,
  Target,
  BarChart3
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface CampaignStats {
  totalCustomersApproached: number;
  positiveResponses: number;
  negativeResponses: number;
  pendingResponses: number;
  cityWiseData: Array<{
    city: string;
    count: number;
    positive: number;
    negative: number;
  }>;
  dayWiseData: Array<{
    date: string;
    pitched: number;
    positive: number;
    negative: number;
  }>;
  responseRate: number;
  conversionRate: number;
}

export function TotalCampaignAnalytics() {
  // Fetch comprehensive campaign analytics
  const { data: analytics, isLoading } = useQuery<CampaignStats>({
    queryKey: ['/api/campaigns/total-analytics'],
    select: (data) => data || {
      totalCustomersApproached: 0,
      positiveResponses: 0,
      negativeResponses: 0,
      pendingResponses: 0,
      cityWiseData: [],
      dayWiseData: [],
      responseRate: 0,
      conversionRate: 0
    }
  });

  // Fetch day-wise detailed analytics for last 30 days
  const { data: dayWiseAnalytics } = useQuery({
    queryKey: ['/api/campaigns/day-wise-analytics'],
    select: (data) => data || []
  });

  if (isLoading) {
    return (
      <Card className="card-palette">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-sm palette-text-secondary">Loading analytics...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = analytics!;
  const totalResponses = stats.positiveResponses + stats.negativeResponses;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-palette">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium palette-text">Total Approached</CardTitle>
            <Users className="h-4 w-4 palette-primary-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold palette-text">{stats.totalCustomersApproached.toLocaleString()}</div>
            <p className="text-xs palette-text-secondary">
              Lifetime campaign reach
            </p>
          </CardContent>
        </Card>

        <Card className="card-palette">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium palette-text">Positive Responses</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.positiveResponses.toLocaleString()}</div>
            <p className="text-xs palette-text-secondary">
              {totalResponses > 0 ? `${((stats.positiveResponses / totalResponses) * 100).toFixed(1)}% of responses` : 'No responses yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-palette">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium palette-text">Negative Responses</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.negativeResponses.toLocaleString()}</div>
            <p className="text-xs palette-text-secondary">
              {totalResponses > 0 ? `${((stats.negativeResponses / totalResponses) * 100).toFixed(1)}% of responses` : 'No responses yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-palette">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium palette-text">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 palette-accent-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold palette-accent-text">{stats.responseRate.toFixed(1)}%</div>
            <Progress 
              value={stats.responseRate} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="city-wise" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="city-wise">City-wise Analysis</TabsTrigger>
          <TabsTrigger value="day-wise">Day-wise Trends</TabsTrigger>
        </TabsList>

        {/* City-wise Data */}
        <TabsContent value="city-wise" className="space-y-4">
          <Card className="card-palette">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 palette-text">
                <MapPin className="h-5 w-5" />
                City-wise Campaign Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.cityWiseData.length > 0 ? (
                <div className="space-y-4">
                  {stats.cityWiseData
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10)
                    .map((city, index) => (
                    <div key={city.city} className="flex items-center justify-between p-3 border rounded-lg card-palette">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full palette-primary text-white text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium palette-text">{city.city}</h4>
                          <p className="text-sm palette-text-secondary">{city.count} customers approached</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-green-600">{city.positive}</div>
                          <div className="text-xs palette-text-secondary">Positive</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-red-600">{city.negative}</div>
                          <div className="text-xs palette-text-secondary">Negative</div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {city.count > 0 ? ((city.positive / city.count) * 100).toFixed(1) : 0}% success
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 palette-text-secondary">
                  No city-wise data available yet. Start campaigns to see geographical insights.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Day-wise Data */}
        <TabsContent value="day-wise" className="space-y-4">
          <Card className="card-palette">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 palette-text">
                <Calendar className="h-5 w-5" />
                Daily Campaign Activity (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.dayWiseData.length > 0 ? (
                <div className="space-y-3">
                  {stats.dayWiseData
                    .slice(0, 30)
                    .map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg card-palette">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 palette-primary-text" />
                        <div>
                          <h4 className="font-medium palette-text">
                            {format(new Date(day.date), 'MMM dd, yyyy')}
                          </h4>
                          <p className="text-sm palette-text-secondary">
                            {format(new Date(day.date), 'EEEE')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-sm font-medium palette-text">{day.pitched}</div>
                          <div className="text-xs palette-text-secondary">Pitched</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-green-600">{day.positive}</div>
                          <div className="text-xs palette-text-secondary">Positive</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-red-600">{day.negative}</div>
                          <div className="text-xs palette-text-secondary">Negative</div>
                        </div>
                        <div className="text-center min-w-[80px]">
                          <Progress 
                            value={day.pitched > 0 ? (day.positive / day.pitched) * 100 : 0} 
                            className="h-2"
                          />
                          <div className="text-xs palette-text-secondary mt-1">
                            {day.pitched > 0 ? ((day.positive / day.pitched) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 palette-text-secondary">
                  No daily data available yet. Campaign activity will appear here as you conduct outreach.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Insights */}
      <Card className="card-palette">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 palette-text">
            <BarChart3 className="h-5 w-5" />
            Campaign Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg card-palette">
              <Target className="h-8 w-8 palette-primary-text mx-auto mb-2" />
              <div className="text-2xl font-bold palette-text">{stats.conversionRate.toFixed(1)}%</div>
              <div className="text-sm palette-text-secondary">Conversion Rate</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg card-palette">
              <Phone className="h-8 w-8 palette-accent-text mx-auto mb-2" />
              <div className="text-2xl font-bold palette-text">
                {stats.cityWiseData.length}
              </div>
              <div className="text-sm palette-text-secondary">Cities Reached</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg card-palette">
              <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold palette-text">
                {stats.pendingResponses.toLocaleString()}
              </div>
              <div className="text-sm palette-text-secondary">Pending Responses</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}