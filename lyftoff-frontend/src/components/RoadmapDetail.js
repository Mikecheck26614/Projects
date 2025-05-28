import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useSound from 'use-sound';
import successSound from '../sounds/success.mp3';
import { useAriaProps } from 'react-aria';

function RoadmapDetail() {
  const { id } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [stepForm, setStepForm] = useState({ description: '', order: 1, deadline: '' });
  const [error, setError] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const token = localStorage.getItem('token');
  const [play] = useSound(successSound);

  const ariaProps = useAriaProps({
    role: 'region',
    'aria-label': `Roadmap ${id} details`
  });

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/roadmap/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRoadmap(response.data);
        const maxOrder = Math.max(...(response.data.RoadmapSteps || []).map(s => s.order), 0);
        setStepForm({ description: '', order: maxOrder + 1, deadline: '' });
        setError(null);
      } catch (err) {
        console.error('Fetch roadmap error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError('Failed to load roadmap.');
        axios.post('http://localhost:3000/api/logs', {
          error: err.message,
          stack: err.stack,
          url: `/roadmap/${id}`,
          timestamp: new Date().toISOString()
        });
      }
    };
    if (token && id) fetchRoadmap();
  }, [id, token]);

  const handleAddStep = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:3000/api/roadmap/${id}/steps`,
        stepForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoadmap({ ...roadmap, RoadmapSteps: [...(roadmap.RoadmapSteps || []), response.data.step] });
      setStepForm({ description: '', order: stepForm.order + 1, deadline: '' });
      setError(null);
      await axios.post('http://localhost:3000/api/analytics', {
        event: 'step_created',
        data: { roadmapId: id, stepId: response.data.step.id }
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error('Add step error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoadmap({
        ...roadmap,
        RoadmapSteps: roadmap.RoadmapSteps.map(s =>
          s.id === stepId ? { ...s, completed: !s.completed } : s
        )
      });
      if (!step.completed) play();
      setError(null);
      await axios.post('http://localhost:3000/api/analytics', {
        event: 'step_completed',
        data: { stepId }
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error('Toggle step error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setError(null);
      await axios.post('http://localhost:3000/api/analytics', {
        event: 'steps_reordered',
        data: { roadmapId: id }
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error('Drag reorder error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
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

  const memoizedSteps = useMemo(() => roadmap?.RoadmapSteps || [], [roadmap]);

  if (!token) return <div className="text-center mt-10">Please <Link to="/login" className="text-primary-blue">log in</Link> first!</div>;
  if (!roadmap) return <div className="text-center mt-10">Loading...</div>;

  const progress = memoizedSteps.length
    ? Math.round((memoizedSteps.filter(s => s.completed).length / memoizedSteps.length) * 100)
    : 0;

  return (
    <div {...ariaProps} className="max-w-4xl mx-auto mt-10 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg animate-slide-in">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-primary-blue dark:text-white">{roadmap.title}</h2>
      <div className="flex gap-4 mb-4">
        <Link to="/roadmap" className="text-primary-blue dark:text-blue-400 mb-4 inline-block hover:underline text-sm sm:text-base" aria-label="Back to roadmaps">Back to Roadmaps</Link>
        <button
          onClick={handleShare}
          className="bg-primary-yellow text-primary-blue px-3 py-1 rounded hover:bg-yellow-600 transition-colors"
          aria-label="Share roadmap"
        >
          Share
        </button>
      </div>
      {shareUrl && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Share URL: <a href={shareUrl} className="text-primary-blue dark:text-blue-400">{shareUrl}</a></p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-200 text-sm sm:text-base">Progress: {progress}%</p>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div
            className="bg-primary-blue h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
            aria-label={`Progress ${progress}%`}
          ></div>
        </div>
      </div>
      <form onSubmit={handleAddStep} className="mb-6 space-y-4" aria-label="Add step form">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="New step description"
            value={stepForm.description}
            onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-blue dark:bg-gray-700 dark:text-white"
            required
            aria-required="true"
            aria-label="Step description"
          />
          <input
            type="date"
            value={stepForm.deadline}
            onChange={(e) => setStepForm({ ...stepForm, deadline: e.target.value })}
            className="w-full sm:w-1/3 p-2 border rounded focus:ring-2 focus:ring-primary-blue dark:bg-gray-700 dark:text-white"
            aria-label="Step deadline"
          />
        </div>
        <button
          type="submit"
          className="bg-primary-blue text-white px-3 py-1 sm:px-4 sm:py-2 rounded hover:bg-blue-700 transition-colors"
          aria-label="Add step"
        >
          Add Step
        </button>
      </form>
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-2 bg-primary-blue rounded hidden sm:block"></div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="steps">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} role="listbox" aria-label="Roadmap steps">
                {memoizedSteps.sort((a, b) => a.order - b.order).map((step, i) => (
                  <Draggable key={step.id} draggableId={step.id.toString()} index={i}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="relative mb-8 pl-4 sm:pl-16"
                        role="option"
                        aria-label={`Step ${step.description}`}
                      >
                        <div className="absolute left-2 sm:left-4 w-6 h-6 bg-primary-yellow rounded-full border-4 border-primary-blue"></div>
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded shadow flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={step.completed}
                              onChange={() => handleToggleStep(step.id)}
                              className="mr-2"
                              aria-label={`Toggle completion of ${step.description}`}
                            />
                            <span className={step.completed ? 'line-through' : ''}>{step.description}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {step.deadline ? `Due: ${new Date(step.deadline).toLocaleDateString()}` : 'No deadline'}
                            </span>
                            <button
                              onClick={() =>
                                axios
                                  .delete(`http://localhost:3000/api/roadmap/step/${step.id}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  })
                                  .then(() =>
                                    setRoadmap({
                                      ...roadmap,
                                      RoadmapSteps: roadmap.RoadmapSteps.filter(s => s.id !== step.id)
                                    })
                                  )
                                  .catch(err => {
                                    console.error('Delete step error:', err.message);
                                    setError('Failed to delete step.');
                                    axios.post('http://localhost:3000/api/logs', {
                                      error: err.message,
                                      stack: err.stack,
                                      url: `/roadmap/step/${step.id}`,
                                      timestamp: new Date().toISOString()
                                    });
                                  })
                              }
                              className="text-red-500 hover:text-red-700"
                              aria-label={`Delete ${step.description}`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}

export default RoadmapDetail;