import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import TrimesterTabs from "@/components/TrimesterTabs";
import FloatingParticles from "@/components/FloatingParticles";

const recommendations: Record<number, { title: string; desc: string; emoji: string; color: string }[]> = {
  1: [
    { title: "Eat Healthy Foods", desc: "Include fruits, vegetables, whole grains and dairy products", emoji: "🥗", color: "border-l-4 border-green-500" },
    { title: "Take Prenatal Vitamins", desc: "Take folic acid supplements daily", emoji: "💊", color: "border-l-4 border-purple-500" },
    { title: "Stay Hydrated", desc: "Drink plenty of water, coconut water and fresh juices", emoji: "💧", color: "border-l-4 border-orange-400" },
    { title: "Exercise Gently", desc: "Walk, do prenatal yoga or light stretching", emoji: "💙", color: "border-l-4 border-blue-500" },
    { title: "Get Plenty Of Rest", desc: "Take naps and ensure 8 hours of sleep", emoji: "🛏️", color: "border-l-4 border-yellow-500" },
    { title: "Eat Iron-Rich Foods", desc: "Spinach, lentils, beans and fortified cereals", emoji: "🥬", color: "border-l-4 border-green-600" },
  ],
  2: [
    { title: "Increase Calcium", desc: "Dairy, almonds, and leafy greens for bone development", emoji: "🥛", color: "border-l-4 border-blue-400" },
    { title: "Omega-3 Fatty Acids", desc: "Fish, walnuts, and flaxseeds for brain development", emoji: "🐟", color: "border-l-4 border-cyan-500" },
    { title: "High Protein Diet", desc: "Eggs, lean meat, and legumes for growth", emoji: "🥚", color: "border-l-4 border-amber-500" },
    { title: "Vitamin D", desc: "Sunlight exposure and fortified foods", emoji: "☀️", color: "border-l-4 border-yellow-500" },
    { title: "Fiber-Rich Foods", desc: "Whole grains, fruits, and vegetables to prevent constipation", emoji: "🌾", color: "border-l-4 border-green-500" },
  ],
  3: [
    { title: "Small Frequent Meals", desc: "Eat smaller portions more frequently to ease digestion", emoji: "🍽️", color: "border-l-4 border-pink-500" },
    { title: "Iron Supplements", desc: "Prevent anemia with iron-rich foods and supplements", emoji: "💊", color: "border-l-4 border-red-500" },
    { title: "Stay Hydrated", desc: "Essential for amniotic fluid and blood volume", emoji: "💧", color: "border-l-4 border-blue-500" },
    { title: "Healthy Snacks", desc: "Nuts, yogurt, and fruits between meals", emoji: "🥜", color: "border-l-4 border-amber-500" },
    { title: "Limit Salt Intake", desc: "Reduce swelling by limiting sodium", emoji: "🧂", color: "border-l-4 border-gray-400" },
  ],
};

const DietPlan = () => {
  const [trimester, setTrimester] = useState(1);

  return (
    <div className="min-h-screen relative">
      <FloatingParticles />
      <PageHeader title="Diet Plan" subtitle="Nutrition guide for you and your baby" />
      <div className="container mx-auto px-4 pb-16 relative">
        <TrimesterTabs active={trimester} onChange={setTrimester} />
        <motion.div
          className="bg-gradient-primary rounded-2xl py-3.5 px-6 text-primary-foreground font-semibold text-center mb-8 shadow-glow relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
            animate={{ x: ["-200%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
          />
          <span className="relative">Recommendations</span>
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.div
            key={trimester}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            {recommendations[trimester].map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 120 }}
                whileHover={{ x: 6 }}
                className={`bg-background rounded-2xl shadow-card p-5 ${r.color} flex items-start gap-4 group cursor-default`}
              >
                <motion.div
                  className="w-13 h-13 rounded-full bg-muted flex items-center justify-center text-2xl shrink-0"
                  whileHover={{ rotate: [0, -15, 15, 0], scale: 1.2 }}
                  transition={{ duration: 0.4 }}
                >
                  {r.emoji}
                </motion.div>
                <div>
                  <h3 className="font-heading font-bold">{r.title}</h3>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DietPlan;
