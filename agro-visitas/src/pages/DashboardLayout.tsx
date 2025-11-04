import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NetworkStatus from '../components/NetworkStatus';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import { 
  Home, 
  Users, 
  MapPin, 
  Grid3x3,
  Calendar, 
  FileText, 
  TrendingUp, 
  Settings,
  LogOut,
  Menu,
  X,
  Sprout,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  Beaker,
  Bug,
  Wheat
} from 'lucide-react';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    // Recuperar estado do localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const { user, profile, organization, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Salvar estado do colapso no localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Auto-fechar sidebar mobile ao navegar
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Keyboard support (ESC para fechar mobile)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Fazendas', href: '/fazendas', icon: MapPin },
    { name: 'Talhoes', href: '/talhoes', icon: Grid3x3 },
    { name: 'Visitas', href: '/visitas', icon: Calendar },
    { name: 'Analise de Solo', href: '/analise-solo', icon: Beaker },
    { name: 'Monitoramento', href: '/monitoramento', icon: Bug },
    { name: 'Relatorios', href: '/relatorios', icon: FileText },
    { name: 'Insights', href: '/insights', icon: TrendingUp },
  ];

  async function handleSignOut() {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  }

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile sidebar backdrop */}
      <div 
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" />
      </div>

      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-strong transform transition-transform duration-300 ease-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-soft">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-900 text-lg">Agro Visitas</span>
                <p className="text-xs text-gray-500">{organization?.name || 'Sistema'}</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 active:scale-[0.98]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1 h-8 bg-gradient-to-b from-primary-600 to-primary-700 rounded-r-full" />
                  )}
                  <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile User Section */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3 mb-3 p-3 bg-white rounded-xl">
              <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-soft">
                <span className="text-white font-bold text-lg">
                  {profile?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {profile?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-gray-700 hover:text-red-600 bg-white hover:bg-red-50 rounded-xl transition-all duration-200 font-medium border border-gray-200 hover:border-red-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div 
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-out ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200 shadow-soft">
          {/* Desktop Header com Toggle */}
          <div className="relative flex items-center justify-between p-6 border-b border-gray-100 transition-all duration-300">
            {/* Logo e Nome */}
            <div className={`flex items-center gap-4 transition-all duration-300 ${
              sidebarCollapsed ? 'flex-col items-center justify-center w-full' : 'flex-1'
            }`}>
              <div className="p-3 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-soft flex-shrink-0">
                <Sprout className="w-8 h-8 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0 animate-fade-in">
                  <h1 className="text-xl font-bold text-gray-900 truncate">Agro Visitas</h1>
                  <p className="text-sm text-gray-600 truncate">{organization?.name || 'Sistema'}</p>
                </div>
              )}
            </div>

            {/* Toggle Button - Sempre visivel ao lado do logo quando expandido */}
            {!sidebarCollapsed && (
              <button
                onClick={toggleCollapse}
                className="group p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0 ml-2"
                title="Colapsar sidebar"
              >
                <PanelLeftClose className="w-5 h-5 text-gray-600 group-hover:text-primary-600 transition-colors" />
              </button>
            )}
          </div>

          {/* Toggle Button para estado colapsado - posicionado após o header */}
          {sidebarCollapsed && (
            <div className="relative px-4 py-3 border-b border-gray-100 flex justify-center">
              <button
                onClick={toggleCollapse}
                className="group p-2 bg-white hover:bg-primary-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-soft border border-gray-200 hover:border-primary-300"
                title="Expandir sidebar"
              >
                <PanelLeft className="w-4 h-4 text-gray-600 group-hover:text-primary-600 transition-colors" />
              </button>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl font-medium transition-all duration-200 ${
                    sidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3.5'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 active:scale-[0.98]'
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  {isActive && !sidebarCollapsed && (
                    <div className="absolute left-0 w-1 h-8 bg-gradient-to-b from-primary-600 to-primary-700 rounded-r-full" />
                  )}
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="animate-fade-in">{item.name}</span>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 ml-auto animate-pulse" />
                      )}
                    </>
                  )}
                  {sidebarCollapsed && isActive && (
                    <div className="absolute right-0 w-1 h-8 bg-gradient-to-b from-primary-600 to-primary-700 rounded-l-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop User Section */}
          <div className={`p-4 border-t border-gray-100 bg-gray-50 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
            {sidebarCollapsed ? (
              <>
                <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-soft mb-3">
                  <span className="text-white font-bold text-lg">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2.5 text-gray-700 hover:text-red-600 bg-white hover:bg-red-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-red-200"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-xl shadow-sm animate-fade-in">
                  <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-soft">
                    <span className="text-white font-bold text-lg">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {profile?.full_name || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-gray-700 hover:text-red-600 bg-white hover:bg-red-50 rounded-xl transition-all duration-200 font-medium border border-gray-200 hover:border-red-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ease-out ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-80'}`}>
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex h-16 bg-white/80 backdrop-blur-lg border-b border-gray-200 lg:hidden shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 hover:text-gray-700 transition-colors active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center flex-1 px-4">
            <h1 className="text-lg font-semibold text-gray-900">
              {navigation.find((item) => item.href === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8 min-h-screen">
          <Outlet />
        </main>
        
        {/* PWA e Network Status Indicators */}
        <NetworkStatus />
        <PWAInstallPrompt />
      </div>
    </div>
  );
}
