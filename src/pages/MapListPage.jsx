
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Map, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const BACKGROUND_TEMPLATES = [
    { id: 'FOREST', name: '신비한 숲', color: 'from-emerald-300 to-green-600', emoji: '🌲' },
    { id: 'CITY', name: '미래 도시', color: 'from-blue-400 to-indigo-800', emoji: '🏙️' },
    { id: 'SPACE', name: '우주 정거장', color: 'from-slate-800 to-purple-900', emoji: '🚀' },
    { id: 'CASTLE', name: '마법의 성', color: 'from-pink-300 to-rose-600', emoji: '🏰' },
    { id: 'UNDERWATER', name: '깊은 바다', color: 'from-cyan-400 to-blue-700', emoji: '🐠' },
]

export default function MapListPage() {
    const navigate = useNavigate()
    const [maps, setMaps] = useState([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        fetchMaps()
    }, [])

    const fetchMaps = async () => {
        try {
            const { data, error } = await supabase
                .from('maps')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setMaps(data)
        } catch (error) {
            console.error('Error fetching maps:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateMap = async (templateId, templateName) => {
        if (!window.confirm(`'${templateName}' 맵을 만들까요?`)) return

        setIsCreating(true)
        try {
            const { data, error } = await supabase
                .from('maps')
                .insert([{
                    name: `${templateName} 모험`,
                    background_template: templateId
                }])
                .select()
                .single()

            if (error) throw error
            navigate(`/maps/${data.id}`)
        } catch (error) {
            console.error(error)
            alert('맵을 만드는데 실패했어요.')
        } finally {
            setIsCreating(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">맵을 불러오는 중...</div>

    return (
        <div className="py-8">
            <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><Map /></span>
                내 세상 꾸미기
            </h1>

            {/* New Map Section */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-slate-800 mb-4 px-2">새로운 맵 만들기</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {BACKGROUND_TEMPLATES.map((template) => (
                        <button
                            key={template.id}
                            onClick={() => handleCreateMap(template.id, template.name)}
                            disabled={isCreating}
                            className={`
                group relative h-32 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border-4 border-white
                bg-gradient-to-br ${template.color}
              `}
                        >
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                <span className="text-4xl group-hover:scale-125 transition-transform">{template.emoji}</span>
                                <span className="font-bold mt-2 shadow-black drop-shadow-md">{template.name}</span>
                            </div>
                            {isCreating && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><Loader2 className="animate-spin text-slate-800" /></div>}
                        </button>
                    ))}
                </div>
            </section>

            {/* Existing Maps Section */}
            <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 px-2">만들어진 맵</h2>
                {maps.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                        아직 만들어진 맵이 없어요. <br />위에서 마음에 드는 배경을 골라보세요!
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {maps.map((map) => {
                            const template = BACKGROUND_TEMPLATES.find(t => t.id === map.background_template) || BACKGROUND_TEMPLATES[0]
                            return (
                                <Link
                                    key={map.id}
                                    to={`/maps/${map.id}`}
                                    className="block bg-white p-4 rounded-2xl shadow-sm hover:shadow-md border-2 border-slate-100 transition-all hover:border-indigo-200 flex items-center gap-4"
                                >
                                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center text-3xl shadow-inner`}>
                                        {template.emoji}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{map.name}</h3>
                                        <p className="text-sm text-slate-400">{new Date(map.created_at).toLocaleDateString()}에 생성됨</p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}
