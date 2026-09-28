import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { getRoleBySlug, getAllRoleSlugs } from "@/lib/careers";
import { ApplicationFormClient } from "./client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllRoleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const role = getRoleBySlug(slug);

  if (!role) {
    return { title: "Role Not Found | Careers | Craefto" };
  }

  return {
    title: { absolute: `Apply: ${role.title} | Careers | Craefto` },
    description: `Apply for the ${role.title} position at Craefto.`,
    alternates: { canonical: `/careers/${role.slug}/apply` },
    robots: { index: false, follow: false },
  };
}

export default async function ApplyPage({ params }: PageProps) {
  const { slug } = await params;
  const role = getRoleBySlug(slug);

  if (!role) {
    notFound();
  }

  return (
    <>
      <Header />
      <ApplicationFormClient role={role} />
      <Footer />
    </>
  );
}
