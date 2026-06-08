const STORAGE_KEY = 'adminSettings'

export const SETTINGS_CHANGED_EVENT = 'adminSettingsChanged'

export const DEFAULT_SETTINGS = {
    shopName: 'E-Store',
    currency: 'USD',
    // Base currency the backend uses for prices/amounts.
    baseCurrency: 'USD',
    // Exchange rates are expressed as: 1 baseCurrency = rate targetCurrency
    exchangeRates: {
        HUF: 360,
        EUR: 0.92
    },
    lowStockThreshold: 5,
    defaultOrderStatus: 'PENDING',
    enableOutOfStockPurchases: false
}

export const loadSettings = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return DEFAULT_SETTINGS
        const parsed = JSON.parse(raw)
        return { ...DEFAULT_SETTINGS, ...parsed, exchangeRates: { ...DEFAULT_SETTINGS.exchangeRates, ...(parsed.exchangeRates || {}) } }
    } catch {
        return DEFAULT_SETTINGS
    }
}

export const saveSettings = (settings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT))
}

export const resetSettings = () => {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT))
}

export const convertAmount = (amount, settingsOrCurrency, maybeCurrency) => {
    const n = Number(amount)
    if (!Number.isFinite(n)) return 0

    // Support (amount, settings) OR (amount, settings, currency)
    const settings = typeof settingsOrCurrency === 'object'
        ? settingsOrCurrency
        : loadSettings()

    const targetCurrency = typeof settingsOrCurrency === 'string'
        ? settingsOrCurrency
        : (maybeCurrency || settings.currency || 'USD')

    const base = settings.baseCurrency || 'USD'
    if (targetCurrency === base) return n

    const rate = settings.exchangeRates?.[targetCurrency]
    if (!rate) return n

    return n * Number(rate)
}

export const formatMoney = (amount, currencyOrSettings = 'USD') => {
    const settings = typeof currencyOrSettings === 'object' ? currencyOrSettings : loadSettings()
    const currency = typeof currencyOrSettings === 'string' ? currencyOrSettings : (settings.currency || 'USD')

    const converted = convertAmount(amount, settings, currency)

    if (currency === 'HUF') {
        return `${Math.round(converted).toLocaleString()} Ft`
    }

    const symbol = currency === 'EUR' ? '€' : '$'
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
