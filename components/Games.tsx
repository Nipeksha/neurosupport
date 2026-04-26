import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const Games: React.FC = () => {
    const [activeGame, setActiveGame] = useState<'memory' | 'sorting' | 'focus' | null>(null);

    return (
        <div className="animate-fade-in">
            {!activeGame ? (
                <div className="grid md:grid-cols-2 gap-6">
                    <div 
                        onClick={() => setActiveGame('memory')}
                        className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-8 cursor-pointer hover:bg-indigo-100 transition-colors text-center"
                    >
                        <h3 className="text-xl font-bold text-indigo-900 mb-2">Memory Match</h3>
                        <p className="text-indigo-700">Flip cards to find pairs. Improves working memory.</p>
                    </div>
                    <div 
                        onClick={() => setActiveGame('focus')}
                        className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-8 cursor-pointer hover:bg-emerald-100 transition-colors text-center"
                    >
                        <h3 className="text-xl font-bold text-emerald-900 mb-2">Focus Flow</h3>
                        <p className="text-emerald-700">Match the color, not the word. Adult-friendly cognitive challenge.</p>
                    </div>
                    <div 
                        onClick={() => setActiveGame('sorting')}
                        className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-8 cursor-pointer hover:bg-orange-100 transition-colors text-center"
                    >
                        <h3 className="text-xl font-bold text-orange-900 mb-2">Categorization</h3>
                        <p className="text-orange-700">Sort complex items by property. Improves attention to detail.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <button onClick={() => setActiveGame(null)} className="text-sm font-bold text-gray-500 hover:text-gray-800">← Back to Games</button>
                    {activeGame === 'memory' && <MemoryGame />}
                    {activeGame === 'sorting' && <SortingGame />}
                    {activeGame === 'focus' && <FocusGame />}
                </div>
            )}
        </div>
    );
};

// --- Memory Game ---

const CARDS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

