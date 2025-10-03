import React, { useState, useRef } from 'react';
import { Upload, Download, Play, Edit, Trash2, File, Clock, Ruler, PenTool as Tool, Eye } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { GCodeUtils } from '../../utils/gcode';
import type { GCodeFile } from '../../types/cnc';

interface FileManagerPanelProps {
  onFileSelect: (file: GCodeFile) => void;
  onRunFile: (file: GCodeFile) => void;
  currentFile: GCodeFile | null;
  className?: string;
}

export default function FileManagerPanel({
  onFileSelect,
  onRunFile,
  currentFile,
  className = ''
}: FileManagerPanelProps) {
  const [files, setFiles] = useState<GCodeFile[]>([
    {
      id: '1',
      name: 'test_part.nc',
      content: 'G21\nG90\nG0 X0 Y0 Z5\nG1 Z-1 F100\nG1 X10 Y10 F500\nG0 Z5\nM30',
      size: 1024,
      lineCount: 7,
      estimatedTime: 120,
      material: 'Aluminum',
      toolsRequired: [1, 2],
      boundingBox: {
        min: { x: 0, y: 0, z: -1 },
        max: { x: 10, y: 10, z: 5 }
      },
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
  ]);
  const [selectedFile, setSelectedFile] = useState<GCodeFile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsedFile = GCodeUtils.parseGCodeFile(content, file.name);
      
      const newFile: GCodeFile = {
        ...parsedFile,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      setFiles(prev => [newFile, ...prev]);
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (file: GCodeFile) => {
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleEditFile = (file: GCodeFile) => {
    setSelectedFile(file);
    setEditContent(file.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedFile) return;

    const validation = GCodeUtils.validateGCode(editContent);
    if (!validation.isValid) {
      alert(`G-code validation failed:\n${validation.errors.join('\n')}`);
      return;
    }

    const updatedFile: GCodeFile = {
      ...selectedFile,
      content: editContent,
      lastModified: new Date().toISOString(),
      ...GCodeUtils.parseGCodeFile(editContent, selectedFile.name)
    };

    setFiles(prev => prev.map(f => f.id === selectedFile.id ? updatedFile : f));
    setSelectedFile(updatedFile);
    onFileSelect(updatedFile);
    setIsEditing(false);
  };

  const handleDeleteFile = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
    }
  };

  const handleDownloadFile = (file: GCodeFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* File List */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">G-Code Files</h3>
          <div className="flex items-center space-x-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".nc,.gcode,.tap,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedFile?.id === file.id
                  ? 'border-farm-300 bg-farm-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleFileSelect(file)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900">{file.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{file.lineCount} lines</span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(file.estimatedTime)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Eye className="w-4 h-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileSelect(file);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit className="w-4 h-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditFile(file);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadFile(file);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Play className="w-4 h-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRunFile(file);
                    }}
                    className="text-farm-600 hover:text-farm-700"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  />
                </div>
              </div>
            </div>
          ))}
          
          {files.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No G-Code files</p>
              <p className="text-sm">Upload a file to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* File Details / Editor */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit G-Code</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEdit}
                >
                  Save
                </Button>
              </div>
            </div>
            
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-96 font-mono text-sm border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-farm-500 focus:border-transparent"
              placeholder="Enter G-code here..."
            />
          </div>
        ) : selectedFile ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">File Details</h3>
              <Button
                variant="primary"
                icon={<Play className="w-4 h-4" />}
                onClick={() => onRunFile(selectedFile)}
              >
                Run File
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">File Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span>{selectedFile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span>{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lines:</span>
                    <span>{selectedFile.lineCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Material:</span>
                    <span>{selectedFile.material}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Estimated Time
                </h4>
                <p className="text-lg font-semibold text-gray-900">
                  {formatTime(selectedFile.estimatedTime)}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Ruler className="w-4 h-4 mr-2" />
                  Dimensions
                </h4>
                <div className="space-y-1 text-sm font-mono">
                  <div>X: {selectedFile.boundingBox.min.x.toFixed(2)} to {selectedFile.boundingBox.max.x.toFixed(2)}</div>
                  <div>Y: {selectedFile.boundingBox.min.y.toFixed(2)} to {selectedFile.boundingBox.max.y.toFixed(2)}</div>
                  <div>Z: {selectedFile.boundingBox.min.z.toFixed(2)} to {selectedFile.boundingBox.max.z.toFixed(2)}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Tool className="w-4 h-4 mr-2" />
                  Tools Required
                </h4>
                <div className="flex flex-wrap gap-1">
                  {selectedFile.toolsRequired.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      T{tool}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">G-Code Preview</h4>
                <div className="bg-gray-50 rounded-md p-3 max-h-48 overflow-y-auto">
                  <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                    {selectedFile.content.split('\n').slice(0, 20).join('\n')}
                    {selectedFile.content.split('\n').length > 20 && '\n...'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No file selected</p>
            <p className="text-sm">Select a file to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}