import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { getRoleBySlug, getAllRoleSlugs } from "@/lib/careers";
import { RolePageClient } from "./client";

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
    return {
      title: "Role Not Found | Careers | Craefto",
    };
  }

  return {
    title: { absolute: `${role.title} | Careers | Craefto` },
    description: role.description,
    openGraph: {
      title: `${role.title} | Careers | Craefto`,
      description: role.description,
      type: "website",
      url: `https://www.craefto.com/careers/${role.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${role.title} | Careers | Craefto`,
      description: role.description,
    },
    alternates: {
      canonical: `https://www.craefto.com/careers/${role.slug}`,
    },
  };
}

export default async function RolePage({ params }: PageProps) {
  const { slug } = await params;
  const role = getRoleBySlug(slug);

  if (!role) {
    notFound();
  }

  const applyHref = `/careers/${role.slug}/apply`;

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: role.title,
    description: role.description,
    datePosted: role.postedDate,
    employmentType: role.type.includes("Contract")
      ? "CONTRACTOR"
      : "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: "Craefto Works",
      sameAs: "https://www.craefto.com",
      logo: "https://www.craefto.com/logo.png",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: role.location === "Remote" ? "Sydney" : role.location,
        addressCountry: "AU",
      },
    },
    jobLocationType: role.location === "Remote" ? "TELECOMMUTE" : undefined,
    applicantLocationRequirements: role.location === "Remote"
      ? {
          "@type": "Country",
          name: "Australia",
        }
      : undefined,
    industry: "Technology",
    occupationalCategory: role.department,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <RolePageClient role={role} applyHref={applyHref} />
      <Footer />
    </>
  );
}
