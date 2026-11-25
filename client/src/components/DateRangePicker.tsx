import React, { useState, useEffect } from "react";
import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  placeholder?: string;
  startDate?: string;
  endDate?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateRangeChange,
  placeholder = "Select date range",
  startDate: externalStartDate = "",
  endDate: externalEndDate = "",
}) => {
  const [startDate, setStartDate] = useState<string>(externalStartDate);
  const [endDate, setEndDate] = useState<string>(externalEndDate);
  const [isOpen, setIsOpen] = useState(false);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    const start = newStartDate ? new Date(newStartDate) : null;
    const end = endDate ? new Date(endDate) : null;
    onDateRangeChange(start, end);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    
    const start = startDate ? new Date(startDate) : null;
    const end = newEndDate ? new Date(newEndDate) : null;
    onDateRangeChange(start, end);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    onDateRangeChange(null, null);
    setIsOpen(false);
  };

  // Sync external value changes
  useEffect(() => {
    setStartDate(externalStartDate);
    setEndDate(externalEndDate);
  }, [externalStartDate, externalEndDate]);

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    setStartDate(startStr);
    setEndDate(endStr);
    onDateRangeChange(start, end);
  };

  const formatDateDisplay = () => {
    if (!startDate && !endDate) return placeholder;
    if (startDate && !endDate) return `From ${startDate}`;
    if (!startDate && endDate) return `Until ${endDate}`;
    return `${startDate} to ${endDate}`;
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full pl-10 pr-10 py-2 text-left border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors"
        >
          <span className={startDate || endDate ? "text-slate-900" : "text-slate-500"}>
            {formatDateDisplay()}
          </span>
        </button>
        {(startDate || endDate) && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Date Range Picker Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-4">
          <div className="space-y-4">
            {/* Preset Options */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">
                Quick Select
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handlePreset(7)}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => handlePreset(30)}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                >
                  Last 30 days
                </button>
                <button
                  onClick={() => handlePreset(90)}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                >
                  Last 90 days
                </button>
              </div>
            </div>

            {/* Custom Date Range */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">
                Custom Range
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex-1"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
