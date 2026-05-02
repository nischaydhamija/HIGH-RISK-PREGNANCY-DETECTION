import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from "recharts";
import PageHeader from "@/components/PageHeader";
import FloatingParticles from "@/components/FloatingParticles";
import { ArrowLeft } from "lucide-react";

type LocationState = {
  result: string;
  parameters: Record<string, number>;
  timestamp?: string;
};

const fields = [
  { name: "Age", label: "Age", unit: "years", min: 15, max: 49 },
  { name: "G", label: "Gravida", unit: "count", min: 0, max: 10 },
  { name: "P", label: "Para", unit: "count", min: 0, max: 10 },
  { name: "L", label: "Live Births", unit: "count", min: 0, max: 10 },
  { name: "A", label: "Abortions", unit: "count", min: 0, max: 10 },
  { name: "D", label: "Deaths", unit: "count", min: 0, max: 10 },
  { name: "SystolicBP", label: "Systolic BP", unit: "mmHg", min: 70, max: 200 },
  { name: "DiastolicBP", label: "Diastolic BP", unit: "mmHg", min: 40, max: 120 },
  { name: "RBS", label: "Blood Sugar", unit: "mg/dL", min: 50, max: 400 },
  { name: "BodyTemp", label: "Body Temp", unit: "°F", min: 95, max: 107 },
  { name: "HeartRate", label: "Heart Rate", unit: "bpm", min: 60, max: 150 },
  { name: "HB", label: "Hemoglobin", unit: "g/dL", min: 7, max: 17 },
  { name: "HBA1C", label: "HBA1C", unit: "%", min: 3, max: 15 },
  { name: "RR", label: "Respiratory Rate", unit: "breaths/min", min: 10, max: 40 },
];

const GraphDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState | null;

  if (!state || !state.parameters || Object.keys(state.parameters).length === 0) {
    return (
      <div className="min-h-screen">
        <FloatingParticles />
        <PageHeader title="Graph Details" subtitle="Detailed parameter analysis" />
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <p className="text-muted-foreground">No data available. Please go back and submit a health tracking record.</p>
          <motion.button
            onClick={() => navigate("/health-tracking")}
            className="mt-8 py-3 px-6 rounded-full border-2 border-border font-semibold hover:bg-muted transition-colors inline-flex items-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Health Tracking
          </motion.button>
        </div>
      </div>
    );
  }

  const result = state.result;
  const parameters = state.parameters;
  const timestamp = state.timestamp ? new Date(state.timestamp).toLocaleString() : null;

  // Generate trend data for visualization (simulating historical progression)
  const generateTrendData = (value: number, min: number, max: number, label: string) => {
    const range = max - min;
    const normalized = ((value - min) / range) * 100;
    const points = 10;
    const data = [];

    for (let i = 0; i <= points; i++) {
      const progress = i / points;
      const trend = min + range * (normalized / 100) * progress;
      data.push({
        point: i,
        value: Math.round(trend * 100) / 100,
        label: `${i * 10}%`,
      });
    }
    return data;
  };

  return (
    <div className="min-h-screen relative">
      <FloatingParticles />
      <PageHeader title="Graph Details" subtitle="Comprehensive parameter analysis" />

      <div className="container mx-auto px-4 pb-16 max-w-6xl relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="rounded-2xl border border-border bg-card/70 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  Prediction:{" "}
                  <span className={result === "High Risk" ? "text-red-500" : "text-green-500"}>
                    {result}
                  </span>
                </h2>
                {timestamp && <p className="text-sm text-muted-foreground mt-2">Recorded: {timestamp}</p>}
              </div>
              <motion.button
                onClick={() => navigate("/health-tracking")}
                className="py-2 px-4 rounded-full border-2 border-border font-semibold hover:bg-muted transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </motion.button>
            </div>
            <p className="text-sm text-muted-foreground">
              Total Parameters: {Object.keys(parameters).length}
            </p>
          </div>
        </motion.div>

        {/* Grid of graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {fields.map((field, index) => {
            const value = parameters[field.name] ?? 0;
            const trendData = generateTrendData(value, field.min, field.max, field.label);
            const normalizedPercentage = ((value - field.min) / (field.max - field.min)) * 100;
            const isOutOfRange = value < field.min || value > field.max;
            const isNormal =
              field.name === "Age"
                ? value >= 18 && value <= 45
                : field.name === "SystolicBP"
                ? value >= 90 && value <= 140
                : field.name === "DiastolicBP"
                ? value >= 60 && value <= 90
                : field.name === "RBS"
                ? value >= 70 && value <= 100
                : field.name === "BodyTemp"
                ? value >= 97 && value <= 99
                : field.name === "HeartRate"
                ? value >= 60 && value <= 100
                : field.name === "HB"
                ? value >= 12 && value <= 16
                : field.name === "HBA1C"
                ? value <= 5.7
                : field.name === "RR"
                ? value >= 12 && value <= 20
                : true;

            return (
              <motion.div
                key={field.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-border bg-card/70 p-6 overflow-hidden"
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold">{field.label}</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold">{value}</span>
                    <span className="text-sm text-muted-foreground">{field.unit}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Range: {field.min} - {field.max}
                    </p>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        isOutOfRange
                          ? "bg-red-500/20 text-red-500"
                          : isNormal
                          ? "bg-green-500/20 text-green-500"
                          : "bg-yellow-500/20 text-yellow-500"
                      }`}
                    >
                      {isOutOfRange ? "Out of Range" : isNormal ? "Normal" : "Caution"}
                    </span>
                  </div>
                </div>

                {/* Trend Line Chart */}
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={trendData}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                      />
                      <YAxis
                        domain={[field.min, field.max]}
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any) => [
                          `${typeof value === "number" ? value.toFixed(1) : value} ${field.unit}`,
                          field.label,
                        ]}
                        labelFormatter={(label) => `Progress: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--primary))", r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" opacity={0.2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Progress indicator */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Value relative to range</span>
                    <span className="font-semibold">{Math.round(Math.max(0, Math.min(100, normalizedPercentage)))}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        isOutOfRange
                          ? "bg-red-500"
                          : isNormal
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.max(0, Math.min(100, normalizedPercentage))}%`,
                      }}
                      transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 rounded-2xl border border-border bg-card/70 p-6"
        >
          <h3 className="text-lg font-bold mb-4">Parameter Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Parameters Analyzed</p>
              <p className="text-2xl font-bold">{fields.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Risk Assessment</p>
              <p className={`text-2xl font-bold ${result === "High Risk" ? "text-red-500" : "text-green-500"}`}>
                {result}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Back button */}
        <motion.button
          onClick={() => navigate("/health-tracking")}
          className="w-full mt-8 py-3.5 rounded-full border-2 border-border font-semibold hover:bg-muted transition-colors inline-flex items-center justify-center gap-2"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Health Tracking
        </motion.button>
      </div>
    </div>
  );
};

export default GraphDetail;
