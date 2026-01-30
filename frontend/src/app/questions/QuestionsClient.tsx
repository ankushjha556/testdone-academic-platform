'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    Search,
    Loader2,
    Bookmark,
    BookmarkCheck,
    CheckCircle2,
    XCircle,
    Lock,
    Filter,
    ChevronDown,
    RefreshCw,
    BookOpen,
    GraduationCap,
    AlertCircle,
    Brain,
    Target,
    History,
    TrendingUp,
    Zap,
    ArrowLeft,
    Trophy,
    Target as TargetIcon,
    Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Subject {
    id: string;
    name: string;
    slug: string;
    topicsCount: number;
}

interface Topic {
    id: string;
    name: string;
    slug: string;
    questionsCount?: number;
}

interface Exam {
    id: string;
    name: string;
    slug: string;
}

interface QuestionOption {
    id: string;
    text: string;
    isCorrect?: boolean;
}

interface Question {
    id: string;
    questionText: string;
    questionType: string;
    options: QuestionOption[];
    difficulty: string;
    subject: { name: string; slug: string };
    topic: { name: string; slug: string } | null;
    exams?: Exam[];
    userAttempt: { isCorrect: boolean } | null;
}

interface Pagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
}

// --- Helper Functions ---

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

// Phase 2: Passage/RC Question Detection
// Detects Reading Comprehension or paragraph-based questions
const isPassageQuestion = (questionText: string): boolean => {
    if (!questionText) return false;
    const passageIndicators = [
        /read the (following )?passage/i,
        /direction.*:.*read/i,
        /comprehension/i,
        /passage.*given.*below/i,
        /<p>.*<\/p>.*<p>.*<\/p>.*<p>/i, // Multiple paragraphs
    ];
    // Long text (>400 chars) or matches pattern
    return questionText.length > 400 || passageIndicators.some(r => r.test(questionText));
};

// Extract passage from question text (returns null if not a passage question)
const extractPassage = (questionText: string): { passage: string; question: string } | null => {
    if (!isPassageQuestion(questionText)) return null;

    // Try to split on common patterns
    const splitPatterns = [
        /(<br\s*\/?>\s*){2,}/i,  // Multiple line breaks
        /(?=<p><strong>Q\d)/i,   // Question marker
        /(\n\n|\r\n\r\n)/,       // Double newlines
    ];

    for (const pattern of splitPatterns) {
        const parts = questionText.split(pattern);
        if (parts.length >= 2 && parts[0].length > 200) {
            return { passage: parts[0], question: parts.slice(1).join('') };
        }
    }

    // If can't split, treat entire text as passage with embedded question
    return { passage: questionText, question: '' };
};

// Canonical subjects for Question Bank v2 - Subject-First Design
// Each subject has name and default slug. System supports subjects with 0 questions for future ingestion.
const CANONICAL_SUBJECTS = [
    { name: 'Quantitative Aptitude', slug: 'quantitative-aptitude' },
    { name: 'Reasoning Ability', slug: 'reasoning-ability' },
    { name: 'English Language', slug: 'english-language' },
    { name: 'General Awareness', slug: 'general-awareness' },
    { name: 'Computer Awareness', slug: 'computer-awareness' },
    { name: 'Data Interpretation', slug: 'data-interpretation' },
    { name: 'Current Affairs', slug: 'current-affairs' },
];

// Practice Modes - Intelligent learning system
type PracticeMode = 'learn' | 'exam' | 'fix_weak' | 'confidence' | 'revision';

const PRACTICE_MODES: { id: PracticeMode; name: string; description: string; icon: React.ReactNode }[] = [
    { id: 'learn', name: 'Learn Mode', description: 'See solution immediately after answering', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'exam', name: 'Exam Mode', description: 'Timer enabled, solution hidden until end', icon: <TargetIcon className="w-4 h-4" /> },
    { id: 'fix_weak', name: 'Fix Weak Areas', description: 'Focus on your weakest topics', icon: <Brain className="w-4 h-4" /> },
    { id: 'confidence', name: 'Confidence Builder', description: 'Medium difficulty for steady progress', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'revision', name: 'Revision Mode', description: 'Review previously attempted questions', icon: <History className="w-4 h-4" /> },
];

