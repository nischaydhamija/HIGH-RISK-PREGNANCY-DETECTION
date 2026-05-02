import { motion } from "framer-motion";

interface Props {
  active: number;
  onChange: (n: number) => void;
}

const TrimesterTabs = ({ active, onChange }: Props) => (
  <div className="flex gap-2 mb-6">
    {[1, 2, 3].map((n) => (
      <button
        key={n}
        onClick={() => onChange(n)}
        className={`relative px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
          active === n ? "text-primary-foreground" : "text-muted-foreground border border-border hover:bg-muted"
        }`}
      >
        {active === n && (
          <motion.div
            layoutId="trimesterTab"
            className="absolute inset-0 rounded-full bg-gradient-primary"
            transition={{ type: "spring", duration: 0.4 }}
          />
        )}
        <span className="relative z-10">{n === 1 ? "1st" : n === 2 ? "2nd" : "3rd"} Trimester</span>
      </button>
    ))}
  </div>
);

export default TrimesterTabs;
