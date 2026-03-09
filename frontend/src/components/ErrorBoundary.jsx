import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-500/20 bg-black/40 p-6 flex flex-col gap-3 text-center my-6 shadow-xl w-full max-w-lg mx-auto">
          <div className="text-3xl mb-1">⚠️</div>
          <h2 className="text-xl font-bold text-red-500">Something went wrong</h2>
          <p className="text-gray-400 text-sm">
            The application encountered an unexpected error. Please refresh the page to continue.
          </p>
          <button
            className="mt-3 mx-auto px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-bold rounded-lg border border-red-500/30 transition-all"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
