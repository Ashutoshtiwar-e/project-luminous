/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BookDetails from './pages/BookDetails';
import Categories from './pages/Categories';
import Lists from './pages/Lists';
import Community from './pages/Community';
import CommunityDetail from './pages/CommunityDetail';
import Profile from './pages/Profile';
import AIDiscovery from './pages/AIDiscovery';
import Author from './pages/Author';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="/author/:name" element={<Author />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/lists" element={<Lists />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/community/:id" element={<CommunityDetail />} />
        <Route path="/ai-discovery" element={<AIDiscovery />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}
