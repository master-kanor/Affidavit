import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <main id="main-content" className="min-h-screen w-full flex items-center justify-center bg-[#f3f5f6]">
      <Card className="w-full max-w-lg mx-4 border-[#d4dde1] bg-[#fffdfa] shadow-[0_14px_40px_rgba(30,44,52,0.07)]">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#f2e8dc] rounded-full" />
              <AlertCircle className="relative h-16 w-16 text-[#8a6537]" />
            </div>
          </div>

          <h1 className="font-serif text-5xl font-semibold text-[#21313a] mb-2">404</h1>

          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            Page Not Found
          </h2>

          <p className="text-slate-600 mb-8 leading-relaxed">
            Sorry, the page you are looking for doesn't exist.
            <br />
            It may have been moved or deleted.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoHome}
              className="bg-[#21313a] hover:bg-[#344a56] text-white px-6 py-2.5"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
