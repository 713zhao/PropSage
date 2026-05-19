import { NavLink } from 'react-router-dom'
import { 
  BarChart3, 
  Map, 
  Building2, 
  LineChart, 
  ClipboardList, 
  Lightbulb, 
  Landmark, 
  TrendingUp, 
  Home, 
  Calculator, 
  User, 
  Pin, 
  Bot 
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const NAV_SECTIONS = [
  {
    id: 'research',
    labelKey: 'nav.sections.research' as const,
    items: [
      { path: '/market', icon: BarChart3, labelKey: 'nav.marketDashboard' as const },
      { path: '/map', icon: Map, labelKey: 'nav.districtMap' as const },
      { path: '/land-intel', icon: Building2, labelKey: 'nav.landIntel' as const },
      { path: '/macro', icon: LineChart, labelKey: 'nav.macroAnalysis' as const },
      { path: '/transactions', icon: ClipboardList, labelKey: 'nav.transactions' as const },
    ],
  },
  {
    id: 'analysis',
    labelKey: 'nav.sections.analysis' as const,
    items: [
      { path: '/investment', icon: Lightbulb, labelKey: 'nav.investmentStrategy' as const },
      { path: '/loans', icon: Landmark, labelKey: 'nav.loanCompare' as const },
      { path: '/roi', icon: TrendingUp, labelKey: 'nav.roiProjector' as const },
      { path: '/enbloc', icon: Home, labelKey: 'nav.enblocWatch' as const },
    ],
  },
  {
    id: 'core',
    labelKey: 'nav.sections.core' as const,
    items: [
      { path: '/calculator', icon: Calculator, labelKey: 'nav.taxCalculator' as const },
      { path: '/profile', icon: User, labelKey: 'nav.myProfile' as const },
    ],
  },
  {
    id: 'tools',
    labelKey: 'nav.sections.tools' as const,
    items: [
      { path: '/shortlist', icon: Pin, labelKey: 'nav.shortlist' as const },
      { path: '/advisor', icon: Bot, labelKey: 'nav.aiAdvisor' as const },
    ],
  },
]

export function Sidebar() {
  const { t } = useLanguage()

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <div>
            <span className="text-blue-400 font-bold text-lg block leading-none">PropSage</span>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mt-1 font-medium">SG Property Advisor</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="mb-4">
            <p className="px-4 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
              {t(section.labelKey)}
            </p>
            <div className="mt-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border-r-4 border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      <span className={isActive ? 'font-semibold' : 'font-medium'}>{t(item.labelKey)}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
