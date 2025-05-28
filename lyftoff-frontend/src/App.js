import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import Nav from './components/Nav';
import Login from './components/Login';
import Register from './components/Register';
import Onboarding from './components/Onboarding';
import Dashboard from './pages/Dashboard';
import ProfileOverview from './components/ProfileOverview';
import ProfileEdit from './components/ProfileEdit';
import ProfileGoals from './components/ProfileGoals';
import ProfileDocuments from './components/ProfileDocuments';
import Roadmap from './components/Roadmap';
import LyftOffReport from './components/LyftOffReport';
import ScenarioPlanner from './components/ScenarioPlanner';
import Home from './pages/Home';
import Resources from './pages/Resources';
import Feedback from './components/Feedback';
import ErrorBoundaryComponent from './components/ErrorBoundaryComponent';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorBoundaryComponent}
      onError={(error, errorInfo) => {
        fetch('http://localhost:3000/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.message,
            stack: errorInfo.componentStack,
            url: window.location.pathname,
            timestamp: new Date().toISOString()
          })
        });
      }}
    >
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-yellow-100 animate-fade-in">
          <Nav />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileOverview /></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
            <Route path="/profile/goals" element={<ProtectedRoute><ProfileGoals /></ProtectedRoute>} />
            <Route path="/profile/documents" element={<ProtectedRoute><ProfileDocuments /></ProtectedRoute>} />
            <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
            <Route path="/roadmap/:id" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><LyftOffReport /></ProtectedRoute>} />
            <Route path="/scenarios" element={<ProtectedRoute><ScenarioPlanner /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
            <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;