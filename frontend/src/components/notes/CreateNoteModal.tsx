/**
 * Create Note Modal Component
 *
 * Modal for creating a new note with title and optional settings.
 */

import React, { useState } from 'react'
import { X, FileText, Smile } from 'lucide-react'
import { CreateNoteData } from '@/services/notesService'
import { cn } from '@/lib/utils'

interface CreateNoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateNoteData) => Promise<void>
  parentId?: string
  parentTitle?: string
}

// Common emojis for note icons
const EMOJI_OPTIONS = [
  '📝', '📋', '📌', '📎', '📒', '📕', '📗', '📘',
  '💡', '🎯', '🚀', '⭐', '✅', '🔥', '💼', '📊',
  '🎨', '🔧', '📱', '💻', '🌐', '📈', '🏆', '💎',
]

export const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  parentId,
  parentTitle,
}) => {
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState<string>('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        title: title.trim(),
        icon: icon || undefined,
        parentId,
      })
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create note')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setIcon('')
    setShowEmojiPicker(false)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Note
          </h2>
          <button
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Parent Info */}
          {parentId && parentTitle && (
            <div className="mb-4 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
              <span className="text-gray-500">Creating sub-note in: </span>
              <span className="font-medium text-gray-700 dark:text-gray-200">{parentTitle}</span>
            </div>
          )}

          {/* Icon & Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Note Title
            </label>
            <div className="flex items-center gap-2">
              {/* Icon Picker */}
              <div className="relative">
                <button
                  type="button"
                  className={cn(
                    'w-12 h-12 flex items-center justify-center rounded-lg border-2 border-dashed',
                    'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
                    'transition-colors text-xl'
                  )}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  {icon || <Smile className="w-5 h-5 text-gray-400" />}
                </button>

                {/* Emoji Picker Dropdown */}
                {showEmojiPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowEmojiPicker(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 w-[200px]">
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => {
                              setIcon(emoji)
                              setShowEmojiPicker(false)
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      {icon && (
                        <button
                          type="button"
                          className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700"
                          onClick={() => {
                            setIcon('')
                            setShowEmojiPicker(false)
                          }}
                        >
                          Remove icon
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Title Input */}
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setError(null)
                }}
                placeholder="Enter note title..."
                autoFocus
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-700/50',
                  'text-gray-900 dark:text-white placeholder-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  error
                    ? 'border-red-300 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-600'
                )}
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Preview */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <div className="text-xs text-gray-500 mb-2">Preview</div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              {icon && <span className="text-lg">{icon}</span>}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {title || 'Untitled'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                'px-4 py-2 text-sm bg-blue-500 text-white rounded-lg',
                'hover:bg-blue-600 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Note'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateNoteModal
