"use client"

import { useEffect, useState } from "react"
import { Search, Megaphone, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppLocale } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog"
import { MarkdownContent } from "@/components/markdown-content"
import { getCurrentAnnouncement } from "@/lib/api/announcements"
import type { Announcement } from "@/lib/api/types"
import { NeoFooter, NeoHeader } from "./shared"

export function NeoHome() {
  const { locale } = useAppLocale()
  const zh = locale === "zh-CN"
  const router = useRouter()
  const [keyword, setKeyword] = useState("")
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [announcementOpen, setAnnouncementOpen] = useState(false)
  useEffect(() => {
    let active = true
    getCurrentAnnouncement()
      .then((value) => {
        if (active)
          setAnnouncement(
            value?.enabled && value.content?.trim() ? value : null
          )
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="utility-home">
      <NeoHeader home />
      <main id="main-content" className="service-desk">
        <h1 className="sr-only">{zh ? "校园场地服务" : "Campus spaces"}</h1>
        <div className="desk-workspace">
          <section className="desk-book" aria-labelledby="book-title">
            <h2 id="book-title">
              <Link href="/reservation/create">
                {zh ? "预约场地" : "Book a space"}
              </Link>
            </h2>
            <div className="desk-book__bottom">
              <p>
                {zh
                  ? "教室、活动场地，按你的时间安排。"
                  : "Classrooms and activity spaces, on your schedule."}
              </p>
              <Button size="lg" asChild>
                <Link href="/reservation/create">
                  <Plus aria-hidden="true" data-icon="inline-start" />
                  {zh ? "开始预约" : "New booking"}
                </Link>
              </Button>
            </div>
          </section>
          <div className="desk-lookup">
            <section className="desk-search" aria-labelledby="search-title">
              <h2 id="search-title">{zh ? "查询预约" : "Find a booking"}</h2>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  const query = new URLSearchParams({ sort: "sequence" })
                  if (keyword.trim()) query.set("keyword", keyword.trim())
                  router.push(`/reservation/search?${query}`)
                }}
              >
                <Field>
                  <FieldLabel htmlFor="quick-search">
                    {zh ? "姓名、场地或预约用途" : "Name, room or purpose"}
                  </FieldLabel>
                  <Input
                    id="quick-search"
                    name="keyword"
                    autoComplete="off"
                    type="search"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={zh ? "输入关键词" : "Enter a keyword"}
                    maxLength={100}
                  />
                </Field>
                <Button type="submit" size="lg">
                  <Search aria-hidden="true" data-icon="inline-start" />
                  {zh ? "查询" : "Search"}
                </Button>
              </form>
              <Link className="desk-text-link" href="/reservation/search">
                {zh ? "查看所有即将到来的预约" : "Browse upcoming reservations"}
              </Link>
            </section>
            <Link className="desk-schedule" href="/dashboard">
              <div>
                <h2>{zh ? "场地看板" : "Live schedule"}</h2>
                <p>
                  {zh
                    ? "查看各场地的使用安排"
                    : "See what’s happening in each space"}
                </p>
              </div>
            </Link>
          </div>
        </div>
        {announcement && (
          <button
            className="desk-announcement"
            onClick={() => setAnnouncementOpen(true)}
          >
            <Megaphone aria-hidden="true" size={19} />
            <span>
              {announcement.title || (zh ? "校园公告" : "Campus announcement")}
            </span>
          </button>
        )}
      </main>
      <NeoFooter />
      <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {announcement?.title || (zh ? "校园公告" : "Campus announcement")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {zh ? "当前校园场地公告" : "Current campus space announcement"}
            </DialogDescription>
          </DialogHeader>
          <MarkdownContent content={announcement?.content || ""} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
