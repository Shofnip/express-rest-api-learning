import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TaskListPage from './pages/TaskListPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TaskListPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