// --- Sub-Components ---

const Badge = ({ children, className, variant = 'default' }: { children: React.ReactNode, className?: string, variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline' }) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        primary: 'bg-primary-50 text-primary-700 border border-primary-100 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-800',
        success: 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
        warning: 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
        error: 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
        outline: 'bg-transparent border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

export default function QuestionsClient() {
    const { user, isLoading: authLoading } = useAuth();
    const searchParams = useSearchParams();

    // Data State
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter State (Subject-first: No exam filter)
    const [filters, setFilters] = useState({
        subject: searchParams.get('subject') || '',
        topic: searchParams.get('topic') || '',
        difficulty: searchParams.get('difficulty') || '',
        search: searchParams.get('search') || '',
    });

    // Interaction State
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
    const [solutions, setSolutions] = useState<Record<string, any>>({});
    const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
    const [pagination, setPagination] = useState<Pagination>({
        currentPage: 1, totalPages: 1, totalItems: 0, perPage: 50
    });
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    // UI Loading States
    const [isPremiumRequired, setIsPremiumRequired] = useState(false);
    const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
    const [isTopicsLoading, setIsTopicsLoading] = useState(false);
    const [isSessionSummaryOpen, setIsSessionSummaryOpen] = useState(false);

    // Practice Mode State
    const [practiceMode, setPracticeMode] = useState<PracticeMode>('learn');

    // Exam Mode Timer (30 minutes = 1800 seconds)
    const [examTimeRemaining, setExamTimeRemaining] = useState<number>(1800);
    const [isExamTimerActive, setIsExamTimerActive] = useState<boolean>(false);

    // Timer effect for Exam Mode
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (practiceMode === 'exam' && isExamTimerActive && examTimeRemaining > 0) {
            interval = setInterval(() => {
                setExamTimeRemaining(prev => {
                    if (prev <= 1) {
                        setIsExamTimerActive(false);
                        setIsSessionSummaryOpen(true); // Auto-end session when time runs out
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [practiceMode, isExamTimerActive, examTimeRemaining]);

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Session Tracking for Intelligent Question Flow (Phase 4)
    const [attemptedQuestionIds, setAttemptedQuestionIds] = useState<Set<string>>(() => {
        // Restore from sessionStorage for page refreshes
        if (typeof window !== 'undefined') {
            try {
                const stored = sessionStorage.getItem('qb_attempted_ids');
                return stored ? new Set(JSON.parse(stored)) : new Set();
            } catch {
                return new Set();
            }
        }
        return new Set();
    });

    // Persist attempted IDs to sessionStorage
    useEffect(() => {
        if (attemptedQuestionIds.size > 0) {
            sessionStorage.setItem('qb_attempted_ids', JSON.stringify(Array.from(attemptedQuestionIds)));
        }
    }, [attemptedQuestionIds]);

    // --- Initial Load ---
    useEffect(() => {
        loadSubjects();
    }, []);

    // Load topics when subject changes
    useEffect(() => {
        if (filters.subject) {
            loadTopics(filters.subject);
        } else {
            setTopics([]);
            setFilters(f => ({ ...f, topic: '' }));
        }
    }, [filters.subject]);

    // Load questions when filters or practice mode change
    useEffect(() => {
        if (user) {
            loadQuestions(1);
        } else {
            setIsLoading(false);
        }
    }, [user, filters.subject, filters.topic, filters.difficulty, filters.search, practiceMode]);

    // Phase 7: Keyboard Shortcuts for Premium UX
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const currentQuestion = questions[0]; // First question in view
            if (!currentQuestion) return;

            const qId = currentQuestion.id;

            // 1-4 for selecting options
            if (['1', '2', '3', '4'].includes(e.key) && !showSolution[qId]) {
                const optionIndex = parseInt(e.key) - 1;
                if (currentQuestion.options[optionIndex]) {
                    setSelectedAnswers(prev => ({ ...prev, [qId]: currentQuestion.options[optionIndex].id }));
                    toast.success(`Option ${e.key} selected`, { duration: 1000 });
                }
            }

            // Enter to submit/check answer
            if (e.key === 'Enter' && selectedAnswers[qId] && !showSolution[qId]) {
                e.preventDefault();
                checkAnswer(qId);
            }

            // Space to toggle solution visibility
            if (e.key === ' ' && solutions[qId]) {
                e.preventDefault();
                setShowSolution(prev => ({ ...prev, [qId]: !prev[qId] }));
            }

            // Escape to close session summary
            if (e.key === 'Escape' && isSessionSummaryOpen) {
                setIsSessionSummaryOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [questions, selectedAnswers, showSolution, solutions, isSessionSummaryOpen]);

    // Phase 4: Handle practice mode changes
    const handleModeChange = (newMode: PracticeMode) => {
        setPracticeMode(newMode);
        // Reset answers and solutions when switching modes
        setSelectedAnswers({});
        setShowSolution({});
        setSolutions({});
        // Show toast for intelligent modes
        if (newMode === 'fix_weak') {
            toast.success('Loading questions from your weak areas...');
        } else if (newMode === 'revision') {
            toast.success('Loading previously attempted questions...');
        } else if (newMode === 'confidence') {
            toast.success('Loading accuracy-boosting questions...');
        } else if (newMode === 'exam') {
            // Start exam timer
            setExamTimeRemaining(1800); // Reset to 30 minutes
            setIsExamTimerActive(true);
            toast.success('Exam Mode started! 30 minute timer active.');
        } else {
            // Stop timer for other modes
            setIsExamTimerActive(false);
        }
    };

    // --- API Calls ---

    const loadSubjects = async () => {
        setIsSubjectsLoading(true);
        try {
            const response = await api.get<{ subjects: Subject[] }>('/subjects/with-questions');
            const apiSubjects = response.success ? (response.data?.subjects || []) : [];

            // Build subject list from canonical subjects, merging with API data where available
            // This supports subjects with 0 questions for future ingestion
            const mergedSubjects: Subject[] = CANONICAL_SUBJECTS.map(canonical => {
                // Find matching API subject (case-insensitive)
                const apiMatch = apiSubjects.find(s =>
                    s.name.toLowerCase() === canonical.name.toLowerCase()
                );

                // Return API subject if found (has real slug + topicsCount), else use canonical defaults
                return apiMatch || {
                    id: canonical.slug, // Use slug as ID for future subjects
                    name: canonical.name,
                    slug: canonical.slug,
                    topicsCount: 0, // No topics yet
                };
            });

            setSubjects(mergedSubjects);

            // Validate current subject selection against merged list
            if (filters.subject && mergedSubjects.length > 0) {
                const valid = mergedSubjects.find(s => s.slug === filters.subject);
                if (!valid) setFilters(prev => ({ ...prev, subject: '' }));
            }
        } catch (error) {
            console.error('Failed subjects:', error);
            // On error, still show canonical subjects for graceful degradation
            setSubjects(CANONICAL_SUBJECTS.map(c => ({
                id: c.slug,
                name: c.name,
                slug: c.slug,
                topicsCount: 0,
            })));
        } finally {
            setIsSubjectsLoading(false);
        }
    };

    // Load topics for selected subject
    const loadTopics = async (subjectSlug: string) => {
        setIsTopicsLoading(true);
        setTopics([]);
        try {
            const response = await api.get<{ subject: { id: string; name: string; slug: string }; topics: Topic[] }>(`/subjects/${subjectSlug}/topics`);
            if (response.success && response.data?.topics) {
                setTopics(response.data.topics);
            }
        } catch (error) {
            console.error('Failed to load topics:', error);
            // Graceful fallback - no topics is fine
        } finally {
            setIsTopicsLoading(false);
        }
    };

    const loadQuestions = async (page = 1) => {
        setIsLoading(true);
        setIsPremiumRequired(false);
        try {
            // Phase 4: Use smart-practice API for intelligent modes
            const intelligentModes: Record<string, string> = {
                'fix_weak': 'fix-weak',
                'revision': 'retry-mistakes',
                'confidence': 'accuracy-booster',
            };

            if (practiceMode in intelligentModes) {
                // Call smart-practice API for personalized questions
                const modeParam = intelligentModes[practiceMode];
                const params = new URLSearchParams();
                params.append('mode', modeParam);
                params.append('limit', '20');
                if (filters.subject) params.append('subject', filters.subject);

                const response = await api.get<{ questions: any[], count: number, mode: string }>(`/smart-practice/questions?${params.toString()}`);

                if (response.success && response.data?.questions) {
                    // Map smart-practice response format to Question format
                    const mappedQuestions: Question[] = response.data.questions.map(q => ({
                        id: q.id,
                        questionText: q.questionText,
                        questionType: q.questionType || 'MCQ',
                        options: shuffleArray(q.options || []),
                        difficulty: q.difficulty,
                        subject: { name: q.subject, slug: q.subject?.toLowerCase().replace(/\s+/g, '-') || '' },
                        topic: q.topic ? { name: q.topic, slug: q.topic.toLowerCase().replace(/\s+/g, '-') } : null,
                        exams: [],
                        userAttempt: null,
                    }));
                    setQuestions(mappedQuestions);
                    setPagination({
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: mappedQuestions.length,
                        perPage: mappedQuestions.length,
                    });
                } else if (response.error?.code === 'PREMIUM_REQUIRED') {
                    setIsPremiumRequired(true);
                    setQuestions([]);
                } else {
                    // Fallback message if no questions found for mode
                    toast.error('No personalized questions available yet. Practice more to unlock smart features!');
                    setQuestions([]);
                }
            } else {
                // Standard question bank flow for learn/exam modes
                const params = new URLSearchParams();
                params.append('page', page.toString());
                params.append('limit', '50');
                // Subject-first filters with topic support
                if (filters.subject) params.append('subject', filters.subject);
                if (filters.topic) params.append('topic', filters.topic);
                if (filters.difficulty) params.append('difficulty', filters.difficulty);
                if (filters.search) params.append('search', filters.search);

                const response = await api.get<{ questions: Question[], pagination: Pagination }>(`/questions?${params.toString()}`);
                if (response.success) {
                    const rawQuestions = response.data?.questions || [];

                    // Phase 5: Intelligent Question Flow
                    // Sort questions to deprioritize already-attempted ones in this session
                    const sortedQuestions = [...rawQuestions].sort((a, b) => {
                        const aAttempted = attemptedQuestionIds.has(a.id) ? 1 : 0;
                        const bAttempted = attemptedQuestionIds.has(b.id) ? 1 : 0;
                        return aAttempted - bAttempted; // Unattempted first
                    });

                    // Shuffle options for each question
                    const shuffled = sortedQuestions.map(q => ({
                        ...q,
                        options: shuffleArray(q.options)
                    }));
                    setQuestions(shuffled);
                    if (response.data?.pagination) setPagination(response.data.pagination);
                } else if (response.error?.code === 'PREMIUM_REQUIRED') {
                    setIsPremiumRequired(true);
                    setQuestions([]);
                }
            }
        } catch (error) {
            toast.error('Could not load questions');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Handlers ---

    const checkAnswer = async (questionId: string) => {
        try {
            const response = await api.get<{ correctAnswer: string; solution: string }>(`/questions/${questionId}/solution`);
            if (response.success && response.data) {
                const question = questions.find(q => q.id === questionId);
                const correctOption = question?.options.find(o => o.isCorrect === true);
                const solutionData = {
                    ...response.data,
                    correctOptionId: correctOption?.id || response.data.correctAnswer
                };
                setSolutions(prev => ({ ...prev, [questionId]: solutionData }));
                setShowSolution(prev => ({ ...prev, [questionId]: true }));

                // Phase 4: Track this question as attempted in session
                setAttemptedQuestionIds(prev => {
                    const next = new Set(prev);
                    next.add(questionId);
                    return next;
                });

                // Track the answer for Mistake Intelligence (non-blocking)
                const selectedOption = selectedAnswers[questionId];
                if (selectedOption) {
                    api.post(`/questions/${questionId}/track-attempt`, {
                        selectedOption,
                    }).catch(() => { }); // Silent failure - tracking is non-blocking
                }
            }
        } catch (e) { toast.error('Failed to load solution'); }
    };

    const toggleBookmark = async (questionId: string) => {
        try {
            const response = await api.post(`/questions/${questionId}/bookmark`);
            if (response.success) {
                setBookmarks(prev => {
                    const next = new Set(prev);
                    next.has(questionId) ? next.delete(questionId) : next.add(questionId);
                    toast.success(next.has(questionId) ? 'Bookmarked' : 'Removed bookmark');
                    return next;
                });
            }
        } catch (e) { toast.error('Failed to update bookmark'); }
    };

    const resetFilters = () => setFilters({ subject: '', topic: '', difficulty: '', search: '' });

    // --- Render ---

    if (!user && !authLoading) {
        return (
            <div className="max-w-4xl mx-auto mt-12 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl text-center border border-gray-100 dark:border-gray-700">
                <Lock className="w-16 h-16 text-primary-500 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Unlock the Question Bank</h3>
                <div className="flex justify-center gap-4">
                    <a href="/login" className="btn btn-primary px-8">Login to Practice</a>
                </div>
            </div>
        );
    }

    if (isPremiumRequired) {
        return (
            <div className="max-w-4xl mx-auto mt-12 p-12 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-3xl text-center border border-amber-100 dark:border-amber-800/30">
                <Lock className="w-16 h-16 text-amber-500 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Premium Content</h3>
                <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">Upgrade to access over 1.5 Lakh verified questions.</p>
                <div className="flex justify-center gap-4">
                    <a href="/pricing" className="btn btn-primary bg-gradient-to-r from-amber-500 to-orange-500 border-0">Upgrade Now</a>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8 pb-20" data-version="v3.0-premium-polish">

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-6">
                <button
                    onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                    <span className="font-semibold flex items-center gap-2">
                        <Filter className="w-5 h-5 text-primary-600" /> Filters
                    </span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* --- LEFT SIDEBAR: FILTERS --- */}
                <aside className={`lg:col-span-1 space-y-8 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>

                    {/* Filter Panel */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Filters
                            </h3>
                            {(filters.subject || filters.difficulty) && (
                                <button onClick={resetFilters} className="text-xs text-red-600 hover:text-red-700 font-medium">
                                    Clear All
                                </button>
                            )}
                        </div>


                        {/* Practice Mode Selector */}
                        <div className="mb-8">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Practice Mode</label>
                            <div className="space-y-2">
                                {PRACTICE_MODES.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => handleModeChange(mode.id)}
                                        disabled={false} // All modes now enabled via smart-practice API
                                        className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${practiceMode === mode.id
                                            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                                            : false
                                                ? 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                                                : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${practiceMode === mode.id
                                            ? 'bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-300'
                                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {mode.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${practiceMode === mode.id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {mode.name}
                                                </span>
                                                {(mode.id === 'fix_weak' || mode.id === 'revision' || mode.id === 'confidence') && (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">AI</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{mode.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty Filter (Segmented Control) */}
                        <div className="mb-8">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Difficulty</label>
                            <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                {['EASY', 'MEDIUM', 'HARD'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setFilters(f => ({ ...f, difficulty: f.difficulty === level ? '' : level }))}
                                        className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${filters.difficulty === level
                                            ? level === 'EASY' ? 'bg-white text-green-700 shadow-sm'
                                                : level === 'MEDIUM' ? 'bg-white text-amber-700 shadow-sm'
                                                    : 'bg-white text-red-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subject Filter */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Subject</label>
                            <div className="space-y-1">
                                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="subject"
                                        checked={filters.subject === ''}
                                        onChange={() => setFilters(f => ({ ...f, subject: '', topic: '' }))}
                                        className="text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm font-medium">All Subjects</span>
                                </label>
                                {isSubjectsLoading ? (
                                    <div className="py-4 text-center text-gray-400 text-xs">Loading...</div>
                                ) : subjects.map(s => (
                                    <label key={s.slug} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="subject"
                                            checked={filters.subject === s.slug}
                                            onChange={() => setFilters(f => ({ ...f, subject: s.slug, topic: '' }))}
                                            className="text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{s.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Topic Filter - Only visible when subject is selected and topics exist */}
                        {filters.subject && (topics.length > 0 || isTopicsLoading) && (
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Topic</label>
                                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="topic"
                                            checked={filters.topic === ''}
                                            onChange={() => setFilters(f => ({ ...f, topic: '' }))}
                                            className="text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm font-medium">All Topics</span>
                                    </label>
                                    {isTopicsLoading ? (
                                        <div className="py-4 text-center text-gray-400 text-xs">Loading topics...</div>
                                    ) : topics.map(t => (
                                        <label key={t.slug} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="topic"
                                                checked={filters.topic === t.slug}
                                                onChange={() => setFilters(f => ({ ...f, topic: t.slug }))}
                                                className="text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{t.name}</span>
                                            {t.questionsCount !== undefined && (
                                                <span className="ml-auto text-xs text-gray-400">{t.questionsCount}</span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Informational Note */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                <strong className="text-gray-700 dark:text-gray-300">Note:</strong> This question bank is curated from Previous Year Questions (PYQs) and various trusted exam-oriented sources, featuring 1.5 lakh+ high-quality questions for focused and result-driven practice. It covers most core subjects and frequently tested topics, helping you assess your preparation, strengthen concepts, and master real exam patterns with confidence.
                            </p>
                        </div>

                    </div>
                </aside>

                {/* --- RIGHT COLUMN: QUESTIONS --- */}
                <main className="lg:col-span-3">

                    {/* Search Bar Area & Session Controls */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search questions by keyword..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-base"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>

                        {/* Exam Mode Timer Display */}
                        {practiceMode === 'exam' && isExamTimerActive && (
                            <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-mono text-lg font-bold shadow-lg ${examTimeRemaining <= 300
                                ? 'bg-red-500 text-white animate-pulse'
                                : examTimeRemaining <= 600
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-primary-600 text-white'
                                }`}>
                                <Clock className="w-5 h-5" />
                                {formatTime(examTimeRemaining)}
                            </div>
                        )}

                        {/* Phase 5: Finish Session Button */}
                        {attemptedQuestionIds.size > 0 && (
                            <button
                                onClick={() => {
                                    setIsExamTimerActive(false);
                                    setIsSessionSummaryOpen(true);
                                }}
                                className="btn btn-primary px-6 rounded-2xl shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Trophy className="w-5 h-5" /> Finish Session
                            </button>
                        )}
                    </div>

                    {/* Phase 5 & 6: Session Summary with Insights */}
                    {isSessionSummaryOpen ? (() => {
                        // Phase 6: Calculate detailed session insights
                        const attempted = Array.from(attemptedQuestionIds);
                        const attemptedQuestions = questions.filter(q => attemptedQuestionIds.has(q.id));

                        // Calculate accuracy per subject
                        const subjectStats: Record<string, { correct: number; total: number }> = {};
                        attempted.forEach(id => {
                            const question = questions.find(q => q.id === id);
                            const subject = question?.subject?.name || 'Unknown';
                            if (!subjectStats[subject]) subjectStats[subject] = { correct: 0, total: 0 };
                            subjectStats[subject].total++;

                            const selected = selectedAnswers[id];
                            const solution = solutions[id];
                            if (selected && solution?.correctOptionId && selected === solution.correctOptionId) {
                                subjectStats[subject].correct++;
                            }
                        });

                        const totalCorrect = Object.values(subjectStats).reduce((sum, s) => sum + s.correct, 0);
                        const accuracy = attempted.length > 0 ? Math.round((totalCorrect / attempted.length) * 100) : 0;

                        // Find weakest subject
                        const subjectAccuracies = Object.entries(subjectStats)
                            .map(([name, stats]) => ({
                                name,
                                accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
                                total: stats.total,
                                correct: stats.correct,
                            }))
                            .sort((a, b) => a.accuracy - b.accuracy);

                        const weakestSubject = subjectAccuracies.find(s => s.total >= 2);
                        const strongestSubject = [...subjectAccuracies].reverse().find(s => s.total >= 2);

                        // Generate recommendation
                        const getRecommendation = () => {
                            if (attempted.length < 5) return "Practice more questions to get personalized insights.";
                            if (weakestSubject && weakestSubject.accuracy < 50) {
                                return `Focus on ${weakestSubject.name}. Consider reviewing fundamentals and attempting easier questions first.`;
                            }
                            if (accuracy >= 80) {
                                return "Excellent performance! Try increasing difficulty to challenge yourself further.";
                            }
                            if (accuracy >= 60) {
                                return "Good progress. Focus on your weak areas to push accuracy above 80%.";
                            }
                            return "Review solutions carefully. Understanding the logic behind correct answers will improve your accuracy significantly.";
                        };

                        return (
                            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 animate-fade-in">
                                <div className="text-center mb-10">
                                    <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Trophy className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Session Complete!</h2>
                                    <p className="text-gray-500">Here's your performance summary and insights.</p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Attempted</p>
                                        <p className="text-4xl font-bold text-gray-900 dark:text-white">{attempted.length}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Accuracy</p>
                                        <p className={`text-4xl font-bold ${accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                            {accuracy}%
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Correct</p>
                                        <p className="text-4xl font-bold text-green-600">{totalCorrect} <span className="text-xl text-gray-400">/ {attempted.length}</span></p>
                                    </div>
                                </div>

                                {/* Phase 6: Subject-wise Performance */}
                                {subjectAccuracies.length > 0 && (
                                    <div className="mb-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Subject-wise Performance</h3>
                                        <div className="space-y-3">
                                            {subjectAccuracies.map(subject => (
                                                <div key={subject.name} className="flex items-center gap-4">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 w-40 truncate">{subject.name}</span>
                                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                                        <div
                                                            className={`h-2.5 rounded-full ${subject.accuracy >= 80 ? 'bg-green-500' : subject.accuracy >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                            style={{ width: `${subject.accuracy}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-sm font-semibold w-16 text-right ${subject.accuracy >= 80 ? 'text-green-600' : subject.accuracy >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                                        {subject.accuracy}%
                                                    </span>
                                                    <span className="text-xs text-gray-400 w-12">({subject.correct}/{subject.total})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Phase 6: AI Recommendation */}
                                <div className="mb-8 bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-6 border border-primary-100 dark:border-primary-800">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg">
                                            <Brain className="w-5 h-5 text-primary-600 dark:text-primary-300" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider mb-2">Recommendation</h3>
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{getRecommendation()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => setIsSessionSummaryOpen(false)}
                                        className="btn btn-outline px-8 rounded-full flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Return to Questions
                                    </button>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="btn btn-primary px-8 rounded-full flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" /> Start New Session
                                    </button>
                                </div>
                            </div>
                        );
                    })() : isLoading ? (
                        <div className="space-y-6">
                            {[1, 2].map(i => (
                                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 animate-pulse">
                                    <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-1/4 mb-4" />
                                    <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded mb-6" />
                                    <div className="grid grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(j => <div key={j} className="h-12 bg-gray-100 dark:bg-gray-800 rounded" />)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-200 dark:border-gray-800">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No questions found</h3>
                            <p className="text-gray-500 mt-2 mb-6">Try adjusting your filters to see more results.</p>
                            <button onClick={resetFilters} className="btn btn-outline">Clear Filters</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {questions.map((question, idx) => {
                                const questionNumber = ((pagination.currentPage - 1) * pagination.perPage) + idx + 1;
                                const isBookmarked = bookmarks.has(question.id);
                                const solution = solutions[question.id];
                                const hasSolution = showSolution[question.id];

                                return (
                                    <div key={question.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">

                                        {/* Card Header */}
                                        <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/30">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                                                    Q. {questionNumber}
                                                </span>
                                                <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
                                                <Badge variant="primary" className="flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" /> {question.subject.name}
                                                </Badge>
                                                {question.exams?.[0] && (
                                                    <Badge variant="outline" className="flex items-center gap-1">
                                                        <GraduationCap className="w-3 h-3" /> {question.exams[0].name}
                                                    </Badge>
                                                )}
                                                <Badge variant={question.difficulty === 'EASY' ? 'success' : question.difficulty === 'MEDIUM' ? 'warning' : 'error'}>
                                                    {question.difficulty}
                                                </Badge>
                                            </div>
                                            <button
                                                onClick={() => toggleBookmark(question.id)}
                                                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isBookmarked ? 'text-amber-500' : 'text-gray-400'}`}
                                            >
                                                {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        {/* Question Body */}
                                        <div className="p-6 md:p-8">
                                            <div className="prose dark:prose-invert max-w-none mb-8 text-gray-900 dark:text-gray-100 text-lg leading-relaxed font-medium font-serif-heading"
                                                dangerouslySetInnerHTML={{ __html: question.questionText }}
                                            />

                                            {/* Options */}
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {question.options.map((option, optsIdx) => {
                                                    const label = String.fromCharCode(65 + optsIdx);
                                                    const isSelected = selectedAnswers[question.id] === option.id;
                                                    const isCorrect = option.isCorrect === true || solution?.correctOptionId === option.id;

                                                    // State Logic
                                                    let stateClass = "border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50/30";
                                                    let indicatorClass = "bg-gray-100 text-gray-600";

                                                    if (hasSolution) {
                                                        if (isCorrect) {
                                                            stateClass = "border-green-500 bg-green-50/50 dark:bg-green-900/10 ring-1 ring-green-500";
                                                            indicatorClass = "bg-green-500 text-white";
                                                        } else if (isSelected) {
                                                            stateClass = "border-red-500 bg-red-50/50 dark:bg-red-900/10 ring-1 ring-red-500";
                                                            indicatorClass = "bg-red-500 text-white";
                                                        } else {
                                                            stateClass = "opacity-50 border-gray-100";
                                                        }
                                                    } else if (isSelected) {
                                                        stateClass = "border-primary-600 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-600";
                                                        indicatorClass = "bg-primary-600 text-white";
                                                    }

                                                    return (
                                                        <button
                                                            key={option.id}
                                                            onClick={() => !hasSolution && setSelectedAnswers(p => ({ ...p, [question.id]: option.id }))}
                                                            disabled={hasSolution}
                                                            className={`relative flex items-start p-4 rounded-xl border-2 text-left transition-all duration-200 group ${stateClass}`}
                                                        >
                                                            {/* Keyboard shortcut badge */}
                                                            {!hasSolution && idx === 0 && (
                                                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-bold flex items-center justify-center text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {optsIdx + 1}
                                                                </span>
                                                            )}
                                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${indicatorClass}`}>
                                                                {label}
                                                            </span>
                                                            <span className="ml-4 text-base text-gray-800 dark:text-gray-200 pt-1">
                                                                {option.text}
                                                            </span>
                                                            {hasSolution && isCorrect && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-green-600" />}
                                                            {hasSolution && isSelected && !isCorrect && <XCircle className="absolute top-4 right-4 w-5 h-5 text-red-500" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Action / Solution */}
                                            <div className="mt-8 flex flex-col items-start gap-4">
                                                {!hasSolution && selectedAnswers[question.id] && (
                                                    <button
                                                        onClick={() => checkAnswer(question.id)}
                                                        className="btn btn-primary px-8 shadow-xl shadow-primary-500/20 animate-fade-in"
                                                    >
                                                        Submit Answer
                                                    </button>
                                                )}

                                                {hasSolution && solution && (
                                                    <div className="w-full animate-slide-up">
                                                        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-6">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                                                    <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-300" />
                                                                </div>
                                                                <h4 className="font-bold text-blue-900 dark:text-blue-100">Explanation</h4>
                                                            </div>
                                                            <div
                                                                className="prose prose-sm prose-blue dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                                                dangerouslySetInnerHTML={{ __html: solution.solution || 'Detailed solution coming soon.' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {!isSessionSummaryOpen && questions.length > 0 && (
                        <div className="mt-12 flex items-center justify-center gap-4">
                            <button
                                onClick={() => {
                                    if (pagination.currentPage > 1) {
                                        loadQuestions(pagination.currentPage - 1);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                }}
                                disabled={pagination.currentPage === 1}
                                className="btn btn-outline rounded-full px-6 bg-white dark:bg-gray-800"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-medium text-gray-500">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => {
                                    if (pagination.currentPage < pagination.totalPages) {
                                        loadQuestions(pagination.currentPage + 1);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                }}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="btn btn-primary rounded-full px-8 shadow-lg shadow-primary-500/20"
                            >
                                Next Page
                            </button>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
