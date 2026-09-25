import { Archivo, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google"

// CJK faces are huge and split into ~100 unicode-range chunks, so they are not preloaded.
export const archivo = Archivo({
  weight: "variable",
  subsets: ["latin", "latin-ext"],
  variable: "--font-archivo",
})

export const notoSansSC = Noto_Sans_SC({
  weight: "variable",
  preload: false,
  variable: "--font-noto-sans-sc",
})

export const notoSerifSC = Noto_Serif_SC({
  weight: "variable",
  preload: false,
  variable: "--font-noto-serif-sc",
})
