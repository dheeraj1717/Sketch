"use client";
import { Zap, Users, Maximize, Check, ArrowRight, PenTool, Layout, Share2 } from "lucide-react";
import CTAButtons from "../components/CTAButtons";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import Link from "next/link";
import InforCard from "./_ui/InforCard";

const featureCards = [
  {
    id: 1,
    icon: Zap,
    title: "Lightning Fast",
    description: "Zero-lag engine optimized for instant collaboration.",
    color: "from-yellow-400 to-orange-500"
  },
  {
    id: 2,
    icon: Users,
    title: "Team Sync",
    description: "Work together seamlessly in real-time.",
    color: "from-blue-400 to-cyan-500"
  },
  {
    id: 3,
    icon: Maximize,
    title: "Infinite & Free",
    description: "Limitless canvas for your limitless ideas.",
    color: "from-purple-400 to-pink-500"
  },
];

const useCases = [
  {
    title: "Design",
    icon: PenTool,
    description: "Wireframing & Prototyping",
    color: "text-purple-600 border-purple-200 bg-purple-50"
  },
  {
    title: "Education",
    icon: Layout,
    description: "Interactive Whiteboards",
    color: "text-blue-600 border-blue-200 bg-blue-50"
  },
  {
    title: "Strategy",
    icon: Share2,
    description: "Flowcharts & Planning",
    color: "text-green-600 border-green-200 bg-green-50"
  },
];

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD] selection:bg-purple-200">
      
      {/* Background Dot Pattern */}
      <div className="fixed inset-0 z-0 opacity-[0.4]" 
           style={{ 
             backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', 
             backgroundSize: '24px 24px' 
           }}>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 overflow-hidden">
        {/* Parallax Blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-300/40 rounded-full blur-[100px] mix-blend-multiply animate-blob"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
          />

          <div 
            className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-300/40 rounded-full blur-[120px] mix-blend-multiply animate-blob"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          />
          <div 
            className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-pink-300/40 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          
          {/* Creative Logo Reveal */}
          <div className="mb-12 relative inline-flex group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative w-24 h-24 bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] flex items-center justify-center shadow-2xl transform group-hover:rotate-6 transition-all duration-500">
               <svg className="w-12 h-12 text-purple-600 fill-current" viewBox="0 0 24 24">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
              </svg>
            </div>
            {/* Decoration */}
            <div className="absolute -top-4 -right-4 text-4xl animate-bounce delay-700">✨</div>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.9]">
            Think <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 animate-gradient-x">
              Outside the Box
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
             The ultimate collaborative whiteboard for fast-moving teams. 
             <span className="text-purple-600 font-bold mx-2">No limits.</span>
             <span className="text-blue-500 font-bold">Just creativity.</span>
          </p>

          <div className="transform hover:scale-105 transition-transform duration-300 w-full flex justify-center">
            <CTAButtons />
          </div>

          {/* Floating UI Elements Mockup (CSS only) */}
          <div className="mt-20 relative max-w-4xl mx-auto hidden md:block" style={{ transform: `perspective(1000px) rotateX(10deg) translateY(${scrollY * -0.1}px)` }}>
              <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/40 shadow-2xl p-4 h-[300px] flex items-center justify-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,transparent)]" />
                 <div className="text-slate-400 font-mono text-sm">Interactive Canvas Preview</div>
                 
                 {/* Floating cursors simulated */}
                 <div className="absolute top-1/3 left-1/4 flex flex-col items-center animate-pulse">
                    <PenTool className="text-purple-500 w-6 h-6 rotate-[-12deg]" />
                    <div className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full mt-1">Sarah</div>
                 </div>
                 <div className="absolute bottom-1/3 right-1/4 flex flex-col items-center animate-pulse delay-500">
                    <PenTool className="text-blue-500 w-6 h-6 rotate-[12deg]" />
                    <div className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full mt-1">Mike</div>
                 </div>
              </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Creative Layout */}
      <section className="relative py-32 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {featureCards.map((card, idx) => (
              <div 
                key={card.id}
                className="group relative bg-white rounded-3xl p-1 overflow-hidden hover:-translate-y-2 transition-transform duration-300 shadow-xl shadow-slate-200/50"
              >
                {/* Gradient Border */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="relative bg-white h-full rounded-[1.4rem] p-8 flex flex-col items-start justify-between">
                   <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:rotate-12 transition-transform duration-300`}>
                     <card.icon size={28} strokeWidth={2.5} />
                   </div>
                   <div>
                     <h3 className="text-2xl font-bold text-slate-900 mb-2">{card.title}</h3>
                     <p className="text-slate-500 font-medium leading-relaxed">{card.description}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases - Tilted Cards */}
      <section className="relative py-20 pb-32 z-10 overflow-hidden">
         <div className="absolute inset-0 bg-slate-50 -skew-y-3 z-0 transform origin-left scale-110"></div>
         <div className="relative z-10 max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-extrabold text-center mb-16 text-slate-800">
              Built for <span className="text-purple-600 underline decoration-wavy">Everyone</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
               {useCases.map((useCase, i) => (
                 <div key={i} className={`flex items-center gap-4 px-8 py-4 rounded-full border-2 bg-white shadow-sm hover:shadow-lg hover:scale-105 transition-all cursor-crosshair ${useCase.color}`}>
                    <useCase.icon className="w-5 h-5" />
                    <div className="text-left">
                       <div className="font-bold text-lg">{useCase.title}</div>
                       <div className="text-xs opacity-75 font-medium uppercase tracking-wider">{useCase.description}</div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Modern Bottom CTA with Glassmorphism */}
      <section className="relative py-32 z-10">
        <div className="max-w-5xl mx-auto px-6">
           <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 text-white shadow-2xl">
              {/* Animated Background */}
              <div className="absolute inset-0 opacity-30">
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-600 to-blue-600 animate-gradient-xy"></div>
              </div>
              
              <div className="relative z-10 p-16 text-center">
                 <h2 className="text-4xl md:text-6xl font-black mb-6">Ready to create?</h2>
                 <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">
                    Join the creative revolution. No credit card required.
                 </p>
                 <button className="bg-white text-slate-900 px-10 py-5 rounded-full font-bold text-xl hover:bg-purple-50 transition-colors shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] flex items-center gap-3 mx-auto cursor-none">
                    Launch Sketch <ArrowRight className="w-6 h-6" />
                 </button>
              </div>
           </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
