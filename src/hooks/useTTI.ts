import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { TTIRecorder, getTTIRecorder, resetTTIRecorder } from '../lib/tti-recorder';
import { TTIUtils } from '../lib/tti-utils';

export interface UseTTIOptions {
  traceId?: string;
  sessionId?: string;
  userId?: string;
  route?: string;
  component?: string;
  enableWebVitals?: boolean;
  enablePageLoad?: boolean;
  enableUserInteractions?: boolean;
  enableRouteChanges?: boolean;
  enableErrorTracking?: boolean;
  enableResourceTracking?: boolean;
  autoFlush?: boolean;
  flushInterval?: number;
}

export interface TTIState {
  traceId: string;
  sessionId: string;
  isRecording: boolean;
  metrics: Record<string, number>;
  events: Array<{
    type: string;
    name: string;
    timestamp: Date;
    duration?: number;
  }>;
}

export function useTTI(options: UseTTIOptions = {}): TTIState {
  const router = useRouter();
  const recorderRef = useRef<TTIRecorder | null>(null);
  const [state, setState] = useState<TTIState>({
    traceId: '',
    sessionId: '',
    isRecording: false,
    metrics: {},
    events: [],
  });

  const {
    traceId: providedTraceId,
    sessionId: providedSessionId,
    userId,
    route,
    component,
    enableWebVitals = true,
    enablePageLoad = true,
    enableUserInteractions = true,
    enableRouteChanges = true,
    enableErrorTracking = true,
    enableResourceTracking = true,
    autoFlush = true,
    flushInterval = 30000, // 30 seconds
  } = options;

  // Initialize recorder
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const recorder = getTTIRecorder({
      traceId: providedTraceId,
      sessionId: providedSessionId,
      userId,
      route: route || router.asPath,
      component,
    });

    recorderRef.current = recorder;

    // Create session
    const createSession = async () => {
      const userContext = TTIUtils.parseUserContext(
        undefined, // IP will be handled server-side
        navigator.userAgent,
        document.referrer,
        window.location.href
      );

      await recorder.createSession(userContext);
      
      setState(prev => ({
        ...prev,
        traceId: recorder.getTraceId(),
        sessionId: recorder.getSessionId(),
        isRecording: true,
      }));
    };

    createSession();

    return () => {
      if (autoFlush && recorderRef.current) {
        recorderRef.current.flush();
      }
    };
  }, [providedTraceId, providedSessionId, userId, route, component, router.asPath, autoFlush]);

  // Web Vitals tracking
  useEffect(() => {
    if (!enableWebVitals || !recorderRef.current || typeof window === 'undefined') return;

    const recorder = recorderRef.current;
    recorder.recordWebVitals();
  }, [enableWebVitals]);

  // Page load tracking
  useEffect(() => {
    if (!enablePageLoad || !recorderRef.current || typeof window === 'undefined') return;

    const recorder = recorderRef.current;
    
    const handleLoad = () => {
      recorder.recordPageLoad();
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [enablePageLoad]);

  // Route change tracking
  useEffect(() => {
    if (!enableRouteChanges || !recorderRef.current) return;

    const recorder = recorderRef.current;
    let previousRoute = router.asPath;

    const handleRouteChange = (url: string) => {
      const duration = Date.now() - (window as any).__tti_route_start || 0;
      recorder.recordRouteChange(previousRoute, url, duration);
      previousRoute = url;
      (window as any).__tti_route_start = Date.now();
    };

    const handleRouteChangeStart = () => {
      (window as any).__tti_route_start = Date.now();
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [enableRouteChanges, router]);

  // Error tracking
  useEffect(() => {
    if (!enableErrorTracking || !recorderRef.current || typeof window === 'undefined') return;

    const recorder = recorderRef.current;

    const handleError = (event: ErrorEvent) => {
      recorder.recordError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      recorder.recordError(new Error(event.reason), {
        type: 'unhandledrejection',
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enableErrorTracking]);

  // Resource loading tracking
  useEffect(() => {
    if (!enableResourceTracking || !recorderRef.current || typeof window === 'undefined') return;

    const recorder = recorderRef.current;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          recorder.recordResourceLoad(
            resourceEntry.name,
            resourceEntry.initiatorType,
            resourceEntry.duration,
            resourceEntry.transferSize
          );
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, [enableResourceTracking]);

  // Auto-flush interval
  useEffect(() => {
    if (!autoFlush || !recorderRef.current) return;

    const interval = setInterval(() => {
      if (recorderRef.current) {
        recorderRef.current.flush();
      }
    }, flushInterval);

    return () => clearInterval(interval);
  }, [autoFlush, flushInterval]);

  // User interaction tracking
  useEffect(() => {
    if (!enableUserInteractions || !recorderRef.current || typeof window === 'undefined') return;

    const recorder = recorderRef.current;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const className = target.className || '';
      const id = target.id || '';
      
      recorder.recordUserInteraction('click', `${tagName}${id ? `#${id}` : ''}${className ? `.${className.split(' ')[0]}` : ''}`);
    };

    const handleInput = (event: Event) => {
      const target = event.target as HTMLElement;
      recorder.recordUserInteraction('input', target.tagName.toLowerCase());
    };

    const handleScroll = () => {
      recorder.recordUserInteraction('scroll');
    };

    document.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('input', handleInput, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('input', handleInput);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [enableUserInteractions]);

  return state;
}

// Hook for manual TTI recording
export function useTTIRecorder() {
  const recorderRef = useRef<TTIRecorder | null>(null);

  const recordEvent = useCallback((
    eventType: string,
    eventName: string,
    duration?: number,
    metadata?: Record<string, any>
  ) => {
    if (recorderRef.current) {
      recorderRef.current.recordEvent(eventType, eventName, duration, metadata);
    }
  }, []);

  const recordMetric = useCallback((
    metricName: string,
    metricValue: number,
    unit?: string,
    metadata?: Record<string, any>
  ) => {
    if (recorderRef.current) {
      recorderRef.current.recordMetric(metricName, metricValue, unit, metadata);
    }
  }, []);

  const mark = useCallback((name: string) => {
    if (recorderRef.current) {
      recorderRef.current.mark(name);
    }
  }, []);

  const measure = useCallback((name: string, startMark?: string) => {
    if (recorderRef.current) {
      return recorderRef.current.measure(name, startMark);
    }
    return 0;
  }, []);

  const flush = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.flush();
    }
  }, []);

  const getTraceId = useCallback(() => {
    return recorderRef.current?.getTraceId() || '';
  }, []);

  const getSessionId = useCallback(() => {
    return recorderRef.current?.getSessionId() || '';
  }, []);

  return {
    recordEvent,
    recordMetric,
    mark,
    measure,
    flush,
    getTraceId,
    getSessionId,
    setRecorder: (recorder: TTIRecorder) => {
      recorderRef.current = recorder;
    },
  };
}

// Hook for component performance tracking
export function useTTIComponent(componentName: string, options: UseTTIOptions = {}) {
  const { recordEvent, recordMetric, mark, measure } = useTTIRecorder();
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    mountTimeRef.current = performance.now();
    mark(`${componentName}_mount_start`);

    return () => {
      const unmountTime = performance.now();
      const duration = unmountTime - mountTimeRef.current;
      
      recordEvent('component_unmount', componentName, duration);
      recordMetric('component_lifetime', duration, 'ms', { component: componentName });
    };
  }, [componentName, recordEvent, recordMetric, mark]);

  const trackRender = useCallback((renderType: string = 'render') => {
    mark(`${componentName}_${renderType}_start`);
    
    return () => {
      const duration = measure(`${componentName}_${renderType}_start`);
      recordEvent('component_render', `${componentName}_${renderType}`, duration);
      recordMetric('component_render_time', duration, 'ms', { 
        component: componentName, 
        renderType 
      });
    };
  }, [componentName, mark, measure, recordEvent, recordMetric]);

  const trackInteraction = useCallback((
    interactionType: string,
    target?: string,
    metadata?: Record<string, any>
  ) => {
    recordEvent('component_interaction', interactionType, undefined, {
      component: componentName,
      target,
      ...metadata,
    });
  }, [componentName, recordEvent]);

  return {
    trackRender,
    trackInteraction,
    mark: (name: string) => mark(`${componentName}_${name}`),
    measure: (name: string, startMark?: string) => measure(`${componentName}_${name}`, startMark),
  };
}

// Hook for API call tracking
export function useTTIAPI() {
  const { recordEvent, recordMetric } = useTTIRecorder();

  const trackAPICall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    url: string,
    method: string = 'GET',
    metadata?: Record<string, any>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      recordEvent('api_call', `${method} ${url}`, duration, {
        url,
        method,
        status: 200,
        ...metadata,
      });
      
      recordMetric('api_response_time', duration, 'ms', {
        url,
        method,
        status: 200,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      recordEvent('api_error', `${method} ${url}`, duration, {
        url,
        method,
        error: error instanceof Error ? error.message : String(error),
        ...metadata,
      });
      
      throw error;
    }
  }, [recordEvent, recordMetric]);

  return { trackAPICall };
}

// Utility function to reset TTI recorder (useful for testing)
export function resetTTI() {
  resetTTIRecorder();
}
