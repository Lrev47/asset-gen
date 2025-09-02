'use client'

import React, { useState } from 'react'
import { 
  X, 
  Play, 
  Copy, 
  Trash2, 
  Archive,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface BulkOperationsBarProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkGenerate: () => Promise<void>
  onBulkDuplicate: () => Promise<void>
  onBulkDelete: () => Promise<void>
  isProcessing?: boolean
}

export default function BulkOperationsBar({
  selectedCount,
  onClearSelection,
  onBulkGenerate,
  onBulkDuplicate,
  onBulkDelete,
  isProcessing = false
}: BulkOperationsBarProps) {
  const [currentOperation, setCurrentOperation] = useState<string | null>(null)

  const handleOperation = async (operation: string, action: () => Promise<void>) => {
    setCurrentOperation(operation)
    try {
      await action()
    } finally {
      setCurrentOperation(null)
    }
  }

  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg px-4 py-3 flex items-center space-x-4 min-w-[400px]">
        {/* Selection Info */}
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {selectedCount} field{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 flex-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOperation('generate', onBulkGenerate)}
            disabled={isProcessing || currentOperation !== null}
          >
            {currentOperation === 'generate' ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            Generate
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOperation('duplicate', onBulkDuplicate)}
            disabled={isProcessing || currentOperation !== null}
          >
            {currentOperation === 'duplicate' ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            Duplicate
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessing || currentOperation !== null}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Fields</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedCount} field{selectedCount !== 1 ? 's' : ''}? 
                  This will also delete all associated media and generations. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleOperation('delete', onBulkDelete)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {currentOperation === 'delete' ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Fields'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Clear Selection */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isProcessing || currentOperation !== null}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Processing Indicator */}
        {currentOperation && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </div>
    </div>
  )
}