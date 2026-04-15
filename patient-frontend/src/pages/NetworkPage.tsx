import { Link, FileOutput, ShieldPlus, MessageSquare, Calendar } from 'lucide-react';

export function NetworkPage() {
  return (
    <div className="p-6 md:p-8 animate-[page-enter_0.4s_ease-out_forwards] max-w-7xl mx-auto h-full flex flex-col">
      <header className="mb-6 mt-2 shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Doctor Network</h1>
        <p className="text-mist">Connected care team and referral control</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Current Care Team', val: '3', sub: 'Active follow-up' },
          { label: 'Connected Doctors', val: '5', sub: 'Profiles linked' },
          { label: 'Referral Requests', val: '1', sub: 'Pending approval' },
        ].map((item, i) => (
          <div key={i} className="glass-card p-5 border border-wire/10 border-t-sky/30 text-center">
            <h3 className="text-3xl font-bold text-white mb-1">{item.val}</h3>
            <p className="text-sm font-medium text-white">{item.label}</p>
            <p className="text-xs text-mist mt-1">{item.sub}</p>
          </div>
        ))}
        
        <div className="glass-card p-5 border border-neon/30 bg-neon/5 hover:bg-neon/10 transition-colors cursor-pointer flex flex-col justify-center items-center text-center group">
          <ShieldPlus className="w-6 h-6 text-neon mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-bold text-white mb-1">Second Opinion</h3>
          <p className="text-xs text-mist">Request specialist review</p>
        </div>
      </div>

      <div className="glass-card p-6 border border-wire/10 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="section-title">Your Doctors</h2>
            <p className="text-mist text-sm">Ratings, availability, and quick actions in one place.</p>
          </div>
          <button className="action-btn !py-2 !px-4">Add Personal Doctor</button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: 'Dr. Sarah Mitchell', role: 'General Medicine', exp: '12', hospital: 'City General' },
            { name: 'Dr. Arjun Rao', role: 'Cardiology', exp: '18', hospital: 'MEIOSIS Premium' },
            { name: 'Dr. Emily Chen', role: 'Endocrinology', exp: '8', hospital: 'City General' }
          ].map((doc, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-wire/10 hover:border-wire/20 transition-all flex flex-col sm:flex-row gap-5">
              <div className="w-16 h-16 rounded-full bg-sky/10 border border-sky/20 flex items-center justify-center text-xl font-bold text-sky shrink-0">
                {doc.name.split(' ')[1][0]}{doc.name.split(' ')[2]?.[0] || doc.name.split(' ')[1][1]}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-bold text-white">{doc.name}</h3>
                  <span className="text-xs text-neon font-bold flex items-center gap-1">★ 4.9</span>
                </div>
                <p className="text-sm text-sky mb-2">{doc.role}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-xs text-mist">
                  <span className="flex items-center gap-1"><FileOutput className="w-3.5 h-3.5" /> {doc.exp} yrs exp</span>
                  <span className="flex items-center gap-1"><Link className="w-3.5 h-3.5" /> {doc.hospital}</span>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 ghost-btn !py-1.5 !px-3 font-medium text-xs flex justify-center items-center gap-2 group">
                    <MessageSquare className="w-3.5 h-3.5 text-mist group-hover:text-white" /> Message
                  </button>
                  <button className="flex-1 ghost-btn !py-1.5 !px-3 font-medium text-xs flex justify-center items-center gap-2 group">
                    <Calendar className="w-3.5 h-3.5 text-mist group-hover:text-white" /> Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
