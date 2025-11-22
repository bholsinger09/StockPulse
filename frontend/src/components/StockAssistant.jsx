import React, { useState } from 'react';
import './StockAssistant.css';

const StockAssistant = () => {
  const [companies, setCompanies] = useState(['', '', '']);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompanyChange = (index, value) => {
    const newCompanies = [...companies];
    newCompanies[index] = value;
    setCompanies(newCompanies);
  };

  const handleAnalyze = async () => {
    // Filter out empty companies
    const validCompanies = companies.filter(c => c.trim() !== '');
    
    if (validCompanies.length === 0) {
      setError('Please enter at least one company name');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('http://stockpulse.duckdns.org:3001/api/analyze-stocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companies: validCompanies }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze stocks');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing stocks');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCompanies(['', '', '']);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="stock-assistant">
      <div className="assistant-header">
        <h2>🛒 Stock Shopping Assistant</h2>
        <p>Enter up to 3 companies you're interested in, and I'll help you make an informed decision</p>
      </div>

      <div className="company-inputs">
        {companies.map((company, index) => (
          <div key={index} className="input-group">
            <label>Company {index + 1}</label>
            <input
              type="text"
              placeholder="e.g., Apple, Tesla, Microsoft"
              value={company}
              onChange={(e) => handleCompanyChange(index, e.target.value)}
              disabled={loading}
            />
          </div>
        ))}
      </div>

      <div className="button-group">
        <button 
          className="analyze-btn" 
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? '🔄 Analyzing...' : '🔍 Analyze Stocks'}
        </button>
        <button 
          className="reset-btn" 
          onClick={handleReset}
          disabled={loading}
        >
          Reset
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️</span> {error}
        </div>
      )}

      {analysis && (
        <div className="analysis-results">
          <h3>📊 Analysis Results</h3>
          
          {analysis.companies && analysis.companies.map((company, index) => (
            <div key={index} className="company-analysis">
              <h4>{company.name}</h4>
              <div className="analysis-section">
                <h5>Overview</h5>
                <p>{company.overview}</p>
              </div>
              <div className="analysis-section">
                <h5>Strengths</h5>
                <ul>
                  {company.strengths?.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div className="analysis-section">
                <h5>Risks</h5>
                <ul>
                  {company.risks?.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {analysis.comparison && (
            <div className="comparison-section">
              <h4>📈 Comparative Analysis</h4>
              <p>{analysis.comparison}</p>
            </div>
          )}

          {analysis.recommendations && (
            <div className="recommendations-section">
              <h4>💡 Next Steps & Recommendations</h4>
              <ol>
                {analysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ol>
            </div>
          )}

          {analysis.disclaimer && (
            <div className="disclaimer">
              <p><em>{analysis.disclaimer}</em></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockAssistant;
