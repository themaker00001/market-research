import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
};

const LoadingScreen = ({ companyName }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl animate-fade-in-up">
    <div className="animate-spin-slow w-16 h-16 border-4 border-t-4 border-blue-500 dark:border-blue-400 border-opacity-20 rounded-full mb-4">
      <div className="absolute w-12 h-12 m-2 border-4 border-t-4 border-blue-500 dark:border-blue-400 border-opacity-75 rounded-full"></div>
    </div>
    <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
      Gathering market data for <span className="text-blue-600 dark:text-blue-400">{companyName}</span>...
    </p>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
      This might take a moment.
    </p>
  </div>
);

const App = () => {
  const [companyName, setCompanyName] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const jsonSchema = {
    type: "OBJECT",
    properties: {
      "companyName": { "type": "STRING" },
      "marketStanding": { "type": "STRING" },
      "topRivals": { "type": "ARRAY", "items": { "type": "STRING" } },
      "majorProducts": {
        "type": "ARRAY",
        "items": {
          "type": "OBJECT",
          "properties": {
            "productName": { "type": "STRING" },
            "features": { "type": "ARRAY", "items": { "type": "STRING" } }
          }
        }
      },
      "marketShare": {
        "type": "ARRAY",
        "items": {
          "type": "OBJECT",
          "properties": {
            "name": { "type": "STRING" },
            "value": { "type": "NUMBER" }
          }
        }
      },
      "companyGrowth": {
        "type": "ARRAY",
        "items": {
          "type": "OBJECT",
          "properties": {
            "year": { "type": "NUMBER" },
            "growth": { "type": "NUMBER" }
          }
        }
      },
      "performanceMetrics": {
        "type": "ARRAY",
        "items": {
          "type": "OBJECT",
          "properties": {
            "metric": { "type": "STRING" },
            "value": { "type": "NUMBER" }
          }
        }
      },
      "topInvestors": { "type": "ARRAY", "items": { "type": "STRING" } },
      "investmentDetails": { "type": "STRING" },
      "swot": {
        "type": "OBJECT",
        "properties": {
          "strengths": { "type": "ARRAY", "items": { "type": "STRING" } },
          "weaknesses": { "type": "ARRAY", "items": { "type": "STRING" } },
          "opportunities": { "type": "ARRAY", "items": { "type": "STRING" } },
          "threats": { "type": "ARRAY", "items": { "type": "STRING" } }
        }
      },
      "regionBreakdown": {
        "type": "ARRAY",
        "items": {
          "type": "OBJECT",
          "properties": {
            "region": { "type": "STRING" },
            "share": { "type": "NUMBER" }
          }
        }
      },
      "trendInsights": { "type": "ARRAY", "items": { "type": "STRING" } }
    },
    "propertyOrdering": ["companyName", "marketStanding", "topRivals", "majorProducts", "marketShare", "companyGrowth", "performanceMetrics", "topInvestors", "investmentDetails", "swot", "regionBreakdown", "trendInsights"]
  };

  const handleGenerateReport = async () => {
    if (!companyName) {
      setError("Please enter a company name.");
      return;
    }
    setLoading(true);
    setReport(null);
    setError('');

    // The ADK agent would be called here. 
    // by making a single, structured API call to the Gemini model.
    const chatHistory = [{
      role: "user",
      parts: [{ text: `Generate a detailed market research report for the company "${companyName}" with:
      - The company's current market standing and a brief summary of its position.
      - A list of its top 3-5 competitors or rivals.
      - A list of its 3-5 major products and their key features.
      - Market share data for the company and its main rivals, formatted as a percentage. The sum of all values should be 100.
      - Year-by-year growth data for the company, including a specific percentage for at least the last 3 years.
      - Key performance metrics for the company, such as "Innovation Score," "Customer Satisfaction," "Brand Reputation," and "Financial Stability" with values out of 100.
      - A list of its top investors and how many people have invested in the company.
      - A SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) with 3-5 bullet points for each.
      - A geographical market breakdown showing market share by region.
      - Trend insights based on the company's performance.
      Provide the response in the specified JSON schema.` }]
    }];

    const payload = {
      contents: chatHistory,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: jsonSchema
      }
    };

    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    let jsonResponse;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        const jsonText = result.candidates[0].content.parts[0].text;
        jsonResponse = JSON.parse(jsonText);
        setReport(jsonResponse);
      } else {
        throw new Error("Invalid response from API.");
      }
    } catch (e) {
      console.error("API call failed:", e);
      setError("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!report) {
      setError("No report to download.");
      return;
    }

    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

      if (!window.html2canvas || !window.jspdf) {
        throw new Error("One or more required libraries (html2canvas, jspdf) failed to load.");
      }

      const { jsPDF } = window.jspdf;
      const reportElement = document.getElementById('report-content');

      const canvas = await window.html2canvas(reportElement, {
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${report.companyName}_Market_Report.pdf`);
    } catch (e) {
      console.error("PDF download failed:", e);
      setError(`Failed to download PDF: ${e.message}. Please try again.`);
    }
  };

  const COLORS = ['#1a73e8', '#34a853', '#fbbc05', '#ea4335', '#4285f4'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 p-4 sm:p-8 flex flex-col items-center font-sans transition-all duration-500">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-800 shadow-2xl rounded-3xl p-6 sm:p-10 mb-8 transform hover:scale-105 transition-transform duration-300">
        <h1 className="text-3xl sm:text-5xl font-black text-center text-blue-700 dark:text-blue-400 mb-4 animate-fade-in-down">
          Market Intelligence Dashboard
        </h1>
        <p className="text-center text-lg text-gray-600 dark:text-gray-300 mb-8 animate-fade-in-up">
          Generate a detailed report by entering a company name below.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center">
          <input
            type="text"
            className="flex-grow p-4 border-2 border-blue-200 dark:border-blue-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300 shadow-inner"
            placeholder="e.g., Apple Inc."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
          >
            Generate Report
          </button>
        </div>
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded-xl mb-6 shadow-md animate-fade-in">
            <p>{error}</p>
          </div>
        )}
      </div>

      {loading && <LoadingScreen companyName={companyName} />}

      {report && (
        <div id="report-content" className="w-full max-w-5xl bg-white dark:bg-gray-800 shadow-2xl rounded-3xl p-6 sm:p-10 transform animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b-4 border-blue-200 dark:border-gray-700">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-blue-700 dark:text-blue-400">
              Market Report for {report.companyName}
            </h2>
            <button
              onClick={handleDownloadPDF}
              className="mt-4 md:mt-0 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:-translate-y-1"
            >
              Download PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl shadow-inner animate-slide-in-left">
              <h3 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Market Standing</h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">{report.marketStanding}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl shadow-inner animate-slide-in-right">
              <h3 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Top Investors</h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">{report.investmentDetails}</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 pl-4">
                {report.topInvestors.map((investor, index) => (
                  <li key={index} className="text-base">{investor}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400 animate-slide-in-left">Major Products & Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {report.majorProducts.map((product, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl shadow-md transform hover:scale-105 transition-transform duration-200">
                  <h4 className="font-extrabold text-xl mb-2 text-blue-600 dark:text-blue-400">{product.productName}</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-base pl-4">
                    {product.features.map((feature, fIndex) => (
                      <li key={fIndex}>{feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* SWOT Analysis */}
            {report.swot && (
              <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl shadow-inner animate-fade-in">
                <h3 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">SWOT Analysis</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(report.swot).map(([key, values], idx) => (
                    <div key={idx} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                      <h4 className="text-lg font-bold capitalize mb-2 text-gray-800 dark:text-gray-200">{key}</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        {values.map((v, i) => <li key={i}>{v}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

        
           {/* Company Growth Line Chart */}
<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl animate-fade-in lg:col-span-2">
  <h3 className="text-2xl font-bold mb-4 text-center text-blue-600 dark:text-blue-400">Year-on-Year Growth</h3>
  <ResponsiveContainer width="100%" height={350}>
    <LineChart data={report.companyGrowth}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
      <XAxis dataKey="year" tick={{ fill: '#6B7280' }} />
      <YAxis tickFormatter={(value) => `${value}%`} tick={{ fill: '#6B7280' }} />
      <Tooltip formatter={(value) => [`${value}%`]} />
      <Legend />
      <Line type="monotone" dataKey="growth" name="Growth Percentage" stroke="#1a73e8" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
    </LineChart>
  </ResponsiveContainer>
</div>

{/* Market Share Charts */}
<div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl animate-fade-in lg:col-span-2 mt-8">
  <h3 className="text-2xl font-bold mb-4 text-center text-blue-600 dark:text-blue-400">Market Share Breakdown</h3>
  <div className="flex flex-col lg:flex-row gap-8">
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={report.marketShare}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={130}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {report.marketShare.map((entry, index) => (
            <Cell key={`pie-cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
      </PieChart>
    </ResponsiveContainer>
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={report.marketShare} barSize={40}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="name" interval={0} tick={{ fill: '#6B7280', fontSize: 12 }} />
        <YAxis tickFormatter={(value) => `${value}%`} tick={{ fill: '#6B7280' }} />
        <Tooltip formatter={(value) => [`${value}%`]} />
        <Bar dataKey="value" name="Market Share">
          {report.marketShare.map((entry, index) => (
            <Cell key={`bar-cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>


            {/* Performance Radar */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl animate-fade-in lg:col-span-2">
              <h3 className="text-2xl font-bold mb-4 text-center text-blue-600 dark:text-blue-400">Key Performance Metrics</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart outerRadius={150} data={report.performanceMetrics}>
                  <PolarGrid stroke="#e0e0e0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#6B7280' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6B7280' }} />
                  <Radar name={report.companyName} dataKey="value" stroke="#34a853" fill="#34a853" fillOpacity={0.6} />
                  <Tooltip formatter={(value) => [`${value}/100`]} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Regional Breakdown Bar Chart */}
            {report.regionBreakdown && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl animate-fade-in lg:col-span-2">
                <h3 className="text-2xl font-bold mb-4 text-center text-blue-600 dark:text-blue-400">Regional Market Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.regionBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="share" name="Market Share" fill="#fbbc05" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {report.trendInsights && (
              <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl shadow-inner animate-fade-in">
                <h3 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Trend Insights</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  {report.trendInsights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* animations */}
      <style>
        {`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 1s ease-out; }
        .animate-slide-in-left { animation: slide-in-left 0.7s ease-out; }
        .animate-slide-in-right { animation: slide-in-right 0.7s ease-out; }
        .animate-spin-slow { animation: spin-slow 2s linear infinite; }
        `}
      </style>
    </div>
  );
};

export default App;
