import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { detectEmotion, chatWithTherapist, generateSpeech, playPCM } from '../services/gemini';
import { Mic, Video, VideoOff, StopCircle, User, AlertTriangle } from 'lucide-react';
import Games from '../components/Games';
import Avatar from '../components/Avatar';
import { AvatarExpression } from '../types';

const AutismSupport: React.FC = () => {
    const [view, setView] = useState<'therapist' | 'games'>('therapist');

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Autism Support</h1>
                    <p className="text-gray-500">Emotional regulation and cognitive skill building.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setView('therapist')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'therapist' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                    >
                        Avatar Therapist
                    </button>
                    <button 
                         onClick={() => setView('games')}
                         className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'games' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                    >
                        Skill Games
                    </button>
                </div>
            </header>

            {view === 'therapist' ? <AvatarTherapistView /> : <Games />}
        </div>
    );
};

const AvatarTherapistView: React.FC = () => {
    // State
    const [avatarExpression, setAvatarExpression] = useState<AvatarExpression>('Friendly');
    const [detectedMood, setDetectedMood] = useState("Neutral");
    const [cameraOn, setCameraOn] = useState(false);
    const [quotaExceeded, setQuotaExceeded] = useState(false);
    
    // Voice interaction state
    const [history, setHistory] = useState<{role: string, content: string}[]>([
        { role: 'model', content: "Hi! I'm here to listen. How are you feeling today?" }
    ]);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [statusText, setStatusText] = useState("Ready to talk");

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const recognitionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // --- Expression Mapping Logic ---
    useEffect(() => {
        // This effect maps the DETECTED user mood to the AVATAR'S expression
        // Rule: Avatar mirrors positive, shows empathy for negative, concern for anger.
        
        if (!cameraOn) {
            setAvatarExpression('Friendly');
            return;
        }

        switch (detectedMood.toLowerCase()) {
            case 'happy':
            case 'joy':
                setAvatarExpression('Excited'); // Mirroring excitement
                break;
            case 'sad':
                setAvatarExpression('Sad'); // Sympathetic sadness
                break;
            case 'anxious':
            case 'fear':
            case 'confused':
                setAvatarExpression('Nervous'); // "Nervous/Encouraging" as requested
                break;
            case 'angry':
                setAvatarExpression('Worried'); // Concern
                break;
            case 'shy':
            case 'embarrassed':
                setAvatarExpression('Shy'); // Mirroring
                break;
            case 'neutral':
            default:
                setAvatarExpression('Friendly'); // Default soft smile
                break;
        }
    }, [detectedMood, cameraOn]);


    // --- Camera & Emotion Detection Loop ---
    useEffect(() => {
        let interval: any;

        const stopCamera = () => {
             if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };

        if (cameraOn && !quotaExceeded) {
            const startCamera = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        
                        // Start periodic analysis loop
                        // Increased to 15s to prevent 429 Rate Limit errors
                        interval = setInterval(async () => {
                            if (videoRef.current && !document.hidden && cameraOn && !quotaExceeded) {
                                const canvas = document.createElement("canvas");
                                canvas.width = videoRef.current.videoWidth;
                                canvas.height = videoRef.current.videoHeight;
                                canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
                                const base64 = canvas.toDataURL("image/jpeg").split(',')[1];
                                
                                try {
                                    // Detect emotion via Gemini Vision
                                    const detected = await detectEmotion(base64);
                                    if (detected) setDetectedMood(detected);
                                } catch (err: any) {
                                    console.error("Emotion detection failed", err);
                                    // Check for Rate Limit / Quota Exceeded
                                    if (JSON.stringify(err).includes('429') || err.message?.includes('quota') || err.message?.includes('429')) {
                                        setQuotaExceeded(true);
                                        clearInterval(interval);
                                        setDetectedMood("Neutral"); // Reset
                                        alert("You've hit the usage limit for emotion detection. The feature is paused for now.");
                                    }
                                }
                            }
                        }, 15000); 
                    }
                } catch (e) {
                    console.error("Webcam access denied", e);
                    setCameraOn(false);
                    alert("Could not access camera for emotion detection.");
                }
            };
            startCamera();
        } else {
            stopCamera();
            if (!quotaExceeded) setDetectedMood("Neutral");
        }

        return () => {
            clearInterval(interval);
            stopCamera();
        };
    }, [cameraOn, quotaExceeded]);


    // --- Speech Recognition Logic ---
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false; // Turn-based
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                setStatusText("Listening...");
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onresult = async (event: any) => {
                const transcript = event.results[0][0].transcript;
                setStatusText(`Heard: "${transcript}"`);
                await handleUserMessage(transcript);
            };
            
            recognition.onerror = (event: any) => {
                setIsListening(false);
                if(event.error !== 'no-speech') {
                    setStatusText("Try speaking again.");
                }
            };

            recognitionRef.current = recognition;
        } else {
            setStatusText("Voice input not supported.");
        }
    }, [history, detectedMood]);


    const handleUserMessage = async (text: string) => {
        setProcessing(true);
        setStatusText("Thinking...");
        
        const newHistory = [...history, { role: 'user', content: text }];
        setHistory(newHistory);

        try {
            // 1. Get Text Response (injected with current mood)
            const responseText = await chatWithTherapist(newHistory, text, detectedMood);
            setHistory(prev => [...prev, { role: 'model', content: responseText }]);
            setStatusText("Replying...");

            // 2. Get Audio Response
            const pcmData = await generateSpeech(responseText);
            
            // 3. Play & Animate
            setProcessing(false);
            setIsSpeaking(true);
            await playPCM(pcmData);
            setIsSpeaking(false);
            setStatusText("Ready to talk");

        } catch (e: any) {
            console.error(e);
            if (JSON.stringify(e).includes('429')) {
                 setStatusText("Server busy. Please wait.");
                 alert("Chat limit reached. Please wait a moment before trying again.");
            } else {
                 setStatusText("Connection error.");
            }
            setProcessing(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    };

    const handleRetryQuota = () => {
        setQuotaExceeded(false);
        setCameraOn(true); // Attempt restart
    };

    return (
        <div className="relative min-h-[600px] flex flex-col items-center justify-between bg-gradient-to-b from-indigo-50 to-white rounded-3xl p-6 shadow-xl border border-indigo-100 overflow-hidden">
            
            {/* Top Controls */}
            <div className="absolute top-6 right-6 z-20 flex gap-2">
                 <button 
                    onClick={() => setCameraOn(!cameraOn)}
                    disabled={quotaExceeded}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all shadow-sm backdrop-blur-md ${
                        quotaExceeded ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                        cameraOn 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
                 >
                    {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                    {cameraOn ? "Camera ON" : "Camera OFF"}
                 </button>
            </div>

            {/* Quota Warning Overlay */}
            {quotaExceeded && (
                <div className="absolute top-6 left-6 z-20 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm animate-fade-in">
                    <AlertTriangle size={16} />
                    <span>Detection paused (Rate Limit)</span>
                    <button onClick={handleRetryQuota} className="underline font-bold ml-2">Retry</button>
                </div>
            )}

            {/* Main Avatar Area */}
            <div className="flex-1 flex flex-col items-center justify-center w-full mt-8">
                 <Avatar expression={avatarExpression} isSpeaking={isSpeaking} isListening={isListening} />
                 
                 {/* Status Text */}
                 <div className="mt-8 px-6 py-2 bg-white/80 backdrop-blur rounded-full shadow-sm border border-indigo-100 text-indigo-800 font-medium">
                     {statusText}
                 </div>
            </div>

            {/* Bottom Controls */}
            <div className="w-full flex justify-center pb-8 z-20">
                <button 
                    onClick={toggleListening}
                    disabled={processing || isSpeaking}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 ${
                        isListening 
                        ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 ring-4 ring-indigo-200'
                    } disabled:opacity-50 disabled:scale-100`}
                >
                    {isListening ? <StopCircle size={32} /> : <Mic size={32} />}
                </button>
            </div>

            {/* Picture-in-Picture (PIP) Window */}
            {/* Logic: Only show if Camera is ON */}
            <div className={`absolute bottom-6 right-6 w-48 h-36 bg-black rounded-xl border-2 border-white shadow-2xl overflow-hidden transition-all duration-500 origin-bottom-right z-30 ${cameraOn && !quotaExceeded ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                />
                {/* PIP Overlay Status */}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {detectedMood}
                </div>
            </div>

            {/* Placeholder when Camera Off in PIP area */}
            {!cameraOn && !quotaExceeded && (
                <div className="absolute bottom-6 right-6 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 border border-gray-200 z-10">
                    <User size={20} />
                </div>
            )}

        </div>
    );
};

export default AutismSupport;