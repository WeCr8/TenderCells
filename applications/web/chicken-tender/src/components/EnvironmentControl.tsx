import React from 'react';
import { Info } from 'lucide-react';

// REALTIME telemetry panel matching unified_ui.py and image design
export default function EnvironmentControl() {
  // REALTIME data matching the image layout
  const realtimeItems = [
    { label: 'Temperature', value: '67 °F', critical: true },
    { label: 'Humidity', value: '72 %', critical: true },
    { label: 'Ammonia', value: '4 ppm', critical: true },
    { label: 'Active', value: 'Active', critical: false },
    { label: 'Chicken', value: '3', critical: false },
    { label: 'Feed aval', value: '80 %', critical: true },
    { label: 'Water level', value: '56 %', critical: true },
  ];

  // Diagnostics messages matching the image
  const diagnosticsMessages = [
    'Waste detected. Run cleaning cycle regularly',
    'Scraper jammed. Error code 31',
    'Blocked rail. Code 12',
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 h-full flex flex-col">
      {/* REALTIME Section */}
      <div className="mb-4">
        <h3 className="text-sm md:text-base font-semibold mb-3 uppercase tracking-wide">
          REALTIME
        </h3>
        <div className="space-y-1">
          {realtimeItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
            >
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.critical ? '#f59e0b' : '#9ca3af' }}
                />
                <span className="text-xs md:text-sm text-gray-700">{item.label}:</span>
              </div>
              <span
                className={`text-xs md:text-sm font-medium ${
                  item.critical ? 'text-amber-600 font-semibold' : 'text-gray-900'
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostics Section */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <h3 className="text-sm md:text-base font-semibold mb-3 uppercase tracking-wide">
          Diagnostics
        </h3>
        <div className="space-y-2">
          {diagnosticsMessages.map((message, index) => (
            <div
              key={index}
              className="p-2 bg-amber-50 rounded border-l-2 border-amber-500"
            >
              <p className="text-xs md:text-sm text-gray-800">{message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}