import React from 'react'
import "../stylesheets/Home.css"
import Sidebar from '../components/Sidebar'
import Dashboard from '../components/Dashboard';
import { Outlet } from 'react-router-dom';

function Home() {
  return (
   <>
   <div className='home'>
     <Sidebar />
     <Outlet />
   </div>
  
   </>
  )
}

export default Home