import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import FloatingParticles from "@/components/FloatingParticles";
import { Search } from "lucide-react";

import catPoseImage from "@/assets/yoga poses/Cat Pose (Marjariasana).jpeg";
import childPoseImage from "@/assets/yoga poses/Child’s Pose (Balasana).jpeg";
import easyPoseImage from "@/assets/yoga poses/Easy Pose with Prayer (Sukhasana – Anjali Mudra).jpeg";
import garlandPoseImage from "@/assets/yoga poses/Garland Pose with Block (Malasana – supported).jpeg";
import legsUpWallImage from "@/assets/yoga poses/Legs Up the Wall (Viparita Karani).jpeg";
import mountainPoseImage from "@/assets/yoga poses/Mountain Pose (Tadasana).jpeg";
import seatedSpinalTwistImage from "@/assets/yoga poses/Seated Spinal Twist (Ardha Matsyendrasana).jpeg";
import supportedRecliningTwistImage from "@/assets/yoga poses/Supported Reclining Twist (Supta Matsyendrasana – supported variation).jpeg";
import treePoseImage from "@/assets/yoga poses/Tree Pose (Vrikshasana).jpeg";
import trianglePoseImage from "@/assets/yoga poses/Triangle Pose (Trikonasana).jpeg";
import warriorIIPoseImage from "@/assets/yoga poses/Warrior II (Virabhadrasana II).jpeg";
import boundAnglePoseImage from "@/assets/yoga poses/Bound Angle Pose (Baddha Konasana).jpeg";

type PoseEntry = {
  name: string;
  sanskrit: string;
  desc: string;
  image: string;
};

const poses: PoseEntry[] = [
  {
    name: "Warrior II",
    sanskrit: "Virabhadrasana II",
    desc: "A strong standing pose with the arms extended wide and the front knee bent.",
    image: warriorIIPoseImage,
  },
  {
    name: "Triangle Pose",
    sanskrit: "Trikonasana",
    desc: "A long side-body stretch that opens the chest and legs while improving balance.",
    image: trianglePoseImage,
  },
  {
    name: "Tree Pose",
    sanskrit: "Vrikshasana",
    desc: "A balance pose that strengthens the standing leg and supports focus.",
    image: treePoseImage,
  },
  {
    name: "Supported Reclining Twist",
    sanskrit: "Supta Matsyendrasana",
    desc: "A gentle restorative twist with support that keeps the spine relaxed.",
    image: supportedRecliningTwistImage,
  },
  {
    name: "Seated Spinal Twist",
    sanskrit: "Ardha Matsyendrasana",
    desc: "A seated twist that should stay soft and comfortable, without deep compression.",
    image: seatedSpinalTwistImage,
  },
  {
    name: "Mountain Pose",
    sanskrit: "Tadasana",
    desc: "A foundational standing pose for posture, alignment, and calm breathing.",
    image: mountainPoseImage,
  },
  {
    name: "Legs Up the Wall",
    sanskrit: "Viparita Karani",
    desc: "A restorative pose that helps unwind the legs and lower back.",
    image: legsUpWallImage,
  },
  {
    name: "Garland Pose with Block",
    sanskrit: "Malasana",
    desc: "A supported deep squat that opens the hips while keeping the body stable.",
    image: garlandPoseImage,
  },
  {
    name: "Easy Pose with Prayer",
    sanskrit: "Sukhasana - Anjali Mudra",
    desc: "A relaxed seated meditation posture that supports breathing and calm.",
    image: easyPoseImage,
  },
  {
    name: "Child's Pose",
    sanskrit: "Balasana",
    desc: "A restful pose that gently stretches the hips and back with a soft fold.",
    image: childPoseImage,
  },
  {
    name: "Cat Pose",
    sanskrit: "Marjariasana",
    desc: "A gentle spinal movement that helps relieve back tension and improve mobility.",
    image: catPoseImage,
  },
  {
    name: "Bound Angle Pose",
    sanskrit: "Baddha Konasana",
    desc: "A seated hip-opening pose that is useful for gentle prenatal mobility.",
    image: boundAnglePoseImage,
  },
];

const YogaExercises = () => {
  return (
    <div className="min-h-screen relative">
      <FloatingParticles />
      <PageHeader title="Yoga and Exercises" subtitle="Uploaded pose photos matched to the correct labels" />
      <div className="container mx-auto px-4 pb-16 relative">
        <h3 className="text-xl font-heading font-bold text-gradient mb-3">Recommended Yoga Poses</h3>
        <p className="text-sm text-muted-foreground mb-8 max-w-3xl">
          Each card below uses the images from your new assets folder and displays the matching pose name.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid gap-7 md:grid-cols-2 xl:grid-cols-3"
        >
          {poses.map((pose, i) => (
            <motion.div
              key={pose.name}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
              whileHover={{ y: -4 }}
              className="bg-background rounded-3xl shadow-card overflow-hidden group"
            >
              <div className="relative overflow-hidden">
                <motion.div
                  className="w-full h-56 md:h-60 bg-gradient-to-br from-muted/60 to-background"
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.45 }}
                >
                  <img
                    src={pose.image}
                    alt={pose.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 to-transparent pointer-events-none" />
                <motion.div
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100"
                  initial={false}
                  whileHover={{ scale: 1.2 }}
                >
                  <Search className="w-5 h-5 text-foreground" />
                </motion.div>
              </div>

              <div className="p-6 bg-accent-blue/20">
                <h4 className="font-heading font-bold text-lg">
                  {pose.name} {" "}
                  <span className="text-muted-foreground font-normal text-sm">({pose.sanskrit})</span>
                </h4>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{pose.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default YogaExercises;
