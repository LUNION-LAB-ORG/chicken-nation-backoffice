"use client"

import React from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
}

export default function Toggle({ checked, onChange, label, className = '' }: ToggleProps) {
  return (
    <div className={`flex items-center ${className}`}>
      {label && (
        <span className="text-[13px] text-gray-600 mr-2">{label}</span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors  cursor-pointer  ${checked ? 'bg-[#F17922]' : 'bg-gray-200'}`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  )
}
