import React, { useRef, useState, useEffect } from 'react';
import { analyzePracticeAttempt } from '../services/gemini';
import { RefreshCw, CheckCircle, Eraser, Pen, MousePointer, Info, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

const LETTERS = ['b', 'd', 'p', 'q', 'm', 'w', 'a', 'e'];
const WORDS = ['bed', 'dad', 'cat', 'dog', 'saw', 'was'];

const HandwritingPractice: React.FC = () => {
    const { profile, setProfile } = useApp();
    const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
    const [target, setTarget] = useState('b');
    const [mode, setMode] = useState<'letters' | 'words'>('letters');
    
    // Canvas State
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
    const [strokeCount, setStrokeCount] = useState(0);
    const [hasDrawn, setHasDrawn] = useState(false);

    // Analysis State
    const [analyzing, setAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState<any>(null);

    // Initialize Canvas
    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            // High DPI support
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(dpr, dpr);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#4F46E5'; // Indigo 600
                ctx.lineWidth = difficulty === 'Beginner' ? 12 : 6;
                setContext(ctx);
                drawGuide(ctx, target);
            }
        }
    }, [target, difficulty]); // Re-init on target/difficulty change

    const drawGuide = (ctx: CanvasRenderingContext2D, text: string) => {
        // Clear background
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Don't draw guides in Advanced mode
        if (difficulty === 'Advanced') return;

        ctx.save();
        const dpr = window.devicePixelRatio || 1;
        const width = ctx.canvas.width / dpr;
        const height = ctx.canvas.height / dpr;

        ctx.font = difficulty === 'Beginner' 
            ? `300px "Lexend", sans-serif` 
            : `150px "Lexend", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw Guide (Ghost)
        ctx.fillStyle = '#E5E7EB'; // Gray 200
        ctx.fillText(text, width / 2, height / 2);
        
        // Draw Baseline
        ctx.beginPath();
        ctx.moveTo(20, height / 2 + 100);
        ctx.lineTo(width - 20, height / 2 + 100);
        ctx.strokeStyle = '#D1D5DB'; // Gray 300
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.stroke();

        ctx.restore();
    };

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!context) return;
        
        // Prevent default only if needed to stop scrolling, but we use touch-action: none in CSS
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        context.beginPath();
        context.moveTo(x, y);
        setIsDrawing(true);
        setHasDrawn(true);
    };

    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !context) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        context.lineTo(x, y);
        context.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            context?.closePath();
            setIsDrawing(false);
            setStrokeCount(prev => prev + 1);
        }
    };

    const clearCanvas = () => {
        if (context && canvasRef.current) {
            drawGuide(context, target);
            setHasDrawn(false);
            setFeedback(null);
        }
    };

    const checkWriting = async () => {
        if (!canvasRef.current || !hasDrawn) return;
        
        setAnalyzing(true);
        try {
            const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            const base64 = dataUrl.split(',')[1];
            const result = await analyzePracticeAttempt(base64, target);
            setFeedback(result);
            
            // Save Progress locally (simplified)
            if (result.score > 80) {
                 setProfile(prev => ({
                     ...prev,
                     writingStats: {
                         lettersPracticed: (prev.writingStats?.lettersPracticed || 0) + 1,
                         avgAccuracy: ((prev.writingStats?.avgAccuracy || 0) + result.score) / 2
                     }
                 }));
            }
        } catch (e) {
            console.error(e);
            alert("Analysis failed.");
        } finally {
            setAnalyzing(false);
        }
    };

    const nextTarget = () => {
        const list = mode === 'letters' ? LETTERS : WORDS;
        const currentIndex = list.indexOf(target);
        const nextIndex = (currentIndex + 1) % list.length;
        setTarget(list[nextIndex]);
        setFeedback(null);
        setHasDrawn(false);
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6 animate-fade-in h-full">
            {/* Sidebar Controls */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Pen size={20} className="text-indigo-600"/> Setup
                    </h3>
                    
                    <div className="space-y-4">
                         {/* Mode Toggle */}
                         <div className="flex bg-gray-100 p-1 rounded-lg">
                             <button 
                                onClick={() => { setMode('letters'); setTarget('b'); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'letters' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                             >Letters</button>
                             <button 
                                onClick={() => { setMode('words'); setTarget('bed'); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'words' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                             >Words</button>
                         </div>

                         {/* Difficulty */}
                         <div>
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Difficulty</label>
                             <div className="grid grid-cols-3 gap-2 mt-2">
                                 {['Beginner', 'Intermediate', 'Advanced'].map((d) => (
                                     <button 
                                        key={d}
                                        onClick={() => setDifficulty(d as Difficulty)}
                                        className={`py-2 text-xs font-bold rounded-lg border-2 transition-all ${difficulty === d ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                     >
                                         {d}
                                     </button>
                                 ))}
                             </div>
                             <p className="text-xs text-gray-400 mt-2 flex items-start gap-1">
                                 <Info size={12} className="mt-0.5 shrink-0"/>
                                 {difficulty === 'Beginner' && "Large guides, thick pen."}
                                 {difficulty === 'Intermediate' && "Standard size, guides."}
                                 {difficulty === 'Advanced' && "Freehand, no guides."}
                             </p>
                         </div>
                         
                         {/* Target Selector */}
                         <div className="pt-2">
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Practice Target</label>
                             <div className="flex flex-wrap gap-2 mt-2">
                                 {(mode === 'letters' ? LETTERS : WORDS).map(t => (
                                     <button
                                        key={t}
                                        onClick={() => { setTarget(t); setFeedback(null); }}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-lg border-2 transition-all ${target === t ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-gray-200 hover:border-indigo-300'}`}
                                     >
                                         {t}
                                     </button>
                                 ))}
                             </div>
                         </div>
                    </div>
                </div>

                {/* Feedback Card */}
                {feedback && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                             <h4 className="font-bold text-gray-800">Feedback</h4>
                             <span className={`px-3 py-1 rounded-full text-sm font-bold ${feedback.score > 75 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                 Score: {feedback.score}
                             </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{feedback.feedback}</p>
                        
                        {feedback.issues && feedback.issues.length > 0 && (
                            <div className="bg-red-50 p-3 rounded-lg text-sm text-red-700 space-y-1">
                                {feedback.issues.map((issue: string, i: number) => (
                                    <div key={i} className="flex gap-2">
                                        <ArrowRight size={14} className="mt-1" /> {issue}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <button 
                            onClick={nextTarget}
                            className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex justify-center items-center gap-2"
                        >
                            Next Exercise <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Canvas Area */}
            <div className="lg:col-span-2 flex flex-col h-[600px] bg-gray-50 rounded-2xl border border-gray-300 p-4 relative">
                 <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 shadow-sm border border-gray-200 flex items-center gap-2">
                     <MousePointer size={12} /> Stylus & Mouse Enabled
                 </div>

                 <canvas
                    ref={canvasRef}
                    className="flex-1 w-full bg-white rounded-xl shadow-inner cursor-crosshair touch-none border border-gray-200"
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                 />
                 
                 <div className="mt-4 flex gap-4">
                     <button 
                        onClick={clearCanvas}
                        className="flex-1 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 flex justify-center items-center gap-2 transition-colors"
                     >
                        <Eraser size={20} /> Clear
                     </button>
                     <button 
                        onClick={checkWriting}
                        disabled={!hasDrawn || analyzing}
                        className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg transition-all"
                     >
                        {analyzing ? <RefreshCw className="animate-spin" /> : <CheckCircle />} 
                        {analyzing ? "Analyzing..." : "Check My Writing"}
                     </button>
                 </div>
            </div>
        </div>
    );
};

export default HandwritingPractice;
