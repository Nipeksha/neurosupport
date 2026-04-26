import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { evaluateAssessment } from '../services/gemini';
import { AssessmentResult, SensoryTheme } from '../types';
import { ArrowRight, CheckCircle, AlertTriangle, Activity, Brain, Volume2, StopCircle, RefreshCw, Ear, User, Calendar, Smile, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Domains: Social, Sensory, Emotional, Routine, Repetitive, Attention
const QUESTIONS = [
  // Social Communication
  { id: 1, domain: 'social', text: "I find it difficult to understand people's intentions unless they say them clearly." },
  { id: 2, domain: 'social', text: "I prefer to do things on my own rather than with others." },
  { id: 3, domain: 'communication', text: "People often tell me I have been rude, even when I think I am being polite." },
  
  // Sensory
  { id: 4, domain: 'sensory', text: "I find loud noises, bright lights, or specific textures physically painful or overwhelming." },
  { id: 5, domain: 'sensory', text: "I am fascinated by small details, patterns, smells, or sounds that others might ignore." },
  
  // Routine & Rigidity
  { id: 6, domain: 'routine', text: "I get very upset or anxious if my daily routine is unexpectedly changed." },
  { id: 7, domain: 'routine', text: "I like to plan any activity carefully before I participate." },
  
  // Repetitive Behaviors / Stimming
  { id: 8, domain: 'behavioral', text: "I often make repetitive movements (like flapping hands, rocking, or pacing) when I am excited or anxious." },
  
  // Attention & Special Interests
  { id: 9, domain: 'attention', text: "I tend to focus so deeply on my favorite topics that I lose track of time or forget to eat." },
  { id: 10, domain: 'cognitive', text: "I find it hard to imagine 'what if' scenarios or play pretend games." },
  
  // Emotional Regulation
  { id: 11, domain: 'emotional', text: "I sometimes have 'meltdowns' or 'shutdowns' where I cannot speak or function due to stress." },
  { id: 12, domain: 'social', text: "I find it exhausting to be in social situations for a long time." }
];

const OPTIONS = [
  { label: "Always", value: 3, description: "This happens all the time." },
  { label: "Often", value: 2, description: "This happens frequently." },
  { label: "Sometimes", value: 1, description: "This happens occasionally." },
  { label: "Rarely", value: 0, description: "This happens hardly ever." },
  { label: "Never", value: 0, description: "This never happens." },
];

const AutismAssessment: React.FC = () => {
  const { setProfile, updateSensoryTheme } = useApp();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'intro' | 'questions' | 'analyzing' | 'results'>('intro');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<{question: string, answer: string, domain: string}[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Cleanup speech on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.1; // Slightly friendly pitch
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleStart = () => {
    setStep('questions');
    // Auto-read first question (optional, but good for accessibility)
    // speak(QUESTIONS[0].text);
  };

  const handleAnswer = (optionLabel: string) => {
    const currentQ = QUESTIONS[currentQIndex];
    const newAnswers = [...answers, { 
      question: currentQ.text, 
      answer: optionLabel, 
      domain: currentQ.domain 
    }];
    setAnswers(newAnswers);

    stopSpeaking();

    if (currentQIndex < QUESTIONS.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      finishAssessment(newAnswers);
    }
  };

  const finishAssessment = async (finalAnswers: any[]) => {
    setStep('analyzing');
    try {
      const evaluation = await evaluateAssessment(finalAnswers);
      
      const assessmentResult: AssessmentResult = {
        date: new Date().toISOString(),
        overallLikelihood: evaluation.overallLikelihood,
        domains: evaluation.domains, // Now includes behavioral/cognitive/etc
        summary: evaluation.summary,
        recommendations: evaluation.recommendations,
        suggestedTheme: evaluation.suggestedTheme
      };
      
      setResult(assessmentResult);
      
      // Save to profile
      setProfile(prev => ({
        ...prev,
        assessmentResult: assessmentResult
      }));
      
      setStep('results');
      speak("Analysis complete. Here is your profile summary.");
    } catch (e) {
      console.error(e);
      alert("Analysis failed. Please try again later.");
      setStep('intro');
    }
  };

  const applySuggestions = () => {
    if (result) {
      updateSensoryTheme(result.suggestedTheme);
      navigate('/autism');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      {step === 'intro' && (
        <div className="bg-white rounded-3xl p-10 shadow-lg border border-indigo-50 text-center space-y-8">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
            <Brain size={48} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Autism Self-Assessment</h1>
            <p className="text-gray-600 text-xl leading-relaxed max-w-2xl mx-auto">
              This adaptive screening tool explores your social, sensory, and cognitive patterns.
              It features <strong>Read Aloud</strong> support for full accessibility.
            </p>
          </div>
          
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 text-left rounded-r-xl max-w-2xl mx-auto">
            <div className="flex items-start gap-4">
              <AlertTriangle className="text-amber-600 shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-amber-900 text-lg">Medical Disclaimer</h3>
                <p className="text-amber-800 mt-2">
                  This tool generates a trait profile for educational purposes only. It is <strong>NOT a clinical diagnosis</strong>. 
                  Consult a healthcare professional for medical advice.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleStart}
            className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-700 hover:scale-105 transition-all shadow-xl flex items-center gap-3 mx-auto"
          >
            Start Assessment <ArrowRight size={24} />
          </button>
        </div>
      )}

      {step === 'questions' && (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-indigo-50 min-h-[500px] flex flex-col relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
             <div 
               className="bg-indigo-600 h-full transition-all duration-500 ease-out" 
               style={{ width: `${((currentQIndex + 1) / QUESTIONS.length) * 100}%` }}
             ></div>
          </div>

          <div className="flex justify-between items-center mt-4 mb-8">
             <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Question {currentQIndex + 1} / {QUESTIONS.length}</span>
             <button 
                onClick={() => isSpeaking ? stopSpeaking() : speak(`${QUESTIONS[currentQIndex].text}. Options are: ${OPTIONS.map(o => o.label).join(', ')}`)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${isSpeaking ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}
             >
                {isSpeaking ? <StopCircle size={20} /> : <Volume2 size={20} />}
                {isSpeaking ? "Stop Reading" : "Read Aloud"}
             </button>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center text-center mb-10 max-w-2xl mx-auto">
             <h2 className="text-3xl font-medium text-gray-800 leading-snug">
               {QUESTIONS[currentQIndex].text}
             </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
             {OPTIONS.map((opt) => (
               <button
                 key={opt.label}
                 onClick={() => handleAnswer(opt.label)}
                 className="group relative flex flex-col items-center justify-center py-6 px-2 rounded-xl border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
               >
                 <span className="font-bold text-lg text-gray-700 group-hover:text-indigo-700">{opt.label}</span>
                 {/* Tooltip for accessibility */}
                 <span className="absolute -top-10 scale-0 group-hover:scale-100 bg-gray-800 text-white text-xs px-2 py-1 rounded transition-transform whitespace-nowrap z-10">
                    {opt.description}
                 </span>
               </button>
             ))}
          </div>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="bg-white rounded-3xl p-12 shadow-lg border border-indigo-50 flex flex-col items-center justify-center min-h-[500px] text-center space-y-6">
           <RefreshCw className="w-20 h-20 text-indigo-600 animate-spin" />
           <h2 className="text-3xl font-bold text-gray-800">Analyzing Profile...</h2>
           <p className="text-gray-500 text-lg">Our AI is reviewing your sensory, social, and cognitive patterns.</p>
        </div>
      )}

      {step === 'results' && result && (
        <div className="space-y-8">
           {/* Header Card */}
           <div className={`rounded-3xl p-10 text-white shadow-2xl ${result.overallLikelihood === 'High' ? 'bg-indigo-600' : result.overallLikelihood === 'Medium' ? 'bg-teal-600' : 'bg-blue-500'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-4xl font-bold mb-2">Profile Analysis Complete</h2>
                    <div className="flex items-center gap-2 bg-white/20 w-fit px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                        <Activity size={16} />
                        <span>Likelihood of Traits: {result.overallLikelihood}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => speak(result.summary)}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur transition-all"
                  >
                      <Volume2 size={24} />
                  </button>
              </div>
              <p className="text-white/95 text-xl leading-relaxed font-light">{result.summary}</p>
           </div>

           {/* Trait Breakdown */}
           <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-lg">
                 <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Brain size={24} className="text-indigo-600" /> Trait Domains
                 </h3>
                 <div className="space-y-6">
                    <TraitBar label="Social Interaction" score={result.domains.social} color="bg-blue-500" icon={<User size={16}/>} />
                    <TraitBar label="Sensory Sensitivity" score={result.domains.sensory} color="bg-purple-500" icon={<Ear size={16}/>} />
                    <TraitBar label="Communication" score={result.domains.communication} color="bg-green-500" icon={<MessageCircle size={16}/>} />
                    <TraitBar label="Routine & Rigidity" score={result.domains.routine} color="bg-orange-500" icon={<Calendar size={16}/>} />
                    <TraitBar label="Emotional / Behavioral" score={result.domains.behavioral || result.domains.social} color="bg-red-500" icon={<Smile size={16}/>} />
                 </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-lg flex flex-col">
                 <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <CheckCircle size={24} className="text-teal-600" /> Personalized Plan
                 </h3>
                 <ul className="space-y-4 mb-8 flex-1">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-4 text-gray-700 bg-gray-50 p-4 rounded-xl text-lg border border-gray-100 shadow-sm">
                        <span className="font-bold text-indigo-500 text-xl">{i + 1}</span> 
                        {rec}
                      </li>
                    ))}
                 </ul>
                 
                 <div className="mt-auto pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">Suggested Theme</p>
                        <span className="px-3 py-1 bg-gray-100 rounded-full font-bold text-gray-800">{result.suggestedTheme}</span>
                    </div>
                    <button 
                      onClick={applySuggestions}
                      className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex justify-center items-center gap-2 text-lg shadow-lg"
                    >
                       Apply Settings & Start <ArrowRight size={20} />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const TraitBar: React.FC<{ label: string, score: number, color: string, icon: React.ReactNode }> = ({ label, score, color, icon }) => (
  <div>
    <div className="flex justify-between text-sm font-bold mb-2 text-gray-600">
      <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
      </div>
      <span>{score}%</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${score}%` }}></div>
    </div>
  </div>
);

export default AutismAssessment;