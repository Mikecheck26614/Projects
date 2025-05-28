import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import Confetti from 'react-confetti';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useSound from 'use-sound';
import successSound from '../sounds/success.mp3';

function Roadmap() {
  const { id } = useParams();
  const [roadmaps, setRoadmaps] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [formData, setFormData] = useState({ title: '', goals: '', status: 'in-progress', steps: [{ description: '', deadline: '' }] });
  const [stepForm, setStepForm] = useState({ description: '', order: 1, deadline: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const token = localStorage.getItem('token');
  const [play] = useSound(successSound);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        if (id) {
          const response = await axios.get(`http://localhost:3000/api/roadmap/${id}`, config);
          setRoadmap(response.data);
          const maxOrder = Math.max(...(response.data.RoadmapSteps || []).map(s => s.order), 0);
          setStepForm({ description: '', order: maxOrder + 1, deadline: '' });
        } else {
          const [roadmapRes, suggestionRes] = await Promise.all([
            axios.get('http://localhost:3000/api/roadmaps', config),
            axios.get('http://localhost:3000/api/roadmap/suggestions', config)
          ]);
          setRoadmaps(roadmapRes.data);
          console.log('Suggestions API response:', suggestionRes.data); // Debug log
          setSuggestions(Array.isArray(suggestionRes.data) ? suggestionRes.data : []);
        }
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err.message);
        setError(id ? 'Failed to load roadmap.' : 'Failed to load roadmaps or suggestions.');
        axios.post('http://localhost:3000/api/logs', {
          error: err.message,
          stack: err.stack,
          url: id ? `/roadmap/${id}` : '/roadmap',
          timestamp: new Date().toISOString()
        });
      }
    };
    if (token) fetchData();
  }, [token, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        goals: formData.goals,
        status: formData.status,
        steps: formData.steps.filter(step => step.description)
      };
      const response = await axios.post('http://localhost:3000/api/roadmap', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoadmaps([...roadmaps, response.data]);
      setFormData({ title: '', goals: '', status: 'in-progress', steps: [{ description: '', deadline: '' }] });
      if (formData.status === 'completed') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      await axios.post('http://localhost:3000/api/analytics', {
        event: 'roadmap_created',
        data: { roadmapId: response.data.id }
      }, { headers: { Authorization: `Bearer ${token}` } });
      setError(null);
    } catch (err) {
      console.error('Create roadmap error:', err.message);
      setError('Failed to create roadmap.');
      axios.post('http://localhost:3000/api/logs', {
        error: err.message,
        stack: err.stack,
        url: '/roadmap',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleAddStep = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:3000/api/roadmap/${id}/steps`,
        stepForm,
        { headers: { Authorization: `Bearer ${token}` }
      });
      setRoadmap({ ...roadmap, RoadmapSteps: [...(roadmap.RoadmapSteps || []), response.data.step] });
      setStepForm({ description: '', order: stepForm.order + 1, deadline: '' });
      await axios.post('http://localhost:3000/api/analytics', {
        event: 'step_created',
        data: { roadmapId: id, stepId: response.data.step.id }
      }, { headers: { Authorization: `Bearer ${token}` } });
      setError(null);
    } catch (err) {
      console.error('Add step error:', err.message);
      setError('Failed to add step.');
      axios.post('http://localhost:3000/api/logs', {
        error: err.message,
        stack: err.stack,
        url: `/roadmap/${id}/steps`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleToggleStep = async (stepId) => {
    const step = roadmap.RoadmapSteps.find(s => s.id === stepId);
    try {
      await axios.put(
        `http://localhost:3000/api/roadmap/step/${stepId}`,
        { completed: !step.completed },
        { headers: { Authorization: `Bearer ${token}` }
      });
      setRoadmap({
        ...roadmap,
        RoadmapSteps: roadmap.RoadmapSteps.map(s =>
          s.id === stepId ? { ...s, completed: !s.completed } : s
        )
      });
      if (!step.completed) play();
      await axios.post('http://localhost:3000/api/analytics', {
        event: 'step_completed',
        data: { stepId }
      }, { headers: { Authorization: `Bearer ${token}` } });
      setError(null);
    } catch (err) {
      console.error('Toggle step error:', err.message);
      setError('Failed to toggle step.');
      axios.post('http://localhost:3000/api/logs', {
        error: err.message,
        stack: err.stack,
        url: `/roadmap/step/${stepId}`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const newSteps = [...roadmap.RoadmapSteps];
    const [moved] = newSteps.splice(result.source.index, 1);
    newSteps.splice(result.destination.index, 0, moved);
    newSteps.forEach((s, i) => (s.order = i + 1));
    setRoadmap({ ...roadmap, RoadmapSteps: newSteps });
    try {
      await axios.post(
        `http://localhost:3000/api/roadmap/${id}/steps`,
        newSteps.map(s => ({ id: s.id, order: s.order })),
        { headers: { Authorization: `Bearer ${token}` }
      });
      await axios.post('http://localhost:3000/api/analytics', {
        event: 'steps_reordered',
        data: { roadmapId: id }
      }, { headers: { Authorization: `Bearer ${token}` } });
      setError(null);
    } catch (err) {
      console.error('Reorder steps error:', err.message);
      setError('Failed to reorder steps.');
      axios.post('http://localhost:3000/api/logs', {
        error: err.message,
        stack: err.stack,
        url: `/roadmap/${id}/steps`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleShare = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/roadmap/${id}/share`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShareUrl(response.data.shareUrl);
      navigator.clipboard.writeText(response.data.shareUrl);
      alert('Share link copied to clipboard!');
      await axios.post('http://localhost:3000/api/analytics', {
        event: 'roadmap_shared',
        data: { roadmapId: id }
      }, { headers: { Authorization: `Bearer ${token}` } });
      setError(null);
    } catch (err) {
      console.error('Share error:', err.message);
      setError('Failed to generate share link.');
      axios.post('http://localhost:3000/api/logs', {
        error: err.message,
        stack: err.stack,
        url: `/roadmap/${id}/share`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const addStep = () => {
    setFormData({ ...formData, steps: [...formData.steps, { description: '', deadline: '' }] });
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index][field] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const memoizedRoadmaps = useMemo(() => roadmaps, [roadmaps]);
  const memoizedSteps = useMemo(() => roadmap?.RoadmapSteps || [], [roadmap]);

  if (!token) {
    return (
      <div className="text-center mt-10">
        Please <Link to="/login" className="text-primary-blue">log in</Link> to view roadmaps!
      </div>
    );
  }

  if (id) {
    if (!roadmap) return <div className="text-center mt-10">Loading...</div>;
    const progress = memoizedSteps.length
      ? (memoizedSteps.filter(s => s.completed).length / memoizedSteps.length) * 100
      : 0;

    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg animate-slide-in">
        {showConfetti && <Confetti />}
        <h2 className="text-2xl font-bold mb-4 text-primary-blue">{roadmap.title}</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {shareUrl && <p className="text-green-500 mb-4">Share link: {shareUrl}</p>}
        <p className="mb-4">Goals: {roadmap.goals}</p>
        <p className="mb-4">Status: {roadmap.status}</p>
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary-blue h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">{Math.round(progress)}% Complete</p>
        </div>
        <button
          onClick={handleShare}
          className="bg-primary-yellow text-primary-blue px-4 py-2 rounded hover:bg-yellow-600 mb-4"
        >
          Share Roadmap
        </button>
        <h3 className="text-xl font-semibold mb-2">Steps</h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="steps">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {memoizedSteps
                  .sort((a, b) => a.order - b.order)
                  .map((step, index) => (
                    <Draggable key={step.id} draggableId={String(step.id)} index={index}>
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="flex items-center p-2 bg-gray-100 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={step.completed}
                            onChange={() => handleToggleStep(step.id)}
                            className="mr-2"
                          />
                          <span className={step.completed ? 'line-through' : ''}>
                            {step.description}
                          </span>
                          {step.deadline && (
                            <span className="ml-2 text-sm text-gray-500">
                              (Due: {new Date(step.deadline).toLocaleDateString()})
                            </span>
                          )}
                        </li>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
        <form onSubmit={handleAddStep} className="mt-4 space-y-4">
          <div>
            <label htmlFor="stepDesc" className="block text-gray-700">New Step</label>
            <input
              id="stepDesc"
              type="text"
              value={stepForm.description}
              onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label htmlFor="stepDeadline" className="block text-gray-700">Deadline (Optional)</label>
            <input
              id="stepDeadline"
              type="date"
              value={stepForm.deadline}
              onChange={(e) => setStepForm({ ...stepForm, deadline: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="bg-primary-blue text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Step
          </button>
        </form>
        <Link to="/roadmap" classDynacmiclassName="mt-4 inline-block text-primary-blue hover:underline">
          Back to Roadmaps
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg animate-slide-in">
      {showConfetti && <Confetti />}
      <h2 className="text-2xl font-bold mb-4 text-primary-blue">Your Roadmaps</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <ul className="space-y-4 mb-6">
        {memoizedRoadmaps.map((rm) => (
          <li key={rm.id} className="p-4 bg-gray-100 rounded">
            <Link to={`/roadmap/${rm.id}`} className="text-primary-blue hover:underline">
              {rm.title}
            </Link>
            <p className="text-sm text-gray-600">Status: {rm.status}</p>
          </li>
        ))}
      </ul>
      <h3 className="text-xl font-semibold mb-2">Create New Roadmap</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-gray-700">Title</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="goals" className="block text-gray-700">Goals</label>
          <textarea
            id="goals"
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
            className="w-full p-2 border rounded"
            rows="3"
            required
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-gray-700">Status</label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="planned">Planned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <h4 className="font-semibold">Steps (Optional)</h4>
          {formData.steps.map((step, index) => (
            <div key={index} className="flex space-x-2 mt-2">
              <input
                type="text"
                placeholder="Step description"
                value={step.description}
                onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <input
                type="date"
                value={step.deadline}
                onChange={(e) => handleStepChange(index, 'deadline', e.target.value)}
                className="p-2 border rounded"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addStep}
            className="mt-2 text-primary-blue hover:underline"
          >
            + Add Step
          </button>
        </div>
        <div>
          <h4 className="font-semibold">Suggestions</h4>
          {Array.isArray(suggestions) && suggestions.length ? (
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  className="cursor-pointer text-primary-blue hover:underline"
                  onClick={() => setFormData({ ...formData, title: s })}
                >
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No suggestions available.</p>
          )}
        </div>
        <button
          type="submit"
          className="bg-primary-blue text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Roadmap
        </button>
      </form>
    </div>
  );
}

export default Roadmap;