import React from 'react';
   import { Link } from 'react-router-dom';

   function Home() {
     const token = localStorage.getItem('token');
     return (
       <div className="max-w-4xl mx-auto mt-10 p-6 text-center">
         <h1 className="text-4xl font-bold mb-4 text-primary-blue">Welcome to LyftOff!</h1>
         <p className="text-lg text-gray-700 mb-6">
           Transform your ambitions into action with personalized roadmaps, scores, and planning tools.
         </p>
         <div className="space-x-4">
           {!token && (
             <Link to="/register" className="bg-primary-blue text-white px-6 py-3 rounded hover:bg-blue-700">
               Get Started
             </Link>
           )}
           <Link to={token ? "/dashboard" : "/login"} className="bg-gray-300 text-gray-700 px-6 py-3 rounded hover:bg-gray-400">
             {token ? "Go to Dashboard" : "Login"}
           </Link>
         </div>
       </div>
     );
   }

   export default Home;