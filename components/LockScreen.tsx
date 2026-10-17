import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, AlertCircle, Delete } from 'lucide-react';

interface LockScreenProps {
  onUnlock: (remember: boolean) => void;
  expectedPasscode: string;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, expectedPasscode }) => {
  const [inputVal, setInputVal] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => setShake(false), 600);
    setInputVal('');
  };

  const handleVerify = (valToTest: string) => {
    if (valToTest === expectedPasscode) {
      setIsSuccess(true);
      setErrorMsg(null);
      setTimeout(() => {
        onUnlock(rememberDevice);
      }, 500);
    } else {
      triggerError('Mật khẩu không chính xác! Vui lòng thử lại.');
    }
  };

  const handleKeypadPress = (char: string) => {
    if (isSuccess) return;
    setErrorMsg(null);
    if (inputVal.length < 12) {
      const nextVal = inputVal + char;
      setInputVal(nextVal);
      if (nextVal.length === expectedPasscode.length) {
        handleVerify(nextVal);
      }
    }
  };

  const handleBackspace = () => {
    if (isSuccess) return;
    setErrorMsg(null);
    setInputVal((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isSuccess) return;
    setErrorMsg(null);
    setInputVal('');
    inputRef.current?.focus();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal) {
      triggerError('Vui lòng nhập mật khẩu.');
      return;
    }
    handleVerify(inputVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 select-none overflow-y-auto">
      <div
        className={`w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 transition-transform duration-300 ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Header Icon */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center mb-3">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                isSuccess
                  ? 'bg-emerald-500 text-white scale-110 shadow-emerald-500/30'
                  : 'bg-indigo-600 text-white shadow-indigo-500/30'
              }`}
            >
              {isSuccess ? <Unlock className="w-8 h-8 animate-pulse" /> : <Lock className="w-8 h-8" />}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 rounded-full p-1 shadow">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Khóa Bảo Vệ Ứng Dụng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ứng dụng Chuyển Văn Bản Thành Giọng Nói AI
          </p>
        </div>

        {/* Instruction Banner - No visible passcode displayed */}
        <div className="mb-6 py-2.5 px-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-center">
          <p className="text-xs font-semibold text-slate-600">
            Vui lòng nhập mã PIN bảo mật để mở khóa
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success notification */}
        {isSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Mật khẩu chính xác! Đang mở khóa...</span>
          </div>
        )}

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-3 mb-5">
          {Array.from({ length: 6 }).map((_, index) => {
            const hasChar = index < inputVal.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  hasChar
                    ? isSuccess
                      ? 'bg-emerald-500 scale-125 ring-4 ring-emerald-100'
                      : 'bg-indigo-600 scale-125 ring-4 ring-indigo-100'
                    : 'bg-slate-200 border border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {/* Input box for physical typing & paste */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={12}
              value={inputVal}
              onChange={(e) => {
                const val = e.target.value.replace(/\s+/g, '');
                setInputVal(val);
                setErrorMsg(null);
                if (val === expectedPasscode) {
                  handleVerify(val);
                }
              }}
              placeholder="••••••"
              className="w-full text-center text-lg font-mono tracking-widest py-3 px-10 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(String(num))}
                className="h-12 rounded-2xl bg-slate-100/90 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 text-xl font-bold text-slate-700 transition-all border border-slate-200/60 shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-2xl bg-slate-100/60 hover:bg-rose-50 hover:text-rose-600 active:scale-95 text-xs font-bold text-slate-500 uppercase tracking-wider transition-all border border-slate-200/60"
            >
              Xóa hết
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="h-12 rounded-2xl bg-slate-100/90 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 text-xl font-bold text-slate-700 transition-all border border-slate-200/60 shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-2xl bg-slate-100/60 hover:bg-slate-200 active:scale-95 text-slate-600 flex items-center justify-center transition-all border border-slate-200/60"
              aria-label="Xóa 1 ký tự"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Remember device checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span>Ghi nhớ thiết bị này</span>
            </label>
            <span className="text-[11px] text-slate-400">Bảo mật cao</span>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSuccess || !inputVal}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold text-base shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Unlock className="w-5 h-5" />
            Mở Khóa Ứng Dụng
          </button>
        </form>
      </div>
    </div>
  );
};
