import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sprout, Info, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  function fillDemoCredentials() {
    setEmail('demo@agrovisitas.com');
    setPassword('demo123456');
    setIsLogin(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-soft"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-soft" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Demo Credentials Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5 shadow-soft animate-slide-in-down backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Acesso Rápido para Demonstração
              </p>
              <div className="space-y-2 text-sm text-blue-800 bg-white/50 rounded-lg p-3 mb-3">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <strong>Email:</strong> demo@agrovisitas.com
                </p>
                <p className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <strong>Senha:</strong> demo123456
                </p>
              </div>
              <button
                onClick={fillDemoCredentials}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-soft hover:shadow-medium flex items-center justify-center gap-2 group"
              >
                <span>Usar Credenciais Demo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-xs text-blue-700 mt-3 bg-white/30 rounded-lg p-2 flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Novos usuários: acesso imediato após registro
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-strong p-8 border border-white/20 animate-scale-in">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl blur-lg opacity-30 animate-pulse-soft"></div>
              <div className="relative p-4 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-medium">
                <Sprout className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent mb-2">
              Visitas Agrícolas
            </h1>
            <p className="text-gray-600">
              Sistema de gestão de visitas técnicas
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                isLogin
                  ? 'bg-white text-primary-700 shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                !isLogin
                  ? 'bg-white text-primary-700 shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="animate-slide-in-down">
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/50"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/50"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/50"
                  placeholder="Sua senha"
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700 font-medium animate-slide-in-down flex items-start gap-2">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-elevated-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5 border-2"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Entrar' : 'Criar Conta'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-all"
            >
              {isLogin ? 'Criar uma nova conta' : 'Já tenho uma conta'}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-600 text-sm mt-8 px-4">
          Sistema para gestão completa de visitas técnicas em propriedades rurais
        </p>
      </div>
    </div>
  );
}
