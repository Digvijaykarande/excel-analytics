import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './Pages/Register';
import Login from "./Pages/Login";
import Home from "./Pages/Home";
import About from "./Pages/About";
import Contact from './Pages/Contact';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './admin/AdminDashboard';
import UploadFilePage from './components/UploadFilePage';
import Dashboard from './components/Dashboard';
import ChartPage from './components/ChartPage'; 
import MyProjects from './components/MyProjects';
import History from './components/History';
import WelcomePage from './components/WelcomePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" />} />

          {/* Dashboard and its nested routes */}
          <Route path="dashboard" element={<Dashboard />}>
            <Route index element={<WelcomePage />} /> {/* Default view in dashboard */}
            <Route path="chartpage" element={<ChartPage />} />
            <Route path="uploadfile" element={<UploadFilePage />} />
            <Route path="myprojects" element={<MyProjects />} />
            <Route path="history" element={<History />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
          </Route>
        </Route>

       
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admindashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
