import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  to: string;
  bgClass: string;
  iconBgClass: string;
  delay?: number;
}

const FeatureCard = ({ icon, title, description, to, bgClass, iconBgClass, delay = 0 }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay, type: "spring", stiffness: 80 }}
    whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.25 } }}
    whileTap={{ scale: 0.98 }}
  >
    <Link to={to} className={`block p-7 rounded-2xl ${bgClass} shadow-card hover:shadow-card-hover transition-all duration-300 h-full group relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
      <motion.div 
        className={`w-16 h-16 rounded-2xl ${iconBgClass} flex items-center justify-center mb-5 relative`}
        whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
      >
        {icon}
      </motion.div>
      <h3 className="font-heading font-bold text-lg mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground mb-5">{description}</p>
      <span className="text-primary text-sm font-semibold inline-flex items-center gap-1.5 group/link">
        Open <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1.5 transition-transform duration-300" />
      </span>
    </Link>
  </motion.div>
);

export default FeatureCard;
