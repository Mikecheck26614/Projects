import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [homeData, setHomeData] = useState({ feed: [], articles: [] });
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:3000/api/home', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setHomeData(res.data))
        .catch(err => console.error('Home fetch error:', err));
    }
  }, [token]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-primary-blue mb-6">Welcome to LyftOff</h1>
      {token ? (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">Your Feed</h2>
            <ul className="mt-2 overflow-y-auto h-64 border rounded">
              {homeData.feed.map((item, i) => (
                <li key={i} className="p-2 border-b">{item.text}</li>
              ))}
            </ul>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {homeData.articles.map((article, i) => (
                <Link key={i} to={article.link} className="block p-4 bg-white rounded shadow hover:bg-gray-100 transition-colors">
                  <img src={article.image} alt={article.title} className="w-full h-32 object-cover rounded" />
                  <h3 className="mt-2 font-bold">{article.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-700">Please <Link to="/login" className="text-primary-blue hover:underline">log in</Link> to get started!</p>
      )}
      {token && (
        <div className="mt-6 flex gap-4">
          <Link to="/profile" className="bg-primary-blue text-white p-2 rounded hover:bg-blue-700">Profile</Link>
          <Link to="/dashboard" className="bg-primary-blue text-white p-2 rounded hover:bg-blue-700">Dashboard</Link>
          <Link to="/roadmap" className="bg-primary-blue text-white p-2 rounded hover:bg-blue-700">Roadmap</Link>
        </div>
      )}
    </div>
  );
};

export default Home;