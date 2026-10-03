// The team: the one source for the About page's team section and the
// company profile. Photos live in public/team (4:5).

export interface TeamMember {
  name: string;
  role: string;
  detail: string;
  image?: string;
  featured?: boolean;
  socials: {
    linkedin?: string;
    twitter?: string;
    dribbble?: string;
  };
}

export const team: TeamMember[] = [
  {
    name: "Obi Batbileg",
    role: "Founder & Design Technologist",
    detail: "Coffee snob. Pixel perfectionist.",
    image: "/team/obi-batbileg.jpg",
    featured: true,
    socials: { linkedin: "https://www.linkedin.com/in/obi-batbileg/" },
  },
  {
    name: "Enkhbold Altangerel",
    role: "Security Engineer, OSCP",
    detail: "Defence minded. Always vigilant.",
    image: "/team/enkhbold.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/enkhbold-altangerel-a7227a1a2/" },
  },
  {
    name: "Sara Chinzorig",
    role: "Creative",
    detail: "Visual thinker. Always exploring.",
    image: "/team/sara.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/sara-chinzorig-8815a6211/" },
  },
  {
    name: "Urna Ganbat",
    role: "Financial Accountant",
    detail: "Numbers driven. Detail oriented.",
    image: "/team/urna-ganbat.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/urna-ganbat/" },
  },
];
