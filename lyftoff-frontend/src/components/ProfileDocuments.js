import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProfileDocuments = () => {
  const [docs, setDocs] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('http://localhost:3000/api/profile/documents', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setDocs(res.data));
  }, [token]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('http://localhost:3000/api/profile/documents', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setDocs([...docs, res.data]);
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-primary-blue mb-4">Documents</h2>
      <input type="file" onChange={handleUpload} className="mt-4" />
      <ul className="mt-4 space-y-2">
        {docs.map(doc => (
          <li key={doc.id} className="p-2 border-b">{doc.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProfileDocuments;