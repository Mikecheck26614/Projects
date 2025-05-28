import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StepWizard from 'react-step-wizard';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const OnboardingStep1 = ({ nextStep }) => (
  <div className="p-6 bg-white rounded-lg shadow-lg">
    <h3 className="text-xl font-semibold text-blue-600 mb-4">Welcome to Goal Setting!</h3>
    <p className="text-gray-600 mb-4">Set SMART goals to achieve your dreams. What's your first goal?</p>
    <button
      onClick={nextStep}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      Next
    </button>
  </div>
);

const OnboardingStep2 = ({ previousStep, nextStep, setGoal }) => {
  const [title, setTitle] = useState('');
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-blue-600 mb-4">Define Your Goal</h3>
      <input
        type="text"
        placeholder="e.g., Get accepted to MIT"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      <div className="flex gap-4">
        <button
          onClick={previousStep}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
        >
          Back
        </button>
        <button
          onClick={() => { setGoal(prev => ({ ...prev, title })); nextStep(); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    milestones: [],
    deadline: '',
    resources: [],
    reflection: '',
    progress: 0,
  });
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/goals', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGoals(response.data);
      } catch (err) {
        setError('Failed to load goals.');
      }
    };
    if (token) fetchGoals();
  }, [token]);

  const addGoal = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/goals', newGoal, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoals([...goals, response.data]);
      setNewGoal({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
        milestones: [],
        deadline: '',
        resources: [],
        reflection: '',
        progress: 0,
      });
      toast('Goal added!');
    } catch (err) {
      setError('Failed to add goal.');
    }
  };

  const updateProgress = async (goalId, progress) => {
    try {
      await axios.patch(`http://localhost:3000/api/goals/${goalId}`, { progress }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoals(goals.map((g) => (g.id === goalId ? { ...g, progress } : g)));
      if (progress === 100) toast('Goal completed! 🎉');
    } catch (err) {
      setError('Failed to update goal.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg"
    >
      <h2 className="text-3xl font-bold text-blue-600 mb-6">Your Goals</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <StepWizard>
        <OnboardingStep1 />
        <OnboardingStep2 setGoal={setNewGoal} />
      </StepWizard>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-blue-600 mb-2">Add New Goal</h3>
        <input
          type="text"
          placeholder="Goal Title"
          value={newGoal.title}
          onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
          className="w-full p-2 mb-2 border rounded"
        />
        <textarea
          placeholder="Description"
          value={newGoal.description}
          onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
          className="w-full p-2 mb-2 border rounded"
        />
        <select
          value={newGoal.category}
          onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
          className="w-full p-2 mb-2 border rounded"
        >
          <option value="">Select Category</option>
          <option value="Academic">Academic</option>
          <option value="Career">Career</option>
          <option value="Personal">Personal</option>
        </select>
        <select
          value={newGoal.priority}
          onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
          className="w-full p-2 mb-2 border rounded"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <input
          type="date"
          value={newGoal.deadline}
          onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
          className="w-full p-2 mb-2 border rounded"
        />
        <textarea
          placeholder="Reflection Notes"
          value={newGoal.reflection}
          onChange={(e) => setNewGoal({ ...newGoal, reflection: e.target.value })}
          className="w-full p-2 mb-2 border rounded"
        />
        <button
          onClick={addGoal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Goal
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <h4 className="text-blue-600 font-semibold">{goal.title}</h4>
            <p className="text-gray-600">{goal.description}</p>
            <p className="text-gray-600">Category: {goal.category}</p>
            <p className="text-gray-600">Priority: {goal.priority}</p>
            <p className="text-gray-600">Deadline: {goal.deadline}</p>
            <div className="w-24 h-24 mx-auto my-4">
              <CircularProgressbar value={goal.progress} text={`${goal.progress}%`} />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={goal.progress}
              onChange={(e) => updateProgress(goal.id, Number(e.target.value))}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Goals;