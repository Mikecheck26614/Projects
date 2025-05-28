import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Resources() {
  const [resources, setResources] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/resources', { headers: { Authorization: `Bearer ${token}` } });
        setResources(response.data);
      } catch (err) {
        console.error('Resources fetch error:', err);
      }
    };
    if (token) fetchResources();
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-primary-blue">Resources</h2>
      <div className="space-y-4">
        {resources.map((r, i) => (
          <div key={i} className="p-4 border rounded">
            <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-primary-blue font-bold hover:underline">{r.title}</a>
            <p className="text-gray-700">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Resources;