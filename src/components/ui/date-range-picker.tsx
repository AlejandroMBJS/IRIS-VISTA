"use client";

import * as React from "react";
import { format } from "date-fns";
import { es, zhCN, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  language?: 'en' | 'zh' | 'es';
  placeholder?: string;
  className?: string;
  align?: "start" | "center" | "end";
}

const localeMap = {
  en: enUS,
  zh: zhCN,
  es: es,
};

const texts = {
  en: {
    placeholder: "Select date range",
    today: "Today",
    yesterday: "Yesterday",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    thisMonth: "This month",
    lastMonth: "Last month",
    clear: "Clear",
    apply: "Apply",
  },
  zh: {
    placeholder: "选择日期范围",
    today: "今天",
    yesterday: "昨天",
    last7Days: "最近7天",
    last30Days: "最近30天",
    thisMonth: "本月",
    lastMonth: "上月",
    clear: "清除",
    apply: "应用",
  },
  es: {
    placeholder: "Seleccionar rango de fechas",
    today: "Hoy",
    yesterday: "Ayer",
    last7Days: "Ultimos 7 dias",
    last30Days: "Ultimos 30 dias",
    thisMonth: "Este mes",
    lastMonth: "Mes anterior",
    clear: "Limpiar",
    apply: "Aplicar",
  },
};

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  language = 'en',
  placeholder,
  className,
  align = "start",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(dateRange);
  const t = texts[language];
  const locale = localeMap[language];

  // Sync internal state when external dateRange changes
  React.useEffect(() => {
    setInternalRange(dateRange);
  }, [dateRange]);

  const formatDate = (date: Date) => {
    return format(date, "d MMM yyyy", { locale });
  };

  // Preset date ranges
  const presets = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 6);

    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 29);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    return [
      { label: t.today, range: { from: today, to: today } },
      { label: t.yesterday, range: { from: yesterday, to: yesterday } },
      { label: t.last7Days, range: { from: last7Days, to: today } },
      { label: t.last30Days, range: { from: last30Days, to: today } },
      { label: t.thisMonth, range: { from: thisMonthStart, to: today } },
      { label: t.lastMonth, range: { from: lastMonthStart, to: lastMonthEnd } },
    ];
  }, [t]);

  const handlePresetClick = (preset: { from: Date; to: Date }) => {
    onDateRangeChange(preset);
    setInternalRange(preset);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateRangeChange(undefined);
    setInternalRange(undefined);
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setInternalRange(range);
    // Auto-apply if both dates are selected
    if (range?.from && range?.to) {
      onDateRangeChange(range);
      setIsOpen(false);
    }
  };

  const handleApply = () => {
    if (internalRange?.from) {
      // If only one date selected, use it for both from and to
      const finalRange = {
        from: internalRange.from,
        to: internalRange.to || internalRange.from,
      };
      onDateRangeChange(finalRange);
      setIsOpen(false);
    }
  };

  const handleClearInternal = () => {
    setInternalRange(undefined);
    onDateRangeChange(undefined);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal w-full sm:w-auto sm:min-w-[240px]",
            !dateRange && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <span className="flex-1">
                {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
              </span>
            ) : (
              <span className="flex-1">{formatDate(dateRange.from)}</span>
            )
          ) : (
            <span className="flex-1">{placeholder || t.placeholder}</span>
          )}
          {dateRange && (
            <X
              className="h-4 w-4 ml-2 hover:text-destructive"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex">
          {/* Presets sidebar */}
          <div className="border-r border-border p-3 space-y-1 hidden sm:block">
            {presets.map((preset, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePresetClick(preset.range);
                }}
              >
                {preset.label}
              </Button>
            ))}
            <hr className="my-2" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm text-muted-foreground"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClearInternal();
              }}
            >
              {t.clear}
            </Button>
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={internalRange?.from || dateRange?.from}
              selected={internalRange}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              locale={locale}
              className="rounded-md"
            />

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border">
              {/* Mobile presets */}
              <div className="flex flex-wrap gap-1 sm:hidden">
                {presets.slice(0, 3).map((preset, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handlePresetClick(preset.range)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Apply/Clear buttons */}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearInternal}
                  className="text-muted-foreground"
                >
                  {t.clear}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApply}
                  disabled={!internalRange?.from}
                  className="bg-[#5C2F0E] hover:bg-[#5C2F0E]/90"
                >
                  {t.apply}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
