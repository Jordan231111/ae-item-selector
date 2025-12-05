'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Item {
  name: string;
  id: string;
}

interface Category {
  name: string;
  prefix?: string;
  prefixes?: string[];
}

const categories: Category[] = [
  { name: "All Items", prefix: undefined },
  // Core Items
  { name: "Light/Shadow Items", prefixes: ["2450", "2970"] },
  { name: "Scrolls & Scripts", prefix: "2460" },
  { name: "Dungeon Keys", prefixes: ["5640", "5650"] },
  { name: "Story Items & Keys", prefixes: ["2419", "2415"] },
  { name: "Tomes/Treatises/Opus", prefix: "2420" },
  { name: "Currencies", prefix: "2050" },
  // Equipment
  { name: "Weapons & Armor", prefix: "2110" },
  { name: "Accessories", prefix: "2170" },
  { name: "Advanced Equipment", prefix: "2119" },
  { name: "Sidekick Equipment", prefix: "2008" },
  // Materials
  { name: "World Materials", prefix: "2210" },
  { name: "Quest Materials", prefixes: ["2410", "2411"] },
  { name: "Seeds/Ores/Soils", prefix: "2470" },
  { name: "Upgrade/Machinery", prefix: "2090" },
  // Grasta & Proofs
  { name: "Class Proofs", prefix: "2883" },
  { name: "Grasta (All Types)", prefixes: ["2880", "2881", "2882", "2752", "2753"] },
  // Badges
  { name: "Stat Badges (PWR/INT/SPD/etc)", prefixes: ["2811", "2812", "2813", "2814", "2815", "2816", "2810"] },
  { name: "Resistance Badges", prefix: "2817" },
  { name: "Special Badges", prefix: "2819" },
  { name: "MP/EXP Badges", prefix: "2818" },
  { name: "Weapon Manifestation Talegem", prefix: "2061" },
  // Special Content
  { name: "Crystal of Wisdom & Secret Castle", prefixes: ["2132", "2136", "2138"] },
  { name: "Ode to Origin (All)", prefixes: ["2080", "2078", "2076"] },
  { name: "Time Mine", prefixes: ["9000", "9001"] },
  { name: "Special Fragments & Jadeites", prefix: "2220" },
  { name: "Time Twisted Maze", prefix: "2180" },
  { name: "Auction & Manor", prefixes: ["4920", "2950"] },
  // Consumables & Misc
  { name: "Anti-items & Blasters", prefix: "2980" },
  { name: "Food & Meals", prefixes: ["9610", "2430"] },
  { name: "Gacha & Tickets", prefixes: ["1779", "1770"] },
  { name: "OOP ART", prefix: "7910" },
  // Expanded from Scratchpad (Future Proofing)
  { name: "Fishing (Rod/Reel/Bait/Fish)", prefixes: ["8700", "8740", "8750", "8760", "8770", "8780", "8730"] },
  { name: "Harpoon Fishing", prefixes: ["7750", "7760", "7740", "7770", "7730", "7780"] },
  { name: "Cat Lover (Shop/Mats)", prefixes: ["4520", "4500"] },
  { name: "Battle Items (Deck/Cards)", prefix: "4640" },
];

// Breakpoints based on actual container width (accounting for sidebar)
const BREAKPOINTS = {
  sm: 500,   // 2 columns - medium screens
  xl: 900,   // 3 columns - large screens
};

// Row height for virtualization (item height + gap)
const ROW_HEIGHT = 52; // 48px item + 8px gap (gap-2)

