const KEY = 'psg_emergency_session'

export function checkEmergencyCredentials(email: string, password: string): boolean {
  const validEmail = import.meta.env.VITE_EMERGENCY_EMAIL
  const validPassword = import.meta.env.VITE_EMERGENCY_PASSWORD
  return !!validEmail && !!validPassword && email === validEmail && password === validPassword
}

export function setEmergencySession() {
  sessionStorage.setItem(KEY, '1')
}

export function clearEmergencySession() {
  sessionStorage.removeItem(KEY)
}

export function hasEmergencySession(): boolean {
  return sessionStorage.getItem(KEY) === '1'
}
