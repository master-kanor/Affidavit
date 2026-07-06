import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Lock, Share2, Download, ArrowRight, User, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header with User Icon */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Master Kanor Affidavit</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                >
                  <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 hidden sm:inline">{user.email}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-slate-200">
                      <p className="text-sm font-medium text-slate-900">{user.email}</p>
                      <p className="text-xs text-slate-500 mt-1">Signed in</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800"
                onClick={() => window.location.href = `/login`}
              >
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 font-serif">
            Official Affidavit of Evidence
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 font-light">
            Charles Tanauan (a.k.a. Master Kanor)
          </p>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Comprehensive legal documentation with 12 affidavit sections, 331+ evidence files, and professional case presentation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => setLocation("/")}
            >
              View Evidence Dossier
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            {user && (
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-slate-900"
                onClick={() => setLocation("/admin")}
              >
                Admin Dashboard
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 font-serif text-slate-900">
            Complete Legal Documentation System
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="p-8 hover:shadow-lg transition-shadow border-0 bg-slate-50">
              <div className="mb-4">
                <FileText className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">
                12 Affidavit Sections
              </h3>
              <p className="text-slate-600">
                Complete narrative structure covering identity, background, gaming career, computer setup, casino promotions, vlogger partnerships, fraud discovery, device surveillance, poisoning attempt, IT sabotage, evidence tampering, and threats.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-8 hover:shadow-lg transition-shadow border-0 bg-slate-50">
              <div className="mb-4">
                <Share2 className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">
                331+ Evidence Files
              </h3>
              <p className="text-slate-600">
                Organized evidence galleries across 26 folders including social media channels, online stores, computer documentation, casino promotions, vlogger partnerships, surveillance footage, and comprehensive case documentation.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-8 hover:shadow-lg transition-shadow border-0 bg-slate-50">
              <div className="mb-4">
                <Download className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">
                Multi-Format Export
              </h3>
              <p className="text-slate-600">
                Export complete dossier as JSON, CSV, Markdown, or HTML. All formats include full metadata and are ready for sharing, archival, or integration with other systems.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Case Information Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 font-serif text-slate-900">
            Case Information
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Affiant</h3>
              <p className="text-slate-600 mb-6">
                Charles Tanauan (a.k.a. Master Kanor)
              </p>

              <h3 className="text-lg font-bold text-slate-900 mb-4">Respondents</h3>
              <ul className="text-slate-600 space-y-2 mb-6">
                <li>• Carl Justin Pagaspas</li>
                <li>• Mario Nalda Cadisal</li>
                <li>• Lawrence Daria</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Violations</h3>
              <p className="text-slate-600 mb-6">
                R.A. 10175 (Cybercrime Prevention Act)
              </p>

              <h3 className="text-lg font-bold text-slate-900 mb-4">Location</h3>
              <p className="text-slate-600">
                Imus, Cavite, Republic of the Philippines
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Access Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-12 rounded-lg border border-slate-200">
            <div className="flex items-start gap-4 mb-6">
              <Lock className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Secure Access & Authentication
                </h2>
                <p className="text-slate-600 mb-4">
                  This evidence dossier is protected with secure authentication. Admin users have access to content management features and export functionality. All data is encrypted and stored securely.
                </p>
                <p className="text-slate-600">
                  Exports are automatically saved to cloud storage and can be accessed anytime from your export history. All formats include full metadata and are ready for sharing or archival.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 font-serif">
            Access the Complete Evidence Dossier
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            View all 12 affidavit sections with organized evidence galleries and professional documentation
          </p>
          <Button
            size="lg"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => setLocation("/")}
          >
            View Dossier Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">About</h4>
              <p className="text-sm">
                Official affidavit and evidence documentation system for Charles Tanauan case
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Documentation</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white transition">README</a></li>
                <li><a href="#" className="hover:text-white transition">Deployment Guide</a></li>
                <li><a href="#" className="hover:text-white transition">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Contact</h4>
              <p className="text-sm">
                For inquiries, contact the case administrator
              </p>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-sm">
            <p>&copy; 2026 Charles Tanauan Official Affidavit & Evidence. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
