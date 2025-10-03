import React, { useState, useEffect } from 'react';
import { Search, Filter, Zap, Plus } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { MacroUtils } from '../../utils/macroUtils';
import type { MacroFunction, MacroType } from '../../types/macros';

interface FunctionSelectorProps {
  macros: MacroFunction[];
  onSelectMacro: (macro: MacroFunction) => void;
  onCreateMacro?: () => void;
  className?: string;
}

export default function FunctionSelector({
  macros,
  onSelectMacro,
  onCreateMacro,
  className = ''
}: FunctionSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<MacroType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

  // Get unique macro types and categories
  const macroTypes = ['all', ...Array.from(new Set(macros.map(macro => macro.type)))];
  const macroCategories = ['all', ...Array.from(new Set(macros.map(macro => macro.category)))];

  // Filter macros based on search, type, and category
  const filteredMacros = macros.filter(macro => {
    const matchesSearch = searchTerm === '' || 
      macro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      macro.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      macro.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'all' || macro.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || macro.category === selectedCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  // Group macros by category
  const groupedMacros: Record<string, MacroFunction[]> = {};
  
  filteredMacros.forEach(macro => {
    if (!groupedMacros[macro.category]) {
      groupedMacros[macro.category] = [];
    }
    groupedMacros[macro.category].push(macro);
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search functions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as MacroType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            {macroTypes.filter(type => type !== 'all').map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {macroCategories.filter(category => category !== 'all').map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <Button
          variant="outline"
          icon={<Filter className="w-4 h-4" />}
          size="sm"
        >
          More Filters
        </Button>
      </div>

      {/* Function List */}
      {Object.keys(groupedMacros).length === 0 ? (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No functions found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedType !== 'all' || selectedCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No functions are available'
            }
          </p>
          {onCreateMacro && (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={onCreateMacro}
            >
              Create Custom Function
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedMacros).map(([category, macros]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {macros.map(macro => {
                  const typeColors = MacroUtils.getMacroTypeColor(macro.type);
                  
                  return (
                    <div
                      key={macro.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-farm-300 hover:shadow-sm cursor-pointer transition-all"
                      onClick={() => onSelectMacro(macro)}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${typeColors.bg}`}>
                          {macro.icon ? (
                            <span className="text-lg">{macro.icon}</span>
                          ) : (
                            <Zap className={`w-4 h-4 ${typeColors.text}`} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{macro.name}</h4>
                          <p className="text-xs text-gray-500">{macro.type}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{macro.description}</p>
                      {macro.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {macro.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {macro.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{macro.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}