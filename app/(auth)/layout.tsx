export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-600/8 blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600/6 blur-[120px]" />
      </div>
      {children}
    </div>
  )
}
