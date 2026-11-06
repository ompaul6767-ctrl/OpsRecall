import { motion } from "framer-motion";
import { ArrowLeft, CircleOff, Orbit } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";

export default function NotFound() {
  return <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 48, repeat: Infinity, ease: "linear" }} className="relative flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-blue-300"><Orbit className="absolute text-blue-300" size={54} strokeWidth={.8} /><CircleOff size={23} className="text-slate-500" /></motion.div><p className="mt-6 font-mono text-5xl font-semibold tracking-[-.08em] text-slate-700">404</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">This route is off the map</h1><p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">The page you requested doesn't exist in this workspace. Let's get you back to the signal.</p><Link to="/" className="mt-6"><Button><ArrowLeft size={16} />Back to analysis</Button></Link></div>;
}
