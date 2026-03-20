import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
    this.resetError = this.resetError.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo)

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    } else if (import.meta.env.DEV) {
      console.warn(
        '[ErrorBoundary] No onError prop provided. ' +
        'Consider wiring up an error reporting service before going to production.'
      )
    }
  }

  resetError() {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="text-4xl">⚠️</div>

          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
            Something went wrong
          </h2>

          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            The application encountered an unexpected error.
            You can try to recover, or refresh the page if the problem persists.
          </p>

          {/* Dev-only error detail — hidden in production */}
          {import.meta.env.DEV && this.state.error && (
            <details className="text-left mt-2">
              <summary
                className="text-xs cursor-pointer"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                Error detail (dev only)
              </summary>
              <pre
                className="mt-2 text-xs p-3 rounded-lg overflow-auto max-h-40"
                style={{
                  background: 'var(--theme-input-bg)',
                  color: 'var(--theme-text-muted)',
                }}
              >
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}

          <div className="flex gap-3 justify-center pt-2">
            <button className="btn-secondary" onClick={this.resetError}>
              Try Again
            </button>
            <button className="btn-ghost" onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    )
  }
}
