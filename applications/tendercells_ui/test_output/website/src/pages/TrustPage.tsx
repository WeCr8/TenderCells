import PageLayout from "../components/PageLayout";

const pages = {
  about: {
    title: "About Tender Cells",
    intro:
      "Tender Cells is an open-source agricultural engineering project from WeCr8 Solutions. The mission is to help families, students, homesteaders, makers, and young engineers build safer, clearer, more repairable animal-care systems.",
    sections: [
      ["What we build", "We publish product concepts, public demos, developer documentation, hardware catalogs, firmware direction, and education paths for smart animal care."],
      ["Who it serves", "The project is designed for backyard animal keepers, 4-H members, FFA students, homeschool families, classrooms, robotics clubs, and open-source contributors."],
      ["How we work", "Tender Cells favors local-first control, open documentation, repairable hardware, honest product status, and student-friendly contribution paths."],
    ],
  },
  contact: {
    title: "Contact Tender Cells",
    intro:
      "Use this page to reach the Tender Cells team for education, open-source, partnership, support, media, and product questions.",
    sections: [
      ["General contact", "Email: hello@wecr8.info"],
      ["Education and student projects", "Email: education@wecr8.info"],
      ["Support", "Email: support@wecr8.info or open a GitHub issue for public bug reports and documentation fixes."],
      ["Open-source community", "GitHub: https://github.com/WeCr8/TenderCells"],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro:
      "Tender Cells keeps public marketing pages readable without requiring an account. Some third-party services may process basic usage data to operate analytics, advertising, security, and hosting.",
    sections: [
      ["Information we collect", "Public pages may collect analytics events such as page views, clicks, read depth, device/browser information, and referring pages. Contact forms or email links collect the information you choose to send."],
      ["How we use information", "We use data to improve educational content, product documentation, site reliability, security, and outreach. We do not sell personal information."],
      ["Advertising and analytics", "The site may use Google Analytics, Google Tag Manager, Google AdSense, and related Google services. These services may use cookies or similar technologies for measurement and advertising."],
      ["Children and students", "Tender Cells creates educational content for students, but public marketing pages are not designed to collect personal information from children. Students should use the project with a parent, guardian, teacher, or mentor."],
      ["Contact", "Questions about privacy can be sent to hello@wecr8.info."],
    ],
  },
  terms: {
    title: "Terms of Use",
    intro:
      "These terms describe basic use of the Tender Cells public website, educational materials, demo, and open-source resources.",
    sections: [
      ["Educational information", "Content is provided for learning, planning, and project exploration. Animal-care decisions should be reviewed with qualified local experts when safety or health is involved."],
      ["Product concepts", "Some pages describe concepts, prototypes, demos, or planned features. Product availability, specifications, and pricing may change."],
      ["Open-source materials", "Repository code and documentation are governed by the licenses included in the GitHub repository."],
      ["Safe building", "Builders are responsible for safe wiring, power, enclosures, supervision, animal welfare, and compliance with local laws."],
      ["Contact", "Questions about these terms can be sent to hello@wecr8.info."],
    ],
  },
  editorial: {
    title: "Editorial Policy",
    intro:
      "Tender Cells publishes original educational and technical content to help people understand smart animal care, agricultural robotics, and open-source farming systems.",
    sections: [
      ["Originality", "Pages should add practical value through explanations, build paths, project ideas, product context, safety notes, and links to source documentation."],
      ["Accuracy", "Technical claims should be tied to known product concepts, public demos, repository docs, or clearly labeled future plans."],
      ["Safety", "Animal welfare, electrical safety, student supervision, and realistic project scope should be prioritized over hype."],
      ["Advertising separation", "Advertising, sponsorship, and promotional material should not be disguised as navigation or editorial content."],
      ["Updates", "Pages are reviewed as product concepts, docs, policies, and platform requirements change."],
    ],
  },
};

interface TrustPageProps {
  kind: keyof typeof pages;
}

export default function TrustPage({ kind }: TrustPageProps) {
  const page = pages[kind];

  return (
    <PageLayout>
      <div className="page-hero dark">
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
      </div>

      <div className="prose">
        {page.sections.map(([title, body]) => (
          <section key={title} style={{ marginBottom: "1.5rem" }}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>
    </PageLayout>
  );
}