// Icon Components
const ChevronIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-600">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-400">
    <path d="M12 9V13M12 17H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>("All Items");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  
  // Virtualization state
  const [columnCount, setColumnCount] = useState(1);
  const parentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryOpen(false);
      }
    };

    if (categoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryOpen]);

  // Fetch items on mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(
          'https://raw.githubusercontent.com/Jordan231111/AED/refs/heads/main/7huibjgkll.txt'
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const text = await res.text();
        
        // Parse items: "Name::ID" format - names can contain spaces
        const parsed: Item[] = [];
        const regex = /(.+?)::(\d+)(?=\s|$)/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          const name = match[1].trim();
          const id = match[2].trim();
          if (name && id && !name.includes('WARNING')) {
            parsed.push({ name, id });
          }
        }
        
        setItems(parsed);
        setLoading(false);
      } catch (err) {
        setError('Failed to load items. Please refresh.');
        setLoading(false);
      }
    };
    
    fetchItems();
  }, []);

  // Handle responsive column count with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateColumnCount = () => {
      const width = container.offsetWidth;
      if (width >= BREAKPOINTS.xl) {
        setColumnCount(3);
      } else if (width >= BREAKPOINTS.sm) {
        setColumnCount(2);
      } else {
        setColumnCount(1);
      }
    };

    // Watch for resize
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateColumnCount);
    });
    resizeObserver.observe(container);

    // Initial calculation
    requestAnimationFrame(updateColumnCount);

    return () => resizeObserver.disconnect();
  }, [loading]);

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // Apply category filter
    if (activeCategory !== "All Items") {
      const cat = categories.find(c => c.name === activeCategory);
      if (cat) {
        filtered = filtered.filter(item => {
          if (cat.prefixes) {
            return cat.prefixes.some(p => item.id.startsWith(p));
          } else if (cat.prefix) {
            return item.id.startsWith(cat.prefix);
          }
          return true;
        });
      }
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [items, activeCategory, searchQuery]);

  // Group items into rows for virtualization
  const rows = useMemo(() => {
    const result: Item[][] = [];
    for (let i = 0; i < filteredItems.length; i += columnCount) {
      result.push(filteredItems.slice(i, i + columnCount));
    }
    return result;
  }, [filteredItems, columnCount]);

  // Virtual row count
  const rowCount = rows.length;

  // Setup virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  // Toggle item selection
  const toggleItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select all visible items
  const selectAll = useCallback(() => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      filteredItems.forEach(item => next.add(item.id));
      return next;
    });
  }, [filteredItems]);

  // Clear all selections
  const clearAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Generate output code
  const generateOutput = useCallback(() => {
    const selectedList = items
      .filter(item => selectedItems.has(item.id))
      .map(item => item.id);
    return selectedList.join(',');
  }, [items, selectedItems]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    const output = generateOutput();
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = output;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generateOutput]);

  // Get selected item names for display
  const selectedItemNames = useMemo(() => {
    return items
      .filter(item => selectedItems.has(item.id))
      .map(item => item.name);
  }, [items, selectedItems]);

  // Scroll to top when filters change
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [activeCategory, searchQuery]);

  // Handle category selection
  const handleCategorySelect = (catName: string) => {
    setActiveCategory(catName);
    setCategoryOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-ae-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-display">Loading items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-400">
          <div className="flex justify-center mb-3">
            <WarningIcon />
          </div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Compact Toolbar */}
        <div className="bg-ae-card/80 backdrop-blur border border-ae-border rounded-xl p-3 mb-4 lg:mb-6 flex-shrink-0 z-20">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input flex-1 min-w-0 px-3 md:px-4 py-2.5 rounded-lg text-white placeholder-gray-500 text-sm"
            />
            
            {/* Mobile Category Dropdown */}
            <div className="lg:hidden relative flex-shrink-0" ref={categoryDropdownRef}>
              <button
                onClick={() => setCategoryOpen(!categoryOpen)}
                className={`mobile-category-toggle ${categoryOpen ? 'open' : ''}`}
              >
                <span className="truncate text-xs max-w-[80px] sm:max-w-[120px]">{activeCategory}</span>
                <ChevronIcon />
              </button>
              
              {categoryOpen && (
                <div className="mobile-category-dropdown custom-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleCategorySelect(cat.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === cat.name 
                          ? 'bg-ae-accent/15 text-ae-accent' 
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons - Hidden on small screens, shown inline on md+ */}
            <button
              onClick={selectAll}
              className="hidden md:flex btn-secondary px-3 py-2.5 rounded-lg text-sm whitespace-nowrap flex-shrink-0"
            >
              Select Visible ({filteredItems.length.toLocaleString()})
            </button>
            <button
              onClick={clearAll}
              className="hidden md:flex btn-secondary px-3 py-2.5 rounded-lg text-sm flex-shrink-0"
            >
              Clear All
            </button>
            
            {/* Generate Button */}
            <button
              onClick={() => setShowOutput(true)}
              disabled={selectedItems.size === 0}
              className="btn-primary px-3 sm:px-4 md:px-5 py-2.5 rounded-lg text-sm flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <span>Generate</span>
              <span className="count-badge">{selectedItems.size}</span>
            </button>
          </div>
          
          {/* Mobile-only action buttons row */}
          <div className="flex md:hidden gap-2 mt-2">
            <button
              onClick={selectAll}
              className="btn-secondary flex-1 px-3 py-2 rounded-lg text-xs whitespace-nowrap"
            >
              Select Visible ({filteredItems.length.toLocaleString()})
            </button>
            <button
              onClick={clearAll}
              className="btn-secondary px-3 py-2 rounded-lg text-xs"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0">
          {/* Desktop Sidebar - Categories */}
          <aside className="hidden lg:block lg:w-56 xl:w-64 flex-shrink-0">
            <div className="bg-ae-card/50 border border-ae-border rounded-xl p-4 h-full max-h-[calc(100vh-160px)]">
              <h2 className="font-display text-xs text-gray-500 mb-3 uppercase tracking-wider">
                Categories
              </h2>
              <nav className="space-y-0.5 h-[calc(100%-32px)] overflow-y-auto sidebar-scroll pr-1">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`category-btn w-full text-left px-3 py-2 rounded-lg text-sm border border-transparent ${
                      activeCategory === cat.name ? 'active' : ''
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content - Virtualized Items Grid */}
          <div className="flex-1 min-h-0 flex flex-col" ref={containerRef}>
            <div className="mb-3 text-xs md:text-sm text-gray-400 flex-shrink-0 flex items-center justify-between">
              <span>
                Showing {filteredItems.length.toLocaleString()} items
                {selectedItems.size > 0 && (
                  <span className="ml-2 text-ae-accent font-medium">
                    • {selectedItems.size} selected
                  </span>
                )}
              </span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="flex justify-center mb-4">
                  <SearchIcon />
                </div>
                <p>No items match your search</p>
              </div>
            ) : (
              <div 
                ref={parentRef}
                className="flex-1 overflow-auto rounded-lg items-scroll"
                style={{ contain: 'strict' }}
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const rowItems = rows[virtualRow.index];
                    return (
                      <div
                        key={virtualRow.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div 
                          className="grid gap-2 h-full pr-1"
                          style={{
                            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                          }}
                        >
                          {rowItems.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              className={`item-card p-3 rounded-lg border text-left flex items-center gap-3 ${
                                selectedItems.has(item.id)
                                  ? 'selected border-ae-accent'
                                  : 'border-ae-border/50 hover:border-ae-border'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => {}}
                                className="custom-checkbox"
                              />
                              <span 
                                className="text-sm truncate leading-tight" 
                                title={item.name}
                              >
                                {item.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      {selectedItems.size > 0 && (
        <button 
          onClick={() => setShowOutput(true)}
          className="floating-badge lg:hidden"
        >
          <span>{selectedItems.size} Selected</span>
          <ArrowRightIcon />
        </button>
      )}

      {/* Output Modal */}
      {showOutput && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowOutput(false)}
        >
          <div 
            className="bg-ae-card border border-ae-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6 border-b border-ae-border">
              <h2 className="font-display text-lg md:text-xl text-ae-accent">
                Generated Output
              </h2>
              <p className="text-xs md:text-sm text-gray-400 mt-1">
                {selectedItems.size} items selected
              </p>
            </div>
            
            <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {/* Selected Items Preview */}
              <div className="mb-4">
                <h3 className="text-xs md:text-sm text-gray-400 mb-2">Selected Items:</h3>
                <div className="max-h-32 md:max-h-40 overflow-y-auto bg-black/30 rounded-lg p-3 custom-scrollbar">
                  {selectedItemNames.map((name, i) => (
                    <div key={i} className="text-xs text-gray-300 py-0.5">
                      {i + 1}. {name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Output Code */}
              <div className="mb-4">
                <h3 className="text-xs md:text-sm text-gray-400 mb-2">
                  Copy this and paste into the script prompt:
                </h3>
                <div className="output-box rounded-lg p-3 md:p-4 text-xs md:text-sm text-ae-accent break-all max-h-24 md:max-h-32 overflow-y-auto custom-scrollbar">
                  {generateOutput()}
                </div>
              </div>

              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={copyToClipboard}
                  className="btn-primary flex-1 py-2.5 md:py-3 rounded-lg flex items-center justify-center gap-2 text-sm"
                >
                  {copied ? (
                    <>
                      <CheckIcon />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowOutput(false)}
                  className="btn-secondary px-4 md:px-6 py-2.5 md:py-3 rounded-lg text-sm"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="bg-ae-darker/50 rounded-lg p-3 md:p-4 text-xs text-gray-400">
                <strong className="text-gray-300">How to use:</strong>
                <ol className="mt-2 space-y-1 list-decimal list-inside">
                  <li>Copy the output above</li>
                  <li>Run the mass purchase script in GameGuardian</li>
                  <li>When prompted, paste the item IDs</li>
                  <li>Click GG icon after each item to proceed to the next</li>
                  <li>After all items are done, values will be restored</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
