import Image from "next/image";

/** PNG oficial 500×500; o lockup institucional ocupa este recorte. */
const CGE_LOGO = {
  src: "/assets/logo-cge.png",
  width: 500,
  height: 500,
  crop: { left: 63, top: 168, width: 369, height: 133 },
} as const;

export function AuthFooter() {
  const { crop } = CGE_LOGO;

  return (
    <footer className="shrink-0 bg-brand-900 px-5 py-5 sm:px-8 sm:py-6">
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-4 sm:gap-5">
        <div
          className="relative h-12 shrink-0 overflow-hidden sm:h-14"
          style={{ aspectRatio: `${crop.width} / ${crop.height}` }}
        >
          <Image
            src={CGE_LOGO.src}
            alt="Controladoria-Geral do Estado do Rio Grande do Norte"
            width={CGE_LOGO.width}
            height={CGE_LOGO.height}
            className="absolute max-w-none"
            style={{
              width: `${(CGE_LOGO.width / crop.width) * 100}%`,
              height: "auto",
              left: `${(-crop.left / crop.width) * 100}%`,
              top: `${(-crop.top / crop.height) * 100}%`,
            }}
          />
        </div>
        <p className="min-w-0 text-left text-base leading-relaxed text-white/80">
          &copy; {new Date().getFullYear()} Controladoria-Geral do Estado do Rio Grande do Norte
          {" · "}
          Setor de Integridade
        </p>
      </div>
    </footer>
  );
}
