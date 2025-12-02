'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

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
  // Special Content
  { name: "Crystal of Wisdom & Secret Castle", prefixes: ["2132", "2136", "2138"] },
  { name: "Ode to Origin (All)", prefixes: ["2080", "2078", "2076", "2061"] },
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

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>("All Items");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

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
        // Use regex to properly match "ItemName::12345" patterns
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
      // Fallback for older browsers
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
          <p className="text-2xl mb-2">⚠️</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-ae-accent mb-2">
          AE Item Selector
        </h1>
        <p className="text-gray-400 text-sm">
          Select items for mass purchase • {items.length.toLocaleString()} items available
        </p>
      </header>

      <div className="max-w-7xl mx-auto">
        {/* Controls Bar */}
        <div className="bg-ae-card/80 backdrop-blur border border-ae-border rounded-xl p-4 mb-6 sticky top-4 z-20">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search items by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input w-full px-4 py-3 rounded-lg text-white placeholder-gray-500"
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={selectAll}
                className="btn-secondary px-4 py-2 rounded-lg text-sm"
              >
                Select Visible ({filteredItems.length})
              </button>
              <button
                onClick={clearAll}
                className="btn-secondary px-4 py-2 rounded-lg text-sm"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowOutput(true)}
                disabled={selectedItems.size === 0}
                className="btn-primary px-6 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Generate</span>
                {selectedItems.size > 0 && (
                  <span className="count-badge">{selectedItems.size}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Categories */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-ae-card/50 border border-ae-border rounded-xl p-4 lg:sticky lg:top-28">
              <h2 className="font-display text-sm text-gray-400 mb-3 uppercase tracking-wider">
                Categories
              </h2>
              <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
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

          {/* Main Content - Items Grid */}
          <div className="flex-1">
            <div className="mb-4 text-sm text-gray-400">
              Showing {filteredItems.length} items
              {selectedItems.size > 0 && (
                <span className="ml-2 text-ae-accent">
                  • {selectedItems.size} selected
                </span>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-4">🔍</p>
                <p>No items match your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`item-card p-3 rounded-lg border text-left flex items-center gap-3 ${
                      selectedItems.has(item.id)
                        ? 'selected border-ae-accent'
                        : 'border-ae-border hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => {}}
                      className="custom-checkbox flex-shrink-0"
                    />
                    <span className="text-sm break-words leading-tight" title={item.name}>
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
            <div className="p-6 border-b border-ae-border">
              <h2 className="font-display text-xl text-ae-accent">
                Generated Output
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {selectedItems.size} items selected
              </p>
            </div>
            
            <div className="p-6">
              {/* Selected Items Preview */}
              <div className="mb-4">
                <h3 className="text-sm text-gray-400 mb-2">Selected Items:</h3>
                <div className="max-h-40 overflow-y-auto bg-black/30 rounded-lg p-3">
                  {selectedItemNames.map((name, i) => (
                    <div key={i} className="text-xs text-gray-300 py-0.5">
                      {i + 1}. {name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Output Code */}
              <div className="mb-4">
                <h3 className="text-sm text-gray-400 mb-2">
                  Copy this and paste into the script prompt:
                </h3>
                <div className="output-box rounded-lg p-4 text-sm text-ae-accent break-all max-h-32 overflow-y-auto">
                  {generateOutput()}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="btn-primary flex-1 py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <span>✓</span>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowOutput(false)}
                  className="btn-secondary px-6 py-3 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="px-6 pb-6">
              <div className="bg-ae-darker/50 rounded-lg p-4 text-xs text-gray-400">
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

