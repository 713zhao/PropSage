import { useEffect, useState } from 'react'
import { TrendingUp, Home, Landmark, Gavel } from 'lucide-react'
import { ChartCard } from '../components/dashboard/ChartCard'
import { ANALYSIS_API_URL } from '../config/analysisApi'
import { useLanguage } from '../context/LanguageContext'

interface MacroData {
  quarter: string
  hdb_index: number | null
  private_index: number | null
  total_population: string | number | null
  price_gap: number | null
  affordability_index: number | null
}

export function MarketDashboard() {
  const { t } = useLanguage()
  const [data, setData] = useState<MacroData[]>([])
  const [liveData, setLiveData] = useState<any>(null)
  const [benchmarks, setBenchmarks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [transactions, setTransactions] = useState<any[]>([])
  const [newProjects, setNewProjects] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`${ANALYSIS_API_URL}/api/macro-insights`).then(r => r.json()),
      fetch(`${ANALYSIS_API_URL}/api/macro-live`).then(r => r.json()),
      fetch(`${ANALYSIS_API_URL}/api/launches-live`).then(r => r.json()),
      fetch(`${ANALYSIS_API_URL}/api/transactions?limit=20`).then(r => r.json())
    ])
      .then(([insights, live, launchBench, trans]) => {
        setData(insights)
        setLiveData(live)
        setTransactions(Array.isArray(trans) ? trans : [])
        
        if (Array.isArray(launchBench)) {
          setNewProjects(launchBench)
          setBenchmarks(launchBench.slice(0, 8).map((b: any) => ({
            project: b.project_name || b.project,
            region: b.region,
            price: `$${b.avg_price_psf || b.price}`,
            date: b.launch_date || b.date || b.year
          })))
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch dashboard data:', err)
        setLoading(false)
      })
  }, [])

  const displayData = data.slice(-40)

  const commonChartStyle = {
    grid: { top: 40, right: 20, bottom: 40, left: 50, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: displayData.map(d => d.quarter),
      axisLabel: { 
        color: '#9CA3AF', 
        fontSize: 11,
        interval: 'auto',
        formatter: (value: string) => {
          // If it's a Q1, show the full year, otherwise just show the quarter
          if (value.includes('Q1')) return value;
          return value.split(' ')[1] || value;
        }
      },
      axisLine: { lineStyle: { color: '#374151' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#9CA3AF', fontSize: 11 },
      splitLine: { lineStyle: { color: '#1F2937' } }
    },
    textStyle: { fontFamily: 'Inter, sans-serif' }
  }

  const marketPriceOption = {
    ...commonChartStyle,
    legend: { textStyle: { color: '#9CA3AF' }, bottom: 0 },
    series: [
      {
        name: 'Private PPI',
        type: 'line',
        data: displayData.map(d => d.private_index),
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: '#60A5FA' },
        itemStyle: { color: '#60A5FA' }
      },
      {
        name: 'HDB Resale',
        type: 'line',
        data: displayData.map(d => d.hdb_index),
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: '#34D399' },
        itemStyle: { color: '#34D399' }
      }
    ]
  }

  const priceGapOption = {
    ...commonChartStyle,
    series: [{
      name: 'Price Gap',
      type: 'line',
      data: displayData.map(d => d.price_gap),
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(96, 165, 250, 0.3)' }, { offset: 1, color: 'rgba(96, 165, 250, 0)' }]
        }
      },
      lineStyle: { width: 3, color: '#60A5FA' },
      itemStyle: { color: '#60A5FA' }
    }]
  }

  const affordabilityOption = {
    ...commonChartStyle,
    series: [{
      name: 'Affordability Index',
      type: 'bar',
      data: displayData.map(d => d.affordability_index),
      itemStyle: {
        color: '#FBBF24',
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }

  const populationOption = {
    ...commonChartStyle,
    series: [{
      name: 'Population',
      type: 'line',
      data: displayData.map(d => parseFloat(d.total_population as string || '0')),
      smooth: true,
      lineStyle: { width: 3, color: '#A78BFA' },
      itemStyle: { color: '#A78BFA' }
    }]
  }

  // Use live data for unsold inventory if available with regional breakdown
  const inventoryData = liveData?.data?.launches || []
  const unsoldOption = {
    ...commonChartStyle,
    legend: { textStyle: { color: '#9CA3AF' }, bottom: 0 },
    xAxis: { 
      ...commonChartStyle.xAxis, 
      data: inventoryData.length > 0 
        ? inventoryData.map((d: any) => d.q)
        : ['22Q1', '22Q2', '22Q3', '22Q4', '23Q1', '23Q2', '23Q3', '23Q4', '24Q1', '24Q2']
    },
    series: [
      {
        name: 'CCR',
        type: 'bar',
        stack: 'total',
        data: inventoryData.length > 0 ? inventoryData.map((d: any) => d.ccr) : [4200, 3800, 3500, 3200, 3100, 3400, 3500, 3600, 3400, 3300],
        itemStyle: { color: '#8B5CF6' }
      },
      {
        name: 'RCR',
        type: 'bar',
        stack: 'total',
        data: inventoryData.length > 0 ? inventoryData.map((d: any) => d.rcr) : [8200, 7500, 6800, 6500, 6200, 6800, 7100, 7200, 6900, 6800],
        itemStyle: { color: '#3B82F6' }
      },
      {
        name: 'OCR',
        type: 'bar',
        stack: 'total',
        data: inventoryData.length > 0 ? inventoryData.map((d: any) => d.ocr) : [9032, 8042, 6823, 6442, 5021, 5474, 5523, 5743, 5934, 6321],
        itemStyle: { color: '#10B981' }
      }
    ]
  }

  const stats = [
    { title: t('dashboard.stats.priceGrowth'), value: '+12.5%', sub: 'Last 5 Years', icon: TrendingUp, color: 'text-blue-400' },
    { title: t('dashboard.stats.inventory'), value: '16,421', sub: 'Units Available', icon: Home, color: 'text-emerald-400' },
    { title: t('dashboard.stats.landCost'), value: '$1,250', sub: 'PSF Average', icon: Landmark, color: 'text-amber-400' },
    { title: t('dashboard.stats.activeBids'), value: '8', sub: 'Current GLS Bids', icon: Gavel, color: 'text-purple-400' },
  ]

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">{t('macro.title')}</h1>
        <p className="text-gray-400 max-w-3xl leading-relaxed">{t('macro.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg hover:border-gray-700 transition-colors">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`p-2 bg-gray-800 rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
              <span className="text-emerald-500 font-medium">↑</span> {stat.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard 
          title={t('dashboard.charts.marketPriceTrend')} 
          subtitle={t('dashboard.charts.marketPriceTrendSub')} 
          option={marketPriceOption} 
          loading={loading}
        />
        <ChartCard 
          title={t('chart.unsoldInventory')} 
          subtitle={t('macro.chartUnsoldSub')} 
          option={unsoldOption} 
          loading={loading}
        />
        <ChartCard 
          title={t('dashboard.charts.priceGapTrend')} 
          subtitle={t('dashboard.charts.priceGapTrendSub')} 
          option={priceGapOption} 
          loading={loading}
        />
        <ChartCard 
          title={t('dashboard.charts.affordabilityIndex')} 
          subtitle={t('dashboard.charts.affordabilityIndexSub')} 
          option={affordabilityOption} 
          loading={loading}
        />
        <ChartCard 
          title={t('dashboard.charts.populationGrowth')} 
          subtitle={t('dashboard.charts.populationGrowthSub')} 
          option={populationOption} 
          loading={loading}
        />
        
        {/* Recent Benchmarks Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full lg:col-span-2">
          <div className="p-5 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">{t('dashboard.table.benchmarks')}</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/50">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('dashboard.table.project')}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('dashboard.table.region')}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Total Units</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Sold / Remaining</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">{t('dashboard.table.price')}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">{t('dashboard.table.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {newProjects.slice(0, 15).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-white">
                      <div>{row.project_name}</div>
                      <div className="text-[10px] text-gray-500 font-normal uppercase mt-0.5">{row.address || 'Singapore'}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">
                      <span className="px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700">{row.region}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-300 text-right">{row.total_units || '-'}</td>
                    <td className="px-5 py-4 text-sm text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-emerald-500 font-medium">{row.units_sold || 0} Sold</span>
                        <span className="text-gray-500 text-[10px]">{(row.total_units || 0) - (row.units_sold || 0)} Remaining</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-white font-mono text-right">${row.avg_price_psf || row.price} psf</td>
                    <td className="px-5 py-4 text-sm text-gray-500 text-right">{row.launch_date || row.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 20 Recent Transactions */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full lg:col-span-2">
          <div className="p-5 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Top 20 Recent Transactions</h3>
            <span className="text-xs text-gray-500">Live URA Data</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/50">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Project / Address</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Price</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Size (sqft)</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">PSF</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {transactions.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-white">{row.project}</td>
                    <td className="px-5 py-4 text-sm text-emerald-400 font-mono text-right">${row.price?.toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-gray-400 text-right">{row.size_sqft}</td>
                    <td className="px-5 py-4 text-sm text-blue-400 font-mono text-right">${row.size_sqft ? Math.round(row.price / row.size_sqft).toLocaleString() : '-'}</td>
                    <td className="px-5 py-4 text-sm text-gray-500 text-right">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
