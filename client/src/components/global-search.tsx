import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Clock, ListCheck, Dumbbell, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface SearchResult {
  id: string;
  type: 'routine' | 'exercise';
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  duration?: number;
  exerciseCount?: number;
  equipment?: string;
}

interface GlobalSearchProps {
  onClose?: () => void;
}

export default function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch routines and exercises for search
  const { data: routines = [] } = useQuery({
    queryKey: ["/api/routines"],
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ["/api/exercises"],
  });

  // Combine and filter results
  const searchResults: SearchResult[] = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search routines
    (routines as any[]).forEach((routine: any) => {
      if (
        routine.name?.toLowerCase().includes(searchTerm) ||
        routine.description?.toLowerCase().includes(searchTerm) ||
        routine.classType?.name?.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: routine.id,
          type: 'routine',
          title: routine.name,
          description: routine.description,
          category: routine.classType?.name,
          duration: routine.totalDuration,
          exerciseCount: routine.exerciseCount,
        });
      }
    });

    // Search exercises
    (exercises as any[]).forEach((exercise: any) => {
      if (
        exercise.name?.toLowerCase().includes(searchTerm) ||
        exercise.description?.toLowerCase().includes(searchTerm) ||
        exercise.category?.toLowerCase().includes(searchTerm) ||
        exercise.equipment?.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: exercise.id,
          type: 'exercise',
          title: exercise.name,
          description: exercise.description,
          category: exercise.category,
          difficulty: exercise.difficulty,
          equipment: exercise.equipment,
        });
      }
    });

    return results.slice(0, 10); // Limit results
  }, [query, routines, exercises]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery("");
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'routine') {
      setLocation('/routines');
    } else {
      setLocation('/exercises');
    }
    setIsOpen(false);
    setQuery("");
    onClose?.();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="w-full md:w-80 justify-between text-gray-500 bg-white hover:bg-gray-50"
        data-testid="global-search-trigger"
      >
        <div className="flex items-center">
          <Search className="w-4 h-4 mr-2" />
          <span>Search routines, exercises...</span>
        </div>
        <div className="hidden md:flex items-center space-x-1">
          <kbd className="px-2 py-0.5 text-xs bg-gray-100 rounded">⌘</kbd>
          <kbd className="px-2 py-0.5 text-xs bg-gray-100 rounded">K</kbd>
        </div>
      </Button>

      {/* Search Modal/Dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:relative md:inset-auto md:bg-transparent md:backdrop-blur-none">
          <div className="fixed top-20 left-4 right-4 md:absolute md:top-full md:left-0 md:right-auto md:w-96 md:mt-2">
            <Card className="shadow-xl">
              <CardContent className="p-0">
                {/* Search Input */}
                <div className="flex items-center border-b p-4">
                  <Search className="w-4 h-4 text-gray-400 mr-3" />
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search routines, exercises..."
                    className="border-none shadow-none focus-visible:ring-0 p-0"
                    data-testid="global-search-input"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                      onClose?.();
                    }}
                    data-testid="global-search-close"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Search Results */}
                <div className="max-h-96 overflow-y-auto">
                  {query.trim() && searchResults.length === 0 ? (
                    <div className="p-4 text-center text-gray-500" data-testid="search-no-results">
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No results found for "{query}"</p>
                    </div>
                  ) : query.trim() ? (
                    <div className="py-2">
                      {searchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                          data-testid={`search-result-${result.type}-${result.id}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${
                              result.type === 'routine' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {result.type === 'routine' ? (
                                <ListCheck className="w-4 h-4" />
                              ) : (
                                <Dumbbell className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {result.title}
                              </h4>
                              {result.description && (
                                <p className="text-sm text-gray-600 truncate mt-1">
                                  {result.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {result.type}
                                </Badge>
                                {result.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {result.category}
                                  </Badge>
                                )}
                                {result.difficulty && (
                                  <Badge variant="outline" className="text-xs">
                                    {result.difficulty}
                                  </Badge>
                                )}
                                {result.duration && (
                                  <span className="text-xs text-gray-500 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatDuration(result.duration)}
                                  </span>
                                )}
                                {result.exerciseCount && (
                                  <span className="text-xs text-gray-500 flex items-center">
                                    <Zap className="w-3 h-3 mr-1" />
                                    {result.exerciseCount} exercises
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Start typing to search routines and exercises</p>
                      <p className="text-xs mt-1">Use ⌘K to quickly open search</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}