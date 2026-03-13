import './TokensAnalytics.css';

export default function TokensAnalytics({ stats }) {
  if (!stats || stats.totalPrompts === 0) return null;

  return (
    <section className="tokens-analytics">
      <h3 className="analytics-title">Tokens Saved Analytics</h3>
      <div className="analytics-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.totalTokensSaved.toLocaleString()}</span>
          <span className="stat-label">Tokens Saved</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">${stats.estimatedCostSaved}</span>
          <span className="stat-label">Cost Saved</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalPrompts}</span>
          <span className="stat-label">Prompts Improved</span>
        </div>
        <div className="stat-card accent">
          <span className="stat-value grade">{stats.grade}</span>
          <span className="stat-label">Efficiency ({stats.efficiencyScore}%)</span>
        </div>
      </div>
    </section>
  );
}
