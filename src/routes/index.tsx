import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import InstagramOrganizado from "@/components/InstagramOrganizado.jsx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Instagram Organizado — Módulo 1: perfil profissional" },
      {
        name: "description",
        content:
          "Passo a passo guiado para organizar o perfil do seu Instagram: nome e @, foto, bio, link, WhatsApp e destaques.",
      },
      {
        property: "og:title",
        content: "Instagram Organizado — Módulo 1: perfil profissional",
      },
      {
        property: "og:description",
        content:
          "Organize nome e @, foto, bio, link, WhatsApp e destaques do seu Instagram com um passo a passo simples.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  // O app guarda respostas/progresso no dispositivo (localStorage), que não
  // existe no servidor. Renderizar só após montar evita divergência de hidratação.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="min-h-screen w-full bg-neutral-100" />;
  }
  return <InstagramOrganizado />;
}
