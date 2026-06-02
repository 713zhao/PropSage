import ReactECharts from 'echarts-for-react'
import { Download, Maximize2, MoreHorizontal } from 'lucide-react'

interface ChartCardProps {
  title: string
  subtitle?: string
  option: any
  loading?: boolean
  badge?: 'mock' | 'estimated'
}

const BADGE_STYLES = {
  mock:      'bg-amber-500/10 text-amber-400 border-amber-500/25',
  estimated: 'bg-violet-500/10 text-violet-400 border-violet-500/25',
}

export function ChartCard({ title, subtitle, option, loading, badge }: ChartCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
      <div className="p-5 border-b border-gray-800 flex justify-between items-start">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-white leading-tight">{title}</h3>
            {badge && (
              <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${BADGE_STYLES[badge]}`}>
                {badge === 'mock' ? 'Mock Data' : 'Estimated'}
              </span>
            )}
          </div>
          {subtitle && <p className="text-sm text-gray-500 leading-relaxed">{subtitle}</p>}
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          <button className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"><Download size={16} /></button>
          <button className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"><Maximize2 size={16} /></button>
          <button className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"><MoreHorizontal size={16} /></button>
        </div>
      </div>
      <div className="flex-1 p-5 min-h-[350px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 italic">Loading...</div>
        ) : (
          <ReactECharts 
            option={option} 
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
          />
        )}
      </div>
    </div>
  )
}
