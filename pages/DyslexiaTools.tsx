import React, { useState, useRef, useEffect } from 'react';
import { analyzeHandwriting, simplifyText, generateVisualAid, generateSpeech, playPCM, generateReadingPassage, analyzeReadingPerformance } from '../services/gemini';
import { Upload, Type, Image as ImageIcon, Volume2, Mic, Play, RefreshCw, AlertCircle, BookOpen, Clock, CheckCircle, BarChart, PenTool, List, Map, MessageSquare, VolumeX } from 'lucide-react';
import HandwritingPractice from '../components/HandwritingPractice';

const DyslexiaTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assessment' | 'traits' | 'practice' | 'handwriting' | 'reader' | 'visual'>('traits');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Dyslexia Support Tools</h1>
        <p className="text-gray-500">AI-powered assistive technology for reading and writing.</p>
      </header>

      <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto pb-1">
        <TabButton id="traits" label="Trait Assessment" icon={<CheckCircle size={18} />} active={activeTab} onClick={setActiveTab} />
        <TabButton id="assessment" label="Reading Test" icon={<BarChart size={18} />} active={activeTab} onClick={setActiveTab} />
        <TabButton id="practice" label="Writing Practice" icon={<PenTool size={18} />} active={activeTab} onClick={setActiveTab} />
        <TabButton id="handwriting" label="Upload & Analyze" icon={<Upload size={18} />} active={activeTab} onClick={setActiveTab} />
        <TabButton id="reader" label="Smart Reader" icon={<Volume2 size={18} />} active={activeTab} onClick={setActiveTab} />
        <TabButton id="visual" label="Visual Dictionary" icon={<ImageIcon size={18} />} active={activeTab} onClick={setActiveTab} />
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'traits' && <TraitAssessment />}
        {activeTab === 'assessment' && <ReadingAssessment />}
        {activeTab === 'practice' && <HandwritingPractice />}
        {activeTab === 'handwriting' && <HandwritingAnalysis />}
        {activeTab === 'reader' && <SmartReader />}
        {activeTab === 'visual' && <VisualDictionary />}
      </div>
    </div>
  );
};

