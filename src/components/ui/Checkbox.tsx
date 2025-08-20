import React from 'react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
}

const Checkbox = ({ checked, onChange, id }: CheckboxProps) => {
  return (
    <label className="relative inline-block cursor-pointer">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <div 
        className="w-5 h-5 border-2 border-gray-300 rounded-md transition-all duration-200 
          peer-checked:border-[#F17922] peer-checked:bg-[#F17922] relative
          after:content-[''] after:absolute after:top-[2px] after:left-[5px]
          after:w-[6px] after:h-[10px] after:border-r-2 after:border-b-2
          after:border-white after:rotate-45 after:scale-0 after:opacity-0
          peer-checked:after:scale-100 peer-checked:after:opacity-100
          after:transition-all after:duration-200
          hover:border-[#F17922]"
      />
    </label>
  )
}

export default Checkbox 