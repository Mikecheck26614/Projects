import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Chart from 'chart.js/auto';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const fetchInsights = useCallback(async (reportData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/ai/insights',
        {
          roadmapStats: reportData.roadmapStats,
          userProfile: reportData.profile,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInsights(response.data.insights);
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast.error('Failed to load insights');
    }
  }, []); // No dependencies since token is from localStorage

  const fetchReport = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/report', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(response.data);
      fetchInsights(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
    }
  }, [fetchInsights]); // Add fetchInsights as a dependency

  useEffect(() => {
    fetchReport();
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [fetchReport]);

  useEffect(() => {
    if (report && chartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      chartInstanceRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Total Roadmaps', 'Completed Roadmaps', 'Total Steps', 'Completed Steps', 'Total Goals', 'Completed Goals'],
          datasets: [
            {
              label: 'Progress Stats',
              data: [
                report.roadmapStats.totalRoadmaps,
                report.roadmapStats.completedRoadmaps,
                report.roadmapStats.totalSteps,
                report.roadmapStats.completedSteps,
                report.goalStats.totalGoals,
                report.goalStats.completedGoals,
              ],
              backgroundColor: [
                'rgba(54, 162, 235, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(255, 99, 132, 0.6)',
              ],
              borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 132, 1)',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Count',
              },
            },
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
            title: {
              display: true,
              text: 'Roadmap and Goal Progress',
            },
          },
        },
      });
    }
  }, [report]);

  if (!report) return <div className="text-center text-gray-600">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">LyftOff Progress Report</h2>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Overview</h3>
        <p className="text-base">Overall Score: {report.score}%</p>
        <p className="text-base">Academic Level: {report.profile.academicLevel}</p>
        <p className="text-base">Profile Completion: {report.profile.firstName ? 'Complete' : 'Incomplete'}</p>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Categories</h3>
        {Object.entries(report.categories || {}).map(([key, value]) => (
          <p key={key} className="text-base">{key}: {value}%</p>
        ))}
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Progress Chart</h3>
        <canvas ref={chartRef} className="w-full h-64"></canvas>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Roadmap Stats</h3>
        <p className="text-base">Total Roadmaps: {report.roadmapStats.totalRoadmaps}</p>
        <p className="text-base">Completed Roadmaps: {report.roadmapStats.completedRoadmaps}</p>
        <p className="text-base">Total Steps: {report.roadmapStats.totalSteps}</p>
        <p className="text-base">Completed Steps: {report.roadmapStats.completedSteps}</p>
        <p className="text-base">Steps with Deadlines: {report.roadmapStats.stepsWithDeadlines}</p>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Goal Stats</h3>
        <p className="text-base">Total Goals: {report.goalStats.totalGoals}</p>
        <p className="text-base">Completed Goals: {report.goalStats.completedGoals}</p>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Achievements</h3>
        {report.achievements.map((achievement, index) => (
          <p key={index} className="text-base">
            - {typeof achievement === 'string' ? achievement : achievement.name || 'Unnamed Achievement'}: {typeof achievement === 'string' ? '' : achievement.description || ''}
          </p>
        ))}
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">AI-Driven Insights</h3>
        {insights.map((insight, index) => (
          <p key={index} className="text-base">{insight}</p>
        ))}
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Recommendations</h3>
        <p className="text-base font-medium">Institutions:</p>
        {report.recommendations.institutions.map((inst, index) => (
          <p key={index} className="text-base">- {inst.name} ({inst.fit}): {inst.reason}</p>
        ))}
        <p className="text-base font-medium">Scholarships:</p>
        {report.recommendations.scholarships.map((sch, index) => (
          <p key={index} className="text-base">- {sch.name} ({sch.amount}): {sch.eligibility}</p>
        ))}
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Score Trend</h3>
        {report.historicalScores.map((score, index) => (
          <p key={index} className="text-base">{score.date}: {score.score}/100</p>
        ))}
      </div>
      <div className="text-center">
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