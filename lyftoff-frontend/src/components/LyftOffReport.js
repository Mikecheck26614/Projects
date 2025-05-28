import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  section: { marginBottom: 10 },
  title: { fontSize: 16, marginBottom: 10, textAlign: 'center' },
  text: { marginBottom: 5 },
});

const ReportPDF = ({ report, insights }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>LyftOff Progress Report</Text>
        <Text style={styles.text}>Generated: {new Date(report.timestamp).toLocaleDateString()}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.title}>Overview</Text>
        <Text style={styles.text}>Overall Score: {report.score}%</Text>
        <Text style={styles.text}>Academic Level: {report.profile.academicLevel}</Text>
        <Text style={styles.text}>Profile Completion: {report.profile.firstName ? 'Complete' : 'Incomplete'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.title}>Categories</Text>
        {Object.entries(report.categories || {}).map(([key, value]) => (
          <Text key={key} style={styles.text}>{key}: {value}%</Text>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.title}>Roadmap Stats</Text>
        <Text style={styles.text}>Total Roadmaps: {report.roadmapStats.totalRoadmaps}</Text>
        <Text style={styles.text}>Completed Roadmaps: {report.roadmapStats.completedRoadmaps}</Text>
        <Text style={styles.text}>Total Steps: {report.roadmapStats.totalSteps}</Text>
        <Text style={styles.text}>Completed Steps: {report.roadmapStats.completedSteps}</Text>
        <Text style={styles.text}>Steps with Deadlines: {report.roadmapStats.stepsWithDeadlines}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.title}>Goal Stats</Text>
        <Text style={styles.text}>Total Goals: {report.goalStats.totalGoals}</Text>
        <Text style={styles.text}>Completed Goals: {report.goalStats.completedGoals}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.title}>Achievements</Text>
        {report.achievements.map((achievement, index) => (
          <Text key={index} style={styles.text}>
            - {typeof achievement === 'string' ? achievement : achievement.name || 'Unnamed Achievement'}: {typeof achievement === 'string' ? '' : achievement.description || ''}
          </Text>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.title}>AI-Driven Insights</Text>
        {insights.map((insight, index) => (
          <Text key={index} style={styles.text}>{insight}</Text>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.title}>Recommendations</Text>
        <Text style={styles.text}>Institutions:</Text>
        {report.recommendations.institutions.map((inst, index) => (
          <Text key={index} style={styles.text}>- {inst.name} ({inst.fit}): {inst.reason}</Text>
        ))}
        <Text style={styles.text}>Scholarships:</Text>
        {report.recommendations.scholarships.map((sch, index) => (
          <Text key={index} style={styles.text}>- {sch.name} ({sch.amount}): {sch.eligibility}</Text>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.title}>Score Trend</Text>
        {report.historicalScores.map((score, index) => (
          <Text key={index} style={styles.text}>{score.date}: {score.score}/100</Text>
        ))}
      </View>
    </Page>
  </Document>
);

const LyftOffReport = () => {
  const [report, setReport] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/report', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(response.data);
      const insightsResponse = await axios.post(
        'http://localhost:3000/api/ai/insights',
        {
          roadmapStats: response.data.roadmapStats,
          userProfile: response.data.profile,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInsights(insightsResponse.data.insights);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center text-gray-600">Loading report...</div>;
  if (!report) return <div className="text-center text-gray-600">No report available</div>;

  const chartData = {
    labels: ['Total Roadmaps', 'Completed Roadmaps', 'Total Steps', 'Completed Steps', 'Total Goals', 'Completed Goals'],
    datasets: [
      {
        label: 'Stats',
        data: [
          report.roadmapStats.totalRoadmaps,
          report.roadmapStats.completedRoadmaps,
          report.roadmapStats.totalSteps,
          report.roadmapStats.completedSteps,
          report.goalStats.totalGoals,
          report.goalStats.completedGoals,
        ],
        backgroundColor: ['#3b82f6', '#f7d154', '#3b82f6', '#f7d154', '#10b981', '#f43f5e'],
      },
    ],
  };

  const scoreChartData = {
    labels: report.historicalScores.map(s => s.date),
    datasets: [
      {
        label: 'Score Trend',
        data: report.historicalScores.map(s => s.score),
        borderColor: '#3b82f6',
        fill: false,
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">LyftOff Progress Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-blue-600 mb-2">Overview</h3>
          <p className="text-base">Overall Score: <span className="font-bold">{report.score}%</span></p>
          <p className="text-base">Academic Level: {report.profile.academicLevel}</p>
          <p className="text-base">Profile Completion: {report.profile.firstName ? 'Complete' : 'Incomplete'}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-blue-600 mb-2">Categories</h3>
          {Object.entries(report.categories || {}).map(([key, value]) => (
            <p key={key} className="text-base">{key}: <span className="font-bold">{value}%</span></p>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-blue-600 mb-2">Stats</h3>
        <Suspense fallback={<div className="text-gray-600">Loading chart...</div>}>
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </Suspense>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-blue-600 mb-2">AI-Driven Insights</h3>
        {insights.map((insight, index) => (
          <p key={index} className="text-base text-gray-700">{insight}</p>
        ))}
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-blue-600 mb-2">Achievements</h3>
        <ul className="list-disc pl-5">
          {report.achievements.map((achievement, index) => (
            <li key={index} className="text-base">
              {typeof achievement === 'string' ? achievement : `${achievement.name}: ${achievement.description}`}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-blue-600 mb-2">Recommendations</h3>
        <p className="text-base font-medium">Institutions:</p>
        <ul className="list-disc pl-5">
          {report.recommendations.institutions.map((inst, index) => (
            <li key={index} className="text-base">{inst.name} ({inst.fit}): {inst.reason}</li>
          ))}
        </ul>
        <p className="text-base font-medium mt-2">Scholarships:</p>
        <ul className="list-disc pl-5">
          {report.recommendations.scholarships.map((sch, index) => (
            <li key={index} className="text-base">{sch.name} ({sch.amount}): {sch.eligibility}</li>
          ))}
        </ul>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-blue-600 mb-2">Score Trend</h3>
        <Suspense fallback={<div className="text-gray-600">Loading chart...</div>}>
          <Bar data={scoreChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </Suspense>
      </div>
      <div className="mt-6">
        <PDFDownloadLink
          document={<ReportPDF report={report} insights={insights} />}
          fileName="LyftOff_Report.pdf"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {({ loading }) => (loading ? 'Generating PDF...' : 'Download PDF')}
        </PDFDownloadLink>
      </div>
    </div>
  );
};

export default LyftOffReport;