interface SecurityEvent {
  timestamp: Date;
  type: 'failed_login' | 'failed_registration' | 'suspicious_request' | 'rate_limit_exceeded' | 'attack_attempt';
  ip: string;
  userAgent?: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityAuditLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events in memory

  logEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    this.events.push(securityEvent);

    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console for development
    console.log(`[SECURITY] ${securityEvent.type.toUpperCase()}: ${securityEvent.details}`, {
      ip: securityEvent.ip,
      userAgent: securityEvent.userAgent,
      severity: securityEvent.severity,
      timestamp: securityEvent.timestamp
    });

    // In production, you would send this to a logging service
    // await sendToLoggingService(securityEvent);
  }

  logFailedLogin(ip: string, email: string, userAgent?: string) {
    this.logEvent({
      type: 'failed_login',
      ip,
      userAgent,
      details: `Failed login attempt for email: ${email}`,
      severity: 'medium'
    });
  }

  logFailedRegistration(ip: string, email: string, userAgent?: string) {
    this.logEvent({
      type: 'failed_registration',
      ip,
      userAgent,
      details: `Failed registration attempt for email: ${email}`,
      severity: 'medium'
    });
  }

  logSuspiciousRequest(ip: string, userAgent: string, details: string) {
    this.logEvent({
      type: 'suspicious_request',
      ip,
      userAgent,
      details,
      severity: 'high'
    });
  }

  logRateLimitExceeded(ip: string, endpoint: string, userAgent?: string) {
    this.logEvent({
      type: 'rate_limit_exceeded',
      ip,
      userAgent,
      details: `Rate limit exceeded for endpoint: ${endpoint}`,
      severity: 'medium'
    });
  }

  logAttackAttempt(ip: string, attackType: string, details: string, userAgent?: string) {
    this.logEvent({
      type: 'attack_attempt',
      ip,
      userAgent,
      details: `${attackType} attack attempt: ${details}`,
      severity: 'critical'
    });
  }

  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit).reverse();
  }

  getEventsByType(type: SecurityEvent['type']): SecurityEvent[] {
    return this.events.filter(event => event.type === type);
  }

  getEventsBySeverity(severity: SecurityEvent['severity']): SecurityEvent[] {
    return this.events.filter(event => event.severity === severity);
  }

  getEventsByIP(ip: string): SecurityEvent[] {
    return this.events.filter(event => event.ip === ip);
  }
}

export const securityLogger = new SecurityAuditLogger(); 