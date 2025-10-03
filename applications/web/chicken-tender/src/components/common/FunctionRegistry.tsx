import React from 'react';
import { predefinedMacros } from '../macros/AddRecordMacro';
import { predefinedConfigMacros } from '../macros/ConfigurationMacro';
import type { MacroFunction } from '../../types/macros';

// This component doesn't render anything - it just serves as a registry for all available functions
export default function FunctionRegistry() {
  return null;
}

// Combine all predefined macros
const allPredefinedMacros: MacroFunction[] = [
  ...predefinedMacros,
  ...predefinedConfigMacros
];

// Export the combined list
export { allPredefinedMacros };

// Export a function to get a macro by ID
export function getMacroById(id: string): MacroFunction | undefined {
  return allPredefinedMacros.find(macro => macro.id === id);
}

// Export a function to get macros by type
export function getMacrosByType(type: string): MacroFunction[] {
  return allPredefinedMacros.filter(macro => macro.type === type);
}

// Export a function to get macros by category
export function getMacrosByCategory(category: string): MacroFunction[] {
  return allPredefinedMacros.filter(macro => macro.category === category);
}

// Export a function to get macros by tag
export function getMacrosByTag(tag: string): MacroFunction[] {
  return allPredefinedMacros.filter(macro => macro.tags.includes(tag));
}

// Export a function to get featured macros
export function getFeaturedMacros(): MacroFunction[] {
  return allPredefinedMacros.filter(macro => 
    macro.tags.includes('featured') || macro.tags.includes('quick')
  );
}

// Export a function to search macros
export function searchMacros(query: string): MacroFunction[] {
  const lowerQuery = query.toLowerCase();
  return allPredefinedMacros.filter(macro => 
    macro.name.toLowerCase().includes(lowerQuery) ||
    macro.description.toLowerCase().includes(lowerQuery) ||
    macro.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}