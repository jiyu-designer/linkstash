import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const pretendard = localFont({
  src: [
    {
      path: "./fonts/Pretendard-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Pretendard-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Pretendard-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/Pretendard-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LinkStash (by Jiyu)",
  description: "Smart link management and organization tool",
  openGraph: {
    title: "LinkStash (by Jiyu)",
    description: "Save smartly. Learn deeply.",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "LinkStash - Smart link management and organization tool",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkStash (by Jiyu)",
    description: "Save smartly. Learn deeply.",
    images: ["/og"],
  },
  icons: {
    icon: [
      {
        url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBzdHJva2VMaW5lY2FwPSJyb3VuZCIgc3Ryb2tlTGluZWpvaW49InJvdW5kIiBzdHJva2VXaWR0aD0iMS41IiBkPSJNMTMuMTkgOC42ODhhNC41IDQuNSAwIDAxMS4yNDIgNy4yNDRsLTQuNSA0LjVhNC41IDQuNSAwIDAxLTYuMzY0LTYuMzY0bDEuNzU3LTEuNzU3bTEzLjM1LS42MjJsMS43NTctMS43NTdhNC41IDQuNSAwIDAwLTYuMzY0LTYuMzY0bC00LjUgNC41YTQuNSA0LjUgMCAwMDEuMjQyIDcuMjQ0IiBzdHJva2U9IiMzQjgyRjYiIGZpbGw9Im5vbmUiLz4KPC9zdmc+",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${inter.variable} ${pretendard.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
