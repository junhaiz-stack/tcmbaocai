import React, { useState, useEffect, useRef } from 'react';
import { Calendar, X } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = '选择日期'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);

  // 初始化日期
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedYear(date.getFullYear());
        setSelectedMonth(date.getMonth() + 1);
        setSelectedDay(date.getDate());
      }
    } else {
      const now = new Date();
      setSelectedYear(now.getFullYear());
      setSelectedMonth(now.getMonth() + 1);
      setSelectedDay(now.getDate());
    }
  }, [value, isOpen]);

  // 滚动到选中项
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToSelected(yearRef.current, selectedYear - 2020);
        scrollToSelected(monthRef.current, selectedMonth - 1);
        scrollToSelected(dayRef.current, selectedDay - 1);
      }, 100);
    }
  }, [isOpen, selectedYear, selectedMonth, selectedDay]);

  const scrollToSelected = (container: HTMLDivElement | null, index: number) => {
    if (!container) return;
    const itemHeight = 48;
    const scrollPosition = index * itemHeight;
    container.scrollTo({ top: scrollPosition, behavior: 'auto' });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleConfirm = () => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return placeholder;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return placeholder;
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black text-left focus:border-emerald-500 transition-colors flex items-center justify-between"
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {formatDisplayDate(value)}
        </span>
        <Calendar className="w-5 h-5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCancel}></div>
          <div className="relative bg-white w-full rounded-t-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">选择日期</h3>
              <button onClick={handleCancel} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="flex h-full" style={{ height: '300px' }}>
                {/* 年份选择 */}
                <div className="flex-1 flex flex-col border-r border-slate-100">
                  <div className="text-center py-3 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">年</span>
                  </div>
                  <div
                    ref={yearRef}
                    className="flex-1 overflow-y-scroll scrollbar-hide"
                    style={{ height: '300px', overflowY: 'scroll' }}
                    onWheel={(e) => {
                      e.currentTarget.scrollTop += e.deltaY;
                    }}
                  >
                    <div style={{ height: 'calc(50% - 24px)', flexShrink: 0 }}></div>
                    {years.map((year) => (
                      <div
                        key={year}
                        className="h-12 flex items-center justify-center cursor-pointer transition-colors"
                        style={{ minHeight: '48px' }}
                        onClick={() => {
                          setSelectedYear(year);
                          // 检查日期是否有效
                          const daysInNewMonth = new Date(year, selectedMonth, 0).getDate();
                          if (selectedDay > daysInNewMonth) {
                            setSelectedDay(daysInNewMonth);
                          }
                        }}
                      >
                        <span
                          className={`text-base font-black transition-all ${
                            selectedYear === year
                              ? 'text-emerald-600 scale-110'
                              : 'text-slate-400'
                          }`}
                        >
                          {year}
                        </span>
                      </div>
                    ))}
                    <div style={{ height: 'calc(50% - 24px)', flexShrink: 0 }}></div>
                  </div>
                </div>

                {/* 月份选择 */}
                <div className="flex-1 flex flex-col border-r border-slate-100">
                  <div className="text-center py-3 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">月</span>
                  </div>
                  <div
                    ref={monthRef}
                    className="flex-1 overflow-y-scroll scrollbar-hide"
                    style={{ height: '300px', overflowY: 'scroll' }}
                    onWheel={(e) => {
                      e.currentTarget.scrollTop += e.deltaY;
                    }}
                  >
                    <div style={{ height: 'calc(50% - 24px)', flexShrink: 0 }}></div>
                    {months.map((month) => (
                      <div
                        key={month}
                        className="h-12 flex items-center justify-center cursor-pointer transition-colors"
                        style={{ minHeight: '48px' }}
                        onClick={() => {
                          setSelectedMonth(month);
                          // 检查日期是否有效
                          const daysInNewMonth = new Date(selectedYear, month, 0).getDate();
                          if (selectedDay > daysInNewMonth) {
                            setSelectedDay(daysInNewMonth);
                          }
                        }}
                      >
                        <span
                          className={`text-base font-black transition-all ${
                            selectedMonth === month
                              ? 'text-emerald-600 scale-110'
                              : 'text-slate-400'
                          }`}
                        >
                          {month}
                        </span>
                      </div>
                    ))}
                    <div style={{ height: 'calc(50% - 24px)', flexShrink: 0 }}></div>
                  </div>
                </div>

                {/* 日期选择 */}
                <div className="flex-1 flex flex-col">
                  <div className="text-center py-3 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">日</span>
                  </div>
                  <div
                    ref={dayRef}
                    className="flex-1 overflow-y-scroll scrollbar-hide"
                    style={{ height: '300px', overflowY: 'scroll' }}
                    onWheel={(e) => {
                      e.currentTarget.scrollTop += e.deltaY;
                    }}
                  >
                    <div style={{ height: 'calc(50% - 24px)', flexShrink: 0 }}></div>
                    {days.map((day) => (
                      <div
                        key={day}
                        className="h-12 flex items-center justify-center cursor-pointer transition-colors"
                        style={{ minHeight: '48px' }}
                        onClick={() => setSelectedDay(day)}
                      >
                        <span
                          className={`text-base font-black transition-all ${
                            selectedDay === day
                              ? 'text-emerald-600 scale-110'
                              : 'text-slate-400'
                          }`}
                        >
                          {day}
                        </span>
                      </div>
                    ))}
                    <div style={{ height: 'calc(50% - 24px)', flexShrink: 0 }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-4 font-black text-slate-400 rounded-2xl bg-slate-50 active:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-[2] py-4 font-black text-white rounded-2xl bg-emerald-600 active:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

