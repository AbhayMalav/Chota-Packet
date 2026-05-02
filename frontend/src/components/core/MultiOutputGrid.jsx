import React from 'react'
import OutputCard from './OutputCard'
import './MultiOutputGrid.css'

export default function MultiOutputGrid({ 
  outputs = [], 
  configs = [], 
  loadingStates = [],
  skeletonCount = 0,
  onRegenerate,
  onConfigChange,
  models = [],
  selectedModel,
  onModelChange,
  onTextChange,
  onClear
}) {
  const handleConfigChange = (index, config) => {
    onConfigChange?.(index, config)
  }

  const handleTextChange = (index, text) => {
    onTextChange?.(index, text)
  }

  const handleRemove = (index) => {
    onClear?.(index)
  }

  const handleRegenerate = (index) => {
    onRegenerate?.(index)
  }

  // Empty state
  if (outputs.length === 0 && skeletonCount === 0) {
    return (
      <div className="multi-output-empty">
        <p className="text-secondary text-sm">No outputs yet. Enter a prompt and click Enhance.</p>
      </div>
    )
  }

  return (
    <div className="multi-output-grid">
      <div className="multi-output-container">
        {/* Skeleton loaders */}
        {skeletonCount > 0 && Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={`skeleton-${index}`} className="multi-output-card-wrapper">
            <div className="glass-card rounded-xl skeleton h-[200px]" />
          </div>
        ))}
        
        {/* Actual output cards */}
        {outputs.map((output, index) => (
          <div key={output.id || `output-${index}`} className="multi-output-card-wrapper">
            <OutputCard
              text={output.text}
              config={configs[index] || {}}
              onConfigChange={(config) => handleConfigChange(index, config)}
              models={models}
              selectedModel={output.model || selectedModel}
              onModelChange={(model) => onModelChange?.(model, index)}
              showControls={true}
              index={index}
              onRemove={() => handleRemove(index)}
              onRegenerate={() => handleRegenerate(index)}
              onTextChange={(text) => handleTextChange(index, text)}
              onClear={() => handleRemove(index)}
              isLoading={loadingStates[index]}
              isError={output.status === 'error'}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