const TabButton: React.FC<any> = ({ id, label, icon, active, onClick }) => (
    <button 
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${active === id ? 'border-indigo-600 text-indigo-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
    >
        {icon} {label}
    </button>
);

// --- Sub-Components ---

const ReadingAssessment: React.FC = () => {
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
    const [passage, setPassage] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [analysis, setAnalysis] = useState<any>(null);
    const [startTime, setStartTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    
    const recognitionRef = useRef<any>(null);

    // Initial setup for SpeechRecognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setStartTime(Date.now());
                setIsRecording(true);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscript(prev => prev + " " + finalTranscript);
                }
            };
            
            recognitionRef.current = recognition;
        }
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        setPassage("");
        setTranscript("");
        setAnalysis(null);
        try {
            const text = await generateReadingPassage(difficulty);
            setPassage(text);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            const timeTakenSec = (Date.now() - startTime) / 1000;
            setDuration(timeTakenSec);
            handleAnalyze(transcript, timeTakenSec);
        } else {
            setTranscript("");
            setAnalysis(null);
            recognitionRef.current?.start();
        }
    };

    const handleAnalyze = async (finalTranscript: string, timeSec: number) => {
        if (!passage) return;
        setLoading(true);
        try {
            // If transcript is empty (browser issues), warn user
            const result = await analyzeReadingPerformance(passage, finalTranscript || "(No speech detected)");
            setAnalysis({ ...result, timeSec });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleTTS = async () => {
        if(!passage) return;
        try {
            const pcm = await generateSpeech(passage);
            await playPCM(pcm);
        } catch(e) { console.error(e); }
    };

    return (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
             <div className="space-y-6">
                 {/* Controls */}
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                     <label className="block text-sm font-medium text-gray-700 mb-2">Select Difficulty Level</label>
                     <div className="flex gap-2 mb-4">
                         {['Easy', 'Medium', 'Hard'].map((d) => (
                             <button
                                key={d}
                                onClick={() => setDifficulty(d as any)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${difficulty === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                             >
                                 {d}
                             </button>
                         ))}
                     </div>
                     <button 
                        onClick={handleGenerate}
                        disabled={loading || isRecording}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
                     >
                        {loading ? <RefreshCw className="animate-spin" /> : <BookOpen />} Generate Passage
                     </button>
                 </div>

                 {/* Passage Display */}
                 {passage && (
                     <div className="bg-gray-50 p-6 rounded-xl border border-gray-300 min-h-[200px] text-lg leading-relaxed relative">
                         <p>{passage}</p>
                         <button 
                            onClick={handleTTS}
                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm hover:bg-indigo-50 text-indigo-600"
                            title="Listen to text"
                        >
                             <Volume2 size={20} />
                         </button>
                     </div>
                 )}

                 {/* Recording Controls */}
                 {passage && (
                     <div className="flex flex-col items-center gap-2">
                         <button
                            onClick={toggleRecording}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'} text-white shadow-lg`}
                         >
                             {isRecording ? <div className="w-6 h-6 bg-white rounded-sm" /> : <Mic size={32} />}
                         </button>
                         <span className="text-sm font-medium text-gray-500">
                             {isRecording ? "Listening... Read aloud!" : "Press Mic to Start Reading"}
                         </span>
                     </div>
                 )}
             </div>

             {/* Results Section */}
             <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                     <BarChart size={20} className="text-indigo-600" /> Analysis Report
                 </h3>
                 
                 {loading && !analysis ? (
                     <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                         <RefreshCw className="animate-spin mb-2 text-indigo-600" size={32} />
                         <p>Analyzing speech...</p>
                     </div>
                 ) : analysis ? (
                     <div className="space-y-6 animate-fade-in">
                         <div className="grid grid-cols-2 gap-4">
                             <div className="bg-green-50 p-4 rounded-xl text-center">
                                 <p className="text-xs text-green-600 uppercase font-bold tracking-wide">Accuracy</p>
                                 <p className="text-3xl font-bold text-green-700">{analysis.accuracyScore}%</p>
                             </div>
                             <div className="bg-blue-50 p-4 rounded-xl text-center">
                                 <p className="text-xs text-blue-600 uppercase font-bold tracking-wide">Time</p>
                                 <p className="text-3xl font-bold text-blue-700">{Math.round(analysis.timeSec)}s</p>
                             </div>
                         </div>

                         <div>
                             <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase">Feedback</h4>
                             <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                                 {analysis.fluencyFeedback}
                             </p>
                         </div>

                         {analysis.missedWords && analysis.missedWords.length > 0 && (
                             <div>
                                 <h4 className="font-semibold text-red-600 mb-2 text-sm uppercase">Tricky Words</h4>
                                 <div className="flex flex-wrap gap-2">
                                     {analysis.missedWords.map((w: string, i: number) => (
                                         <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium border border-red-100">
                                             {w}
                                         </span>
                                     ))}
                                 </div>
                             </div>
                         )}
                         
                         <div className="border-t pt-4">
                             <span className="text-sm font-medium text-gray-500">Suggested Level: </span>
                             <span className="font-bold text-indigo-600">{analysis.difficultyAdjustment}</span>
                         </div>
                     </div>
                 ) : (
                     <div className="flex-1 flex items-center justify-center text-gray-400 text-center text-sm p-4">
                         Generate a passage and read it aloud to see your performance analysis here.
                     </div>
                 )}
             </div>
        </div>
    );
};

const HandwritingAnalysis: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
            setResult(null);
        }
    };

    const handleAnalyze = async () => {
        if (!image) return;
        setLoading(true);
        try {
            const base64 = image.split(',')[1];
            const data = await analyzeHandwriting(base64);
            setResult(data);
        } catch (error) {
            console.error(error);
            alert("Analysis failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="hw-upload" />
                    <label htmlFor="hw-upload" className="cursor-pointer flex flex-col items-center">
                        {image ? (
                            <img src={image} alt="Upload" className="max-h-64 object-contain rounded-lg shadow-sm" />
                        ) : (
                            <>
                                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                                <span className="text-gray-600 font-medium">Click to upload handwriting sample</span>
                                <span className="text-xs text-gray-400 mt-1">JPEG, PNG supported</span>
                            </>
                        )}
                    </label>
                </div>
                <button 
                    onClick={handleAnalyze} 
                    disabled={!image || loading}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                    {loading ? <RefreshCw className="animate-spin" /> : <Type />} 
                    {loading ? "Analyzing..." : "Analyze Handwriting"}
                </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-lg mb-4">Analysis Results</h3>
                {result ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                            <span>Dyslexia Probability Indicator</span>
                            <span className={`font-bold px-3 py-1 rounded-full ${result.probability > 50 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                {result.probability}%
                            </span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-gray-500 uppercase mb-2">Observations</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                {result.observations?.map((obs: string, i: number) => (
                                    <li key={i}>{obs}</li>
                                ))}
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold text-sm text-gray-500 uppercase mb-2">Recommendations</h4>
                             <ul className="list-disc pl-5 space-y-1 text-sm">
                                {result.recommendations?.map((rec: string, i: number) => (
                                    <li key={i}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg flex gap-2 text-xs text-blue-800">
                            <AlertCircle size={16} className="shrink-0" />
                            <p>This tool is for educational support only and does not provide a medical diagnosis.</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-400 text-center mt-10">Upload an image and click analyze to see results here.</p>
                )}
            </div>
        </div>
    );
};

const SmartReader: React.FC = () => {
    const [text, setText] = useState("");
    const [output, setOutput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleSimplify = async () => {
        if (!text) return;
        setLoading(true);
        try {
            const res = await simplifyText(text);
            setOutput(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleTTS = async (content: string) => {
        if (!content || isPlaying) return;
        setIsPlaying(true);
        try {
            const pcmData = await generateSpeech(content);
            await playPCM(pcmData);
        } catch (e) {
            console.error(e);
        } finally {
            setIsPlaying(false);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
            <div className="space-y-4">
                <textarea 
                    className="w-full h-64 p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Paste difficult text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <div className="flex gap-2">
                     <button 
                        onClick={handleSimplify}
                        disabled={loading || !text}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                         {loading ? <RefreshCw className="animate-spin" size={16}/> : <Type size={16}/>} Simplify Text
                    </button>
                    <button 
                         onClick={() => handleTTS(text)}
                         disabled={isPlaying || !text}
                         className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                         title="Read Original"
                    >
                         <Volume2 size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border border-green-100 relative">
                 <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                    <Type size={20} /> Simplified Output
                 </h3>
                 <div className="prose prose-sm text-gray-800 h-56 overflow-y-auto">
                     {output || <span className="text-gray-400 italic">Simplified text will appear here...</span>}
                 </div>
                 {output && (
                     <button 
                        onClick={() => handleTTS(output)}
                        disabled={isPlaying}
                        className="absolute bottom-4 right-4 p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-transform hover:scale-105"
                     >
                         {isPlaying ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" />}
                     </button>
                 )}
            </div>
        </div>
    );
};

const VisualDictionary: React.FC = () => {
    const [word, setWord] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if(!word) return;
        setLoading(true);
        setImage(null);
        try {
             const result = await generateVisualAid(word);
             setImage(result);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto text-center space-y-6 animate-fade-in pt-8">
            <h2 className="text-xl font-bold">Word-to-Image Mapper</h2>
            <p className="text-gray-500">Type a word you don't understand to see a picture of it.</p>
            
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g., Photosynthesis"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button 
                    onClick={handleGenerate}
                    disabled={loading || !word}
                    className="bg-indigo-600 text-white px-6 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? "..." : "Visualize"}
                </button>
            </div>

            <div className="bg-gray-100 rounded-2xl h-80 flex items-center justify-center border border-gray-200 overflow-hidden shadow-inner">
                 {loading ? (
                     <div className="flex flex-col items-center gap-2">
                         <RefreshCw className="animate-spin text-indigo-500" size={32} />
                         <span className="text-gray-500 text-sm">Drawing...</span>
                     </div>
                 ) : image ? (
                     <img src={image} alt={word} className="w-full h-full object-contain p-4" />
                 ) : (
                     <span className="text-gray-400">Image will appear here</span>
                 )}
            </div>
        </div>
    );
};

// --- Trait Assessment (This or That) ---

const TRAIT_QUESTIONS = [
    {
        id: 1,
        trait: "Visual vs. Textual",
        optionA: "I like Pictures",
        optionB: "I like Words",
        iconA: <ImageIcon size={32} />,
        iconB: <Type size={32} />
    },
    {
        id: 2,
        trait: "Planning",
        optionA: "I use Mind Maps",
        optionB: "I make Lists",
        iconA: <PenTool size={32} />,
        iconB: <List size={32} />
    },
    {
        id: 3,
        trait: "Directions",
        optionA: "Follow a Map",
        optionB: "Read Directions",
        iconA: <Map size={32} />,
        iconB: <MessageSquare size={32} />
    },
    {
        id: 4,
        trait: "Communication",
        optionA: "Talk or Listen",
        optionB: "Type or Read",
        iconA: <Mic size={32} />,
        iconB: <Type size={32} />
    },
    {
        id: 5,
        trait: "Medium",
        optionA: "Phone or Tablet",
        optionB: "Paper or Books",
        iconA: <Play size={32} />,
        iconB: <BookOpen size={32} />
    },
    {
         id: 6,
         trait: "Environment",
         optionA: "Background Music",
         optionB: "Total Silence",
         iconA: <Volume2 size={32} />,
         iconB: <VolumeX size={32} />
    }
];

const TraitAssessment: React.FC = () => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selections, setSelections] = useState<Record<number, 'A' | 'B'>>({});
    const [showResults, setShowResults] = useState(false);

    const handleSelect = (option: 'A' | 'B') => {
        setSelections({ ...selections, [TRAIT_QUESTIONS[currentIdx].id]: option });
        if (currentIdx < TRAIT_QUESTIONS.length - 1) {
            setCurrentIdx(currentIdx + 1);
        } else {
            setShowResults(true);
        }
    };

    const reset = () => {
        setCurrentIdx(0);
        setSelections({});
        setShowResults(false);
    };

    if (showResults) {
        const visualPref = Object.values(selections).filter(v => v === 'A').length;
        const textualPref = Object.values(selections).filter(v => v === 'B').length;

        return (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-sm animate-fade-in text-center">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold mb-2">Your Support Profile</h2>
                <p className="text-gray-500 mb-6">Based on your "This or That" choices, here is your learning style breakdown:</p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                        <p className="text-sm font-bold text-indigo-600 uppercase mb-1">I Learn with My Eyes</p>
                        <p className="text-3xl font-black text-indigo-900">{Math.round((visualPref / TRAIT_QUESTIONS.length) * 100)}%</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <p className="text-sm font-bold text-blue-600 uppercase mb-1">I Learn with Words</p>
                        <p className="text-3xl font-black text-blue-900">{Math.round((textualPref / TRAIT_QUESTIONS.length) * 100)}%</p>
                    </div>
                </div>

                <div className="text-left space-y-4 mb-8">
                    <h3 className="font-bold text-gray-800">Recommendations:</h3>
                    <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-gray-600">
                            <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 text-indigo-600 font-bold">1</div>
                            {visualPref > textualPref 
                                ? "You should use the 'Visual Dictionary'. It turns hard words into pictures for you!"
                                : "The 'Smart Reader' will be great for you. It makes long stories easier to read."}
                        </li>
                        <li className="flex gap-3 text-sm text-gray-600">
                            <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 text-indigo-600 font-bold">2</div>
                            Try using a specialized font like Lexend or OpenDyslexic (available in Settings) to reduce visual crowding.
                        </li>
                    </ul>
                </div>

                <button 
                    onClick={reset}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                >
                    Retake Assessment
                </button>
            </div>
        );
    }

    const current = TRAIT_QUESTIONS[currentIdx];
    const progress = ((currentIdx + 1) / TRAIT_QUESTIONS.length) * 100;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-indigo-600">Question {currentIdx + 1} of {TRAIT_QUESTIONS.length}</span>
                    <span className="text-sm text-gray-400">{Math.round(progress)}% Complete</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-8">Which do you prefer?</h2>

            <div className="grid grid-cols-2 gap-8">
                <button 
                    onClick={() => handleSelect('A')}
                    className="group bg-white border-2 border-gray-200 p-10 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center flex flex-col items-center gap-6 shadow-sm hover:shadow-md"
                >
                    <div className="w-24 h-24 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        {current.iconA}
                    </div>
                    <span className="text-xl font-bold text-gray-800 tracking-tight">{current.optionA}</span>
                </button>

                <button 
                    onClick={() => handleSelect('B')}
                    className="group bg-white border-2 border-gray-200 p-10 rounded-3xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center flex flex-col items-center gap-6 shadow-sm hover:shadow-md"
                >
                    <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        {current.iconB}
                    </div>
                    <span className="text-xl font-bold text-gray-800 tracking-tight">{current.optionB}</span>
                </button>
            </div>

            <div className="mt-12 text-center text-gray-400 text-sm italic">
                There are no wrong answers. This helps us personalize your experience.
            </div>
        </div>
    );
};

export default DyslexiaTools;
