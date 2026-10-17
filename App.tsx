
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { generateSpeech } from './services/geminiService';
import { createWavBlob } from './utils/audioUtils';
import { LockScreen } from './components/LockScreen';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { PasswordManagerCard } from './components/PasswordManagerCard';
import { Lock, KeyRound, ShieldCheck } from 'lucide-react';

// --- UI Atom Components ---

const Label: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
);

const Field: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-4">{children}</div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={
      "w-full rounded-md border border-gray-300 bg-white p-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 " +
      (props.className ?? "")
    }
  />
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ loading, ...rest }) => (
  <button
    {...rest}
    className={
      "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all active:scale-[.98] disabled:opacity-50 " +
      "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 " +
      (rest.className ?? "")
    }
  >
    {loading ? (
      <>
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Đang xử lý...
      </>
    ) : rest.children}
  </button>
);

const Card: React.FC<{ children: React.ReactNode; title?: string; desc?: string }> = ({ children, title, desc }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm h-full flex flex-col">
    {title && (
      <div className="mb-3 border-b border-gray-100 pb-2">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {desc && <p className="text-xs text-gray-500">{desc}</p>}
      </div>
    )}
    <div className="flex-grow">{children}</div>
  </div>
);

// --- Constants & Types ---

interface Voice {
  id: string;
  apiId: string;
  name: string;
  description: string;
  type: 'male' | 'female' | 'child' | 'special';
  pitchAdjust?: number;
  speedAdjust?: number;
}

const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'English (US)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'th', name: 'ไทย (Thai)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'ru', name: 'Русский (Russian)' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'tr', name: 'Türkçe (Turkish)' },
  { code: 'nl', name: 'Nederlands (Dutch)' },
  { code: 'pl', name: 'Polski (Polish)' },
  { code: 'sv', name: 'Svenska (Swedish)' },
  { code: 'da', name: 'Dansk (Danish)' },
  { code: 'fi', name: 'Suomi (Finnish)' },
  { code: 'no', name: 'Norsk (Norwegian)' },
  { code: 'el', name: 'Ελληνικά (Greek)' },
  { code: 'cs', name: 'Čeština (Czech)' },
  { code: 'hu', name: 'Magyar (Hungarian)' },
  { code: 'ro', name: 'Română (Romanian)' },
  { code: 'uk', name: 'Українська (Ukrainian)' },
  { code: 'he', name: 'עברית (Hebrew)' },
  { code: 'ms', name: 'Bahasa Melayu (Malay)' },
  { code: 'tl', name: 'Tagalog (Filipino)' },
];

