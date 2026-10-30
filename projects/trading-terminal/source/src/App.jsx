import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import TerminalShell from '@/components/terminal/TerminalShell';
import Dashboard from '@/pages/Dashboard';
import TradingPlan from '@/pages/TradingPlan';
import ModulePlaceholder from '@/pages/ModulePlaceholder';
import PositionCalculator from '@/pages/PositionCalculator';
import Wallpaper from '@/pages/Wallpaper';
import PreTradeCheck from '@/pages/PreTradeCheck';
import TradeJournal from '@/pages/TradeJournal';
import TradeJournalDetail from '@/pages/TradeJournalDetail';
import ManualTradeForm from '@/pages/ManualTradeForm';
import TradeSync from '@/pages/TradeSync';
import RiskMonitor from '@/pages/RiskMonitor';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageTransition from '@/components/PageTransition';
import { useAutoTradeSync } from '@/hooks/useAutoTradeSync';
import { Navigate, useLocation } from 'react-router-dom';

const RedirectToLogin = () => {
  const location = useLocation();
  const next = encodeURIComponent(location.pathname + location.search);
  return <Navigate to={`/login?next=${next}`} replace />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();
  useAutoTradeSync();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<RedirectToLogin />} />}>
        <Route element={<TerminalShell />}>
          <Route path="/" element={<PageTransition fullHeight><Dashboard /></PageTransition>} />
          <Route path="/plan" element={<PageTransition><TradingPlan /></PageTransition>} />
          <Route path="/placeholder" element={<PageTransition><ModulePlaceholder /></PageTransition>} />
          <Route path="/position-calculator" element={<PageTransition><PositionCalculator /></PageTransition>} />
          <Route path="/wallpaper" element={<PageTransition><Wallpaper /></PageTransition>} />
          <Route path="/pretrade" element={<PageTransition><PreTradeCheck /></PageTransition>} />
          <Route path="/journal" element={<PageTransition><TradeJournal /></PageTransition>} />
          <Route path="/journal/new" element={<PageTransition><ManualTradeForm /></PageTransition>} />
          <Route path="/journal/sync" element={<PageTransition><TradeSync /></PageTransition>} />
          <Route path="/journal/:id" element={<PageTransition><TradeJournalDetail /></PageTransition>} />
          <Route path="/risk-monitor" element={<PageTransition><RiskMonitor /></PageTransition>} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App