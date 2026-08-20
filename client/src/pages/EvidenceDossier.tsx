import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEvidenceList, useEvidenceCategories, useEvidenceSearch } from "@/hooks/useEvidence";
import { AffidavitView, TestimonySection } from "@/components/TestimonyView";
import { SearchBar } from "@/components/SearchBar";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2, Filter, Sparkles, ArrowUpDown, FileType } from "lucide-react";
import { FloatingAIChatWidget } from "@/components/FloatingAIChatWidget";
import { EmbeddedVideoPlayer } from "@/components/EmbeddedVideoPlayer";
import { sourceEvidenceManifest, sourceLinkedTestimonySections } from "@/data/affidavitManifest";
import { buildStaticEvidenceRecords } from "@/utils/staticEvidenceFallback";

export const EvidenceDossier: React.FC = () => {
  const { user } = useAuth();
  return <AuthorizedEvidenceDossier user={user} />;
};

const AuthorizedEvidenceDossier: React.FC<{ user: any }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState("gallery");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "title">("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [externalPrompt, setExternalPrompt] = useState<string>("");

  const evidenceQuery = useEvidenceSearch(searchQuery, startDate, endDate, {
    limit: 100,
    enabled: true,
  });
  const staticEvidence = React.useMemo(() => buildStaticEvidenceRecords(), []);

  const filteredEvidence = React.useMemo(() => {
    const remoteEvidence = evidenceQuery.data?.evidence ?? [];
    let list = remoteEvidence.length > 0 ? remoteEvidence : staticEvidence;
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      list = list.filter((e: any) => `${e.title || ""} ${e.description || ""} ${e.category || ""} ${e.sourceFilename || ""}`.toLowerCase().includes(query));
    }
    if (startDate) {
      const from = startDate.getTime();
      list = list.filter((e: any) => new Date(e.createdAt || 0).getTime() >= from);
    }
    if (endDate) {
      const to = new Date(endDate);
      to.setHours(23, 59, 59, 999);
      list = list.filter((e: any) => new Date(e.createdAt || 0).getTime() <= to.getTime());
    }

    if (selectedCategory) {
      list = list.filter((e: any) => e.category === selectedCategory);
    }

    if (selectedFileType !== "all") {
      list = list.filter((e: any) => {
        const url = (e.fileUrl || "").toLowerCase();
        const title = (e.title || "").toLowerCase();
        if (selectedFileType === "image") return url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".jpeg") || url.endsWith(".webp") || url.includes("image");
        if (selectedFileType === "pdf") return url.endsWith(".pdf") || title.includes("pdf");
        if (selectedFileType === "video") return url.endsWith(".mp4") || url.includes("youtube") || url.includes("facebook") || title.includes("video");
        return true;
      });
    }

    return [...list].sort((a: any, b: any) => {
      if (sortOrder === "newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (sortOrder === "oldest") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      if (sortOrder === "title") return (a.title || "").localeCompare(b.title || "");
      return 0;
    });
  }, [evidenceQuery.data?.evidence, staticEvidence, searchQuery, startDate, endDate, selectedCategory, selectedFileType, sortOrder]);

  const categoriesQuery = useEvidenceCategories(true);
  const categoryOptions = React.useMemo(() => Array.from(new Set([
    ...staticEvidence.map((evidence) => evidence.category),
    ...(categoriesQuery.data?.categories ?? []),
  ])).sort((a, b) => a.localeCompare(b)), [categoriesQuery.data?.categories, staticEvidence]);

  // Transform evidence into testimony sections
  const testimonySections: TestimonySection[] = React.useMemo(() => {
    const mappedSections = filteredEvidence
      .filter((e: any) => e.status === "verified")
      .reduce((sections: TestimonySection[], evidence: any, index: number) => {
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

    return [...sourceLinkedTestimonySections, ...mappedSections.map((section, index) => ({
      ...section,
      order: index + sourceLinkedTestimonySections.length + 1,
    }))];
  }, [filteredEvidence]);

  const handleExport = async () => {
    try {
      const exportData = {
        title: "Official Affidavit of Evidence",
        affiant: (user as any)?.name || "Unknown",
        sections: testimonySections,
        filters: {
          searchQuery,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          category: selectedCategory,
          fileType: selectedFileType,
          sortOrder,
        },
        exportedAt: new Date().toISOString(),
      };

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
    setSelectedFileType("all");
    setSortOrder("newest");
  };

  const hasActiveFilters = searchQuery || startDate || endDate || selectedCategory || selectedFileType !== "all" || sortOrder !== "newest";

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
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <Button
            onClick={handleExport}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Dossier
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            {/* Quick Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
              <ArrowUpDown className="w-4 h-4 text-slate-500" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="text-xs font-medium text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="title">Sort: Title (A-Z)</option>
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Filter & Sort"}
            </Button>
          </div>
        </div>

        {/* Search and Filter Section */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 space-y-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            {/* File Type Filter */}
            <div>
              <label className="text-sm font-semibold text-slate-900 mb-2 block flex items-center gap-1.5">
                <FileType className="w-4 h-4 text-orange-500" />
                Evidence File Type
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "All Types" },
                  { id: "image", label: "Images / Photos" },
                  { id: "pdf", label: "PDF Documents" },
                  { id: "video", label: "Videos / Links" },
                ].map((ft) => (
                  <Button
                    key={ft.id}
                    variant={selectedFileType === ft.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFileType(ft.id)}
                    className={selectedFileType === ft.id ? "bg-orange-500 hover:bg-orange-600" : ""}
                  >
                    {ft.label}
                  </Button>
                ))}
              </div>
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
                  className={selectedCategory === null ? "bg-slate-900 text-white" : ""}
                >
                  All Categories
                </Button>
                {categoryOptions.map((category: string) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? "bg-slate-900 text-white" : ""}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filter Actions */}
            {hasActiveFilters && (
              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="w-full text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Reset All Filters & Sort
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results Summary */}
        {hasActiveFilters && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-orange-900">
              Found <strong>{filteredEvidence.length}</strong> evidence item{filteredEvidence.length !== 1 ? "s" : ""} matching your criteria
              {searchQuery && ` for "${searchQuery}"`}
              {selectedFileType !== "all" && ` (${selectedFileType})`}
              {selectedCategory && ` in "${selectedCategory}"`}
            </p>
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-orange-700 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Evidence Gallery</h2>
                <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
                  Showing {filteredEvidence.filter((e: any) => e.status === "verified").length} items
                </span>
              </div>

              <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50/70 p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Source-linked media gallery</h3>
                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
                      These thumbnails are mapped from the provided evidence affidavit export. They are shown read-only with the source page reference and an original-link fallback.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-amber-800">{sourceEvidenceManifest.evidenceLinks.length} source links</span>
                </div>
                <div className="mt-4">
                  <EmbeddedVideoPlayer
                    videos={sourceLinkedTestimonySections[0].videos || []}
                    columns={3}
                    autoplay={true}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={sourceEvidenceManifest.evidenceLinks[0].url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100"
                  >
                    Open source evidence folder
                  </a>
                  <span className="inline-flex items-center rounded-md bg-amber-100 px-3 py-2 text-xs text-amber-900">
                    Source pages: 21, 24–26
                  </span>
                </div>
              </div>

              {evidenceQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : filteredEvidence && filteredEvidence.filter((e: any) => e.status === "verified").length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvidence
                    .filter((e: any) => e.status === "verified")
                    .map((evidence: any) => (
                      <div
                        key={evidence.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        {evidence.fileUrl && (
                          <div className="relative h-48 bg-slate-200 overflow-hidden group">
                            <img
                              src={evidence.fileUrl}
                              alt={evidence.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute top-2 right-2 flex items-center gap-1.5">
                              {hasActiveFilters && (
                                <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-xs">
                                  Filter Match
                                </span>
                              )}
                              <div className="bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                                {evidence.category || "Exhibit"}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="p-4 flex flex-col justify-between flex-1">
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">
                              {evidence.title}
                            </h3>
                            <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                              {evidence.description}
                            </p>
                            {evidence.sourceFilename && <p className="mb-3 truncate text-[11px] text-slate-500" title={evidence.sourceFilename}>Source file: {evidence.sourceFilename}</p>}
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-4 pt-2 border-t border-slate-200">
                              <span className="bg-slate-200/80 px-2 py-0.5 rounded text-slate-700 font-medium">
                                {evidence.category || "General"}
                              </span>
                              <span>{evidence.createdAt ? new Date(evidence.createdAt).toLocaleDateString() : "Verified"}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setExternalPrompt(`Can you analyze and summarize this evidence item: "${evidence.title}" (${evidence.description || evidence.category})?`);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 w-full bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium text-xs py-2 px-3 rounded-lg border border-orange-200 transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Ask AI about this evidence
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-600 font-medium mb-1">No evidence found matching your criteria</p>
                  <p className="text-xs text-slate-400 mb-4">Try adjusting your filters, file type selection, or date range.</p>
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Testimony Tab */}
          <TabsContent value="testimony">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <AffidavitView
                title="Official Affidavit of Evidence"
                subtitle="Case Presentation • Tacloban City, Leyte, 6500"
                affiant="Affiant identity protected in the public view"
                sections={testimonySections}
                onExport={handleExport}
                loading={evidenceQuery.isLoading}
                error={(evidenceQuery.error as any)?.message}
              />
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Evidence Timeline</h2>
              <div className="space-y-4">
                {filteredEvidence && filteredEvidence.length > 0 ? (
                  filteredEvidence.map((evidence: any, index: number) => (
                    <div
                      key={evidence.id}
                      className="flex gap-4 pb-4 border-b border-slate-200 last:border-b-0"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-3.5 h-3.5 bg-orange-500 rounded-full mt-1.5 ring-4 ring-orange-100"></div>
                        {index < filteredEvidence.length - 1 && (
                          <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-xs">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-slate-900 text-base">
                            {evidence.title}
                          </h3>
                          <span className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded border border-slate-200">
                            {evidence.createdAt ? new Date(evidence.createdAt).toLocaleDateString() : "Date N/A"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 mb-3">
                          {evidence.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200">
                          <span className="font-semibold text-slate-700">{evidence.category || "General"}</span>
                          <span>•</span>
                          <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium">{evidence.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-600 font-medium mb-1">No timeline items found</p>
                    <p className="text-xs text-slate-400 mb-4">Try clearing your filters to see the complete timeline.</p>
                    <Button variant="outline" size="sm" onClick={handleResetFilters}>
                      Reset Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Statistics Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-orange-500 mb-1">
              {filteredEvidence.length}
            </div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Filtered Items</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-slate-900 mb-1">
              331+
            </div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Evidence Records</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-slate-900 mb-1">
              12
            </div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Affidavit Sections</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              100%
            </div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Verified Chain of Custody</p>
          </div>
        </div>

        {/* Floating AI Assistant Widget */}
        <FloatingAIChatWidget
          evidenceCount={(evidenceQuery.data?.total || 0) + sourceLinkedTestimonySections.reduce((total, section) => total + (section.videos?.length || 0) + (section.documents?.length || 0), 0)}
          externalPrompt={externalPrompt}
          onPromptConsumed={() => setExternalPrompt("")}
        />
      </div>
    </div>
  );
};
