 

interface StatusBadgeProps {
  status: 'online' | 'offline'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    offline: 'bg-[#FBD2B5] text-slate-600',
    online: 'bg-[#4FCBBA] text-white'
  }

  const labels = {
    offline: 'Pas connecté',
    online: 'Connecté'
  }

  return (
    <span
      className={`inline-flex items-center rounded-xl px-2 py-1.5 text-xs font-medium md:px-2 md:py-2 ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}
