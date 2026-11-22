import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Utensils, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoAccounts = [
    { role: 'Bếp / Bar', user: 'bep_tn', branch: 'Thái Nguyên' },
    { role: 'Bếp Trưởng', user: 'ql_bep_tn', branch: 'Thái Nguyên' },
    { role: 'Quản lý Chi nhánh', user: 'ql_chinhanh_tn', branch: 'Thái Nguyên' },
    { role: 'Kế toán Tổng / Admin', user: 'ketoan_tong', branch: 'Toàn chuỗi' },
    { role: 'Chủ Chuỗi / Ban Giám Đốc', user: 'admin_chu', branch: 'Toàn chuỗi' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await login({ username: username.trim(), password });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(
        error.response?.data?.message || error.message || 'Tài khoản hoặc mật khẩu không đúng'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemo = (u: string) => {
    setUsername(u);
    setPassword('Demo@123456');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-xl shadow-brand-600/30">
          <Utensils className="h-9 w-9" />
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Sen Việt Buffet
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Hệ thống Quản trị Kho Bếp, Nhân sự & Chống Thất Thoát
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Tên đăng nhập
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  className="btn-touch w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                  autoCapitalize="none"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Mật khẩu
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="btn-touch w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-touch w-full mt-2 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Đang đăng nhập...</span>
              ) : (
                <>
                  <span>Đăng Nhập</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Chọn tài khoản Demo nhanh */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Tài khoản trải nghiệm nhanh:
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {demoAccounts.map((item) => (
                <button
                  key={item.user}
                  type="button"
                  onClick={() => handleSelectDemo(item.user)}
                  className="text-left px-2.5 py-1.5 text-xs rounded-md bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 flex justify-between items-center transition-colors"
                >
                  <span className="font-medium text-slate-800">{item.role}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{item.user}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 text-center">
              Mật khẩu mặc định: <span className="font-mono font-semibold">Demo@123456</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
