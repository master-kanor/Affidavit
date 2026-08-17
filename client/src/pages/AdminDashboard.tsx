import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import MasterKanorChatAgent from "@/components/MasterKanorChatAgent";

export default function AdminDashboard() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <AuthorizedAdminDashboard />;
}

function AuthorizedAdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalEvidence: 331,
    activeCases: 1,
    activeUsers: 3,
    aiCostToday: 0.47,
    cacheHitRate: 62,
    uptime: 99.99,
  });

  const [systemStatus, setSystemStatus] = useState({
    cloudflarePages: "operational",
    supabaseDatabase: "operational",
    aiOrchestrator: "operational",
    cacheLayer: "operational",
    rollbackAutomation: "active",
  });

  useEffect(() => {
    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        aiCostToday: parseFloat((prev.aiCostToday + Math.random() * 0.01).toFixed(2)),
        cacheHitRate: Math.min(100, prev.cacheHitRate + Math.random() * 2),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Master Kanor Admin Dashboard</h1>
          <p className="text-slate-600">System monitoring and AI assistant control center</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.totalEvidence}</div>
              <p className="text-xs text-slate-500 mt-1">files indexed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.activeCases}</div>
              <p className="text-xs text-slate-500 mt-1">case open</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.activeUsers}</div>
              <p className="text-xs text-slate-500 mt-1">users online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">AI Cost (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${metrics.aiCostToday.toFixed(2)}</div>
              <p className="text-xs text-slate-500 mt-1">daily spend</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Cache Hit Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.cacheHitRate.toFixed(0)}%</div>
              <p className="text-xs text-slate-500 mt-1">efficiency</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.uptime}%</div>
              <p className="text-xs text-slate-500 mt-1">SLA</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="chat">AI Assistant</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Real-time infrastructure health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(systemStatus).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          status === "operational" || status === "active"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                      />
                      <span className="text-sm text-slate-600 capitalize">{status}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button variant="outline">Export Report</Button>
                <Button variant="outline">View Logs</Button>
                <Button variant="outline">Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evidence Tab */}
          <TabsContent value="evidence" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Evidence Management</CardTitle>
                <CardDescription>Overview of all case evidence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">Total Files: 331</p>
                    <p className="text-xs text-slate-500 mt-1">Organized in 26 folders</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">Evidence Types: 12+</p>
                    <p className="text-xs text-slate-500 mt-1">Documents, images, videos, audio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab with AI Assistant */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Master Kanor AI Assistant</CardTitle>
                <CardDescription>Real-time evidence analysis and case support</CardDescription>
              </CardHeader>
              <CardContent>
                <MasterKanorChatAgent />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700">AI Cost Threshold</p>
                  <p className="text-sm text-slate-600 mt-1">$5.00 per day</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700">Cache TTL</p>
                  <p className="text-sm text-slate-600 mt-1">1 hour</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700">Database Maintenance</p>
                  <p className="text-sm text-slate-600 mt-1">03:00 UTC daily</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
