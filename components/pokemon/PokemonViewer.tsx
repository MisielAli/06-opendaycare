"use client";

import { useEffect, useState, useCallback } from "react";

type Pokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    other: {
      "official-artwork": {
        front_default: string | null;
        front_shiny: string | null;
      };
    };
    front_default: string | null;
  };
  types: { slot: number; type: { name: string; url: string } }[];
  abilities: { ability: { name: string; url: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
};

const TYPE_COLORS: Record<string, string> = {
  normal: "bg-stone-400",
  fire: "bg-orange-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400 text-zinc-800",
  grass: "bg-green-500",
  ice: "bg-cyan-300 text-zinc-800",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-amber-600",
  flying: "bg-indigo-400",
  psychic: "bg-pink-500",
  bug: "bg-lime-500 text-zinc-800",
  rock: "bg-stone-500",
  ghost: "bg-violet-600",
  dragon: "bg-indigo-600",
  dark: "bg-stone-700",
  steel: "bg-slate-400 text-zinc-800",
  fairy: "bg-pink-300 text-zinc-800",
};

export default function PokemonViewer() {
  const [pokemonId, setPokemonId] = useState(1);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPokemon = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!res.ok) {
        throw new Error(`Pokémon no encontrado (ID: ${id})`);
      }
      const data: Pokemon = await res.json();
      setPokemon(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setPokemon(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on id change is intentional
    void fetchPokemon(pokemonId);
  }, [pokemonId, fetchPokemon]);

  const handlePrev = () => {
    setPokemonId((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setPokemonId((prev) => prev + 1);
  };

  const artwork =
    pokemon?.sprites.other["official-artwork"].front_default ??
    pokemon?.sprites.front_default ??
    null;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <header className="text-center">
        <h2 className="font-[var(--font-fredoka)] text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Pokédex
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Explora los Pokémon con la PokéAPI
        </p>
      </header>

      <div className="flex items-center justify-between">
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          #{String(pokemonId).padStart(4, "0")}
        </span>
        <span className="text-sm text-zinc-500">
          {loading ? "Cargando..." : pokemon ? pokemon.name : ""}
        </span>
      </div>

      <div className="flex min-h-[280px] items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100 p-6 dark:from-zinc-800 dark:to-zinc-900">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white" />
            <p className="text-sm text-zinc-500">Cargando Pokémon...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="font-medium text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => fetchPokemon(pokemonId)}
              className="mt-3 rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Reintentar
            </button>
          </div>
        ) : pokemon && artwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artwork}
            alt={pokemon.name}
            width={220}
            height={220}
            className="h-[220px] w-[220px] object-contain drop-shadow-xl transition-transform hover:scale-105"
          />
        ) : (
          <p className="text-sm text-zinc-500">Sin imagen disponible</p>
        )}
      </div>

      {pokemon && !loading && !error && (
        <div className="space-y-3">
          <h3 className="text-center font-[var(--font-fredoka)] text-2xl font-bold capitalize text-zinc-900 dark:text-white">
            {pokemon.name}
          </h3>

          <div className="flex flex-wrap justify-center gap-2">
            {pokemon.types.map((t) => (
              <span
                key={t.type.name}
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white ${TYPE_COLORS[t.type.name] ?? "bg-zinc-500"}`}
              >
                {t.type.name}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
            <div className="rounded-xl bg-zinc-50 px-4 py-3 text-center dark:bg-zinc-800">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Altura</p>
              <p className="font-semibold text-zinc-900 dark:text-white">{pokemon.height / 10} m</p>
            </div>
            <div className="rounded-xl bg-zinc-50 px-4 py-3 text-center dark:bg-zinc-800">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Peso</p>
              <p className="font-semibold text-zinc-900 dark:text-white">{pokemon.weight / 10} kg</p>
            </div>
          </div>

          <details className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Ver stats
            </summary>
            <ul className="mt-3 space-y-1.5">
              {pokemon.stats.map((s) => (
                <li key={s.stat.name} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-zinc-600 dark:text-zinc-400">{s.stat.name.replace("-", " ")}</span>
                  <span className="font-mono font-semibold text-zinc-900 dark:text-white">{s.base_stat}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs capitalize text-zinc-500 dark:text-zinc-400">
              Habilidades: {pokemon.abilities.map((a) => a.ability.name).join(", ")}
            </p>
          </details>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={pokemonId === 1 || loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700 dark:hover:bg-zinc-700"
        >
          <span aria-hidden>←</span> Anterior
        </button>

        <button
          onClick={handleNext}
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          Siguiente <span aria-hidden>→</span>
        </button>
      </div>

      <p className="text-center text-xs text-zinc-400">
        Datos de{" "}
        <a href="https://pokeapi.co" target="_blank" rel="noreferrer" className="underline hover:text-zinc-600">
          PokéAPI
        </a>{" "}
        · ID actual: {pokemonId}
      </p>
    </div>
  );
}
