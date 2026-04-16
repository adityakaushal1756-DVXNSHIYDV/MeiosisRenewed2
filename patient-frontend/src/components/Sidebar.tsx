import { 
  Home, 
  FileText, 
  Calendar, 
  Pill, 
  Files, 
  Users, 
  MessageSquare, 
  QrCode, 
  Settings,
  X,
  Plus
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Section = 
  | 'home' 
  | 'records' 
  | 'nfc' 
  | 'appointments' 
  | 'medicines' 
  | 'prescriptions' 
  | 'network' 
  | 'messages' 
  | 'myqr' 
  | 'settings';

interface SidebarProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Patient Dashboard', icon: <Home className="w-4 h-4" /> },
  { id: 'records', label: 'My Health Records', icon: <FileText className="w-4 h-4" /> },
  { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
  { id: 'medicines', label: 'Medicines', icon: <Pill className="w-4 h-4" /> },
  { id: 'prescriptions', label: 'Prescriptions', icon: <Files className="w-4 h-4" /> },
  { id: 'network', label: 'Doctor Network', icon: <Users className="w-4 h-4" /> },
  { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'myqr', label: 'My QR', icon: <QrCode className="w-4 h-4" /> },
  { id: 'settings', label: 'Patient Settings', icon: <Settings className="w-4 h-4" /> },
];

export function Sidebar({ currentSection, onSectionChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={cn(
        "fixed z-50 w-[280px] glass-card flex flex-col transition-all duration-300",
        "inset-y-0 left-0 border-r border-wire/10 lg:rounded-none", 
        "xl:top-4 xl:bottom-4 xl:left-4 xl:rounded-[32px] xl:border xl:border-white/10 xl:bg-[#060D15]/95 xl:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_20px_50px_rgba(0,0,0,0.5)] xl:h-[calc(100vh-2rem)]",
        isOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon/20 border border-neon/30 flex items-center justify-center text-neon font-bold text-xl">
              M
            </div>
            <div>
              <p className="text-white font-semibold leading-tight uppercase tracking-wider text-sm">MEIOSIS</p>
              <p className="text-neon text-xs font-semibold">Patient Console</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-mist hover:text-white rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 mb-4">
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neon text-ink font-semibold hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(82,255,157,0.2)]">
            <Plus className="w-5 h-5" />
            Add Appointment
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1 pb-6 scroll-skin">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-[11px] font-semibold uppercase tracking-wider",
                currentSection === item.id 
                  ? "bg-neon text-ink shadow-[0_0_20px_rgba(82,255,157,0.3)]" 
                  : "text-mist hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-wire/10">
          <button className="w-full ghost-btn !py-3">
            MEIOSIS Insights
          </button>
        </div>
      </aside>
    </>
  );
}
