import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { ChartCard } from '../components/dashboard/ChartCard'
import { ANALYSIS_API_URL } from '../config/analysisApi'

export function LandIntelligencePage() {
  const { t, language } = useLanguage()
  const [data, setData] = useState<any>({ gls_history: [], launch_correlation: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${ANALYSIS_API_URL}/api/land-intelligence`)
      .then(res => res.json())
      .then(d => {
        if (d.gls_history) {
          setData(d)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching land intelligence:', err)
        setLoading(false)
      })
  }, [])

  const ccrLabel = t('land.ccr')
  const rcrLabel = t('land.rcr')
  const ocrLabel = t('land.ocr')

  const allYears = [...new Set(data.gls_history.map((d: any) => d.year))].sort()

  const timelineOption = {
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'axis',
      backgroundColor: '#111827',
      borderColor: '#374151',
      textStyle: { color: '#F3F4F6' }
    },
    legend: { 
      data: [ccrLabel, rcrLabel, ocrLabel],
      top: 10,
      textStyle: { color: '#9CA3AF' }
    },
    grid: { top: 70, bottom: 40, left: 60, right: 30 },
    xAxis: { 
      type: 'category', 
      data: allYears,
      axisLabel: { color: '#9CA3AF' },
      axisLine: { lineStyle: { color: '#374151' } }
    },
    yAxis: { 
      type: 'value', 
      name: t('land.pricePsfPpr'),
      nameTextStyle: { color: '#9CA3AF' },
      min: 600,
      axisLabel: { color: '#9CA3AF' },
      splitLine: { lineStyle: { color: '#1F2937' } }
    },
    series: ['CCR', 'RCR', 'OCR'].map(region => {
      const seriesData = allYears.map(year => {
        const entry = data.gls_history.find((d: any) => d.region === region && d.year === year)
        return entry ? entry.psf_ppr : null
      })

      const colors: any = { CCR: '#8B5CF6', RCR: '#3B82F6', OCR: '#10B981' }

      return {
        name: region === 'CCR' ? ccrLabel : region === 'RCR' ? rcrLabel : ocrLabel,
        type: 'line',
        data: seriesData,
        smooth: true,
        connectNulls: true,
        symbolSize: 8,
        itemStyle: { color: colors[region] },
        lineStyle: { width: 3 }
      }
    })
  }

  const correlationOption = {
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'axis',
      backgroundColor: '#111827',
      borderColor: '#374151',
      textStyle: { color: '#F3F4F6' }
    },
    legend: { 
      data: [t('land.landCostLabel'), t('land.launchPriceLabel')],
      top: 10,
      textStyle: { color: '#9CA3AF' }
    },
    grid: { top: 70, bottom: 40, left: 60, right: 30 },
    xAxis: { 
      type: 'category', 
      data: data.launch_correlation.map((d: any) => d.project_name),
      axisLabel: { 
        color: '#9CA3AF',
        rotate: 30,
        interval: 0,
        fontSize: 10
      },
      axisLine: { lineStyle: { color: '#374151' } }
    },
    yAxis: { 
      type: 'value', 
      name: t('land.pricePsf'),
      nameTextStyle: { color: '#9CA3AF' },
      axisLabel: { color: '#9CA3AF' },
      splitLine: { lineStyle: { color: '#1F2937' } }
    },
    series: [
      {
        name: t('land.landCostLabel'),
        type: 'bar',
        data: data.launch_correlation.map((d: any) => d.land_cost_psf_ppr),
        itemStyle: { 
          color: '#FBBF24',
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: t('land.launchPriceLabel'),
        type: 'bar',
        data: data.launch_correlation.map((d: any) => d.avg_price_psf),
        itemStyle: { 
          color: '#0EA5E9',
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">{t('nav.landIntelligence')}</h1>
        <p className="text-gray-400 max-w-3xl leading-relaxed">
          {t('land.description')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard 
          title={t('land.title1')}
          subtitle={t('land.sub1')}
          option={timelineOption}
          loading={loading}
        />
        <ChartCard 
          title={t('land.title2')}
          subtitle={t('land.sub2')}
          option={correlationOption}
          loading={loading}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">{t('land.caseStudyTitle')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950/50">
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('land.table.project')}</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('land.table.region')}</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('land.table.landCost')}</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('land.table.launchPrice')}</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">{t('land.table.spread')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.launch_correlation.slice(-8).reverse().map((row: any, i: number) => {
                const regText = row.region === 'CCR' ? ccrLabel : row.region === 'RCR' ? rcrLabel : ocrLabel
                return (
                  <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-white">{row.project_name}</td>
                    <td className="px-5 py-4 text-sm text-gray-400">
                      <span className="px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700">{regText}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400 font-mono">${row.land_cost_psf_ppr} psf ppr</td>
                    <td className="px-5 py-4 text-sm text-blue-400 font-bold font-mono">${row.avg_price_psf} psf</td>
                    <td className="px-5 py-4 text-sm text-white text-right font-medium">
                      {((row.avg_price_psf / row.land_cost_psf_ppr - 1) * 100).toFixed(0)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
