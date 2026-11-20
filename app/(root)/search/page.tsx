import SearchCommand from "@/components/SearchCommand";
import { searchStocks } from "@/lib/actions/finnhub.actions";

export default async function SearchPage() {
  let initialStocks: StockWithWatchlistStatus[] = [];
  let initialError = false;

  try {
    initialStocks = await searchStocks();
  } catch {
    initialError = true;
  }

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-white">Search stocks</h1>
        <p className="mt-2 text-gray-400">Find a listed company by name or ticker symbol.</p>
      </div>
      <SearchCommand
        initialStocks={initialStocks}
        initialError={initialError}
        label="Search stocks"
      />
    </section>
  );
}