const VI_VOICES: Voice[] = [
  // GIỌNG ĐẶC BIỆT / TÂM LINH
  { id: 'vi-s1', apiId: 'Charon', name: 'Đức Phật (Miền Bắc)', description: 'Giọng đọc từ bi, điềm tĩnh, thoát tục (chuẩn Bắc).', type: 'special', pitchAdjust: -2, speedAdjust: 0.8 },
  { id: 'vi-s2', apiId: 'Puck', name: 'Đức Phật (Miền Nam)', description: 'Giọng đọc từ bi, ấm áp, thoát tục (chuẩn Nam).', type: 'special', pitchAdjust: -1.5, speedAdjust: 0.82 },

  // GIỌNG NỮ (15 giọng)
  { id: 'vi-f1', apiId: 'Kore', name: 'Mai Linh (Hà Nội)', description: 'Giọng nữ chuẩn miền Bắc, truyền cảm.', type: 'female' },
  { id: 'vi-f2', apiId: 'Zephyr', name: 'Ngọc Lan (Sài Gòn)', description: 'Giọng nữ Review Phim chuyên nghiệp.', type: 'female' },
  { id: 'vi-f3', apiId: 'Kore', name: 'Thanh Trúc (Đà Nẵng)', description: 'Giọng nữ miền Trung nhẹ nhàng.', type: 'female' },
  { id: 'vi-f4', apiId: 'Zephyr', name: 'Tú Anh (Thuyết Minh)', description: 'Giọng nữ ấm áp cho phim bộ.', type: 'female' },
  { id: 'vi-f5', apiId: 'Kore', name: 'Bích Phương (Podcast)', description: 'Giọng nữ tâm tình, sâu lắng.', type: 'female' },
  { id: 'vi-f6', apiId: 'Zephyr', name: 'Minh Thư (Bản Tin)', description: 'Giọng nữ thời sự chính luận.', type: 'female' },
  { id: 'vi-f7', apiId: 'Kore', name: 'Hồng Ngọc (Quảng Cáo)', description: 'Giọng nữ năng động, lôi cuốn.', type: 'female' },
  { id: 'vi-f8', apiId: 'Zephyr', name: 'Khánh Ly (Kể Chuyện)', description: 'Giọng đọc truyện đêm khuya.', type: 'female' },
  { id: 'vi-f9', apiId: 'Kore', name: 'Thanh Vân (Giảng Dạy)', description: 'Giọng nữ sư phạm, rõ chữ.', type: 'female' },
  { id: 'vi-f10', apiId: 'Zephyr', name: 'Kim Ngân (Hội Thoại)', description: 'Giọng nữ tự nhiên đời thường.', type: 'female' },
  { id: 'vi-f11', apiId: 'Kore', name: 'Thu Hà (Bắc Ninh)', description: 'Giọng nữ quan họ nhẹ nhàng.', type: 'female' },
  { id: 'vi-f12', apiId: 'Zephyr', name: 'Diệu Nhi (Hài Hước)', description: 'Giọng nữ vui vẻ, tốc độ nhanh.', type: 'female' },
  { id: 'vi-f13', apiId: 'Kore', name: 'Thùy Chi (Trong Trẻo)', description: 'Giọng nữ cao, thanh thoát.', type: 'female' },
  { id: 'vi-f14', apiId: 'Zephyr', name: 'Lan Hương (Báo Chí)', description: 'Giọng nữ đọc báo, tốc độ vừa.', type: 'female' },
  { id: 'vi-f15', apiId: 'Kore', name: 'Phương Thảo (Y tế)', description: 'Giọng nữ điềm tĩnh, an tâm.', type: 'female' },

  // GIỌNG NAM (15 giọng)
  { id: 'vi-m1', apiId: 'Charon', name: 'Hùng Cường (Lực Lưỡng)', description: 'Giọng nam mạnh mẽ, uy lực, trầm dày.', type: 'male' },
  { id: 'vi-m2', apiId: 'Puck', name: 'Minh Quang (Review)', description: 'Giọng nam Review Phim triệu view.', type: 'male' },
  { id: 'vi-m3', apiId: 'Fenrir', name: 'Hoàng Dũng (Trầm Ấm)', description: 'Giọng nam kể chuyện, tâm sự.', type: 'male' },
  { id: 'vi-m4', apiId: 'Puck', name: 'Quốc Anh (Thuyết Minh)', description: 'Giọng nam kể chuyện phim hành động.', type: 'male' },
  { id: 'vi-m5', apiId: 'Charon', name: 'Đức Thành (Thời Sự)', description: 'Giọng nam biên tập viên đài truyền hình.', type: 'male' },
  { id: 'vi-m6', apiId: 'Fenrir', name: 'Văn Nam (Hào Sảng)', description: 'Giọng nam quảng cáo, năng lượng.', type: 'male' },
  { id: 'vi-m7', apiId: 'Puck', name: 'Thanh Sơn (Giảng Viên)', description: 'Giọng nam đĩnh đạc, dễ hiểu.', type: 'male' },
  { id: 'vi-m8', apiId: 'Charon', name: 'Hữu Phước (Thể Thao)', description: 'Giọng bình luận viên bóng đá.', type: 'male' },
  { id: 'vi-m9', apiId: 'Fenrir', name: 'Mạnh Tùng (Podcast)', description: 'Giọng nam sâu sắc cho podcast.', type: 'male' },
  { id: 'vi-m10', apiId: 'Puck', name: 'Gia Huy (Thanh Niên)', description: 'Giọng nam trẻ trung, hiện đại.', type: 'male' },
  { id: 'vi-m11', apiId: 'Charon', name: 'Trọng Hiếu (Kinh Doanh)', description: 'Giọng nam chuyên nghiệp, uy tín.', type: 'male' },
  { id: 'vi-m12', apiId: 'Fenrir', name: 'Quang Thắng (Hài Hước)', description: 'Giọng nam dí dỏm, nhấn nhá.', type: 'male' },
  { id: 'vi-m13', apiId: 'Puck', name: 'Duy Mạnh (Mạnh Mẽ)', description: 'Giọng nam cá tính, quyết liệt.', type: 'male' },
  { id: 'vi-m14', apiId: 'Charon', name: 'Tiến Dũng (Khoa Học)', description: 'Giọng nam đọc tài liệu, chậm rãi.', type: 'male' },
  { id: 'vi-m15', apiId: 'Fenrir', name: 'Bảo Long (Du Lịch)', description: 'Giọng nam cảm hứng, tự do.', type: 'male' },

  // GIỌNG TRẺ EM (10 giọng)
  { id: 'vi-c1', apiId: 'Zephyr', name: 'Bé Bún (Gái Bắc)', description: 'Giọng bé gái miền Bắc hồn nhiên.', type: 'child', pitchAdjust: 8 },
  { id: 'vi-c2', apiId: 'Puck', name: 'Bé Bo (Trai Bắc)', description: 'Giọng bé trai miền Bắc lém lỉnh.', type: 'child', pitchAdjust: 7 },
  { id: 'vi-c3', apiId: 'Kore', name: 'Bé Na (Gái Nam)', description: 'Giọng bé gái miền Nam ngọt ngào.', type: 'child', pitchAdjust: 8 },
  { id: 'vi-c4', apiId: 'Puck', name: 'Bé Tèo (Trai Nam)', description: 'Giọng bé trai miền Nam ngây ngô.', type: 'child', pitchAdjust: 7 },
  { id: 'vi-c5', apiId: 'Zephyr', name: 'Bé Mầm (Gái Trung)', description: 'Giọng bé gái miền Trung đáng yêu.', type: 'child', pitchAdjust: 9 },
  { id: 'vi-c6', apiId: 'Puck', name: 'Bé Sóc (Trai Trung)', description: 'Giọng bé trai miền Trung hoạt bát.', type: 'child', pitchAdjust: 8 },
  { id: 'vi-c7', apiId: 'Kore', name: 'Bé Dâu (Gái Nhỏ)', description: 'Giọng bé gái 4-5 tuổi.', type: 'child', pitchAdjust: 10 },
  { id: 'vi-c8', apiId: 'Puck', name: 'Bé Gấu (Trai Nhỏ)', description: 'Giọng bé trai 4-5 tuổi.', type: 'child', pitchAdjust: 9 },
  { id: 'vi-c9', apiId: 'Zephyr', name: 'Bé Su (Hoạt Hình)', description: 'Giọng nhân vật hoạt hình nhí.', type: 'child', pitchAdjust: 11 },
  { id: 'vi-c10', apiId: 'Puck', name: 'Bé Bi (Kể Chuyện)', description: 'Giọng bé kể chuyện cổ tích.', type: 'child', pitchAdjust: 7.5 },
];

