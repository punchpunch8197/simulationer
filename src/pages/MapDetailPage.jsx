
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Plus, Swords, Trophy, Skull, Heart, Zap } from 'lucide-react'
import { DndContext, useDraggable } from '@dnd-kit/core'
import { supabase } from '../lib/supabaseClient'

const BACKGROUND_TEMPLATES = {
    'FOREST': 'linear-gradient(to bottom, #86efac, #16a34a)',
    'CITY': 'linear-gradient(to bottom, #93c5fd, #3730a3)',
    'SPACE': 'linear-gradient(to bottom, #1e293b, #0f172a)',
    'CASTLE': 'linear-gradient(to bottom, #f9a8d4, #be123c)',
    'UNDERWATER': 'linear-gradient(to bottom, #67e8f9, #1d4ed8)',
}

const GRAVE_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <ellipse cx="50" cy="85" rx="35" ry="10" fill="#4a5568"/>
  <path d="M25 85 L25 45 Q25 25 50 25 Q75 25 75 45 L75 85 Z" fill="#718096"/>
  <path d="M30 80 L30 48 Q30 32 50 32 Q70 32 70 48 L70 80 Z" fill="#a0aec0"/>
  <text x="50" y="60" text-anchor="middle" font-size="14" fill="#4a5568" font-family="serif">R.I.P</text>
</svg>
`)}`

