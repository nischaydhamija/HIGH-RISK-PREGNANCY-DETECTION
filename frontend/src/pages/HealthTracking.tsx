import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import ECGHeartbeat from "@/components/ECGHeartbeat";
import FloatingParticles from "@/components/FloatingParticles";
import { Info, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { API_BASE_URL, getApiUrl, parseApiJson, readApiResponseMessage } from "../lib/api";

type HistoryEntry = {
  timestamp: string;
  prediction: string;
  parameters: Record<string, number>;
};

const normalizeRiskLabel = (prediction: string) =>
  prediction === "High Risk" ? "High Risk" : "Low Risk";

const fields = [
  { name: "Age", label: "Age", min: 15, max: 49 },
  { name: "G", label: "Gravida", min: 0, max: 10 },
  { name: "P", label: "Para", min: 0, max: 10 },
  { name: "L", label: "Live Births", min: 0, max: 10 },
  { name: "A", label: "Abortions", min: 0, max: 10 },
  { name: "D", label: "Deaths", min: 0, max: 10 },
  { name: "SystolicBP", label: "Systolic BP", min: 70, max: 200 },
  { name: "DiastolicBP", label: "Diastolic BP", min: 40, max: 120 },
  { name: "RBS", label: "Blood Sugar", min: 50, max: 400 },
  { name: "BodyTemp", label: "Body Temp", min: 95, max: 107 },
  { name: "HeartRate", label: "Heart Rate", min: 60, max: 150 },
  { name: "HB", label: "Hemoglobin", min: 7, max: 17 },
  { name: "HBA1C", label: "HBA1C", min: 3, max: 15 },
  { name: "RR", label: "Respiratory Rate", min: 10, max: 40 },
];

const HealthTracking = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submittedValues, setSubmittedValues] = useState<Record<string, number> | null>(null);
  const [submittedTimestamp, setSubmittedTimestamp] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const userRaw = localStorage.getItem("user");
      if (!userRaw) return [];
      const user = JSON.parse(userRaw);
      return Array.isArray(user?.history) ? user.history : [];
    } catch {
      return [];
    }
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const totalSteps = Math.ceil(fields.length / 4);
  const visibleFields = fields.slice(step * 4, step * 4 + 4);

  const getCurrentUserId = () => {
    try {
      const userRaw = localStorage.getItem("user");
      if (!userRaw) return "";
      const user = JSON.parse(userRaw);
      return typeof user?.user_id === "string" ? user.user_id : "";
    } catch {
      return "";
    }
  };

  const loadHistory = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setHistory([]);
      return;
    }

    try {
      setHistoryLoading(true);
      const response = await fetch(getApiUrl(`/history/${encodeURIComponent(userId)}`));
      const responseText = await response.text();
      if (!response.ok) {
        console.warn(readApiResponseMessage(responseText, "Failed to load history"));
        return;
      }

      const data = parseApiJson<{ success?: boolean; history?: HistoryEntry[] }>(responseText);
      if (data.success && Array.isArray(data.history)) {
        setHistory(data.history);
      }
    } catch {
      // Keep UI usable even if history fetch fails.
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const isValid = (name: string) => {
    const field = fields.find(f => f.name === name);
    const val = Number(values[name]);
    return field && values[name] && val >= field.min && val <= field.max;
  };

  const handleSubmit = async () => {
    try {
      const hasMissing = fields.some((field) => !values[field.name] && values[field.name] !== "0");
      if (hasMissing) {
        alert("Please fill all fields before submitting.");
        return;
      }

      const hasInvalid = fields.some((field) => {
        const val = Number(values[field.name]);
        return Number.isNaN(val) || val < field.min || val > field.max;
      });
      if (hasInvalid) {
        alert("Please enter values within the allowed range for all fields.");
        return;
      }

      setResult(null);
      const payload = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, Number(v)])
      );
      const userId = getCurrentUserId();

      const response = await fetch(getApiUrl("/predict"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          ...(userId ? { user_id: userId } : {}),
        }),
      });
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(readApiResponseMessage(responseText, `HTTP ${response.status}`));
      }

      const data = parseApiJson<{ prediction?: string; result?: string; error?: string }>(responseText);

      console.log("API RESPONSE:", data);

      if (data.prediction) {
        setResult(normalizeRiskLabel(data.prediction));
        setSubmittedValues(payload);
        setSubmittedTimestamp(new Date().toISOString());
        loadHistory();
        // Navigate to graph detail page with data
        setTimeout(() => {
          navigate("/graph-detail", {
            state: {
              result: normalizeRiskLabel(data.prediction),
              parameters: payload,
              timestamp: new Date().toISOString(),
            },
          });
        }, 300);
      } else if (data.result) {
        setResult(normalizeRiskLabel(data.result));
        setSubmittedValues(payload);
        setSubmittedTimestamp(new Date().toISOString());
        loadHistory();
        // Navigate to graph detail page with data
        setTimeout(() => {
          navigate("/graph-detail", {
            state: {
              result: normalizeRiskLabel(data.result),
              parameters: payload,
              timestamp: new Date().toISOString(),
            },
          });
        }, 300);
        } else if (data.error) {
          alert("Backend error: " + data.error);
      } else {
        alert("Unexpected response: " + JSON.stringify(data));
      }
    } catch (error) {
      console.error(error);
        alert(error instanceof Error ? error.message : "API failed");
    }
  };

  const handleTrackAgain = () => {
    setResult(null);
    setSubmittedValues(null);
    setSubmittedTimestamp(null);
    setValues({});
    setStep(0);
  };

  const handleViewHistoryEntry = (entry: HistoryEntry) => {
    if (!entry.parameters || Object.keys(entry.parameters).length === 0) {
      return;
    }

    navigate("/graph-detail", {
      state: {
        result: normalizeRiskLabel(entry.prediction),
        parameters: entry.parameters,
        timestamp: entry.timestamp,
      },
    });
  };

  return (
    <div className="min-h-screen relative">
      <FloatingParticles />
      <PageHeader title="Health Tracking" subtitle="Enter your medical information" />
      <div className="container mx-auto px-4 pb-16 max-w-lg relative">
        {/* ECG bg */}
        <div className="absolute inset-x-0 top-0 opacity-10 pointer-events-none">
          <ECGHeartbeat className="h-20" />
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-3 mb-8">
          {Array.from({ length: Math.ceil(fields.length / 4) }).map((_,s) => (
            <motion.div
              key={s}
              className={`rounded-full transition-all ${step === s ? "w-8 h-3 bg-gradient-primary" : "w-3 h-3 bg-secondary"}`}
              layout
            />
          ))}
        </div>

        <motion.p
          className="text-sm text-muted-foreground mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          All fields are validated in real-time
        </motion.p>

        {result && submittedValues ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Prediction:{" "}
                <span className={result === "High Risk" ? "text-red-500" : "text-green-500"}>
                  {result}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Redirecting to detailed graphs...
              </p>
              <motion.div
                className="mt-6 inline-block"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: step === 0 ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="space-y-5"
            >
              {visibleFields.map((field, i) => (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, type: "spring" }}
                >
                  <motion.div
                    className={`relative rounded-xl border-2 transition-all duration-300 ${
                      focusedField === field.name
                        ? "border-primary shadow-glow"
                        : isValid(field.name)
                        ? "border-green-400"
                        : "border-border"
                    }`}
                    whileHover={{ scale: 1.01 }}
                  >
                    <label
                      className={`absolute left-5 transition-all duration-200 pointer-events-none ${
                        focusedField === field.name || values[field.name]
                          ? "top-0 -translate-y-1/2 bg-background px-1 text-xs font-semibold text-primary"
                          : "top-1/2 -translate-y-1/2 text-muted-foreground"
                      }`}
                    >
                      {field.label}
                    </label>
                    <input
                      type="number"
                      value={values[field.name] || ""}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      onFocus={() => setFocusedField(field.name)}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-5 py-4 rounded-xl bg-background text-foreground focus:outline-none"
                      min={field.min}
                      max={field.max}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {isValid(field.name) ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring" }}
                        >
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </motion.div>
                      ) : (
                        <Info className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-1.5 ml-2">
                    Range: {field.min} - {field.max}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            <div className="flex gap-3 mt-10">
              {step > 0 && (
                <motion.button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3.5 rounded-full border-2 border-border font-semibold flex items-center justify-center gap-2 hover:bg-muted transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </motion.button>
              )}
              <motion.button
                onClick={step < totalSteps - 1 ? () => setStep(step + 1) : handleSubmit}
                className="flex-1 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-hero relative overflow-hidden"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-200%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
                <span className="relative">{step < totalSteps - 1 ? "Next" : "Submit"}</span>
                <ArrowRight className="w-4 h-4 relative" />
              </motion.button>
            </div>
          </>
        )}
      </div>

      <div className="container mx-auto px-4 pb-16 max-w-2xl">
        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <h3 className="text-lg font-semibold">Your Submission History</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Every entry you submit while signed in is saved here.
          </p>

          {historyLoading ? (
            <p className="text-sm text-muted-foreground mt-4">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">No entries yet. Submit your first tracking record.</p>
          ) : (
            <div className="mt-4 space-y-3 max-h-[420px] overflow-auto pr-1">
              {history.map((entry, index) => {
                const riskText = normalizeRiskLabel(entry.prediction);
                const timestampLabel = new Date(entry.timestamp).toLocaleString();

                return (
                  <div
                    key={`${entry.timestamp}-${index}`}
                    className="rounded-xl border border-border bg-background/70 px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium">{timestampLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        Parameters captured: {Object.keys(entry.parameters || {}).length}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-semibold ${
                          riskText === "High Risk" ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {riskText}
                      </span>
                      <button
                        onClick={() => handleViewHistoryEntry(entry)}
                        className="text-xs font-medium rounded-lg border border-border px-3 py-1.5 hover:bg-muted transition-colors"
                      >
                        View Graph
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthTracking;
