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
  const t = texts[language];
  const locale = localeMap[language];

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
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateRangeChange(undefined);
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
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => handlePresetClick(preset.range)}
              >
                {preset.label}
              </Button>
            ))}
            <hr className="my-2" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm text-muted-foreground"
              onClick={() => {
                onDateRangeChange(undefined);
                setIsOpen(false);
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
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              locale={locale}
              className="rounded-md"
            />

            {/* Mobile presets */}
            <div className="flex flex-wrap gap-1 mt-3 sm:hidden">
              {presets.slice(0, 4).map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handlePresetClick(preset.range)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
