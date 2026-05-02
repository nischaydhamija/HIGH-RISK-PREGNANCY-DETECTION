import { motion } from "framer-motion";

const ECGHeartbeat = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 600 100" className="w-full h-full" preserveAspectRatio="none">
        <motion.path
          d="M0,50 L80,50 L100,50 L120,20 L140,80 L160,10 L180,90 L200,50 L220,50 L280,50 L300,50 L320,20 L340,80 L360,10 L380,90 L400,50 L420,50 L480,50 L500,50 L520,20 L540,80 L560,10 L580,90 L600,50"
          fill="none"
          stroke="hsl(340, 82%, 52%)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-ecg"
        />
        <motion.path
          d="M0,50 L80,50 L100,50 L120,20 L140,80 L160,10 L180,90 L200,50 L220,50 L280,50 L300,50 L320,20 L340,80 L360,10 L380,90 L400,50 L420,50 L480,50 L500,50 L520,20 L540,80 L560,10 L580,90 L600,50"
          fill="none"
          stroke="hsl(340, 82%, 52%)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.2"
        />
      </svg>
    </div>
  );
};

export default ECGHeartbeat;
