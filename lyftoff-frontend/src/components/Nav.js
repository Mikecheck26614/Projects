import React from 'react';
   import { Link, useNavigate } from 'react-router-dom';

   function Nav() {
     const token = localStorage.getItem('token');
     const navigate = useNavigate();

     const handleLogout = () => {
       localStorage.removeItem('token');
       navigate('/login');
     };

     return (
       <nav className="bg-primary-blue text-white p-4 sticky top-0 z-10">
         <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center">
           <Link to="/" className="text-2xl font-bold mb-2 sm:mb-0">LyftOff</Link>
           <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
             <Link to="/" className="hover:text-primary-yellow">Home</Link>
             {token && (
               <>
                 <Link to="/dashboard" className="hover:text-primary-yellow">Dashboard</Link>
                 <Link to="/roadmap" className="hover:text-primary-yellow">Roadmaps</Link>
                 <Link to="/report" className="hover:text-primary-yellow">Report</Link>
                 <Link to="/scenarios" className="hover:text-primary-yellow">Scenarios</Link>
                 <Link to="/resources" className="hover:text-primary-yellow">Resources</Link>
                 <Link to="/profile" className="hover:text-primary-yellow">Profile</Link>
                 <button onClick={handleLogout} className="hover:text-primary-yellow text-left sm:text-center">Logout</button>
               </>
             )}
             {!token && (
               <>
                 <Link to="/login" className="hover:text-primary-yellow">Login</Link>
                 <Link to="/register" className="hover:text-primary-yellow">Register</Link>
               </>
             )}
           </div>
         </div>
       </nav>
     );
   }

   export default Nav;