const getVoicesForLanguage = (lang: string): Voice[] => {
  if (lang === 'vi') return VI_VOICES;
  
  const prefix = `(${lang.toUpperCase()}) `;
  return [
    { id: `${lang}-f1`, apiId: 'Kore', name: `${prefix}Female 1`, description: 'Professional female voice.', type: 'female' },
    { id: `${lang}-m1`, apiId: 'Charon', name: `${prefix}Male 1`, description: 'Deep male voice.', type: 'male' },
    { id: `${lang}-c1`, apiId: 'Zephyr', name: `${prefix}Child 1`, description: 'Child voice.', type: 'child', pitchAdjust: 8 },
  ];
};

const SCENARIOS = [
    { name: "Lời Phật Dạy", text: "Này các Tỷ-kheo, hãy tự mình làm ngọn đèn cho chính mình, hãy tự mình nương tựa nơi chính mình, không nương tựa nơi một ai khác. Hãy lấy Chánh pháp làm ngọn đèn, hãy lấy Chánh pháp làm chỗ nương tựa." },
    { name: "Hùng Cường (Mạnh mẽ)", text: "CHÀO MỪNG QUÝ VỊ ĐÃ QUAY TRỞ LẠI! Đây là đấu trường rực lửa nhất năm 2024. Hãy chuẩn bị sẵn sàng cho những màn trình diễn đỉnh cao sắp tới!" },
    { name: "Review Phim", text: "Tập phim hôm nay bắt đầu với một khung cảnh đầy u ám. Nhân vật chính bước ra từ bóng tối, đôi mắt anh ta chứa đầy sự hận thù. Liệu bí mật nào đang chờ đón chúng ta phía trước?" },
    { name: "Kể chuyện bé Bún", text: "Ngày xửa ngày xưa, có một bé thỏ tên là Bún. Bún có bộ lông trắng muốt như bông tuyết và hai cái tai dài lúc nào cũng vểnh lên nghe ngóng..." },
];

const DEFAULT_PASSCODE = '123456';

