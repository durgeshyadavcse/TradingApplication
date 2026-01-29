export default function SkeletonCard({ height = 64, lines = 3, className = '' }) {
  const lineArray = Array.from({ length: lines })
  return (
    <div className={`rounded-xl bg-[#0b1220] border border-white/6 p-4 ${className}`}> 
      <div className="skeleton rounded-md" style={{height: height}}></div>
      <div className="mt-3 space-y-2">
        {lineArray.map((_, i) => (
          <div key={i} className="skeleton rounded-full h-3" style={{ width: `${80 - i * 15}%` }}></div>
        ))}
      </div>
    </div>
  )
}
