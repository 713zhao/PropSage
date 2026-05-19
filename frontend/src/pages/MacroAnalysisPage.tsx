import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { ChartCard } from '../components/dashboard/ChartCard'
import { RefreshCw, Clock, Calendar, Activity } from 'lucide-react'
import { ANALYSIS_API_URL } from '../config/analysisApi'

export function MacroAnalysisPage() {
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [liveData, setLiveData] = useState<any>(null)
  const [activeMacroTab, setActiveMacroTab] = useState<'gdp' | 'unemployment'>('gdp')

  const fetchData = async (forceRefresh = false) => {
    if (forceRefresh) {
      setSyncing(true)
    } else {
      setLoading(true)
    }

    try {
      const url = forceRefresh 
        ? `${ANALYSIS_API_URL}/api/macro-live?refresh=true` 
        : `${ANALYSIS_API_URL}/api/macro-live`
      const res = await fetch(url)
      const data = await res.json()
      if (data && data.data) {
        setLiveData(data)
      }
    } catch (err) {
      console.error('Error fetching live macro data:', err)
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="animate-spin text-blue-500" size={40} />
        <p className="text-gray-400 animate-pulse">{t('common.loading')}</p>
      </div>
    )
  }

  const ppiData = liveData?.data?.ppi || []
  const ppiForecast = liveData?.data?.ppi_forecast || []
  const hdbData = liveData?.data?.hdb || []
  const hdbForecast = liveData?.data?.hdb_forecast || []
  const unsoldData = liveData?.data?.unsold || []
  const unsoldForecast = liveData?.data?.unsold_forecast || []
  const launchesData = liveData?.data?.launches || []
  const launchesForecast = liveData?.data?.launches_forecast || []
  const gdpData = liveData?.data?.gdp || []
  const gdpForecast = liveData?.data?.gdp_forecast || []
  const unemploymentData = liveData?.data?.unemployment || []
  const unemploymentForecast = liveData?.data?.unemployment_forecast || []

  const formatQVal = (q: string, isForecast: boolean) => {
    if (!isForecast) return q
    return `${q} (${t('macro.forecast')})`
  }

  const chartTheme = {
    backgroundColor: 'transparent',
    textStyle: { color: '#9CA3AF' },
    tooltip: {
      backgroundColor: '#111827',
      borderColor: '#374151',
      textStyle: { color: '#F3F4F6' }
    },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      axisLabel: { color: '#9CA3AF' },
      axisLine: { lineStyle: { color: '#374151' } }
    },
    yAxis: {
      axisLabel: { color: '#9CA3AF' },
      splitLine: { lineStyle: { color: '#1F2937' } }
    }
  }

  // PPI Option
  const ppiXAxis = [...ppiData.map((d: any) => d.q), ...ppiForecast.map((d: any) => formatQVal(d.q, true))]
  const ccrHist = [...ppiData.map((d: any) => d.ccr), ...ppiForecast.map(() => null)]
  const ccrFore = [...ppiData.map((d: any, idx: number) => idx === ppiData.length - 1 ? d.ccr : null), ...ppiForecast.map((d: any) => d.ccr)]
  const rcrHist = [...ppiData.map((d: any) => d.rcr), ...ppiForecast.map(() => null)]
  const rcrFore = [...ppiData.map((d: any, idx: number) => idx === ppiData.length - 1 ? d.rcr : null), ...ppiForecast.map((d: any) => d.rcr)]
  const ocrHist = [...ppiData.map((d: any) => d.ocr), ...ppiForecast.map(() => null)]
  const ocrFore = [...ppiData.map((d: any, idx: number) => idx === ppiData.length - 1 ? d.ocr : null), ...ppiForecast.map((d: any) => d.ocr)]

  const ppiOption = {
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis' },
    legend: { 
      data: ['CCR', 'RCR', 'OCR', t('macro.forecastTrend')],
      bottom: 0,
      textStyle: { color: '#9CA3AF' }
    },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: ppiXAxis },
    yAxis: { 
      ...chartTheme.yAxis, 
      type: 'value', 
      name: 'Index',
      min: (value: any) => Math.floor(value.min - 5)
    },
    series: [
      { name: 'CCR', type: 'line', data: ccrHist, itemStyle: { color: '#8B5CF6' }, lineStyle: { width: 3 }, symbolSize: 6 },
      { name: t('macro.forecastTrend'), type: 'line', data: ccrFore, itemStyle: { color: '#8B5CF6' }, lineStyle: { width: 2.5, type: 'dashed' }, symbolSize: 5 },
      { name: 'RCR', type: 'line', data: rcrHist, itemStyle: { color: '#3B82F6' }, lineStyle: { width: 3.5 }, symbolSize: 8 },
      { name: t('macro.forecastTrend'), type: 'line', data: rcrFore, itemStyle: { color: '#3B82F6' }, lineStyle: { width: 2.5, type: 'dashed' }, symbolSize: 5 },
      { name: 'OCR', type: 'line', data: ocrHist, itemStyle: { color: '#10B981' }, lineStyle: { width: 3 }, symbolSize: 6 },
      { name: t('macro.forecastTrend'), type: 'line', data: ocrFore, itemStyle: { color: '#10B981' }, lineStyle: { width: 2.5, type: 'dashed' }, symbolSize: 5 }
    ]
  }

  // HDB Option
  const hdbXAxis = [...hdbData.map((d: any) => d.q), ...hdbForecast.map((d: any) => formatQVal(d.q, true))]
  const hdbHist = [...hdbData.map((d: any) => d.index), ...hdbForecast.map(() => null)]
  const hdbFore = [...hdbData.map((d: any, idx: number) => idx === hdbData.length - 1 ? d.index : null), ...hdbForecast.map((d: any) => d.index)]

  const hdbOption = {
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis' },
    legend: { data: [t('chart.hdbResale'), t('macro.forecastIndex')], bottom: 0, textStyle: { color: '#9CA3AF' } },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: hdbXAxis },
    yAxis: { ...chartTheme.yAxis, type: 'value', name: 'Index', min: (value: any) => Math.floor(value.min - 2) },
    series: [
      {
        name: t('chart.hdbResale'), type: 'line', smooth: true, data: hdbHist, itemStyle: { color: '#0284C7' }, lineStyle: { width: 3.5 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(2, 132, 199, 0.2)' }, { offset: 1, color: 'rgba(2, 132, 199, 0)' }] } },
        symbolSize: 6
      },
      { name: t('macro.forecastIndex'), type: 'line', smooth: true, data: hdbFore, itemStyle: { color: '#0284C7' }, lineStyle: { width: 2.5, type: 'dashed' }, symbolSize: 5 }
    ]
  }

  // Unsold Option
  const unsoldXAxis = [...unsoldData.map((d: any) => d.q), ...unsoldForecast.map((d: any) => formatQVal(d.q, true))]
  const unsoldDataMapped = [
    ...unsoldData.map((d: any) => d.unsold),
    ...unsoldForecast.map((d: any) => ({
      value: d.unsold,
      itemStyle: { color: 'rgba(239, 68, 68, 0.35)', borderColor: '#ef4444', borderWidth: 1.5, borderType: 'dashed', borderRadius: [4, 4, 0, 0] }
    }))
  ]

  const unsoldOption = {
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis' },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: unsoldXAxis },
    yAxis: { ...chartTheme.yAxis, type: 'value', name: t('macro.units') },
    series: [{ name: t('chart.unsoldInventory'), type: 'bar', data: unsoldDataMapped, itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] }, barWidth: '50%' }]
  }

  // Launches Option
  const launchesXAxis = [...launchesData.map((d: any) => d.q), ...launchesForecast.map((d: any) => formatQVal(d.q, true))]
  const ccrLaunchesMapped = [...launchesData.map((d: any) => d.ccr), ...launchesForecast.map((d: any) => ({ value: d.ccr, itemStyle: { color: 'rgba(139, 92, 246, 0.35)', borderColor: '#8b5cf6', borderWidth: 1.5, borderType: 'dashed' } }))]
  const rcrLaunchesMapped = [...launchesData.map((d: any) => d.rcr), ...launchesForecast.map((d: any) => ({ value: d.rcr, itemStyle: { color: 'rgba(59, 130, 246, 0.35)', borderColor: '#3b82f6', borderWidth: 1.5, borderType: 'dashed' } }))]
  const ocrLaunchesMapped = [...launchesData.map((d: any) => d.ocr), ...launchesForecast.map((d: any) => ({ value: d.ocr, itemStyle: { color: 'rgba(16, 185, 129, 0.35)', borderColor: '#10b981', borderWidth: 1.5, borderType: 'dashed', borderRadius: [4, 4, 0, 0] } }))]

  const launchesOption = {
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['CCR', 'RCR', 'OCR'], bottom: 0, textStyle: { color: '#9CA3AF' } },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: launchesXAxis },
    yAxis: { ...chartTheme.yAxis, type: 'value', name: t('macro.unitsLaunched') },
    series: [
      { name: 'CCR', type: 'bar', stack: 'launches', data: ccrLaunchesMapped, itemStyle: { color: '#8b5cf6' } },
      { name: 'RCR', type: 'bar', stack: 'launches', data: rcrLaunchesMapped, itemStyle: { color: '#3b82f6' } },
      { name: 'OCR', type: 'bar', stack: 'launches', data: ocrLaunchesMapped, itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] } }
    ]
  }

  // GDP / Unemployment Options
  const gdpXAxis = [...gdpData.map((d: any) => d.year), ...gdpForecast.map((d: any) => formatQVal(d.year, true))]
  const gdpDataMapped = [
    ...gdpData.map((d: any) => d.gdp),
    ...gdpForecast.map((d: any) => ({
      value: d.gdp,
      itemStyle: { color: d.gdp >= 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)', borderColor: d.gdp >= 0 ? '#10b981' : '#ef4444', borderWidth: 1.5, borderType: 'dashed', borderRadius: [4, 4, 0, 0] }
    }))
  ]
  const gdpOption = {
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis', formatter: '{b}: GDP growth {c}%' },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: gdpXAxis },
    yAxis: { ...chartTheme.yAxis, type: 'value', name: 'YoY (%)' },
    series: [{ name: 'GDP YoY', type: 'bar', data: gdpDataMapped, itemStyle: { color: (params: any) => params.value >= 0 ? '#10b981' : '#ef4444', borderRadius: [4, 4, 0, 0] }, barWidth: '40%' }]
  }

  const unemploymentXAxis = [...unemploymentData.map((d: any) => d.q), ...unemploymentForecast.map((d: any) => formatQVal(d.q, true))]
  const unemploymentHist = [...unemploymentData.map((d: any) => d.rate), ...unemploymentForecast.map(() => null)]
  const unemploymentFore = [...unemploymentData.map((d: any, idx: number) => idx === unemploymentData.length - 1 ? d.rate : null), ...unemploymentForecast.map((d: any) => d.rate)]
  const unemploymentOption = {
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis' },
    legend: { data: [t('investment.unemploymentRate') || 'Unemployment Rate', t('macro.forecastRate')], bottom: 0, textStyle: { color: '#9CA3AF' } },
    xAxis: { ...chartTheme.xAxis, type: 'category', data: unemploymentXAxis },
    yAxis: { ...chartTheme.yAxis, type: 'value', name: 'Rate (%)' },
    series: [
      { name: t('investment.unemploymentRate') || 'Unemployment Rate', type: 'line', data: unemploymentHist, itemStyle: { color: '#f59e0b' }, lineStyle: { width: 3 }, areaStyle: { opacity: 0.1 }, symbolSize: 6 },
      { name: t('macro.forecastRate'), type: 'line', data: unemploymentFore, itemStyle: { color: '#f59e0b' }, lineStyle: { width: 2.5, type: 'dashed' }, symbolSize: 5 }
    ]
  }

  // URA Pipeline
  const pipelineData = liveData?.data?.pipeline || { ccr: { immediate: 0, medium: 0 }, rcr: { immediate: 0, medium: 0 }, ocr: { immediate: 0, medium: 0 }, quarter: '' }
  const pipelineCategories = [t('land.ccr'), t('land.rcr'), t('land.ocr')]
  const pipelineOption = {
    ...chartTheme,
    tooltip: { ...chartTheme.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: [t('macro.shortTerm'), t('macro.mediumTerm')],
      bottom: 0,
      textStyle: { color: '#9CA3AF' }
    },
    xAxis: { ...chartTheme.xAxis, type: 'value', name: t('macro.units') },
    yAxis: { ...chartTheme.yAxis, type: 'category', data: pipelineCategories },
    series: [
      { name: t('macro.shortTerm'), type: 'bar', data: [pipelineData.ccr?.immediate || 0, pipelineData.rcr?.immediate || 0, pipelineData.ocr?.immediate || 0], itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] } },
      { name: t('macro.mediumTerm'), type: 'bar', data: [pipelineData.ccr?.medium || 0, pipelineData.rcr?.medium || 0, pipelineData.ocr?.medium || 0], itemStyle: { color: '#8b5cf6', borderRadius: [0, 4, 4, 0] } }
    ]
  }

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('macro.title')}</h1>
          <p className="text-gray-400 max-w-3xl leading-relaxed">{t('macro.subtitle')}</p>
        </div>
      </header>

      {/* Sync Status Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
            <Activity size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{t('macro.syncStatus')}</h3>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/20">Live Sync</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Clock size={12} /> {t('macro.lastRetrieve')}: <span className="text-gray-300">{liveData?.last_retrieve_date}</span></span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {t('macro.nextRetrieve')}: <span className="text-gray-300">{liveData?.next_retrieve_date}</span></span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => fetchData(true)}
          disabled={syncing}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-gray-750 text-white rounded-lg transition-all border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <RefreshCw size={18} className={syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          <span className="font-medium">{syncing ? t('macro.syncing') : t('macro.syncNow')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title={t('macro.chartPpi')} subtitle={t('macro.chartPpiSub')} option={ppiOption} />
        <ChartCard title={t('macro.chartHdb')} subtitle={t('macro.chartHdbSub')} option={hdbOption} />
        <ChartCard title={t('macro.chartUnsold')} subtitle={t('macro.chartUnsoldSub')} option={unsoldOption} />
        <ChartCard title={t('macro.chartLaunches')} subtitle={t('macro.chartLaunchesSub')} option={launchesOption} />
        <ChartCard title={t('macro.pipelineTitle')} subtitle={`${t('macro.pipelineSub')} (${pipelineData.quarter})`} option={pipelineOption} />

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
          <div className="p-5 border-b border-gray-800 flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white leading-tight">{t('macro.chartGdp')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{t('macro.chartGdpSub')}</p>
            </div>
            <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
              <button onClick={() => setActiveMacroTab('gdp')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeMacroTab === 'gdp' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>GDP YoY</button>
              <button onClick={() => setActiveMacroTab('unemployment')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeMacroTab === 'unemployment' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Unemployment</button>
            </div>
          </div>
          <div className="flex-1 p-5 min-h-[350px]">
             <ChartCard title="" option={activeMacroTab === 'gdp' ? gdpOption : unemploymentOption} />
          </div>
        </div>
      </div>
    </div>
  )
}