function DraggableCharacter({ id, character, teamId, isDead, onRemove, containerRef }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
        data: { teamId }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={{
                position: 'absolute',
                left: `${character.x}%`,
                top: `${character.y}%`,
                ...style
            }}
            className="group"
            {...listeners}
            {...attributes}
        >
            <div className={`relative w-20 h-20 transition-all cursor-move ${isDead ? 'grayscale' : 'hover:scale-110'}`}>
                <img
                    src={isDead ? GRAVE_SVG : character.image_url}
                    alt={character.name}
                    className="w-full h-full object-contain drop-shadow-lg"
                />
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white/90 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <div>{character.name}</div>
                    {!isDead && (
                        <div className="flex gap-2 text-[10px]">
                            <span className="text-red-500">HP:{character.currentHp}</span>
                            <span className="text-orange-500">ATK:{character.attack}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CharacterSlot({ character, isDead, isActive, onClick }) {
    if (!character) {
        return (
            <button
                onClick={onClick}
                className="w-24 h-28 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center hover:border-indigo-400 hover:bg-indigo-50 transition-all"
            >
                <Plus className="text-slate-400" />
            </button>
        )
    }

    return (
        <div className={`w-24 h-28 rounded-xl p-2 flex flex-col items-center justify-center transition-all ${
            isDead ? 'bg-slate-200 opacity-60' :
            isActive ? 'bg-yellow-100 ring-2 ring-yellow-400 scale-105' :
            'bg-white shadow-md'
        }`}>
            <img
                src={isDead ? GRAVE_SVG : character.image_url}
                alt={character.name}
                className={`w-12 h-12 object-contain ${isDead ? 'grayscale' : ''}`}
            />
            <div className="text-xs font-bold truncate w-full text-center mt-1">{character.name}</div>
            {!isDead && (
                <div className="flex gap-1 text-[10px]">
                    <span className="text-red-500 flex items-center gap-0.5"><Heart size={10}/>{character.currentHp}</span>
                    <span className="text-orange-500 flex items-center gap-0.5"><Zap size={10}/>{character.attack}</span>
                </div>
            )}
            {isDead && <Skull size={14} className="text-slate-500 mt-1"/>}
        </div>
    )
}

export default function MapDetailPage() {
    const { id } = useParams()
    const [map, setMap] = useState(null)
    const [loading, setLoading] = useState(true)

    // Team states - 각 팀 최대 3명
    const [team1, setTeam1] = useState([null, null, null])
    const [team2, setTeam2] = useState([null, null, null])

    // Available characters for selection
    const [availableCharacters, setAvailableCharacters] = useState([])
    const [showCharSelector, setShowCharSelector] = useState(false)
    const [selectingForTeam, setSelectingForTeam] = useState(null) // { team: 1 or 2, slot: 0-2 }

    // Battle states
    const [battleMode, setBattleMode] = useState(false)
    const [showFirstAttackModal, setShowFirstAttackModal] = useState(false)
    const [currentAttacker, setCurrentAttacker] = useState(null) // 1 or 2
    const [team1Index, setTeam1Index] = useState(0) // 현재 전투 중인 팀1 캐릭터 인덱스
    const [team2Index, setTeam2Index] = useState(0) // 현재 전투 중인 팀2 캐릭터 인덱스
    const [battleLog, setBattleLog] = useState([])
    const [winner, setWinner] = useState(null)
    const [isAnimating, setIsAnimating] = useState(false)
    const battleLogRef = useRef(null)

    useEffect(() => {
        fetchMapData()
        fetchAvailableCharacters()
        loadSavedTeams()
    }, [id])

    useEffect(() => {
        if (battleLogRef.current) {
            battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
        }
    }, [battleLog])

    const fetchMapData = async () => {
        try {
            const { data: mapData, error: mapError } = await supabase
                .from('maps')
                .select('*')
                .eq('id', id)
                .single()

            if (mapError) throw mapError
            setMap(mapData)
        } catch (error) {
            console.error(error)
            alert("맵 정보를 가져올 수 없어요.")
        } finally {
            setLoading(false)
        }
    }

    const fetchAvailableCharacters = async () => {
        const { data } = await supabase
            .from('characters')
            .select('*')
            .order('created_at', { ascending: false })
        if (data) setAvailableCharacters(data)
    }

    const loadSavedTeams = async () => {
        const { data, error } = await supabase
            .from('map_characters')
            .select(`*, characters(*)`)
            .eq('map_id', id)

        if (error || !data) return

        const newTeam1 = [null, null, null]
        const newTeam2 = [null, null, null]

        data.forEach(placement => {
            const char = {
                ...placement.characters,
                currentHp: placement.characters.hp,
                x: Number(placement.position_x),
                y: Number(placement.position_y),
                placementId: placement.id
            }
            if (placement.team === 1 && placement.slot >= 0 && placement.slot < 3) {
                newTeam1[placement.slot] = char
            } else if (placement.team === 2 && placement.slot >= 0 && placement.slot < 3) {
                newTeam2[placement.slot] = char
            }
        })

        setTeam1(newTeam1)
        setTeam2(newTeam2)
    }

    const saveCharacterToDb = async (char, team, slot) => {
        const { data, error } = await supabase
            .from('map_characters')
            .insert([{
                map_id: id,
                character_id: char.id,
                position_x: char.x,
                position_y: char.y,
                team: team,
                slot: slot
            }])
            .select()
            .single()

        if (!error && data) {
            return data.id
        }
        return null
    }

    const updatePositionInDb = async (placementId, x, y) => {
        await supabase
            .from('map_characters')
            .update({ position_x: x, position_y: y })
            .eq('id', placementId)
    }

    const clearTeamsFromDb = async () => {
        await supabase
            .from('map_characters')
            .delete()
            .eq('map_id', id)
    }

    const handleOpenCharSelector = (team, slot) => {
        setSelectingForTeam({ team, slot })
        setShowCharSelector(true)
    }

    const handleAddCharacter = async (char) => {
        const newChar = {
            ...char,
            currentHp: char.hp,
            x: selectingForTeam.team === 1 ? 20 + Math.random() * 20 : 60 + Math.random() * 20,
            y: 30 + selectingForTeam.slot * 25
        }

        const placementId = await saveCharacterToDb(newChar, selectingForTeam.team, selectingForTeam.slot)
        newChar.placementId = placementId

        if (selectingForTeam.team === 1) {
            setTeam1(prev => {
                const updated = [...prev]
                updated[selectingForTeam.slot] = newChar
                return updated
            })
        } else {
            setTeam2(prev => {
                const updated = [...prev]
                updated[selectingForTeam.slot] = newChar
                return updated
            })
        }

        setShowCharSelector(false)
        setSelectingForTeam(null)
    }

    const handleDragEnd = (event) => {
        const { active, delta } = event;
        const teamId = active.data.current?.teamId

        const container = document.getElementById('map-container')
        if (!container) return
        const rect = container.getBoundingClientRect()

        const percentX = (delta.x / rect.width) * 100
        const percentY = (delta.y / rect.height) * 100

        const updatePosition = (char) => {
            if (!char || char.id !== active.id.replace(`team${teamId}-`, '')) return char

            let newX = char.x + percentX
            let newY = char.y + percentY

            // 팀 영역 제한
            if (teamId === 1) {
                newX = Math.max(0, Math.min(45, newX))
            } else {
                newX = Math.max(55, Math.min(95, newX))
            }
            newY = Math.max(0, Math.min(85, newY))

            // DB 업데이트
            if (char.placementId) {
                updatePositionInDb(char.placementId, newX, newY)
            }

            return { ...char, x: newX, y: newY }
        }

        if (teamId === 1) {
            setTeam1(prev => prev.map(updatePosition))
        } else {
            setTeam2(prev => prev.map(updatePosition))
        }
    }

    const canStartBattle = () => {
        const team1Ready = team1.filter(c => c !== null).length > 0
        const team2Ready = team2.filter(c => c !== null).length > 0
        return team1Ready && team2Ready
    }

    const startBattle = () => {
        setShowFirstAttackModal(true)
    }

    const selectFirstAttacker = (team) => {
        setShowFirstAttackModal(false)
        setCurrentAttacker(team)
        setBattleMode(true)
        setTeam1Index(0)
        setTeam2Index(0)
        setBattleLog([`전투 시작! ${team}팀이 선공합니다!`])
        setWinner(null)

        // 첫 번째 유효한 캐릭터 찾기
        const t1Idx = team1.findIndex(c => c !== null)
        const t2Idx = team2.findIndex(c => c !== null)
        setTeam1Index(t1Idx >= 0 ? t1Idx : 0)
        setTeam2Index(t2Idx >= 0 ? t2Idx : 0)
    }

    const findNextAliveIndex = (team, currentIndex) => {
        const arr = team === 1 ? team1 : team2
        for (let i = currentIndex + 1; i < arr.length; i++) {
            if (arr[i] && arr[i].currentHp > 0) return i
        }
        return -1
    }

    const executeAttack = () => {
        if (isAnimating || winner) return
        setIsAnimating(true)

        const attackerTeam = currentAttacker === 1 ? team1 : team2
        const defenderTeam = currentAttacker === 1 ? team2 : team1
        const attackerIndex = currentAttacker === 1 ? team1Index : team2Index
        const defenderIndex = currentAttacker === 1 ? team2Index : team1Index
        const setDefenderTeam = currentAttacker === 1 ? setTeam2 : setTeam1

        const attacker = attackerTeam[attackerIndex]
        const defender = defenderTeam[defenderIndex]

        if (!attacker || !defender) {
            setIsAnimating(false)
            return
        }

        const damage = attacker.attack
        const newHp = Math.max(0, defender.currentHp - damage)

        setBattleLog(prev => [
            ...prev,
            `${attacker.name}이(가) ${defender.name}에게 ${damage} 데미지! (남은 HP: ${newHp})`
        ])

        // 방어자 HP 업데이트
        setDefenderTeam(prev => {
            const updated = [...prev]
            updated[defenderIndex] = { ...defender, currentHp: newHp }
            return updated
        })

        setTimeout(() => {
            if (newHp <= 0) {
                // 방어자 사망
                setBattleLog(prev => [...prev, `${defender.name}이(가) 쓰러졌습니다!`])

                // 다음 방어자 찾기
                const nextDefenderIndex = findNextAliveIndex(
                    currentAttacker === 1 ? 2 : 1,
                    defenderIndex
                )

                if (nextDefenderIndex === -1) {
                    // 상대팀 전멸 - 승리
                    setWinner(currentAttacker)
                    setBattleLog(prev => [...prev, `${currentAttacker}팀 승리!`])
                } else {
                    // 다음 방어자로 이동
                    if (currentAttacker === 1) {
                        setTeam2Index(nextDefenderIndex)
                    } else {
                        setTeam1Index(nextDefenderIndex)
                    }
                    // 공격자 유지 (이긴 캐릭터가 계속 싸움)
                }
            } else {
                // 방어자 생존 - 턴 교체
                setCurrentAttacker(prev => prev === 1 ? 2 : 1)
            }
            setIsAnimating(false)
        }, 500)
    }

    const resetBattle = () => {
        // HP 초기화
        setTeam1(prev => prev.map(c => c ? { ...c, currentHp: c.hp } : null))
        setTeam2(prev => prev.map(c => c ? { ...c, currentHp: c.hp } : null))
        setBattleMode(false)
        setBattleLog([])
        setWinner(null)
        setTeam1Index(0)
        setTeam2Index(0)
    }

    const clearTeams = async () => {
        await clearTeamsFromDb()
        setTeam1([null, null, null])
        setTeam2([null, null, null])
        resetBattle()
    }

    if (loading || !map) {
        return (
            <div className="p-8 text-center text-slate-500">
                <Loader2 className="animate-spin inline" /> 불러오는 중...
            </div>
        )
    }

    const team1Alive = team1.filter(c => c && c.currentHp > 0)
    const team2Alive = team2.filter(c => c && c.currentHp > 0)

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-black text-slate-800">{map.name}</h1>
                <div className="flex gap-2">
                    {!battleMode ? (
                        <>
                            <button
                                onClick={clearTeams}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold transition-colors"
                            >
                                초기화
                            </button>
                            <button
                                onClick={startBattle}
                                disabled={!canStartBattle()}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105 disabled:hover:scale-100"
                            >
                                <Swords /> 전투 시작!
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={resetBattle}
                            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold"
                        >
                            전투 종료
                        </button>
                    )}
                </div>
            </div>

            {/* Main Battle Area */}
            <div className="flex-1 flex gap-4">
                {/* Team 1 Panel */}
                <div className="w-32 bg-blue-50 rounded-2xl p-3 flex flex-col">
                    <h2 className="text-center font-bold text-blue-800 mb-3">1팀</h2>
                    <div className="flex-1 flex flex-col gap-2 items-center">
                        {team1.map((char, idx) => (
                            <CharacterSlot
                                key={`t1-${idx}`}
                                character={char}
                                isDead={char && char.currentHp <= 0}
                                isActive={battleMode && team1Index === idx && char && char.currentHp > 0}
                                onClick={() => !battleMode && handleOpenCharSelector(1, idx)}
                            />
                        ))}
                    </div>
                    <div className="text-center text-sm font-bold text-blue-600 mt-2">
                        생존: {team1Alive.length}명
                    </div>
                </div>

                {/* Map Area */}
                <div className="flex-1 relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-800">
                    <div
                        id="map-container"
                        className="absolute inset-0 w-full h-full"
                        style={{ background: BACKGROUND_TEMPLATES[map.background_template] || '#333' }}
                    >
                        {/* Team Divider */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/30 -translate-x-1/2"/>
                        <div className="absolute left-1/4 top-2 text-white/50 font-bold text-sm">1팀 영역</div>
                        <div className="absolute right-1/4 top-2 text-white/50 font-bold text-sm -translate-x-1/2">2팀 영역</div>

                        <DndContext onDragEnd={handleDragEnd}>
                            {/* Team 1 Characters */}
                            {team1.map((char, idx) => char && (
                                <DraggableCharacter
                                    key={`team1-${char.id}`}
                                    id={`team1-${char.id}`}
                                    character={char}
                                    teamId={1}
                                    isDead={char.currentHp <= 0}
                                />
                            ))}
                            {/* Team 2 Characters */}
                            {team2.map((char, idx) => char && (
                                <DraggableCharacter
                                    key={`team2-${char.id}`}
                                    id={`team2-${char.id}`}
                                    character={char}
                                    teamId={2}
                                    isDead={char.currentHp <= 0}
                                />
                            ))}
                        </DndContext>

                        {/* Battle UI Overlay */}
                        {battleMode && !winner && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                <button
                                    onClick={executeAttack}
                                    disabled={isAnimating}
                                    className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-black px-8 py-4 rounded-2xl font-black text-xl shadow-lg transition-all hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
                                >
                                    <Swords className="w-6 h-6"/>
                                    {currentAttacker}팀 공격!
                                </button>
                            </div>
                        )}

                        {/* Winner Overlay */}
                        {winner && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="bg-white rounded-3xl p-8 text-center animate-bounce">
                                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4"/>
                                    <h2 className="text-3xl font-black text-slate-800">{winner}팀 승리!</h2>
                                    <button
                                        onClick={resetBattle}
                                        className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold"
                                    >
                                        다시 하기
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Team 2 Panel */}
                <div className="w-32 bg-red-50 rounded-2xl p-3 flex flex-col">
                    <h2 className="text-center font-bold text-red-800 mb-3">2팀</h2>
                    <div className="flex-1 flex flex-col gap-2 items-center">
                        {team2.map((char, idx) => (
                            <CharacterSlot
                                key={`t2-${idx}`}
                                character={char}
                                isDead={char && char.currentHp <= 0}
                                isActive={battleMode && team2Index === idx && char && char.currentHp > 0}
                                onClick={() => !battleMode && handleOpenCharSelector(2, idx)}
                            />
                        ))}
                    </div>
                    <div className="text-center text-sm font-bold text-red-600 mt-2">
                        생존: {team2Alive.length}명
                    </div>
                </div>
            </div>

            {/* Battle Log */}
            {battleMode && battleLog.length > 0 && (
                <div ref={battleLogRef} className="mt-4 bg-slate-100 rounded-xl p-3 max-h-32 overflow-y-auto">
                    <h3 className="font-bold text-sm text-slate-600 mb-2">전투 기록</h3>
                    <div className="space-y-1 text-sm">
                        {battleLog.map((log, idx) => (
                            <div key={idx} className="text-slate-700">{log}</div>
                        ))}
                    </div>
                </div>
            )}

            {/* Character Selector Modal */}
            {showCharSelector && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <h2 className="text-xl font-bold mb-4">
                            {selectingForTeam?.team}팀에 추가할 캐릭터를 선택하세요
                        </h2>
                        <div className="overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4 p-2">
                            {availableCharacters.map(char => (
                                <button
                                    key={char.id}
                                    onClick={() => handleAddCharacter(char)}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center"
                                >
                                    <img src={char.image_url} alt={char.name} className="w-16 h-16 object-contain drop-shadow" />
                                    <span className="font-bold text-sm text-slate-700">{char.name}</span>
                                    <div className="flex gap-2 text-xs">
                                        <span className="text-red-500">HP: {char.hp}</span>
                                        <span className="text-orange-500">ATK: {char.attack}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setShowCharSelector(false)
                                setSelectingForTeam(null)
                            }}
                            className="mt-4 w-full py-3 bg-slate-100 font-bold rounded-xl hover:bg-slate-200"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            {/* First Attack Selection Modal */}
            {showFirstAttackModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 text-center">
                        <Swords className="w-16 h-16 text-red-500 mx-auto mb-4"/>
                        <h2 className="text-2xl font-black text-slate-800 mb-6">누가 먼저 공격할까요?</h2>
                        <div className="flex gap-4">
                            <button
                                onClick={() => selectFirstAttacker(1)}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
                            >
                                1팀 선공
                            </button>
                            <button
                                onClick={() => selectFirstAttacker(2)}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
                            >
                                2팀 선공
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
