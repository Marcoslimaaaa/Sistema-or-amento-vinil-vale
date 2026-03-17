import { motion, useAnimation } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

// ── MessageCircle (WhatsApp) ──────────────────────────────────────────────────
const msgVariants = {
  normal: { scale: 1, rotate: 0 },
  animate: {
    scale: 1.1,
    rotate: [0, -8, 8, 0],
    transition: { rotate: { duration: 0.5, ease: "easeInOut" }, scale: { type: "spring", stiffness: 400, damping: 10 } },
  },
};
export const MessageCircleIcon = forwardRef(({ size = 16, color = "currentColor", ...props }, ref) => {
  const controls = useAnimation();
  const controlled = useRef(false);
  useImperativeHandle(ref, () => { controlled.current = true; return { startAnimation: () => controls.start("animate"), stopAnimation: () => controls.start("normal") }; });
  return (
    <motion.svg onMouseEnter={() => { if (!controlled.current) controls.start("animate"); }} onMouseLeave={() => { if (!controlled.current) controls.start("normal"); }} animate={controls} variants={msgVariants} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}} {...props}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </motion.svg>
  );
});
MessageCircleIcon.displayName = "MessageCircleIcon";

// ── FileText (PDF) ────────────────────────────────────────────────────────────
const fileContainerVariants = { normal: { scale: 1 }, animate: { scale: 1.05, transition: { duration: 0.3, ease: "easeOut" } } };
const fileLineVariants = (delay) => ({
  normal: { pathLength: 1, x: 0 },
  animate: { pathLength: [1, 0, 1], x: [0, -3, 0], transition: { duration: 0.7, delay, ease: "easeInOut" } },
});
export const FileTextIcon = forwardRef(({ size = 16, color = "currentColor", ...props }, ref) => {
  const controls = useAnimation();
  const controlled = useRef(false);
  useImperativeHandle(ref, () => { controlled.current = true; return { startAnimation: () => controls.start("animate"), stopAnimation: () => controls.start("normal") }; });
  return (
    <motion.svg onMouseEnter={() => { if (!controlled.current) controls.start("animate"); }} onMouseLeave={() => { if (!controlled.current) controls.start("normal"); }} animate={controls} variants={fileContainerVariants} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}} {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <motion.path d="M10 9H8" variants={fileLineVariants(0.3)} />
      <motion.path d="M16 13H8" variants={fileLineVariants(0.5)} />
      <motion.path d="M16 17H8" variants={fileLineVariants(0.7)} />
    </motion.svg>
  );
});
FileTextIcon.displayName = "FileTextIcon";

// ── Check (Fechou / Confirmar) ────────────────────────────────────────────────
const checkVariants = {
  normal: { opacity: 1, pathLength: 1, scale: 1, transition: { duration: 0.3 } },
  animate: { opacity: [0, 1], pathLength: [0, 1], scale: [0.5, 1], transition: { duration: 0.4 } },
};
export const CheckIcon = forwardRef(({ size = 16, color = "currentColor", ...props }, ref) => {
  const controls = useAnimation();
  const controlled = useRef(false);
  useImperativeHandle(ref, () => { controlled.current = true; return { startAnimation: () => controls.start("animate"), stopAnimation: () => controls.start("normal") }; });
  return (
    <motion.svg onMouseEnter={() => { if (!controlled.current) controls.start("animate"); }} onMouseLeave={() => { if (!controlled.current) controls.start("normal"); }} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}} {...props}>
      <motion.path d="M4 12 9 17L20 6" animate={controls} variants={checkVariants} />
    </motion.svg>
  );
});
CheckIcon.displayName = "CheckIcon";

// ── Download ──────────────────────────────────────────────────────────────────
const arrowVariants = { normal: { y: 0 }, animate: { y: 2, transition: { type: "spring", stiffness: 200, damping: 10, mass: 1 } } };
export const DownloadIcon = forwardRef(({ size = 16, color = "currentColor", ...props }, ref) => {
  const controls = useAnimation();
  const controlled = useRef(false);
  useImperativeHandle(ref, () => { controlled.current = true; return { startAnimation: () => controls.start("animate"), stopAnimation: () => controls.start("normal") }; });
  return (
    <motion.svg onMouseEnter={() => { if (!controlled.current) controls.start("animate"); }} onMouseLeave={() => { if (!controlled.current) controls.start("normal"); }} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <motion.g animate={controls} variants={arrowVariants}>
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </motion.g>
    </motion.svg>
  );
});
DownloadIcon.displayName = "DownloadIcon";

// ── Send (Enviar) ─────────────────────────────────────────────────────────────
const sendVariants = {
  normal: { x: 0, y: 0 },
  animate: { x: [0, 3, 0], y: [0, -3, 0], transition: { duration: 0.4, ease: "easeInOut" } },
};
export const SendIcon = forwardRef(({ size = 16, color = "currentColor", ...props }, ref) => {
  const controls = useAnimation();
  const controlled = useRef(false);
  useImperativeHandle(ref, () => { controlled.current = true; return { startAnimation: () => controls.start("animate"), stopAnimation: () => controls.start("normal") }; });
  return (
    <motion.svg onMouseEnter={() => { if (!controlled.current) controls.start("animate"); }} onMouseLeave={() => { if (!controlled.current) controls.start("normal"); }} animate={controls} variants={sendVariants} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}} {...props}>
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
      <path d="m21.854 2.147-10.94 10.939" />
    </motion.svg>
  );
});
SendIcon.displayName = "SendIcon";
