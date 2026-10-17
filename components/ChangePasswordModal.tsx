import React, { useState } from 'react';
import { KeyRound, Check, X, ShieldAlert, RotateCcw } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSavedPasscode: string;
  onSaveNewPasscode: (newPass: string) => void;
  onResetToDefault: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentSavedPasscode,
  onSaveNewPasscode,
  onResetToDefault,
}) => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (oldPass !== currentSavedPasscode) {
      setError('Mật khẩu hiện tại không chính xác!');
      return;
    }

    if (!newPass || newPass.trim().length < 4) {
      setError('Mật khẩu mới phải có ít nhất 4 ký tự!');
      return;
    }

    if (newPass !== confirmPass) {
      setError('Xác nhận mật khẩu mới không khớp!');
      return;
    }

    onSaveNewPasscode(newPass.trim());
    setSuccess('Đã đổi mật khẩu thành công!');
    setTimeout(() => {
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      setSuccess(null);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn đặt lại mật mã về mặc định không?')) {
      onResetToDefault();
      setSuccess('Đã khôi phục mật mã mặc định thành công!');
      setTimeout(() => {
        setOldPass('');
        setNewPass('');
        setConfirmPass('');
        setSuccess(null);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Đổi Mật Khẩu Ứng Dụng</h2>
            <p className="text-xs text-gray-500">Mã PIN bảo mật truy cập</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••••"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Mật khẩu mới
            </label>
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••••"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••••"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              Lưu mật khẩu mới
            </button>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 p-1 hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Khôi phục mã PIN gốc
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium p-1"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
