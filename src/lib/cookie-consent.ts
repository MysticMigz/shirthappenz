'use client';

export const getCookieConsent = (): 'accepted' | 'declined' | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cookieConsent') as 'accepted' | 'declined' | null;
};

export const setCookieConsent = (status: 'accepted' | 'declined'): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cookieConsent', status);
};

export const hasCookieConsent = (): boolean => {
  const consent = getCookieConsent();
  return consent === 'accepted';
};

export const canUseAnalytics = (): boolean => {
  return hasCookieConsent();
};

export const canUseFunctionalCookies = (): boolean => {
  return hasCookieConsent();
};

export const canUseEssentialCookies = (): boolean => {
  // Essential cookies are always allowed
  return true;
}; 