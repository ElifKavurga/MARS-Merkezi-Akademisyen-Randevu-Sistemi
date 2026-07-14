import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/AppShell.css';

export default function MainLayout() {
  return (
    <div className="app-shell min-h-screen flex flex-col bg-surface font-body-md text-on-surface antialiased">
      <Header />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
