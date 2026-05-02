import { motion, useScroll, useTransform } from "framer-motion";
import { Heart, BookOpen, BarChart3, Utensils, Dumbbell, ShieldCheck, Activity, ArrowRight, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";
import heroImage from "@/assets/hero-mother.jpg";
import yogaImage from "@/assets/yoga-hero.jpg";
import dietImage from "@/assets/diet-hero.jpg";
import AnimatedSection from "@/components/AnimatedSection";
import FeatureCard from "@/components/FeatureCard";
import ECGHeartbeat from "@/components/ECGHeartbeat";
import FloatingParticles from "@/components/FloatingParticles";

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, type: "spring" } },
};

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero */}
      <section ref={heroRef} className="relative pt-20 min-h-screen flex items-center">
        {/* Animated background */}
        <div className="absolute inset-0 bg-mesh" />
        <FloatingParticles />
        
        {/* Animated blobs */}
        <motion.div
          className="absolute top-20 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-blob"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />

        <div className="container mx-auto px-4 py-12 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div style={{ y: heroY, opacity: heroOpacity }}>
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
              >
                <motion.div
                  className="inline-flex items-center gap-2 bg-secondary/80 backdrop-blur-sm rounded-full px-5 py-2 text-sm font-medium text-secondary-foreground mb-6 shadow-card"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 animate-wiggle" /> Your Wellness Companion
                </motion.div>
              </motion.div>

              <motion.h1
                className="text-5xl md:text-7xl font-heading font-extrabold leading-[1.1] mb-6"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                Matri<span className="text-gradient animate-gradient-shift">Care</span>
              </motion.h1>

              <motion.p
                className="text-lg text-muted-foreground mb-8 max-w-md leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                AI-powered maternal health monitoring, personalized diet plans, yoga guides, and expert wellness programs for every trimester.
              </motion.p>

              {/* ECG Line */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                <ECGHeartbeat className="h-12 opacity-60" />
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link to="/health-tracking">
                  <motion.div
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-hero btn-magnetic relative overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ["-200%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                    <Activity className="w-5 h-5 relative" /> 
                    <span className="relative">Start Tracking</span>
                    <ArrowRight className="w-4 h-4 relative" />
                  </motion.div>
                </Link>
                <Link to="/maternal-guide">
                  <motion.div
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-primary/30 text-foreground font-semibold hover:border-primary hover:bg-secondary transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Explore Guide
                  </motion.div>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                className="flex gap-8 mt-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {[
                  { num: "10K+", label: "Active Users" },
                  { num: "3", label: "Trimesters" },
                  { num: "50+", label: "Yoga Poses" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                  >
                    <p className="text-2xl font-heading font-bold text-gradient">{s.num}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero image */}
            <motion.div
              style={{ scale: heroScale }}
              className="relative"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
                className="relative"
              >
                <div className="relative rounded-3xl overflow-hidden shadow-hero">
                  <img src={heroImage} alt="Happy mother" width={1024} height={1024} className="w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                </div>

                {/* Floating badges */}
                <motion.div
                  className="absolute -bottom-4 -left-4 bg-background/90 backdrop-blur-xl rounded-2xl shadow-card-hover p-4 flex items-center gap-3 border border-white/40"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center">
                    <Heart className="w-5 h-5 text-accent-foreground animate-heartbeat" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm">Health Score</p>
                    <p className="text-xs text-muted-foreground">AI-powered</p>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -top-2 -right-2 bg-background/90 backdrop-blur-xl rounded-xl shadow-card-hover px-4 py-3 border border-white/40"
                  animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                >
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-sm font-bold">4.8 Rating</span>
                  </div>
                </motion.div>

                {/* Pulse circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-20 h-20 rounded-full border-2 border-primary/30 animate-pulse-ring" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="container mx-auto px-4 relative">
          <AnimatedSection className="text-center mb-14">
            <motion.span
              className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mb-4 tracking-wider uppercase"
              whileInView={{ scale: [0.8, 1.05, 1] }}
              viewport={{ once: true }}
            >
              Features
            </motion.span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">Quick Actions</h2>
            <p className="text-muted-foreground text-lg">Access your essentials</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            <FeatureCard
              icon={<BookOpen className="w-7 h-7 text-accent-foreground" />}
              title="Maternal Guide"
              description="Expert guidance & tips for every stage"
              to="/maternal-guide"
              bgClass="bg-accent"
              iconBgClass="bg-accent-foreground/10"
              delay={0}
            />
            <FeatureCard
              icon={<BarChart3 className="w-7 h-7 text-accent-blue-foreground" />}
              title="Health Tracking"
              description="Monitor vitals with AI insights"
              to="/health-tracking"
              bgClass="bg-accent-blue"
              iconBgClass="bg-accent-blue-foreground/10"
              delay={0.1}
            />
            <FeatureCard
              icon={<ShieldCheck className="w-7 h-7 text-accent-purple-foreground" />}
              title="Do's & Don'ts"
              description="Essential guidelines per trimester"
              to="/dos-and-donts"
              bgClass="bg-accent-purple"
              iconBgClass="bg-accent-purple-foreground/10"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Wellness Programs */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-14">
            <motion.span
              className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mb-4 tracking-wider uppercase"
              whileInView={{ scale: [0.8, 1.05, 1] }}
              viewport={{ once: true }}
            >
              Programs
            </motion.span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">Wellness Programs</h2>
            <p className="text-muted-foreground text-lg">Your daily wellness routine</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-7">
            <AnimatedSection delay={0.1}>
              <Link to="/diet-plan" className="block group">
                <motion.div
                  className="relative rounded-3xl overflow-hidden shadow-card"
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                >
                  <img src={dietImage} alt="Healthy diet" loading="lazy" width={800} height={544} className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-7">
                    <motion.div
                      className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-3"
                      whileHover={{ scale: 1.1 }}
                    >
                      Daily
                    </motion.div>
                    <h3 className="text-2xl font-heading font-bold text-primary-foreground">Diet Plan</h3>
                    <p className="text-sm text-primary-foreground/80 mb-3">Healthy meals for you & baby</p>
                    <span className="inline-flex items-center gap-1.5 text-primary-foreground text-sm font-semibold group-hover:gap-3 transition-all">
                      Explore <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </motion.div>
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <Link to="/yoga" className="block group">
                <motion.div
                  className="relative rounded-3xl overflow-hidden shadow-card"
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                >
                  <img src={yogaImage} alt="Prenatal yoga" loading="lazy" width={800} height={544} className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-7">
                    <h3 className="text-2xl font-heading font-bold text-primary-foreground">Yoga & Exercises</h3>
                    <p className="text-sm text-primary-foreground/80 mb-3">Safe workouts for pregnancy</p>
                    <span className="inline-flex items-center gap-1.5 text-primary-foreground text-sm font-semibold group-hover:gap-3 transition-all">
                      Explore <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </motion.div>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Health Monitor Preview */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="bg-gradient-primary rounded-3xl p-10 md:p-16 relative overflow-hidden">
              {/* ECG background */}
              <div className="absolute inset-0 opacity-20">
                <ECGHeartbeat className="h-full" />
              </div>
              <FloatingParticles />
              
              <div className="relative text-center">
                <motion.div
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-foreground/20 mb-6"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Heart className="w-10 h-10 text-primary-foreground animate-heartbeat" />
                </motion.div>

                <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary-foreground mb-5">
                  Track Your Health Today
                </h2>
                <p className="text-primary-foreground/80 mb-10 max-w-lg mx-auto text-lg">
                  AI-powered health monitoring to keep you and your baby safe throughout your pregnancy journey.
                </p>

                <Link to="/health-tracking">
                  <motion.div
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-background text-foreground font-semibold shadow-lg btn-magnetic relative overflow-hidden"
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 60px -10px rgba(0,0,0,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                      animate={{ x: ["-200%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                    />
                    <Activity className="w-5 h-5 relative" /> 
                    <span className="relative">Start Tracking</span>
                    <ArrowRight className="w-4 h-4 relative" />
                  </motion.div>
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};

export default Index;
