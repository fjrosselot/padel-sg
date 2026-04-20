const KEY = 'psg_emergency_session'

export const IS_EMERGENCY_TOKEN = (input: string) =>
  import.meta.env.VITE_EMERGENCY_TOKEN && input === import.meta.env.VITE_EMERGENCY_TOKEN

export function setEmergencySession() {
  sessionStorage.setItem(KEY, '1')
}

export function clearEmergencySession() {
  sessionStorage.removeItem(KEY)
}

export function hasEmergencySession(): boolean {
  return sessionStorage.getItem(KEY) === '1'
}
