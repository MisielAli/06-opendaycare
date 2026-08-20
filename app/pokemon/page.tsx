import PokemonViewer from "@/components/pokemon/PokemonViewer";

export const metadata = {
  title: "Pokédex | OpenDayCare",
};

export default function PokemonPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <PokemonViewer />
    </main>
  );
}
