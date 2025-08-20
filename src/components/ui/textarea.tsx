"use client"

import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        className={`block w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 focus:border-orange-400 focus:outline-none ${
          error ? 'border-orange-500' : ''
        } ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
