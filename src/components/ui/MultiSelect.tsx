import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Option {
  id: string;
  name: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ 
  options, 
  selectedIds, 
  onChange, 
  placeholder = "Odaberi stavke..." 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    const newIds = selectedIds.includes(id) 
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    onChange(newIds);
  };

  const selectedOptions = options.filter(o => selectedIds.includes(o.id));

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[46px] w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex flex-wrap gap-1 items-center cursor-pointer hover:border-slate-300 transition-all focus-within:ring-2 focus-within:ring-blue-500/20"
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map(option => (
            <span 
              key={option.id}
              className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              {option.name}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-blue-900" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(option.id);
                }}
              />
            </span>
          ))
        ) : (
          <span className="text-slate-400 text-sm">{placeholder}</span>
        )}
        <ChevronDown className={cn("ml-auto w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400 italic">Nema dostupnih stavki</div>
          ) : (
            options.map(option => (
              <div 
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm flex items-center justify-between cursor-pointer transition-colors",
                  selectedIds.includes(option.id) ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700"
                )}
              >
                {option.name}
                {selectedIds.includes(option.id) && <Check className="w-4 h-4" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
