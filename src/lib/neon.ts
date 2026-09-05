let isDbConnected = false;
let isChecking = false;

export async function checkNeonStatus(): Promise<boolean> {
  if (isChecking) return isDbConnected;
  isChecking = true;
  try {
    const res = await fetch('/api/db?action=ping');
    if (res.ok) {
      const data = await res.json();
      isDbConnected = Boolean(data.success && data.connected);
    } else {
      isDbConnected = false;
    }
  } catch {
    isDbConnected = false;
  } finally {
    isChecking = false;
  }
  return isDbConnected;
}

export function isNeonConfigured(): boolean {
  return isDbConnected;
}

// Initial status check
if (typeof window !== 'undefined') {
  checkNeonStatus();
  setInterval(checkNeonStatus, 15000);
}
