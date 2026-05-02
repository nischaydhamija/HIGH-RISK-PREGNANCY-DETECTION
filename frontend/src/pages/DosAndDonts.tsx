import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import TrimesterTabs from "@/components/TrimesterTabs";
import FloatingParticles from "@/components/FloatingParticles";

const data: Record<number, { dos: { title: string; desc: string; emoji: string }[]; donts: { title: string; desc: string; emoji: string }[] }> = {
  1: {
    dos: [
      { title: "Nutrition First", emoji: "🍎", desc: "Focus on balanced meals with protein, fruits, vegetables and whole grains daily" },
      { title: "Stay Active", emoji: "🏃‍♀️", desc: "30 minutes of gentle exercise like walking or swimming 3-5 times weekly" },
      { title: "Hydrate Well", emoji: "💧", desc: "Drink 8-10 glasses of water, herbal teas and fresh juices daily" },
      { title: "Prioritize Sleep", emoji: "🛏️", desc: "Aim for 8 hours nightly, with afternoon rest periods" },
      { title: "Take Vitamins", emoji: "💊", desc: "Start prenatal vitamins with folic acid immediately" },
    ],
    donts: [
      { title: "Avoid Alcohol", emoji: "🚫", desc: "No amount of alcohol is considered safe during pregnancy" },
      { title: "No Smoking", emoji: "🚭", desc: "Smoking increases risk of premature birth and low birth weight" },
      { title: "Limit Caffeine", emoji: "☕", desc: "Keep caffeine intake below 200mg per day" },
      { title: "Avoid Raw Fish", emoji: "🐟", desc: "Raw sushi and undercooked seafood may contain harmful bacteria" },
      { title: "No Hot Tubs", emoji: "🛁", desc: "High temperatures can be harmful to the developing baby" },
    ],
  },
  2: {
    dos: [
      { title: "Monitor Weight", emoji: "⚖️", desc: "Track healthy weight gain with your doctor's guidance" },
      { title: "Dental Care", emoji: "🦷", desc: "Visit the dentist — pregnancy hormones can affect gum health" },
      { title: "Stay Social", emoji: "👥", desc: "Maintain social connections and join prenatal groups" },
      { title: "Kegel Exercises", emoji: "💪", desc: "Strengthen pelvic floor muscles for labor preparation" },
    ],
    donts: [
      { title: "Avoid Heavy Lifting", emoji: "🏋️", desc: "Don't lift more than 10kg to protect your back and abdomen" },
      { title: "No Lying Flat", emoji: "🛌", desc: "After 20 weeks, sleep on your side instead of your back" },
      { title: "Skip Deli Meats", emoji: "🥩", desc: "Unless heated to steaming to kill potential listeria" },
    ],
  },
  3: {
    dos: [
      { title: "Pack Hospital Bag", emoji: "🧳", desc: "Prepare essentials by week 36 for a stress-free delivery" },
      { title: "Practice Breathing", emoji: "🧘", desc: "Learn relaxation techniques for labor and delivery" },
      { title: "Rest Often", emoji: "😴", desc: "Take breaks frequently and elevate your feet" },
      { title: "Stay Nourished", emoji: "🥑", desc: "Small, frequent meals to manage heartburn and energy" },
    ],
    donts: [
      { title: "Avoid Long Trips", emoji: "✈️", desc: "Stay close to your hospital after 36 weeks" },
      { title: "Don't Ignore Signs", emoji: "⚠️", desc: "Report unusual symptoms to your doctor immediately" },
      { title: "No Strenuous Exercise", emoji: "🏃", desc: "Switch to gentle walks and stretching only" },
    ],
  },
};

const DosAndDonts = () => {
  const [trimester, setTrimester] = useState(1);
  const [tab, setTab] = useState<"dos" | "donts">("dos");

  return (
    <div className="min-h-screen relative">
      <FloatingParticles />
      <PageHeader title="Do's and Don'ts" subtitle="Key tips for a healthy pregnancy" />
      <div className="container mx-auto px-4 pb-16 relative">
        <TrimesterTabs active={trimester} onChange={setTrimester} />
        <div className="flex border-b border-border/50 mb-8">
          {(["dos", "donts"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex-1 py-3.5 text-center font-heading font-semibold text-sm transition-colors ${
                tab === t ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {t === "dos" ? "✅ Do's" : "❌ Don'ts"}
              {tab === t && (
                <motion.div layoutId="dosTab" className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-gradient-primary" />
              )}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${trimester}-${tab}`}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {data[trimester][tab].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: tab === "dos" ? -20 : 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 120 }}
                whileHover={{ x: 6 }}
                className="bg-background rounded-2xl shadow-card p-5 flex items-start gap-4 group cursor-default"
              >
                <motion.div
                  className="w-13 h-13 rounded-full bg-secondary flex items-center justify-center text-2xl shrink-0"
                  whileHover={{ scale: 1.3, rotate: 15 }}
                >
                  {item.emoji}
                </motion.div>
                <div>
                  <h3 className="font-heading font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DosAndDonts;
