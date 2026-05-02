import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Footer = () => (
  <footer className="bg-muted/30 border-t mt-20 relative overflow-hidden">
    <div className="absolute inset-0 bg-mesh opacity-30" />
    <div className="container mx-auto px-4 py-14 relative">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <motion.div
              className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center"
              whileHover={{ rotate: [0, -10, 10, 0] }}
            >
              <Heart className="w-4 h-4 text-primary-foreground animate-heartbeat" />
            </motion.div>
            <span className="text-lg font-heading font-bold">Matri<span className="text-gradient">Care</span></span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">Your wellness companion for a healthy pregnancy journey.</p>
        </div>
        <div>
          <h4 className="font-heading font-semibold mb-4">Features</h4>
          <div className="space-y-2.5 text-sm text-muted-foreground">
            {[["Maternal Guide", "/maternal-guide"], ["Diet Plan", "/diet-plan"], ["Yoga & Exercises", "/yoga"]].map(([label, to]) => (
              <motion.div key={to} whileHover={{ x: 4 }}>
                <Link to={to} className="block hover:text-foreground transition-colors">{label}</Link>
              </motion.div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-heading font-semibold mb-4">Resources</h4>
          <div className="space-y-2.5 text-sm text-muted-foreground">
            {[["Do's & Don'ts", "/dos-and-donts"], ["Health Tracking", "/health-tracking"]].map(([label, to]) => (
              <motion.div key={to} whileHover={{ x: 4 }}>
                <Link to={to} className="block hover:text-foreground transition-colors">{label}</Link>
              </motion.div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-heading font-semibold mb-4">Download</h4>
          <p className="text-sm text-muted-foreground">Available on Google Play Store</p>
        </div>
      </div>
      <div className="border-t mt-10 pt-8 text-center text-sm text-muted-foreground">
        © 2026 MatriCare. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
