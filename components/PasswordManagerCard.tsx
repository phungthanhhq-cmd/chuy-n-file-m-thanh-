import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Eye, EyeOff, Check, AlertCircle, RotateCcw, Lock } from 'lucide-react';

interface PasswordManagerCardProps {
  currentPasscode: string;
  onSaveNewPasscode: (newPass: string) => void;
  onResetToDefault: () => void;
  onLockApp: () => void;
}

export const PasswordManagerCard: React.FC<PasswordManagerCardProps> = ({
  currentPasscode,
  onSaveNewPasscode,
  onResetToDefault,
  onLockApp,
}) => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isCustomPasscode = currentPasscode !== '123456';

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (oldPass !== currentPasscode) {
      setErrorMsg('Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại!');
      return;
    }

    if (!newPass || newPass.trim().length < 4) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 4 ký tự!');
      return;
    }

    if (newPass !== confirmPass) {
      setErrorMsg('Xác nhận mật khẩu mới không trùng khớp!');
      return;
    }

    onSaveNewPasscode(newPass.trim());
    setSuccessMsg('Đã cập nhật mật khẩu riêng của bạn thành công trên thiết bị này!');
    setOldPass('');
    setNewPass('');
    setConfirmPass('');

    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn đặt lại mật khẩu về mặc định gốc không?')) {
      onResetToDefault();
      setSuccessMsg('Đã khôi phục về mật mã gốc ban đầu!');
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Thay Mật Khẩu Riêng</h3>
            <p className="text-[11px] text-gray-500">Mỗi người dùng lưu mật khẩu riêng trên máy này</p>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
            isCustomPasscode
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          {isCustomPasscode ? 'Mật khẩu riêng' : 'Mật khẩu gốc'}
        </span>
      </div>

      {/* Info message */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
        💡 <strong>Mật khẩu độc lập:</strong> Bạn có thể tự đổi sang mật khẩu của riêng mình. Hệ thống lưu riêng trên trình duyệt này mà không ảnh hưởng tới người dùng khác.
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleUpdate} className="space-y-3">
        {/* Old Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Mật khẩu hiện tại
          </label>
          <div className="relative">
            <input
              type={showOldPass ? 'text' : 'password'}
              inputMode="numeric"
              placeholder="••••••"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono pr-10 bg-gray-50/50"
            />
            <button
              type="button"
              onClick={() => setShowOldPass(!showOldPass)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Mật khẩu mới của bạn
          </label>
          <div className="relative">
            <input
              type={showNewPass ? 'text' : 'password'}
              inputMode="numeric"
              placeholder="••••••"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono pr-10 bg-gray-50/50"
            />
            <button
              type="button"
              onClick={() => setShowNewPass(!showNewPass)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <input
              type={showConfirmPass ? 'text' : 'password'}
              inputMode="numeric"
              placeholder="••••••"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono pr-10 bg-gray-50/50"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <KeyRound className="w-4 h-4" />
            Lưu Mật Khẩu Riêng Của Bạn
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 p-1 hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Khôi phục mặc định
            </button>

            <button
              type="button"
              onClick={onLockApp}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 p-1 hover:underline"
            >
              <Lock className="w-3.5 h-3.5" />
              Khóa ứng dụng
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
