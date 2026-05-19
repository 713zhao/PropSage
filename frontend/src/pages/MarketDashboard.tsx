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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${ANALYSIS_API_URL}/api/macro-insights`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch macro insights:', err)
        setLoading(false)
      })
  }, [])

  const commonChartStyle = {
    grid: { top: 40, right: 20, bottom: 40, left: 50, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.map(d => d.quarter).filter((_, i) => i % 4 === 0), // Sample for better labels
      axisLabel: { color: '#9CA3AF', fontSize: 11 },
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
    xAxis: { ...commonChartStyle.xAxis, data: data.map(d => d.quarter) },
    series: [
      {
        name: 'Private PPI',
        type: 'line',
        data: data.map(d => d.private_index),
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: '#60A5FA' },
        itemStyle: { color: '#60A5FA' }
      },
      {
        name: 'HDB Resale',
        type: 'line',
        data: data.map(d => d.hdb_index),
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: '#34D399' },
        itemStyle: { color: '#34D399' }
      }
    ]
  }

  const priceGapOption = {
    ...commonChartStyle,
    xAxis: { ...commonChartStyle.xAxis, data: data.map(d => d.quarter) },
    series: [{
      name: 'Price Gap',
      type: 'line',
      data: data.map(d => d.price_gap),
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
    xAxis: { ...commonChartStyle.xAxis, data: data.map(d => d.quarter) },
    series: [{
      name: 'Affordability Index',
      type: 'bar',
      data: data.map(d => d.affordability_index),
      itemStyle: {
        color: '#FBBF24',
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }

  const populationOption = {
    ...commonChartStyle,
    xAxis: { ...commonChartStyle.xAxis, data: data.map(d => d.quarter) },
    series: [{
      name: 'Population',
      type: 'line',
      data: data.map(d => parseFloat(d.total_population as string || '0')),
      smooth: true,
      lineStyle: { width: 3, color: '#A78BFA' },
      itemStyle: { color: '#A78BFA' }
    }]
  }

  // Mock data for unsold inventory as it was missing from API
  const unsoldOption = {
    ...commonChartStyle,
    xAxis: { 
      ...commonChartStyle.xAxis, 
      data: ['2021 Q1', '2021 Q2', '2021 Q3', '2021 Q4', '2022 Q1', '2022 Q2', '2022 Q3', '2022 Q4', '2023 Q1', '2023 Q2']
    },
    series: [{
      name: 'Unsold Units',
      type: 'bar',
      data: [21432, 19342, 17123, 16142, 14321, 15674, 16123, 16543, 16234, 16421],
      itemStyle: {
        color: '#F87171',
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }

  const stats = [
    { title: t('dashboard.stats.priceGrowth'), value: '+12.5%', sub: 'Last 5 Years', icon: TrendingUp, color: 'text-blue-400' },
    { title: t('dashboard.stats.inventory'), value: '16,421', sub: 'Units Available', icon: Home, color: 'text-emerald-400' },
    { title: t('dashboard.stats.landCost'), value: '$1,250', sub: 'PSF Average', icon: Landmark, color: 'text-amber-400' },
    { title: t('dashboard.stats.activeBids'), value: '8', sub: 'Current GLS Bids', icon: Gavel, color: 'text-purple-400' },
  ]

  const benchmarks = [
    { project: 'The Continuum', region: 'RCR', price: '$2,732', date: '2023-05' },
    { project: 'Tembusu Grand', region: 'RCR', price: '$2,465', date: '2023-04' },
    { project: 'Sceneca Residence', region: 'OCR', price: '$2,096', date: '2023-01' },
    { project: 'Lentor Hills Residences', region: 'OCR', price: '$2,100', date: '2023-07' },
    { project: 'Reserve Residences', region: 'RCR', price: '$2,450', date: '2023-05' },
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
          <div className="p-5 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">{t('dashboard.table.benchmarks')}</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950/50">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('dashboard.table.project')}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('dashboard.table.region')}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">{t('dashboard.table.price')}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">{t('dashboard.table.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {benchmarks.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-white">{row.project}</td>
                    <td className="px-5 py-4 text-sm text-gray-400">
                      <span className="px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700">{row.region}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-white font-mono text-right">{row.price}</td>
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
