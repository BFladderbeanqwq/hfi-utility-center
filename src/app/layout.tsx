import "@fontsource-variable/archivo"
import "@fontsource-variable/noto-sans-sc"
import "@fontsource-variable/noto-serif-sc"
import "./globals.css"

import { Providers } from "@/app/providers"
import { Navbar } from "@/components/navbar"

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar>{children}</Navbar>
        </Providers>
      </body>
    </html>
  )
}

export const metadata = {
  title: {
    default: "HFI Utility Center · 校园场地服务",
    template: "%s · HFI Utility Center",
  },
  description: "预约校园场地、查询预约进度、查看场地使用情况。",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
}
