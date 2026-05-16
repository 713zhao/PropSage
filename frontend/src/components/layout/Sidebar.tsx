import { NavLink } from 'react-router-dom'

const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { path: '/calculator', icon: '🧮', label: 'Tax Calculator' },
      { path: '/profile', icon: '👤', label: 'My Profile' },
    ],
  },
  {
    label: 'Research',
    items: [
      { path: '/map', icon: '🗺️', label: 'District Map' },
      { path: '/transactions', icon: '📋', label: 'Transactions' },
      { path: '/market', icon: '📈', label: 'Market Intel' },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { path: '/loans', icon: '🏦', label: 'Loan Compare' },
      { path: '/roi', icon: '💹', label: 'ROI Projector' },
      { path: '/enbloc', icon: '🏚️', label: 'En-Bloc Watch' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/shortlist', icon: '📌', label: 'Shortlist' },
      { path: '/advisor', icon: '🤖', label: 'AI Advisor' },
    ],
  },
]

export function Sidebar() {
  return (
    <aside className="w-48 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-800">
        <span className="text-blue-400 font-bold text-lg">🏠 PropSage</span>
        <p className="text-gray-500 text-xs mt-0.5">SG Property Advisor</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-3">
            <p className="px-4 py-1 text-xs text-gray-600 uppercase tracking-wider">
              {section.label}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-900/40 text-blue-400 border-l-2 border-blue-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800 border-l-2 border-transparent'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
