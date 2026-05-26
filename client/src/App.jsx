import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Trending from './pages/Trending';
import Reels from './pages/Reels';
import Stats from './pages/Stats';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import NewPost from './pages/NewPost';
import EditProfile from './pages/EditProfile';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Search from './pages/Search';
import Match from './pages/Match';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="paw-spinner">🐾</div></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="paw-spinner">🐾</div></div>;
  return user ? <Navigate to="/" replace /> : children;
}

function Layout({ children }) {
  return <><Navbar /><main className="main-content">{children}</main></>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout><Feed /></Layout></PrivateRoute>} />
          <Route path="/explore" element={<PrivateRoute><Layout><Explore /></Layout></PrivateRoute>} />
          <Route path="/trending" element={<PrivateRoute><Layout><Trending /></Layout></PrivateRoute>} />
          <Route path="/reels" element={<PrivateRoute><Navbar /><Reels /></PrivateRoute>} />
          <Route path="/stats" element={<PrivateRoute><Layout><Stats /></Layout></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Layout><Notifications /></Layout></PrivateRoute>} />
          <Route path="/new" element={<PrivateRoute><Layout><NewPost /></Layout></PrivateRoute>} />
          <Route path="/profile/edit" element={<PrivateRoute><Layout><EditProfile /></Layout></PrivateRoute>} />
          <Route path="/post/:id" element={<PrivateRoute><Layout><PostDetail /></Layout></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Layout><Messages /></Layout></PrivateRoute>} />
          <Route path="/messages/:username" element={<PrivateRoute><Layout><Messages /></Layout></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><Layout><Search /></Layout></PrivateRoute>} />
          <Route path="/match" element={<PrivateRoute><Layout><Match /></Layout></PrivateRoute>} />
          <Route path="/:username" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
