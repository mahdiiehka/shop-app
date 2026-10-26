
"use client";

import { useState, useEffect } from "react";


const API = "https://practice.amirm.me";

type Product = {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
  image: string;
  category: { name: string };
};


type Category = {
  id: number;
  slug: string;
  name: string;
  productCount: number;
};

function useDebounce(value: string, delay = 200) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(search);
  const debouncedMin = useDebounce(minPrice);
  const debouncedMax = useDebounce(maxPrice);

  function changeFilter(
    setter: (value: string) => void,
    value: string
  ) {
    setter(value);
    setPage(1);
  }

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((res) => {
        if (!res.ok) throw new Error("خطا");
        return res.json();
      })
      .then((body) => setCategories(body.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ page: String(page) });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (category) params.set("category", category);
      if (sort) params.set("sort", sort);
      if (debouncedMin) params.set("minPrice", debouncedMin);
      if (debouncedMax) params.set("maxPrice", debouncedMax);

      try {
        const res = await fetch(`${API}/products?${params}`);
        const body = await res.json();

        if (!res.ok) {
          throw new Error(body.error || "خطا در دریافت محصولات");
        }

        if (!cancelled) {
          setProducts(body.data ?? []);
          setTotalPages(Math.max(1, body.totalPages ?? 1));
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "خطای نامشخص"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [
    debouncedSearch,
    category,
    sort,
    debouncedMin,
    debouncedMax,
    page,
  ]);

  function resetFilters() {
    setSearch("");
    setCategory("");
    setSort("");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  }

  function getImageUrl(image: string) {
    if (!image) return "";
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }
    return `${API}${image.startsWith("/") ? "" : "/"}${image}`;
  }

  const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-black outline-none transition placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-100";

  return (
    <main dir="rtl" >
      <div className="mx-auto max-w-7xl px-4 py-10">

        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit space-y-5 rounded-xl border border bg-white p-5 ">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="font-bold text-black">
                فیلتر محصولات
              </h2>

              <button
                onClick={resetFilters}
                className="cursor-pointer text-xs font-medium text-red-600 transition hover:text-red-800"
              >
                حذف فیلتر
              </button>
            </div>

            <input
              type="search"
              value={search}
              onChange={(e) =>
                changeFilter(setSearch, e.target.value)
              }
              placeholder="جستجوی محصول..."
              className={inputClass}
            />

            <div>
              <label className="mb-2 block text-sm font-medium ">
                دسته ‌بندی
              </label>
              <select
                value={category}
                onChange={(e) =>
                  changeFilter(setCategory, e.target.value)
                }
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">همه دسته‌ بندی‌ ها</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name} ({c.productCount.toLocaleString("fa-IR")})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                مرتب ‌سازی قیمت
              </label>
              <select
                value={sort}
                onChange={(e) =>
                  changeFilter(setSort, e.target.value)
                }
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">جدیدترین</option>
                <option value="price">ارزان‌ترین</option>
                <option value="-price">گران‌ترین</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium ">
                حداقل قیمت 
              </label>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) =>
                  changeFilter(setMinPrice, e.target.value)
                }
                placeholder="از قیمت..."
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                حداکثر قیمت 
              </label>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) =>
                  changeFilter(setMaxPrice, e.target.value)
                }
                placeholder="تا قیمت..."
                className={inputClass}
              />
            </div>
          </aside>

          <section>
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
                <button
                  onClick={() => setPage((p) => p)}
                  className="mr-3 cursor-pointer font-bold underline"
                >
                  تلاش دوباره
                </button>
              </div>
            )}

            {loading ? (
              <p className="py-16 text-center text-gray-500">
                در حال بارگذاری محصولات...
              </p>
            ) : !error && products.length === 0 ? (
              <p className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-600">
                محصولی پیدا نشد.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((p) => (
                  <article
                    key={p.id}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-md"
                  >
                    <div className="overflow-hidden bg-gray-100 p-4">
                      {p.image ? (
                        <img
                          src={getImageUrl(p.image)}
                          alt={p.name}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.visibility = "hidden";
                          }}
                          className="aspect-square w-full object-contain transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center text-sm text-gray-400">
                          بدون تصویر
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-2 min-h-12 text-sm font-bold leading-6 text-black">
                        {p.name}
                      </h3>

                      {p.category?.name && (
                        <p className="mt-1 text-xs text-gray-500">
                          {p.category.name}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                        <p
                          className={`text-sm font-bold ${p.inStock ? "text-black" : "text-gray-500"
                            }`}
                        >
                          {p.price.toLocaleString("fa-IR")} تومان
                        </p>

                        {!p.inStock && (
                          <span className="shrink-0 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                            ناموجود
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!loading && !error && products.length > 0 && (
              <nav className="mt-8 flex items-center justify-center gap-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-black transition hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  قبلی
                </button>

                <span className="text-sm text-gray-600">
                  صفحه {page.toLocaleString("fa-IR")} از{" "}
                  {totalPages.toLocaleString("fa-IR")}
                </span>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-black transition hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  بعدی
                </button>
              </nav>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}