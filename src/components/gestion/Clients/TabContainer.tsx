import { ReactNode } from 'react'
import { TabButton } from './TabButton'

interface Tab {
  id: string
  label: string
}

interface TabContainerProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children: ReactNode
}

export function TabContainer({ tabs, activeTab, onTabChange, children }: TabContainerProps) {
  return (
    <div>
      <div className="mt-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-center items-center sm:space-x-8 space-y-2 sm:space-y-0">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              isActive={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            />
          ))}
        </div>
      </div>
      <div className="mt-6">
        {children}
      </div>
    </div>
  )
}
