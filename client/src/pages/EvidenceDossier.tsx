import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useEvidenceList, useEvidenceCategories, useEvidenceSearch } from "@/hooks/useEvidence";
import { AffidavitView, TestimonySection } from "@/components/TestimonyView";
import { SearchBar } from "@/components/SearchBar";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2, Filter } from "lucide-react";

export const EvidenceDossier: React.FC = () => {
  const { user } = useAuth();
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

  return <AuthorizedEvidenceDossier user={user} />;
};

const AuthorizedEvidenceDossier: React.FC<{ user: any }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState("gallery");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const evidenceQuery = useEvidenceSearch(searchQuery, startDate, endDate, {
    limit: 100,
    enabled: true,
  });

  const filteredEvidence = React.useMemo(() => {
    if (!evidenceQuery.data?.evidence) return [];
    if (!selectedCategory) return evidenceQuery.data.evidence;
    return evidenceQuery.data.evidence.filter(
      (e: any) => e.category === selectedCategory,
    );
  }, [evidenceQuery.data?.evidence, selectedCategory]);

  const categoriesQuery = useEvidenceCategories(true);

  // Transform evidence into testimony sections
  const testimonySections: TestimonySection[] = React.useMemo(() => {
    if (!filteredEvidence) return [];

    return filteredEvidence
      .filter((e: any) => e.status === "verified")
      .reduce((sections: TestimonySection[], evidence: any, index: number) => {
        // Group by category
        const existingSection = sections.find(
          (s) => s.title === (evidence.category || "Uncategorized")
        );

        const galleryItem = {
          id: evidence.id,
          url: evidence.fileUrl,
          title: evidence.title,
          description: evidence.description,
          category: evidence.category,
          uploadedAt: evidence.createdAt,
          uploadedBy: evidence.uploadedBy,
        };

        if (existingSection) {
          existingSection.images?.push(galleryItem);
        } else {
          sections.push({
            id: `section-${index}`,
            title: evidence.category || "Uncategorized",
            content: `Evidence category: ${evidence.category || "Uncategorized"}`,
            order: index + 1,
            images: [galleryItem],
            videos: [],
            documents: [],
            highlights: [],
          });
        }

        return sections;
      }, []);
  }, [filteredEvidence]);

  const handleExport = async () => {
    try {
      // Create export document
      const exportData = {
        title: "Official Affidavit of Evidence",
        affiant: (user as any)?.name || "Unknown",
        sections: testimonySections,
        filters: {
          searchQuery,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          category: selectedCategory,
        },
        exportedAt: new Date().toISOString(),
      };

      // Download as JSON
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," +
          encodeURIComponent(JSON.stringify(exportData, null, 2))
      );
      element.setAttribute("download", "affidavit-evidence.json");
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setSelectedCategory(null);
  };

  const hasActiveFilters = searchQuery || startDate || endDate || selectedCategory;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Evidence Dossier
          </h1>
          <p className="text-lg text-slate-600">
            Complete documentation of all verified evidence for the case
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={handleExport}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
          >
            <Download className="w-4 h-4" />
            Export Dossier
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 ml-auto"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>

        {/* Search and Filter Section */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div>
                <label className="text-sm font-semibold text-slate-900 mb-2 block">
                  Search Evidence
                </label>
              <SearchBar
                onSearch={setSearchQuery}
                placeholder="Search by title, description, or category..."
                debounceMs={300}
                showHistory={true}
                value={searchQuery}
                onClear={() => setSearchQuery("")}
              />
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-sm font-semibold text-slate-900 mb-2 block">
                  Date Range
                </label>
                <DateRangePicker
                  onDateRangeChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                  placeholder="Select date range"
                  startDate={startDate?.toISOString().split('T')[0]}
                  endDate={endDate?.toISOString().split('T')[0]}
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-sm font-semibold text-slate-900 mb-2 block">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Categories
                  </Button>
                  {categoriesQuery.data?.categories?.map((category: string) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Filter Actions */}
              {hasActiveFilters && (
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="flex-1"
                  >
                    Reset All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Summary */}
        {(searchQuery || startDate || endDate) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              Found <strong>{filteredEvidence.length}</strong> evidence item{filteredEvidence.length !== 1 ? "s" : ""} matching your filters
              {searchQuery && ` for "${searchQuery}"`}
              {startDate && ` from ${startDate.toLocaleDateString()}`}
              {endDate && ` to ${endDate.toLocaleDateString()}`}
            </p>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="gallery">Gallery View</TabsTrigger>
            <TabsTrigger value="testimony">Testimony</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Gallery View Tab */}
          <TabsContent value="gallery">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Evidence Gallery</h2>

              {evidenceQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : filteredEvidence && filteredEvidence.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEvidence
                    .filter((e: any) => e.status === "verified")
                    .map((evidence: any) => (
                      <div
                        key={evidence.id}
                        className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {evidence.fileUrl && (
                          <img
                            src={evidence.fileUrl}
                            alt={evidence.title}
                            className="w-full h-48 object-cover"
                            loading="lazy"
                          />
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-slate-900 mb-1">
                            {evidence.title}
                          </h3>
                          <p className="text-sm text-slate-600 mb-2">
                            {evidence.description}
                          </p>
                          <div className="flex gap-2 text-xs text-slate-500">
                            <span className="bg-slate-200 px-2 py-1 rounded">
                              {evidence.category}
                            </span>
                            <span className="bg-green-200 px-2 py-1 rounded">
                              {evidence.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-600">
                    {hasActiveFilters
                      ? "No evidence found matching your filters"
                      : "No verified evidence found"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Testimony Tab */}
          <TabsContent value="testimony">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <AffidavitView
                title="Official Affidavit of Evidence"
                subtitle="Charles Tanauan Case Presentation"
                affiant="Charles Tanauan (a.k.a. Master Kanor)"
                sections={testimonySections}
                onExport={handleExport}
                loading={evidenceQuery.isLoading}
                error={(evidenceQuery.error as any)?.message}
              />
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Evidence Timeline</h2>
              <div className="space-y-4">
                {filteredEvidence && filteredEvidence.length > 0 ? (
                  filteredEvidence.map((evidence: any, index: number) => (
                    <div
                      key={evidence.id}
                      className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mt-2"></div>
                        {index < filteredEvidence.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">
                          {evidence.title}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {evidence.description}
                        </p>
                        <div className="flex gap-2 mt-2 text-xs text-slate-500">
                          <span>{evidence.category}</span>
                          <span>•</span>
                          <span>
                            {new Date(evidence.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-600">
                      {hasActiveFilters
                        ? "No evidence found matching your filters"
                        : "No evidence timeline available"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Statistics Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-orange-500">
              {filteredEvidence.length}
            </div>
            <div className="text-sm text-slate-600">Matching Items</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-green-500">
              {filteredEvidence.filter((e: any) => e.status === "verified").length}
            </div>
            <div className="text-sm text-slate-600">Verified Items</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-blue-500">
              {categoriesQuery.data?.categories?.length || 0}
            </div>
            <div className="text-sm text-slate-600">Categories</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-purple-500">
              {testimonySections.length}
            </div>
            <div className="text-sm text-slate-600">Testimony Sections</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceDossier;
