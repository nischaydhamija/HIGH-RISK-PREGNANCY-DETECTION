import PageHeader from "@/components/PageHeader";
import AnimatedSection from "@/components/AnimatedSection";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import dietImage from "@/assets/diet-hero.jpg";
import yogaImage from "@/assets/yoga-hero.jpg";
import heroImage from "@/assets/hero-mother.jpg";

const guides = [
  { title: "Diet Plan", description: "Nutrition guide for you and your baby", image: dietImage, to: "/diet-plan", borderColor: "border-l-green-500", btnColor: "bg-green-100 text-green-700" },
  { title: "Yoga & Exercises", description: "Safe workouts for each trimester", image: yogaImage, to: "/yoga", borderColor: "border-l-blue-500", btnColor: "bg-blue-100 text-blue-700" },
  { title: "Do's and Don'ts", description: "Essential guidelines for a healthy pregnancy", image: heroImage, to: "/dos-and-donts", borderColor: "border-l-purple-500", btnColor: "bg-purple-100 text-purple-700" },
];

const MaternalGuide = () => (
  <div className="min-h-screen">
    <PageHeader title="Maternal Guide" subtitle="Expert guidance for every stage of your journey" />
    <div className="container mx-auto px-4 pb-16 space-y-5">
      {guides.map((g, i) => (
        <AnimatedSection key={g.title} delay={i * 0.15}>
          <motion.div whileHover={{ x: 8, scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 200 }}>
            <Link
              to={g.to}
              className={`flex items-center gap-5 bg-background rounded-2xl shadow-card hover:shadow-card-hover transition-all p-5 border-l-4 ${g.borderColor} group`}
            >
              <motion.img
                src={g.image}
                alt={g.title}
                loading="lazy"
                className="w-24 h-24 rounded-xl object-cover"
                whileHover={{ scale: 1.1, rotate: 2 }}
                transition={{ duration: 0.3 }}
              />
              <div className="flex-1">
                <h3 className="font-heading font-bold text-lg">{g.title}</h3>
                <p className="text-sm text-muted-foreground">{g.description}</p>
              </div>
              <motion.div
                className={`w-11 h-11 rounded-full ${g.btnColor} flex items-center justify-center`}
                whileHover={{ scale: 1.2, rotate: 45 }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </Link>
          </motion.div>
        </AnimatedSection>
      ))}
    </div>
  </div>
);

export default MaternalGuide;
