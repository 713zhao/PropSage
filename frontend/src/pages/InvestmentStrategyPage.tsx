import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { Search, Calculator, PieChart, Info, School, ShoppingBag, Train, TreePine, ArrowUpRight, TrendingDown, Home, Building2, Gavel, Landmark, BarChart3, Map as MapIcon, LineChart, ClipboardList, Lightbulb, TrendingUp, Calculator as CalcIcon, User, Pin, Bot } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import { ANALYSIS_API_URL } from '../config/analysisApi'

export function InvestmentStrategyPage() {
  const { t, language } = useLanguage()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // State for dynamic modeling
  const [project, setProject] = useState('Sunshine Plaza')
  const [price, setPrice] = useState(880000)
  const [area, setArea] = useState(592)
  const [rent, setRent] = useState(3600)
  const [maint, setMaintenance] = useState(350)
  const [status, setStatus] = useState('SC_1') // SC_1, SC_2, PR_1, Foreigner
  const [isHdb, setIsHdb] = useState(false)
  const [customRate, setCustomRate] = useState(4.0)
  const [downpaymentPct, setDownpaymentPct] = useState(25)
  const [amenities, setAmenities] = useState<any>({
    schools: ['St. Margaret Primary', 'Anglo-Chinese School (Junior)'],
    malls: ['Bugis Junction', 'Guoco Midtown'],
    transport: ['DT21 Rochor', 'EW12 Bugis'],
    environment: ['Fort Canning Park', 'Mount Elizabeth Hospital']
  })
  const [loading, setLoading] = useState(false)
  const [historyData, setHistoryData] = useState<any[]>([])

  // Heuristic mapping for amenities
  const getAmenitiesByTown = (locationInfo: string) => {
    const t = (locationInfo || '').toUpperCase()
    if (t.includes('BUKIT MERAH') || t.includes('HENDERSON') || t.includes('ALEXANDRA') || t.includes('TELOK BLANGAH')) return {
      schools: ['Gan Eng Seng Primary', 'Zhangde Primary', 'CHIJ Kellock'],
      malls: ['Tiong Bahru Plaza', 'Alexandra Central', 'Great World City'],
      transport: ['EW17 Tiong Bahru', 'EW18 Redhill'],
      environment: ['Telok Blangah Hill Park', 'Alexandra Hospital', 'Henderson Waves']
    }
    if (t.includes('ANG MO KIO') || t.includes('AMK')) return {
      schools: ['CHIJ St. Nicholas Girls', 'Anderson Primary', 'Mayflower Primary'],
      malls: ['AMK Hub', 'Djitsun Mall', 'Jubilee Square'],
      transport: ['NS16 Ang Mo Kio', 'TE6 Mayflower'],
      environment: ['Bishan-AMK Park', 'Ang Mo Kio Polyclinic']
    }
    if (t.includes('BUGIS') || t.includes('ROCHOR') || t.includes('BENAM') || t.includes('SUNSHINE') || t.includes('KAMPONG GLAM')) return {
      schools: ['St. Margaret Primary', 'Anglo-Chinese School (Junior)'],
      malls: ['Bugis Junction', 'Guoco Midtown', 'Bugis+'],
      transport: ['DT21 Rochor', 'EW12 Bugis'],
      environment: ['Fort Canning Park', 'Mount Elizabeth Hospital', 'National Museum']
    }
    if (t.includes('QUEENSTOWN') || t.includes('HOLLAND') || t.includes('CLEMENTI')) return {
      schools: ['Queenstown Primary', 'New Town Primary', 'Fairfield Methodist'],
      malls: ['Anchorpoint Shopping Centre', 'IKEA Alexandra', 'Holland Village'],
      transport: ['EW19 Queenstown', 'CC21 Holland Village'],
      environment: ['HortPark', 'National University Hospital', 'Singapore Botanic Gardens']
    }
    if (t.includes('BISHAN') || t.includes('MARYMOUNT') || t.includes('TOA PAYOH')) return {
      schools: ['Catholic High School', 'Ai Tong School', 'Kuo Chuan Presbyterian'],
      malls: ['Junction 8', 'Thomson Plaza'],
      transport: ['NS17/CC15 Bishan', 'CC16 Marymount'],
      environment: ['Bishan-AMK Park', 'Mount Alvernia Hospital']
    }
    if (t.includes('CENTRAL') || t.includes('ORCHARD') || t.includes('MARINA') || t.includes('NEWTON')) return {
      schools: ['River Valley Primary', 'Anglo-Chinese School (Junior)'],
      malls: ['ION Orchard', 'Marina Bay Sands', 'Paragon'],
      transport: ['NS22 Orchard', 'TE19 Shenton Way'],
      environment: ['Gardens by the Bay', 'Gleneagles Hospital']
    }
    if (t.includes('BEDOK') || t.includes('TAMPINES') || t.includes('PASIR RIS')) return {
      schools: ['Red Swastika School', 'Yu Neng Primary', 'St. Anthony\'s Canossian'],
      malls: ['Bedok Mall', 'Tampines Mall', 'White Sands'],
      transport: ['EW5 Bedok', 'DT35 Expo'],
      environment: ['East Coast Park', 'Changi General Hospital']
    }
    if (t.includes('JURONG') || t.includes('WEST') || t.includes('BOON LAY')) return {
      schools: ['Rulang Primary', 'Shuqun Primary', 'Nan Hua Primary'],
      malls: ['JEM', 'Westgate', 'IMM', 'Jurong Point'],
      transport: ['NS1 Jurong East', 'EW24 Jurong East'],
      environment: ['Jurong Lake Gardens', 'Ng Teng Fong General Hospital']
    }
    return {
      schools: ['Local Primary School (within 1km)', 'Preschool / Childcare'],
      malls: ['Nearby Neighborhood Centre', 'Supermarket (NTUC/Cold Storage)'],
      transport: ['Nearby MRT Station', 'Bus Interchange'],
      environment: ['Nearby Community Park', 'Polyclinic / Clinic']
    }
  }

  const [error, setError] = useState<string | null>(null)

  // ... (amenities logic remains same)

  // Mock database for common projects to ensure demo stability when backend is under-populated
  const KNOWLEDGE_BASE: Record<string, any> = {
    'KENTISH GREEN': {
      price: 1350000,
      size_sqft: 950,
      project: 'KENTISH GREEN',
      town: 'Farrer Park',
      history: [
        { year: '2017', psf: 1150 }, { year: '2018', psf: 1210 }, { year: '2019', psf: 1250 },
        { year: '2020', psf: 1280 }, { year: '2021', psf: 1350 }, { year: '2022', psf: 1420 },
        { year: '2023', psf: 1480 }, { year: '2024', psf: 1520 }, { year: '2025', psf: 1550 },
        { year: '2026', psf: 1580 }
      ]
    },
    'KENTISH COURT': {
      price: 1280000,
      size_sqft: 883,
      project: 'KENTISH COURT',
      town: 'Farrer Park',
      history: [
        { year: '2017', psf: 1100 }, { year: '2018', psf: 1150 }, { year: '2019', psf: 1180 },
        { year: '2020', psf: 1220 }, { year: '2021', psf: 1290 }, { year: '2022', psf: 1350 },
        { year: '2023', psf: 1410 }, { year: '2024', psf: 1450 }, { year: '2025', psf: 1480 },
        { year: '2026', psf: 1510 }
      ]
    },
    'SUNSHINE PLAZA': {
      price: 1150000,
      size_sqft: 721,
      project: 'SUNSHINE PLAZA',
      town: 'Bugis',
      history: [
        { year: '2017', psf: 1350 }, { year: '2018', psf: 1420 }, { year: '2019', psf: 1480 },
        { year: '2020', psf: 1510 }, { year: '2021', psf: 1580 }, { year: '2022', psf: 1650 },
        { year: '2023', psf: 1720 }, { year: '2024', psf: 1780 }, { year: '2025', psf: 1820 },
        { year: '2026', psf: 1850 }
      ]
    }
  }

  const fetchProjectData = async () => {
    if (!project || project.length < 2) return
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching data for project:', project)
      
      let match = null
      let newHistory: any[] = []

      // 1. Check local knowledge base first for common/demo properties
      const searchKey = project.toUpperCase().trim()
      const knownProject = Object.keys(KNOWLEDGE_BASE).find(k => k.includes(searchKey) || searchKey.includes(k))
      
      if (knownProject) {
        console.log('Found in local knowledge base:', knownProject)
        const kbData = KNOWLEDGE_BASE[knownProject]
        match = { 
          price: kbData.price, 
          size_sqft: kbData.size_sqft, 
          project: kbData.project, 
          town: kbData.town 
        }
        newHistory = kbData.history
      } else {
        // 2. Fallback to API search
        const res = await fetch(`${ANALYSIS_API_URL}/api/transactions?project=${encodeURIComponent(project)}&limit=100`)
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const transData = await res.json()
        
        if (Array.isArray(transData) && transData.length > 0) {
          match = transData[0]
          
          const yearlyStats: Record<string, { total: number, count: number }> = {}
          transData.forEach((t: any) => {
            let year = ''
            const dateStr = String(t.date || t.transaction_date || '')
            if (dateStr) {
              const parts = dateStr.split(' ')
              if (parts.length > 1 && !isNaN(parseInt(parts[1]))) year = parts[1]
              else if (dateStr.includes('-')) year = dateStr.split('-')[0]
              else if (dateStr.length === 4) year = dateStr
            }
            if (!year && t.year) year = String(t.year)
            
            const rawPrice = String(t.price || '').replace(/[$,]/g, '')
            const priceVal = Number(rawPrice)
            const rawSize = String(t.size_sqft || t.area || '').replace(/[$,]/g, '')
            const sizeVal = Number(rawSize) || 1000
            const psfVal = priceVal / sizeVal
            
            if (year && !isNaN(psfVal)) {
              if (!yearlyStats[year]) yearlyStats[year] = { total: 0, count: 0 }
              yearlyStats[year].total += psfVal
              yearlyStats[year].count += 1
            }
          })
          
          newHistory = Object.keys(yearlyStats)
            .sort()
            .map(y => ({
              year: y,
              psf: Math.round(yearlyStats[y].total / yearlyStats[y].count)
            }))
        }

        // 3. Supplement with live launches
        const launchRes = await fetch(`${ANALYSIS_API_URL}/api/launches-live`)
        if (launchRes.ok) {
          const launchData = await launchRes.json()
          if (Array.isArray(launchData)) {
            const found = launchData.find((l: any) => 
              (l.project_name || '').toLowerCase().includes(project.toLowerCase()) ||
              project.toLowerCase().includes((l.project_name || '').toLowerCase())
            )
            if (found) {
              if (!match) {
                match = {
                  price: found.avg_price_psf ? (found.avg_price_psf * 1000) : found.price,
                  size_sqft: 1000,
                  project: found.project_name,
                  town: found.region
                }
              }
              const yr = String(found.year || '2024')
              if (!newHistory.find(h => h.year === yr)) {
                newHistory.push({ year: yr, psf: found.avg_price_psf || 2500 })
                newHistory.sort((a, b) => a.year.localeCompare(b.year))
              }
            }
          }
        }
      }

      setHistoryData(newHistory)

      if (match) {
        const finalPrice = Number(match.price)
        const finalArea = Math.round(Number(match.size_sqft) || Number(match.area) || 1000)
        setPrice(finalPrice)
        setArea(finalArea)
        const projName = (match.project || match.project_name || '')
        setProject(projName)
        const isHdbProject = projName.includes('(') && projName.includes(')')
        setIsHdb(isHdbProject)
        setAmenities(getAmenitiesByTown(isHdbProject ? (match.town || '') : projName))
        
        if (isHdbProject) {
          setMaintenance(80)
          setRent(Math.round((finalPrice * 0.045) / 12))
        } else {
          setMaintenance(350)
          setRent(Math.round((finalPrice * 0.032) / 12))
        }
      } else {
        setError(`No property found matching "${project}". Please check the spelling or try a different name.`)
      }
    } catch (e: any) {
      console.error("Fetch failed", e)
      setError(`Connection failed: ${e.message}. Please try again later.`)
    } finally {
      setLoading(false)
    }
  }

  const getAbsdRate = () => {
    if (isHdb) return 0
    if (status === 'SC_1') return 0
    if (status === 'SC_2') return 0.20
    if (status === 'PR_1') return 0.05
    if (status === 'Foreigner') return 0.60
    return 0
  }

  const psfValue = (price / (area || 1)).toFixed(0)
  const bsd = price <= 1000000 ? (price * 0.03 - 5400) : (price * 0.04 - 15400)
  const absd = price * getAbsdRate()
  const legalFees = 3000
  const downpaymentAmount = price * (downpaymentPct / 100)
  const stampsAndFees = bsd + absd + legalFees
  const totalCashNeeded = downpaymentAmount + stampsAndFees
  const loan = price - downpaymentAmount
  const totalAssetValue = price + stampsAndFees
  const mandatoryCashPct = isHdb ? 25 : 5
  const mandatoryCash = price * (mandatoryCashPct / 100)
  const cpfOrCashBalance = downpaymentAmount - mandatoryCash

  const mRate = 0.035
  const pRate = 0.055
  const monthlyMortgage = (loan * mRate / 12) / (1 - Math.pow(1 + mRate / 12, -360))
  const stressMortgage = (loan * pRate / 12) / (1 - Math.pow(1 + pRate / 12, -360))
  const customMortgage = (loan * (customRate / 100) / 12) / (1 - Math.pow(1 + (customRate / 100) / 12, -360))
  
  const requiredIncome = (monthlyMortgage / 0.55)
  const stressIncome = (stressMortgage / 0.55)
  const customIncome = (customMortgage / 0.55)
  const customCashFlow = rent - customMortgage

  const estimatedAV = rent * 12 * 0.85
  let propTax = 0
  if (estimatedAV <= 30000) propTax = estimatedAV * 0.12
  else if (estimatedAV <= 45000) propTax = (30000 * 0.12) + (estimatedAV - 30000) * 0.20
  else if (estimatedAV <= 60000) propTax = (30000 * 0.12) + (15000 * 0.20) + (estimatedAV - 45000) * 0.28
  else propTax = (30000 * 0.12) + (15000 * 0.20) + (15000 * 0.28) + (estimatedAV - 60000) * 0.36

  const annualMaint = maint * 12
  const netIncome = (rent * 12) - annualMaint - propTax
  const yieldGross = ((rent * 12) / price * 100).toFixed(1)
  const yieldNet = (netIncome / price * 100).toFixed(1)
  const annualMortgage = customMortgage * 12
  const annualNetCashflow = (rent * 12) - annualMaint - propTax - annualMortgage
  const cashOnCash = (annualNetCashflow / totalCashNeeded * 100).toFixed(1)

  const historyOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: '{b}: ${c} psf' },
    grid: { left: '3%', right: '10%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: Array.from({ length: 10 }, (_, i) => String(2026 - 9 + i)), // 2017 - 2026
      axisLabel: { color: '#9CA3AF', fontSize: 10 },
      axisLine: { lineStyle: { color: '#374151' } }
    },
    yAxis: { 
      type: 'value', 
      name: 'PSF ($)',
      nameTextStyle: { color: '#9CA3AF', fontSize: 10 },
      splitLine: { lineStyle: { type: 'dashed', color: '#1F2937' } }, 
      axisLabel: { color: '#9CA3AF', fontSize: 10 },
      min: (value: any) => value.min > 0 ? Math.floor(value.min * 0.9) : 0
    },
    series: [
      {
        name: 'Avg PSF',
        type: 'line',
        smooth: true,
        data: Array.from({ length: 10 }, (_, i) => {
          const year = String(2026 - 9 + i)
          const found = historyData.find(h => h.year === year)
          return found ? found.psf : null
        }),
        connectNulls: true,
        itemStyle: { color: '#60A5FA' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(96, 165, 250, 0.2)' }, { offset: 1, color: 'rgba(96, 165, 250, 0)' }]
          }
        },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  }

  const comparisonOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '15%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#1F2937' } }, axisLabel: { color: '#9CA3AF' } },
    yAxis: { 
      type: 'category', 
      data: [t('investment.districtFreehold'), t('investment.nearbyCompetitor'), project.split('(')[0].trim() + ' (' + t('investment.target') + ')'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9CA3AF' }
    },
    series: [
      {
        type: 'bar',
        barWidth: '60%',
        data: [
          { value: 2100, itemStyle: { color: '#4B5563' } },
          { value: 1820, itemStyle: { color: '#374151' } },
          { value: Number(psfValue), itemStyle: { color: '#3B82F6' } }
        ],
        label: { show: true, position: 'right', formatter: '${c}', color: '#F3F4F6' }
      }
    ]
  }

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('investment.title')}</h1>
          <p className="text-gray-500 text-sm">{t('investment.reportDate')}: {mounted ? new Date().toLocaleDateString() : '--'}</p>
        </div>
        <div className="relative w-full md:w-96 flex">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="block w-full pl-10 pr-24 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('investment.searchPlaceholder')}
            onKeyDown={(e) => e.key === 'Enter' && fetchProjectData()}
          />
          <button onClick={fetchProjectData} disabled={loading} className="absolute right-1.5 top-1.5 px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50">
            {loading ? '...' : t('investment.fetch')}
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 animate-in slide-in-from-top-2">
          <Info size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">{t('investment.purchasePrice')}</label>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">{t('investment.area')}</label>
            <input type="number" value={area} onChange={(e) => setArea(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">{t('investment.monthlyRent')}</label>
            <input type="number" value={rent} onChange={(e) => setRent(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">{t('investment.status')}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:ring-1 focus:ring-blue-500">
              <option value="SC_1">{t('investment.status.sc1')}</option>
              <option value="SC_2">{t('investment.status.sc2')}</option>
              <option value="PR_1">{t('investment.status.pr1')}</option>
              <option value="Foreigner">{t('investment.status.foreigner')}</option>
            </select>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">{t('investment.phase2')}</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
              <div className="p-5 border-b border-gray-800">
                <h3 className="text-md font-semibold text-white">{t('investment.acquisitionBreakdown')}</h3>
              </div>
              <div className="p-5 space-y-6">
                <table className="w-full text-sm text-left">
                  <thead className="text-gray-500 border-b border-gray-800">
                    <tr><th className="pb-2 font-medium">{t('investment.item')}</th><th className="pb-2 text-right font-medium">{t('investment.amount')}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    <tr className="text-gray-300"><td className="py-3">{t('investment.purchasePrice')}</td><td className="py-3 text-right font-mono">${price.toLocaleString()}</td></tr>
                    <tr className="text-gray-300"><td className="py-3">{t('investment.bsd')}</td><td className="py-3 text-right font-mono">${bsd.toLocaleString()}</td></tr>
                    <tr className="text-gray-300"><td className="py-3">{t('investment.absd')} ({(getAbsdRate()*100).toFixed(0)}%)</td><td className={`py-3 text-right font-mono ${absd > 0 ? 'text-red-400' : 'text-emerald-400'}`}>${absd.toLocaleString()}</td></tr>
                    <tr className="text-gray-300"><td className="py-3">{t('investment.legalFees')}</td><td className="py-3 text-right font-mono">~${legalFees.toLocaleString()}</td></tr>
                    <tr className="text-white font-bold bg-emerald-500/5"><td className="py-3 px-2">{t('investment.grossAssetValue')}</td><td className="py-3 px-2 text-right font-mono text-emerald-400">~${totalAssetValue.toLocaleString()}</td></tr>
                  </tbody>
                </table>

                <div className="space-y-4 pt-2">
                   <div className="flex justify-between items-center text-xs">
                      <label className="text-gray-400 font-medium">{t('investment.adjustDownpayment')}</label>
                      <span className="text-blue-400 font-bold">{downpaymentPct}%</span>
                   </div>
                   <input type="range" min="25" max="100" step="5" value={downpaymentPct} onChange={(e) => setDownpaymentPct(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                   
                   <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-500 w-24 shrink-0 uppercase tracking-tighter">{t('investment.cashMin')} {mandatoryCashPct}%</span>
                        <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                           <div className="h-full bg-red-500/80" style={{width: `${mandatoryCashPct}%`}}></div>
                        </div>
                        <span className="text-xs text-gray-400 font-mono w-20 text-right">${mandatoryCash.toLocaleString()}</span>
                      </div>
                      {cpfOrCashBalance > 0 && (
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-gray-500 w-24 shrink-0 uppercase tracking-tighter">{t('investment.cpfCash')}</span>
                          <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500/80" style={{width: `${(cpfOrCashBalance/price)*100}%`}}></div>
                          </div>
                          <span className="text-xs text-gray-400 font-mono w-20 text-right">${cpfOrCashBalance.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-500 w-24 shrink-0 uppercase tracking-tighter">{t('investment.maxLoan')} {100-downpaymentPct}%</span>
                        <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500/80" style={{width: `${100-downpaymentPct}%`}}></div>
                        </div>
                        <span className="text-xs text-gray-400 font-mono w-20 text-right">${loan.toLocaleString()}</span>
                      </div>
                   </div>

                   <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                      <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <span className="text-gray-300 font-medium">{t('investment.totalNeeded')}: </span>
                        <span className="text-white font-bold font-mono">${totalCashNeeded.toLocaleString()}</span>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase">({t('investment.incl')} {downpaymentPct}% {t('investment.downpayment')} + {t('investment.fees')})</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
              <div className="p-5 border-b border-gray-800">
                <h3 className="text-md font-semibold text-white">{t('investment.mortgageStress')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('investment.loan')} ${loan.toLocaleString()} · 30 {t('investment.years')}</p>
              </div>
              <div className="p-5 space-y-6">
                <table className="w-full text-sm text-left">
                  <thead className="text-gray-500 border-b border-gray-800">
                    <tr><th className="pb-2 font-medium">{t('investment.rate')}</th><th className="pb-2 text-right font-medium">{t('investment.installment')}</th><th className="pb-2 text-right font-medium">{t('investment.reqIncome')}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    <tr className="text-gray-300"><td className="py-3">3.5% ({t('investment.current')})</td><td className="py-3 text-right font-mono">${monthlyMortgage.toFixed(0)}</td><td className="py-3 text-right font-mono text-emerald-400">~${requiredIncome.toFixed(0)}</td></tr>
                    <tr className="bg-amber-500/5 text-gray-300 font-bold"><td className="py-3 px-2">5.5% ({t('investment.stress')})</td><td className="py-3 px-2 text-right font-mono">${stressMortgage.toFixed(0)}</td><td className="py-3 px-2 text-right font-mono text-amber-500">~${stressIncome.toFixed(0)}</td></tr>
                    <tr className="bg-blue-500/5 text-gray-300 font-bold"><td className="py-3 px-2">{customRate}% ({t('investment.custom')})</td><td className="py-3 px-2 text-right font-mono">${customMortgage.toFixed(0)}</td><td className="py-3 px-2 text-right font-mono text-blue-400">~${customIncome.toFixed(0)}</td></tr>
                  </tbody>
                </table>

                <div className="space-y-4 pt-2">
                   <div className="flex justify-between items-center text-xs">
                      <label className="text-gray-400 font-medium">{t('investment.adjustRate')}</label>
                      <span className="text-blue-400 font-bold">{customRate}%</span>
                   </div>
                   <input type="range" min="0.1" max="10" step="0.1" value={customRate} onChange={(e) => setCustomRate(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                   
                   <div className={`p-4 rounded-lg flex items-center justify-between border ${customCashFlow >= 0 ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
                      <div className="flex items-center gap-2">
                        {customCashFlow >= 0 ? <ArrowUpRight size={18} /> : <TrendingDown size={18} />}
                        <span className="text-sm font-bold uppercase tracking-wider">{customCashFlow >= 0 ? t('investment.positiveCashflow') : t('investment.negativeCashflow')}</span>
                      </div>
                      <span className="text-xs font-medium uppercase tracking-tighter opacity-70">{t('investment.rent')} ${rent} {customCashFlow >= 0 ? '>' : '<'} {t('investment.installment')} ${customMortgage.toFixed(0)}</span>
                   </div>

                   <div className="bg-gray-800/50 rounded-xl p-5 space-y-4 border border-gray-700/50">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('investment.yieldAnalysis')}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-500 uppercase tracking-tight">{t('investment.annualMaint')}</span>
                          <p className="text-sm text-gray-300 font-mono font-bold">${annualMaint.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-500 uppercase tracking-tight">{t('investment.annualTax')}</span>
                            <Info size={10} className="text-gray-600" />
                          </div>
                          <p className="text-sm text-gray-300 font-mono font-bold">${propTax.toFixed(0).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between group">
                          <span className="text-xs text-gray-400">{t('investment.grossYield')}</span>
                          <div className="flex items-center gap-3 w-48">
                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-gray-500" style={{width: `${yieldGross}%`}}></div>
                            </div>
                            <span className="text-xs text-gray-300 font-mono font-bold w-10 text-right">{yieldGross}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between group">
                          <span className="text-xs text-gray-400">{t('investment.netYield')}</span>
                          <div className="flex items-center gap-3 w-48">
                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-gray-500" style={{width: `${yieldNet}%`}}></div>
                            </div>
                            <span className="text-xs text-gray-300 font-mono font-bold w-10 text-right">{yieldNet}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between group">
                          <span className="text-xs text-emerald-400 font-bold">{t('investment.cashOnCash')} ★</span>
                          <div className="flex items-center gap-3 w-48">
                            <div className="flex-1 h-2.5 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" style={{width: `${cashOnCash}%`}}></div>
                            </div>
                            <span className="text-xs text-emerald-400 font-mono font-bold w-10 text-right">{cashOnCash}%</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 italic leading-tight">{t('investment.yieldNote')}</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">{t('investment.phase3')}</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
             <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="text-md font-semibold text-white">Historical Price Trend (10 Years)</h3>
                      <p className="text-xs text-gray-500 mt-1">Average annual PSF price movement</p>
                   </div>
                   <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded border border-emerald-500/20">Growth Index</span>
                </div>
                <div className="h-[250px] w-full">
                   {historyData.length > 0 ? (
                      <ReactECharts option={historyOption} style={{height: '100%', width: '100%'}} />
                   ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-600 text-sm italic border border-dashed border-gray-800 rounded-lg">
                         No historical data available for this project
                      </div>
                   )}
                </div>
             </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg space-y-4">
               <div className="flex justify-between items-start">
                  <div>
                     <h3 className="text-md font-semibold text-white">{t('investment.psfComparison')}</h3>
                     <p className="text-xs text-gray-500 mt-1">{t('investment.basedOnUra')}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded border border-blue-500/20">{t('investment.fairValue')}</span>
               </div>
               <div className="h-[250px] w-full">
                  <ReactECharts option={comparisonOption} style={{height: '100%', width: '100%'}} />
               </div>
               <div className="bg-gray-800/50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-sm font-bold text-white mb-1">{t('investment.targetPrice')}: <span className="text-blue-400 font-mono">${psfValue}/sqft</span></p>
                  <p className="text-xs text-gray-400 leading-relaxed">{t('investment.comparisonNote')}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg space-y-6">
                  <h3 className="text-md font-semibold text-white">{t('investment.locationScore')}</h3>
                  <div className="space-y-4">
                     {[
                        { label: t('investment.mrtAccess'), score: 95, color: 'bg-emerald-500' },
                        { label: t('investment.amenities'), score: 90, color: 'bg-emerald-500' },
                        { label: t('investment.potential'), score: 72, color: 'bg-blue-500' },
                        { label: t('investment.healthGreen'), score: 85, color: 'bg-emerald-500' },
                        { label: t('investment.overall'), score: 78, color: 'bg-gray-300', isTotal: true }
                     ].map((item, idx) => (
                        <div key={idx} className="space-y-2">
                           <div className="flex justify-between items-center text-xs">
                              <span className={`${item.isTotal ? 'font-bold text-white' : 'text-gray-400'}`}>{item.label}</span>
                              <span className={`${item.isTotal ? 'text-white' : 'text-gray-300'} font-bold`}>{item.score}/100</span>
                           </div>
                           <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div className={`h-full ${item.color}`} style={{width: `${item.score}%`}}></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg space-y-6">
                  <h3 className="text-md font-semibold text-white">{t('investment.nearbyResources')}</h3>
                  <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin scrollbar-thumb-gray-800">
                     {[
                        { icon: School, label: t('investment.topSchools'), items: amenities.schools },
                        { icon: ShoppingBag, label: t('investment.shoppingMalls'), items: amenities.malls },
                        { icon: Train, label: t('investment.transportHubs'), items: amenities.transport },
                        { icon: TreePine, label: t('investment.envLifestyle'), items: amenities.environment }
                     ].map((group, idx) => (
                        <div key={idx} className="space-y-2">
                           <div className="flex items-center gap-2 text-blue-400">
                              <group.icon size={16} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">{group.label}</span>
                           </div>
                           <ul className="pl-6 space-y-1">
                              {group.items.map((item: string, i: number) => (
                                 <li key={i} className="text-xs text-gray-400 list-disc">{item}</li>
                              ))}
                           </ul>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
