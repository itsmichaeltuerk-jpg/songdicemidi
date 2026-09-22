import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  id: string;
  sectionNumber?: string | number;
  title: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  summaryWhenCollapsed?: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  headerRightExtra?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  sectionNumber,
  title,
  badge,
  icon,
  summaryWhenCollapsed,
  isCollapsed,
  onToggle,
  children,
  className = '',
  headerRightExtra,
}) => {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`transition-all duration-200 ${className}`}
    >
      {/* Section Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <button
          type="button"
          onClick={onToggle}
          id={`${id}-toggle-btn`}
          aria-expanded={!isCollapsed}
          aria-controls={`${id}-content`}
          className="flex-1 flex items-center justify-between gap-3 py-1.5 px-3 sm:px-4 bg-[#14151C]/60 hover:bg-[#181A24] border border-white/5 hover:border-white/15 rounded-xl transition-all group text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <span className="flex-shrink-0 text-amber-400">
                {icon}
              </span>
            )}
            
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h3
                id={`${id}-heading`}
                className="text-xs sm:text-sm font-bold tracking-tight text-zinc-200 group-hover:text-white transition-colors truncate font-['Outfit']"
              >
                {title}
              </h3>
              {badge && (
                <div className="hidden sm:flex items-center">
                  {badge}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {isCollapsed && summaryWhenCollapsed && (
              <div className="hidden md:flex items-center text-xs text-zinc-500 font-mono">
                {summaryWhenCollapsed}
              </div>
            )}

            <ChevronDown
              className={`w-4 h-4 text-zinc-500 group-hover:text-amber-300 transition-transform duration-200 ${
                isCollapsed ? '' : 'rotate-180 text-amber-400'
              }`}
            />
          </div>
        </button>

        {headerRightExtra && (
          <div className="flex items-center flex-shrink-0">
            {headerRightExtra}
          </div>
        )}
      </div>

      {/* Section Content */}
      <div
        id={`${id}-content`}
        className={isCollapsed ? 'hidden' : 'space-y-4 animate-in fade-in duration-200'}
      >
        {children}
      </div>
    </section>
  );
};
