import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { universityService } from "../../services/universityService";
import { Search, MapPin, School, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const FavoritesPage = () => {
    const { user, favorites, isFavorite, toggleFavorite } = useAuth();
    const [allFavoritesData, setAllFavoritesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [cityFilter, setCityFilter] = useState("Всички");

    useEffect(() => {
        const load = async () => {
            if (!user || favorites.length === 0) {
                setAllFavoritesData([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const data = await universityService.searchUniversities({});
                const mapped = data.filter((item) =>
                    favorites.includes(String(item.id))
                );
                setAllFavoritesData(mapped);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("[favorites] load failed", e);
                setAllFavoritesData([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user, favorites]);

    const cities = useMemo(() => {
        const set = new Set(["Всички"]);
        allFavoritesData.forEach((u) => {
            if (u.city) set.add(u.city);
        });
        return Array.from(set);
    }, [allFavoritesData]);

    const filtered = useMemo(() => {
        return allFavoritesData.filter((u) => {
            const matchesCity =
                cityFilter === "Всички" || u.city === cityFilter;
            const term = search.trim().toLowerCase();
            if (!term) return matchesCity;
            const haystack = `${u.specialty || ""} ${u.university_name || ""}`.toLowerCase();
            return matchesCity && haystack.includes(term);
        });
    }, [allFavoritesData, search, cityFilter]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
                <div className="max-w-md text-center space-y-4">
                    <h1 className="text-3xl font-black">
                        Любими са достъпни само за логнати потребители
                    </h1>
                    <p className="opacity-60">
                        Влез в профила си, за да запазваш и виждаш любимите
                        специалности.
                    </p>
                    <Link
                        to="/login"
                        className="btn btn-primary rounded-2xl font-black mt-4"
                    >
                        Към вход
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100 pt-28 pb-12 px-6">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">
                            Моите любими специалности
                        </h1>
                        <p className="opacity-60 text-sm mt-2">
                            Запазени университети и специалности, достъпни от
                            всеки твой вход.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-base-200 p-4 rounded-[2.5rem] shadow-inner sticky top-24 z-20 backdrop-blur-md bg-base-200/80">
                    <div className="relative col-span-1 md:col-span-8">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30"
                            size={20}
                        />
                        <input
                            type="text"
                            placeholder="Търси в любимите..."
                            className="input w-full pl-12 h-14 bg-base-100 border-none rounded-2xl font-bold shadow-sm focus:ring-2 ring-primary/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="relative col-span-1 md:col-span-4">
                        <select
                            className="select w-full h-14 bg-base-100 border-none rounded-2xl font-bold shadow-sm cursor-pointer"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                        >
                            {cities.map((city) => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <span className="loading loading-infinity loading-lg text-primary scale-150"></span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                        <div className="bg-base-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto opacity-20">
                            <Heart size={40} />
                        </div>
                        <h3 className="text-2xl font-black opacity-40 italic uppercase tracking-tighter text-center">
                            Все още нямаш любими.
                        </h3>
                        <p className="opacity-60 text-sm max-w-md mx-auto">
                            Посети страницата „Университети“ и натисни
                            сърчицето към специалностите, които те
                            интересуват.
                        </p>
                        <Link
                            to="/universities"
                            className="btn btn-primary rounded-2xl mt-4 font-black"
                        >
                            Към университетите
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((uni) => {
                            const favorite = isFavorite(String(uni.id));
                            return (
                                <div
                                    key={uni.id}
                                    className="group bg-base-100 rounded-[2.5rem] border border-base-200 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>

                                    <div className="flex flex-col h-full space-y-6">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 text-[10px] font-black opacity-40 uppercase tracking-widest">
                                                    <MapPin
                                                        size={12}
                                                        className="text-primary"
                                                    />{" "}
                                                    {uni.city}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleFavorite(
                                                            String(uni.id)
                                                        )
                                                    }
                                                    className={`btn btn-ghost btn-xs rounded-full border transition-colors ${
                                                        favorite
                                                            ? "border-red-500/40 bg-red-500/10 text-red-500"
                                                            : "border-base-300 text-base-content/60 hover:bg-base-200"
                                                    }`}
                                                >
                                                    <Heart
                                                        size={16}
                                                        className={
                                                            favorite
                                                                ? "fill-red-500"
                                                                : ""
                                                        }
                                                    />
                                                </button>
                                            </div>

                                            <h2 className="text-xl font-black leading-tight group-hover:text-primary transition-colors">
                                                {uni.specialty}
                                            </h2>
                                            <p className="text-xs font-bold opacity-60 flex items-center gap-1">
                                                <School size={14} />{" "}
                                                {uni.university_name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoritesPage;

