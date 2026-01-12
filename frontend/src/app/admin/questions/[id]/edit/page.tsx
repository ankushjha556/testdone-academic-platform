'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
    ArrowLeft,
    Save,
    Check,
    Loader2,
} from 'lucide-react';

interface DropdownItem {
    id: string;
    name: string;
}

interface QuestionForm {
    questionText: string;
    questionType: string;
    difficulty: string;
    marks: number;
    negativeMarks: number;
    subjectId: string;
    topicId: string;
    examId: string;
    sectionId: string;
    status: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    solution: string;
    explanation: string;
}

export default function EditQuestionPage() {
    const router = useRouter();
    const params = useParams();
    const questionId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [subjects, setSubjects] = useState<DropdownItem[]>([]);
    const [topics, setTopics] = useState<DropdownItem[]>([]);
    const [exams, setExams] = useState<DropdownItem[]>([]);
    const [sections, setSections] = useState<DropdownItem[]>([]);

    const [formData, setFormData] = useState<QuestionForm>({
        questionText: '',
        questionType: 'MCQ_SINGLE',
        difficulty: 'MEDIUM',
        marks: 1,
        negativeMarks: 0.25,
        subjectId: '',
        topicId: '',
        examId: '',
        sectionId: '',
        status: 'DRAFT',
        options: [],
        solution: '',
        explanation: '',
    });

    useEffect(() => {
        loadData();
    }, [questionId]);

    // Load topics when subject changes
    useEffect(() => {
        if (formData.subjectId) loadTopics(formData.subjectId);
    }, [formData.subjectId]);

    // Load sections when exam changes
    useEffect(() => {
        if (formData.examId) loadSections(formData.examId);
    }, [formData.examId]);

    const loadData = async () => {
        try {
            const [qRes, subRes, examRes] = await Promise.all([
                api.get<{ question: any }>(`/admin/questions/${questionId}`),
                api.get<{ subjects: DropdownItem[] }>('/admin/subjects'),
                api.get<{ exams: DropdownItem[] }>('/admin/exams'),
            ]);

            if (subRes.success && subRes.data?.subjects) setSubjects(subRes.data.subjects);
            if (examRes.success && examRes.data?.exams) setExams(examRes.data.exams);

            if (qRes.success && qRes.data?.question) {
                const q = qRes.data.question;
                // Parse options if string (Prisma Json type handling)
                let parsedOptions = q.options;
                if (typeof q.options === 'string') {
                    try { parsedOptions = JSON.parse(q.options); } catch (e) { }
                }

                setFormData({
                    questionText: q.questionText || '',
                    questionType: q.questionType || 'MCQ_SINGLE',
                    difficulty: q.difficulty || 'MEDIUM',
                    marks: q.marks || 1,
                    negativeMarks: q.negativeMarks || 0.25,
                    subjectId: q.subjectId || '',
                    topicId: q.topicId || '',
                    examId: q.questionExams?.[0]?.examId || '',
                    sectionId: q.sectionId || '',
                    status: q.status || 'DRAFT',
                    options: Array.isArray(parsedOptions) ? parsedOptions : [
                        { id: 'A', text: '', isCorrect: false },
                        { id: 'B', text: '', isCorrect: false },
                        { id: 'C', text: '', isCorrect: false },
                        { id: 'D', text: '', isCorrect: false },
                    ],
                    solution: q.solution || '',
                    explanation: q.explanation || '', // Assuming this maps to conceptNote or similar if expl not exists
                });
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTopics = async (subjectId: string) => {
        try {
            const res = await api.get<{ topics: DropdownItem[] }>(`/admin/subjects/${subjectId}/topics`);
            if (res.success && res.data?.topics) setTopics(res.data.topics);
        } catch (error) {
            console.error('Failed to load topics:', error);
        }
    };

    const loadSections = async (examId: string) => {
        try {
            const res = await api.get<{ sections: DropdownItem[] }>(`/admin/exams/${examId}/sections`);
            if (res.success && res.data?.sections) setSections(res.data.sections);
        } catch (error) {
            console.error('Failed to load sections:', error);
        }
    };

    const handleOptionChange = (index: number, field: string, value: any) => {
        const newOptions = [...formData.options];
        if (field === 'isCorrect' && formData.questionType === 'MCQ_SINGLE') {
            newOptions.forEach(opt => opt.isCorrect = false);
        }
        newOptions[index] = { ...newOptions[index], [field]: value };
        setFormData({ ...formData, options: newOptions });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const correctOption = formData.options.find(o => o.isCorrect);
            if (!correctOption) {
                alert('Please select a correct answer');
                setSaving(false);
                return;
            }

            const payload = {
                ...formData,
                questionExams: formData.examId ? [{ examId: formData.examId }] : [],
                correctAnswer: correctOption.id,
            };

            const res = await api.put(`/admin/questions/${questionId}`, payload);
            if (res.success) {
                alert('Question updated successfully');
                router.push('/admin/questions');
            } else {
                alert('Failed to update: ' + res.error?.message);
            }
        } catch (error) {
            console.error('Error updating question:', error);
            alert('Failed to update question');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/questions" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Edit Question</h1>
            </div>

            <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Question Content</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Question Text *</label>
                                <textarea
                                    value={formData.questionText}
                                    onChange={e => setFormData({ ...formData, questionText: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Options</h2>
                        <div className="space-y-3">
                            {formData.options.map((option, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-8 flex justify-center font-bold text-gray-500">{option.id}</div>
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={e => handleOptionChange(idx, 'text', e.target.value)}
                                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                        placeholder={`Option ${option.id}`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleOptionChange(idx, 'isCorrect', !option.isCorrect)}
                                        className={`p-2 rounded-lg border ${option.isCorrect
                                            ? 'bg-green-500/20 border-green-500 text-green-500'
                                            : 'border-gray-700 text-gray-500 hover:border-gray-500'
                                            }`}
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Solution & Explanation</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Detailed Solution</label>
                                <textarea
                                    value={formData.explanation}
                                    onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Classification</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Subject *</label>
                                <select
                                    value={formData.subjectId}
                                    onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    required
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Topic</label>
                                <select
                                    value={formData.topicId}
                                    onChange={e => setFormData({ ...formData, topicId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="">Select Topic</option>
                                    {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="PUBLISHED">Published</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Exam Association</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Exam</label>
                                <select
                                    value={formData.examId}
                                    onChange={e => setFormData({ ...formData, examId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="">Select Exam</option>
                                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Section</label>
                                <select
                                    value={formData.sectionId}
                                    onChange={e => setFormData({ ...formData, sectionId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    disabled={!formData.examId}
                                >
                                    <option value="">Select Section</option>
                                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Marks</label>
                                    <input
                                        type="number"
                                        value={formData.marks}
                                        onChange={e => setFormData({ ...formData, marks: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Neg. Marks</label>
                                    <input
                                        type="number"
                                        value={formData.negativeMarks}
                                        onChange={e => setFormData({ ...formData, negativeMarks: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Update Question
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
