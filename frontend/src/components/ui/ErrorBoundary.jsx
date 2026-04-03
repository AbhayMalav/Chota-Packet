import React from 'react'
import { XIcon } from './icons'


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
          <div className="text-4xl"><XIcon className="w-10 h-10 text-amber-400" /></div>

          <h2 className="text-theme text-lg font-semibold">
            Something went wrong
          </h2>

          <p className="text-muted text-sm">
            The application encountered an unexpected error.
            You can try to recover, or refresh the page if the problem persists.
          </p>

          {/* Dev-only error detail - hidden in production */}
          {import.meta.env.DEV && this.state.error && (
            <details className="text-left mt-2">
              <summary className="text-secondary text-xs cursor-pointer">
                Error detail (dev only)
              </summary>
              <pre className="bg-input text-muted mt-2 text-xs p-3 rounded-lg overflow-auto max-h-40">
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
