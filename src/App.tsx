import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CmsProvider, useCms } from "./cms/store";
import { navigate, useRoute } from "./lib/router";
import { Cursor, FloatingActions, Loader, ScrollProgress } from "./components/Chrome";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { QuoteBuilder } from "./components/QuoteBuilder";
import { AdminApp } from "./admin/Admin";
import {
  AboutPage,
  CateringPage,
  CelebrationDetailPage,
  CelebrationsPage,
  ContactPage,
  EventDetailPage,
  EventsPage,
  GalleryPage,
  HomePage,
  MenusPage,
  NotFoundPage,
  PlanEventPage,
} from "./pages/Pages";

const PAGE_META: Record<string, { title: string; desc: string }> = {
  "/": {
    title: "Royal Celebration | Premium Catering & Celebration Experiences",
    desc: "Every celebration deserves a royal feast. Thoughtfully curated cuisine, elegant presentation and warm hospitality for unforgettable celebrations.",
  },
  "/about": { title: "Our Story | Royal Celebration", desc: "Serving celebrations with a royal touch — exceptional taste, elegant presentation and warm hospitality." },
  "/celebrations": { title: "Celebrations We Serve | Royal Celebration", desc: "Weddings, engagements, receptions, traditional functions, corporate and private celebrations." },
  "/catering": { title: "Premium Catering | Royal Celebration", desc: "Food that becomes part of the memory — curated menus, live counters and complete guest experiences." },
  "/menus": { title: "Explore Our Feast | Royal Celebration", desc: "Traditional, wedding, live counter, starter, main course, dessert and custom menu experiences." },
  "/gallery": { title: "Food Gallery | Royal Celebration", desc: "Food, live counters, buffet setups and celebration moments captured by Royal Celebration." },
  "/events": { title: "Featured Celebrations | Royal Celebration", desc: "Celebrations we've had the honour to serve — weddings, corporate events and traditional functions." },
  "/contact": { title: "Contact | Royal Celebration", desc: "Let's make your celebration royal. Call, WhatsApp or send us an enquiry." },
  "/plan-event": { title: "Plan Your Celebration | Royal Celebration", desc: "Build your custom catering quote in five short steps." },
};

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function Site() {
  const route = useRoute();
  const reduce = useReducedMotion();
  const { data } = useCms();
  const [loading, setLoading] = useState(() => {
    try {
      return sessionStorage.getItem("rc-loaded") !== "1";
    } catch {
      return true;
    }
  });
  const [quoteOpen, setQuoteOpen] = useState(false);

  const isAdmin = route.startsWith("/admin");

  const openQuote = useCallback(() => {
    if (window.location.hash.startsWith("#/plan-event")) {
      window.scrollTo({ top: window.innerHeight * 0.6, behavior: "smooth" });
      return;
    }
    setQuoteOpen(true);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  useEffect(() => {
    const base = PAGE_META[route] ?? {
      title: `${data.settings.brandName} | Premium Catering & Celebration Experiences`,
      desc: data.settings.metaDescription,
    };
    const title = route === "/" && data.settings.metaTitle ? data.settings.metaTitle : base.title;
    document.title = isAdmin ? "Admin | Royal Celebration" : title;
    setMeta("description", base.desc);
    setMeta("og:title", title, "property");
    setMeta("og:description", base.desc, "property");
    setMeta("twitter:title", title);
    setMeta("twitter:description", base.desc);
    setMeta("robots", isAdmin ? "noindex, nofollow" : "index, follow, max-image-preview:large");
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}${window.location.pathname}#${route}`;
  }, [route, isAdmin, data.settings]);

  if (isAdmin) return <AdminApp />;

  const celebrationSlug = route.startsWith("/celebrations/") ? route.split("/")[2] : null;
  const eventSlug = route.startsWith("/events/") ? route.split("/")[2] : null;

  const page =
    route === "/" ? <HomePage onPlan={openQuote} /> :
    route === "/about" ? <AboutPage /> :
    route === "/celebrations" ? <CelebrationsPage /> :
    celebrationSlug ? <CelebrationDetailPage slug={celebrationSlug} /> :
    route === "/catering" ? <CateringPage /> :
    route === "/menus" ? <MenusPage onPlan={openQuote} /> :
    route === "/gallery" ? <GalleryPage /> :
    route === "/events" ? <EventsPage /> :
    eventSlug ? <EventDetailPage slug={eventSlug} /> :
    route === "/contact" ? <ContactPage /> :
    route === "/plan-event" ? <PlanEventPage /> :
    <NotFoundPage />;

  return (
    <>
      {loading && (
        <Loader
          onDone={() => {
            setLoading(false);
            try {
              sessionStorage.setItem("rc-loaded", "1");
            } catch {
              /* ignore */
            }
          }}
        />
      )}

      <Cursor />
      <ScrollProgress />
      <Navbar onPlan={openQuote} />

      <main id="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {page}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer onPlan={openQuote} />
      <FloatingActions onEnquire={() => navigate("/plan-event")} />
      <QuoteBuilder open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <CmsProvider>
      <Site />
    </CmsProvider>
  );
}
