import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { AssetList } from './components/assets/AssetList';
import { SearchAssets } from './components/assets/SearchAssets';
import { TeamList } from './components/teams/TeamList';
import { UserList } from './components/users/UserList';
import { UserRole } from './types';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="assets" element={<AssetList />} />
              <Route path="search" element={<SearchAssets />} />
              <Route path="teams" element={<TeamList />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute requiredRole={UserRole.ADMIN}>
                    <UserList />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
