import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'admin'
  | 'arrow'
  | 'bell'
  | 'calendar'
  | 'cash'
  | 'check'
  | 'chef'
  | 'clock'
  | 'close'
  | 'dine-in'
  | 'delivery'
  | 'logout'
  | 'menu'
  | 'minus'
  | 'orders'
  | 'plus'
  | 'receipt'
  | 'search'
  | 'settings'
  | 'takeaway'
  | 'users'

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName
  size?: number
}

const paths: Record<IconName, ReactNode> = {
  admin: <><circle cx="12" cy="8" r="3" /><path d="M6.8 19a5.2 5.2 0 0 1 10.4 0" /><path d="M18.5 9.5v4M16.5 11.5h4" /></>,
  arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 15 18 15 18 8Z" /><path d="M10 20h4" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  cash: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M7 10h.01M17 15h.01" /><circle cx="12" cy="12.5" r="2.5" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  chef: <><path d="M7 10a4 4 0 0 1 1.5-7.7A4.5 4.5 0 0 1 12 4a4.5 4.5 0 0 1 3.5-1.7A4 4 0 0 1 17 10v8H7Z" /><path d="M7 14h10M9 18v3M15 18v3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  close: <><path d="m7 7 10 10M17 7 7 17" /></>,
  'dine-in': <><path d="M4 4v7a2 2 0 0 0 2 2h2V4M6 4v17M15 4v8M15 8c0-2.2 1.3-4 3-4v17" /></>,
  delivery: <><path d="M3 7h11v10H3zM14 11h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
  logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  minus: <path d="M5 12h14" />,
  orders: <><path d="M7 3h10v4H7z" /><path d="M5 5H4v16h16V5h-1M8 12h8M8 16h5" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 15 6.2L14.7 4h-5.4L9 6.2a7 7 0 0 0-1.5.9l-2.4-1-2 3.4L5.1 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.5.9l.3 2.2h5.4l.3-2.2a7 7 0 0 0 1.5-.9l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" /></>,
  takeaway: <><path d="M6 8h12l-1 13H7Z" /><path d="M8 8V5h8v3M9 12h6" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 9a2.5 2.5 0 0 1 0 5M17 16a4 4 0 0 1 3.5 3" /></>,
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[name]}
      </g>
    </svg>
  )
}
