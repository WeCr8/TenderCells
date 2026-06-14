import PageLayout from "../components/PageLayout";
import { resetConsentChoice } from "../utils/consent";

interface TrustPageContent {
  title: string;
  intro: string;
  sections: string[][];
  action?: "cookie-reset";
}

const pages: Record<string, TrustPageContent> = {
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
      "Tender Cells keeps public marketing pages readable without requiring an account. Some third-party services may process basic usage data to operate analytics, advertising, security, hosting, and policy compliance.",
    sections: [
      ["Information we collect", "Public pages may collect analytics events such as page views, clicks, read depth, device/browser information, approximate location from IP address, and referring pages. Contact forms or email links collect the information you choose to send."],
      ["How we use information", "We use data to improve educational content, product documentation, site reliability, security, and outreach. We do not sell personal information."],
      ["Google services", "The site uses or may use Google Analytics, Google Tag Manager, Google Ads, Google AdSense, and related Google services. When these services are active, your browser may send Google the page URL, IP address, device/browser details, and cookie or consent signals. Google explains this processing at https://policies.google.com/technologies/partner-sites."],
      ["Advertising cookies", "Third-party vendors, including Google, may use cookies to serve ads based on prior visits to TenderCells or other websites. Google's advertising cookies enable Google and its partners to serve ads based on visits to this site and other sites on the Internet."],
      ["Your choices", "You can accept or reject optional analytics and advertising storage in the TenderCells cookie banner. You can also use Google Ads Settings at https://adssettings.google.com, the Google Analytics opt-out add-on, browser cookie controls, and industry opt-out tools such as https://www.aboutads.info."],
      ["Children and students", "Tender Cells creates educational content for students, but public marketing pages are not designed to collect personal information from children. Students should use the project with a parent, guardian, teacher, or mentor."],
      ["Data retention", "Analytics, advertising, hosting, and security providers may retain logs or aggregated measurement data according to their own policies. TenderCells keeps direct contact messages only as long as needed to respond, support the relationship, or meet legal/security obligations."],
      ["Contact", "Questions about privacy can be sent to hello@wecr8.info. Security reports should follow SECURITY.md in the GitHub repository."],
    ],
  },
  cookies: {
    title: "Cookie Policy",
    intro:
      "This page explains how TenderCells uses cookies, local storage, Google tags, and advertising technology on the public website.",
    sections: [
      ["Necessary storage", "The site may use local storage or cookies for essential preferences, security, routing, demo behavior, and remembering your cookie choice. These are used to make the site work and to avoid asking the same question repeatedly."],
      ["Analytics storage", "If accepted, Google Analytics and Google Tag Manager may use cookies or similar identifiers to measure page views, clicks, read depth, referrers, device/browser information, and other aggregate site performance signals."],
      ["Advertising storage", "If accepted, Google AdSense, Google Ads, and related vendors may use cookies or similar technologies for ad delivery, frequency capping, fraud prevention, ad measurement, and, where allowed, personalized advertising."],
      ["Google advertising disclosure", "Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to TenderCells or other websites. Google's use of advertising cookies enables Google and its partners to serve ads based on visits to this site and other sites on the Internet."],
      ["EEA, UK, and Switzerland", "For users in the European Economic Area, the United Kingdom, and Switzerland, Google requires legally valid consent for cookies or local storage where required and for collection, sharing, and use of personal data for ads personalization. Before serving personalized ads to those regions at scale, TenderCells should use a Google-certified Consent Management Platform integrated with the IAB Transparency and Consent Framework."],
      ["Change your choice", "Use the button below to reopen the cookie banner and change your optional analytics and advertising storage choice. You can also clear or block cookies in your browser."],
    ],
    action: "cookie-reset",
  },
  advertising: {
    title: "Advertising Disclosure",
    intro:
      "TenderCells may use advertising and affiliate-style measurement to support open-source education, documentation, demos, and community resources.",
    sections: [
      ["Advertising partners", "TenderCells may use Google AdSense, Google Ads, Google Tag Manager, Google Analytics, and other ad technology vendors or ad networks. These partners may use cookies or similar identifiers as described in the Privacy Policy and Cookie Policy."],
      ["Personalized and non-personalized ads", "Ads may be contextual or personalized depending on user choice, region, platform settings, and Google policy requirements. Users can opt out of personalized advertising through Google Ads Settings at https://adssettings.google.com."],
      ["Editorial independence", "Educational pages, product concept pages, documentation, and safety guidance should not be written merely to force ad clicks. Advertising, sponsorship, or promotional material should not be disguised as editorial content or navigation."],
      ["Invalid traffic", "Do not click ads to support TenderCells, test ad revenue, or manipulate performance. Invalid clicks and automated traffic can violate Google policies and harm the project."],
      ["Families and students", "TenderCells is student-friendly, but advertising choices and account decisions should be handled by parents, guardians, teachers, or adult mentors when young users are involved."],
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
        {page.action === "cookie-reset" ? (
          <button type="button" className="btn-primary" onClick={resetConsentChoice}>
            Change Cookie Choice
          </button>
        ) : null}
      </div>
    </PageLayout>
  );
}
