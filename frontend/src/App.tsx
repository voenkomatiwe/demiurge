import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { TasksPage } from '@/pages/TasksPage';
import { TaskDetailPage } from '@/pages/TaskDetailPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { SessionsPage } from '@/pages/SessionsPage';
import { DecisionsPage } from '@/pages/DecisionsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchInterval: 5000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/decisions" element={<DecisionsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
