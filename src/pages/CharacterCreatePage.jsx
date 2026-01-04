
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wand2, Save, Loader2, RefreshCw } from 'lucide-react'
import { generateCharacterImage } from '../lib/gemini'
import { supabase } from '../lib/supabaseClient'

export default function CharacterCreatePage() {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        tool: '',
        hp: 100,
        attack: 10
    })

    const [generatedImage, setGeneratedImage] = useState(null) // SVG string
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleGenerate = async () => {
        if (!formData.name || !formData.description || !formData.tool) {
            alert('모든 칸을 채워주세요!')
            return
        }

        setIsGenerating(true)
        setGeneratedImage(null)

        try {
            const svgCode = await generateCharacterImage(formData.name, formData.description, formData.tool)
            setGeneratedImage(svgCode)
        } catch (error) {
            console.error(error)
            alert('캐릭터 소환에 실패했어요. 다시 시도해주세요!')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSave = async () => {
        if (!generatedImage) return
        setIsSaving(true)

        try {
            // 1. Convert Base64 Data URL to Blob
            const base64Data = generatedImage.split(',')[1]
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: 'image/png' })
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.png`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('images')
                .upload(fileName, blob, {
                    contentType: 'image/png',
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName)

            // 3. Save Character Data to Database
            const { error: dbError } = await supabase
                .from('characters')
                .insert([{
                    name: formData.name,
                    description: formData.description,
                    tool: formData.tool,
                    image_url: publicUrl,
                    hp: parseInt(formData.hp),
                    attack: parseInt(formData.attack)
                }])

            if (dbError) throw dbError

            alert('캐릭터가 저장되었어요!')
            navigate('/maps') // Go to maps or list
        } catch (error) {
            console.error(error)
            alert('저장하는 중에 문제가 생겼어요.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><Wand2 /></span>
                나만의 캐릭터 만들기
            </h1>

            <div className="grid md:grid-cols-2 gap-8">

                {/* Form Section */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">이름이 뭔가요?</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="예: 용감한 기사 냥이"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">어떤 캐릭터인가요?</label>
                        <textarea
                            name="description"
                            placeholder="예: 귀여운 고양이인데 황금 갑옷을 입고 있어요."
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">무엇을 가지고 있나요?</label>
                        <input
                            type="text"
                            name="tool"
                            placeholder="예: 전설의 생선가시 검"
                            value={formData.tool}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">체력 (HP)</label>
                            <input
                                type="number"
                                name="hp"
                                min="10"
                                max="500"
                                value={formData.hp}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">공격력 (ATK)</label>
                            <input
                                type="number"
                                name="attack"
                                min="1"
                                max="100"
                                value={formData.attack}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-lg"
                    >
                        {isGenerating ? (
                            <><Loader2 className="animate-spin" /> 소환 마법을 거는 중...</>
                        ) : (
                            <><Wand2 /> 캐릭터 소환하기!</>
                        )}
                    </button>
                </div>

                {/* Preview Section */}
                <div className="bg-white p-6 rounded-3xl border-4 border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                    {generatedImage ? (
                        <div className="relative w-full h-full flex flex-col items-center">
                            <div
                                className="w-64 h-64 mb-6 rounded-2xl overflow-hidden shadow-inner border border-slate-100 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50 flex items-center justify-center"
                            >
                                <img src={generatedImage} alt="Generated Character" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    onClick={handleGenerate}
                                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={18} /> 다시 만들기
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                                    이 캐릭터 저장하기
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400">
                            <div className="w-48 h-48 bg-slate-50 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <Wand2 size={64} className="opacity-20" />
                            </div>
                            <p>왼쪽 내용을 입력하고<br />소환 버튼을 눌러보세요!</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
