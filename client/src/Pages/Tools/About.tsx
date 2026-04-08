import { Building2, Globe2, Mail, Phone, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import intlogo from "../../assets/intlogo.png";

const aboutHighlights = [
  { icon: Building2, label: "Licensed To", value: "Gema Kasih Yobel" },
  { icon: Globe2, label: "Location", value: "Jakarta Pusat, Indonesia" },
  { icon: Phone, label: "Contact", value: "021 345 6650" },
  { icon: Mail, label: "Email", value: "sgunawan@galva.co.id" },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(224,242,254,0.75)_35%,_rgba(125,211,252,0.45)_65%,_rgba(14,165,233,0.22)_100%)] p-4 md:p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-12 h-44 w-44 rounded-full bg-white/35 blur-3xl" />
        <div className="absolute right-10 top-10 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-6xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(145deg,rgba(240,249,255,0.98),rgba(224,242,254,0.95),rgba(186,230,253,0.92))] shadow-[0_30px_80px_rgba(14,116,144,0.18)]">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="relative p-8 md:p-10">
              <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-4 border-white/80 bg-[radial-gradient(circle_at_top,_#ffffff,_#dbeafe_55%,_#bfdbfe)] p-4 shadow-[0_12px_35px_rgba(59,130,246,0.25)]">
                  <img
                    src={intlogo}
                    alt="Intersoft Logo"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>

                <div className="space-y-2 text-slate-800">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">
                    Licensed To Gema Kasih Yobel
                  </p>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                    PT Intersoft
                  </h2>
                  <div className="space-y-1 text-base text-slate-700 md:text-lg">
                    <p>Jl. Hayam Wuruk No. 27</p>
                    <p>Gambir, Jakarta Pusat 10120</p>
                    <p>Indonesia</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/55 p-6 shadow-inner shadow-sky-100/70 backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
                  Product Information
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                  Intersoft Donatur Systems
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
                  Solusi modern untuk pengelolaan data donatur dan doa ulang tahun, dirancang
                  dengan tampilan ringan, rapi, dan nyaman digunakan setiap hari.
                </p>

                <div className="mt-6 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-lg font-bold text-cyan-800 shadow-sm">
                  Version 2026.1.001
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {aboutHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/70 bg-white/60 p-4 shadow-sm backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-300/40">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {item.label}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-800 md:text-base">
                            {item.value}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <aside className="flex flex-col justify-between border-t border-white/60 bg-[linear-gradient(180deg,rgba(14,165,233,0.14),rgba(255,255,255,0.72))] p-8 md:p-10 lg:border-l lg:border-t-0">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  Licensed Product
                </div>

                <div className="mt-8 space-y-4 text-slate-700">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Copyright
                    </div>
                    <div className="mt-1 text-base font-semibold">
                      Copyright @ 2005-2007
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Created By
                    </div>
                    <div className="mt-1 text-base font-semibold">Intersoft Team</div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Support Contact
                    </div>
                    <div className="mt-1 text-base font-semibold">345 6650 (PT Intersoft)</div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Protection Notice
                    </div>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      This product is protected by law. Copyright only for Intersoft Team and
                      all licensors.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-sky-600 px-5 py-4 text-base font-bold text-white shadow-[0_18px_35px_rgba(14,165,233,0.35)] transition hover:translate-y-[-1px] hover:brightness-105"
                onClick={() => navigate("/dashboard")}
              >
                OK
              </button>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
