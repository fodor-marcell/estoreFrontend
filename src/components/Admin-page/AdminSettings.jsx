import { useMemo, useState } from 'react'
import AdminLayout from './AdminLayout.jsx'
import '../../css/Admin-page/Settings.css'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../../services/settings.js'

function AdminSettings() {
    const [settings, setSettings] = useState(loadSettings)
    const [toast, setToast] = useState({ show: false, message: '', type: '' })

    const pushToast = (message, type = 'success') => {
        setToast({ show: true, message, type })
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 2500)
    }

    const hasChanges = useMemo(() => {
        try {
            const currentSaved = loadSettings()
            return JSON.stringify(currentSaved) !== JSON.stringify(settings)
        } catch {
            return true
        }
    }, [settings])

    const handleSave = () => {
        try {
            saveSettings(settings)
            pushToast('Settings saved', 'success')
        } catch {
            pushToast('Failed to save settings', 'error')
        }
    }

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS)
        pushToast('Reset to defaults (not saved yet)', 'success')
    }

    return (
        <AdminLayout>
            <div className="settings-content">
                {toast.show && (
                    <div className={`toast-notification ${toast.type}`}>
                        <span className="toast-message">{toast.message}</span>
                        <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
                    </div>
                )}

                <div className="settings-header">
                    <div>
                        <h1>Settings</h1>
                        <p>Store, order, and inventory preferences</p>
                    </div>
                    <div className="settings-actions">
                        <button className="settings-secondary" onClick={handleReset}>Reset</button>
                        <button className="settings-primary" onClick={handleSave} disabled={!hasChanges}>Save changes</button>
                    </div>
                </div>

                <div className="settings-grid">
                    <section className="settings-card">
                        <h2>Store</h2>

                        <div className="settings-row">
                            <label>Shop name</label>
                            <input
                                value={settings.shopName}
                                onChange={(e) => setSettings(s => ({ ...s, shopName: e.target.value }))}
                                placeholder="Your store name"
                            />
                        </div>

                        <div className="settings-row">
                            <label>Currency</label>
                            <select
                                value={settings.currency}
                                onChange={(e) => setSettings(s => ({ ...s, currency: e.target.value }))}
                            >
                                <option value="USD">USD</option>
                                <option value="HUF">HUF</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>

                        <p className="settings-hint">
                            (Currently used only for display formatting in the admin UI. You can later hook this up to a backend settings endpoint.)
                        </p>
                    </section>

                    <section className="settings-card">
                        <h2>Currency conversion</h2>

                        <div className="settings-row">
                            <label>Base currency</label>
                            <select
                                value={settings.baseCurrency || 'USD'}
                                onChange={(e) => setSettings(s => ({ ...s, baseCurrency: e.target.value }))}
                            >
                                <option value="USD">USD</option>
                            </select>
                            <span className="settings-sub">Prices coming from backend are treated as this currency.</span>
                        </div>

                        <div className="settings-row">
                            <label>USD → HUF rate</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={settings.exchangeRates?.HUF ?? 360}
                                onChange={(e) => setSettings(s => ({
                                    ...s,
                                    exchangeRates: { ...(s.exchangeRates || {}), HUF: Number(e.target.value) }
                                }))}
                            />
                        </div>

                        <div className="settings-row">
                            <label>USD → EUR rate</label>
                            <input
                                type="number"
                                min="0"
                                step="0.0001"
                                value={settings.exchangeRates?.EUR ?? 0.92}
                                onChange={(e) => setSettings(s => ({
                                    ...s,
                                    exchangeRates: { ...(s.exchangeRates || {}), EUR: Number(e.target.value) }
                                }))}
                            />
                        </div>

                        <p className="settings-hint">
                            Example: if 1 USD = 360 HUF, set HUF rate to 360.
                        </p>
                    </section>

                    <section className="settings-card">
                        <h2>Orders</h2>

                        <div className="settings-row">
                            <label>Default order status</label>
                            <select
                                value={settings.defaultOrderStatus}
                                onChange={(e) => setSettings(s => ({ ...s, defaultOrderStatus: e.target.value }))}
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="PROCESSING">PROCESSING</option>
                                <option value="SHIPPED">SHIPPED</option>
                                <option value="DELIVERED">DELIVERED</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                            </select>
                        </div>

                        <div className="settings-row settings-row-inline">
                            <div>
                                <label>Allow creating orders with out-of-stock products</label>
                                <span className="settings-sub">(Not recommended for normal usage)</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.enableOutOfStockPurchases}
                                onChange={(e) => setSettings(s => ({ ...s, enableOutOfStockPurchases: e.target.checked }))}
                            />
                        </div>
                    </section>

                    <section className="settings-card">
                        <h2>Inventory</h2>

                        <div className="settings-row">
                            <label>Low stock threshold</label>
                            <input
                                type="number"
                                min="0"
                                value={settings.lowStockThreshold}
                                onChange={(e) => setSettings(s => ({ ...s, lowStockThreshold: Number(e.target.value) }))}
                            />
                            <span className="settings-sub">Products below this stock can be highlighted later.</span>
                        </div>

                        <p className="settings-hint">
                            Next step: show a "Low stock" badge in Products and/or disable ordering.
                        </p>
                    </section>
                </div>
            </div>
        </AdminLayout>
    )
}

export default AdminSettings
