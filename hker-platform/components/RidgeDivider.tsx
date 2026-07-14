// 呼應 HKER Logo 山形線條的分隔線，取代通用的漸層直線，
// 讓品牌識別在每個區塊之間都重複出現。
export default function RidgeDivider({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      className={`ridge-divider ${className}`}
      aria-hidden="true"
    >
      <path
        d="M0,45 C60,20 110,50 170,38 C230,26 270,10 330,15 C390,20 430,45 490,40
           C560,34 600,8 660,12 C720,16 760,42 820,36 C880,30 930,14 990,18
           C1050,22 1090,44 1150,38 C1180,35 1195,30 1200,28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
