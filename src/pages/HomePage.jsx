
import { Link } from 'react-router-dom'
import { Wand2, Map } from 'lucide-react'

export default function HomePage() {
    return (
        <div className="flex flex-col gap-8 py-8 items-center justify-center min-h-[calc(100vh-6rem)]">
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-black text-slate-900 leading-tight">
                    나만의 <span className="text-indigo-600">상상 세상</span>을<br />
                    만들어보세요!
                </h1>
                <p className="text-xl text-slate-600">
                    캐릭터를 만들고, 멋진 배경에 배치해서 이야기를 꾸며봐요.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
                <Link to="/characters/new" className="group relative bg-white rounded-3xl p-8 border-4 border-indigo-100 hover:border-indigo-500 hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-4 text-center overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wand2 size={120} />
                    </div>
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Wand2 size={40} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">캐릭터 만들기</h2>
                        <p className="text-slate-500">이름과 설명을 쓰고<br />AI로 나만의 캐릭터를 소환해요!</p>
                    </div>
                </Link>

                <Link to="/maps" className="group relative bg-white rounded-3xl p-8 border-4 border-emerald-100 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-4 text-center overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Map size={120} />
                    </div>
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Map size={40} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">세상 꾸미기</h2>
                        <p className="text-slate-500">숲, 도시, 우주 배경을 고르고<br />캐릭터들을 배치해요!</p>
                    </div>
                </Link>
            </div>

            <div className="mt-8 text-center text-sm text-slate-400 max-w-md px-4">
                <p>아무리 AI가 코드를 썼어도, 기획자는 사람입니다.</p>
                <p>테스트 버전이니 부족한 점이 있을 수 있습니다. 양해해주시기 바랍니다.</p>
                <p className="mt-3">
                    <span className="text-slate-500">기획자</span>{' '}
                    <span
                        className="text-5xl bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm"
                        style={{ fontFamily: "'Nanum Pen Script', cursive" }}
                    >
                        최진
                    </span>
                </p>
            </div>
        </div>
    )
}
