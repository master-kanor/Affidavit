import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Shield, Lock, FileText, Database, Activity, CheckCircle2, AlertTriangle, Upload, UserCheck, Bot, LogOut, Search, Scale } from "lucide-react";
import { AIChatBox } from "@/components/AIChatBox";
import { toast } from "sonner";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dossier");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<any>("document");
  const [newStatus, setNewStatus] = useState<any>("pending");

  const utils = trpc.useUtils();
  const evidenceQuery = trpc.evidence.list.useQuery(undefined, { enabled: isAuthenticated });
  const auditQuery = trpc.audit.logs.useQuery(undefined, { enabled: isAuthenticated && (user?.role === "owner" || user?.role === "admin") });
  const notificationsQuery = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated });

  const createEvidenceMutation = trpc.evidence.create.useMutation({
    onSuccess: () => {
      toast.success("Evidence item successfully uploaded and cataloged.");
      setNewTitle("");
      setNewDesc("");
      utils.evidence.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err.message}`);
    },
  });

  const aiAskMutation = trpc.ai.ask.useMutation();
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Greetings. I am the Master Kanor Case AI Assistant. Ask me any question regarding the affidavit, testimonies, or verified evidence." }
  ]);
  const [aiInput, setAiInput] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#101722] text-[#E6E0D4] flex flex-col justify-between p-6 md:p-12 font-serif">
        <header className="flex justify-between items-center border-b border-[#2C3E55] pb-6">
          <div className="flex items-center space-x-3">
            <Scale className="w-8 h-8 text-[#D4AF37]" />
            <div>
              <h1 className="text-xl font-bold tracking-wider text-[#D4AF37]">MASTER KANOR CASE PORTAL</h1>
              <p className="text-xs text-[#9BA8B7] tracking-widest uppercase">Secure Legal Dossier & Evidence System</p>
            </div>
          </div>
          <Button onClick={() => startLogin()} className="bg-[#D4AF37] text-[#101722] hover:bg-[#C59B27] font-sans font-semibold">
            <Lock className="w-4 h-4 mr-2" /> Secure Sign In
          </Button>
        </header>

        <main className="max-w-4xl mx-auto my-auto text-center py-16">
          <Badge className="bg-[#1C2B3A] text-[#D4AF37] border border-[#D4AF37]/30 mb-6 px-4 py-1 text-sm tracking-widest uppercase">
            RESTRICTED ACCESS PORTAL
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#F6F2EB] leading-tight">
            Official Affidavit & Evidence Management System
          </h2>
          <p className="text-[#9BA8B7] text-lg max-w-2xl mx-auto font-sans mb-10 leading-relaxed">
            This private repository contains confidential legal testimonies, verified evidence galleries, digital forensics logs, and secure audit trails for authorized reviewers only.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => startLogin()} size="lg" className="bg-[#D4AF37] text-[#101722] hover:bg-[#C59B27] font-sans font-bold px-8 py-6 text-base">
              Authenticate via Manus OAuth
            </Button>
          </div>
        </main>

        <footer className="text-center text-xs text-[#6B7C93] border-t border-[#2C3E55] pt-6 font-sans">
          &copy; 2026 Master Kanor Case Defense Team. All Rights Reserved. Restricted under Attorney-Client / Investigative Privilege.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101722] text-[#E6E0D4] font-serif flex flex-col">
      {/* Top Navbar */}
      <header className="bg-[#182232] border-b border-[#2C3E55] px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <Scale className="w-6 h-6 text-[#D4AF37]" />
          <div>
            <h1 className="text-base font-bold text-[#D4AF37] tracking-wide">MASTER KANOR DOSSIER</h1>
            <p className="text-[10px] text-[#9BA8B7] uppercase tracking-wider">Role: <span className="text-[#D4AF37] font-bold">{user?.role?.toUpperCase()}</span> | {user?.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => logout()} className="border-[#2C3E55] text-[#E6E0D4] hover:bg-[#2C3E55] font-sans">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#182232] border border-[#2C3E55] p-1 rounded-lg">
            <TabsTrigger value="dossier" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#101722] font-sans text-sm">
              <FileText className="w-4 h-4 mr-2" /> Affidavit Dossier
            </TabsTrigger>
            <TabsTrigger value="evidence" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#101722] font-sans text-sm">
              <Database className="w-4 h-4 mr-2" /> Evidence Gallery ({evidenceQuery.data?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#101722] font-sans text-sm">
              <Bot className="w-4 h-4 mr-2" /> Ask Case AI
            </TabsTrigger>
            {(user?.role === "owner" || user?.role === "admin") && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#101722] font-sans text-sm">
                <Shield className="w-4 h-4 mr-2" /> Admin & Audit Logs
              </TabsTrigger>
            )}
          </TabsList>

          {/* Affidavit Dossier Tab */}
          <TabsContent value="dossier" className="space-y-6">
            <Card className="bg-[#182232] border-[#2C3E55] text-[#E6E0D4] shadow-xl">
              <CardHeader className="border-b border-[#2C3E55]">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl text-[#D4AF37]">Official Affidavit of Evidence (2026)</CardTitle>
                    <CardDescription className="text-[#9BA8B7] font-sans">
                      Complainant: Charles Tanauan (a.k.a. Master Kanor) | Case: Cybercrime & Unauthorized Experimentation
                    </CardDescription>
                  </div>
                  <Button className="bg-[#D4AF37] text-[#101722] hover:bg-[#C59B27] font-sans" onClick={() => window.print()}>
                    Export Official PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8 font-serif leading-relaxed text-lg">
                <div className="bg-[#101722] p-6 rounded-lg border border-[#2C3E55] space-y-4">
                  <h3 className="text-xl font-bold text-[#D4AF37] border-b border-[#2C3E55] pb-2">PRELIMINARY STATEMENT</h3>
                  <p>
                    AKO AY BIKTIMA NG CYBERCRIME, HINDI AWTORISADONG EXPERIMENTASYON, AT NG GRUPONG IT SHADOW, BUSINESS MIRROR, AT MANIPULASYONG MAY KINALAMAN SA CYBERSECURITY SCHEME.
                  </p>
                  <p className="text-base text-[#9BA8B7] font-sans">
                    Ako si Charles Tanauan, a.k.a. Master Kanor, isang gaming content creator na taga Brgy. 49, nagpapatunay sa mga kaganapang nakasaad sa opisyal na kasong ito simula 2025 hanggang 2026.
                  </p>
                </div>

                <div className="bg-[#101722] p-6 rounded-lg border border-[#2C3E55] space-y-4">
                  <h3 className="text-xl font-bold text-[#D4AF37] border-b border-[#2C3E55] pb-2">TESTIMONY 1: THE FIRST COMPUTER & SETUP</h3>
                  <p className="text-base text-[#E6E0D4] font-sans">
                    Nagsimula ang lahat nang ibinenta ko ang lumang cellphone para sa isang computer na pinasetyo ko kay Carl Justin Pagaspas. Dito nagsimula ang pagdami ng engagement sa aking social media channels at ang pagpasok ng mga promosyon.
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#182232] p-4 rounded border border-[#2C3E55] text-center font-sans">
                      <div className="text-xs text-[#D4AF37] font-bold mb-1">EXHIBIT A-1</div>
                      <div className="text-xs text-[#9BA8B7]">First Computer Setup Logs & Hardware Verification</div>
                    </div>
                    <div className="bg-[#182232] p-4 rounded border border-[#2C3E55] text-center font-sans">
                      <div className="text-xs text-[#D4AF37] font-bold mb-1">EXHIBIT A-2</div>
                      <div className="text-xs text-[#9BA8B7]">Social Media Channel Analytics Snapshot</div>
                    </div>
                    <div className="bg-[#182232] p-4 rounded border border-[#2C3E55] text-center font-sans">
                      <div className="text-xs text-[#D4AF37] font-bold mb-1">EXHIBIT A-3</div>
                      <div className="text-xs text-[#9BA8B7]">Carl Justin Pagaspas Transaction Receipts</div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#101722] p-6 rounded-lg border border-[#2C3E55] space-y-4">
                  <h3 className="text-xl font-bold text-[#D4AF37] border-b border-[#2C3E55] pb-2">TESTIMONY 2: THE CYBERSECURITY INTRUSION</h3>
                  <p className="text-base text-[#E6E0D4] font-sans">
                    Natuklasan ang hindi awtorisadong pag-access, remote packet injection, at manipulasyon ng mga account sa pamamagitan ng IT Shadow network. Ang mga ebidensya ay nakaimbak sa Cloudflare R2 at Supabase database para sa beripikasyon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evidence Gallery Tab */}
          <TabsContent value="evidence" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Form (Owner/Admin) */}
              {(user?.role === "owner" || user?.role === "admin") && (
                <Card className="bg-[#182232] border-[#2C3E55] text-[#E6E0D4]">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#D4AF37]">Upload Evidence Item</CardTitle>
                    <CardDescription className="text-xs text-[#9BA8B7] font-sans">Add verified case files to the secure catalog.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 font-sans">
                    <div>
                      <label className="text-xs text-[#9BA8B7] block mb-1">Evidence Title</label>
                      <Input placeholder="e.g. CCTV Capture 01" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="bg-[#101722] border-[#2C3E55] text-[#E6E0D4]" />
                    </div>
                    <div>
                      <label className="text-xs text-[#9BA8B7] block mb-1">Description</label>
                      <Textarea placeholder="Detailed observations..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="bg-[#101722] border-[#2C3E55] text-[#E6E0D4]" />
                    </div>
                    <div>
                      <label className="text-xs text-[#9BA8B7] block mb-1">Evidence Type</label>
                      <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full bg-[#101722] border border-[#2C3E55] text-[#E6E0D4] rounded p-2 text-sm">
                        <option value="document">Document</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="physical">Physical</option>
                        <option value="digital">Digital</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#9BA8B7] block mb-1">Status (Exact 4 States)</label>
                      <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full bg-[#101722] border border-[#2C3E55] text-[#E6E0D4] rounded p-2 text-sm">
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="disputed">Disputed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <Button onClick={() => createEvidenceMutation.mutate({ title: newTitle, description: newDesc, type: newType, status: newStatus })} className="w-full bg-[#D4AF37] text-[#101722] hover:bg-[#C59B27] font-bold">
                      <Upload className="w-4 h-4 mr-2" /> Catalog Evidence
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Evidence List */}
              <div className={`${(user?.role === "owner" || user?.role === "admin") ? "lg:col-span-2" : "lg:col-span-3"} space-y-4`}>
                <h3 className="text-xl font-bold text-[#D4AF37]">Cataloged Evidence Registry</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evidenceQuery.data?.map((item) => (
                    <Card key={item.id} className="bg-[#182232] border-[#2C3E55] text-[#E6E0D4]">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base text-[#D4AF37]">{item.title}</CardTitle>
                          <Badge className={
                            item.status === "verified" ? "bg-green-900 text-green-200 border-green-700" :
                            item.status === "disputed" ? "bg-red-900 text-red-200 border-red-700" :
                            item.status === "archived" ? "bg-gray-800 text-gray-300 border-gray-600" :
                            "bg-yellow-900 text-yellow-200 border-yellow-700"
                          }>
                            {item.status.toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs text-[#9BA8B7] font-sans">Type: {item.type.toUpperCase()} | ID: #{item.id}</CardDescription>
                      </CardHeader>
                      <CardContent className="font-sans text-sm space-y-3">
                        <p className="text-[#E6E0D4]">{item.description || "No description provided."}</p>
                        <div className="text-xs text-[#6B7C93] flex justify-between pt-2 border-t border-[#2C3E55]">
                          <span>Added: {new Date(item.createdAt).toLocaleDateString()}</span>
                          <span className="text-[#D4AF37] cursor-pointer hover:underline">Secure Download</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {evidenceQuery.data?.length === 0 && (
                    <p className="text-[#9BA8B7] italic font-sans">No evidence records found in the repository.</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Ask AI Tab */}
          <TabsContent value="ai" className="space-y-6">
            <Card className="bg-[#182232] border-[#2C3E55] text-[#E6E0D4]">
              <CardHeader className="border-b border-[#2C3E55]">
                <CardTitle className="text-lg text-[#D4AF37]">Master Kanor Case Intelligence AI</CardTitle>
                <CardDescription className="text-[#9BA8B7] font-sans">
                  Grounded Q&A assistant for querying verified affidavit sections and evidence records.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4 font-sans">
                <div className="bg-[#101722] p-4 rounded-lg border border-[#2C3E55] h-[400px] overflow-y-auto space-y-4">
                  {aiChatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === "user" ? "bg-[#D4AF37] text-[#101722]" : "bg-[#1C2B3A] text-[#E6E0D4] border border-[#2C3E55]"}`}>
                        <p className="font-bold text-xs opacity-75 mb-1">{msg.role === "user" ? "Reviewer" : "Case AI"}</p>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {aiAskMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-[#1C2B3A] text-[#9BA8B7] p-3 rounded-lg text-sm italic">Analyzing case records...</div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about testimonies, evidence items, or timeline..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && aiInput.trim()) {
                        const prompt = aiInput;
                        setAiInput("");
                        setAiChatMessages(prev => [...prev, { role: "user", content: prompt }]);
                        aiAskMutation.mutate({ prompt }, {
                          onSuccess: (data) => {
                            const replyText = typeof data.reply === "string" ? data.reply : JSON.stringify(data.reply);
                            setAiChatMessages(prev => [...prev, { role: "assistant", content: replyText }]);
                          }
                        });
                      }
                    }}
                    className="bg-[#101722] border-[#2C3E55] text-[#E6E0D4]"
                  />
                  <Button
                    onClick={() => {
                      if (!aiInput.trim()) return;
                      const prompt = aiInput;
                      setAiInput("");
                      setAiChatMessages(prev => [...prev, { role: "user", content: prompt }]);
                      aiAskMutation.mutate({ prompt }, {
                        onSuccess: (data) => {
                          const replyText = typeof data.reply === "string" ? data.reply : JSON.stringify(data.reply);
                          setAiChatMessages(prev => [...prev, { role: "assistant", content: replyText }]);
                        }
                      });
                    }}
                    className="bg-[#D4AF37] text-[#101722] hover:bg-[#C59B27] font-bold"
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin & Audit Logs Tab */}
          {(user?.role === "owner" || user?.role === "admin") && (
            <TabsContent value="admin" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                <Card className="bg-[#182232] border-[#2C3E55] text-[#E6E0D4]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-[#9BA8B7] uppercase tracking-wider">System Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 text-green-400 font-bold text-lg">
                      <CheckCircle2 className="w-5 h-5" /> <span>ONLINE (200 OK)</span>
                    </div>
                    <p className="text-xs text-[#9BA8B7] mt-1">Supabase DB & Cloudflare Edge active.</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#182232] border-[#2C3E55] text-[#E6E0D4]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-[#9BA8B7] uppercase tracking-wider">Midnight Cron Audit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-[#D4AF37]">Scheduled Daily 00:00 UTC</div>
                    <p className="text-xs text-[#9BA8B7] mt-1">Logs directly to AUTO_DEPLOYMENT_LOG table.</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#182232] border-[#2C3E55] text-[#E6E0D4]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-[#9BA8B7] uppercase tracking-wider">Active Role</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-[#D4AF37] uppercase">{user?.role}</div>
                    <p className="text-xs text-[#9BA8B7] mt-1">Full administrative privileges verified.</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-[#182232] border-[#2C3E55] text-[#E6E0D4]">
                <CardHeader>
                  <CardTitle className="text-lg text-[#D4AF37]">AUTO_DEPLOYMENT_LOG Table</CardTitle>
                  <CardDescription className="text-xs text-[#9BA8B7] font-sans">Recent midnight automated check results.</CardDescription>
                </CardHeader>
                <CardContent className="font-sans">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#2C3E55] text-xs text-[#9BA8B7]">
                          <th className="p-3">Log ID</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Tests Passed</th>
                          <th className="p-3">Details</th>
                          <th className="p-3">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-[#2C3E55]">
                        {auditQuery.data?.map((log) => (
                          <tr key={log.id} className="hover:bg-[#1C2B3A]">
                            <td className="p-3">#{log.id}</td>
                            <td className="p-3 font-bold">
                              <span className={log.status === "PASS" ? "text-green-400" : "text-red-400"}>{log.status}</span>
                            </td>
                            <td className="p-3">{log.testsPassed} / 3</td>
                            <td className="p-3 text-xs text-[#9BA8B7]">{log.details}</td>
                            <td className="p-3 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                        {auditQuery.data?.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-[#9BA8B7] italic">No auto-deployment logs recorded yet. Trigger /api/cron/midnight-audit to test.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <footer className="bg-[#182232] border-t border-[#2C3E55] py-4 px-6 text-center text-xs text-[#6B7C93] font-sans">
        Master Kanor Case Secure Portal | Domain: masterkanorcase.online | Connected via Manus OAuth & Supabase
      </footer>
    </div>
  );
}
