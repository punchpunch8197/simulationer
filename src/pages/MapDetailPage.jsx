
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Plus, GripHorizontal, Trash2 } from 'lucide-react'
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import { supabase } from '../lib/supabaseClient'

const BACKGROUND_TEMPLATES = {
    'FOREST': 'linear-gradient(to bottom, #86efac, #16a34a)',
    'CITY': 'linear-gradient(to bottom, #93c5fd, #3730a3)',
    'SPACE': 'linear-gradient(to bottom, #1e293b, #0f172a)',
    'CASTLE': 'linear-gradient(to bottom, #f9a8d4, #be123c)',
    'UNDERWATER': 'linear-gradient(to bottom, #67e8f9, #1d4ed8)',
}

function DraggableCharacter({ id, image_url, name, x, y, onRemove }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                ...style
            }}
            className="group"
            {...listeners}
            {...attributes}
        >
            <div className="relative w-24 h-24 hover:scale-110 transition-transform cursor-move">
                <img src={image_url} alt={name} className="w-full h-full object-contain drop-shadow-lg" />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white/80 px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {name}
                </div>
            </div>
        </div>
    );
}

export default function MapDetailPage() {
    const { id } = useParams()
    const [map, setMap] = useState(null)
    const [placedCharacters, setPlacedCharacters] = useState([])
    const [availableCharacters, setAvailableCharacters] = useState([])

    const [loading, setLoading] = useState(true)
    const [showCharSelector, setShowCharSelector] = useState(false)

    useEffect(() => {
        fetchMapData()
        fetchAvailableCharacters()
    }, [id])

    const fetchMapData = async () => {
        try {
            const { data: mapData, error: mapError } = await supabase
                .from('maps')
                .select('*')
                .eq('id', id)
                .single()

            if (mapError) throw mapError
            setMap(mapData)

            const { data: placements, error: placeError } = await supabase
                .from('map_characters')
                .select(`
          *,
          characters ( name, image_url )
        `)
                .eq('map_id', id)

            if (placeError) throw placeError

            // Format data for easier usage
            const formattedPlacements = placements.map(p => ({
                id: p.id, // placement id
                character_id: p.character_id,
                name: p.characters.name,
                image_url: p.characters.image_url,
                x: Number(p.position_x),
                y: Number(p.position_y)
            }))

            setPlacedCharacters(formattedPlacements)

        } catch (error) {
            console.error(error)
            alert("맵 정보를 가져올 수 없어요.")
        } finally {
            setLoading(false)
        }
    }

    const fetchAvailableCharacters = async () => {
        const { data } = await supabase.from('characters').select('*').order('created_at', { ascending: false })
        if (data) setAvailableCharacters(data)
    }

    const handleAddCharacter = async (char) => {
        try {
            // Default center position: 50%, 50%
            const { data, error } = await supabase
                .from('map_characters')
                .insert([{
                    map_id: id,
                    character_id: char.id,
                    position_x: 45 + Math.random() * 10, // Slightly randomize to prevent perfect overlap
                    position_y: 45 + Math.random() * 10
                }])
                .select(`*, characters(name, image_url)`)
                .single()

            if (error) throw error

            setPlacedCharacters(prev => [...prev, {
                id: data.id,
                character_id: data.character_id,
                name: data.characters.name,
                image_url: data.characters.image_url,
                x: Number(data.position_x),
                y: Number(data.position_y)
            }])
            setShowCharSelector(false)

        } catch (error) {
            console.error(error)
            alert("캐릭터를 배치하지 못했어요.")
        }
    }

    const handleDragEnd = async (event) => {
        const { active, delta } = event;
        const item = placedCharacters.find(p => p.id === active.id)
        if (!item) return

        // Calculate new percentage based on container size (approximate for demo)
        // In a real app, use ref to get bounding rect.
        // Assuming container is relative and drag is in pixels.
        // We convert px delta to percentage relative to a fixed map size or viewport.

        // For simplicity: The delta is in pixels. We need to update the state with the NEW position in %.
        // Since 'delta' is the movement, not the final position.
        // But dnd-kit logic for 'transform' is visual. To Persist, we need the final pos.

        // Simpler approach: DnD Kit creates a transform. 
        // "Official" DnD way: update the coordinates when drag ends.
        // We need to know the container width/height relative to the item.
        // Let's assume a 800x600 px map for calculation or use refs.

        const container = document.getElementById('map-container')
        const rect = container.getBoundingClientRect()

        const percentX = (delta.x / rect.width) * 100
        const percentY = (delta.y / rect.height) * 100

        const newX = Math.max(0, Math.min(90, item.x + percentX))
        const newY = Math.max(0, Math.min(90, item.y + percentY))

        // Optimistic Update
        setPlacedCharacters(prev => prev.map(p =>
            p.id === active.id ? { ...p, x: newX, y: newY } : p
        ))

        // DB Update
        await supabase
            .from('map_characters')
            .update({ position_x: newX, position_y: newY })
            .eq('id', active.id)
    }

    const handleDelete = async (placementId) => {
        if (!confirm("이 캐릭터를 맵에서 뺄까요?")) return

        const { error } = await supabase.from('map_characters').delete().eq('id', placementId)
        if (!error) {
            setPlacedCharacters(prev => prev.filter(p => p.id !== placementId))
        }
    }

    if (loading || !map) return <div className="p-8 text-center text-slate-500"><Loader2 className="animate-spin inline" /> 불러오는 중...</div>

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-black text-slate-800">{map.name}</h1>
                <button
                    onClick={() => setShowCharSelector(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                >
                    <Plus /> 캐릭터 추가하기
                </button>
            </div>

            <div className="flex-1 relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-800">
                {/* Map Background */}
                <div
                    id="map-container"
                    className="absolute inset-0 w-full h-full transition-colors duration-1000"
                    style={{ background: BACKGROUND_TEMPLATES[map.background_template] || '#333' }}
                >
                    {/* Decorative Elements based on template could act here (hardcoded logic) */}
                    <DndContext onDragEnd={handleDragEnd}>
                        {placedCharacters.map(p => (
                            <DraggableCharacter
                                key={p.id}
                                id={p.id}
                                {...p}
                            />
                        ))}
                    </DndContext>
                </div>
            </div>

            {/* Character Selector Modal */}
            {showCharSelector && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <h2 className="text-xl font-bold mb-4">누구를 데려올까요?</h2>
                        <div className="overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4 p-2">
                            {availableCharacters.map(char => (
                                <button
                                    key={char.id}
                                    onClick={() => handleAddCharacter(char)}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center"
                                >
                                    <img src={char.image_url} alt={char.name} className="w-20 h-20 object-contain drop-shadow" />
                                    <span className="font-bold text-sm text-slate-700">{char.name}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowCharSelector(false)}
                            className="mt-4 w-full py-3 bg-slate-100 font-bold rounded-xl hover:bg-slate-200"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
