import { useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, loadSettings } from '../services/settings.js'

// Fired when our app updates settings (same-tab). Other tabs trigger native 'storage' event.
export const SETTINGS_CHANGED_EVENT = 'adminSettingsChanged'

export default function useAdminSettings() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS)

    useEffect(() => {
        setSettings(loadSettings())

        const handleStorage = (e) => {
            if (e && e.key && e.key !== 'adminSettings') return
            setSettings(loadSettings())
        }

        const handleCustom = () => setSettings(loadSettings())

        window.addEventListener('storage', handleStorage)
        window.addEventListener(SETTINGS_CHANGED_EVENT, handleCustom)

        return () => {
            window.removeEventListener('storage', handleStorage)
            window.removeEventListener(SETTINGS_CHANGED_EVENT, handleCustom)
        }
    }, [])

    return settings
}

