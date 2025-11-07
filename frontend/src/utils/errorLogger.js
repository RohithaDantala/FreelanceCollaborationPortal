// frontend/src/utils/errorLogger.js

class ErrorLogger {
  static log(error, context = {}) {
    const errorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🔴 Error logged:', errorInfo);
    }

    // In production, you could send to a logging service like Sentry
    // Example: Sentry.captureException(error, { extra: context });

    return errorInfo;
  }

  static logApiError(error, endpoint) {
    const apiError = {
      endpoint,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.response?.data?.message || error.message,
    };

    this.log(error, { type: 'API_ERROR', ...apiError });
    return apiError;
  }

  static logComponentError(error, componentName, props = {}) {
    const componentError = {
      componentName,
      props,
    };

    this.log(error, { type: 'COMPONENT_ERROR', ...componentError });
    return componentError;
  }
}

export default ErrorLogger;