export default function App() {
  const [passcode, setPasscode] = useState<string>(() => {
    return localStorage.getItem('app_passcode') || DEFAULT_PASSCODE;
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const sessionUnlocked = sessionStorage.getItem('app_unlocked') === 'true';
    const localUnlocked = localStorage.getItem('app_unlocked') === 'true';
    return !sessionUnlocked && !localUnlocked;
  });

  const [isChangePassOpen, setIsChangePassOpen] = useState(false);

  const [text, setText] = useState("");
  const [language, setLanguage] = useState('vi');
  const [voiceId, setVoiceId] = useState<string>('vi-s1');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [isSSML, setIsSSML] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleUnlock = (remember: boolean) => {
    sessionStorage.setItem('app_unlocked', 'true');
    if (remember) {
      localStorage.setItem('app_unlocked', 'true');
    }
    setIsLocked(false);
  };

  const handleLock = () => {
    sessionStorage.removeItem('app_unlocked');
    localStorage.removeItem('app_unlocked');
    setIsLocked(true);
  };

  const handleSaveNewPasscode = (newPass: string) => {
    localStorage.setItem('app_passcode', newPass);
    setPasscode(newPass);
  };

  const handleResetPasscode = () => {
    localStorage.setItem('app_passcode', DEFAULT_PASSCODE);
    setPasscode(DEFAULT_PASSCODE);
  };

  const currentVoices = useMemo(() => getVoicesForLanguage(language), [language]);
  const selectedVoice = useMemo(() => currentVoices.find(v => v.id === voiceId) || currentVoices[0], [voiceId, currentVoices]);

  const handleSynthesize = useCallback(async () => {
    if (!text.trim()) {
      setError("Vui lòng nhập văn bản cần chuyển đổi.");
      return;
    }

    setError(null);
    setLoading(true);
    setAudioUrl(null);

    try {
      let finalPitch = pitch;
      let finalSpeed = speed;

      // Xử lý thông minh cho từng loại giọng
      if (selectedVoice.type === 'child') {
        finalPitch = (selectedVoice.pitchAdjust || 8) + (pitch * 0.5); 
        finalSpeed = speed * 1.08;
      } else if (selectedVoice.type === 'special') {
        finalPitch = (selectedVoice.pitchAdjust || 0) + (pitch * 1);
        finalSpeed = (selectedVoice.speedAdjust || 1) * speed;
      }
      
      const base64Audio = await generateSpeech({
        text,
        voiceId: selectedVoice.apiId,
        speed: isSSML ? 1.0 : finalSpeed,
        pitch: isSSML ? 0 : finalPitch,
        isSSML,
        style: selectedVoice.description,
      });
      const wavBlob = createWavBlob(base64Audio);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);

      setTimeout(() => {
        audioRef.current?.play().catch(console.error);
      }, 100);

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Đã có lỗi xảy ra khi tạo giọng nói.");
    } finally {
      setLoading(false);
    }
  }, [text, selectedVoice, speed, pitch, isSSML]);
  
  const handleDownload = useCallback(() => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `studio_tts_${voiceId}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [audioUrl, voiceId]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const voices = getVoicesForLanguage(newLang);
    setVoiceId(voices[0].id);
  };

  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} expectedPasscode={passcode} />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 font-sans bg-gray-50 min-h-screen">
      {/* Top Security & Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-200/90 shadow-sm text-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-gray-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Đã mở khóa an toàn
          </span>
          <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
            Bảo vệ mã PIN
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('password-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                setIsChangePassOpen(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 rounded-xl font-semibold transition-all border border-indigo-200/80"
            title="Đổi mật khẩu riêng của bạn"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            Thay mật khẩu
          </button>
          <button
            type="button"
            onClick={handleLock}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 rounded-xl font-medium transition-all border border-rose-200/60"
            title="Khóa ứng dụng ngay lập tức"
          >
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            Khóa ứng dụng
          </button>
        </div>
      </div>

      <header className="text-center space-y-2 border-b border-gray-200 pb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
            <span className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-widest shadow-md">Premium</span>
            <span className="bg-amber-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-widest shadow-md">Spiritual Voices Added</span>
            <span className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-widest shadow-md">42 Voices</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-6xl uppercase">
          CHUYỂN VĂN BẢN THÀNH GIỌNG NÓI
        </h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
          Hệ thống Studio AI tích hợp giọng đọc Đức Phật (Bắc - Nam) từ bi, Review Phim sống động và 30 ngôn ngữ toàn cầu.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <Card title="Cấu hình Nhân vật" desc="Chọn giọng đọc và ngôn ngữ">
            <Field>
              <Label htmlFor="lang-select">Quốc gia</Label>
              <Select id="lang-select" value={language} onChange={handleLanguageChange}>
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </Select>
            </Field>
            
            <Field>
              <Label htmlFor="voice-select">Giọng đọc chuyên nghiệp ({currentVoices.length})</Label>
              <Select
                id="voice-select"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="font-medium"
              >
                <optgroup label="Giọng Đặc Biệt / Tâm Linh">
                   {currentVoices.filter(v => v.type === 'special').map(v => (
                      <option key={v.id} value={v.id}>☸️ {v.name}</option>
                   ))}
                </optgroup>
                <optgroup label="Giọng Trẻ Em (Chuẩn AI Pitch)">
                   {currentVoices.filter(v => v.type === 'child').map(v => (
                      <option key={v.id} value={v.id}>👶 {v.name}</option>
                   ))}
                </optgroup>
                <optgroup label="Giọng Nữ Chuyên Nghiệp">
                   {currentVoices.filter(v => v.type === 'female').map(v => (
                      <option key={v.id} value={v.id}>👩 {v.name}</option>
                   ))}
                </optgroup>
                <optgroup label="Giọng Nam Chuyên Nghiệp">
                   {currentVoices.filter(v => v.type === 'male').map(v => (
                      <option key={v.id} value={v.id}>👨 {v.name}</option>
                   ))}
                </optgroup>
              </Select>
              {selectedVoice && (
                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold text-indigo-700 uppercase">Đặc điểm:</span>
                  </div>
                  <p className="text-sm text-indigo-900 leading-snug">
                    {selectedVoice.description}
                  </p>
                </div>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4 pt-2">
               <Field>
                <Label>Tốc độ: {speed.toFixed(1)}x</Label>
                <input type="range" min={0.5} max={2} step={0.1} value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full accent-indigo-600"/>
              </Field>
              <Field>
                <Label>Cao độ: {pitch > 0 ? `+${pitch}` : pitch}</Label>
                <input type="range" min={-10} max={10} step={1} value={pitch} onChange={e => setPitch(parseInt(e.target.value))} className="w-full accent-indigo-600"/>
              </Field>
            </div>
          </Card>

          <Card title="Kịch bản mẫu">
            <div className="grid grid-cols-1 gap-2">
              {SCENARIOS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setText(p.text)}
                  className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-indigo-400 hover:shadow-md transition-all group"
                >
                  <div className="font-black text-[10px] text-indigo-600 mb-1 uppercase tracking-tighter">{p.name}</div>
                  <div className="text-xs text-gray-500 line-clamp-2 italic">"{p.text}"</div>
                </button>
              ))}
            </div>
          </Card>

          <div id="password-section">
            <PasswordManagerCard
              currentPasscode={passcode}
              onSaveNewPasscode={handleSaveNewPasscode}
              onResetToDefault={handleResetPasscode}
              onLockApp={handleLock}
            />
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card title="Soạn thảo nội dung" desc={`${text.length} ký tự`}>
            <textarea
              className="w-full h-[450px] resize-none rounded-xl border border-gray-200 p-8 text-xl leading-relaxed focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 bg-gray-50/50 shadow-inner outline-none transition-all"
              placeholder="Nhập nội dung kịch bản phim, tin tức hoặc lời Phật dạy tại đây..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            
            <div className="mt-6 flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex gap-4">
                <Button onClick={handleSynthesize} disabled={loading || !text.trim()} loading={loading} className="px-12 py-5 rounded-2xl shadow-2xl shadow-indigo-300 text-lg font-black uppercase tracking-wider">
                  BẮT ĐẦU ĐỌC AI
                </Button>
                <Button onClick={handleDownload} disabled={!audioUrl} className="bg-gray-900 hover:bg-black rounded-2xl shadow-xl shadow-gray-300 px-8 text-sm">
                  Tải file (.wav)
                </Button>
              </div>
              {audioUrl && (
                <div className="flex-grow max-w-md bg-indigo-50/50 p-2 rounded-2xl border border-indigo-100">
                  <audio ref={audioRef} src={audioUrl} controls className="w-full h-11" />
                </div>
              )}
            </div>
            {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2">
              <span className="text-lg">⚠️</span> {error}
            </div>}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm text-center border-amber-200 bg-amber-50/30">
               <div className="text-3xl font-black text-amber-600">☸️</div>
               <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Spiritual</div>
             </div>
             <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm text-center">
               <div className="text-3xl font-black text-indigo-600">42</div>
               <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Giọng Việt</div>
             </div>
             <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm text-center">
               <div className="text-3xl font-black text-orange-500">30</div>
               <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Quốc gia</div>
             </div>
             <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm text-center">
               <div className="text-3xl font-black text-pink-500">PRO</div>
               <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Quality</div>
             </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
        currentSavedPasscode={passcode}
        onSaveNewPasscode={handleSaveNewPasscode}
        onResetToDefault={handleResetPasscode}
      />
    </div>
  );
}
