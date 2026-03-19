import './TokensAnalytics.css';

export default function TokensAnalytics({ stats }) {
  if (!stats || !stats.totalPrompts) return null;

  const totalTokensSaved = stats.totalTokensSaved || 0;
  const estimatedCostSaved = stats.estimatedCostSaved || 0;
  const totalPrompts = stats.totalPrompts || 0;
  const grade = stats.grade || 'N/A';
  const efficiencyScore = stats.efficiencyScore || 0;

  return (
    <section className="tokens-analytics">
      <h3 className="analytics-title">Tokens Saved Analytics</h3>
      <div className="analytics-grid">
        <div className="stat-card">
          <span className="stat-value">{totalTokensSaved.toLocaleString()}</span>
          <span className="stat-label">Tokens Saved</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">${estimatedCostSaved}</span>
          <span className="stat-label">Cost Saved</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalPrompts}</span>
          <span className="stat-label">Prompts Improved</span>
        </div>
        <div className="stat-card accent">
          <span className="stat-value grade">{grade}</span>
          <span className="stat-label">Efficiency ({efficiencyScore}%)</span>
        </div>
      </div>
    </section>
  );
}
