import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { cn } from '../ui'

export interface CatalogItem {
  id: string
  title: string
  description?: string
  frequency_hint?: string
  achievement_criteria?: string
}

interface Props {
  items: CatalogItem[]
  onSelect: (item: CatalogItem) => void
  onAddCustom: (title: string) => void
  loading?: boolean
  extraField?: {
    label: string
    placeholder: string
    value: string
    onChange: (v: string) => void
    required?: boolean
  }
}

export function CatalogPicker({ items, onSelect, onAddCustom, loading, extraField }: Props) {
  const [customTitle, setCustomTitle] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCustom, setShowCustom] = useState(false)

  function handleSelectCatalog(item: CatalogItem) {
    setSelectedId(item.id)
    setShowCustom(false)
  }

  function handleConfirmCatalog() {
    const item = items.find((i) => i.id === selectedId)
    if (item) onSelect(item)
  }

  function handleSubmitCustom(e: React.FormEvent) {
    e.preventDefault()
    if (customTitle.trim()) {
      onAddCustom(customTitle.trim())
      setCustomTitle('')
    }
  }

  return (
    <div className="space-y-3">
      {/* Catalog list */}
      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">From catalog</p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectCatalog(item)}
                className={cn(
                  'w-full text-left rounded-xl border px-3.5 py-3 transition-all',
                  selectedId === item.id
                    ? 'border-sage-300 ring-1 ring-sage-200 bg-sage-50'
                    : 'border-warm-200 hover:border-warm-300 hover:bg-warm-50',
                )}
              >
                <div className="flex items-start gap-2">
                  <Sparkles size={13} className="text-sage-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{item.description}</p>
                    )}
                    {item.frequency_hint && (
                      <p className="text-xs text-sage-600 mt-1">Frequency: {item.frequency_hint}</p>
                    )}
                    {item.achievement_criteria && (
                      <p className="text-xs text-sage-600 mt-1">Criteria: {item.achievement_criteria}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {selectedId && !showCustom && (
            <div className="pt-1 space-y-2">
              {extraField && (
                <Input
                  label={extraField.label}
                  placeholder={extraField.placeholder}
                  value={extraField.value}
                  onChange={(e) => extraField.onChange(e.target.value)}
                  required={extraField.required}
                />
              )}
              <Button
                className="w-full"
                onClick={handleConfirmCatalog}
                loading={loading}
                disabled={extraField?.required ? !extraField.value.trim() : false}
              >
                Add selected
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Custom option */}
      <div>
        {!showCustom ? (
          <button
            type="button"
            onClick={() => { setShowCustom(true); setSelectedId(null) }}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors py-1"
          >
            <Plus size={14} /> Add custom
          </button>
        ) : (
          <form onSubmit={handleSubmitCustom} className="space-y-2">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Custom</p>
            <Input
              placeholder="Enter title..."
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              required
              autoFocus
            />
            {extraField && (
              <Input
                label={extraField.label}
                placeholder={extraField.placeholder}
                value={extraField.value}
                onChange={(e) => extraField.onChange(e.target.value)}
                required={extraField.required}
              />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowCustom(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={loading}
                disabled={!customTitle.trim() || (extraField?.required ? !extraField.value.trim() : false)}
              >
                Add
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