const MemoryGame: React.FC = () => {
    const { profile, setProfile } = useApp();
    const [cards, setCards] = useState<any[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [solved, setSolved] = useState<number[]>([]);

    useEffect(() => {
        const deck = [...CARDS, ...CARDS]
            .sort(() => Math.random() - 0.5)
            .map((emoji, id) => ({ id, emoji }));
        setCards(deck);
    }, []);

    useEffect(() => {
        if (flipped.length === 2) {
            const [first, second] = flipped;
            if (cards[first].emoji === cards[second].emoji) {
                setSolved([...solved, first, second]);
                setFlipped([]);
                // Update score
                setProfile(prev => ({
                    ...prev,
                    gameScores: { ...prev.gameScores, memory: prev.gameScores.memory + 10 }
                }));
            } else {
                setTimeout(() => setFlipped([]), 1000);
            }
        }
    }, [flipped, cards, solved, setProfile]);

    const handleFlip = (index: number) => {
        if (flipped.length < 2 && !flipped.includes(index) && !solved.includes(index)) {
            setFlipped([...flipped, index]);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4">Score: {profile.gameScores.memory}</h3>
            <div className="grid grid-cols-4 gap-4">
                {cards.map((card, index) => (
                    <div 
                        key={index}
                        onClick={() => handleFlip(index)}
                        className={`w-16 h-24 md:w-24 md:h-32 flex items-center justify-center text-3xl md:text-5xl rounded-xl cursor-pointer transition-all duration-300 transform ${
                            flipped.includes(index) || solved.includes(index)
                            ? 'bg-white rotate-y-180 shadow-md border border-gray-200'
                            : 'bg-indigo-500 shadow-lg'
                        }`}
                    >
                        {(flipped.includes(index) || solved.includes(index)) ? card.emoji : ''}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Focus Flow (Stroop Test) ---

const COLORS = [
    { name: 'Red', hex: 'text-red-500', bg: 'bg-red-500' },
    { name: 'Blue', hex: 'text-blue-500', bg: 'bg-blue-500' },
    { name: 'Green', hex: 'text-green-500', bg: 'bg-green-500' },
    { name: 'Yellow', hex: 'text-yellow-500', bg: 'bg-yellow-500' },
    { name: 'Purple', hex: 'text-purple-500', bg: 'bg-purple-500' },
];

const FocusGame: React.FC = () => {
    const { profile, setProfile } = useApp();
    const [word, setWord] = useState(COLORS[0]);
    const [textColor, setTextColor] = useState(COLORS[1]);
    const [options, setOptions] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isActive, setIsActive] = useState(false);

    const generateRound = () => {
        const randomWord = COLORS[Math.floor(Math.random() * COLORS.length)];
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        setWord(randomWord);
        setTextColor(randomColor);
        
        // Ensure options include the correct color
        const otherOptions = COLORS.filter(c => c.name !== randomColor.name).sort(() => Math.random() - 0.5).slice(0, 2);
        setOptions([randomColor, ...otherOptions].sort(() => Math.random() - 0.5));
    };

    useEffect(() => {
        let timer: any;
        if (isActive && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(timer);
    }, [isActive, timeLeft]);

    const startGame = () => {
        setTimeLeft(30);
        setIsActive(true);
        generateRound();
        setProfile(prev => ({ ...prev, gameScores: { ...prev.gameScores, focus: 0 } }));
    };

    const handleAnswer = (selectedName: string) => {
        if (selectedName === textColor.name) {
            setProfile(prev => ({
                ...prev,
                gameScores: { ...prev.gameScores, focus: (prev.gameScores.focus || 0) + 10 }
            }));
            generateRound();
        } else {
            // Shake effect or feedback
            generateRound();
        }
    };

    return (
        <div className="max-w-md mx-auto text-center space-y-8 py-8 animate-fade-in">
            {!isActive && timeLeft === 30 ? (
                <div className="space-y-4">
                    <h3 className="text-2xl font-black">Focus Flow</h3>
                    <p className="text-gray-500">Pick the button that matches the **COLOR** of the word, ignore what the word says!</p>
                    <button onClick={startGame} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700">Start Game</button>
                </div>
            ) : !isActive && timeLeft === 0 ? (
                <div className="space-y-4">
                    <h3 className="text-2xl font-black">Time's Up!</h3>
                    <p className="text-3xl font-bold text-emerald-600">Final Score: {profile.gameScores.focus}</p>
                    <button onClick={startGame} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold">Try Again</button>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="flex justify-between items-center bg-gray-100 p-4 rounded-xl">
                        <span className="font-bold text-gray-500 uppercase tracking-widest text-xs">Time: {timeLeft}s</span>
                        <span className="font-bold text-emerald-600 uppercase tracking-widest text-xs">Score: {profile.gameScores.focus}</span>
                    </div>

                    <div className="h-40 flex items-center justify-center">
                        <span className={`text-6xl font-black transition-all ${textColor.hex}`}>
                            {word.name}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {options.map((opt, i) => (
                            <button 
                                key={i}
                                onClick={() => handleAnswer(opt.name)}
                                className="py-4 bg-white border-2 border-gray-200 rounded-xl font-bold hover:border-emerald-500 hover:bg-emerald-50 transition-all text-xl"
                            >
                                {opt.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sorting Game (Simple Click Version) ---

const ITEMS = [
    { id: 1, type: 'fruit', emoji: '🍎', name: 'Apple' },
    { id: 2, type: 'animal', emoji: '🐶', name: 'Dog' },
    { id: 3, type: 'fruit', emoji: '🍌', name: 'Banana' },
    { id: 4, type: 'animal', emoji: '🐱', name: 'Cat' },
    { id: 5, type: 'fruit', emoji: '🍇', name: 'Grape' },
    { id: 6, type: 'animal', emoji: '🐘', name: 'Elephant' },
    { id: 7, type: 'furniture', emoji: '🪑', name: 'Chair' },
    { id: 8, type: 'furniture', emoji: '🛌', name: 'Bed' },
];

const SortingGame: React.FC = () => {
    const { profile, setProfile } = useApp();
    const [queue, setQueue] = useState(ITEMS);
    const [currentItem, setCurrentItem] = useState(queue[0]);

    useEffect(() => {
        if (queue.length > 0) {
            setCurrentItem(queue[0]);
        }
    }, [queue]);

    const handleSort = (type: string) => {
        if (!currentItem) return;
        if (currentItem.type === type) {
            setProfile(prev => ({
                ...prev,
                gameScores: { ...prev.gameScores, sorting: prev.gameScores.sorting + 5 }
            }));
            const newQueue = queue.slice(1);
            setQueue(newQueue);
            if (newQueue.length === 0) {
                 setTimeout(() => setQueue(ITEMS.sort(() => Math.random() - 0.5)), 500); 
            }
        } else {
            alert("This belongs in another category!");
        }
    };

    if (!currentItem) return <div className="text-center font-bold text-green-600">All Sorted! Resetting...</div>;

    return (
        <div className="max-w-md mx-auto text-center space-y-8">
            <h3 className="text-xl font-bold">Score: {profile.gameScores.sorting}</h3>
            <p className="text-gray-500">Pick the correct category for this item.</p>

            <div className="h-32 flex flex-col items-center justify-center">
                 <div className="text-8xl animate-bounce">{currentItem.emoji}</div>
                 <div className="font-bold text-gray-700 mt-2">{currentItem.name}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => handleSort('animal')}
                    className="py-6 bg-blue-100 rounded-xl border-2 border-blue-300 hover:bg-blue-200"
                >
                    <span className="text-2xl block mb-1">🐾</span>
                    <span className="font-bold text-blue-900">Animals</span>
                </button>
                <button 
                    onClick={() => handleSort('fruit')}
                    className="py-6 bg-green-100 rounded-xl border-2 border-green-300 hover:bg-green-200"
                >
                    <span className="text-2xl block mb-1">🍎</span>
                    <span className="font-bold text-green-900">Fruits</span>
                </button>
                <button 
                    onClick={() => handleSort('furniture')}
                    className="col-span-2 py-6 bg-purple-100 rounded-xl border-2 border-purple-300 hover:bg-purple-200"
                >
                    <span className="text-2xl block mb-1">🪑</span>
                    <span className="font-bold text-purple-900">Furniture</span>
                </button>
            </div>
        </div>
    );
};

export default Games;
