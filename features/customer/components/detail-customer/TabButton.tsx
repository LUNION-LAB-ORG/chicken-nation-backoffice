interface TabButtonProps {
  label: string
  isActive: boolean
  onClick: () => void
}

export function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      className={`py-2 cursor-pointer px-4 w-full sm:w-auto text-center transition-colors ${
        isActive 
          ? "text-[#F17922] font-medium border-b-2 border-[#F17922]" 
          : "text-gray-500 hover:text-gray-700"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
