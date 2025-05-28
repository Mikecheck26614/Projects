import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'react-toastify';

const ScenarioPlanner = () => {
  const [careers, setCareers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/scenarios', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const careersData = response.data;
        setCareers(careersData);
        const nodes = careersData.map((career, i) => ({
          id: career.id,
          data: { label: career.title },
          position: { x: i * 200, y: 0 },
        }));
        const edges = careersData.flatMap((career) =>
          career.prerequisites.map((prereq, i) => ({
            id: `e${career.id}-${i}`,
            source: career.id,
            target: prereq.id,
            animated: true,
          }))
        );
        setNodes(nodes);
        setEdges(edges);
      } catch (err) {
        setError('Failed to load careers.');
      }
    };
    if (token) fetchCareers();
  }, [token]);

  const shareCareer = async (careerId) => {
    try {
      await axios.post(
        'http://localhost:3000/api/community/posts',
        { content: `Exploring ${careers.find(c => c.id === careerId).title}!`, careerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast('Career shared to community!');
    } catch (err) {
      setError('Failed to share career.');
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-blue-600 mb-6">Career Explorer</h2>
      <div style={{ height: '400px' }} className="mb-6">
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {careers.map((career) => (
          <div
            key={career.id}
            className="bg-gray-100 p-4 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setSelectedCareer(career)}
          >
            <h4 className="text-blue-600 font-semibold">{career.title}</h4>
            <p className="text-gray-600">Salary: ${career.salary}/year</p>
            <button
              onClick={(e) => { e.stopPropagation(); shareCareer(career.id); }}
              className="bg-yellow-400 text-blue-600 px-2 py-1 rounded hover:bg-yellow-500 mt-2"
            >
              Share
            </button>
          </div>
        ))}
      </div>
      {selectedCareer && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-blue-600 mb-2">{selectedCareer.title}</h3>
          <p className="text-gray-600">Description: {selectedCareer.description}</p>
          <p className="text-gray-600">Skills: {selectedCareer.skills.join(', ')}</p>
          <p className="text-gray-600">Education: {selectedCareer.education}</p>
          <p className="text-gray-600">Prerequisites: {selectedCareer.prerequisites.map(p => p.title).join(', ')}</p>
        </div>
      )}
    </div>
  );
};

export default ScenarioPlanner;