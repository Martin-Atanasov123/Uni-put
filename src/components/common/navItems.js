import { GraduationCap, Calculator, Building2, Heart, Brain, CalendarDays, School, Compass, BookOpen } from "lucide-react";
import { UNIVERSITIES, SPECIALTIES, DORMITORIES, DORMITORY_CITIES } from "@/lib/siteStats";

// Единственият списък с пътищата на сайта — ползват го хедърът и началната страница.
// Trailing slash е задължителен (каноничната форма, виж Seo.jsx).
export const MAIN_NAV = [
    { name: "Специалности", desc: `${SPECIALTIES} специалности и къде се учат`, path: "/specialnosti/", icon: BookOpen },
    { name: "Университети", desc: `${UNIVERSITIES} университета по град и степен`, path: "/universities/", icon: GraduationCap },
    { name: "Кариерно ориентиране", desc: "Интереси като отправна точка, не присъда", path: "/career-advisor/", icon: Compass },
    { name: "Калкулатор на бал", desc: "Балът по формулата на специалността", path: "/calculator/", icon: Calculator },
    { name: "Запазени", desc: "Специалностите, които си отбелязал", path: "/favorites/", icon: Heart },
];

export const MORE_TOOLS = [
    { name: "ДЗИ Стратег", desc: "Кой втори ДЗИ държи повече специалности отворени", path: "/dzi-strateg/", icon: Brain },
    { name: "Календар", desc: "Срокове за прием с източник и година", path: "/calendar/", icon: CalendarDays },
    { name: "Общежития", desc: `${DORMITORIES} общежития в ${DORMITORY_CITIES} града`, path: "/dormitories/", icon: Building2 },
    { name: "Прием след 7. клас", desc: "Балове за гимназиите в София", path: "/priem-7-klas/", icon: School },
];
